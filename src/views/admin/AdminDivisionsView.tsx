import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Eye,
  Layers,
  Image as ImageIcon,
  Globe,
  Tag,
  FileCode,
  ArrowUp,
  ArrowDown,
  ListOrdered,
  Crown,
  Clock,
  Upload,
  Video,
} from 'lucide-react';
import { CmsDivision } from '../../types/cms';
import { cmsService } from '../../services/cmsService';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { getYouTubeEmbedUrl, extractYouTubeId } from '../../utils/youtube';
import { DivisionId } from '../../types';
import { getRentalAssetCount } from '../../utils/assetMetrics';
import { compressDataUrl } from '../../utils/imageOptimizer';
import { uploadMediaAsset } from '../../services/mediaUploadService';
import { resolveMediaUrl } from '../../services/firestoreMediaService';
import { normalizeDivisionId } from '../../services/firestore/divisions';

export const AdminDivisionsView: React.FC = () => {
  const { saveDivision, refreshAll, divisions: firestoreDivisions, companySettings, products } = useFirestoreDataContext();
  const [divisions, setDivisions] = useState<CmsDivision[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'coming_soon' | 'deleted'>('all');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState<CmsDivision | null>(null);
  const [modalTab, setModalTab] = useState<'general' | 'hero' | 'narrative' | 'seo' | 'comingSoon'>('general');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingVideoOnly, setIsSavingVideoOnly] = useState(false);
  const [videoSaveSuccessMessage, setVideoSaveSuccessMessage] = useState<string | null>(null);
  const [resolvedHeroVideo, setResolvedHeroVideo] = useState('');

  // Media Picker
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'logo' | 'hero' | 'heroVideo' | 'ogImage'>('hero');

  // Confirm Delete State
  const [deletingDivision, setDeletingDivision] = useState<CmsDivision | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    divisionKey: DivisionId | string;
    name: string;
    shortName: string;
    tagline: string;
    description: string;
    badge: string;
    route: string;
    logoUrl: string;
    accentColor: string;
    gradient: string;
    heroHeadline: string;
    heroSubheadline: string;
    heroImageUrl: string;
    heroVideoUrl: string;
    heroMediaType: 'image' | 'video';
    contactEmail: string;
    contactPhone: string;
    aboutHeading: string;
    aboutText: string;
    mission: string;
    vision: string;
    stats: { label: string; value: string; subtext?: string }[];
    iconName: string;
    isActive: boolean;
    order: number;
    isComingSoon: boolean;
    comingSoonTitle: string;
    comingSoonMessage: string;
    comingSoonExpectedLaunch: string;
    rentalAssetCount: string;
    seo: {
      metaTitle: string;
      metaDescription: string;
      ogImage: string;
      canonicalUrl: string;
    };
  }>({
    divisionKey: 'sws',
    name: '',
    shortName: '',
    tagline: '',
    description: '',
    badge: '',
    route: '',
    logoUrl: '',
    accentColor: '#0052FF',
    gradient: 'from-blue-600 to-indigo-700',
    heroHeadline: '',
    heroSubheadline: '',
    heroImageUrl: '',
    heroVideoUrl: '',
    heroMediaType: 'image' as 'image' | 'video',
    contactEmail: '',
    contactPhone: '075 092 8078',
    aboutHeading: '',
    aboutText: '',
    mission: '',
    vision: '',
    stats: [
      { label: 'Active Projects', value: '100+' },
      { label: 'Client Satisfaction', value: '99%' },
      { label: 'Service Coverage', value: 'Island-wide' },
    ],
    iconName: 'Sparkles',
    isActive: true,
    order: 1,
    isComingSoon: false,
    comingSoonTitle: '',
    comingSoonMessage: '',
    comingSoonExpectedLaunch: '',
    rentalAssetCount: '',
    seo: {
      metaTitle: '',
      metaDescription: '',
      ogImage: '',
      canonicalUrl: '',
    },
  });

  // Resolve preview video URL safely for local, external, YouTube, or firestore storage
  useEffect(() => {
    let active = true;
    if (formData.heroVideoUrl && formData.heroVideoUrl.trim() !== '') {
      resolveMediaUrl(formData.heroVideoUrl)
        .then((url) => {
          if (active) {
            setResolvedHeroVideo(url || formData.heroVideoUrl);
          }
        })
        .catch(() => {
          if (active) setResolvedHeroVideo(formData.heroVideoUrl);
        });
    } else {
      setResolvedHeroVideo('');
    }
    return () => {
      active = false;
    };
  }, [formData.heroVideoUrl]);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadDivisions = () => {
    const rawStatus = statusFilter === 'coming_soon' ? 'all' : statusFilter;
    const data = cmsService.getAll<CmsDivision>('divisions', {
      search: searchQuery,
      status: rawStatus,
      includeDeleted: statusFilter === 'deleted' || statusFilter === 'all',
    });

    const seenDivKeys = new Set(data.map((d) => d.divisionKey || normalizeDivisionId(d.id || '').shortId));
    // If any from firestoreDivisions is missing from data, convert and add it
    for (const fd of (firestoreDivisions || [])) {
      const { shortId } = normalizeDivisionId(fd.id || fd.slug || '');
      if (shortId && !seenDivKeys.has(shortId)) {
        seenDivKeys.add(shortId);
        data.push({
          id: `div-${shortId}`,
          divisionKey: shortId as any,
          name: fd.name,
          shortName: fd.shortName || fd.name,
          order: typeof fd.order === 'number' ? fd.order : 99,
          tagline: fd.tagline || fd.shortDescription || '',
          description: fd.description || '',
          badge: fd.badge || fd.name,
          route: fd.route || `/${shortId}`,
          heroImageUrl: fd.heroImageUrl || fd.imageUrl || '',
          heroVideoUrl: fd.heroVideoUrl || fd.videoUrl || '',
          isComingSoon: !!(fd.isComingSoon || fd.comingSoon),
          comingSoon: !!(fd.isComingSoon || fd.comingSoon),
          status: fd.status as any,
          isActive: fd.status !== 'inactive',
          isDeleted: fd.status === 'inactive',
          createdAt: fd.createdAt || new Date().toISOString(),
          updatedAt: fd.updatedAt || new Date().toISOString(),
        } as any);
      }
    }

    // Merge with latest Firestore state
    const merged = data.map((d) => {
      const canonicalKey =
        d.divisionKey === 'u1'
          ? 'u1-studio'
          : d.divisionKey === 'it'
          ? 'it-solutions'
          : d.divisionKey === 'mart'
          ? 'online-mart'
          : d.divisionKey === 'travels'
          ? 'travels'
          : d.divisionKey === 'sws'
          ? 'sws'
          : d.divisionKey || d.id;

      const fsMatch = firestoreDivisions.find(
        (fd) =>
          fd.id === d.divisionKey ||
          fd.id === canonicalKey ||
          fd.id === d.id ||
          fd.slug === d.divisionKey ||
          fd.slug === canonicalKey ||
          fd.slug === d.id
      );

      if (fsMatch) {
        const isComingSoon = Boolean(
          fsMatch.isComingSoon ||
            fsMatch.comingSoon ||
            fsMatch.status === 'coming_soon'
        );
        const resolvedVideo = fsMatch.heroVideoUrl || fsMatch.videoUrl || fsMatch.hero?.videoUrl || d.heroVideoUrl || '';
        const resolvedImg =
          fsMatch.defaultImageUrl ||
          fsMatch.heroImageUrl ||
          fsMatch.imageUrl ||
          fsMatch.hero?.defaultImageUrl ||
          fsMatch.hero?.imageUrl ||
          fsMatch.hero?.bgImage ||
          d.heroImageUrl ||
          '';

        return {
          ...d,
          name: fsMatch.name || d.name,
          shortName: fsMatch.shortName || d.shortName,
          badge: fsMatch.badge || fsMatch.hero?.badge || d.badge,
          tagline: fsMatch.tagline || fsMatch.hero?.subtitle || d.tagline,
          description: fsMatch.description || d.description,
          heroHeadline: fsMatch.heroHeadline || fsMatch.hero?.title || d.heroHeadline,
          heroSubheadline: fsMatch.heroSubheadline || fsMatch.hero?.subtitle || d.heroSubheadline,
          heroVideoUrl: resolvedVideo,
          videoUrl: resolvedVideo,
          heroImageUrl: resolvedImg,
          defaultImageUrl: resolvedImg,
          heroMediaType: (fsMatch.heroMediaType || fsMatch.hero?.mediaType || d.heroMediaType || (resolvedVideo ? 'video' : 'image')) as any,
          hero: fsMatch.hero || (d as any).hero,
          isComingSoon,
          comingSoon: isComingSoon,
          status: (isComingSoon
            ? 'coming_soon'
            : d.status === 'coming_soon'
            ? d.isActive
              ? 'active'
              : 'inactive'
            : d.status) as CmsDivision['status'],
          comingSoonTitle: (fsMatch as any).comingSoonTitle || d.comingSoonTitle,
          comingSoonMessage: (fsMatch as any).comingSoonMessage || d.comingSoonMessage,
          comingSoonExpectedLaunch: (fsMatch as any).comingSoonExpectedLaunch || d.comingSoonExpectedLaunch,
          order: typeof fsMatch.order === 'number' ? fsMatch.order : d.order,
        };
      }
      return d;
    });

    const filtered = statusFilter === 'coming_soon'
      ? merged.filter((d) => d.isComingSoon || d.comingSoon || d.status === 'coming_soon')
      : merged;

    // Sort ascending by order
    const sorted = [...filtered].sort((a, b) => {
      const ordA = typeof a.order === 'number' ? a.order : 99;
      const ordB = typeof b.order === 'number' ? b.order : 99;
      return ordA - ordB;
    });
    setDivisions(sorted);
  };

  useEffect(() => {
    let isMounted = true;
    const update = () => {
      if (isMounted) {
        loadDivisions();
      }
    };
    update();
    const unsub = cmsService.subscribe('divisions', update);
    return () => {
      isMounted = false;
      unsub();
    };
  }, [searchQuery, statusFilter, firestoreDivisions]);

  const handleOpenCreate = () => {
    setEditingDivision(null);
    setModalTab('general');
    setFormData({
      divisionKey: 'sws',
      name: '',
      shortName: '',
      tagline: '',
      description: '',
      badge: '',
      route: '',
      logoUrl: '',
      accentColor: '#0052FF',
      gradient: 'from-blue-600 to-indigo-700',
      heroHeadline: '',
      heroSubheadline: '',
      heroImageUrl: '',
      heroVideoUrl: '',
      heroMediaType: 'image' as 'image' | 'video',
      contactEmail: companySettings?.email || 'info.mahdev.lk@gmail.com',
      contactPhone: '075 092 8078',
      aboutHeading: '',
      aboutText: '',
      mission: '',
      vision: '',
      stats: [
        { label: 'Active Projects', value: '100+' },
        { label: 'Client Satisfaction', value: '99%' },
        { label: 'Service Coverage', value: 'Island-wide' },
      ],
      iconName: 'Sparkles',
      isActive: true,
      order: divisions.length + 1,
      isComingSoon: false,
      comingSoonTitle: '',
      comingSoonMessage: '',
      comingSoonExpectedLaunch: '',
      rentalAssetCount: '',
      seo: {
        metaTitle: '',
        metaDescription: '',
        ogImage: '',
        canonicalUrl: '',
      },
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (div: CmsDivision) => {
    setEditingDivision(div);
    setModalTab('general');
    setVideoSaveSuccessMessage(null);
    const defaultOrder = div.divisionKey === 'sws' ? 1 : div.divisionKey === 'u1' ? 2 : div.divisionKey === 'it' ? 3 : div.divisionKey === 'travels' ? 4 : 5;
    const canonicalKey = div.divisionKey === 'u1' ? 'u1-studio' : div.divisionKey === 'it' ? 'it-solutions' : div.divisionKey === 'mart' ? 'online-mart' : div.divisionKey;
    const fsMatch = firestoreDivisions.find(
      (d) => d.id === div.divisionKey || d.id === canonicalKey || d.slug === div.divisionKey || d.slug === canonicalKey
    );

    const resolvedVideoUrl = div.heroVideoUrl || (fsMatch as any)?.heroVideoUrl || (fsMatch as any)?.videoUrl || (fsMatch?.hero as any)?.videoUrl || '';
    const resolvedMediaType = (div.heroMediaType || (fsMatch as any)?.heroMediaType || (fsMatch?.hero as any)?.mediaType || (resolvedVideoUrl ? 'video' : 'image')) as 'image' | 'video';
    const resolvedImageUrl =
      (fsMatch as any)?.defaultImageUrl ||
      (fsMatch as any)?.heroImageUrl ||
      (fsMatch as any)?.imageUrl ||
      (fsMatch?.hero as any)?.defaultImageUrl ||
      (fsMatch?.hero as any)?.imageUrl ||
      (fsMatch?.hero as any)?.bgImage ||
      (div as any)?.defaultImageUrl ||
      div.heroImageUrl ||
      (div as any)?.imageUrl ||
      '';

    setFormData({
      divisionKey: div.divisionKey,
      name: div.name,
      shortName: div.shortName,
      tagline: div.tagline,
      description: div.description,
      badge: div.badge,
      route: div.route,
      logoUrl: div.logoUrl || '',
      accentColor: div.accentColor,
      gradient: div.gradient,
      heroHeadline: div.heroHeadline || (fsMatch as any)?.heroHeadline || fsMatch?.hero?.title || '',
      heroSubheadline: div.heroSubheadline || (fsMatch as any)?.heroSubheadline || fsMatch?.hero?.subtitle || '',
      heroImageUrl: resolvedImageUrl,
      heroVideoUrl: resolvedVideoUrl,
      heroMediaType: resolvedMediaType,
      contactEmail: div.contactEmail || (fsMatch as any)?.contactEmail || companySettings?.email || 'info.mahdev.lk@gmail.com',
      contactPhone: (div as any).contactPhone || (div as any).contactNumber || (fsMatch as any)?.contactPhone || (fsMatch as any)?.contactNumber || companySettings?.primaryPhone || '075 092 8078',
      aboutHeading: (div as any).aboutHeading || (fsMatch as any)?.aboutHeading || '',
      aboutText: (div as any).aboutText || (fsMatch as any)?.aboutText || div.description || '',
      mission: (div as any).mission || (fsMatch as any)?.mission || '',
      vision: (div as any).vision || (fsMatch as any)?.vision || '',
      stats: (div as any).stats?.length
        ? (div as any).stats
        : (fsMatch as any)?.stats?.length
        ? (fsMatch as any).stats
        : [
            { label: 'Active Projects', value: '100+' },
            { label: 'Client Satisfaction', value: '99%' },
            { label: 'Service Coverage', value: 'Island-wide' },
          ],
      iconName: div.iconName,
      isActive: div.isActive,
      order: typeof div.order === 'number' && div.order > 0 ? div.order : defaultOrder,
      isComingSoon: !!(div.isComingSoon || div.comingSoon || div.status === 'coming_soon' || (fsMatch as any)?.isComingSoon || (fsMatch as any)?.comingSoon),
      comingSoonTitle: (div as any).comingSoonTitle || (fsMatch as any)?.comingSoonTitle || '',
      comingSoonMessage: (div as any).comingSoonMessage || (fsMatch as any)?.comingSoonMessage || '',
      comingSoonExpectedLaunch: (div as any).comingSoonExpectedLaunch || (fsMatch as any)?.comingSoonExpectedLaunch || '',
      rentalAssetCount: (div as any).rentalAssetCount || (fsMatch as any)?.rentalAssetCount || '',
      seo: {
        metaTitle: div.seo?.metaTitle || `${div.name} | Mahdev Group`,
        metaDescription: div.seo?.metaDescription || div.description,
        ogImage: div.seo?.ogImage || div.heroImageUrl || '',
        canonicalUrl: div.seo?.canonicalUrl || `https://mahdev.lk${div.route}`,
      },
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Division Name is required';
    if (!formData.shortName.trim()) errors.shortName = 'Short Name is required';
    if (!formData.tagline.trim()) errors.tagline = 'Tagline is required';
    if (!formData.route.trim()) errors.route = 'Public URL Route is required';
    if (!formData.contactEmail.trim() || !formData.contactEmail.includes('@')) {
      errors.contactEmail = 'A valid contact email is required';
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      addToast('warning', 'Missing Required Fields', 'Please complete: ' + Object.values(errors).join(', '));
      setModalTab('general');
      return false;
    }
    return true;
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    setUploadProgress(10);
    try {
      addToast('info', 'Uploading Picture', `Uploading HD picture (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);
      const url = await uploadMediaAsset(file, (p) => setUploadProgress(p));
      setFormData((prev) => ({
        ...prev,
        heroImageUrl: url,
        defaultImageUrl: url,
        heroMediaType: prev.heroVideoUrl ? prev.heroMediaType : 'image',
      }));
      setIsDirty(true);
      addToast('success', 'Hero Picture Uploaded', 'HD picture saved and linked.');
    } catch (err: any) {
      addToast('error', 'Upload Failed', err.message || 'Could not process image.');
    } finally {
      setIsUploadingMedia(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleHeroVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      addToast(
        'error',
        'File Too Large',
        `Video size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 100 MB limit. Please use a video under 100 MB or paste a YouTube/Vimeo URL.`
      );
      e.target.value = '';
      return;
    }

    setIsUploadingMedia(true);
    setUploadProgress(5);
    setVideoSaveSuccessMessage(null);
    try {
      addToast('info', 'Uploading Video', `Streaming video (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);
      const url = await uploadMediaAsset(file, (p) => setUploadProgress(p));
      
      setFormData((prev) => ({
        ...prev,
        heroVideoUrl: url,
        heroMediaType: 'video',
      }));
      setResolvedHeroVideo(url);

      const targetName = editingDivision?.name || formData.name || 'Division';

      // Auto-save video directly to Firestore and CMS if editing an existing division
      if (editingDivision) {
        const rawKey = (editingDivision.divisionKey || (editingDivision as any).slug || editingDivision.id || 'sws').toLowerCase();
        const { canonicalDocId, shortId } = normalizeDivisionId(rawKey);

        const videoPayload = {
          heroVideoUrl: url,
          videoUrl: url,
          heroMediaType: 'video' as const,
          hero: {
            title: formData.heroHeadline || editingDivision.name,
            subtitle: formData.heroSubheadline || editingDivision.tagline,
            badge: formData.badge,
            videoUrl: url,
            mediaType: 'video' as const,
            bgImage: formData.heroImageUrl,
            imageUrl: formData.heroImageUrl,
            defaultImageUrl: formData.heroImageUrl,
          },
        };

        if (saveDivision) {
          await saveDivision(canonicalDocId, videoPayload);
        }
        await cmsService.update<CmsDivision>('divisions', editingDivision.id, {
          heroVideoUrl: url,
          videoUrl: url,
          heroMediaType: 'video',
          hero: {
            title: formData.heroHeadline || editingDivision.name,
            subtitle: formData.heroSubheadline || editingDivision.tagline,
            badge: formData.badge,
            videoUrl: url,
            mediaType: 'video' as const,
            bgImage: formData.heroImageUrl,
            imageUrl: formData.heroImageUrl,
            defaultImageUrl: formData.heroImageUrl,
          },
        });
        if (refreshAll) {
          await refreshAll();
        }
        loadDivisions();
      }

      setIsDirty(false);
      setVideoSaveSuccessMessage(`Video uploaded & saved successfully for "${targetName}"! Live on the site.`);
      addToast('success', 'Hero Video Saved Successfully', `Hero video for "${targetName}" has been uploaded, saved, and is now active.`);
    } catch (err: any) {
      addToast('error', 'Upload Failed', err.message || 'Could not process video.');
    } finally {
      setIsUploadingMedia(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleSaveVideoNow = async () => {
    if (!formData.heroVideoUrl || !formData.heroVideoUrl.trim()) {
      addToast('warning', 'No Video URL', 'Please enter a video URL or upload a video file first.');
      return;
    }
    setIsSavingVideoOnly(true);
    setVideoSaveSuccessMessage(null);
    try {
      const targetName = editingDivision?.name || formData.name || 'Division';
      const rawKey = (formData.divisionKey || editingDivision?.divisionKey || (editingDivision as any)?.slug || editingDivision?.id || 'sws').toLowerCase();
      const { canonicalDocId, shortId } = normalizeDivisionId(rawKey);

      const videoPayload = {
        heroVideoUrl: formData.heroVideoUrl.trim(),
        videoUrl: formData.heroVideoUrl.trim(),
        heroMediaType: 'video' as const,
        hero: {
          title: formData.heroHeadline || formData.name,
          subtitle: formData.heroSubheadline || formData.tagline,
          badge: formData.badge,
          videoUrl: formData.heroVideoUrl.trim(),
          mediaType: 'video' as const,
          bgImage: formData.heroImageUrl,
          imageUrl: formData.heroImageUrl,
          defaultImageUrl: formData.heroImageUrl,
        },
      };

      if (saveDivision) {
        await saveDivision(canonicalDocId, videoPayload);
      }

      if (editingDivision) {
        await cmsService.update<CmsDivision>('divisions', editingDivision.id, {
          heroVideoUrl: formData.heroVideoUrl.trim(),
          videoUrl: formData.heroVideoUrl.trim(),
          heroMediaType: 'video',
          hero: {
            title: formData.heroHeadline || formData.name,
            subtitle: formData.heroSubheadline || formData.tagline,
            badge: formData.badge,
            videoUrl: formData.heroVideoUrl.trim(),
            mediaType: 'video' as const,
            bgImage: formData.heroImageUrl,
            imageUrl: formData.heroImageUrl,
            defaultImageUrl: formData.heroImageUrl,
          },
        });
      }

      if (refreshAll) {
        await refreshAll();
      }
      loadDivisions();
      setIsDirty(false);
      setVideoSaveSuccessMessage(`Hero video successfully saved for "${targetName}"!`);
      addToast('success', 'Video Saved Successfully', `Hero video for "${targetName}" is saved and active.`);
    } catch (err: any) {
      addToast('error', 'Save Video Failed', err.message || 'Could not save video.');
    } finally {
      setIsSavingVideoOnly(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const orderNum = Number(formData.order) || 1;
      const rawKey = (formData.divisionKey || editingDivision?.divisionKey || (editingDivision as any)?.slug || editingDivision?.id || 'sws').toLowerCase();
      const { canonicalDocId, shortId } = normalizeDivisionId(rawKey);

      const payload = {
        ...formData,
        divisionKey: shortId,
        order: orderNum,
      };

      // 1. Sync to Firestore
      if (saveDivision) {
        await saveDivision(canonicalDocId, {
          name: formData.name,
          shortName: formData.shortName,
          divisionKey: shortId,
          tagline: formData.tagline,
          description: formData.description,
          badge: formData.badge,
          imageUrl: formData.heroImageUrl,
          heroImageUrl: formData.heroImageUrl,
          defaultImageUrl: formData.heroImageUrl,
          heroVideoUrl: formData.heroVideoUrl,
          videoUrl: formData.heroVideoUrl,
          heroMediaType: formData.heroMediaType,
          route: formData.route,
          accentColor: formData.accentColor,
          gradient: formData.gradient,
          heroHeadline: formData.heroHeadline,
          heroSubheadline: formData.heroSubheadline,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone || '075 092 8078',
          contactNumber: formData.contactPhone || '075 092 8078',
          aboutHeading: formData.aboutHeading,
          aboutText: formData.aboutText || formData.description,
          mission: formData.mission,
          vision: formData.vision,
          stats: formData.stats,
          isComingSoon: formData.isComingSoon,
          comingSoon: formData.isComingSoon,
          comingSoonTitle: formData.comingSoonTitle,
          comingSoonMessage: formData.comingSoonMessage,
          comingSoonExpectedLaunch: formData.comingSoonExpectedLaunch,
          rentalAssetCount: formData.rentalAssetCount,
          hero: {
            title: formData.heroHeadline,
            subtitle: formData.heroSubheadline,
            badge: formData.badge,
            bgImage: formData.heroImageUrl,
            imageUrl: formData.heroImageUrl,
            defaultImageUrl: formData.heroImageUrl,
            videoUrl: formData.heroVideoUrl,
            mediaType: formData.heroMediaType,
          },
          order: orderNum,
          status: formData.isComingSoon ? 'coming_soon' : (formData.isActive ? 'active' : 'inactive'),
          isPublished: formData.isActive,
          iconName: formData.iconName,
        });
      }

      // 2. Sync to CMS Local Store
      if (editingDivision) {
        await cmsService.update<CmsDivision>('divisions', editingDivision.id, payload);
        addToast('success', 'Division & Video Saved Successfully', `"${formData.name}" division and video settings saved & live on the site.`);
      } else {
        await cmsService.create<CmsDivision>('divisions', payload);
        addToast('success', 'Division & Video Created Successfully', `"${formData.name}" registered & live synced with Firestore.`);
      }
      if (refreshAll) {
        await refreshAll();
      }
      setVideoSaveSuccessMessage(null);
      setIsDirty(false);
      setIsEditorOpen(false);
      loadDivisions();
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'An error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleComingSoon = async (div: CmsDivision) => {
    const isCurrentlyComingSoon = !!(div.isComingSoon || div.comingSoon || div.status === 'coming_soon');
    const nextVal = !isCurrentlyComingSoon;
    const rawKey = (div.divisionKey || (div as any).slug || div.id || '').toLowerCase();
    const canonicalKey =
      rawKey === 'u1' || rawKey === 'u1-studio' || rawKey === 'u1-cinema'
        ? 'u1-studio'
        : rawKey === 'it' || rawKey === 'it-solutions' || rawKey === 'mahdev-it'
        ? 'it-solutions'
        : rawKey === 'mart' || rawKey === 'online-mart' || rawKey === 'mahdev-mart'
        ? 'online-mart'
        : rawKey === 'sws' || rawKey === 'sws-event-management' || rawKey === 'sws-events'
        ? 'sws'
        : rawKey === 'travels' || rawKey === 'mahdev-travels'
        ? 'travels'
        : rawKey;

    try {
      if (saveDivision) {
        await saveDivision(canonicalKey, {
          isComingSoon: nextVal,
          comingSoon: nextVal,
          status: nextVal ? 'coming_soon' : (div.isActive ? 'active' : 'inactive'),
        });
      }
      await cmsService.update<CmsDivision>('divisions', div.id, {
        isComingSoon: nextVal,
        comingSoon: nextVal,
        status: nextVal ? 'coming_soon' : (div.isActive ? 'active' : 'inactive'),
      });
      if (refreshAll) {
        await refreshAll();
      }
      loadDivisions();
      addToast(
        'success',
        nextVal ? 'Division Set to Coming Soon' : 'Division Restored to Live Portal',
        `"${div.name}" is now ${nextVal ? 'displaying the Coming Soon landing page on the website' : 'fully accessible as a live division portal'}.`
      );
    } catch (err: any) {
      addToast('error', 'Update Failed', err?.message || 'Failed to update division status');
    }
  };

  const handleMoveOrder = async (division: CmsDivision, direction: 'up' | 'down') => {
    // Current sorted list
    const currentList = [...divisions].sort((a, b) => (a.order || 99) - (b.order || 99));
    const currentIndex = currentList.findIndex((d) => d.id === division.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    // Swap
    const newSorted = [...currentList];
    const temp = newSorted[currentIndex];
    newSorted[currentIndex] = newSorted[targetIndex];
    newSorted[targetIndex] = temp;

    const orderedIds = newSorted.map((d) => d.id);
    try {
      await cmsService.reorderDivisions(orderedIds);
      loadDivisions();
      addToast(
        'success',
        'Display Order Updated',
        `Moved "${division.name}" to position #${targetIndex + 1}. Public website updated!`
      );
    } catch (err: any) {
      addToast('error', 'Reorder Failed', err?.message || 'Could not update order.');
    }
  };

  const handleSetFirst = async (division: CmsDivision) => {
    const currentList = [...divisions].sort((a, b) => (a.order || 99) - (b.order || 99));
    const without = currentList.filter((d) => d.id !== division.id);
    const newSorted = [division, ...without];
    const orderedIds = newSorted.map((d) => d.id);
    try {
      await cmsService.reorderDivisions(orderedIds);
      loadDivisions();
      addToast(
        'success',
        'Primary Position Set',
        `"${division.name}" is now the 1st (#1) division on the website!`
      );
    } catch (err: any) {
      addToast('error', 'Failed to update order', err?.message || 'Could not update order.');
    }
  };

  const handleResetDefaultOrder = async () => {
    // SWS as 1st, U1 as 2nd, IT as 3rd, Travels as 4th, Mart as 5th
    const defaultKeyOrder = ['sws', 'u1', 'it', 'travels', 'mart'];
    const sorted = [...divisions].sort((a, b) => {
      const keyA = a.divisionKey || (a.id ? String(a.id).replace('div-', '') : '');
      const keyB = b.divisionKey || (b.id ? String(b.id).replace('div-', '') : '');
      const idxA = defaultKeyOrder.indexOf(keyA);
      const idxB = defaultKeyOrder.indexOf(keyB);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });
    const orderedIds = sorted.map((d) => d.id);
    try {
      await cmsService.reorderDivisions(orderedIds);
      loadDivisions();
      addToast(
        'success',
        'Default Order Restored',
        'SWS Event Management set as #1, followed by U1, IT, Travels, and Online Mart.'
      );
    } catch (err: any) {
      addToast('error', 'Reset Failed', err?.message || 'Could not reset order.');
    }
  };

  const handleDeleteConfirm = (permanent: boolean) => {
    if (!deletingDivision) return;
    if (permanent) {
      cmsService.hardDelete('divisions', deletingDivision.id);
      addToast('warning', 'Permanent Deletion', `"${deletingDivision.name}" was permanently removed.`);
    } else {
      cmsService.softDelete('divisions', deletingDivision.id);
      addToast('info', 'Division Archived', `"${deletingDivision.name}" was moved to archive.`);
    }
    setDeletingDivision(null);
    loadDivisions();
  };

  const handleRestore = (div: CmsDivision) => {
    cmsService.restore('divisions', div.id);
    addToast('success', 'Division Restored', `"${div.name}" is now active again.`);
    loadDivisions();
  };

  const comingSoonDivisions = divisions.filter(
    (d) => d.isComingSoon || d.comingSoon || d.status === 'coming_soon'
  );
  const comingSoonCount = comingSoonDivisions.length;

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-slate-900">Corporate Divisions CMS</h2>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {divisions.length} Units
            </span>
            {comingSoonCount > 0 && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" />
                {comingSoonCount} Coming Soon
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Manage autonomous business pillars, logos, hero copy, imagery, and SEO metadata.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add New Division
          </Button>
        </div>
      </div>

      {/* Coming Soon Active Alert Banner */}
      {comingSoonCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-950 text-sm">
                  Coming Soon Mode Enabled ({comingSoonCount} {comingSoonCount === 1 ? 'Division' : 'Divisions'})
                </span>
                <span className="bg-amber-200 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Live on Website
                </span>
              </div>
              <p className="text-amber-800 text-xs mt-0.5">
                Active for: <strong>{comingSoonDivisions.map((d) => d.shortName || d.name).join(', ')}</strong>. Visitors to these routes see the Coming Soon landing page with VIP registration.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'coming_soon' ? 'all' : 'coming_soon')}
            className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-xl font-bold transition-all text-xs shrink-0 cursor-pointer shadow-2xs"
          >
            {statusFilter === 'coming_soon' ? 'Show All Divisions' : 'Filter Coming Soon'}
          </button>
        </div>
      )}

      {/* Website Division Display Sequence Ribbon */}
      <div className="bg-gradient-to-r from-blue-50/80 via-slate-50 to-white p-4 rounded-2xl border border-blue-100/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ListOrdered className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-slate-900 text-xs sm:text-sm">
                  Website Display Sequence
                </h3>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Divisions appear across the navbar dropdown, hero quick-pills, and showcase sections in this exact order.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetDefaultOrder}
              className="text-xs px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-600 rounded-xl font-semibold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              Reset: SWS as 1st (#1)
            </button>
          </div>
        </div>

        {/* Horizontal Sequence Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {divisions.map((d, idx) => {
            const isFirst = (d.order || idx + 1) === 1;
            const isComingSoon = !!(d.isComingSoon || d.comingSoon || d.status === 'coming_soon');
            return (
              <div
                key={d.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  isFirst
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : isComingSoon
                    ? 'bg-amber-50 text-amber-950 border-amber-200 shadow-2xs'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-blue-200'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    isFirst
                      ? 'bg-white/20 text-white'
                      : isComingSoon
                      ? 'bg-amber-200 text-amber-950'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  #{d.order || idx + 1}
                </span>
                <span className="truncate max-w-[130px]">{d.shortName || d.name}</span>
                {isFirst && <Crown className="w-3.5 h-3.5 text-amber-300 ml-0.5" />}
                {isComingSoon && (
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-200 text-amber-950 text-[9px] font-extrabold uppercase tracking-wide">
                    Coming Soon
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by division name, tagline, route..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-slate-500 text-xs">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold cursor-pointer"
          >
            <option value="all">All Divisions ({divisions.length})</option>
            <option value="active">Active Live Only</option>
            <option value="coming_soon">Coming Soon Enabled ({comingSoonCount})</option>
            <option value="inactive">Inactive Only</option>
            <option value="deleted">Archived (Soft Deleted)</option>
          </select>
        </div>
      </div>

      {/* Divisions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4 text-center w-28">Sequence</th>
                <th className="py-3.5 px-4">Division & Badge</th>
                <th className="py-3.5 px-4">Tagline & Description</th>
                <th className="py-3.5 px-4">Route & Email</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {divisions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No divisions found matching criteria.
                  </td>
                </tr>
              ) : (
                divisions.map((div, idx) => {
                  const currentOrder = div.order || idx + 1;
                  const isFirst = currentOrder === 1;
                  const isComingSoonActive = !!(div.isComingSoon || div.comingSoon || div.status === 'coming_soon');
                  return (
                    <tr
                      key={div.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        div.isDeleted
                          ? 'bg-slate-50/50 opacity-60'
                          : isComingSoonActive
                          ? 'bg-amber-50/50 border-l-4 border-l-amber-500 shadow-2xs'
                          : ''
                      }`}
                    >
                      {/* Order Controls */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[11px] font-bold font-mono ${
                              isFirst
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            #{currentOrder}
                            {isFirst && <Crown className="w-3 h-3 ml-1 text-amber-300" />}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(div, 'up')}
                              disabled={idx === 0}
                              title="Move Up"
                              className="p-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 disabled:opacity-25 disabled:hover:bg-slate-100 disabled:hover:text-slate-600 cursor-pointer disabled:cursor-not-allowed transition-colors"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(div, 'down')}
                              disabled={idx === divisions.length - 1}
                              title="Move Down"
                              className="p-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 disabled:opacity-25 disabled:hover:bg-slate-100 disabled:hover:text-slate-600 cursor-pointer disabled:cursor-not-allowed transition-colors"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        {!isFirst && !div.isDeleted && (
                          <button
                            type="button"
                            onClick={() => handleSetFirst(div)}
                            className="mt-1 text-[10px] text-blue-600 hover:text-blue-800 font-semibold hover:underline block mx-auto cursor-pointer"
                          >
                            Set as 1st
                          </button>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white shadow-xs overflow-hidden shrink-0"
                            style={{ backgroundColor: div.accentColor || '#0052FF' }}
                          >
                            {div.logoUrl ? (
                              <img src={div.logoUrl} alt={div.name} className="w-full h-full object-cover" />
                            ) : (
                              div.shortName?.slice(0, 2) || div.name.slice(0, 2)
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{div.name}</span>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">
                                {div.badge || div.divisionKey}
                              </span>
                              {(div.isComingSoon || div.comingSoon || div.status === 'coming_soon') && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-400 text-slate-950 border border-amber-500 shadow-2xs">
                                  <Clock className="w-2.5 h-2.5" /> Coming Soon Active
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-semibold text-slate-800 block truncate">{div.tagline}</span>
                        <span className="text-[11px] text-slate-500 line-clamp-1">{div.description}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className="text-slate-900 block">{div.route}</span>
                        <span className="text-slate-500">{div.contactEmail}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {div.isDeleted ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Archived
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {div.isActive ? (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                                <XCircle className="w-3 h-3" /> Inactive
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleToggleComingSoon(div)}
                              className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer border ${
                                div.isComingSoon || div.comingSoon || div.status === 'coming_soon'
                                  ? 'bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200 shadow-2xs'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                              title={
                                div.isComingSoon || div.comingSoon || div.status === 'coming_soon'
                                  ? 'Click to switch to Live Active Portal'
                                  : 'Click to enable Coming Soon page'
                              }
                            >
                              <span className="flex items-center gap-1">
                                <Clock className={`w-3 h-3 ${div.isComingSoon || div.comingSoon || div.status === 'coming_soon' ? 'text-amber-700' : 'text-slate-400'}`} />
                                {div.isComingSoon || div.comingSoon || div.status === 'coming_soon'
                                  ? 'Coming Soon'
                                  : 'Portal Live'}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                                div.isComingSoon || div.comingSoon || div.status === 'coming_soon'
                                  ? 'bg-amber-200 text-amber-950'
                                  : 'text-blue-600 hover:underline'
                              }`}>
                                {div.isComingSoon || div.comingSoon || div.status === 'coming_soon' ? 'Switch Live' : 'Set Coming Soon'}
                              </span>
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {div.isDeleted ? (
                            <Button variant="outline" size="sm" onClick={() => handleRestore(div)} className="text-blue-600">
                              <RotateCcw className="w-3.5 h-3.5 mr-1" />
                              Restore
                            </Button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleOpenEdit(div)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Edit Division"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingDivision(div)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete / Archive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      <AdminModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingDivision ? `Edit Division: ${editingDivision.name}` : 'Create New Division'}
        subtitle="Configure division identity, route, hero copy, imagery, and SEO metadata."
        isDirty={isDirty}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Modal Tab Switcher */}
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl mb-3">
            {[
              { id: 'general', label: 'Identity & Info' },
              { id: 'hero', label: 'Hero & Visuals' },
              { id: 'narrative', label: 'Inside Text & About' },
              { id: 'comingSoon', label: 'Coming Soon & Inventory' },
              { id: 'seo', label: 'SEO & Social' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setModalTab(t.id as any)}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                  modalTab === t.id ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: GENERAL */}
          {modalTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Division Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      setIsDirty(true);
                    }}
                    placeholder="e.g. SWS Event Management"
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {formErrors.name && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Short Name *</label>
                  <input
                    type="text"
                    value={formData.shortName}
                    onChange={(e) => {
                      setFormData({ ...formData, shortName: e.target.value });
                      setIsDirty(true);
                    }}
                    placeholder="e.g. SWS Events"
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {formErrors.shortName && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.shortName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Division Key / ID</label>
                  <select
                    value={formData.divisionKey}
                    onChange={(e) => {
                      setFormData({ ...formData, divisionKey: e.target.value as any });
                      setIsDirty(true);
                    }}
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="sws">sws (Event Management)</option>
                    <option value="u1">u1 (Studio & Film)</option>
                    <option value="it">it (IT & Solutions)</option>
                    <option value="travels">travels (Luxury Travel)</option>
                    <option value="mart">mart (Online Mart)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Public URL Route *</label>
                  <input
                    type="text"
                    value={formData.route}
                    onChange={(e) => {
                      setFormData({ ...formData, route: e.target.value });
                      setIsDirty(true);
                    }}
                    placeholder="/sws"
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                  {formErrors.route && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.route}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category Badge</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => {
                      setFormData({ ...formData, badge: e.target.value });
                      setIsDirty(true);
                    }}
                    placeholder="Events & Experiences"
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Display Order Setting */}
              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ListOrdered className="w-4 h-4" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 text-xs">
                      Website Display Sequence / Order
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Position on public website (1 = First, 2 = Second, etc.). SWS is recommended as #1.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-bold text-slate-600">Position #</span>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={formData.order}
                    onChange={(e) => {
                      setFormData({ ...formData, order: Math.max(1, parseInt(e.target.value, 10) || 1) });
                      setIsDirty(true);
                    }}
                    className="w-20 px-3 py-1.5 border rounded-lg border-slate-200 bg-white font-bold text-center text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tagline *</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => {
                    setFormData({ ...formData, tagline: e.target.value });
                    setIsDirty(true);
                  }}
                  placeholder="Creating Unforgettable Moments"
                  className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {formErrors.tagline && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.tagline}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    setIsDirty(true);
                  }}
                  placeholder="Detailed overview of capabilities..."
                  className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Email *</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => {
                      setFormData({ ...formData, contactEmail: e.target.value });
                      setIsDirty(true);
                    }}
                    placeholder="events@mahdev.lk"
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {formErrors.contactEmail && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.contactEmail}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Division Hotline / Phone Number</label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => {
                      setFormData({ ...formData, contactPhone: e.target.value });
                      setIsDirty(true);
                    }}
                    placeholder="075 092 8078"
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Corporate Standard: 075 092 8078</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HERO & BRANDING */}
          {modalTab === 'hero' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hero Main Headline</label>
                <input
                  type="text"
                  value={formData.heroHeadline}
                  onChange={(e) => {
                    setFormData({ ...formData, heroHeadline: e.target.value });
                    setIsDirty(true);
                  }}
                  placeholder="e.g. World-Class Event Design & Stage Production"
                  className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hero Subheadline</label>
                <textarea
                  rows={2}
                  value={formData.heroSubheadline}
                  onChange={(e) => {
                    setFormData({ ...formData, heroSubheadline: e.target.value });
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Orchestrating premier corporate galas, concert audio, and luxury weddings across Sri Lanka."
                  className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">Logo Image URL</label>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaPickerTarget('logo');
                        setIsMediaPickerOpen(true);
                      }}
                      className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ImageIcon className="w-3 h-3" /> Select Media
                    </button>
                  </div>
                  <input
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, logoUrl: e.target.value });
                      setIsDirty(true);
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <label className="block font-semibold text-slate-800 text-xs">
                        Default Image Fallback (Shows while video is loading)
                      </label>
                      <p className="text-[10px] text-slate-500">
                        HD image that appears immediately while the video is loading or buffering.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className={`text-xs font-semibold hover:underline flex items-center gap-1 ${
                        isUploadingMedia ? 'text-blue-400 cursor-wait' : 'text-blue-600 cursor-pointer'
                      }`}>
                        <Upload className="w-3 h-3" />
                        {isUploadingMedia ? `Uploading ${uploadProgress}%...` : 'Upload Image'}
                        <input
                          type="file"
                          disabled={isUploadingMedia}
                          accept="image/*"
                          onChange={handleHeroImageUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMediaPickerTarget('hero');
                          setIsMediaPickerOpen(true);
                        }}
                        className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <ImageIcon className="w-3 h-3" /> Media Library
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={formData.heroImageUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, heroImageUrl: e.target.value });
                      setIsDirty(true);
                    }}
                    placeholder="https://images.unsplash.com/... or /uploads/... picture URL"
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                  {formData.heroImageUrl && (
                    <div className="mt-2 flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <img
                        src={formData.heroImageUrl}
                        alt="Hero Fallback"
                        className="w-14 h-9 object-cover rounded border border-slate-200"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 truncate">Default Hero Poster Active</p>
                        <p className="text-[10px] text-slate-500 truncate">{formData.heroImageUrl}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, heroImageUrl: '' });
                          setIsDirty(true);
                        }}
                        className="text-[11px] text-red-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Hero Video URL & Media Type Selection */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                {/* Video Save Success Banner */}
                {videoSaveSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3 text-emerald-900 text-xs shadow-xs animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Saved!</strong> {videoSaveSuccessMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVideoSaveSuccessMessage(null)}
                      className="text-emerald-700 hover:text-emerald-950 font-bold px-2 py-0.5 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block font-bold text-slate-900 text-xs sm:text-sm">
                      Hero Media Type Selection (Picture or Video)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Choose whether this division hero displays a video loop or high-resolution picture cover.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, heroMediaType: 'image' });
                        setIsDirty(true);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formData.heroMediaType === 'image'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Picture
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, heroMediaType: 'video' });
                        setIsDirty(true);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formData.heroMediaType === 'video'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Video
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 text-xs">
                      Hero Video URL (MP4, WebM, or YouTube URL)
                    </label>
                    <div className="flex items-center gap-2">
                      <label className={`text-xs font-semibold hover:underline flex items-center gap-1 ${
                        isUploadingMedia ? 'text-blue-400 cursor-wait' : 'text-blue-600 cursor-pointer'
                      }`}>
                        <Upload className="w-3 h-3" />
                        {isUploadingMedia ? `Uploading ${uploadProgress}%...` : 'Upload Video'}
                        <input
                          type="file"
                          disabled={isUploadingMedia}
                          accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                          onChange={handleHeroVideoUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMediaPickerTarget('heroVideo');
                          setIsMediaPickerOpen(true);
                        }}
                        className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <ImageIcon className="w-3 h-3" /> Select Video
                      </button>
                      {formData.heroVideoUrl && (
                        <button
                          type="button"
                          disabled={isSavingVideoOnly || isUploadingMedia}
                          onClick={handleSaveVideoNow}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {isSavingVideoOnly ? 'Saving...' : 'Save Video to Division'}
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={formData.heroVideoUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        heroVideoUrl: val,
                      });
                      setIsDirty(true);
                    }}
                    placeholder="https://.../video.mp4 or https://youtube.com/watch?v=..."
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Direct MP4/WebM video will autoplay, loop, and mute across the entire hero screen width. YouTube links will embed automatically.
                  </p>
                </div>

                {/* Live Media Preview */}
                {(formData.heroVideoUrl || formData.heroImageUrl) && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Active Hero Backdrop Preview ({formData.heroMediaType === 'video' && formData.heroVideoUrl ? 'Video Loop' : 'Picture Cover'}):
                      </label>
                      {formData.heroMediaType === 'video' && formData.heroVideoUrl && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Video Active & Linked
                        </span>
                      )}
                    </div>
                    <div className="relative rounded-xl overflow-hidden aspect-16/7 bg-slate-950 border border-slate-200 shadow-inner max-h-48 flex items-center justify-center">
                      {formData.heroMediaType === 'video' && formData.heroVideoUrl ? (
                        extractYouTubeId(formData.heroVideoUrl) ? (
                          <iframe
                            src={getYouTubeEmbedUrl(formData.heroVideoUrl, { autoplay: true, mute: true, loop: true, controls: false }) || ''}
                            title="Preview"
                            className="w-full h-full object-cover pointer-events-none"
                          />
                        ) : (
                          <video
                            src={resolvedHeroVideo || formData.heroVideoUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                            onError={(err) => console.warn('[AdminDivisions] Video preview playback note:', err)}
                          />
                        )
                      ) : (
                        <img
                          src={formData.heroImageUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85'}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      )}
                      {/* Gradient preview on left side */}
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent pointer-events-none" />
                      <div className="absolute bottom-2 left-3 text-white text-xs font-bold drop-shadow-md">
                        {formData.heroHeadline || formData.name || 'Hero Headline'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => {
                        setFormData({ ...formData, accentColor: e.target.value });
                        setIsDirty(true);
                      }}
                      className="w-10 h-9 p-1 border rounded-lg cursor-pointer bg-white"
                    />
                    <input
                      type="text"
                      value={formData.accentColor}
                      onChange={(e) => {
                        setFormData({ ...formData, accentColor: e.target.value });
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 border rounded-xl border-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tailwind Gradient Preset</label>
                  <input
                    type="text"
                    value={formData.gradient}
                    onChange={(e) => {
                      setFormData({ ...formData, gradient: e.target.value });
                      setIsDirty(true);
                    }}
                    placeholder="from-blue-600 to-indigo-700"
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NARRATIVE & INSIDE CONTENT */}
          {modalTab === 'narrative' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inside Section Heading</label>
                <input
                  type="text"
                  value={formData.aboutHeading}
                  onChange={(e) => {
                    setFormData({ ...formData, aboutHeading: e.target.value });
                    setIsDirty(true);
                  }}
                  placeholder="e.g. The Art of Extraordinary Celebrations"
                  className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Displayed prominently inside the division's overview narrative.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inside Detailed Overview / Text</label>
                <textarea
                  rows={3}
                  value={formData.aboutText}
                  onChange={(e) => {
                    setFormData({ ...formData, aboutText: e.target.value });
                    setIsDirty(true);
                  }}
                  placeholder="Detailed breakdown of division vision, craftsmanship, and capabilities..."
                  className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mission Statement</label>
                  <textarea
                    rows={2}
                    value={formData.mission}
                    onChange={(e) => {
                      setFormData({ ...formData, mission: e.target.value });
                      setIsDirty(true);
                    }}
                    placeholder="e.g. To craft immersive sensory event environments..."
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vision Statement</label>
                  <textarea
                    rows={2}
                    value={formData.vision}
                    onChange={(e) => {
                      setFormData({ ...formData, vision: e.target.value });
                      setIsDirty(true);
                    }}
                    placeholder="e.g. To be the preeminent luxury event management institution..."
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Key Metrics / Stats Editor */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">Division Key Performance Metrics / Stats</h5>
                    <p className="text-[10px] text-slate-500">Highlighted on the public division page (e.g. 450+ Events, 99.4% Satisfaction)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        stats: [...formData.stats, { label: 'New Metric', value: '100+' }],
                      });
                      setIsDirty(true);
                    }}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3 h-3" /> Add Metric
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.stats.map((stat, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Label</label>
                        <input
                          type="text"
                          value={stat.label}
                          onChange={(e) => {
                            const updated = [...formData.stats];
                            updated[idx] = { ...updated[idx], label: e.target.value };
                            setFormData({ ...formData, stats: updated });
                            setIsDirty(true);
                          }}
                          placeholder="Label (e.g. Events Curated)"
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Value</label>
                        <input
                          type="text"
                          value={stat.value}
                          onChange={(e) => {
                            const updated = [...formData.stats];
                            updated[idx] = { ...updated[idx], value: e.target.value };
                            setFormData({ ...formData, stats: updated });
                            setIsDirty(true);
                          }}
                          placeholder="Value (e.g. 450+)"
                          className="w-full px-2 py-1 text-xs font-bold text-blue-600 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      {formData.stats.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.stats.filter((_, i) => i !== idx);
                            setFormData({ ...formData, stats: updated });
                            setIsDirty(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors self-end"
                          title="Remove Metric"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: COMING SOON & INVENTORY */}
          {modalTab === 'comingSoon' && (
            <div className="space-y-5">
              {/* Coming Soon Mode Banner */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-slate-900 text-sm">Division Coming Soon Mode</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isComingSoon}
                      onChange={(e) => {
                        setFormData({ ...formData, isComingSoon: e.target.checked });
                        setIsDirty(true);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
                <p className="text-slate-600 leading-relaxed text-xs">
                  When enabled, visitors who click or browse to <code className="px-1.5 py-0.5 bg-white border border-amber-300 rounded font-mono text-amber-900 font-bold">{formData.route}</code> will immediately see the luxury, branded <strong>Coming Soon page</strong> with VIP email registration, launch timeline, and direct hotline contact instead of the active portal.
                </p>
              </div>

              {/* Coming Soon Custom Content */}
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Custom Coming Soon Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.comingSoonTitle}
                    onChange={(e) => {
                      setFormData({ ...formData, comingSoonTitle: e.target.value });
                      setIsDirty(true);
                    }}
                    placeholder={`e.g. ${formData.name || 'Division'} is Arriving Soon`}
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Default: &quot;{formData.name || 'Division'} • Coming Soon&quot;</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Announcement Message / Story
                  </label>
                  <textarea
                    rows={3}
                    value={formData.comingSoonMessage}
                    onChange={(e) => {
                      setFormData({ ...formData, comingSoonMessage: e.target.value });
                      setIsDirty(true);
                    }}
                    placeholder="e.g. We are currently calibrating state-of-the-art studio equipment, finalizing elite visual production suites, and curating premier creative packages. Sign up below for priority VIP launch invitations."
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Expected Launch Timeline
                  </label>
                  <input
                    type="text"
                    value={formData.comingSoonExpectedLaunch}
                    onChange={(e) => {
                      setFormData({ ...formData, comingSoonExpectedLaunch: e.target.value });
                      setIsDirty(true);
                    }}
                    placeholder="e.g. Q4 2026 or Late 2026"
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Displayed on the public countdown and status badge.</p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <label className="block font-semibold text-slate-800">
                      Rental Assets / Inventory Count Display
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.rentalAssetCount}
                    onChange={(e) => {
                      setFormData({ ...formData, rentalAssetCount: e.target.value });
                      setIsDirty(true);
                    }}
                    placeholder="e.g. 5,000+ or 1,200+ (Leave blank to auto-calculate from active rental products)"
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Controls the inventory badge across the public site (e.g. SWS rentals). Auto-calculated count from active products added for rent: <span className="font-bold text-blue-600 font-mono">{getRentalAssetCount(products)}</span>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SEO */}
          {modalTab === 'seo' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">SEO Meta Title</label>
                <input
                  type="text"
                  value={formData.seo.metaTitle}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      seo: { ...formData.seo, metaTitle: e.target.value },
                    });
                    setIsDirty(true);
                  }}
                  placeholder="e.g. SWS Event Management | Luxury Weddings & Stage Productions"
                  className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">SEO Meta Description</label>
                <textarea
                  rows={3}
                  value={formData.seo.metaDescription}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      seo: { ...formData.seo, metaDescription: e.target.value },
                    });
                    setIsDirty(true);
                  }}
                  placeholder="Brief summary of division offerings..."
                  className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Canonical URL</label>
                  <input
                    type="url"
                    value={formData.seo.canonicalUrl}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        seo: { ...formData.seo, canonicalUrl: e.target.value },
                      });
                      setIsDirty(true);
                    }}
                    placeholder="https://mahdev.lk/sws"
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">OpenGraph Share Image</label>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaPickerTarget('ogImage');
                        setIsMediaPickerOpen(true);
                      }}
                      className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ImageIcon className="w-3 h-3" /> Select Media
                    </button>
                  </div>
                  <input
                    type="url"
                    value={formData.seo.ogImage}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        seo: { ...formData.seo, ogImage: e.target.value },
                      });
                      setIsDirty(true);
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => {
                  setFormData({ ...formData, isActive: e.target.checked });
                  setIsDirty(true);
                }}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span className="font-semibold text-slate-700">Active & Published on Public Site</span>
            </label>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsEditorOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingDivision ? 'Update Division' : 'Create Division'}
              </Button>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(url) => {
          if (mediaPickerTarget === 'logo') {
            setFormData({ ...formData, logoUrl: url });
          } else if (mediaPickerTarget === 'hero') {
            setFormData({ ...formData, heroImageUrl: url });
          } else if (mediaPickerTarget === 'heroVideo') {
            setFormData({ ...formData, heroVideoUrl: url, heroMediaType: 'video' });
          } else if (mediaPickerTarget === 'ogImage') {
            setFormData({
              ...formData,
              seo: { ...formData.seo, ogImage: url },
            });
          }
          setIsDirty(true);
          setIsMediaPickerOpen(false);
        }}
        initialCategory="banners"
      />

      {/* Delete / Archive Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={!!deletingDivision}
        title="Delete Division"
        message={`Are you sure you want to remove or archive "${deletingDivision?.name}"?`}
        itemIdentifier={deletingDivision ? `${deletingDivision.name} (${deletingDivision.divisionKey})` : undefined}
        allowSoftDelete={true}
        isCurrentlyDeleted={deletingDivision?.isDeleted}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingDivision(null)}
      />
    </div>
  );
};
