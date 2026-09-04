import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock3,
  XCircle,
  Trash2,
  Download,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Building2,
  Briefcase,
  User,
  Send,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import {
  firestoreInquiriesService,
  FirestoreInquiry,
  EnquiryStatus,
} from '../../services/firestore/inquiries';
import { firestoreContactsService } from '../../services/firestore/contacts';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

export const AdminEnquiriesView: React.FC = () => {
  const { divisions } = useFirestoreDataContext();
  const [inquiries, setInquiries] = useState<FirestoreInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<string>('all');
  const [activeInquiry, setActiveInquiry] = useState<FirestoreInquiry | null>(null);
  const [inquiryToDelete, setInquiryToDelete] = useState<FirestoreInquiry | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Fetch inquiries from Firestore real-time listener (both inquiries and contactSubmissions)
  useEffect(() => {
    setLoading(true);
    let latestInquiries: FirestoreInquiry[] = [];
    let latestContacts: any[] = [];

    const mergeAndSet = () => {
      // Map contacts into uniform inquiry format
      const mappedContacts: FirestoreInquiry[] = latestContacts.map((c) => ({
        id: c.id,
        name: c.fullName || c.name || 'Anonymous Client',
        email: c.email,
        phone: c.phone || '',
        service: c.subject || 'General Inquiry',
        division: c.division || 'general',
        message: c.message,
        status:
          c.status === 'replied'
            ? 'Contacted'
            : c.status === 'in_review'
            ? 'In Progress'
            : c.status === 'archived'
            ? 'Completed'
            : 'New',
        source: 'contact_page',
        createdAt: c.createdAt,
      }));

      // Deduplicate and combine by ID
      const existingIds = new Set(latestInquiries.map((i) => i.id));
      const combined = [
        ...latestInquiries,
        ...mappedContacts.filter((c) => !existingIds.has(c.id)),
      ];

      // Sort by date descending
      combined.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      setInquiries(combined);
      setLoading(false);
    };

    const unsubInquiries = firestoreInquiriesService.subscribeInquiries((inqList) => {
      latestInquiries = inqList || [];
      mergeAndSet();
    });

    const unsubContacts = firestoreContactsService.subscribeContacts((contactList) => {
      latestContacts = contactList || [];
      mergeAndSet();
    });

    return () => {
      unsubInquiries();
      unsubContacts();
    };
  }, []);

  // Auto-open target inquiry if redirected from admin notification
  useEffect(() => {
    if (inquiries.length > 0 && !activeInquiry) {
      const targetId = sessionStorage.getItem('mahdev_target_inquiry_id');
      const targetEmail = sessionStorage.getItem('mahdev_target_inquiry_email');
      const targetQuery = sessionStorage.getItem('mahdev_target_inquiry_query');

      if (targetId) {
        const found = inquiries.find((i) => i.id === targetId);
        if (found) {
          setActiveInquiry(found);
          sessionStorage.removeItem('mahdev_target_inquiry_id');
          return;
        }
      }
      if (targetEmail) {
        const found = inquiries.find((i) => i.email?.toLowerCase() === targetEmail.toLowerCase());
        if (found) {
          setActiveInquiry(found);
          sessionStorage.removeItem('mahdev_target_inquiry_email');
          return;
        }
      }
      if (targetQuery) {
        const queryLower = targetQuery.toLowerCase();
        const found = inquiries.find(
          (i) =>
            i.name?.toLowerCase().includes(queryLower) ||
            i.message?.toLowerCase().includes(queryLower) ||
            i.service?.toLowerCase().includes(queryLower)
        );
        if (found) {
          setActiveInquiry(found);
          sessionStorage.removeItem('mahdev_target_inquiry_query');
          return;
        }
      }
    }
  }, [inquiries, activeInquiry]);

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const normalizeStatus = (status: string | undefined): 'New' | 'Contacted' | 'In Progress' | 'Completed' | 'Cancelled' => {
    if (!status) return 'New';
    const lower = status.toLowerCase();
    if (lower === 'new') return 'New';
    if (lower === 'contacted' || lower === 'replied') return 'Contacted';
    if (lower === 'in progress' || lower === 'in-progress' || lower === 'in-review') return 'In Progress';
    if (lower === 'completed' || lower === 'converted' || lower === 'archived') return 'Completed';
    if (lower === 'cancelled' || lower === 'declined') return 'Cancelled';
    return 'New';
  };

  const handleUpdateStatus = async (inquiryId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      if (inquiryId.startsWith('CNT-')) {
        const contactStatusMap: Record<string, any> = {
          New: 'new',
          Contacted: 'replied',
          'In Progress': 'in_review',
          Completed: 'archived',
          Cancelled: 'archived',
        };
        await firestoreContactsService.updateContactStatus(
          inquiryId,
          contactStatusMap[newStatus] || 'new'
        );
      } else {
        await firestoreInquiriesService.updateInquiry(inquiryId, {
          status: newStatus as EnquiryStatus,
        });
      }

      setInquiries((prev) =>
        prev.map((inq) => (inq.id === inquiryId ? { ...inq, status: newStatus } : inq))
      );
      if (activeInquiry && activeInquiry.id === inquiryId) {
        setActiveInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      addToast('success', 'Status Updated', `Enquiry marked as "${newStatus}".`);
    } catch (err) {
      console.error('[AdminEnquiries] Status update failed:', err);
      addToast('error', 'Update Failed', 'Could not update status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Single deletion with in-app confirmation
  const handleConfirmDelete = async () => {
    if (!inquiryToDelete) return;
    const inquiryId = inquiryToDelete.id;
    setIsDeleting(true);

    try {
      // Cleanly remove from both Firestore collections to guarantee permanent erasure
      await Promise.allSettled([
        firestoreInquiriesService.deleteInquiry(inquiryId),
        firestoreContactsService.deleteContact(inquiryId),
      ]);

      setInquiries((prev) => prev.filter((i) => i.id !== inquiryId));
      setSelectedIds((prev) => prev.filter((id) => id !== inquiryId));
      if (activeInquiry && activeInquiry.id === inquiryId) {
        setActiveInquiry(null);
      }
      setInquiryToDelete(null);
      addToast('success', 'Enquiry Deleted', 'The website enquiry has been permanently removed.');
    } catch (err) {
      console.error('[AdminEnquiries] Delete failed:', err);
      addToast('error', 'Delete Failed', 'Failed to delete record. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk deletion of all selected inquiries
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);

    try {
      const deletePromises = selectedIds.flatMap((id) => [
        firestoreInquiriesService.deleteInquiry(id),
        firestoreContactsService.deleteContact(id),
      ]);
      await Promise.allSettled(deletePromises);

      const deletedSet = new Set(selectedIds);
      setInquiries((prev) => prev.filter((i) => !deletedSet.has(i.id)));
      if (activeInquiry && deletedSet.has(activeInquiry.id)) {
        setActiveInquiry(null);
      }
      const count = selectedIds.length;
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
      addToast('success', 'Enquiries Deleted', `Successfully removed ${count} website enquiries.`);
    } catch (err) {
      console.error('[AdminEnquiries] Bulk delete failed:', err);
      addToast('error', 'Delete Failed', 'Failed to delete some records.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredInquiries.length && filteredInquiries.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInquiries.map((i) => i.id));
    }
  };

  // Filter inquiries based on search, status and division
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      const statusMatch =
        selectedStatusFilter === 'all' ||
        normalizeStatus(inq.status) === selectedStatusFilter;

      const divMatch =
        selectedDivisionFilter === 'all' ||
        (inq.divisionId && inq.divisionId.toLowerCase() === selectedDivisionFilter.toLowerCase()) ||
        (inq.division && inq.division.toLowerCase() === selectedDivisionFilter.toLowerCase());

      const query = searchQuery.toLowerCase().trim();
      const textMatch =
        !query ||
        (inq.name && inq.name.toLowerCase().includes(query)) ||
        (inq.fullName && inq.fullName.toLowerCase().includes(query)) ||
        (inq.email && inq.email.toLowerCase().includes(query)) ||
        (inq.phone && inq.phone.toLowerCase().includes(query)) ||
        (inq.message && inq.message.toLowerCase().includes(query)) ||
        (inq.service && inq.service.toLowerCase().includes(query)) ||
        (inq.serviceName && inq.serviceName.toLowerCase().includes(query));

      return statusMatch && divMatch && textMatch;
    });
  }, [inquiries, searchQuery, selectedStatusFilter, selectedDivisionFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = inquiries.length;
    const countNew = inquiries.filter((i) => normalizeStatus(i.status) === 'New').length;
    const countContacted = inquiries.filter((i) => normalizeStatus(i.status) === 'Contacted').length;
    const countInProgress = inquiries.filter((i) => normalizeStatus(i.status) === 'In Progress').length;
    const countCompleted = inquiries.filter((i) => normalizeStatus(i.status) === 'Completed').length;
    const countCancelled = inquiries.filter((i) => normalizeStatus(i.status) === 'Cancelled').length;
    return {
      total,
      new: countNew,
      contacted: countContacted,
      inProgress: countInProgress,
      completed: countCompleted,
      cancelled: countCancelled,
    };
  }, [inquiries]);

  // Export inquiries to CSV
  const handleExportCsv = () => {
    if (filteredInquiries.length === 0) {
      addToast('warning', 'No Records', 'There are no records to export.');
      return;
    }

    const headers = ['ID', 'Date', 'Name', 'Phone', 'Email', 'Service', 'Division', 'Status', 'Message'];
    const rows = filteredInquiries.map((i) => [
      `"${i.id}"`,
      `"${i.createdAt ? new Date(i.createdAt).toLocaleString() : 'N/A'}"`,
      `"${(i.name || i.fullName || '').replace(/"/g, '""')}"`,
      `"${(i.phone || '').replace(/"/g, '""')}"`,
      `"${(i.email || '').replace(/"/g, '""')}"`,
      `"${(i.service || i.serviceName || 'General Inquiry').replace(/"/g, '""')}"`,
      `"${(i.division || i.divisionId || 'Mahdev Group').replace(/"/g, '""')}"`,
      `"${normalizeStatus(i.status)}"`,
      `"${(i.message || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `mahdev_enquiries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', 'Export Complete', `${filteredInquiries.length} enquiries exported to CSV.`);
  };

  const getStatusBadge = (status: string | undefined) => {
    const norm = normalizeStatus(status);
    switch (norm) {
      case 'New':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            New
          </span>
        );
      case 'Contacted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Clock3 className="w-3 h-3" />
            Contacted
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return <Badge variant="outline">{norm}</Badge>;
    }
  };

  const formatSriLankanWhatsApp = (phoneStr: string) => {
    if (!phoneStr) return null;
    let digits = phoneStr.replace(/[^0-9]/g, '');
    if (digits.startsWith('0')) {
      digits = '94' + digits.substring(1);
    } else if (digits.length === 9) {
      digits = '94' + digits;
    }
    return `https://wa.me/${digits}`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold font-display text-slate-900">
              Website Enquiries
            </h1>
            <Badge variant="electric" size="sm">
              {inquiries.length} Total
            </Badge>
          </div>
          <p className="text-sm text-slate-500">
            Customer inquiries, quote requests, and direct consultations received from public forms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Metric Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'All Inquiries', count: stats.total, color: 'text-slate-900', bg: 'bg-slate-50', border: 'border-slate-200', filter: 'all' },
          { label: 'New', count: stats.new, color: 'text-blue-600', bg: 'bg-blue-50/50', border: 'border-blue-200', filter: 'New' },
          { label: 'Contacted', count: stats.contacted, color: 'text-purple-600', bg: 'bg-purple-50/50', border: 'border-purple-200', filter: 'Contacted' },
          { label: 'In Progress', count: stats.inProgress, color: 'text-amber-600', bg: 'bg-amber-50/50', border: 'border-amber-200', filter: 'In Progress' },
          { label: 'Completed', count: stats.completed, color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-200', filter: 'Completed' },
          { label: 'Cancelled', count: stats.cancelled, color: 'text-rose-600', bg: 'bg-rose-50/50', border: 'border-rose-200', filter: 'Cancelled' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => setSelectedStatusFilter(item.filter)}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${item.bg} ${item.border} ${
              selectedStatusFilter === item.filter ? 'ring-2 ring-blue-600 shadow-xs' : 'hover:border-slate-300'
            }`}
          >
            <span className="text-xs font-semibold text-slate-500 block truncate">
              {item.label}
            </span>
            <span className={`text-xl font-bold font-mono mt-1 block ${item.color}`}>
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by customer name, phone, email, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Division Filter */}
          <select
            value={selectedDivisionFilter}
            onChange={(e) => setSelectedDivisionFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            <option value="all">All Divisions</option>
            <option value="general">Mahdev Group (General)</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {(searchQuery || selectedStatusFilter !== 'all' || selectedDivisionFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedStatusFilter('all');
                setSelectedDivisionFilter('all');
              }}
              className="text-xs"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar when items selected */}
      {selectedIds.length > 0 && (
        <div className="p-3 px-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
            <span>{selectedIds.length} {selectedIds.length === 1 ? 'enquiry' : 'enquiries'} selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Deselect All
            </button>
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Enquiries Table / Card List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading enquiries from Cloud Firestore...</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="p-16 text-center">
            <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-display font-bold text-slate-800 text-lg mb-1">
              No Enquiries Found
            </h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              {searchQuery || selectedStatusFilter !== 'all' || selectedDivisionFilter !== 'all'
                ? 'No inquiries match your filter criteria. Try resetting the filters.'
                : 'When customers submit contact forms or booking consultations, they will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredInquiries.length > 0 && selectedIds.length === filteredInquiries.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      title="Select All"
                    />
                  </th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Phone / Contact</th>
                  <th className="py-3.5 px-4">Service & Division</th>
                  <th className="py-3.5 px-4">Message Snippet</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInquiries.map((inquiry) => {
                  const whatsappUrl = formatSriLankanWhatsApp(inquiry.phone);
                  const clientName = inquiry.name || inquiry.fullName || 'Anonymous Client';
                  const serviceName = inquiry.service || inquiry.serviceName || 'General Inquiry';
                  const divisionName = inquiry.division || inquiry.divisionId || 'Mahdev';
                  const isSelected = selectedIds.includes(inquiry.id);

                  return (
                    <tr
                      key={inquiry.id}
                      className={`hover:bg-blue-50/30 transition-colors group cursor-pointer ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                      onClick={() => setActiveInquiry(inquiry)}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(inquiry.id)}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-xs">
                        {inquiry.createdAt
                          ? new Date(inquiry.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Recent'}
                      </td>

                      {/* Customer Name & Email */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {clientName}
                        </div>
                        <div className="text-slate-500 text-xs font-mono truncate max-w-[180px]">
                          {inquiry.email}
                        </div>
                      </td>

                      {/* Phone / Contact Direct */}
                      <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {inquiry.phone ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-slate-800">{inquiry.phone}</span>
                            {whatsappUrl && (
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <a
                              href={`tel:${inquiry.phone}`}
                              className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              title="Call"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">No phone provided</span>
                        )}
                      </td>

                      {/* Service & Division */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 text-xs">
                          {serviceName}
                        </div>
                        <div className="text-[11px] text-slate-500 uppercase font-semibold">
                          {divisionName}
                        </div>
                      </td>

                      {/* Message Snippet */}
                      <td className="py-3.5 px-4 max-w-[240px]">
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {inquiry.message || 'No message contents provided.'}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <select
                            value={normalizeStatus(inquiry.status)}
                            onChange={(e) => handleUpdateStatus(inquiry.id, e.target.value)}
                            className="text-xs font-semibold rounded-lg border border-slate-200 bg-white py-1 px-2.5 text-slate-700 shadow-2xs hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setActiveInquiry(inquiry)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View Full Enquiry"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a
                            href={`mailto:${inquiry.email}?subject=Regarding Your Inquiry - Mahdev Pvt Ltd`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Reply by Email"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInquiryToDelete(inquiry);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Enquiry Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Enquiry Modal / Drawer */}
      {activeInquiry && (
        <AdminModal
          isOpen={Boolean(activeInquiry)}
          onClose={() => setActiveInquiry(null)}
          title="Website Enquiry Details"
          subtitle={`Received on ${
            activeInquiry.createdAt
              ? new Date(activeInquiry.createdAt).toLocaleString()
              : 'Public Portal'
          }`}
          onSave={() => setActiveInquiry(null)}
          saveLabel="Done"
        >
          <div className="space-y-6">
            {/* Status Control Bar */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Current Status</span>
                <div className="mt-1">{getStatusBadge(activeInquiry.status)}</div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Update to:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['New', 'Contacted', 'In Progress', 'Completed', 'Cancelled'].map((st) => (
                    <button
                      key={st}
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateStatus(activeInquiry.id, st)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        normalizeStatus(activeInquiry.status) === st
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 bg-white">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 mb-2">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Client Information
                </div>
                <div className="font-bold text-slate-900 text-base mb-1">
                  {activeInquiry.name || activeInquiry.fullName || 'Anonymous Client'}
                </div>
                <div className="text-xs text-slate-600 font-mono flex items-center gap-1 mb-2">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <a href={`mailto:${activeInquiry.email}`} className="hover:text-blue-600 hover:underline">
                    {activeInquiry.email}
                  </a>
                </div>
                {activeInquiry.phone && (
                  <div className="text-xs text-slate-600 font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <a href={`tel:${activeInquiry.phone}`} className="hover:text-blue-600 hover:underline">
                      {activeInquiry.phone}
                    </a>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-white">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 mb-2">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                  Service & Scope
                </div>
                <div className="font-bold text-slate-900 text-base mb-1">
                  {activeInquiry.service || activeInquiry.serviceName || 'General Inquiry'}
                </div>
                <div className="text-xs text-slate-500 uppercase font-semibold">
                  Division: {activeInquiry.division || activeInquiry.divisionId || 'Mahdev Enterprise'}
                </div>
                {activeInquiry.preferredDate && (
                  <div className="text-xs text-slate-600 mt-2 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Target Date: {activeInquiry.preferredDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Inquiry Message */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Inquiry Message / Project Scope
              </span>
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {activeInquiry.message || 'No written message attached.'}
              </p>
            </div>

            {/* Direct Contact Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              {formatSriLankanWhatsApp(activeInquiry.phone) && (
                <a
                  href={formatSriLankanWhatsApp(activeInquiry.phone)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Customer</span>
                </a>
              )}

              {activeInquiry.phone && (
                <a
                  href={`tel:${activeInquiry.phone}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call {activeInquiry.phone}</span>
                </a>
              )}

              <a
                href={`mailto:${activeInquiry.email}?subject=Regarding Your Inquiry - Mahdev Pvt Ltd`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email</span>
              </a>

              <button
                onClick={() => setInquiryToDelete(activeInquiry)}
                className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Delete this enquiry permanently"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Enquiry</span>
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Confirm Single Delete Dialog */}
      <AdminConfirmDialog
        isOpen={Boolean(inquiryToDelete)}
        title="Delete Website Enquiry"
        message={`Are you sure you want to permanently delete the inquiry submitted by "${
          inquiryToDelete?.name || inquiryToDelete?.fullName || 'Client'
        }" (${inquiryToDelete?.email || 'No email provided'})? This record will be permanently erased from the database.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Permanently Delete'}
        cancelLabel="Keep Enquiry"
        allowSoftDelete={false}
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setInquiryToDelete(null)}
      />

      {/* Confirm Bulk Delete Dialog */}
      <AdminConfirmDialog
        isOpen={showBulkDeleteConfirm}
        title="Delete Multiple Enquiries"
        message={`Are you sure you want to permanently delete all ${selectedIds.length} selected website enquiries? This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : `Delete ${selectedIds.length} Enquiries`}
        cancelLabel="Cancel"
        allowSoftDelete={false}
        isDestructive
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />

      {/* Toast Notifications */}
      <AdminToast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
