import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  Phone,
  Mail,
  Camera,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { U1_SERVICES, U1_PACKAGES, U1Service, U1Package } from '../../data/u1Data';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { buildWhatsAppMessage, MAHDEV_WHATSAPP_NUMBER } from '../../utils/whatsapp';
import { firestoreInquiriesService } from '../../services/firestore/inquiries';

interface U1BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: U1Service | null;
  initialPackage?: U1Package | null;
}

export const U1BookingModal: React.FC<U1BookingModalProps> = ({
  isOpen,
  onClose,
  initialService,
  initialPackage,
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState(initialService?.id || '');
  const [selectedPackageId, setSelectedPackageId] = useState(initialPackage?.id || '');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTimeSlot, setSessionTimeSlot] = useState('09:00 AM - 12:00 PM (Morning Golden Light)');
  const [locationType, setLocationType] = useState<'studio' | 'location'>('studio');
  const [locationAddress, setLocationAddress] = useState('U1 Studio Cyclorama, Colombo 03');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState('');

  useEffect(() => {
    if (initialService) {
      setSelectedServiceId(initialService.id);
      setSelectedPackageId('');
      if (initialService.id.includes('pre-shoot') || initialService.id.includes('wedding')) {
        setLocationType('location');
        setLocationAddress('Galle Fort / Nuwara Eliya / Destination');
      }
    } else if (initialPackage) {
      setSelectedPackageId(initialPackage.id);
      setSelectedServiceId('');
      if (initialPackage.locationType.includes('On-Location')) {
        setLocationType('location');
        setLocationAddress('Outdoor Location / Venue');
      }
    }
  }, [initialService, initialPackage]);

  if (!isOpen) return null;

  const selectedPkg = selectedPackageId ? U1_PACKAGES.find((p) => p.id === selectedPackageId) : null;
  const selectedSrv = selectedServiceId ? U1_SERVICES.find((s) => s.id === selectedServiceId) : null;
  const selectedName = selectedPkg?.name || selectedSrv?.name || 'Studio Session';
  const selectedSku = (selectedPkg as any)?.sku || (selectedSrv as any)?.sku || `SRV-U1-${selectedSrv?.id?.slice(0, 4)?.toUpperCase() || 'STU'}`;
  const selectedImg = selectedSrv?.imageUrl || selectedPkg?.imageUrl || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80';

  const getFullWhatsAppUrl = (refId?: string) => {
    const text = buildWhatsAppMessage({
      title: selectedName,
      sku: selectedSku,
      category: 'Creative Photography & Cinema',
      divisionName: 'U1 Studio',
      packageName: selectedPkg?.name,
      bookingId: refId || bookingRef || 'WEB-U1-BOOKING',
      date: sessionDate || 'Date to be confirmed',
      time: sessionTimeSlot,
      location: locationType === 'studio' ? 'Colombo Studio Cyclorama' : locationAddress,
      customerName,
      customerPhone,
      customerEmail,
      customerNotes: notes,
      imageUrl: selectedImg,
      type: 'booking',
    });
    return `https://wa.me/${MAHDEV_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !customerPhone) return;

    const ref = `U1-STU-${Math.floor(100000 + Math.random() * 900000)}`;
    setBookingRef(ref);
    setIsSubmitted(true);

    firestoreInquiriesService
      .createInquiry({
        id: ref,
        name: customerName,
        fullName: customerName,
        email: customerEmail,
        phone: customerPhone,
        service: selectedName,
        serviceName: selectedName,
        divisionId: 'u1',
        division: 'U1 Studio (Photography & Cinema)',
        subject: `U1 Studio Session Booking: ${selectedName}`,
        message: `Discipline: ${selectedName}\nTarget Session Date: ${sessionDate || 'To be decided'}\nTime Slot: ${sessionTimeSlot}\nLocation Type: ${locationType === 'studio' ? 'Colombo Studio' : locationAddress}\nSpecial Requirements: ${notes || 'Standard shoot'}`,
        preferredDate: sessionDate,
        location: locationType === 'studio' ? 'Colombo Studio' : locationAddress,
        status: 'New',
        source: 'u1_booking_modal',
      })
      .catch((err) => console.warn('[U1BookingModal] Inquiry dispatch notice:', err));

    try {
      window.open(getFullWhatsAppUrl(ref), '_blank');
    } catch (err) {
      console.warn('[U1BookingModal] WhatsApp redirect error:', err);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setBookingRef('');
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setNotes('');
    onClose();
  };

  const whatsappMessage = encodeURIComponent(
    `Hello U1 Studio (Mahdev), I would like to schedule a session for ${selectedName} on ${sessionDate || 'TBD'} (${sessionTimeSlot}) at ${locationType === 'studio' ? 'Colombo Studio' : locationAddress}. Name: ${customerName}. Ref: ${bookingRef || 'Direct Web Booking'}.`
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold text-slate-900">
                  Book Studio Session / Production Shoot
                </h3>
                <Badge variant="electric" size="sm">
                  U1 Studio
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Official Mahdev Creative Photography & Cinema Booking
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {isSubmitted ? (
            /* Confirmation Ticket */
            <div className="text-center py-6 sm:py-8 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200 animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h4 className="font-display text-2xl font-bold text-slate-900">
                  Session Reservation Logged
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Thank you, <span className="font-semibold text-slate-900">{customerName}</span>. Your photography session brief has been queued with our master photographer.
                </p>
              </div>

              {/* Ticket */}
              <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Reference ID:</span>
                  <span className="font-mono font-bold text-[#0052FF]">{bookingRef}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Selected Discipline:</span>
                  <span className="font-semibold text-slate-800">{selectedName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Date & Slot:</span>
                  <span className="font-semibold text-slate-800">
                    {sessionDate || 'Date to be confirmed'} • {sessionTimeSlot.split('(')[0]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-semibold text-slate-800">
                    {locationType === 'studio' ? 'U1 Studio Cyclorama (Colombo)' : locationAddress}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span className="font-semibold text-slate-800">{customerPhone}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                  <span className="text-slate-500">Dispatched To:</span>
                  <span className="font-semibold text-[#0052FF]">info.mahdev.lk@gmail.com</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={getFullWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-md transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat with Lead Photographer</span>
                </a>

                <Button variant="outline" size="md" onClick={resetForm} className="w-full sm:w-auto text-xs">
                  Done & Return
                </Button>
              </div>

              <div className="text-[11px] text-slate-400">
                Our studio coordinator will reach out within 12 hours to confirm lighting requirements & wardrobe styling.
              </div>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Package or Service Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Select Package or Studio Service
                </label>
                <select
                  value={
                    selectedPackageId
                      ? `pkg:${selectedPackageId}`
                      : selectedServiceId
                      ? `svc:${selectedServiceId}`
                      : 'custom'
                  }
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <optgroup label="Curated Packages">
                    {U1_PACKAGES.map((p) => (
                      <option key={p.id} value={`pkg:${p.id}`}>
                        {p.name} ({p.price})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Individual 11 Studio Services">
                    {U1_SERVICES.map((s) => (
                      <option key={s.id} value={`svc:${s.id}`}>
                        {s.name} (from {s.startingPrice})
                      </option>
                    ))}
                  </optgroup>
                  <option value="custom">Custom Commercial / Multi-Day Shoot</option>
                </select>
              </div>

              {/* Date & Time Slot Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Preferred Session Date
                  </label>
                  <input
                    type="date"
                    required
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Time Slot
                  </label>
                  <select
                    value={sessionTimeSlot}
                    onChange={(e) => setSessionTimeSlot(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="09:00 AM - 12:00 PM (Morning Golden Light)">
                      09:00 AM - 12:00 PM (Morning Golden Light)
                    </option>
                    <option value="01:00 PM - 04:00 PM (Afternoon Studio Session)">
                      01:00 PM - 04:00 PM (Afternoon Studio Session)
                    </option>
                    <option value="04:30 PM - 07:00 PM (Twilight Golden Hour)">
                      04:30 PM - 07:00 PM (Twilight Golden Hour)
                    </option>
                    <option value="Full Day Production (08:00 AM - 08:00 PM)">
                      Full Day Production (08:00 AM - 08:00 PM)
                    </option>
                  </select>
                </div>
              </div>

              {/* Studio vs On-Location Radio */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Location Preference
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setLocationType('studio');
                      setLocationAddress('U1 Studio Cyclorama, Colombo 03');
                    }}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      locationType === 'studio'
                        ? 'border-[#0052FF] bg-blue-50/40 ring-1 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <Camera className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">U1 Colombo Studio</div>
                      <div className="text-[11px] text-slate-500">25ft White Cyclorama, Air-Con & Lighting</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLocationType('location');
                      if (locationAddress.includes('Colombo 03')) setLocationAddress('');
                    }}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      locationType === 'location'
                        ? 'border-[#0052FF] bg-blue-50/40 ring-1 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">On-Location / Destination</div>
                      <div className="text-[11px] text-slate-500">Hotel, Resort, Beach, Heritage Site or Office</div>
                    </div>
                  </button>
                </div>

                {locationType === 'location' && (
                  <Input
                    label="On-Location Venue / Destination Address"
                    placeholder="e.g. Cinnamon Grand Ballroom or Galle Fort Lighthouse"
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    required
                  />
                )}
              </div>

              {/* Customer Details */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Full Name"
                  required
                  placeholder="e.g., Anjali Perera"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <Input
                  label="Email Address"
                  type="email"
                  required
                  placeholder="anjali@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
                <Input
                  label="Phone / WhatsApp"
                  required
                  placeholder="075 092 8078"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              {/* Notes & Moodboard link */}
              <Textarea
                label="Creative Vision, Styling Notes & Moodboard Link (Pinterest/Drive)"
                placeholder="Share your intended color aesthetic, number of wardrobe looks, or specific shots needed..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              {/* Notice */}
              <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center gap-2.5 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  No online payment charged now. Our studio manager will confirm studio calendar availability with you directly.
                </span>
              </div>

              {/* Footer Buttons */}
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
                  Reserve Studio Session
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
