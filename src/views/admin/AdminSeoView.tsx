import React, { useState } from 'react';
import {
  Globe,
  Save,
  Search,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Layers,
  Eye,
  FileCode,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';

interface PageSeoEntry {
  route: string;
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
  canonicalUrl: string;
  allowIndexing: boolean;
}

const DEFAULT_SEO_CONFIGS: PageSeoEntry[] = [
  {
    route: '/',
    title: 'Mahdev Pvt Ltd | Integrated Enterprise Conglomerate Sri Lanka',
    description: 'Premier enterprise provider across Events (SWS), Cinematography (U1 Studio), Enterprise IT & Cloud, Luxury Travels, and Broadcast Hardware.',
    keywords: 'mahdev, sws event management, u1 studio, mahdev it, mahdev travels, colombo, sri lanka',
    ogImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    canonicalUrl: 'https://mahdev.lk/',
    allowIndexing: true,
  },
  {
    route: '/events',
    title: 'SWS Event Management | Premier Stage & Audio Visual Production',
    description: 'World-class corporate concert audio, 4K LED volume matrix stages, and luxury wedding event architecture in Sri Lanka.',
    keywords: 'sws events, audio visual colombo, stage lighting, concert sound sri lanka, luxury wedding mandap',
    ogImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    canonicalUrl: 'https://mahdev.lk/events',
    allowIndexing: true,
  },
  {
    route: '/studio',
    title: 'U1 Studio | High-End 8K Cinema, Fashion & Commercial Photography',
    description: 'Cinematic visual storytelling, 8K RED cinema production, commercial campaigns, and editorial studio photography.',
    keywords: 'u1 studio, cinema 8k, red camera colombo, commercial photography sri lanka, bridal cinema',
    ogImage: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
    canonicalUrl: 'https://mahdev.lk/studio',
    allowIndexing: true,
  },
  {
    route: '/it',
    title: 'Mahdev IT | Enterprise Software, Cloud Architecture & Cyber Defense',
    description: 'Enterprise React web applications, scalable microservices, low-latency APIs, and cloud infrastructure monitoring.',
    keywords: 'mahdev it, enterprise software colombo, devops, cloud infrastructure, full-stack react',
    ogImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    canonicalUrl: 'https://mahdev.lk/it',
    allowIndexing: true,
  },
  {
    route: '/travels',
    title: 'Mahdev Travels | Luxury Bespoke Expeditions & VIP Concierge',
    description: 'Chartered aerial transfers, luxury tea country estates, private yacht charters, and VIP concierge travel in Sri Lanka.',
    keywords: 'mahdev travels, luxury travel sri lanka, helicopter transfer sigiriya, vip chauffeur colombo',
    ogImage: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80',
    canonicalUrl: 'https://mahdev.lk/travels',
    allowIndexing: true,
  },
  {
    route: '/mart',
    title: 'Mahdev Online Mart | Professional Broadcast & Production Equipment',
    description: 'Authorized distributor of calibrated cinema cameras, studio lighting, pro audio trusses, and computing hardware.',
    keywords: 'mahdev mart, buy sony fx9 colombo, broadcast gear sri lanka, studio lighting store',
    ogImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
    canonicalUrl: 'https://mahdev.lk/mart',
    allowIndexing: true,
  },
];

const SEO_STORAGE_KEY = 'mahdev_cms_seo_configs_v1';

export const AdminSeoView: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [configs, setConfigs] = useState<PageSeoEntry[]>(() => {
    const saved = localStorage.getItem(SEO_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_SEO_CONFIGS;
  });

  const [activeRoute, setActiveRoute] = useState<string>('/');
  const [isSaving, setIsSaving] = useState(false);

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const currentEntry = configs.find((c) => c.route === activeRoute) || configs[0];

  const handleUpdateCurrent = (field: keyof PageSeoEntry, value: any) => {
    setConfigs((prev) =>
      prev.map((item) => (item.route === activeRoute ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveAll = () => {
    setIsSaving(true);
    try {
      localStorage.setItem(SEO_STORAGE_KEY, JSON.stringify(configs));
      addToast('success', 'SEO Configs Saved', 'Search engine metadata updated successfully.');
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not save SEO configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Container */}
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              SEO Engine, OpenGraph & Search Indexing
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Optimize page metadata, title hierarchies, OpenGraph social cards, canonical routes, and crawler indexation rules.
          </p>
        </div>

        <Button
          variant="electric"
          size="sm"
          onClick={handleSaveAll}
          disabled={isSaving}
          leftIcon={<Save className="w-4 h-4" />}
          className="text-xs font-bold shrink-0"
        >
          {isSaving ? 'Saving...' : 'Publish SEO Rules'}
        </Button>
      </div>

      {/* Route Selector Strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {configs.map((c) => (
          <button
            key={c.route}
            onClick={() => setActiveRoute(c.route)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
              activeRoute === c.route
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90'
            }`}
          >
            {c.route === '/' ? 'Homepage (/)' : c.route}
          </button>
        ))}
      </div>

      {/* Editor & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Inputs */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-display text-sm font-bold text-slate-900">
              Editing Meta for Route: <code className="text-blue-600 font-mono">{currentEntry.route}</code>
            </h3>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={currentEntry.allowIndexing}
                onChange={(e) => handleUpdateCurrent('allowIndexing', e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Indexable (robots: index, follow)</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Page Title &lt;title&gt; ({currentEntry.title.length} chars)
            </label>
            <input
              type="text"
              value={currentEntry.title}
              onChange={(e) => handleUpdateCurrent('title', e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Meta Description ({currentEntry.description.length} chars)
            </label>
            <textarea
              rows={3}
              value={currentEntry.description}
              onChange={(e) => handleUpdateCurrent('description', e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Focus Keywords
            </label>
            <input
              type="text"
              value={currentEntry.keywords}
              onChange={(e) => handleUpdateCurrent('keywords', e.target.value)}
              placeholder="comma, separated, keywords"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Canonical URL
              </label>
              <input
                type="text"
                value={currentEntry.canonicalUrl}
                onChange={(e) => handleUpdateCurrent('canonicalUrl', e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                OpenGraph Image URL
              </label>
              <input
                type="url"
                value={currentEntry.ogImage}
                onChange={(e) => handleUpdateCurrent('ogImage', e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Live SERP & Social Preview */}
        <div className="lg:col-span-5 space-y-4">
          {/* Google Search Result Preview */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
              Live Google Search Preview
            </span>
            <div className="space-y-1">
              <div className="text-[11px] text-slate-600 font-sans flex items-center gap-1.5 truncate">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">M</span>
                <span>mahdev.lk{currentEntry.route === '/' ? '' : currentEntry.route}</span>
              </div>
              <h4 className="text-base text-blue-800 hover:underline font-medium cursor-pointer leading-tight">
                {currentEntry.title || 'Page Title'}
              </h4>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {currentEntry.description || 'Page meta description will appear here in search snippets.'}
              </p>
            </div>
          </div>

          {/* Social OpenGraph Preview Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
              Social Share / OpenGraph Card Preview
            </span>
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              <div className="aspect-video bg-slate-900 overflow-hidden">
                <img
                  src={currentEntry.ogImage}
                  alt="OG Preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-3 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400">mahdev.lk</span>
                <h5 className="font-display text-xs font-bold text-slate-900 line-clamp-1">
                  {currentEntry.title}
                </h5>
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  {currentEntry.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
