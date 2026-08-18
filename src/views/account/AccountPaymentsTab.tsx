import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Search,
  Lock,
  Zap,
} from 'lucide-react';
import { PaymentTransaction } from '../../types/payment';
import { Button } from '../../components/ui/Button';

interface AccountPaymentsTabProps {
  transactions: PaymentTransaction[];
  onNavigate: (path: string) => void;
}

export const AccountPaymentsTab: React.FC<AccountPaymentsTabProps> = ({
  transactions,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = transactions.filter((t) => {
    return (
      searchQuery === '' ||
      t.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.gatewayName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              Payment & Settlement Transactions ({transactions.length})
            </h3>
            <p className="text-xs text-slate-500">
              Cryptographically verified payment logs via Stripe, LankaPay IPG, and Bank Wire.
            </p>
          </div>

          <div className="relative sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Transaction or Order..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CreditCard className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display text-base font-bold text-slate-900">No Payment Records</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? 'No payment records match your search query.'
                : 'No settled payment transactions have been logged under your customer profile yet.'}
            </p>
          </div>
          <Button
            variant="electric"
            size="sm"
            onClick={() => onNavigate('/catalog')}
            className="text-xs font-bold"
          >
            Explore Catalog
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-mono font-bold">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Gateway Channel</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Auth Code / RRN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filtered.map((txn) => (
                  <tr key={txn.transactionId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{txn.transactionId}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onNavigate(`/order/${txn.orderId}`)}
                        className="text-blue-600 hover:underline font-bold"
                      >
                        {txn.orderId}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-700">{txn.gatewayName}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ${txn.amount.toFixed(2)} {txn.currency}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          txn.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : txn.paymentStatus === 'failed'
                            ? 'bg-rose-100 text-rose-800'
                            : txn.paymentStatus === 'cancelled'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {txn.paymentStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] font-sans">
                      {new Date(txn.timestamp).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {txn.verificationResult?.authCode ? (
                        <div className="space-y-0.5">
                          <span className="text-emerald-700 font-bold text-[11px] block">
                            AUTH: {txn.verificationResult.authCode}
                          </span>
                          <span className="text-slate-400 text-[10px] block">
                            RRN: {txn.verificationResult.rrn}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-sans">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
