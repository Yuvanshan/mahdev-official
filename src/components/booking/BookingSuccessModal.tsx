import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle,
  Copy,
  Check,
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  Download,
  X,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { Booking } from '../../types/booking';
import { COMPANY_INFO } from '../../config/company';
import { buildWhatsAppMessage, MAHDEV_WHATSAPP_NUMBER } from '../../utils/whatsapp';

interface BookingSuccessModalProps {
  booking: Booking;
  onClose: () => void;
}

export const BookingSuccessModal: React.FC<BookingSuccessModalProps> = ({
  booking,
  onClose,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(booking.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCalendar = () => {
    // Generate simple .ics calendar file
    const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//${COMPANY_INFO.legalName}//Universal Booking System//EN
BEGIN:VEVENT
UID:${booking.id}@${COMPANY_INFO.domain}
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${String(booking.date || '').replace(/-/g, '')}T090000Z
SUMMARY:${booking.serviceName} (${booking.divisionName})
DESCRIPTION:Booking ID: ${booking.id}\\nPackage: ${booking.packageName}\\nLocation: ${booking.location.address}\\nNotes: ${booking.notes}
LOCATION:${booking.location.address}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Mahdev_Booking_${booking.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-neutral-200 my-8"
      >
        {/* Success Header */}
        <div className="bg-neutral-900 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <CheckCircle className="w-8 h-8" />
          </div>

          <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono font-semibold">
            Booking Received & Logged
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif text-white mt-1 mb-2">
            Reservation Confirmed
          </h2>
          <p className="text-xs text-neutral-300 max-w-md mx-auto">
            Your booking has been registered in the Mahdev central system. Our concierge team has been notified.
          </p>

          {/* Booking ID Highlight Banner */}
          <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 bg-neutral-800/90 border border-neutral-700 rounded-xl">
            <span className="text-xs text-neutral-400 font-mono uppercase">Booking ID:</span>
            <span className="text-base font-mono font-bold text-amber-400">{booking.id}</span>
            <button
              onClick={handleCopyId}
              className="p-1 text-neutral-400 hover:text-white transition-colors"
              title="Copy Booking ID"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Booking Details Summary */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Service and Division */}
          <div className="pb-4 border-b border-neutral-100 flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {booking.divisionName}
              </span>
              <h3 className="text-base font-bold text-neutral-900 mt-1.5">{booking.serviceName}</h3>
              <p className="text-xs text-neutral-500">{booking.packageName}</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold font-mono text-neutral-900">
                ${booking.price.toFixed(2)}
              </span>
              <span className="block text-[10px] text-neutral-400 uppercase">{booking.currency}</span>
            </div>
          </div>

          {/* Schedule & Location Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-mono">Date</span>
                <span className="font-semibold text-neutral-800">{booking.date}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-mono">Time Window</span>
                <span className="font-semibold text-neutral-800 truncate block">{booking.time}</span>
              </div>
            </div>

            <div className="sm:col-span-2 flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-mono">Venue / Address</span>
                <span className="font-semibold text-neutral-800">{booking.location.address} {booking.location.city ? `(${booking.location.city})` : ''}</span>
              </div>
            </div>
          </div>

          {/* Customer Dispatch Confirmation */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Confirmation Dispatched to {booking.customer.email}</span>
              <span className="text-emerald-700 text-[11px] leading-relaxed block mt-0.5">
                Our operations director will connect with you via {booking.customer.preferredContactMethod?.toUpperCase() || 'WHATSAPP'} at {booking.customer.phone} to finalize setup logistics.
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownloadCalendar}
              className="flex-1 py-3 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Add to Calendar (.ics)</span>
            </button>

            <a
              href={`https://wa.me/${MAHDEV_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                buildWhatsAppMessage({
                  title: booking.serviceName,
                  sku: (booking as any).sku,
                  bookingId: booking.id,
                  packageName: booking.packageName,
                  date: booking.date,
                  time: booking.time,
                  location: booking.location?.address,
                  customerName: booking.customer?.fullName,
                  customerPhone: booking.customer?.phone,
                  customerEmail: booking.customer?.email,
                  price: booking.price,
                  type: 'booking',
                })
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Confirm on WhatsApp (075 092 8078)</span>
            </a>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 text-center text-xs text-neutral-400 hover:text-neutral-700 font-medium"
          >
            Close & Return to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
};
