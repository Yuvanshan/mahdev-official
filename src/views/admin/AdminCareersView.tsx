import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Download, Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react';
import {
  CareerApplication,
  CareerApplicationStatus,
  CareerOpening,
  CareerOpeningStatus,
  deleteCareerApplication,
  getCareerApplications,
  getCareerCvUrl,
  getCareerOpeningsForAdmin,
  saveCareerOpening,
  updateCareerApplicationStatus,
} from '../../services/careerService';
import { DIVISIONS } from '../../config/divisions';

type AdminTab = 'openings' | 'applications';
type OpeningForm = Omit<CareerOpening, 'id' | 'createdAt' | 'updatedAt'>;

const EMPTY_OPENING: OpeningForm = {
  title: '',
  divisionId: 'sws',
  location: 'Colombo',
  employmentType: 'Full-time',
  experience: '',
  description: '',
  responsibilities: [],
  status: 'draft',
};

const APPLICATION_STATUSES: CareerApplicationStatus[] = [
  'new',
  'reviewing',
  'shortlisted',
  'rejected',
  'hired',
];

const divisionLabel = (id: string) =>
  DIVISIONS[id as keyof typeof DIVISIONS]?.name || id;

const safePortfolioUrl = (value: string | undefined): string | null => {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
};

export const AdminCareersView: React.FC = () => {
  const [tab, setTab] = useState<AdminTab>('openings');
  const [openings, setOpenings] = useState<CareerOpening[]>([]);
  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [openingDraft, setOpeningDraft] = useState<OpeningForm>(EMPTY_OPENING);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refreshData = async (initial = false) => {
    if (initial) setIsLoading(true);
    else setIsRefreshing(true);
    setError('');
    try {
      const [loadedOpenings, loadedApplications] = await Promise.all([
        getCareerOpeningsForAdmin(),
        getCareerApplications(),
      ]);
      setOpenings(loadedOpenings);
      setApplications(loadedApplications);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load career records.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void refreshData(true);
  }, []);

  const openingById = useMemo(
    () => new Map(openings.map((opening) => [opening.id, opening])),
    [openings]
  );
  const filteredApplications = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return applications;
    return applications.filter((application) => {
      const opening = openingById.get(application.openingId);
      return [
        application.candidateName,
        application.email,
        application.phone,
        opening?.title,
        divisionLabel(opening?.divisionId || ''),
      ].some((value) => value?.toLowerCase().includes(term));
    });
  }, [applications, openingById, search]);

  const startCreate = () => {
    setEditingId(null);
    setOpeningDraft(EMPTY_OPENING);
    setError('');
    setIsEditorOpen(true);
  };

  const startEdit = (opening: CareerOpening) => {
    const { title, divisionId, location, employmentType, experience, description, responsibilities, status } = opening;
    setEditingId(opening.id);
    setOpeningDraft({ title, divisionId, location, employmentType, experience, description, responsibilities, status });
    setError('');
    setIsEditorOpen(true);
  };

  const saveOpening = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!openingDraft.title.trim() || !openingDraft.description.trim()) {
      setError('Enter a position title and description before saving.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const id = editingId || crypto.randomUUID();
      const previousOpening = openings.find((opening) => opening.id === id);
      await saveCareerOpening({
        ...openingDraft,
        id,
        title: openingDraft.title.trim(),
        location: openingDraft.location.trim(),
        employmentType: openingDraft.employmentType.trim(),
        experience: openingDraft.experience.trim(),
        description: openingDraft.description.trim(),
      }, previousOpening?.createdAt);
      setIsEditorOpen(false);
      setNotice(openingDraft.status === 'published' ? 'Opportunity published.' : 'Opportunity saved.');
      await refreshData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this opportunity.');
    } finally {
      setIsSaving(false);
    }
  };

  const changeApplicationStatus = async (application: CareerApplication, status: CareerApplicationStatus) => {
    setError('');
    try {
      await updateCareerApplicationStatus(application.id, status);
      setApplications((items) => items.map((item) => item.id === application.id ? { ...item, status } : item));
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Could not update this application.');
    }
  };

  const removeApplication = async (application: CareerApplication) => {
    if (!window.confirm(`Permanently delete ${application.candidateName}'s application and private CV?`)) return;
    setError('');
    setNotice('');
    try {
      const cleanupWarning = await deleteCareerApplication(application.id);
      setApplications((items) => items.filter((item) => item.id !== application.id));
      setNotice(cleanupWarning || 'Application and private CV deleted.');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete this application.');
    }
  };

  const statusClass = (status: CareerOpeningStatus | CareerApplicationStatus) => {
    if (status === 'published' || status === 'hired') return 'bg-emerald-50 text-emerald-700';
    if (status === 'closed' || status === 'rejected') return 'bg-slate-100 text-slate-600';
    if (status === 'shortlisted') return 'bg-blue-50 text-blue-700';
    return 'bg-amber-50 text-amber-700';
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-700" />
            <h2 className="text-lg font-bold text-slate-900">Careers</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">Publish openings and manage candidate applications and CVs.</p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" /> Add opportunity
        </button>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
          <button type="button" aria-label="Dismiss message" onClick={() => setNotice('')}><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="tablist" aria-label="Career management">
          <button type="button" role="tab" aria-selected={tab === 'openings'} onClick={() => setTab('openings')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === 'openings' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            Openings <span className="ml-1 opacity-80">{openings.length}</span>
          </button>
          <button type="button" role="tab" aria-selected={tab === 'applications'} onClick={() => setTab('applications')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === 'applications' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            Applications <span className="ml-1 opacity-80">{applications.length}</span>
          </button>
        </div>
        {tab === 'applications' && (
          <label className="relative block w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search candidates or roles" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
          </label>
        )}
        {isRefreshing && <span className="text-xs text-slate-400">Refreshing…</span>}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl bg-white" />)}
        </div>
      ) : tab === 'openings' ? (
        openings.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {openings.map((opening) => (
              <article key={opening.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${statusClass(opening.status)}`}>{opening.status}</span>
                    <h3 className="mt-3 font-semibold text-slate-900">{opening.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{divisionLabel(opening.divisionId)} · {opening.location} · {opening.employmentType}</p>
                  </div>
                  <button type="button" onClick={() => startEdit(opening)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{opening.description}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <Users className="h-4 w-4" />
                  {applications.filter((application) => application.openingId === opening.id).length} applications
                  {opening.experience && <span className="ml-auto">{opening.experience}</span>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <Briefcase className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-800">No opportunities yet</p>
            <p className="mt-1 text-sm text-slate-500">Create a role and publish it to the Careers page.</p>
          </div>
        )
      ) : filteredApplications.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr><th className="px-4 py-3">Candidate</th><th className="px-4 py-3">Opportunity</th><th className="px-4 py-3">Applied</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">CV</th><th className="px-4 py-3">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map((application) => {
                  const opening = openingById.get(application.openingId);
                  const portfolioUrl = safePortfolioUrl(application.portfolioUrl);
                  return (
                    <tr key={application.id} className="align-top hover:bg-slate-50/70">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{application.candidateName}</p>
                        <a href={`mailto:${application.email}`} className="mt-1 block text-xs text-blue-700 hover:underline">{application.email}</a>
                        <p className="mt-1 text-xs text-slate-500">{application.phone}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-800">{opening?.title || 'Opening no longer available'}</p>
                        {opening && <p className="mt-1 text-xs text-slate-500">{divisionLabel(opening.divisionId)}</p>}
                        {portfolioUrl && <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-blue-700 hover:underline">Portfolio / LinkedIn</a>}
                        {application.coverLetter && <p className="mt-2 max-w-sm whitespace-pre-line text-xs leading-5 text-slate-500">{application.coverLetter}</p>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">{new Date(application.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-4">
                        <select aria-label={`Application status for ${application.candidateName}`} value={application.status} onChange={(event) => void changeApplicationStatus(application, event.target.value as CareerApplicationStatus)} className={`rounded-lg border-0 px-2.5 py-1.5 text-xs font-semibold capitalize outline-none ring-1 ring-inset ring-slate-200 ${statusClass(application.status)}`}>
                          {APPLICATION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <a href={getCareerCvUrl(application.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700">
                          <Download className="h-3.5 w-3.5" /> Download
                        </a>
                        <p className="mt-1 max-w-36 truncate text-[10px] text-slate-400">{application.cvFileName}</p>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => void removeApplication(application)}
                          aria-label={`Delete ${application.candidateName}'s application`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <Users className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 font-semibold text-slate-800">No applications found</p>
          <p className="mt-1 text-sm text-slate-500">Applications submitted through the website will appear here.</p>
        </div>
      )}

      {isEditorOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsEditorOpen(false); }}>
          <form onSubmit={saveOpening} className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{editingId ? 'Edit opportunity' : 'New opportunity'}</h2>
                <p className="mt-1 text-sm text-slate-500">Drafts stay private until published.</p>
              </div>
              <button type="button" onClick={() => setIsEditorOpen(false)} aria-label="Close form" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            {error && <div role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
            <label className="block text-sm font-medium text-slate-700">Position title *
              <input required value={openingDraft.title} onChange={(event) => setOpeningDraft({ ...openingDraft, title: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">Division *
                <select value={openingDraft.divisionId} onChange={(event) => setOpeningDraft({ ...openingDraft, divisionId: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
                  {Object.entries(DIVISIONS).map(([id, division]) => <option key={id} value={id}>{division.name}</option>)}
                  <option value="mahdev">Mahdev Group</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">Work location
                <input value={openingDraft.location} onChange={(event) => setOpeningDraft({ ...openingDraft, location: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5" />
              </label>
              <label className="block text-sm font-medium text-slate-700">Employment type
                <input value={openingDraft.employmentType} onChange={(event) => setOpeningDraft({ ...openingDraft, employmentType: event.target.value })} placeholder="Full-time, contract…" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5" />
              </label>
              <label className="block text-sm font-medium text-slate-700">Experience
                <input value={openingDraft.experience} onChange={(event) => setOpeningDraft({ ...openingDraft, experience: event.target.value })} placeholder="e.g. 2+ years" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5" />
              </label>
            </div>
            <label className="block text-sm font-medium text-slate-700">Description *
              <textarea required rows={5} value={openingDraft.description} onChange={(event) => setOpeningDraft({ ...openingDraft, description: event.target.value })} className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Visibility
              <select value={openingDraft.status} onChange={(event) => setOpeningDraft({ ...openingDraft, status: event.target.value as CareerOpeningStatus })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
                <option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option>
              </select>
            </label>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setIsEditorOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={isSaving} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{isSaving ? 'Saving…' : 'Save opportunity'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
