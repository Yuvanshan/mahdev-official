import React, { useEffect, useState } from 'react';
import { ArrowRight, Briefcase, CheckCircle2, Clock3, MapPin, Search, UploadCloud } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { SectionContainer } from '../components/ui/SectionContainer';
import {
  CareerApplicationStatusResult,
  CareerOpening,
  getPublishedCareerOpenings,
  lookupCareerApplicationStatus,
  submitCareerApplication,
  uploadCareerCv,
} from '../services/careerService';
import { DIVISIONS } from '../config/divisions';

interface CareersViewProps {
  onNavigate: (route: string) => void;
}

interface ApplicationForm {
  candidateName: string;
  email: string;
  phone: string;
  portfolioUrl: string;
  coverLetter: string;
}

const INITIAL_FORM: ApplicationForm = {
  candidateName: '',
  email: '',
  phone: '',
  portfolioUrl: '',
  coverLetter: '',
};

const divisionName = (id: string) =>
  DIVISIONS[id as keyof typeof DIVISIONS]?.name || (id === 'mahdev' ? 'Mahdev Group' : id);

export const CareersView: React.FC<CareersViewProps> = ({ onNavigate }) => {
  const [openings, setOpenings] = useState<CareerOpening[]>([]);
  const [selectedOpening, setSelectedOpening] = useState<CareerOpening | null>(null);
  const [application, setApplication] = useState<ApplicationForm>(INITIAL_FORM);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationReference, setApplicationReference] = useState('');
  const [statusEmail, setStatusEmail] = useState('');
  const [statusReference, setStatusReference] = useState('');
  const [statusResult, setStatusResult] = useState<CareerApplicationStatusResult | null>(null);
  const [statusError, setStatusError] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getPublishedCareerOpenings()
      .then((items) => {
        if (isMounted) setOpenings(items);
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : 'Career opportunities could not be loaded.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const startApplication = (opening: CareerOpening) => {
    setSelectedOpening(opening);
    setIsSubmitted(false);
    setSubmitError('');
    document.getElementById('career-application')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedOpening) {
      setSubmitError('Choose an open position to apply for.');
      return;
    }
    if (!cvFile) {
      setSubmitError('Please attach your CV before submitting.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const cvStoragePath = await uploadCareerCv(cvFile);
      const reference = await submitCareerApplication(selectedOpening, {
        ...application,
        candidateName: application.candidateName.trim(),
        email: application.email.trim(),
        phone: application.phone.trim(),
        portfolioUrl: application.portfolioUrl.trim(),
        coverLetter: application.coverLetter.trim(),
        cvStoragePath,
        cvFileName: cvFile.name,
      });
      setApplicationReference(reference);
      setIsSubmitted(true);
      setApplication(INITIAL_FORM);
      setCvFile(null);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Your application could not be submitted. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateApplication = (field: keyof ApplicationForm, value: string) =>
    setApplication((current) => ({ ...current, [field]: value }));

  const checkApplicationStatus = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsCheckingStatus(true);
    setStatusError('');
    setStatusResult(null);
    try {
      setStatusResult(await lookupCareerApplicationStatus(statusEmail, statusReference));
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Application status could not be checked.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <main className="min-h-screen bg-white pt-16 sm:pt-[72px]">
      <SEOHead
        title="Careers | Join the Mahdev team"
        description="Explore current career opportunities at Mahdev and apply securely with your CV."
        canonicalUrl="https://mahdev.lk/careers"
      />

      <section className="relative isolate overflow-hidden bg-[#07152f] text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_10%,rgba(37,99,235,0.4),transparent_45%),linear-gradient(125deg,#07152f_8%,#102b54_65%,#07152f)]" />
        <div aria-hidden="true" className="absolute -right-20 top-10 h-72 w-72 rounded-full border border-white/10 sm:right-[8%] sm:h-[28rem] sm:w-[28rem]" />
        <SectionContainer background="none" paddingY="xl">
          <div className="relative max-w-3xl py-8 sm:py-14">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-300/10 px-3 py-1.5 text-xs font-semibold text-blue-100">
              <Briefcase className="h-3.5 w-3.5" />
              Careers at Mahdev
            </div>
            <h1 className="font-editorial text-4xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
              Make good work matter.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-blue-100/80 sm:text-base">
              Join a team building memorable events, thoughtful creative work, and useful technology.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#open-roles" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-blue-50">
                View open roles <ArrowRight className="h-4 w-4" />
              </a>
              <button type="button" onClick={() => onNavigate('/contact')} className="inline-flex min-h-11 items-center rounded-xl border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white/10">
                Talk to our team
              </button>
            </div>
          </div>
        </SectionContainer>
      </section>

      <SectionContainer id="open-roles" background="subtle" paddingY="xl">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Opportunities</p>
              <h2 className="mt-2 font-editorial text-3xl font-medium tracking-tight text-slate-950 sm:text-4xl">Find your next role</h2>
            </div>
            {!isLoading && !loadError && <p className="text-sm text-slate-500">{openings.length} {openings.length === 1 ? 'position' : 'positions'} open</p>}
          </div>

          {loadError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{loadError}</div>}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map((item) => <div key={item} className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}
            </div>
          ) : openings.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {openings.map((opening) => (
                <article key={opening.id} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-800">{divisionName(opening.divisionId)}</span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white"><Briefcase className="h-4 w-4" /></span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-950">{opening.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{opening.description}</p>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
                    {opening.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{opening.location}</span>}
                    {opening.employmentType && <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{opening.employmentType}</span>}
                    {opening.experience && <span>{opening.experience}</span>}
                  </div>
                  <button type="button" onClick={() => startApplication(opening)} className="mt-6 inline-flex min-h-10 w-fit items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                    Apply for this role <ArrowRight className="h-4 w-4" />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
              <Briefcase className="mx-auto h-8 w-8 text-slate-300" />
              <h3 className="mt-3 font-semibold text-slate-900">No open roles right now</h3>
              <p className="mt-1 text-sm text-slate-500">Please check back soon for new opportunities.</p>
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Search className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-950">Check your application status</h3>
                <p className="mt-1 text-sm leading-5 text-slate-500">Use the email address and reference number shown after you applied.</p>
              </div>
            </div>
            <form onSubmit={checkApplicationStatus} className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <label className="text-xs font-semibold text-slate-600">
                Application email
                <input
                  required
                  type="email"
                  maxLength={254}
                  autoComplete="email"
                  value={statusEmail}
                  onChange={(event) => setStatusEmail(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Application reference
                <input
                  required
                  maxLength={36}
                  value={statusReference}
                  onChange={(event) => setStatusReference(event.target.value)}
                  placeholder="Reference number"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <button
                type="submit"
                disabled={isCheckingStatus}
                className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
              >
                {isCheckingStatus ? 'Checking…' : 'Check status'} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            {statusError && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">{statusError}</p>}
            {statusResult && (
              <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-900">{statusResult.openingTitle}</p>
                  <p className="mt-1 text-xs text-slate-600">Submitted {new Date(statusResult.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold capitalize text-emerald-800 ring-1 ring-emerald-200">
                  {statusResult.status}
                </span>
              </div>
            )}
          </div>
        </div>
      </SectionContainer>

      {selectedOpening && (
        <SectionContainer id="career-application" background="white" paddingY="xl">
          <div className="mx-auto max-w-3xl scroll-mt-28">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Your next step</p>
              <h2 className="mt-2 font-editorial text-3xl font-medium text-slate-950">Apply for {selectedOpening.title}</h2>
              <p className="mt-2 text-sm text-slate-500">{divisionName(selectedOpening.divisionId)} · {selectedOpening.location}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 sm:p-8">
              {isSubmitted ? (
                <div role="status" className="py-8 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-8 w-8" /></span>
                  <h3 className="mt-4 text-xl font-semibold text-slate-950">Application received</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Thank you for applying. Our team will review your details and contact you if there’s a match.</p>
                  <p className="mx-auto mt-4 max-w-md rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
                    Save your application reference to check your status later:
                    <strong className="mt-1 block break-all font-mono text-xs">{applicationReference}</strong>
                  </p>
                  <button type="button" onClick={() => { setSelectedOpening(null); setIsSubmitted(false); }} className="mt-5 text-sm font-semibold text-blue-700 hover:underline">Back to open roles</button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-slate-700">Full name *
                      <input required maxLength={160} autoComplete="name" value={application.candidateName} onChange={(event) => updateApplication('candidateName', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">Email *
                      <input required type="email" maxLength={254} autoComplete="email" value={application.email} onChange={(event) => updateApplication('email', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">Phone *
                      <input required type="tel" maxLength={40} autoComplete="tel" value={application.phone} onChange={(event) => updateApplication('phone', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">Portfolio or LinkedIn
                      <input type="url" maxLength={2048} placeholder="https://" value={application.portfolioUrl} onChange={(event) => updateApplication('portfolioUrl', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                    </label>
                  </div>
                  <label className="block text-sm font-medium text-slate-700">CV / Resume *
                    <span className="mt-1.5 flex min-h-14 items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 transition hover:border-blue-400">
                      <UploadCloud className="h-5 w-5 shrink-0 text-blue-700" />
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{cvFile ? `${cvFile.name} · ${(cvFile.size / (1024 * 1024)).toFixed(1)} MB` : 'Upload your CV as a PDF (max 10 MB)'}</span>
                      <input required type="file" accept=".pdf,application/pdf" onChange={(event) => setCvFile(event.target.files?.[0] || null)} className="sr-only" />
                    </span>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">A note for our team
                    <textarea rows={4} maxLength={5000} value={application.coverLetter} onChange={(event) => updateApplication('coverLetter', event.target.value)} placeholder="Share a little about your experience and interest in the role." className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                  </label>
                  <p className="text-xs leading-5 text-slate-500">Your application and CV are visible only to the hiring team.</p>
                  {submitError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">{submitError}</p>}
                  <button type="submit" disabled={isSubmitting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60 sm:w-auto">
                    {isSubmitting ? 'Uploading and submitting…' : 'Submit application'} <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </SectionContainer>
      )}
    </main>
  );
};
