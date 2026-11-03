import React, { useEffect, useState } from 'react';
import { CalendarDays, Pencil, Save, X } from 'lucide-react';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { seasonalThemeService, findScheduleConflict } from '../../services/seasonalThemeService';
import {
  DEFAULT_SEASONAL_THEME,
  SeasonalThemeConfig,
  SeasonalThemeSchedule,
} from '../../types/seasonalTheme';

const THEME_OPTIONS: Array<{ id: SeasonalThemeSchedule['theme']; label: string }> = [
  { id: 'christmas', label: 'Christmas' },
  { id: 'newYear', label: 'New Year' },
  { id: 'valentines', label: "Valentine's Day" },
  { id: 'diwali', label: 'Diwali' },
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
  const [scheduleTheme, setScheduleTheme] = useState<SeasonalThemeSchedule['theme']>('christmas');
  const [scheduleStart, setScheduleStart] = useState('');
  const [scheduleEnd, setScheduleEnd] = useState('');
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = (type: ToastMessage['type'], title: string, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4500);
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      seasonalThemeService.getDraft(),
      seasonalThemeService.getPublishedForAdmin(),
    ])
      .then(([latest, published]) => {
        if (!active) return;
        const base = published.updatedAt ? published : latest;
        setDraft({ ...base, schedules: [...latest.schedules] });
      })
      .catch((error: unknown) => {
        console.error('[AdminSeasonalThemes] Schedules could not be loaded:', error);
        if (active) notify('error', 'Could not load schedules', error instanceof Error ? error.message : 'Try again.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const addOrUpdateSchedule = () => {
    const startAt = fromColomboInput(scheduleStart);
    const endAt = fromColomboInput(scheduleEnd);
    if (!startAt || !endAt || Date.parse(endAt) <= Date.parse(startAt)) {
      notify('error', 'Invalid schedule', 'Choose an end date and time after the start.');
      return;
    }

    const candidate: SeasonalThemeSchedule = {
      id: editingScheduleId || newScheduleId(),
      theme: scheduleTheme,
      startAt,
      endAt,
    };
    const conflict = findScheduleConflict(draft.schedules, candidate);
    if (conflict) {
      const conflictName = THEME_OPTIONS.find((option) => option.id === conflict.theme)?.label || conflict.theme;
      notify('error', 'Schedule overlap', `This time overlaps the ${conflictName} schedule.`);
      return;
    }

    setDraft((current) => ({
      ...current,
      schedules: editingScheduleId
        ? current.schedules.map((schedule) => schedule.id === editingScheduleId ? candidate : schedule)
        : [...current.schedules, candidate],
    }));
    setEditingScheduleId(null);
    setScheduleStart('');
    setScheduleEnd('');
  };

  const editSchedule = (schedule: SeasonalThemeSchedule) => {
    setEditingScheduleId(schedule.id);
    setScheduleTheme(schedule.theme);
    setScheduleStart(toColomboInput(schedule.startAt));
    setScheduleEnd(toColomboInput(schedule.endAt));
  };

  const cancelScheduleEdit = () => {
    setEditingScheduleId(null);
    setScheduleStart('');
    setScheduleEnd('');
  };

  const removeSchedule = (id: string) => {
    setDraft((current) => ({
      ...current,
      schedules: current.schedules.filter((schedule) => schedule.id !== id),
    }));
    if (editingScheduleId === id) cancelScheduleEdit();
  };

  const saveSchedules = async () => {
    setIsSaving(true);
    try {
      const saved = await seasonalThemeService.publish({
        ...draft,
        enabled: draft.schedules.length > 0,
        activationMode: 'schedule',
      });
      setDraft(saved);
      notify('success', 'Schedules published', 'The seasonal theme schedule is live on the website.');
    } catch (error) {
      notify('error', 'Schedules could not be saved', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-sm text-slate-500">Loading seasonal schedules…</div>;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:p-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Appearance</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-slate-950">Seasonal Theme Schedule</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Add, edit, or remove activation windows. Times use Sri Lanka time (Asia/Colombo).
          </p>
        </div>
        <button
          type="button"
          onClick={() => void saveSchedules()}
          disabled={isSaving}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {isSaving ? 'Saving…' : 'Save schedule'}
        </button>
      </header>

      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-blue-700" />
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-950">Theme activation windows</h2>
            <p className="text-xs text-slate-500">Scheduled themes activate automatically during their date and time window.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="text-xs font-semibold text-slate-600">
            Theme
            <select
              value={scheduleTheme}
              onChange={(event) => setScheduleTheme(event.target.value as SeasonalThemeSchedule['theme'])}
              className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900"
            >
              {THEME_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Start (Sri Lanka time)
            <input type="datetime-local" value={scheduleStart} onChange={(event) => setScheduleStart(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal text-slate-900" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            End (Sri Lanka time)
            <input type="datetime-local" value={scheduleEnd} onChange={(event) => setScheduleEnd(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal text-slate-900" />
          </label>
          <div className="flex items-end gap-2">
            {editingScheduleId && (
              <button type="button" onClick={cancelScheduleEdit} aria-label="Cancel schedule edit" className="rounded-xl border border-slate-300 p-2.5 text-slate-600 hover:bg-slate-50">
                <X className="h-4 w-4" />
              </button>
            )}
            <button type="button" onClick={addOrUpdateSchedule} className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
              {editingScheduleId ? 'Update window' : 'Add window'}
            </button>
          </div>
        </div>

        {draft.schedules.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No activation windows configured.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {draft.schedules
              .slice()
              .sort((left, right) => Date.parse(left.startAt) - Date.parse(right.startAt))
              .map((schedule) => (
                <li key={schedule.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold text-slate-800">{THEME_OPTIONS.find((option) => option.id === schedule.theme)?.label}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {new Date(schedule.startAt).toLocaleString('en-LK', { timeZone: 'Asia/Colombo' })}
                      {' – '}
                      {new Date(schedule.endAt).toLocaleString('en-LK', { timeZone: 'Asia/Colombo' })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => editSchedule(schedule)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700">
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                    <button type="button" onClick={() => removeSchedule(schedule.id)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                      Remove
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
};
