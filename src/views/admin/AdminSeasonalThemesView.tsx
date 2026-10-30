import React, { useEffect, useState } from 'react';
import { Building2, CalendarDays, Eye, Monitor, Save, Smartphone, Sparkles } from 'lucide-react';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { ImageUploader } from '../../components/common/ImageUploader';
import { resolveMediaUrl } from '../../services/firestoreMediaService';
import { seasonalThemeService, findScheduleConflict } from '../../services/seasonalThemeService';
import {
  DEFAULT_SEASONAL_THEME,
  SeasonalThemeConfig,
  SeasonalThemeId,
  SeasonalThemeSchedule,
} from '../../types/seasonalTheme';

type PreviewMode = 'desktop' | 'mobile' | 'hero' | 'divisions' | 'branding' | 'whatsapp';
type SeasonalEffectAmount = 'snowAmount' | 'heartsAmount' | 'fireworksAmount' | 'sparklesAmount';

const THEME_OPTIONS: Array<{ id: SeasonalThemeId; label: string; description: string }> = [
  { id: 'default', label: 'Default MAHDEV', description: 'Original brand appearance with no seasonal effects.' },
  { id: 'christmas', label: 'Christmas', description: 'Navy and red accents, animated snowfall, and a flying Santa.' },
  { id: 'newYear', label: 'New Year', description: 'Premium gold and blue accents with animated fireworks.' },
  { id: 'valentines', label: "Valentine's Day", description: 'Warm red accents and floating animated hearts.' },
  { id: 'diwali', label: 'Diwali', description: 'Deep purple and gold accents with small lamps along the page edge.' },
];
const EFFECT_AMOUNT_OPTIONS: Array<{ field: SeasonalEffectAmount; label: string }> = [
  { field: 'snowAmount', label: 'Snowfall intensity' },
  { field: 'heartsAmount', label: 'Flying hearts intensity' },
  { field: 'fireworksAmount', label: 'Fireworks intensity' },
  { field: 'sparklesAmount', label: 'Diwali sparkles intensity' },
];

function toColomboInput(iso: string): string {
  if (!iso) return '';
  const shifted = new Date(Date.parse(iso) + 330 * 60 * 1000);
  return Number.isNaN(shifted.getTime()) ? '' : shifted.toISOString().slice(0, 16);
}

function fromColomboInput(value: string): string {
  if (!value) return '';
  const timestamp = Date.parse(`${value}:00+05:30`);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : '';
}

