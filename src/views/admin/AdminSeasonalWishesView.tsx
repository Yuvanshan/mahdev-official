import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Eye, Gift, Plus, Save, Trash2 } from 'lucide-react';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { ImageUploader } from '../../components/common/ImageUploader';
import { Button } from '../../components/ui/Button';
import { cmsService } from '../../services/cmsService';
import { CmsCoupon, SeasonalWishCampaign } from '../../types/cms';
import { campaignDateTimeToTimestamp, isSeasonalWishCampaignActive } from '../../utils/seasonalWishes';

type CampaignDraft = Omit<SeasonalWishCampaign, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'>;

function toDateTimeInput(timestamp: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(timestamp);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function newCampaignDraft(): CampaignDraft {
  const now = Date.now();
  const timezone = 'Asia/Colombo';
  return {
    name: '',
    occasion: 'Merry Christmas',
    greetingTitle: 'Merry Christmas!',
    greetingDescription: 'May your celebrations be filled with happiness and joy.',
    backgroundColor: '#7f1d1d',
    accentColor: '#f5c15c',
    textColor: '#ffffff',
    artworkUrl: '',
    backgroundArtworkUrl: '',
    couponId: '',
    ctaText: 'Claim your special offer',
    startAt: toDateTimeInput(now, timezone),
    endAt: toDateTimeInput(now + 7 * 86400000, timezone),
    timezone,
    displayDelayMs: 1200,
    animationDurationMs: 550,
    autoDismissSeconds: 0,
    desktopWidth: 520,
    mobileWidth: 92,
    animationType: 'slide',
    fontFamily: 'serif',
    isActive: false,
  };
}

function campaignDraft(campaign: SeasonalWishCampaign): CampaignDraft {
  return {
    name: campaign.name || '',
    occasion: campaign.occasion || '',
    greetingTitle: campaign.greetingTitle || '',
    greetingDescription: campaign.greetingDescription || '',
    backgroundColor: campaign.backgroundColor || '#7f1d1d',
    accentColor: campaign.accentColor || '#f5c15c',
    textColor: campaign.textColor || '#ffffff',
    artworkUrl: campaign.artworkUrl || '',
    backgroundArtworkUrl: campaign.backgroundArtworkUrl || '',
    couponId: campaign.couponId || '',
    ctaText: campaign.ctaText || 'Claim your special offer',
    startAt: campaign.startAt || '',
    endAt: campaign.endAt || '',
    timezone: campaign.timezone || 'Asia/Colombo',
    displayDelayMs: campaign.displayDelayMs || 0,
    animationDurationMs: campaign.animationDurationMs || 550,
    autoDismissSeconds: campaign.autoDismissSeconds || 0,
    desktopWidth: campaign.desktopWidth || 520,
    mobileWidth: campaign.mobileWidth || 92,
    animationType: campaign.animationType || 'slide',
    fontFamily: campaign.fontFamily || 'serif',
    isActive: campaign.isActive,
  };
}

export const AdminSeasonalWishesView: React.FC = () => {
  const [campaigns, setCampaigns] = useState<SeasonalWishCampaign[]>([]);
  const [coupons, setCoupons] = useState<CmsCoupon[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CampaignDraft>(newCampaignDraft);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [campaignToDelete, setCampaignToDelete] = useState<SeasonalWishCampaign | null>(null);
  const editingCampaign = campaigns.find((campaign) => campaign.id === selectedId) || null;
  const selectedCoupon = useMemo(
    () => coupons.find((coupon) => coupon.id === draft.couponId && coupon.isActive && !coupon.isDeleted) || null,
    [coupons, draft.couponId]
  );

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await Promise.all([
        cmsService.ensureSeasonalWishCampaignsLoaded(),
        cmsService.ensureCouponsLoaded(),
      ]);
      setCampaigns(cmsService.getAll<SeasonalWishCampaign>('seasonalWishCampaigns', { includeDeleted: true }));
      setCoupons(cmsService.getAll<CmsCoupon>('coupons', { includeDeleted: true }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Campaign data could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    const unsubscribeCampaigns = cmsService.subscribe('seasonalWishCampaigns', () =>
      setCampaigns(cmsService.getAll<SeasonalWishCampaign>('seasonalWishCampaigns', { includeDeleted: true }))
    );
    const unsubscribeCoupons = cmsService.subscribe('coupons', () =>
      setCoupons(cmsService.getAll<CmsCoupon>('coupons', { includeDeleted: true }))
    );
    return () => {
      unsubscribeCampaigns();
      unsubscribeCoupons();
    };
  }, []);

  const notify = (type: ToastMessage['type'], title: string, message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, type, title, message }]);
  };

  const updateDraft = (updates: Partial<CampaignDraft>) => setDraft((current) => ({ ...current, ...updates }));

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    if (!draft.name.trim() || !draft.greetingTitle.trim() || !draft.greetingDescription.trim()) {
      setErrorMessage('Campaign name, greeting title, and greeting description are required.');
      return;
    }
    try {
      new Intl.DateTimeFormat('en', { timeZone: draft.timezone });
    } catch {
      setErrorMessage('Enter a valid IANA timezone, such as Asia/Colombo.');
      return;
    }
    const startTimestamp = campaignDateTimeToTimestamp(draft.startAt, draft.timezone);
    const endTimestamp = campaignDateTimeToTimestamp(draft.endAt, draft.timezone);
    if (startTimestamp === null || endTimestamp === null || endTimestamp <= startTimestamp) {
      setErrorMessage('Enter valid start and end times in the campaign timezone; the end must be later than the start.');
      return;
    }
    if (draft.couponId && !coupons.some((coupon) => coupon.id === draft.couponId && coupon.isActive && !coupon.isDeleted)) {
      setErrorMessage('Choose an active existing coupon or clear the coupon selection.');
      return;
    }
    setIsSaving(true);
    try {
      if (editingCampaign) {
        await cmsService.update<SeasonalWishCampaign>('seasonalWishCampaigns', editingCampaign.id, draft);
        notify('success', 'Campaign updated', 'Your wishes campaign has been saved.');
      } else {
        const created = await cmsService.create<SeasonalWishCampaign>('seasonalWishCampaigns', draft);
        setSelectedId(created.id);
        notify('success', 'Campaign created', 'Your wishes campaign has been saved.');
      }
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Campaign could not be saved.');
      notify('error', 'Save failed', error instanceof Error ? error.message : 'Campaign could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectCampaign = (campaign: SeasonalWishCampaign) => {
    setSelectedId(campaign.id);
    setDraft(campaignDraft(campaign));
    setErrorMessage('');
  };

  const toggleCampaign = async (campaign: SeasonalWishCampaign) => {
    try {
      await cmsService.update<SeasonalWishCampaign>('seasonalWishCampaigns', campaign.id, {
        isActive: !campaign.isActive,
      });
      notify('success', campaign.isActive ? 'Campaign deactivated' : 'Campaign activated', campaign.name);
      await loadData();
    } catch (error) {
      notify('error', 'Campaign update failed', error instanceof Error ? error.message : 'Try again.');
    }
  };

  const deleteCampaign = async () => {
    if (!campaignToDelete) return;
    try {
      await cmsService.hardDelete('seasonalWishCampaigns', campaignToDelete.id);
      if (selectedId === campaignToDelete.id) {
        setSelectedId(null);
        setDraft(newCampaignDraft());
      }
      notify('success', 'Campaign deleted', campaignToDelete.name);
      setCampaignToDelete(null);
      await loadData();
    } catch (error) {
      notify('error', 'Delete failed', error instanceof Error ? error.message : 'Try again.');
    }
  };

  const previewCoupon = selectedCoupon
    ? `${selectedCoupon.discountValue}${selectedCoupon.discountType === 'percentage' ? '% OFF' : ` ${selectedCoupon.currency} OFF`}`
    : '';

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <header className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700"><Gift className="h-5 w-5" /></span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-950">Seasonal Wishes &amp; Promotional Campaigns</h1>
            <p className="mt-1 text-sm text-slate-600">Create scheduled greetings and connect them to existing coupons.</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,.7fr)]">
        <form onSubmit={handleSave} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-slate-950">{editingCampaign ? 'Edit campaign' : 'Create campaign'}</h2>
            <Button type="button" variant="outline" onClick={() => { setSelectedId(null); setDraft(newCampaignDraft()); setErrorMessage(''); }}>
              <Plus className="h-4 w-4" /> New
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Campaign name
              <input required value={draft.name} onChange={(event) => updateDraft({ name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Christmas 2026" />
            </label>
            <label className="text-sm font-medium text-slate-700">Occasion label
              <input value={draft.occasion} onChange={(event) => updateDraft({ occasion: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Merry Christmas" />
            </label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Greeting title
              <input required value={draft.greetingTitle} onChange={(event) => updateDraft({ greetingTitle: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Merry Christmas!" />
            </label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Greeting message
              <textarea required rows={2} value={draft.greetingDescription} onChange={(event) => updateDraft({ greetingDescription: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm font-medium text-slate-700">CTA button text
              <input value={draft.ctaText} onChange={(event) => updateDraft({ ctaText: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm font-medium text-slate-700">Existing coupon
              <select value={draft.couponId} onChange={(event) => updateDraft({ couponId: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
                <option value="">No coupon</option>
                {coupons.filter((coupon) => coupon.isActive && !coupon.isDeleted).map((coupon) => (
                  <option key={coupon.id} value={coupon.id}>{coupon.code} — {coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : ` ${coupon.currency}`}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploader category="branding" subfolder="seasonal-wishes" currentImageUrl={draft.artworkUrl || undefined} label="Seasonal artwork (e.g. realistic Santa)" helperText="Upload high-quality transparent artwork; it is integrated into the wishes card." onUploadSuccess={(item) => updateDraft({ artworkUrl: item.url })} onDelete={() => updateDraft({ artworkUrl: '' })} />
            <ImageUploader category="branding" subfolder="seasonal-wishes" currentImageUrl={draft.backgroundArtworkUrl || undefined} label="Card background artwork" helperText="Optional background artwork for this campaign." onUploadSuccess={(item) => updateDraft({ backgroundArtworkUrl: item.url })} onDelete={() => updateDraft({ backgroundArtworkUrl: '' })} />
          </div>

          <fieldset className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-3">
            <legend className="px-2 text-sm font-semibold text-slate-700">Card styling</legend>
            {([
              ['backgroundColor', 'Background'],
              ['accentColor', 'Accent'],
              ['textColor', 'Text'],
            ] as const).map(([field, label]) => (
              <label key={field} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="color" value={draft[field]} onChange={(event) => updateDraft({ [field]: event.target.value })} className="h-9 w-12 cursor-pointer rounded border border-slate-200" />
                {label}
              </label>
            ))}
            <label className="text-sm text-slate-700 sm:col-span-3">Font style
              <select value={draft.fontFamily} onChange={(event) => updateDraft({ fontFamily: event.target.value as CampaignDraft['fontFamily'] })} className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
                <option value="serif">Editorial serif</option><option value="sans">Modern sans</option><option value="display">Display</option>
              </select>
            </label>
          </fieldset>

          <fieldset className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
            <legend className="px-2 text-sm font-semibold text-slate-700">Schedule and timing</legend>
            <label className="text-sm text-slate-700">Starts
              <input type="datetime-local" value={draft.startAt} onChange={(event) => updateDraft({ startAt: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm text-slate-700">Ends
              <input type="datetime-local" value={draft.endAt} onChange={(event) => updateDraft({ endAt: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm text-slate-700">Timezone (IANA)
              <input value={draft.timezone} onChange={(event) => updateDraft({ timezone: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Asia/Colombo" />
            </label>
            <label className="text-sm text-slate-700">Display delay (ms)
              <input type="number" min="0" max="60000" value={draft.displayDelayMs} onChange={(event) => updateDraft({ displayDelayMs: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm text-slate-700">Animation duration (ms)
              <input type="number" min="180" max="2000" value={draft.animationDurationMs} onChange={(event) => updateDraft({ animationDurationMs: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm text-slate-700">Auto-dismiss (seconds; 0 = off)
              <input type="number" min="0" max="86400" value={draft.autoDismissSeconds} onChange={(event) => updateDraft({ autoDismissSeconds: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm text-slate-700">Entrance animation
              <select value={draft.animationType} onChange={(event) => updateDraft({ animationType: event.target.value as CampaignDraft['animationType'] })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="slide">Hanging slide</option><option value="fade">Soft fade</option></select>
            </label>
          </fieldset>

          <fieldset className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-3">
            <legend className="px-2 text-sm font-semibold text-slate-700">Responsive card width</legend>
            <label className="text-sm text-slate-700">Desktop max width (px)
              <input type="number" min="320" max="900" value={draft.desktopWidth} onChange={(event) => updateDraft({ desktopWidth: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm text-slate-700">Mobile width (%)
              <input type="number" min="80" max="98" value={draft.mobileWidth} onChange={(event) => updateDraft({ mobileWidth: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="flex items-center gap-2 pt-6 text-sm font-semibold text-slate-700"><input type="checkbox" checked={draft.isActive} onChange={(event) => updateDraft({ isActive: event.target.checked })} />Campaign active</label>
          </fieldset>

          {errorMessage && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{errorMessage}</p>}
          <Button type="submit" disabled={isSaving} className="w-full sm:w-auto"><Save className="h-4 w-4" />{isSaving ? 'Saving…' : 'Save campaign'}</Button>
        </form>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2"><Eye className="h-4 w-4 text-slate-500" /><h2 className="font-semibold text-slate-900">Live preview</h2></div>
            <div className={`seasonal-wishes-preview seasonal-wishes-font-${draft.fontFamily}`} style={{ backgroundColor: draft.backgroundColor, color: draft.textColor, borderColor: draft.accentColor, backgroundImage: draft.backgroundArtworkUrl ? `linear-gradient(115deg, rgb(9 17 35 / 78%), rgb(9 17 35 / 26%)), url("${draft.backgroundArtworkUrl}")` : undefined }}>
              {draft.artworkUrl && <img src={draft.artworkUrl} alt="" className="seasonal-wishes-preview-art" />}
              <p style={{ color: draft.accentColor }}>{draft.occasion || 'Seasonal wishes'}</p>
              <h3>{draft.greetingTitle || 'Your greeting title'}</h3>
              <p>{draft.greetingDescription || 'Your campaign message appears here.'}</p>
              {previewCoupon && <strong style={{ color: draft.accentColor }}>{previewCoupon}</strong>}
              <span style={{ backgroundColor: draft.accentColor, color: draft.backgroundColor }}>{draft.ctaText}</span>
            </div>
            <p className="mt-3 text-xs text-slate-500">The preview uses the same responsive card style as the customer popup.</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Campaigns</h2>
            {isLoading ? <p className="text-sm text-slate-500">Loading campaigns…</p> : campaigns.length === 0 ? <p className="text-sm text-slate-500">No campaigns yet. Create your first wishes campaign.</p> : (
              <ul className="space-y-2">
                {campaigns.map((campaign) => (
                  <li key={campaign.id} className={`rounded-xl border p-3 ${selectedId === campaign.id ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <button type="button" onClick={() => selectCampaign(campaign)} className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-sm font-semibold text-slate-900">{campaign.name}</span>
                        <span className="mt-1 flex items-center gap-1 text-xs text-slate-500"><CalendarClock className="h-3 w-3" />{campaign.startAt} · {campaign.timezone}</span>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${isSeasonalWishCampaignActive(campaign) ? 'bg-emerald-100 text-emerald-800' : campaign.isActive ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                          {isSeasonalWishCampaignActive(campaign) ? 'Live now' : campaign.isActive ? 'Scheduled' : 'Inactive'}
                        </span>
                      </button>
                      <div className="flex shrink-0 gap-1">
                        <button type="button" onClick={() => void toggleCampaign(campaign)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700">{campaign.isActive ? 'Deactivate' : 'Activate'}</button>
                        <button type="button" aria-label={`Delete ${campaign.name}`} onClick={() => setCampaignToDelete(campaign)} className="rounded-lg p-2 text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
      <AdminConfirmDialog
        isOpen={Boolean(campaignToDelete)}
        title="Delete seasonal campaign"
        message={`Permanently delete "${campaignToDelete?.name}"? This cannot be undone.`}
        itemIdentifier={campaignToDelete?.id}
        confirmLabel="Delete campaign"
        allowSoftDelete={false}
        onConfirm={deleteCampaign}
        onCancel={() => setCampaignToDelete(null)}
      />
    </div>
  );
};
