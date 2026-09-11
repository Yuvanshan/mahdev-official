import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Check,
  Info,
  DollarSign,
  ArrowRight,
  Layers,
  Camera,
  Compass,
  Cpu,
  ShoppingBag,
} from 'lucide-react';
import {
  BookingType,
  BookableServiceItem,
  BookingPackageOption,
  BookingSubmissionInput,
  LocationType,
  Booking,
} from '../../types/booking';
import { bookingService } from '../../services/bookingService';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { evaluateBotRisk, checkActionThrottle } from '../../utils/securityProtection';
import { openWhatsAppInquiry } from '../../utils/whatsapp';

interface BookingWizardProps {
  initialDivision?: string;
  initialServiceId?: string;
  onBookingCreated: (booking: Booking) => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  initialDivision,
  initialServiceId,
  onBookingCreated,
}) => {
  const { services: firestoreServices } = useFirestoreDataContext();
  const bookableServices = bookingService.getServices();

  // Step State (1: Service & Package, 2: Schedule & Location, 3: Customer & Review)
  const [step, setStep] = useState<number>(1);

  // Division Filter
  const [selectedDivision, setSelectedDivision] = useState<string>(initialDivision || 'all');
  const [selectedType, setSelectedType] = useState<BookingType | 'all'>('all');

  // Selected Service & Package
  const [selectedService, setSelectedService] = useState<BookableServiceItem | null>(() => {
    if (initialServiceId) {
      return bookableServices.find((s) => s.id === initialServiceId) || bookableServices[0] || null;
    }
    return bookableServices[0] || null;
  });

  const [selectedPackage, setSelectedPackage] = useState<BookingPackageOption | null>(() => {
    const s = initialServiceId
      ? bookableServices.find((s) => s.id === initialServiceId) || bookableServices[0] || null
      : bookableServices[0] || null;
    return s?.packages[0] || null;
  });

  // Sync selected service if list changes or was initially empty
  useEffect(() => {
    if (!selectedService && bookableServices.length > 0) {
      const found = initialServiceId
        ? bookableServices.find((s) => s.id === initialServiceId) || bookableServices[0]
        : bookableServices[0];
      setSelectedService(found);
      setSelectedPackage(found.packages[0] || null);
    }
  }, [bookableServices, initialServiceId, selectedService]);

  // Calculate default future date (e.g. today + 3 days)
  const getDefaultDate = (leadDays = 3) => {
    const d = new Date();
    d.setDate(d.getDate() + Math.max(1, leadDays));
    return d.toISOString().split('T')[0];
  };

  // Schedule & Location State
  const [selectedDate, setSelectedDate] = useState<string>(getDefaultDate(selectedService?.leadTimeDays || 3));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(selectedService?.availableTimeSlots[0] || '');
  const [locationType, setLocationType] = useState<LocationType>(selectedService?.locationTypeDefault || 'venue');
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [locationCity, setLocationCity] = useState<string>('Colombo');
  const [locationVenue, setLocationVenue] = useState<string>('');

  // Customer Details State
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [preferredContact, setPreferredContact] = useState<'phone' | 'email' | 'whatsapp'>('whatsapp');
  const [notes, setNotes] = useState<string>('');
  const [honeypotValue, setHoneypotValue] = useState<string>('');
  const [formRenderTime] = useState<number>(() => Date.now());

  // Validation Errors & Submission State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // When service changes, update packages and defaults
  const handleServiceSelect = (service: BookableServiceItem) => {
    setSelectedService(service);
    setSelectedPackage(service.packages[0]);
    setSelectedTimeSlot(service.availableTimeSlots[0] || '');
    setLocationType(service.locationTypeDefault);
    setSelectedDate(getDefaultDate(service.leadTimeDays));
    setErrors({});
  };

  // Check Availability for currently selected date
  const availability = selectedService && selectedDate
    ? bookingService.checkServiceAvailability(selectedService.id, selectedDate)
    : { available: true, remainingSlots: 1, maxPerDay: 1 };

  // Step 1 Validation (Service & Package)
  const validateStep1 = (): boolean => {
    if (!selectedService || !selectedPackage) {
      setErrors({ service: 'Please select a service and package tier.' });
      return false;
    }
    setErrors({});
    return true;
  };

  // Step 2 Validation (Date, Time, Location)
  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!selectedDate) {
      errs.date = 'Booking date is required.';
    } else {
      const avail = bookingService.checkServiceAvailability(selectedService!.id, selectedDate);
      if (!avail.available) {
        errs.date = avail.reason || 'This date is not available for booking.';
      }
    }

    if (!selectedTimeSlot) {
      errs.time = 'Please select an available time window.';
    }

    if (locationType !== 'remote_online') {
      if (!locationAddress || locationAddress.trim().length < 4) {
        errs.address = 'Please enter a physical venue or delivery address (min 4 chars).';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 3 Validation (Customer Details)
  const validateStep3 = (): boolean => {
    const errs: Record<string, string> = {};

    // 1. Bot & Abuse Evaluation
    const botCheck = evaluateBotRisk({
      honeypotValue,
      formRenderTime,
      email,
      messageOrNotes: notes,
    });

    if (!botCheck.isLegitimate) {
      errs.bot = botCheck.reason || 'Verification failed. Please review your details and resubmit.';
    }

    if (!checkActionThrottle('booking_create', 2500)) {
      errs.throttle = 'Please wait a moment before resubmitting your booking.';
    }

    if (!fullName || fullName.trim().length < 2) {
      errs.fullName = 'Full name is required (at least 2 characters).';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      errs.email = 'Please provide a valid email address.';
    }
    const phoneCleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    if (!phone || phoneCleaned.length < 7 || phoneCleaned.length > 15) {
      errs.phone = 'Valid phone / WhatsApp number required (7-15 digits).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 350, behavior: 'smooth' });
    } else if (step === 2 && validateStep2()) {
      setStep(3);
      window.scrollTo({ top: 350, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setStep(Math.max(1, step - 1));
    setErrors({});
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setIsSubmitting(true);

    const submissionInput: BookingSubmissionInput = {
      bookingType: selectedService!.bookingType,
      divisionId: selectedService!.divisionId,
      serviceId: selectedService!.id,
      packageId: selectedPackage.id,
      date: selectedDate,
      time: selectedTimeSlot,
      location: {
        type: locationType,
        address: locationType === 'remote_online' ? 'Online High-Definition Video Link' : locationAddress,
        city: locationCity,
        venueName: locationVenue,
      },
      customer: {
        fullName,
        email,
        phone,
        company: company.trim() || undefined,
        preferredContactMethod: preferredContact,
      },
      notes,
    };

    setTimeout(() => {
      const result = bookingService.createBooking(submissionInput);
      setIsSubmitting(false);

      if (result.success && result.booking) {
        // Automatically launch WhatsApp with booking parameters & SKU
        try {
          openWhatsAppInquiry({
            title: selectedService!.name,
            sku: (selectedService as any)?.sku,
            category: (selectedService as any)?.category || (selectedService as any)?.categoryName || 'Service',
            divisionName: selectedService!.divisionName,
            packageName: selectedPackage.name,
            bookingId: result.booking.id,
            date: selectedDate,
            time: selectedTimeSlot,
            location: submissionInput.location.address,
            customerName: fullName,
            customerPhone: phone,
            customerEmail: email,
            customerNotes: notes,
            price: selectedPackage.price,
            imageUrl: selectedService!.imageUrl,
            type: 'booking',
          });
        } catch (e) {
          console.warn('[BookingWizard] WhatsApp launch error:', e);
        }

        onBookingCreated(result.booking);
      } else if (result.errors) {
        setErrors(result.errors);
      }
    }, 600);
  };

  // Filtered Services List
  const filteredServices = bookableServices.filter((s) => {
    if (selectedDivision !== 'all' && s.divisionId !== selectedDivision) return false;
    if (selectedType !== 'all' && s.bookingType !== selectedType) return false;
    return true;
  });

  const divisions = [
    { id: 'all', label: 'All Divisions', icon: Sparkles },
    { id: 'sws', label: 'SWS Events', icon: Layers },
    { id: 'u1', label: 'U1 Studio', icon: Camera },
    { id: 'travels', label: 'Mahdev Travels', icon: Compass },
    { id: 'it', label: 'IT & Solutions', icon: Cpu },
    { id: 'consulting', label: 'Consulting & Trade', icon: ShoppingBag },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden">
      {/* Progress Header */}
      <div className="bg-neutral-900 text-white px-6 py-4 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
            Step {step} of 3
          </span>
          <h2 className="text-lg font-serif font-medium text-white">
            {step === 1 && 'Select Service & Package Tier'}
            {step === 2 && 'Choose Schedule & Location'}
            {step === 3 && 'Contact Information & Review'}
          </h2>
        </div>

        {/* Step Indicator Pills */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                step === num
                  ? 'bg-amber-500 text-neutral-950 ring-4 ring-amber-500/20'
                  : step > num
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
              }`}
            >
              {step > num ? <Check className="w-4 h-4" /> : num}
            </div>
          ))}
        </div>
      </div>

      {/* Main Wizard Form Body */}
      <div className="p-6 sm:p-8">
        {/* ==================================================== */}
        {/* STEP 1: SERVICE & PACKAGE SELECTION */}
        {/* ==================================================== */}
        {step === 1 && (
          <div className="space-y-8">
            {/* Division Filter Bar */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Filter By Division:
              </label>
              <div className="flex flex-wrap gap-2">
                {divisions.map((div) => {
                  const Icon = div.icon;
                  const isSelected = selectedDivision === div.id;
                  return (
                    <button
                      key={div.id}
                      onClick={() => setSelectedDivision(div.id)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-neutral-900 text-white shadow-xs'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{div.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Service Grid Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                1. Select Mahdev Service ({filteredServices.length} Available):
              </label>
              {filteredServices.length === 0 ? (
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-neutral-900 text-base">Custom Consultation Available</h3>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto">
                    Online service scheduling for this division is currently managed via direct corporate dispatch. Contact our 24/7 executive hotline or request an instant bespoke quote.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredServices.map((service) => {
                    const isSelected = selectedService?.id === service.id;
                    return (
                      <div
                        key={service.id}
                        onClick={() => handleServiceSelect(service)}
                        className={`relative rounded-xl border p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50/40 ring-2 ring-amber-500/20 shadow-md'
                            : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        <div className="aspect-16/9 rounded-lg overflow-hidden mb-3 bg-neutral-100 relative">
                          <img
                            src={service.imageUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'}
                            alt={service.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 left-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-neutral-900/90 text-white backdrop-blur-xs">
                            {service.divisionName}
                          </span>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-neutral-950 shadow-xs">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className="font-semibold text-neutral-900 text-sm mb-1 leading-snug">
                            {service.name}
                          </h4>
                          <p className="text-xs text-neutral-500 line-clamp-2 mb-3 leading-relaxed">
                            {service.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                          <span>Lead Time: {service.leadTimeDays}d</span>
                          <span className="text-amber-700 font-bold font-sans">
                            From ${service.packages[0]?.price || 0}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Package Tier Selection for Selected Service */}
            {selectedService && (
              <div className="space-y-4 pt-6 border-t border-neutral-200">
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    2. Select Package Tier for {selectedService.name}:
                  </label>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Choose the scope, duration, and feature tier that fits your requirements.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedService.packages.map((pkg) => {
                    const isSelected = selectedPackage?.id === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`rounded-xl border p-5 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-amber-600 bg-neutral-900 text-white shadow-lg'
                            : 'border-neutral-200 hover:border-neutral-300 bg-white text-neutral-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="font-bold text-base">{pkg.name}</h4>
                            <span
                              className={`text-xs font-mono ${
                                isSelected ? 'text-amber-400' : 'text-neutral-500'
                              }`}
                            >
                              Duration: {pkg.duration}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold font-mono">
                              ${pkg.price}
                            </span>
                            <p className="text-[10px] opacity-70 uppercase">{pkg.currency}</p>
                          </div>
                        </div>

                        <p
                          className={`text-xs mb-4 leading-relaxed ${
                            isSelected ? 'text-neutral-300' : 'text-neutral-600'
                          }`}
                        >
                          {pkg.description}
                        </p>

                        {/* Feature Bullets */}
                        <div className="space-y-1.5 pt-3 border-t border-neutral-200/20 text-xs">
                          {pkg.features.map((feat, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <CheckCircle2
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSelected ? 'text-emerald-400' : 'text-emerald-600'
                                }`}
                              />
                              <span className={isSelected ? 'text-neutral-200' : 'text-neutral-700'}>
                                {feat}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {errors.service && (
              <p className="text-xs text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> {errors.service}
              </p>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 2: SCHEDULE & LOCATION */}
        {/* ==================================================== */}
        {step === 2 && selectedService && (
          <div className="space-y-8">
            {/* Selected Service Recap Pill */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 font-mono">
                  {selectedService.divisionName}
                </span>
                <h4 className="text-sm font-semibold text-neutral-900">
                  {selectedService.name} — <span className="text-amber-800">{selectedPackage.name}</span>
                </h4>
              </div>
              <span className="text-base font-bold text-neutral-900 font-mono">
                ${selectedPackage.price} {selectedPackage.currency}
              </span>
            </div>

            {/* Date and Time Picker Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-600" />
                  <span>Select Booking Date *</span>
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setErrors({ ...errors, date: '' });
                  }}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />

                {/* Real-time Availability Feedback */}
                {selectedDate && (
                  <div className="mt-2 text-xs">
                    {availability.available ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Date Available ({availability.remainingSlots} of {availability.maxPerDay} slots remaining)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-red-700 bg-red-50 px-3 py-1 rounded-lg border border-red-200 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{availability.reason || 'Capacity reached for this date.'}</span>
                      </span>
                    )}
                  </div>
                )}
                {errors.date && <p className="text-xs text-red-600">{errors.date}</p>}
              </div>

              {/* Time Window Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Preferred Time Window *</span>
                </label>
                <div className="space-y-2">
                  {selectedService.availableTimeSlots.map((slot, index) => {
                    const isSelected = selectedTimeSlot === slot;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedTimeSlot(slot)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        <span>{slot}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </button>
                    );
                  })}
                </div>
                {errors.time && <p className="text-xs text-red-600">{errors.time}</p>}
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-4 pt-6 border-t border-neutral-200">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Service Location & Venue Logistics *</span>
              </label>

              {/* Location Type Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {[
                  { id: 'venue', label: 'Hotel / Venue' },
                  { id: 'studio', label: 'Mahdev Studio' },
                  { id: 'travel_destination', label: 'Travel Destination' },
                  { id: 'client_premises', label: 'Client Office' },
                  { id: 'remote_online', label: 'Online / Remote' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setLocationType(type.id as LocationType)}
                    className={`py-2 px-3 rounded-lg border text-center font-medium transition-all ${
                      locationType === type.id
                        ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                        : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {locationType !== 'remote_online' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs text-neutral-600 font-medium">Street Address / Venue Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Shangri-La Ballroom, Galle Face Center Road"
                      value={locationAddress}
                      onChange={(e) => setLocationAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                    {errors.address && <p className="text-xs text-red-600">{errors.address}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-neutral-600 font-medium">City / Region</label>
                    <input
                      type="text"
                      placeholder="e.g. Colombo 03, Nuwara Eliya, Yala"
                      value={locationCity}
                      onChange={(e) => setLocationCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-3">
                  <Info className="w-5 h-5 shrink-0 text-blue-600" />
                  <span>
                    This is an online/remote service. A private secure Google Meet / Zoom HD conference room link will be dispatched automatically upon confirmation.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 3: CUSTOMER DETAILS & FINAL REVIEW */}
        {/* ==================================================== */}
        {step === 3 && selectedService && (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Comprehensive Booking Summary Banner */}
            <div className="bg-neutral-900 text-white rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between border-b border-neutral-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-amber-400 tracking-wider">
                    {selectedService.divisionName || (selectedService.divisionId ? String(selectedService.divisionId).toUpperCase() : 'ENTERPRISE')} • {(selectedService.bookingType || 'standard').toUpperCase()}
                  </span>
                  <h3 className="text-base font-bold text-white">{selectedService.name}</h3>
                  <p className="text-xs text-neutral-300">{selectedPackage.name} ({selectedPackage.duration})</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold font-mono text-amber-400">
                    ${selectedPackage.price.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-neutral-400">{selectedPackage.currency}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-neutral-300 font-mono">
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase">Date</span>
                  <span className="font-semibold text-white">{selectedDate}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase">Time Window</span>
                  <span className="font-semibold text-white truncate block">{selectedTimeSlot}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase">Location</span>
                  <span className="font-semibold text-white truncate block">
                    {locationType === 'remote_online' ? 'Online Video Conference' : `${locationAddress}, ${locationCity}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Inputs */}
            <div className="space-y-4">
              {/* Anti-Bot Error Alert */}
              {(errors.bot || errors.throttle) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errors.bot || errors.throttle}</span>
                </div>
              )}

              {/* Hidden Honeypot Field */}
              <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
                <label htmlFor="company_website_booking_hp">Leave this field blank</label>
                <input
                  id="company_website_booking_hp"
                  type="text"
                  name="_hp_website"
                  value={honeypotValue}
                  onChange={(e) => setHoneypotValue(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Primary Contact Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs text-neutral-600 font-medium flex items-center gap-1">
                    <User className="w-3 h-3 text-neutral-400" /> Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Jayasinghe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  {errors.fullName && <p className="text-xs text-red-600">{errors.fullName}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs text-neutral-600 font-medium flex items-center gap-1">
                    <Mail className="w-3 h-3 text-neutral-400" /> Email Address (For Confirmation) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. aarav@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                </div>

                {/* Phone / WhatsApp */}
                <div className="space-y-1">
                  <label className="text-xs text-neutral-600 font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3 text-neutral-400" /> Phone / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 075 092 8078"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  {errors.phone && <p className="text-xs text-red-600">{errors.phone}</p>}
                </div>

                {/* Company / Org (Optional) */}
                <div className="space-y-1">
                  <label className="text-xs text-neutral-600 font-medium flex items-center gap-1">
                    <Building className="w-3 h-3 text-neutral-400" /> Company / Organization (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jayasinghe Holdings Ltd"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Preferred Contact Method */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs text-neutral-600 font-medium">
                  Preferred Concierge Communication Channel:
                </label>
                <div className="flex gap-4 text-xs">
                  {(['whatsapp', 'email', 'phone'] as const).map((method) => (
                    <label key={method} className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="contactMethod"
                        checked={preferredContact === method}
                        onChange={() => setPreferredContact(method)}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="capitalize font-medium text-neutral-700">{method}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes / Special Instructions */}
              <div className="space-y-1 pt-2">
                <label className="text-xs text-neutral-600 font-medium">
                  Special Logistics Notes, Technical Specs, or Catering Requests:
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Require low-fog dry ice machine for grand entrance at 7:00 PM; or vegetarian dietary preferences for 4 guests."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>
          </form>
        )}

        {/* Wizard Footer Navigation Controls */}
        <div className="pt-8 mt-8 border-t border-neutral-200 flex items-center justify-between gap-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-md"
            >
              <span>Continue to Schedule & Details</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-8 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  <span>Validating & Processing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-neutral-950" />
                  <span>Confirm & Submit Booking (${selectedPackage.price})</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