function newScheduleId(): string {
  return `season-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const AdminSeasonalThemesView: React.FC = () => {
  const [draft, setDraft] = useState<SeasonalThemeConfig>(DEFAULT_SEASONAL_THEME);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [scheduleTheme, setScheduleTheme] = useState<SeasonalThemeSchedule['theme']>('christmas');
  const [scheduleStart, setScheduleStart] = useState('');
  const [scheduleEnd, setScheduleEnd] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [previewLogoUrl, setPreviewLogoUrl] = useState('/logo.png');
  const [previewFaviconUrl, setPreviewFaviconUrl] = useState('/favicon.png');

  const notify = (type: ToastMessage['type'], title: string, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4500);
  };

  useEffect(() => {
    let active = true;
    seasonalThemeService.getDraft()
      .then((savedDraft) => {
        if (active) setDraft(savedDraft);
      })
      .catch((error: unknown) => {
        console.error('[AdminSeasonalThemes] Draft settings could not be loaded:', error);
        if (active) notify('error', 'Could not load theme draft', error instanceof Error ? error.message : 'Try again.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      resolveMediaUrl(draft.seasonalLogo || '/logo.png'),
      resolveMediaUrl(draft.seasonalFavicon || '/favicon.png'),
    ])
      .then(([logo, favicon]) => {
        if (!active) return;
        setPreviewLogoUrl(logo || '/logo.png');
        setPreviewFaviconUrl(favicon || '/favicon.png');
      })
      .catch((error: unknown) => {
        console.error('[AdminSeasonalThemes] Preview assets could not be resolved:', error);
        if (active) {
          setPreviewLogoUrl('/logo.png');
          setPreviewFaviconUrl('/favicon.png');
        }
      });
    return () => { active = false; };
  }, [draft.seasonalFavicon, draft.seasonalLogo]);

  const updateDraft = (changes: Partial<SeasonalThemeConfig>) => {
    setDraft((current) => ({ ...current, ...changes }));
  };

  const saveDraft = async () => {
    setIsSaving(true);
    try {
      const saved = await seasonalThemeService.saveDraft(draft);
      setDraft(saved);
      notify('success', 'Draft saved', 'The public website is unchanged until you publish.');
    } catch (error) {
      notify('error', 'Draft could not be saved', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const publish = async () => {
    setIsSaving(true);
    try {
      const published = await seasonalThemeService.publish(draft);
      setDraft(published);
      notify('success', 'Seasonal appearance published', 'The public theme is live.');
    } catch (error) {
      notify('error', 'Theme was not published', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const addSchedule = () => {
    const startAt = fromColomboInput(scheduleStart);
    const endAt = fromColomboInput(scheduleEnd);
    if (!startAt || !endAt || Date.parse(endAt) <= Date.parse(startAt)) {
      notify('error', 'Invalid schedule', 'Choose an end date and time after the start.');
      return;
    }
    const candidate: SeasonalThemeSchedule = {
      id: newScheduleId(),
      theme: scheduleTheme,
      startAt,
      endAt,
    };
    const conflict = findScheduleConflict(draft.schedules, candidate);
    if (conflict) {
      notify('error', 'Schedule overlap', `This time overlaps the ${THEME_OPTIONS.find((option) => option.id === conflict.theme)?.label || conflict.theme} schedule. Resolve the overlap before saving.`);
      return;
    }
    updateDraft({ schedules: [...draft.schedules, candidate] });
    setScheduleStart('');
    setScheduleEnd('');
  };

  if (isLoading) {
    return <div className="p-8 text-sm text-slate-500">Loading seasonal appearance settings…</div>;
  }

  const activeTheme = draft.activeTheme;
  const previewThemeClass = `seasonal-preview seasonal-preview-${activeTheme}`;
  const previewModes: Array<{ id: PreviewMode; label: string; icon: React.ElementType }> = [
    { id: 'desktop', label: 'Desktop', icon: Monitor },
    { id: 'mobile', label: 'Mobile', icon: Smartphone },
    { id: 'hero', label: 'Hero', icon: Sparkles },
    { id: 'divisions', label: 'Divisions', icon: Building2 },
    { id: 'branding', label: 'Branding', icon: Eye },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Appearance</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-slate-950">Seasonal Themes</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Only published settings affect visitors. The website supports one active seasonal theme at a time.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={saveDraft} disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50">
            <Save className="h-4 w-4" /> Save draft
          </button>
          <button type="button" onClick={publish} disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            <Sparkles className="h-4 w-4" /> {isSaving ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,.9fr)]">
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">
            Active theme
            <select
              value={draft.activeTheme}
              onChange={(event) => {
                const active = event.target.value as SeasonalThemeId;
                updateDraft({ activeTheme: active, enabled: active !== 'default' });
              }}
              className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold normal-case text-slate-900"
            >
              {THEME_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </label>
          <p className="text-sm text-slate-600">{THEME_OPTIONS.find((option) => option.id === draft.activeTheme)?.description}</p>

          <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-800">
            <span>Enable seasonal appearance</span>
            <input
              type="checkbox"
              checked={draft.enabled}
              disabled={draft.activeTheme === 'default'}
              onChange={(event) => updateDraft({ enabled: event.target.checked })}
            />
          </label>

          <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">
            Activation
            <select
              value={draft.activationMode}
              onChange={(event) => updateDraft({ activationMode: event.target.value as SeasonalThemeConfig['activationMode'] })}
              className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold normal-case text-slate-900"
            >
              <option value="manual">Manual activation</option>
              <option value="schedule">Use published schedules</option>
            </select>
          </label>

          <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">
            Effect intensity
            <select
              value={draft.effectIntensity}
              onChange={(event) => updateDraft({ effectIntensity: event.target.value as SeasonalThemeConfig['effectIntensity'] })}
              className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold normal-case text-slate-900"
            >
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </label>

          <div className="space-y-4 rounded-xl border border-slate-200 p-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Seasonal animation intensity</h3>
              <p className="mt-1 text-xs text-slate-500">Set each effect independently. Zero hides it; 100 shows it at full opacity.</p>
            </div>
            {EFFECT_AMOUNT_OPTIONS.map(({ field, label }) => (
              <label key={field} className="block text-xs font-semibold text-slate-700">
                <span className="flex items-center justify-between gap-3">
                  {label}
                  <span className="tabular-nums text-slate-500">{draft[field]}%</span>
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={draft[field]}
                  onChange={(event) => updateDraft({ [field]: Number(event.target.value) })}
                  className="mt-2 block w-full accent-blue-700"
                  aria-label={label}
                />
              </label>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ['desktop', 'Enable desktop effects'],
              ['mobile', 'Enable mobile effects'],
              ['heroAnimation', 'Enable hero animation'],
            ] as const).map(([field, label]) => (
              <label key={field} className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={draft[field]} onChange={(event) => updateDraft({ [field]: event.target.checked })} />
                {label}
              </label>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ImageUploader
              category="branding"
              subfolder="seasonal"
              currentImageUrl={draft.seasonalLogo}
              label="Seasonal logo"
              helperText="Upload an optimized transparent logo variant. It is only shown for Christmas."
              onUploadSuccess={(item) => updateDraft({ seasonalLogo: item.url })}
              onDelete={() => updateDraft({ seasonalLogo: undefined })}
              options={{ maxWidth: 1200, maxHeight: 600, quality: 0.9 }}
            />
            <ImageUploader
              category="branding"
              subfolder="seasonal"
              currentImageUrl={draft.seasonalFavicon}
              label="Seasonal favicon"
              helperText="Upload a square PNG or WebP. The original favicon returns when Christmas ends."
              onUploadSuccess={(item) => updateDraft({ seasonalFavicon: item.url })}
              onDelete={() => updateDraft({ seasonalFavicon: undefined })}
              options={{ maxWidth: 512, maxHeight: 512, quality: 0.9 }}
            />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-950">Preview</h3>
            <p className="mt-1 text-xs text-slate-500">Preview is private to this admin view and does not publish or alter visitor settings.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {previewModes.map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => setPreviewMode(id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${previewMode === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            ))}
          </div>
          <div className={`${previewThemeClass} ${previewMode === 'mobile' ? 'mx-auto max-w-[280px]' : ''} min-h-56 overflow-hidden rounded-xl border border-slate-200 p-4`}>
            {previewMode === 'branding' ? (
              <div className="flex h-full min-h-48 flex-col items-center justify-center gap-4">
                <img src={previewLogoUrl} alt="Seasonal logo preview" className="max-h-20 max-w-[200px] object-contain" />
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  Favicon <img src={previewFaviconUrl} alt="" className="h-8 w-8 rounded border border-slate-200" />
                </div>
              </div>
            ) : previewMode === 'whatsapp' ? (
              <div className="flex min-h-48 items-end justify-end">
                <div className="w-56 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                  <p className="font-semibold text-slate-900">MAHDEV Support</p>
                  <p className="mt-3 rounded-lg bg-slate-100 p-2 text-xs text-slate-700">Hi! How can we help you today?</p>
                  <span className="mt-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white">WA</span>
                </div>
              </div>
            ) : (
              <>
                <div className="text-xs font-semibold opacity-80">MAHDEV · {THEME_OPTIONS.find((option) => option.id === draft.activeTheme)?.label}</div>
                <h4 className="mt-5 max-w-sm font-display text-2xl font-semibold">Creating moments. Capturing memories.</h4>
                {previewMode === 'divisions' ? (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {['SWS Events', 'U1 Studio', 'IT Solutions', 'Travels', 'Online Mart'].map((name) => <div key={name} className="rounded-lg border border-current/20 bg-white/70 p-2 text-xs">{name}</div>)}
                  </div>
                ) : (
                  <div className="mt-4 inline-flex rounded-full bg-blue-700 px-4 py-2 text-xs font-semibold text-white">
                    {previewMode === 'hero' ? 'Hero animation preview' : 'Explore our services'}
                  </div>
                )}
                <div className="mt-5 text-xs opacity-70">The active draft theme is previewed here. Effects respect reduced-motion settings.</div>
              </>
            )}
          </div>
        </section>
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-blue-700" />
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-950">Theme schedules</h3>
            <p className="text-xs text-slate-500">Times are interpreted as Sri Lanka time (Asia/Colombo) by the server.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <select value={scheduleTheme} onChange={(event) => setScheduleTheme(event.target.value as SeasonalThemeSchedule['theme'])} className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm">
            {THEME_OPTIONS.filter((option) => option.id !== 'default').map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
          <label className="text-xs font-semibold text-slate-600">Start (Sri Lanka time)<input type="datetime-local" value={scheduleStart} onChange={(event) => setScheduleStart(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="text-xs font-semibold text-slate-600">End (Sri Lanka time)<input type="datetime-local" value={scheduleEnd} onChange={(event) => setScheduleEnd(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" /></label>
          <button type="button" onClick={addSchedule} className="self-end rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Add schedule</button>
        </div>
        {draft.schedules.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">No activation windows configured.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {draft.schedules.map((schedule) => (
              <li key={schedule.id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
                <span className="font-semibold text-slate-800">{THEME_OPTIONS.find((option) => option.id === schedule.theme)?.label}</span>
                <span className="text-xs text-slate-600">{new Date(schedule.startAt).toLocaleString('en-LK', { timeZone: 'Asia/Colombo' })} – {new Date(schedule.endAt).toLocaleString('en-LK', { timeZone: 'Asia/Colombo' })}</span>
                <button type="button" onClick={() => updateDraft({ schedules: draft.schedules.filter((item) => item.id !== schedule.id) })} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700">Remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

function MessageCircle(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" /></svg>;
}
