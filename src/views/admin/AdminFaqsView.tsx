import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Edit2, Eye, EyeOff, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { FAQ_PAGES, FirestoreFAQ, firestoreFaqsService } from '../../services/firestore/faqs';
import { SWS_FAQS } from '../../data/swsLocalSeo';

type Draft = Pick<FirestoreFAQ, 'question' | 'answer' | 'isActive' | 'pages'>;
const EMPTY_DRAFT: Draft = { question: '', answer: '', isActive: true, pages: ['contact'] };

const newId = () => `faq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

/**
 * Admin → FAQs: add, edit, reorder, publish/hide and delete the FAQs shown on
 * the website (Contact page). Changes reach the public site within
 * the snapshot cache window (about 5 minutes).
 */
export const AdminFaqsView: React.FC = () => {
  const [faqs, setFaqs] = useState<FirestoreFAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null); // 'new' for a new FAQ
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setFaqs(await firestoreFaqsService.getFaqs());
    } catch {
      setMessage({ type: 'error', text: 'FAQs could not be loaded. Please refresh and try again.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (action: () => Promise<void>, success: string) => {
    setIsSaving(true);
    setMessage(null);
    try {
      await action();
      await load();
      setMessage({ type: 'success', text: `${success} The website updates within about 5 minutes.` });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Saving failed. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (faq?: FirestoreFAQ) => {
    setEditingId(faq ? faq.id : 'new');
    setDraft(faq
      ? { question: faq.question, answer: faq.answer, isActive: faq.isActive !== false, pages: faq.pages || [] }
      : EMPTY_DRAFT);
  };

  const saveDraft = () => {
    const question = draft.question.trim();
    const answer = draft.answer.trim();
    if (!question || !answer) {
      setMessage({ type: 'error', text: 'Enter both a question and an answer.' });
      return;
    }
    if (!draft.pages?.length) {
      setMessage({ type: 'error', text: 'Choose at least one page to show this FAQ on.' });
      return;
    }
    const isNew = editingId === 'new';
    const id = isNew ? newId() : editingId!;
    const order = isNew ? (faqs.length ? Math.max(...faqs.map((f) => f.order || 0)) + 1 : 1) : faqs.find((f) => f.id === id)?.order ?? 0;
    void run(async () => {
      await firestoreFaqsService.saveFaq(id, {
        question,
        answer,
        isActive: draft.isActive,
        pages: draft.pages,
        order,
        ...(isNew ? { createdAt: new Date().toISOString() } : {}),
      });
      setEditingId(null);
    }, isNew ? 'FAQ added.' : 'FAQ updated.');
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= faqs.length) return;
    const reordered = [...faqs];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    void run(async () => {
      // Renumber everything so the order is always clean (1, 2, 3...).
      await Promise.all(reordered.map((faq, i) => firestoreFaqsService.saveFaq(faq.id, { order: i + 1 })));
    }, 'Order updated.');
  };

  const importDefaults = () => {
    void run(async () => {
      await Promise.all(SWS_FAQS.map((faq, i) => firestoreFaqsService.saveFaq(newId() + i, {
        question: faq.question,
        answer: faq.answer,
        isActive: true,
        pages: ['contact'],
        order: i + 1,
        createdAt: new Date().toISOString(),
      })));
    }, 'Default FAQs imported.');
  };

  const togglePage = (pageId: string) => {
    setDraft((current) => {
      const pages = new Set(current.pages || []);
      if (pages.has(pageId)) pages.delete(pageId); else pages.add(pageId);
      return { ...current, pages: [...pages] };
    });
  };

  const editor = (
    <div className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50/40 p-5">
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-700" htmlFor="faq-question">Question</label>
        <input
          id="faq-question"
          value={draft.question}
          onChange={(e) => setDraft({ ...draft, question: e.target.value })}
          maxLength={200}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-700" htmlFor="faq-answer">Answer</label>
        <textarea
          id="faq-answer"
          value={draft.answer}
          onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
          rows={4}
          maxLength={1500}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
      </div>
      <fieldset>
        <legend className="mb-1 text-xs font-semibold text-slate-700">Show on</legend>
        <div className="flex flex-wrap gap-4">
          {FAQ_PAGES.map((page) => (
            <label key={page.id} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={draft.pages?.includes(page.id) || false} onChange={() => togglePage(page.id)} />
              {page.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} />
        Published (visible on the website)
      </label>
      <div className="flex gap-2">
        <button type="button" onClick={saveDraft} disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
        </button>
        <button type="button" onClick={() => setEditingId(null)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
          <X className="h-4 w-4" /> Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900">FAQs</h2>
          <p className="text-xs text-slate-500">Questions shown on the Contact page, also published to Google as FAQ results.</p>
        </div>
        <button type="button" onClick={() => startEdit()} disabled={isSaving || editingId !== null} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          <Plus className="h-4 w-4" /> Add FAQ
        </button>
      </div>

      {message && (
        <div role="status" className={`rounded-xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
          {message.text}
        </div>
      )}

      {editingId === 'new' && editor}

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading FAQs…
        </div>
      ) : faqs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          <p>No FAQs saved yet, so the website shows the {SWS_FAQS.length} built-in questions.</p>
          <button type="button" onClick={importDefaults} disabled={isSaving} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50">
            Import default FAQs to edit them
          </button>
        </div>
      ) : (
        <ol className="space-y-3">
          {faqs.map((faq, index) => (
            <li key={faq.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              {editingId === faq.id ? editor : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{index + 1}. {faq.question}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{faq.answer}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {faq.isActive === false ? 'Hidden' : 'Published'} · Shown on: {(faq.pages || []).map((p) => FAQ_PAGES.find((x) => x.id === p)?.id || p).join(', ') || 'no pages'}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" title="Move up" disabled={isSaving || index === 0} onClick={() => move(index, -1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" title="Move down" disabled={isSaving || index === faqs.length - 1} onClick={() => move(index, 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><ArrowDown className="h-4 w-4" /></button>
                    <button type="button" title={faq.isActive === false ? 'Publish' : 'Hide'} disabled={isSaving} onClick={() => void run(() => firestoreFaqsService.saveFaq(faq.id, { isActive: faq.isActive === false }), faq.isActive === false ? 'FAQ published.' : 'FAQ hidden.')} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40">
                      {faq.isActive === false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button type="button" title="Edit" disabled={isSaving || editingId !== null} onClick={() => startEdit(faq)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><Edit2 className="h-4 w-4" /></button>
                    <button
                      type="button"
                      title="Delete"
                      disabled={isSaving}
                      onClick={() => {
                        if (window.confirm(`Delete this FAQ?\n\n${faq.question}`)) {
                          void run(() => firestoreFaqsService.deleteFaq(faq.id), 'FAQ deleted.');
                        }
                      }}
                      className="rounded-lg border border-rose-200 p-2 text-rose-600 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
