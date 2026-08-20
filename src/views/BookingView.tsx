import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  ShieldCheck,
  Clock,
  Sparkles,
  HelpCircle,
  PhoneCall,
  Mail,
  ChevronDown,
} from 'lucide-react';
import { BookingHero } from '../components/booking/BookingHero';
import { BookingWizard } from '../components/booking/BookingWizard';
import { BookingSuccessModal } from '../components/booking/BookingSuccessModal';
import { BookingLookupModal } from '../components/booking/BookingLookupModal';
import { Booking } from '../types/booking';
import { bookingService } from '../services/bookingService';
import { analyticsService } from '../services/analyticsService';

interface BookingViewProps {
  initialDivision?: string;
  initialServiceId?: string;
}

export const BookingView: React.FC<BookingViewProps> = ({
  initialDivision,
  initialServiceId,
}) => {
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [showLookupModal, setShowLookupModal] = useState<boolean>(false);
  const [allBookingsCount, setAllBookingsCount] = useState<number>(() =>
    bookingService.getAllBookings().length
  );

  React.useEffect(() => {
    analyticsService.trackBookingStarted(
      initialDivision || 'all_divisions',
      initialServiceId || 'general_inquiry'
    );
  }, [initialDivision, initialServiceId]);

  const handleBookingCreated = (booking: Booking) => {
    analyticsService.trackBookingCompleted(
      booking.id,
      booking.divisionId,
      booking.serviceId,
      booking.price || 0
    );
    setCreatedBooking(booking);
    setAllBookingsCount(bookingService.getAllBookings().length);
  };

  const handleBookingUpdated = () => {
    setAllBookingsCount(bookingService.getAllBookings().length);
  };

  // FAQs
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqs = [
    {
      q: 'How quickly will my booking be confirmed?',
      a: 'All bookings submitted through our central portal are reviewed by a dedicated division manager within 2 to 4 hours. You will receive an immediate SMS/WhatsApp confirmation and a digital invoice.',
    },
    {
      q: 'Can I reschedule my event or shoot date?',
      a: 'Yes, Mahdev offers complimentary rescheduling up to 48 hours prior to your scheduled event, photography session, or safari, subject to date availability.',
    },
    {
      q: 'What payment methods are supported for deposits?',
      a: 'We accept international bank wire transfers, credit/debit cards, and direct corporate purchase orders for enterprise IT and event production contracts.',
    },
    {
      q: 'Do you provide on-site technical and logistics directors?',
      a: 'Every SWS Event setup, U1 Cinema shoot, and IT deployment includes an on-site lead supervisor and logistics crew to ensure flawless execution.',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* 1. Hero Section */}
      <BookingHero
        activeBookingsCount={allBookingsCount}
        onOpenLookup={() => setShowLookupModal(true)}
      />

      {/* 2. Main Booking Wizard Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 pb-20">
        <BookingWizard
          initialDivision={initialDivision}
          initialServiceId={initialServiceId}
          onBookingCreated={handleBookingCreated}
        />

        {/* 3. Value & Trust Badges Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-neutral-900 text-sm mb-1">
              Enterprise Service Level Guarantee
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Every contract backed by Mahdev Pvt Ltd corporate insurance, bonded crews, and redundant equipment backups.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-neutral-900 text-sm mb-1">
              Zero-Conflict Live Slot Locking
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Our real-time capacity engine prevents double-booking, guaranteeing our master teams devote 100% focus to your session.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-neutral-900 text-sm mb-1">
              Multi-Division Synergy
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Combine grand event decor with U1 cinematography and VIP luxury transport under a single consolidated itinerary.
            </p>
          </div>
        </div>

        {/* 4. Frequently Asked Questions */}
        <div className="mt-16 bg-white rounded-2xl border border-neutral-200 p-8 shadow-xs">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-serif font-bold text-neutral-900">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="divide-y divide-neutral-200">
            {faqs.map((faq, idx) => (
              <div key={idx} className="py-4">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between text-left font-semibold text-neutral-800 text-sm"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 transition-transform ${
                      openFaq === idx ? 'rotate-180 text-amber-600' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <p className="mt-2 text-xs text-neutral-600 leading-relaxed pr-6">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Success Modal */}
      {createdBooking && (
        <BookingSuccessModal
          booking={createdBooking}
          onClose={() => setCreatedBooking(null)}
        />
      )}

      {/* Lookup & Tracking Modal */}
      {showLookupModal && (
        <BookingLookupModal
          onClose={() => setShowLookupModal(false)}
          onBookingUpdated={handleBookingUpdated}
        />
      )}
    </div>
  );
};
