import React, { useState, useEffect } from 'react';
import {
  X,
  Compass,
  Calendar,
  Users,
  Car,
  CheckCircle2,
  Send,
  Phone,
  Mail,
  MessageSquare,
  Sparkles,
  MapPin,
  ShieldCheck,
  AlertCircle,
  Globe,
} from 'lucide-react';
import { TRAVEL_PACKAGES, DAY_TOURS, VEHICLES, TravelPackage, DayTour, Vehicle } from '../../data/travelsData';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { COMPANY_INFO, getTelLink, getMailtoLink } from '../../config/company';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { buildWhatsAppMessage, MAHDEV_WHATSAPP_NUMBER } from '../../utils/whatsapp';
import { firestoreInquiriesService } from '../../services/firestore/inquiries';

interface TravelsBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPackage?: TravelPackage | null;
  initialTour?: DayTour | null;
  initialVehicle?: Vehicle | null;
}

export const TravelsBookingModal: React.FC<TravelsBookingModalProps> = ({
  isOpen,
  onClose,
  initialPackage,
  initialTour,
  initialVehicle,
}) => {
  const { companySettings } = useFirestoreDataContext();
  const primaryPhone = companySettings?.primaryPhone || COMPANY_INFO.primaryPhone;
  const contactEmail = companySettings?.email || COMPANY_INFO.email;
  const [packageType, setPackageType] = useState<string>('custom');
  const [startDate, setStartDate] = useState('');
  const [durationDays, setDurationDays] = useState('7');
  const [adults, setAdults] = useState('2');
  const [children, setChildren] = useState('0');
  const [transportPreference, setTransportPreference] = useState('prado-4x4');
  const [hotelTier, setHotelTier] = useState('5-star-luxury');

  // Customer Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');

  // Status
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketRef, setTicketRef] = useState('');

  useEffect(() => {
    if (initialPackage) {
      setPackageType(`pkg-${initialPackage.id}`);
    } else if (initialTour) {
      setPackageType(`tour-${initialTour.id}`);
    } else if (initialVehicle) {
      setTransportPreference(initialVehicle.id);
    }
  }, [initialPackage, initialTour, initialVehicle]);

  if (!isOpen) return null;

  const getWhatsAppBookingLink = (customRef?: string) => {
    const effectiveRef = customRef || ticketRef || 'MAH-TRV-DIRECT';
    const effectiveSku = `PKG-TRV-${packageType.slice(0, 4).toUpperCase()}`;
    const text = buildWhatsAppMessage({
      title: packageType,
      sku: effectiveSku,
      category: 'Luxury Travel & Private Expeditions',
      divisionName: 'Mahdev Travels',
      bookingId: effectiveRef,
      date: startDate || 'Flexible Start Date',
      location: `Sri Lanka (${country || 'International Traveler'})`,
      customerName: fullName,
      customerPhone: phone,
      customerEmail: email,
      customerNotes: `Guests: ${adults} Adults, ${children} Children | Transport: ${transportPreference} | Hotel: ${hotelTier} | Notes: ${specialRequirements || 'None'}`,
      imageUrl: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=85',
      type: 'booking',
    });
    return `https://wa.me/${MAHDEV_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone) return;

    // Generate unique inquiry code
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const ref = `MAH-TRV-${randomCode}`;
    setTicketRef(ref);
    setIsSubmitted(true);

    const matchedPkg = TRAVEL_PACKAGES.find((p) => `pkg-${p.id}` === packageType) || initialPackage;
    const matchedTour = DAY_TOURS.find((t) => `tour-${t.id}` === packageType) || initialTour;
    const tripTitle = matchedPkg?.title || matchedTour?.title || initialVehicle?.name || `${packageType.toUpperCase()} Private Tour`;

    firestoreInquiriesService
      .createInquiry({
        id: ref,
        name: fullName,
        fullName,
        email,
        phone,
        service: tripTitle,
        serviceName: tripTitle,
        divisionId: 'travels',
        division: 'Mahdev Travels & Tours',
        subject: `Travel Inquiry: ${tripTitle}`,
        message: `Package / Option: ${packageType}\nParty: ${adults} Adults, ${children} Children\nEstimated Start Date: ${startDate || 'Flexible'}\nDuration: ${durationDays} Days\nVehicle Preference: ${transportPreference}\nHotel Preference: ${hotelTier}\nCountry: ${country || 'International'}\nSpecial Requests: ${specialRequirements || 'None'}`,
        preferredDate: startDate,
        status: 'New',
        source: 'travels_booking_modal',
      })
      .catch((err) => console.warn('[TravelsBookingModal] Inquiry dispatch notice:', err));

    try {
      window.open(getWhatsAppBookingLink(ref), '_blank');
    } catch (err) {
      console.warn('[TravelsBookingModal] WhatsApp launch error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-white">
                Bespoke Journey Reservation Foundation
              </h3>
              <p className="text-xs text-slate-400">
                Mahdev Travels & Tours • SLTDA Certified Chauffeurs & Private Expeditions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6 text-slate-800">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Notice Banner */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-slate-700 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>No Payment Required at this stage.</strong> Your dedicated private travel designer will customize your day-by-day itinerary, verify VIP room availability, and send a comprehensive proposal.
                </span>
              </div>

              {/* 1. SELECTION OF JOURNEY */}
              <div className="space-y-3">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 block">
                  1. Select Package, Day Tour or Custom Route *
                </label>
                <select
                  value={packageType}
                  onChange={(e) => setPackageType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <optgroup label="Multi-Day Curated Packages">
                    {TRAVEL_PACKAGES.map((pkg) => (
                      <option key={pkg.id} value={`pkg-${pkg.id}`}>
                        {pkg.title} ({pkg.duration} — from {pkg.price})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Single-Day Guided Excursions">
                    {DAY_TOURS.map((tour) => (
                      <option key={tour.id} value={`tour-${tour.id}`}>
                        {tour.title} ({tour.price})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Custom Tailor-Made">
                    <option value="custom">100% Tailor-Made Private Itinerary (Design from Scratch)</option>
                  </optgroup>
                </select>
              </div>

              {/* 2. DATES & GUESTS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Estimated Start Date</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Adults (12+ yrs)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={adults}
                    onChange={(e) => setAdults(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Children (0-11 yrs)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={children}
                    onChange={(e) => setChildren(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* 3. TRANSPORT & HOTEL PREFERENCE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-blue-600" />
                    <span>Chauffeur Vehicle Tier</span>
                  </label>
                  <select
                    value={transportPreference}
                    onChange={(e) => setTransportPreference(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="toyota-prado-luxury-suv">Toyota Land Cruiser Prado (4x4 Luxury SUV)</option>
                    <option value="toyota-alphard-vip">Toyota Alphard VIP Executive Lounge</option>
                    <option value="toyota-kdh-commuter">Toyota KDH Luxury High-Roof Van (6-9 Pax)</option>
                    <option value="toyota-coaster-coach">Toyota Coaster Mini-Coach (14-22 Pax)</option>
                    <option value="luxury-sedan">Standard Luxury Sedan (1-2 Pax)</option>
                    <option value="no-transport">Hotel Only / I have own transport</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Preferred Hotel Category</span>
                  </label>
                  <select
                    value={hotelTier}
                    onChange={(e) => setHotelTier(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="5-star-luxury">5-Star Luxury & Heritage Resorts</option>
                    <option value="relais-chateaux">Ultra-Luxe / Relais & Châteaux / Private Villas</option>
                    <option value="4-star-boutique">4-Star Boutique Eco-Lodges</option>
                    <option value="safari-tented">Luxury Tented Safari Camps</option>
                  </select>
                </div>
              </div>

              {/* 4. CUSTOMER CONTACT DETAILS */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 block">
                  2. Lead Traveler Information *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Eleanor Vance"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. eleanor@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Phone / WhatsApp Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +44 7911 123456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Country of Residence</label>
                    <input
                      type="text"
                      placeholder="e.g. United Kingdom, Australia, Singapore"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 5. SPECIAL REQUIREMENTS & WISHES */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Special Requirements, Dietary Needs, Honeymoon Perks or Desired Stops
                </label>
                <textarea
                  rows={3}
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  placeholder="e.g. We are celebrating our 10th anniversary; vegetarian meals required; keen on bird photography in Sinharaja rainforest."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={onClose} type="button" className="text-xs">
                  Cancel
                </Button>

                <Button
                  variant="electric"
                  size="md"
                  type="submit"
                  rightIcon={<Send className="w-3.5 h-3.5" />}
                  className="text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Generate Inquiry & Connect with Concierge
                </Button>
              </div>
            </form>
          ) : (
            /* Submission Confirmation State */
            <div className="py-6 text-center space-y-6 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-600 font-bold">
                  Reservation Ticket Generated
                </span>
                <h4 className="font-display text-2xl font-bold text-slate-900">
                  Thank You, {fullName}!
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your customized travel dossier has been logged. Our Senior Destination Specialist is preparing your itinerary and hotel allocations.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-md mx-auto space-y-2 text-xs text-left font-mono">
                <div className="flex justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-400">Reference:</span>
                  <span className="font-bold text-[#0052FF]">{ticketRef}</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-400">Option:</span>
                  <span className="text-slate-800">{packageType}</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-400">Party Size:</span>
                  <span className="text-slate-800">{adults} Adults, {children} Children</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-emerald-600 font-bold">● Specialist Assigned</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-slate-400">Dispatched To:</span>
                  <span className="text-[#0052FF] font-bold">info.mahdev.lk@gmail.com</span>
                </div>
              </div>

              {/* Direct Fast-Track Actions */}
              <div className="space-y-3 pt-2">
                <a
                  href={getWhatsAppBookingLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send Ticket Directly to WhatsApp Concierge ({primaryPhone})</span>
                </a>

                <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600 pt-2">
                  <a href={getTelLink(primaryPhone)} className="flex items-center gap-1.5 hover:text-[#0052FF]">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Direct Call: {primaryPhone}</span>
                  </a>
                  <span className="text-slate-300">|</span>
                  <a href={getMailtoLink(contactEmail)} className="flex items-center gap-1.5 hover:text-[#0052FF]">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>{contactEmail}</span>
                  </a>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                  Done & Return to Travel Portal
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
