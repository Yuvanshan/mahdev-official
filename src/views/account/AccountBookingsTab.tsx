import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Building,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Search,
  Filter,
  Plus,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { Booking } from '../../types/booking';
import { Button } from '../../components/ui/Button';

interface AccountBookingsTabProps {
  bookings: Booking[];
  onNavigate: (path: string) => void;
}

export const AccountBookingsTab: React.FC<AccountBookingsTabProps> = ({
  bookings,
  onNavigate,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBookings = bookings.filter((b) => {
    const matchesFilter = filterStatus === 'all' || b.status === filterStatus || b.paymentStatus === filterStatus;
    const matchesSearch =
      searchQuery === '' ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.divisionName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getWhatsAppConciergeLink = (b: Booking) => {
    const text = encodeURIComponent(
      `Hello Mahdev Concierge,\n\nI am inquiring about my booking with Reference: *${b.id}*\nService: *${b.serviceName}* (${b.packageName})\nDate: *${b.date}* (${b.time})\nStatus: *${b.status.toUpperCase()}*.\n\nPlease assist me with scheduling details.`
    );
    return `https://wa.me/94750928078?text=${text}`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              My Service & Event Bookings ({bookings.length})
            </h3>
            <p className="text-xs text-slate-500">
              Universal bookings across SWS Events, U1 Studios, Mahdev Travels, and IT Solutions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bookings by service or ID..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
              />
            </div>
            <Button
              variant="electric"
              size="sm"
              onClick={() => onNavigate('/book')}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs font-bold shrink-0"
            >
              New Booking
            </Button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Bookings' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'scheduled', label: 'Scheduled' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'completed', label: 'Completed' },
            { id: 'paid', label: 'Paid & Settled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <Calendar className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display text-base font-bold text-slate-900">No Bookings Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || filterStatus !== 'all'
                ? 'No bookings match your current filter. Try selecting "All Bookings".'
                : "You don't have any event, photography, travel, or IT service reservations yet."}
            </p>
          </div>
          <Button
            variant="electric"
            size="sm"
            onClick={() => onNavigate('/book')}
            leftIcon={<Plus className="w-4 h-4" />}
            className="text-xs font-bold"
          >
            Schedule a Service Booking
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                    {b.id}
                  </span>
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                    {b.divisionName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      b.paymentStatus === 'paid'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : b.paymentStatus === 'deposit_paid'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    Payment: {b.paymentStatus.toUpperCase().replace('_', ' ')}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      b.status === 'confirmed' || b.status === 'scheduled'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : b.status === 'in_progress'
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    Status: {b.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Service & Reservation Details */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 space-y-2.5">
                  <h4 className="font-display text-sm font-bold text-slate-900">
                    {b.serviceName}
                  </h4>
                  <div className="text-xs text-slate-600 font-semibold bg-slate-50 p-2 rounded-xl border border-slate-100 inline-block">
                    Package: {b.packageName}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>
                        <strong>Date:</strong> {b.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>
                        <strong>Time:</strong> {b.time}
                      </span>
                    </div>
                    <div className="sm:col-span-2 flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Location:</strong> {b.location.address}
                        {b.location.venueName ? ` (${b.location.venueName})` : ''}
                      </span>
                    </div>
                  </div>

                  {b.notes && (
                    <div className="text-[11px] text-slate-500 italic bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                      <strong>Client Notes:</strong> {b.notes}
                    </div>
                  )}
                </div>

                {/* Price & Actions */}
                <div className="md:col-span-4 flex flex-col justify-between items-start md:items-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-400 block">Reservation Fee:</span>
                    <span className="font-mono text-lg font-bold text-slate-900">
                      ${b.price.toFixed(2)} {b.currency}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <a
                      href={getWhatsAppConciergeLink(b)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Concierge Desk</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
