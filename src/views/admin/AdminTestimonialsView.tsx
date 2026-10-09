import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Star,
  CheckCircle2,
  Eye,
  EyeOff,
  ExternalLink,
  Building2,
  Image as ImageIcon,
  Check,
  Globe,
  Settings2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { GoogleReview, GoogleReviewsConfig } from '../../types/googleReviews';
import { firestoreGoogleReviewsService, DEFAULT_GOOGLE_REVIEWS_CONFIG } from '../../services/firestore/googleReviews';
import { firestoreTestimonialsService } from '../../services/firestore/testimonials';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { DivisionId } from '../../types/firestore';
import { DIVISIONS } from '../../config/divisions';

export const AdminTestimonialsView: React.FC = () => {
  const {
    googleReviews,
    googleReviewsConfig,
    updateGoogleReviewsConfig,
    syncGoogleReviews,
    refreshAll,
  } = useFirestoreDataContext();

  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [config, setConfig] = useState<GoogleReviewsConfig>(googleReviewsConfig || DEFAULT_GOOGLE_REVIEWS_CONFIG);
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState<'all' | 'trincomalee' | 'colombo'>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden' | 'featured'>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Settings & Place ID Modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configForm, setConfigForm] = useState<GoogleReviewsConfig>(config);

  // Review Edit/Create Modal
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<GoogleReview | null>(null);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [deletingReview, setDeletingReview] = useState<GoogleReview | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const [formData, setFormData] = useState({
    authorName: '',
    rating: 5,
    text: '',
    relativePublishTimeDescription: 'Recently on Google',
    date: '2026',
    authorPhotoUrl: '',
    authorUrl: '',
    branch: 'trincomalee' as 'trincomalee' | 'colombo',
    divisionId: 'sws' as DivisionId | 'all',
    isFeatured: true,
    isHidden: false,
    source: 'google' as const,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    if (googleReviewsConfig) {
      setConfig(googleReviewsConfig);
      setConfigForm(googleReviewsConfig);
    }
  }, [googleReviewsConfig]);

  useEffect(() => {
    setReviews(googleReviews || []);
  }, [googleReviews]);

  // Filter reviews based on search & options
  const filteredReviews = reviews.filter((r) => {
    // Branch
    if (branchFilter !== 'all' && r.branch && r.branch !== branchFilter) {
      return false;
    }

    // Visibility
    if (visibilityFilter === 'visible' && r.isHidden) return false;
    if (visibilityFilter === 'hidden' && !r.isHidden) return false;
    if (visibilityFilter === 'featured' && !r.isFeatured) return false;

    // Division
    if (divisionFilter !== 'all' && r.divisionId !== 'all' && r.divisionId !== divisionFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAuthor = r.authorName?.toLowerCase().includes(q);
      const matchText = r.text?.toLowerCase().includes(q);
      const matchDiv = r.divisionName?.toLowerCase().includes(q) || r.divisionId?.toLowerCase().includes(q);
      const matchBranch = r.branchName?.toLowerCase().includes(q) || r.branch?.toLowerCase().includes(q);
      if (!matchAuthor && !matchText && !matchDiv && !matchBranch) return false;
    }

    return true;
  });

  // Handle Sync from Google Business Profile
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncGoogleReviews();
      if (res.success) {
        addToast(
          'success',
          'Google Reviews Synchronized',
          `Successfully connected with Google Maps. Updated ${res.count} genuine reviews (Overall Rating: ${res.overallRating}★).`
        );
      } else {
        addToast('error', 'Sync Notice', res.error || 'Could not reach Google Places API. Verified cached reviews remain active.');
      }
    } catch (err: any) {
      addToast('error', 'Sync Failed', err.message || 'An unexpected error occurred during Google sync.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Toggle Featured
  const handleToggleFeature = async (review: GoogleReview) => {
    try {
      const updated = !review.isFeatured;
      await firestoreGoogleReviewsService.toggleFeature(review.id, updated);
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, isFeatured: updated } : r))
      );
      addToast('success', 'Updated Feature Status', `"${review.authorName}" is now ${updated ? 'featured on' : 'removed from'} the landing page.`);
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not update featured status.');
    }
  };

  // Toggle Hidden
  const handleToggleHide = async (review: GoogleReview) => {
    try {
      const updated = !review.isHidden;
      await firestoreGoogleReviewsService.toggleHide(review.id, updated);
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, isHidden: updated } : r))
      );
      addToast(
        'info',
        updated ? 'Review Hidden from Public' : 'Review Visible on Public Site',
        `"${review.authorName}" is ${updated ? 'hidden from public view' : 'now publicly visible'}. Original Google content is preserved.`
      );
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not update visibility.');
    }
  };

  // Assign Division
  const handleAssignDivision = async (review: GoogleReview, divId: DivisionId | 'all') => {
    try {
      const divName = divId === 'all' ? 'All Divisions' : DIVISIONS[divId]?.name || 'Mahdev Group';
      await firestoreGoogleReviewsService.assignDivision(review.id, divId, divName);
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, divisionId: divId, divisionName: divName } : r))
      );
      addToast('success', 'Division Linked', `Review assigned to ${divName}.`);
    } catch (err: any) {
      addToast('error', 'Assignment Failed', err.message || 'Could not assign division.');
    }
  };

  // Save Settings Config
  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      await updateGoogleReviewsConfig(configForm);
      setConfig(configForm);
      setIsConfigModalOpen(false);
      addToast('success', 'Configuration Saved', 'Google Business Profile integration settings have been updated.');
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not save Google reviews configuration.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Open Create Review Modal
  const handleOpenCreate = () => {
    setEditingReview(null);
    setFormData({
      authorName: '',
      rating: 5,
      text: '',
      relativePublishTimeDescription: 'Verified Google Review',
      date: new Date().getFullYear().toString(),
      authorPhotoUrl: '',
      authorUrl: '',
      branch: 'trincomalee',
      divisionId: 'sws',
      isFeatured: true,
      isHidden: false,
      source: 'google',
    });
    setFormErrors({});
    setIsEditorOpen(true);
  };

  // Open Edit Review Modal
  const handleOpenEdit = (review: GoogleReview) => {
    setEditingReview(review);
    setFormData({
      authorName: review.authorName,
      rating: review.rating || 5,
      text: review.text || '',
      relativePublishTimeDescription: review.relativePublishTimeDescription || 'Verified Review',
      date: review.date || '2026',
      authorPhotoUrl: review.authorPhotoUrl || '',
      authorUrl: review.authorUrl || '',
      branch: (review.branch as any) || 'trincomalee',
      divisionId: (review.divisionId as any) || 'sws',
      isFeatured: review.isFeatured,
      isHidden: review.isHidden,
      source: 'google',
    });
    setFormErrors({});
    setIsEditorOpen(true);
  };

  // Save Review (Create / Edit)
  const handleSaveReview = async () => {
    const errors: Record<string, string> = {};
    if (!formData.authorName.trim()) errors.authorName = 'Customer name is required';
    if (!formData.text.trim()) errors.text = 'Review text is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSavingReview(true);
    try {
      const divName = formData.divisionId === 'all' ? 'All Divisions' : DIVISIONS[formData.divisionId]?.name || 'Mahdev Group';
      const reviewId = editingReview?.id || `gr-${Date.now()}`;
      const branchName = formData.branch === 'colombo' ? 'Colombo Branch' : 'Trincomalee Branch';

      const payload: Partial<GoogleReview> = {
        id: reviewId,
        authorName: formData.authorName,
        rating: Number(formData.rating),
        text: formData.text,
        relativePublishTimeDescription: formData.relativePublishTimeDescription,
        date: formData.date,
        authorPhotoUrl: formData.authorPhotoUrl,
        authorUrl: formData.authorUrl || (formData.branch === 'colombo' ? config.colomboMapsUrl || 'https://share.google/VjJA6IPKLSMaA9AgR' : config.trincomaleeMapsUrl || 'https://share.google/MTi1hJxhhXtx6OXrd'),
        branch: formData.branch,
        branchName: branchName,
        divisionId: formData.divisionId,
        divisionName: divName,
        isFeatured: formData.isFeatured,
        isHidden: formData.isHidden,
        source: 'google',
        sourceBadge: 'Google Verified Review',
      };

      await firestoreGoogleReviewsService.saveReview(reviewId, payload);
      setIsEditorOpen(false);
      addToast('success', editingReview ? 'Review Updated' : 'Review Added', `Google review from "${formData.authorName}" (${branchName}) saved.`);
      if (typeof refreshAll === 'function') {
        refreshAll(true).catch((rErr) => console.warn('[AdminTestimonialsView] refresh notice:', rErr));
      }
    } catch (err: any) {
      addToast('error', 'Operation Failed', err.message || 'Could not save review.');
    } finally {
      setIsSavingReview(false);
    }
  };

  // Delete Review
  const handleDeleteReview = async () => {
    if (!deletingReview) return;
    try {
      await firestoreTestimonialsService.deleteTestimonial(deletingReview.id);
      setReviews((prev) => prev.filter((r) => r.id !== deletingReview.id));
      setDeletingReview(null);
      addToast('success', 'Review Deleted', `Review from "${deletingReview.authorName}" deleted from Firestore cache.`);
    } catch (err: any) {
      addToast('error', 'Deletion Error', err.message || 'Could not delete review.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Container */}
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header & Integration Hero Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
                  Google Reviews & Verified Testimonials
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Official Integration
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Connect Mahdev's Google Maps / Google Business Profile to display authentic customer reviews with full curation controls.
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium">Google Rating:</span>
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {config.overallRating.toFixed(1)} / 5.0
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium">Total Reviews:</span>
                <span className="font-bold text-slate-800">{config.totalReviews} verified</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium">Public Status:</span>
                <span className={`font-bold flex items-center gap-1 ${config.enabled ? 'text-emerald-700' : 'text-slate-500'}`}>
                  <span className={`w-2 h-2 rounded-full ${config.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  {config.enabled ? 'Visible on Website' : 'Hidden from Website'}
                </span>
              </div>

              {config.lastSyncedAt && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  Last synced: {new Date(config.lastSyncedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfigModalOpen(true)}
              leftIcon={<Settings2 className="w-4 h-4" />}
              className="text-xs font-bold"
            >
              Configure Google Place
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              isLoading={isSyncing}
              leftIcon={<RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />}
              className="text-xs font-bold"
            >
              Sync Reviews
            </Button>

            <Button
              variant="electric"
              size="sm"
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-4 h-4" />}
              className="text-xs font-bold"
            >
              Add Verified Review
            </Button>
          </div>
        </div>

        {/* Deep Link Quick Access Strip */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-semibold text-slate-800">{config.businessName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href={config.trincomaleeMapsUrl || 'https://share.google/MTi1hJxhhXtx6OXrd'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200/60"
            >
              📍 Trincomalee Branch Reviews <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={config.colomboMapsUrl || 'https://share.google/VjJA6IPKLSMaA9AgR'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-200/60"
            >
              📍 Colombo Branch Reviews <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reviews by customer name, comments, division, branch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Branch:</span>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none"
            >
              <option value="all">All Branches</option>
              <option value="trincomalee">Trincomalee Branch</option>
              <option value="colombo">Colombo Branch</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Filter View:</span>
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none"
            >
              <option value="all">All Cached Reviews ({reviews.length})</option>
              <option value="visible">Publicly Visible Only</option>
              <option value="featured">⭐ Featured on Homepage</option>
              <option value="hidden">👁️ Hidden from Website</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Division:</span>
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none"
            >
              <option value="all">All Divisions</option>
              {Object.values(DIVISIONS).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.shortName})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reviews Grid */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Google Reviews Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || divisionFilter !== 'all' || visibilityFilter !== 'all'
              ? 'No reviews match your active filter criteria. Try resetting search filters.'
              : 'Click "Sync Reviews" above to fetch genuine customer reviews from your Google Business Profile, or add a verified review record.'}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Button variant="outline" size="sm" onClick={handleSync} className="text-xs font-bold">
              Sync from Google Maps
            </Button>
            <Button variant="electric" size="sm" onClick={handleOpenCreate} className="text-xs font-bold">
              Add Verified Review
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReviews.map((review) => {
            const division = review.divisionId && review.divisionId !== 'all' ? DIVISIONS[review.divisionId] : null;

            return (
              <div
                key={review.id}
                className={`bg-white rounded-2xl border p-5 shadow-2xs flex flex-col justify-between transition-all duration-200 ${
                  review.isHidden
                    ? 'border-amber-200/80 bg-amber-50/20 opacity-80'
                    : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div>
                  {/* Top Provenance & Verified Badge Strip */}
                  <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span className="text-[11px] font-bold text-slate-700">Google Verified</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {review.isFeatured && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-blue-600 text-blue-600" /> Featured
                        </span>
                      )}
                      {review.isHidden && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          Hidden
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs overflow-hidden shrink-0">
                      {review.authorPhotoUrl ? (
                        <img
                          src={review.authorPhotoUrl}
                          alt={review.authorName}
                          className="w-full h-full object-cover"
                          
                        />
                      ) : (
                        <span>{review.authorName.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-display text-sm font-bold text-slate-900 truncate">
                          {review.authorName}
                        </h4>
                        <span title="Verified Customer">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                          review.branch === 'colombo'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {review.branch === 'colombo' ? 'Colombo Branch' : 'Trincomalee Branch'}
                        </span>
                        <p className="text-[11px] text-slate-500 truncate">
                          {review.relativePublishTimeDescription || review.date || 'Google Review'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 text-amber-500 mb-2.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < (review.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-mono font-bold text-slate-700 ml-1">
                      {review.rating.toFixed(1)}
                    </span>
                  </div>

                  {/* Original Google Review Text */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-4 italic mb-4">
                    "{review.text}"
                  </p>
                </div>

                {/* Card Footer & Curation Controls */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  {/* Division Linkage Selector */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[11px] font-semibold text-slate-500">Division:</span>
                    <select
                      value={review.divisionId || 'all'}
                      onChange={(e) => handleAssignDivision(review, e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-700 focus:bg-white focus:outline-none"
                    >
                      <option value="all">All Divisions</option>
                      {Object.values(DIVISIONS).map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.shortName} ({d.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Curation Buttons */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {/* Toggle Featured */}
                      <button
                        type="button"
                        onClick={() => handleToggleFeature(review)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                          review.isFeatured
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                        title={review.isFeatured ? 'Remove from Featured' : 'Feature on Landing Page'}
                      >
                        <Star className={`w-3.5 h-3.5 ${review.isFeatured ? 'fill-blue-600' : ''}`} />
                        <span className="text-[10px]">{review.isFeatured ? 'Featured' : 'Feature'}</span>
                      </button>

                      {/* Toggle Hidden */}
                      <button
                        type="button"
                        onClick={() => handleToggleHide(review)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                          review.isHidden
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                        title={review.isHidden ? 'Show on Public Site' : 'Hide from Public Site'}
                      >
                        {review.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span className="text-[10px]">{review.isHidden ? 'Unhide' : 'Hide'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(review)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                        title="Edit Review"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingReview(review)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                        title="Delete from Cache"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Google Place ID & Display Configuration Modal */}
      <AdminModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Google Business Profile & Display Settings"
        subtitle="Manage Google Maps Place ID, deep links, and website presentation rules."
        maxWidth="max-w-2xl"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsConfigModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="electric"
              size="sm"
              onClick={handleSaveConfig}
              isLoading={isSavingConfig}
              className="font-bold"
            >
              Save Configuration
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Master Public Toggle */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 text-sm">Enable Google Reviews on Public Website</p>
              <p className="text-slate-500 text-xs">Show Google customer reviews across landing page and testimonials view.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={configForm.enabled}
                onChange={(e) => setConfigForm({ ...configForm, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Google Place ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={configForm.placeId}
                onChange={(e) => setConfigForm({ ...configForm, placeId: e.target.value })}
                placeholder="ChIJ..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-[11px] text-slate-400 mt-1">Official Place ID for Mahdev / SWS on Google Maps.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Google Business Name
              </label>
              <input
                type="text"
                value={configForm.businessName}
                onChange={(e) => setConfigForm({ ...configForm, businessName: e.target.value })}
                placeholder="Mahdev Pvt Ltd / SWS Event Management"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Overall Google Star Rating
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={configForm.overallRating}
                onChange={(e) => setConfigForm({ ...configForm, overallRating: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Total Google Review Count
              </label>
              <input
                type="number"
                min="0"
                value={configForm.totalReviews}
                onChange={(e) => setConfigForm({ ...configForm, totalReviews: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                📍 Trincomalee Branch Google Maps / Profile Link
              </label>
              <input
                type="url"
                value={configForm.trincomaleeMapsUrl || 'https://share.google/MTi1hJxhhXtx6OXrd'}
                onChange={(e) => setConfigForm({ ...configForm, trincomaleeMapsUrl: e.target.value, trincomaleeWriteReviewUrl: e.target.value })}
                placeholder="https://share.google/MTi1hJxhhXtx6OXrd"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                📍 Colombo Branch Google Maps / Profile Link
              </label>
              <input
                type="url"
                value={configForm.colomboMapsUrl || 'https://share.google/VjJA6IPKLSMaA9AgR'}
                onChange={(e) => setConfigForm({ ...configForm, colomboMapsUrl: e.target.value, colomboWriteReviewUrl: e.target.value })}
                placeholder="https://share.google/VjJA6IPKLSMaA9AgR"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              General Google Maps Listing URL (Primary)
            </label>
            <input
              type="url"
              value={configForm.mapsUrl}
              onChange={(e) => setConfigForm({ ...configForm, mapsUrl: e.target.value })}
              placeholder="https://maps.google.com/?cid=..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Direct "Write a Review" URL
            </label>
            <input
              type="url"
              value={configForm.writeReviewUrl}
              onChange={(e) => setConfigForm({ ...configForm, writeReviewUrl: e.target.value })}
              placeholder="https://search.google.com/local/writereview?placeid=..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Max Reviews on Landing Page
              </label>
              <select
                value={configForm.maxDisplayCount}
                onChange={(e) => setConfigForm({ ...configForm, maxDisplayCount: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
              >
                <option value={3}>3 Reviews</option>
                <option value={6}>6 Reviews (Recommended)</option>
                <option value={9}>9 Reviews</option>
                <option value={12}>12 Reviews</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Minimum Star Rating to Display
              </label>
              <select
                value={configForm.minStarRating}
                onChange={(e) => setConfigForm({ ...configForm, minStarRating: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
              >
                <option value={4}>4 Stars and Above (⭐⭐⭐⭐+)</option>
                <option value={5}>5 Stars Only (⭐⭐⭐⭐⭐)</option>
                <option value={1}>All Stars (1 - 5)</option>
              </select>
            </div>
          </div>
        </div>
      </AdminModal>

      {/* Review Editor Modal (Create / Edit) */}
      <AdminModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingReview ? 'Edit Google Review Record' : 'Add Verified Google Review'}
        subtitle="Manage verified customer attribution, rating, original text, and divisional routing."
        maxWidth="max-w-xl"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsEditorOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="electric"
              size="sm"
              onClick={handleSaveReview}
              isLoading={isSavingReview}
              className="font-bold"
            >
              {editingReview ? 'Save Changes' : 'Add Verified Review'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Customer Name (from Google) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.authorName}
                onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                placeholder="e.g. Ruwan Senanayake"
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:outline-none ${
                  formErrors.authorName ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {formErrors.authorName && <p className="text-[11px] text-red-500 mt-1">{formErrors.authorName}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Branch Location
              </label>
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value as any })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
              >
                <option value="trincomalee">📍 Trincomalee Branch</option>
                <option value="colombo">📍 Colombo Branch</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Operating Division Linkage
              </label>
              <select
                value={formData.divisionId}
                onChange={(e) => setFormData({ ...formData, divisionId: e.target.value as any })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
              >
                <option value="all">All Divisions</option>
                {Object.values(DIVISIONS).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.shortName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Review Comments (Original Text) <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              placeholder="Enter genuine customer review text..."
              className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:outline-none ${
                formErrors.text ? 'border-red-500' : 'border-slate-200'
              }`}
            />
            {formErrors.text && <p className="text-[11px] text-red-500 mt-1">{formErrors.text}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Star Rating
              </label>
              <select
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
              >
                <option value={5}>5.0 Stars (⭐⭐⭐⭐⭐)</option>
                <option value={4}>4.0 Stars (⭐⭐⭐⭐)</option>
                <option value={3}>3.0 Stars (⭐⭐⭐)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Relative Date / Description
              </label>
              <input
                type="text"
                value={formData.relativePublishTimeDescription}
                onChange={(e) => setFormData({ ...formData, relativePublishTimeDescription: e.target.value })}
                placeholder="e.g. 2 weeks ago / 2026"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Google Profile Photo URL (Optional)
              </label>
              <button
                type="button"
                onClick={() => setIsMediaPickerOpen(true)}
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                <ImageIcon className="w-3.5 h-3.5" /> Media Library
              </button>
            </div>
            <input
              type="url"
              value={formData.authorPhotoUrl}
              onChange={(e) => setFormData({ ...formData, authorPhotoUrl: e.target.value })}
              placeholder="https://lh3.googleusercontent.com/..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-6 pt-3 border-t border-slate-100">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-2.5 text-xs font-bold text-slate-800">Feature on Landing Page</span>
            </label>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isHidden}
                onChange={(e) => setFormData({ ...formData, isHidden: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              <span className="ml-2.5 text-xs font-bold text-slate-800">Hide from Public Website</span>
            </label>
          </div>
        </div>
      </AdminModal>

      {/* Media Picker */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(url) => {
          setFormData({ ...formData, authorPhotoUrl: url });
          setIsMediaPickerOpen(false);
        }}
        initialCategory="cinema"
      />

      {/* Confirm Delete Dialog */}
      <AdminConfirmDialog
        isOpen={!!deletingReview}
        onClose={() => setDeletingReview(null)}
        title="Delete Review Cache?"
        message={`Delete cached Google review from "${deletingReview?.authorName}"? You can re-sync it from Google Maps at any time.`}
        confirmText="Delete Review"
        isDangerous
        onConfirm={handleDeleteReview}
      />
    </div>
  );
};
