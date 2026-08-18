import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  Clock3,
  XCircle,
  RotateCcw,
  CheckCheck,
  Building,
  DollarSign,
  Shield,
  Send,
  Sparkles,
} from 'lucide-react';
import { Booking, BookingStatus } from '../../types/booking';
import { bookingService } from '../../services/bookingService';

interface BookingLookupModalProps {
  onClose: () => void;
  onBookingUpdated?: () => void;
}

export const BookingLookupModal: React.FC<BookingLookupModalProps> = ({
  onClose,
  onBookingUpdated,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Booking[]>(() =>
    bookingService.getAllBookings()
  );
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(
    searchResults[0] || null
  );

  // Admin action states
  const [adminMode, setAdminMode] = useState<boolean>(false);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string>('');

  // Reschedule state
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('');
  const [rescheduleError, setRescheduleError] = useState<string>('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(bookingService.getAllBookings());
    } else {
      const results = bookingService.lookupBookingsByCustomer(searchQuery);
      setSearchResults(results);
      if (results.length > 0) {
        setSelectedBooking(results[0]);
      } else {
        setSelectedBooking(null);
      }
    }
  };

  const refreshBooking = (bookingId: string) => {
    const updated = bookingService.getBookingById(bookingId);
    if (updated) {
      setSelectedBooking({ ...updated });
      setSearchResults(bookingService.getAllBookings());
      if (onBookingUpdated) onBookingUpdated();
    }
  };

  // Admin Actions
  const handleConfirm = () => {
    if (!selectedBooking) return;
    const res = bookingService.confirmBooking(selectedBooking.id, adminNotes);
    if (res.success) {
      setActionSuccessMessage(`Booking ${selectedBooking.id} marked as CONFIRMED.`);
      refreshBooking(selectedBooking.id);
      setTimeout(() => setActionSuccessMessage(''), 3000);
    }
  };

  const handleReject = () => {
    if (!selectedBooking) return;
    const reason = window.prompt('Please provide reason for rejection:', 'Operational conflict / capacity reached');
    if (reason) {
      const res = bookingService.rejectBooking(selectedBooking.id, reason);
      if (res.success) {
        setActionSuccessMessage(`Booking ${selectedBooking.id} has been REJECTED.`);
        refreshBooking(selectedBooking.id);
        setTimeout(() => setActionSuccessMessage(''), 3000);
      }
    }
  };

  const handleCancel = () => {
    if (!selectedBooking) return;
    const reason = window.prompt('Reason for cancellation:', 'Requested by client / event postponed');
    if (reason) {
      const res = bookingService.cancelBooking(selectedBooking.id, reason);
      if (res.success) {
        setActionSuccessMessage(`Booking ${selectedBooking.id} has been CANCELLED.`);
        refreshBooking(selectedBooking.id);
        setTimeout(() => setActionSuccessMessage(''), 3000);
      }
    }
  };

  const handleComplete = () => {
    if (!selectedBooking) return;
    const res = bookingService.completeBooking(selectedBooking.id, 'Service execution verified & completed.');
    if (res.success) {
      setActionSuccessMessage(`Booking ${selectedBooking.id} marked as COMPLETED.`);
      refreshBooking(selectedBooking.id);
      setTimeout(() => setActionSuccessMessage(''), 3000);
    }
  };

  const handleExecuteReschedule = () => {
    if (!selectedBooking || !newDate || !newTime) {
      setRescheduleError('Please provide both new date and time slot.');
      return;
    }
    const res = bookingService.rescheduleBooking(selectedBooking.id, newDate, newTime, 'Client rescheduled via portal');
    if (res.success) {
      setIsRescheduling(false);
      setRescheduleError('');
      setActionSuccessMessage(`Booking ${selectedBooking.id} rescheduled to ${newDate}.`);
      refreshBooking(selectedBooking.id);
      setTimeout(() => setActionSuccessMessage(''), 3000);
    } else {
      setRescheduleError(res.error || 'Failed to reschedule.');
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5" /> Confirmed
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock3 className="w-3.5 h-3.5" /> Scheduled
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-900 text-white">
            <CheckCheck className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300">
            <Clock3 className="w-3.5 h-3.5" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-neutral-200 my-6 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-neutral-900 text-white px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-serif font-semibold text-white">
                Universal Booking Manager & Status Tracker
              </h3>
              <p className="text-xs text-neutral-400">
                Search by Booking ID, customer email, or phone number
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Admin Test Mode */}
            <button
              onClick={() => setAdminMode(!adminMode)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-all flex items-center gap-1.5 ${
                adminMode
                  ? 'bg-amber-500 text-neutral-950 font-bold border-amber-400'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Mode: {adminMode ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Success Alert */}
        {actionSuccessMessage && (
          <div className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-semibold flex items-center justify-between">
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="p-4 bg-neutral-50 border-b border-neutral-200">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Booking ID (e.g. BK-2026-1042), customer name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Main Body: 2 Columns (List on Left, Details on Right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Column: Results List */}
          <div className="md:col-span-5 border-r border-neutral-200 overflow-y-auto max-h-[500px] p-3 space-y-2 bg-neutral-50/50">
            {searchResults.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                No matching bookings found.
              </div>
            ) : (
              searchResults.map((b) => {
                const isSelected = selectedBooking?.id === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      setSelectedBooking(b);
                      setIsRescheduling(false);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white border-amber-500 shadow-sm ring-1 ring-amber-500/20'
                        : 'bg-white border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-amber-700">
                        {b.id}
                      </span>
                      {getStatusBadge(b.status)}
                    </div>
                    <h4 className="text-xs font-bold text-neutral-900 truncate">
                      {b.serviceName}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-1 font-mono">
                      <span>{b.customer.fullName}</span>
                      <span>{b.date}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Selected Booking Inspector & Actions */}
          <div className="md:col-span-7 p-6 overflow-y-auto max-h-[500px] space-y-6">
            {selectedBooking ? (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-start justify-between pb-4 border-b border-neutral-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-neutral-900">
                        {selectedBooking.id}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        {selectedBooking.divisionName}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-neutral-900 mt-1">
                      {selectedBooking.serviceName}
                    </h3>
                    <p className="text-xs text-neutral-500">{selectedBooking.packageName}</p>
                  </div>
                  <div>{getStatusBadge(selectedBooking.status)}</div>
                </div>

                {/* Logistics Specs Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                    <span className="text-neutral-400 block text-[10px] uppercase font-mono">Date</span>
                    <span className="font-semibold text-neutral-800">{selectedBooking.date}</span>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                    <span className="text-neutral-400 block text-[10px] uppercase font-mono">Time Window</span>
                    <span className="font-semibold text-neutral-800 truncate block">{selectedBooking.time}</span>
                  </div>
                  <div className="col-span-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                    <span className="text-neutral-400 block text-[10px] uppercase font-mono">Location</span>
                    <span className="font-semibold text-neutral-800">{selectedBooking.location.address} {selectedBooking.location.city ? `(${selectedBooking.location.city})` : ''}</span>
                  </div>
                </div>

                {/* Customer Contact Section */}
                <div className="space-y-2 text-xs">
                  <span className="font-bold text-neutral-700 uppercase tracking-wider block text-[11px]">
                    Customer & Billing
                  </span>
                  <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Full Name:</span>
                      <span className="font-semibold text-neutral-900">{selectedBooking.customer.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Email:</span>
                      <span className="font-mono text-neutral-900">{selectedBooking.customer.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Phone:</span>
                      <span className="font-mono text-neutral-900">{selectedBooking.customer.phone}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-neutral-200">
                      <span className="text-neutral-500">Total Price & Status:</span>
                      <span className="font-mono font-bold text-neutral-900">
                        ${selectedBooking.price.toFixed(2)} ({selectedBooking.paymentStatus.toUpperCase()})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedBooking.notes && (
                  <div className="text-xs">
                    <span className="font-bold text-neutral-700 uppercase tracking-wider block text-[11px] mb-1">
                      Client Special Notes
                    </span>
                    <p className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 text-neutral-700 text-xs italic">
                      "{selectedBooking.notes}"
                    </p>
                  </div>
                )}

                {/* Rejection / Cancellation Reason if any */}
                {selectedBooking.rejectionReason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                    <span className="font-bold block">Rejection Reason:</span>
                    <span>{selectedBooking.rejectionReason}</span>
                  </div>
                )}

                {/* Rescheduling Form Drawer */}
                {isRescheduling ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-blue-900 uppercase">Reschedule Booking</h4>
                      <button
                        onClick={() => setIsRescheduling(false)}
                        className="text-xs text-neutral-500 hover:text-neutral-900"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-neutral-600 block mb-1">New Date</label>
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          className="w-full p-2 bg-white border border-neutral-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-neutral-600 block mb-1">New Time</label>
                        <input
                          type="text"
                          placeholder="e.g. 09:00 AM - 12:00 PM"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                          className="w-full p-2 bg-white border border-neutral-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    {rescheduleError && (
                      <p className="text-xs text-red-600">{rescheduleError}</p>
                    )}

                    <button
                      onClick={handleExecuteReschedule}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Save New Schedule
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsRescheduling(true);
                        setNewDate(selectedBooking.date);
                        setNewTime(selectedBooking.time);
                      }}
                      className="flex-1 py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reschedule Booking</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl transition-colors border border-rose-200"
                    >
                      Cancel Booking
                    </button>
                  </div>
                )}

                {/* Admin Preparation Controls (View, Confirm, Reject, Complete, Reschedule) */}
                {adminMode && (
                  <div className="pt-4 border-t border-neutral-200 space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-600" />
                      <h4 className="text-xs font-bold text-neutral-900 uppercase">
                        Admin Operational Actions (Ready for Management)
                      </h4>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={handleConfirm}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={handleComplete}
                        className="py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        Complete
                      </button>
                      <button
                        onClick={handleReject}
                        className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-neutral-400">
                Select a booking from the left panel to inspect details.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
