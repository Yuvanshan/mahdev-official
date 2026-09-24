import React from 'react';
import { Search, ArrowLeft, MessageCircle } from 'lucide-react';
import { openWhatsAppInquiry } from '../../utils/whatsapp';

interface InquiryItemNotFoundProps {
  query?: string;
  onBrowseAll?: () => void;
  onNavigate?: (route: string) => void;
}

export const InquiryItemNotFound: React.FC<InquiryItemNotFoundProps> = ({
  query,
  onBrowseAll,
  onNavigate,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
          <Search className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-display text-slate-900">
            Item or Product Not Located
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            {query ? (
              <>
                We could not locate reference <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded-sm">"{query}"</span> in our verified active records. The item may have been updated, moved, or archived.
              </>
            ) : (
              'The requested item or media asset is not available in our verified active collection.'
            )}
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          {onBrowseAll && (
            <button
              type="button"
              onClick={onBrowseAll}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Browse Full Collection</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              openWhatsAppInquiry({
                title: query ? `Inquiry regarding code: ${query}` : 'General Inquiry',
                sku: query || 'UNKNOWN',
                category: 'Customer Support',
                description: `Client navigated to inquiry link with query: ${query || 'N/A'}. Item was not located in Firestore catalog.`,
                type: 'general',
              });
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Inquire on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
