import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  MessageSquare,
  DollarSign,
  User,
  Building,
  RefreshCw,
  X,
  RotateCcw,
  CalendarCheck,
  CalendarX,
  Edit3,
  Send,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
  Tag,
  Trash2,
} from 'lucide-react';
import { Booking, BookingStatus, PaymentStatus } from '../../types/booking';
import { bookingService, mapFirestoreBookingToUniversal } from '../../services/bookingService';
import { firestoreBookingsService } from '../../services/firestore/bookings';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';

export const AdminBookingsView: React.FC = () => {
  const { admin, logAuditAction } = useAdminAuth();
  const [bookings, setBookings] = useState<Booking[]>(() => bookingService.getAllBookings());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals & Action States
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  // Rejection Modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Selected time slot unavailable due to production scheduling');

  // Reschedule Modal
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('Morning Session (09:00 AM - 01:00 PM)');
  const [rescheduleReason, setRescheduleReason] = useState('Client requested schedule adjustment');

  // Cancel Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Client cancellation request');

  // Note State
  const [newAdminNote, setNewAdminNote] = useState('');

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadBookings = async (showSpinner = true) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const remote = await firestoreBookingsService.getAllBookings();
      if (Array.isArray(remote)) {
        const mapped = remote.map(mapFirestoreBookingToUniversal);
        const map = new Map<string, Booking>();
        // First local cache
        for (const local of bookingService.getAllBookings()) {
          map.set(local.id, local);
        }
        // Then remote updates
        for (const r of mapped) {
          map.set(r.id, r);
        }
        const sorted = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        setBookings(sorted);
        bookingService.setBookings(sorted);
        if (selectedBooking) {
          const updated = sorted.find((b) => b.id === selectedBooking.id);
          if (updated) setSelectedBooking(updated);
        }
      }
    } catch (e) {
      console.warn('[AdminBookingsView] loadBookings warning:', e);
      setBookings(bookingService.getAllBookings());
    } finally {
      if (showSpinner) setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;
    setIsDeleting(true);
    try {
      await bookingService.deleteBooking(bookingToDelete.id);
      logAuditAction('BOOKING_DELETED', 'Booking', bookingToDelete.id, `Deleted booking #${bookingToDelete.id}`);
      addToast('success', 'Booking Deleted', `Reservation #${bookingToDelete.id} removed permanently.`);
      if (selectedBooking?.id === bookingToDelete.id) {
        setSelectedBooking(null);
      }
      loadBookings(false);
    } catch {
      addToast('error', 'Delete Failed', 'Failed to delete booking.');
    } finally {
      setIsDeleting(false);
      setBookingToDelete(null);
    }
  };

  const handlePurgeAllTestBookings = async () => {
    setIsDeleting(true);
    try {
      const res = await bookingService.clearAllTestBookings();
      logAuditAction('BOOKINGS_PURGED', 'Booking', 'ALL_TEST', `Purged ${res.removedCount} sample/test bookings.`);
      addToast('success', 'Test Bookings Removed', `Cleaned up ${res.removedCount} test/sample bookings.`);
      loadBookings(false);
    } catch {
      addToast('error', 'Cleanup Failed', 'Failed to purge test bookings.');
    } finally {
      setIsDeleting(false);
      setShowPurgeConfirm(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    // 1. Subscribe to bookingService local bus
    const unsubLocal = bookingService.subscribe((updatedBookings) => {
      if (!isMounted) return;
      setBookings(updatedBookings);
      if (selectedBooking) {
        const updated = updatedBookings.find((b) => b.id === selectedBooking.id);
        if (updated) setSelectedBooking(updated);
      }
    });

    // 2. Direct Firestore realtime listener (instant cloud sync across tabs/devices)
    const unsubFirestore = firestoreBookingsService.subscribeAllBookings(
      (remoteDocs) => {
        if (!isMounted) return;
        if (Array.isArray(remoteDocs)) {
          const mapped = remoteDocs.map(mapFirestoreBookingToUniversal);
          const map = new Map<string, Booking>();
          for (const local of bookingService.getAllBookings()) {
            map.set(local.id, local);
          }
          for (const r of mapped) {
            map.set(r.id, r);
          }
          const sorted = Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          setBookings(sorted);
          bookingService.setBookings(sorted);
          setIsLiveConnected(true);
          setIsLoading(false);
        }
      },
      (err) => {
        if (!isMounted) return;
        console.warn('[AdminBookingsView] Firestore subscription error:', err);
        setIsLiveConnected(false);
        setIsLoading(false);
      }
    );

    // Initial manual load from Firestore
    loadBookings(false);

    return () => {
      isMounted = false;
      unsubLocal();
      unsubFirestore();
    };
  }, []);

  // Action Handlers
  const handleConfirmBooking = (booking: Booking) => {
    const author = admin ? admin.name : 'Operations Lead';
    const note = `[Confirmed by ${author} on ${new Date().toLocaleDateString()}] Production crew & assets reserved.`;
    const res = bookingService.confirmBooking(booking.id, note);
    if (res.success && res.booking) {
      logAuditAction('BOOKING_CONFIRMED', 'Booking', booking.id, `Confirmed reservation for ${booking.serviceName}`);
      addToast('success', 'Booking Confirmed', `Reservation #${booking.id} confirmed for ${booking.customer.fullName}.`);
      loadBookings();
    } else {
      addToast('error', 'Confirmation Error', res.error || 'Failed to confirm reservation.');
    }
  };

  const handleOpenReject = (booking: Booking) => {
    setSelectedBooking(booking);
    setRejectReason('Selected time slot unavailable due to prior production commitment');
    setIsRejectModalOpen(true);
  };

  const handleExecuteReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !rejectReason.trim()) return;

    const res = bookingService.rejectBooking(selectedBooking.id, rejectReason.trim());
    if (res.success) {
      logAuditAction('BOOKING_REJECTED', 'Booking', selectedBooking.id, `Rejection reason: ${rejectReason}`);
      addToast('warning', 'Booking Rejected', `Reservation #${selectedBooking.id} marked as rejected.`);
      setIsRejectModalOpen(false);
      loadBookings();
    } else {
      addToast('error', 'Error', res.error || 'Failed to reject booking.');
    }
  };

  const handleOpenReschedule = (booking: Booking) => {
    setSelectedBooking(booking);
    setNewDate(booking.date);
    setNewTime(booking.time);
    setRescheduleReason('Schedule adjusted as requested by client');
    setIsRescheduleModalOpen(true);
  };

  const handleExecuteReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !newDate.trim()) return;

    const res = bookingService.rescheduleBooking(selectedBooking.id, newDate, newTime, rescheduleReason);
    if (res.success) {
      logAuditAction(
        'BOOKING_RESCHEDULED',
        'Booking',
        selectedBooking.id,
        `Rescheduled to ${newDate} (${newTime}). Reason: ${rescheduleReason}`
      );
      addToast('success', 'Booking Rescheduled', `Updated date to ${newDate} for #${selectedBooking.id}.`);
      setIsRescheduleModalOpen(false);
      loadBookings();
    } else {
      addToast('error', 'Reschedule Failed', res.error || 'Date slot unavailable.');
    }
  };

  const handleOpenCancel = (booking: Booking) => {
    setSelectedBooking(booking);
    setCancelReason('Client requested cancellation');
    setIsCancelModalOpen(true);
  };

  const handleExecuteCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !cancelReason.trim()) return;

    const res = bookingService.cancelBooking(selectedBooking.id, cancelReason.trim());
    if (res.success) {
      logAuditAction('BOOKING_CANCELLED', 'Booking', selectedBooking.id, `Cancellation reason: ${cancelReason}`);
      addToast('warning', 'Booking Cancelled', `Reservation #${selectedBooking.id} cancelled.`);
      setIsCancelModalOpen(false);
      loadBookings();
    } else {
      addToast('error', 'Error', res.error || 'Failed to cancel booking.');
    }
  };

  const handleCompleteBooking = (booking: Booking) => {
    const author = admin ? admin.name : 'Lead Supervisor';
    const note = `Service delivered and verified on ${new Date().toLocaleDateString()} by ${author}.`;
    const res = bookingService.completeBooking(booking.id, note);
    if (res.success) {
      logAuditAction('BOOKING_COMPLETED', 'Booking', booking.id, 'Marked session as delivered and completed');
      addToast('success', 'Session Completed', `Reservation #${booking.id} marked as completed.`);
      loadBookings();
    } else {
      addToast('error', 'Error', res.error || 'Failed to mark completed.');
    }
  };

  const handleAddAdminNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !newAdminNote.trim()) return;

    const author = admin ? admin.name : 'Operations Admin';
    const formatted = `[${author} - ${new Date().toLocaleDateString()}]: ${newAdminNote.trim()}`;
    const updatedNotes = selectedBooking.adminNotes ? `${selectedBooking.adminNotes}\n${formatted}` : formatted;

    bookingService.updateBookingStatus(selectedBooking.id, selectedBooking.status, updatedNotes);
    logAuditAction('BOOKING_NOTE_ADDED', 'Booking', selectedBooking.id, `Note added: "${newAdminNote.slice(0, 30)}..."`);
    addToast('info', 'Note Appended', 'Administrative note saved to booking file.');
    setNewAdminNote('');
    loadBookings();
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesDivision = divisionFilter === 'all' || b.divisionId === divisionFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      b.id.toLowerCase().includes(q) ||
      b.customer.fullName.toLowerCase().includes(q) ||
      b.customer.email.toLowerCase().includes(q) ||
      b.serviceName.toLowerCase().includes(q) ||
      (b.customer.company && b.customer.company.toLowerCase().includes(q));

    return matchesStatus && matchesDivision && matchesSearch;
  });

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
      case 'scheduled':
        return (
          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" /> Confirmed
          </span>
        );
      case 'in_progress':
        return (
          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" /> In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'rejected':
        return (
          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <CalendarX className="w-3 h-3" /> Rejected
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <X className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <AlertCircle className="w-3 h-3" /> Pending Approval
          </span>
        );
    }
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-md">
            PAID IN FULL
          </span>
        );
      case 'deposit_paid':
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold px-2 py-0.5 rounded-md">
            DEPOSIT PAID
          </span>
        );
      case 'refunded':
        return (
          <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold px-2 py-0.5 rounded-md">
            REFUNDED
          </span>
        );
      default:
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-md">
            UNPAID
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Bookings & Service Scheduling ({bookings.length})
            </h2>
            {isLiveConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Connecting
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate enterprise productions, cinema shoots, private tours, IT consulting engagements, and client itineraries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPurgeConfirm(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
            className="text-xs font-semibold text-rose-700 hover:bg-rose-50 border-rose-200"
          >
            Purge Test Bookings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadBookings(true)}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            disabled={isRefreshing}
            className="text-xs font-bold"
          >
            {isRefreshing ? 'Syncing...' : 'Refresh Schedule'}
          </Button>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search booking ID, client name, service, email..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold cursor-pointer text-slate-700"
          >
            <option value="all">All Divisions</option>
            <option value="sws">SWS Event Management</option>
            <option value="u1">U1 Studio</option>
            <option value="travels">Mahdev Travels</option>
            <option value="it">Mahdev IT & Solutions</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold cursor-pointer text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="confirmed">Confirmed / Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Booking ID & Date</th>
                <th className="py-3.5 px-4">Client & Entity</th>
                <th className="py-3.5 px-4">Service & Package</th>
                <th className="py-3.5 px-4">Location / Venue</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading && bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                      <p className="text-xs font-medium text-slate-600">Connecting to live reservation telemetry...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No reservations found matching filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 text-[13px]">{b.id}</div>
                      <div className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> {b.date}
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">{b.time}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{b.customer.fullName}</span>
                      <span className="text-[11px] text-slate-500 font-mono block">{b.customer.email}</span>
                      {b.customer.company && (
                        <span className="text-[10px] text-slate-600 font-semibold flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-blue-500" /> {b.customer.company}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="font-bold text-slate-900 block truncate">{b.serviceName}</span>
                      <span className="text-[11px] text-blue-600 font-semibold">{b.packageName}</span>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">{b.divisionName}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-[160px]">
                      <div className="flex items-start gap-1 text-slate-700 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate">{b.location.venueName || b.location.address || b.location.city || 'On-Site'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                      ${b.price.toFixed(2)}
                      <div className="mt-1">{getPaymentBadge(b.paymentStatus)}</div>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(b.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleConfirmBooking(b)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors font-bold text-xs flex items-center gap-1"
                              title="Confirm Booking"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Confirm
                            </button>
                            <button
                              onClick={() => handleOpenReject(b)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors font-bold text-xs"
                              title="Reject Booking"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBooking(b)}
                          className="h-8 px-2.5 text-xs text-blue-600 hover:bg-blue-50 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Dossier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBookingToDelete(b)}
                          className="h-8 px-2 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-slate-200 hover:border-rose-200"
                          title="Delete Booking"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Booking Dossier Modal */}
      {selectedBooking && (
        <AdminModal
          isOpen={!!selectedBooking && !isRejectModalOpen && !isRescheduleModalOpen && !isCancelModalOpen}
          onClose={() => setSelectedBooking(null)}
          title={`Booking Dossier: ${selectedBooking.id}`}
          subtitle={`${selectedBooking.serviceName} — Reserved for ${selectedBooking.customer.fullName}`}
          maxWidth="4xl"
        >
          <div className="space-y-6 text-xs text-slate-700">
            {/* Quick Actions & Status Strip */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Booking Status</span>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                <div className="h-7 w-px bg-slate-200" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Payment</span>
                  {getPaymentBadge(selectedBooking.paymentStatus)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {selectedBooking.status === 'pending' && (
                  <Button
                    variant="electric"
                    size="sm"
                    onClick={() => handleConfirmBooking(selectedBooking)}
                    className="h-8 text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Confirm Reservation
                  </Button>
                )}

                {(selectedBooking.status === 'confirmed' || selectedBooking.status === 'scheduled') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCompleteBooking(selectedBooking)}
                    className="h-8 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Mark Completed
                  </Button>
                )}

                {selectedBooking.status !== 'completed' && selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'rejected' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenReschedule(selectedBooking)}
                      className="h-8 text-xs text-blue-600 border-blue-200"
                    >
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      Reschedule
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenCancel(selectedBooking)}
                      className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Cancel
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBookingToDelete(selectedBooking)}
                  className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Delete Booking
                </Button>
              </div>
            </div>

            {/* Rejection / Cancellation Notes if applicable */}
            {selectedBooking.rejectionReason && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900">
                <span className="font-bold block text-[11px] mb-0.5">Booking Rejection Notice:</span>
                <p>{selectedBooking.rejectionReason}</p>
              </div>
            )}
            {selectedBooking.cancellationReason && (
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-slate-800">
                <span className="font-bold block text-[11px] mb-0.5">Booking Cancellation Notice:</span>
                <p>{selectedBooking.cancellationReason}</p>
              </div>
            )}

            {/* Matrix 2-Col */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Service & Schedule Details */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-900">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Service & Scheduling Details
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Service:</span>
                    <span className="font-bold text-slate-900 text-sm block">{selectedBooking.serviceName}</span>
                    <span className="text-[11px] text-blue-600 font-semibold">{selectedBooking.packageName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Date:</span>
                      <span className="font-mono font-bold text-slate-900">{selectedBooking.date}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Time Slot:</span>
                      <span className="font-medium text-slate-900">{selectedBooking.time}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-500 block text-[10px]">Location & Venue:</span>
                    <p className="font-medium text-slate-800">
                      {selectedBooking.location.venueName ? `${selectedBooking.location.venueName}, ` : ''}
                      {selectedBooking.location.address}
                      {selectedBooking.location.city ? `, ${selectedBooking.location.city}` : ''}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-slate-500">Service Fee:</span>
                    <span className="font-mono font-bold text-base text-emerald-600">
                      ${selectedBooking.price.toFixed(2)} USD
                    </span>
                  </div>
                </div>
              </div>

              {/* Client Dossier & Special Notes */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-900">
                  <User className="w-4 h-4 text-blue-600" />
                  Client Dossier
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Full Name:</span>
                    <span className="font-semibold text-slate-900">{selectedBooking.customer.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-mono text-slate-900">{selectedBooking.customer.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-mono text-slate-900">{selectedBooking.customer.phone}</span>
                  </div>
                  {selectedBooking.customer.company && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Company:</span>
                      <span className="font-semibold text-blue-600">{selectedBooking.customer.company}</span>
                    </div>
                  )}
                  {selectedBooking.notes && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-500 block text-[10px] font-bold mb-0.5">Client Special Requirements:</span>
                      <p className="text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        {selectedBooking.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Notes Thread */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Administrative Operational Notes
              </div>

              <form onSubmit={handleAddAdminNote} className="flex gap-2">
                <input
                  type="text"
                  value={newAdminNote}
                  onChange={(e) => setNewAdminNote(e.target.value)}
                  placeholder="Type an internal note regarding equipment, crew allocation, or permits..."
                  className="w-full px-3.5 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs bg-slate-50"
                />
                <Button variant="electric" size="sm" type="submit" className="shrink-0">
                  <Send className="w-3.5 h-3.5 mr-1" />
                  Save Note
                </Button>
              </form>

              {selectedBooking.adminNotes ? (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 whitespace-pre-line">
                  {selectedBooking.adminNotes}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-2 text-[11px]">No operational notes logged yet.</p>
              )}
            </div>
          </div>
        </AdminModal>
      )}

      {/* Rejection Modal */}
      {selectedBooking && (
        <AdminModal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          title={`Reject Reservation: ${selectedBooking.id}`}
          subtitle="Provide a reason for the reservation decline."
          maxWidth="md"
        >
          <form onSubmit={handleExecuteReject} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Rejection Reason *</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsRejectModalOpen(false)}>
                Back
              </Button>
              <Button variant="danger" size="sm" type="submit">
                Confirm Rejection
              </Button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Reschedule Modal */}
      {selectedBooking && (
        <AdminModal
          isOpen={isRescheduleModalOpen}
          onClose={() => setIsRescheduleModalOpen(false)}
          title={`Reschedule Booking: ${selectedBooking.id}`}
          subtitle={`Current schedule: ${selectedBooking.date} (${selectedBooking.time})`}
          maxWidth="md"
        >
          <form onSubmit={handleExecuteReschedule} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Reservation Date *</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Time Slot *</label>
              <select
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Morning Session (08:00 AM - 12:00 PM)">Morning Session (08:00 AM - 12:00 PM)</option>
                <option value="Afternoon Session (01:00 PM - 05:00 PM)">Afternoon Session (01:00 PM - 05:00 PM)</option>
                <option value="Golden Hour Shoot (04:30 PM - 07:00 PM)">Golden Hour Shoot (04:30 PM - 07:00 PM)</option>
                <option value="Full Day Production (08:00 AM - 08:00 PM)">Full Day Production (08:00 AM - 08:00 PM)</option>
                <option value="Night Gala Coverage (06:00 PM - Midnight)">Night Gala Coverage (06:00 PM - Midnight)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Adjustment Reason</label>
              <input
                type="text"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsRescheduleModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="electric" size="sm" type="submit">
                Apply Reschedule
              </Button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Cancel Modal */}
      {selectedBooking && (
        <AdminModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title={`Cancel Reservation: ${selectedBooking.id}`}
          subtitle="Record client cancellation and release allocated crew."
          maxWidth="md"
        >
          <form onSubmit={handleExecuteCancel} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cancellation Reason *</label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsCancelModalOpen(false)}>
                Back
              </Button>
              <Button variant="danger" size="sm" type="submit">
                Confirm Cancellation
              </Button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Confirm Delete Booking Dialog */}
      <AdminConfirmDialog
        isOpen={!!bookingToDelete}
        title="Delete Reservation Permanently"
        message={`Are you sure you want to delete reservation #${bookingToDelete?.id} (${bookingToDelete?.serviceName})? This action cannot be undone.`}
        confirmLabel="Delete Booking"
        cancelLabel="Keep Booking"
        isDestructive
        onConfirm={handleDeleteBooking}
        onCancel={() => setBookingToDelete(null)}
      />

      {/* Confirm Purge All Test Bookings Dialog */}
      <AdminConfirmDialog
        isOpen={showPurgeConfirm}
        title="Purge All Test / Sample Bookings"
        message="This will permanently delete all demo and test bookings matching test keywords or sample IDs. Genuine client reservations will not be affected."
        confirmLabel="Purge Test Bookings"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={handlePurgeAllTestBookings}
        onCancel={() => setShowPurgeConfirm(false)}
      />
    </div>
  );
};
