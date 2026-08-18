import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Sparkles,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Users,
  Clock,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  DollarSign,
} from 'lucide-react';
import { SWS_SERVICES, SWS_PACKAGES, SWSService, SWSPackage } from '../../data/swsData';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { COMPANY_INFO } from '../../config/company';

interface SWSBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: SWSService | null;
  initialPackage?: SWSPackage | null;
  isQuoteMode?: boolean;
}

export const SWSBookingModal: React.FC<SWSBookingModalProps> = ({
  isOpen,
  onClose,
  initialService,
  initialPackage,
  isQuoteMode = false,
}) => {
  const [eventType, setEventType] = useState('Wedding');
  const [selectedServiceId, setSelectedServiceId] = useState(initialService?.id || '');
  const [selectedPackageId, setSelectedPackageId] = useState(initialPackage?.id || '');
  const [eventDate, setEventDate] = useState('');
  const [alternateDate, setAlternateDate] = useState('');
  const [venueLocation, setVenueLocation] = useState('Colombo / Western Province');
  const [guestCount, setGuestCount] = useState('150 - 300 Guests');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [budgetTier, setBudgetTier] = useState('Standard (LKR 350,000 - 800,000)');

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [inquiryRef, setInquiryRef] = useState('');

  useEffect(() => {
    if (initialService) {
      setSelectedServiceId(initialService.id);
      setSelectedPackageId('');
      if (initialService.id.includes('wedding')) setEventType('Wedding');
      else if (initialService.id.includes('birthday')) setEventType('Birthday');
      else if (initialService.id.includes('corporate')) setEventType('Corporate');
      else if (initialService.id.includes('engagement')) setEventType('Engagement');
    } else if (initialPackage) {
      setSelectedPackageId(initialPackage.id);
      setSelectedServiceId('');
      if (initialPackage.name.includes('Corporate')) setEventType('Corporate');
      else setEventType('Wedding');
    }
  }, [initialService, initialPackage]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !clientPhone) return;

    const ref = `SWS-EVT-${Math.floor(100000 + Math.random() * 900000)}`;
    setInquiryRef(ref);
    setIsSubmitted(true);
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setInquiryRef('');
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setSpecialRequirements('');
    onClose();
  };

  const whatsappMessage = encodeURIComponent(
    `Hello SWS Event Management (Mahdev), I am requesting a ${isQuoteMode ? 'Quote' : 'Booking Consultation'} for ${eventType} on ${eventDate || 'TBD'} in ${venueLocation} for ~${guestCount}. Ref: ${inquiryRef || 'Direct Web Inquiry'}. Name: ${clientName}`
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold text-slate-900">
                  {isQuoteMode ? 'Request Custom Event Quote' : 'Reserve Event Consultation'}
                </h3>
                <Badge variant="electric" size="sm">
                  SWS Events
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Official Mahdev Event Management Booking & Production Dispatch
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close booking modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {isSubmitted ? (
            /* Success State */
            <div className="text-center py-6 sm:py-8 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200 animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h4 className="font-display text-2xl font-bold text-slate-900">
                  Inquiry Dispatched Successfully
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Thank you, <span className="font-semibold text-slate-900">{clientName}</span>. Your event brief has been logged into the Mahdev SWS production schedule.
                </p>
              </div>

              {/* Inquiry Summary Ticket */}
              <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Reference ID:</span>
                  <span className="font-mono font-bold text-[#0052FF]">{inquiryRef}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Event Type:</span>
                  <span className="font-semibold text-slate-800">{eventType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Venue / Location:</span>
                  <span className="font-semibold text-slate-800">{venueLocation}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Target Date:</span>
                  <span className="font-semibold text-slate-800">{eventDate || 'Flexible / TBD'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Direct Contact:</span>
                  <span className="font-semibold text-slate-800">{clientPhone}</span>
                </div>
              </div>

              {/* WhatsApp Quick Link */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`https://wa.me/94750928078?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-md transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat on WhatsApp Now</span>
                </a>

                <Button variant="outline" size="md" onClick={resetForm} className="w-full sm:w-auto text-xs">
                  Done & Return
                </Button>
              </div>

              <div className="text-[11px] text-slate-400">
                Our lead wedding & corporate event producer will call you within 24 business hours.
              </div>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Event Type & Selected Service/Package */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Event Type
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  >
                    <option value="Wedding">Wedding & Poruwa / Church Ceremony</option>
                    <option value="Engagement">Engagement & Ring Exchange</option>
                    <option value="Corporate">Corporate Summit / Gala / Product Launch</option>
                    <option value="Birthday">Milestone Birthday / Social Party</option>
                    <option value="Concert">Concert / Musical Event Stage</option>
                    <option value="Other">Other Bespoke Event</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Interested Service / Package
                  </label>
                  <select
                    value={selectedPackageId ? `pkg:${selectedPackageId}` : selectedServiceId ? `svc:${selectedServiceId}` : 'custom'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.startsWith('pkg:')) {
                        setSelectedPackageId(val.replace('pkg:', ''));
                        setSelectedServiceId('');
                      } else if (val.startsWith('svc:')) {
                        setSelectedServiceId(val.replace('svc:', ''));
                        setSelectedPackageId('');
                      } else {
                        setSelectedServiceId('');
                        setSelectedPackageId('');
                      }
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  >
                    <optgroup label="Turnkey Packages">
                      {SWS_PACKAGES.map((p) => (
                        <option key={p.id} value={`pkg:${p.id}`}>
                          {p.name} ({p.price})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Individual 13 Services">
                      {SWS_SERVICES.map((s) => (
                        <option key={s.id} value={`svc:${s.id}`}>
                          {s.name} (from {s.startingPrice})
                        </option>
                      ))}
                    </optgroup>
                    <option value="custom">Custom Multi-Service Scope</option>
                  </select>
                </div>
              </div>

              {/* Event Dates & Guest Attendance */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Target Event Date
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Alternate Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={alternateDate}
                    onChange={(e) => setAlternateDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Estimated Guests
                  </label>
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Under 50 Guests">Under 50 Guests (Intimate)</option>
                    <option value="50 - 150 Guests">50 - 150 Guests</option>
                    <option value="150 - 300 Guests">150 - 300 Guests</option>
                    <option value="300 - 600 Guests">300 - 600 Guests (Grand)</option>
                    <option value="600+ Guests">600+ Guests (Large Scale)</option>
                  </select>
                </div>
              </div>

              {/* Location & Budget Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Venue / Location Hub
                  </label>
                  <select
                    value={venueLocation}
                    onChange={(e) => setVenueLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Colombo / Western Province">Colombo / Western Province</option>
                    <option value="Kandy / Central Province">Kandy / Central Province</option>
                    <option value="Galle / Southern Coast">Galle / Southern Coast</option>
                    <option value="Bentota / Kalutara Beach">Bentota / Kalutara Beach</option>
                    <option value="Negombo / North Western">Negombo / North Western</option>
                    <option value="Destination / Other Area">Destination / Other Area in Sri Lanka</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Estimated Production Budget
                  </label>
                  <select
                    value={budgetTier}
                    onChange={(e) => setBudgetTier(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Essential (LKR 150,000 - 350,000)">Essential (LKR 150,000 - 350,000)</option>
                    <option value="Standard (LKR 350,000 - 800,000)">Standard (LKR 350,000 - 800,000)</option>
                    <option value="Luxury (LKR 800,000 - 1,500,000)">Luxury (LKR 800,000 - 1,500,000)</option>
                    <option value="Royalty Grand (LKR 1,500,000+)">Royalty Grand (LKR 1,500,000+)</option>
                    <option value="Flexible / Quote Needed">Flexible / Quote Needed</option>
                  </select>
                </div>
              </div>

              {/* Client Contact Info */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Your Full Name"
                  required
                  placeholder="e.g., Rohan Wijesuriya"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
                <Input
                  label="Email Address"
                  type="email"
                  required
                  placeholder="rohan@example.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
                <Input
                  label="Phone / WhatsApp"
                  required
                  placeholder="+94 77 ..."
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>

              {/* Requirements */}
              <Textarea
                label="Vision, Color Palette, Venue Details & Special Requests"
                placeholder="Describe your color theme, specific floral desires, audio-visual needs, or timeline notes..."
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
              />

              {/* Notice */}
              <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center gap-2.5 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  No immediate online payment required. SWS will issue a tailored scope specification & date lock confirmation.
                </span>
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <Button variant="outline" size="md" onClick={onClose} type="button" className="text-xs">
                  Cancel
                </Button>
                <Button
                  variant="electric"
                  size="md"
                  type="submit"
                  leftIcon={<Calendar className="w-3.5 h-3.5" />}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  {isQuoteMode ? 'Submit Quote Request' : 'Confirm & Reserve Consultation'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
