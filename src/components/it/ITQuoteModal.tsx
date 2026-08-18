import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  FileUp,
  FileText,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  MessageSquare,
  Phone,
  Mail,
  Building,
  DollarSign,
  Calendar,
  Layers,
  ArrowRight,
  Terminal,
  Clock,
} from 'lucide-react';
import { IT_SERVICES, ITService } from '../../data/itData';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

export type ITModalType = 'quote' | 'project' | 'contact';

interface ITQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: ITService | null;
  initialType?: ITModalType;
}

export const ITQuoteModal: React.FC<ITQuoteModalProps> = ({
  isOpen,
  onClose,
  initialService,
  initialType = 'quote',
}) => {
  const [modalType, setModalType] = useState<ITModalType>(initialType);
  const [selectedServiceId, setSelectedServiceId] = useState(initialService?.id || 'all-custom');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [budget, setBudget] = useState('$5k - $15k (Medium Enterprise / Core System)');
  const [timeline, setTimeline] = useState('1 - 2 Months (Standard Delivery)');
  const [requirements, setRequirements] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketRef, setTicketRef] = useState('');

  useEffect(() => {
    if (initialService) {
      setSelectedServiceId(initialService.id);
    }
    if (initialType) {
      setModalType(initialType);
    }
  }, [initialService, initialType]);

  if (!isOpen) return null;

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const newFiles: { name: string; size: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      newFiles.push({
        name: file.name,
        size: `${sizeMb} MB`,
      });
    }
    setAttachedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) return;

    const ref = `MAH-IT-${Math.floor(100000 + Math.random() * 900000)}`;
    setTicketRef(ref);
    setIsSubmitted(true);
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setTicketRef('');
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setRequirements('');
    setAttachedFiles([]);
    onClose();
  };

  const serviceName = selectedServiceId === 'all-custom'
    ? 'Custom Multi-Service Architecture'
    : IT_SERVICES.find((s) => s.id === selectedServiceId)?.name || 'IT & Solutions';

  const modalTitle =
    modalType === 'project'
      ? 'Start a Project with Mahdev IT'
      : modalType === 'contact'
      ? 'Contact Principal Engineering Team'
      : 'Request an Architecture & Cost Quote';

  const modalSubtitle =
    modalType === 'project'
      ? 'Define your system requirements and sprint velocity'
      : modalType === 'contact'
      ? 'Direct technical consultation with our engineering leads'
      : 'Comprehensive line-item estimate, timeline & tech stack blueprint';

  const whatsappMessage = encodeURIComponent(
    `Hello Mahdev IT Team, I submitted an inquiry for [${serviceName}]. Reference: ${ticketRef || 'Direct Web Inquiry'}. Name: ${name} (${company || 'Individual'}). Budget: ${budget}. Timeline: ${timeline}. Scope Summary: ${requirements || 'Standard Scope'}.`
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-mono font-bold text-xs">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold text-white">
                  {modalTitle}
                </h3>
                <Badge variant="electric" size="sm" className="bg-[#0052FF]/30 text-blue-300 font-mono text-[10px]">
                  IT Division
                </Badge>
              </div>
              <p className="text-xs text-slate-400">{modalSubtitle}</p>
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

        {/* Modal Type Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-4 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setModalType('quote')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
              modalType === 'quote'
                ? 'border-[#0052FF] text-[#0052FF]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Request a Quote
          </button>
          <button
            type="button"
            onClick={() => setModalType('project')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
              modalType === 'project'
                ? 'border-[#0052FF] text-[#0052FF]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Start a Project
          </button>
          <button
            type="button"
            onClick={() => setModalType('contact')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
              modalType === 'contact'
                ? 'border-[#0052FF] text-[#0052FF]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Contact IT Team
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {isSubmitted ? (
            /* Confirmation State */
            <div className="text-center py-6 sm:py-8 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h4 className="font-display text-2xl font-bold text-slate-900">
                  Engineering Scope Logged
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Thank you, <span className="font-semibold text-slate-900">{name}</span>. Your technology requirement has been dispatched to our Solutions Architects.
                </p>
              </div>

              {/* Reference Ticket Card */}
              <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-mono">Reference Ticket:</span>
                  <span className="font-mono font-bold text-[#0052FF]">{ticketRef}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Service Track:</span>
                  <span className="font-semibold text-slate-800">{serviceName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Target Budget:</span>
                  <span className="font-semibold text-slate-800">{budget}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Target Timeline:</span>
                  <span className="font-semibold text-slate-800">{timeline}</span>
                </div>
                {attachedFiles.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Attached Documents:</span>
                    <span className="font-semibold text-slate-800">{attachedFiles.length} file(s)</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span className="font-semibold text-slate-800">{email} • {phone}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`https://wa.me/94750928078?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-md transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat with Solutions Lead on WhatsApp</span>
                </a>

                <Button variant="outline" size="md" onClick={resetForm} className="w-full sm:w-auto text-xs">
                  Done & Return
                </Button>
              </div>

              <div className="text-[11px] text-slate-400">
                Guaranteed SLA: A Senior Architect will respond with a preliminary technical architecture memo within 24 business hours.
              </div>
            </div>
          ) : (
            /* Inquiry Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Service Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Select Primary Service Discipline
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="all-custom">Custom Multi-Service Architecture / Digital Transformation</option>
                  {IT_SERVICES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.tagline})
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Your Full Name"
                  required
                  placeholder="e.g., Samantha Perera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  label="Business Email"
                  type="email"
                  required
                  placeholder="samantha@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  label="Phone / WhatsApp"
                  required
                  placeholder="+94 77 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Input
                  label="Company / Organization"
                  placeholder="e.g., Apex Logistics Ltd"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              {/* Budget & Timeline Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Estimated Budget Tier
                  </label>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="<$2,000 (Sprint Prototype / MVP)">
                      &lt; $2,000 (Sprint Prototype / MVP)
                    </option>
                    <option value="$2,000 - $5,000 (Small Business Solution)">
                      $2,000 - $5,000 (Small Business Solution)
                    </option>
                    <option value="$5k - $15k (Medium Enterprise / Core System)">
                      $5,000 - $15,000 (Medium Enterprise / Core System)
                    </option>
                    <option value="$15k - $50k (High-Concurrency / Full ERP Suite)">
                      $15,000 - $50,000 (High-Concurrency / Full ERP Suite)
                    </option>
                    <option value="$50k+ (Multi-Region / Custom Enterprise Transformation)">
                      $50,000+ (Multi-Region / Custom Enterprise Transformation)
                    </option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Target Delivery Timeline
                  </label>
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Urgent (2 - 4 Weeks Sprint)">
                      Urgent (2 - 4 Weeks Sprint)
                    </option>
                    <option value="1 - 2 Months (Standard Delivery)">
                      1 - 2 Months (Standard Delivery)
                    </option>
                    <option value="3 - 6 Months (Complex Multi-Module Platform)">
                      3 - 6 Months (Complex Multi-Module Platform)
                    </option>
                    <option value="Flexible / Strategic Advisory Phase">
                      Flexible / Strategic Advisory Phase
                    </option>
                  </select>
                </div>
              </div>

              {/* Requirements & Scope Textarea */}
              <Textarea
                label="Project Requirements, User Workflows & Target Integrations"
                required
                placeholder="Describe what you are trying to build, existing software bottlenecks, required API integrations, number of daily active users, or database preferences..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
              />

              {/* File Upload / Attachments Area */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Attach RFP, Architecture Diagrams, Wireframes, or Specs (Optional)
                </label>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFileUpload(e.dataTransfer.files);
                  }}
                  className={`p-4 rounded-xl border-2 border-dashed text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-[#0052FF] bg-blue-50/50'
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                  }`}
                  onClick={() => {
                    document.getElementById('it-file-upload-input')?.click();
                  }}
                >
                  <input
                    id="it-file-upload-input"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5 text-xs text-slate-600">
                    <FileUp className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop files here
                    </div>
                    <span className="text-[10px] text-slate-400">
                      PDF, DOCX, XLSX, PNG, JPG, ZIP (Max 25MB total)
                    </span>
                  </div>
                </div>

                {/* Attached Files List */}
                {attachedFiles.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {attachedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-100 text-xs text-slate-800"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-medium truncate">{file.name}</span>
                          <span className="text-[10px] text-slate-400">({file.size})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          aria-label="Remove file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Security & Confidentiality Notice */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-2.5 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Strict Non-Disclosure Agreement (NDA) respected. Your proprietary data and intellectual property are encrypted and never shared.
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
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Submit Inquiry to IT Architects
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
