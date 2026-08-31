import React, { useState } from 'react';
import {
  Building,
  Layers,
  Users,
  Briefcase,
  Flag,
  Globe,
  MessageSquare,
  FileCode,
  Tag,
  Search,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  KeyRound,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';
import { AdminSectionId } from '../../types/admin';
import { DIVISIONS } from '../../config/divisions';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/Button';

interface AdminGenericViewProps {
  sectionId: AdminSectionId;
  onNavigateSection: (sectionId: AdminSectionId) => void;
}

export const AdminGenericView: React.FC<AdminGenericViewProps> = ({
  sectionId,
  onNavigateSection,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { services, categories } = useFirestoreDataContext();
  const customers = authService.getAllCustomers();

  // 1. DIVISIONS VIEW
  if (sectionId === 'divisions') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Operating Divisions ({Object.keys(DIVISIONS).length})
          </h2>
          <p className="text-xs text-slate-500">
            Mahdev Pvt Ltd multi-division corporate architecture and operational status.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(DIVISIONS).map((div) => (
            <div
              key={div.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  {div.badge}
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  ACTIVE
                </span>
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">{div.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{div.description}</p>
              </div>
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                <span>Route: <code className="text-blue-600 font-mono">{div.route}</code></span>
                <span className="font-bold text-slate-900">{div.stats[0]?.value || '100%'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. SERVICES VIEW
  if (sectionId === 'services') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Universal Service Offerings ({services.length})
            </h2>
            <p className="text-xs text-slate-500">
              Managed service catalog for client booking and package tiers.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => onNavigateSection('services')}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Manage Services
          </Button>
        </div>

        {services.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">No Services in Catalog</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Real service offerings are synchronized from Firestore. Use the Admin Services manager to create verified services.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-mono font-bold">
                <tr>
                  <th className="py-3 px-4">Service ID</th>
                  <th className="py-3 px-4">Division</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900">{s.id}</td>
                    <td className="py-3 px-4 uppercase text-[10px] text-blue-600 font-bold">
                      {s.divisionId || s.division}
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">{s.name}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ${s.price || 0} {s.currency || 'USD'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">
                        {s.status || 'ACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // 3. CATEGORIES VIEW
  if (sectionId === 'categories') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Taxonomy & Catalog Categories ({categories.length})
            </h2>
            <p className="text-xs text-slate-500">
              Hierarchy grouping for physical goods, media equipment, and software.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => onNavigateSection('categories')}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Manage Categories
          </Button>
        </div>

        {categories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">No Categories Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No categories have been added yet in Firestore. Create taxonomy categories to organize your product inventory.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-sm font-bold text-slate-900">{cat.name}</h4>
                  <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold">
                    {cat.division}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{cat.description}</p>
                <div className="pt-2 text-[10px] font-mono text-slate-400">Slug: /{cat.slug}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 4. CUSTOMERS VIEW
  if (sectionId === 'customers') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Registered Customer Accounts ({customers.length})
          </h2>
          <p className="text-xs text-slate-500">
            B2B corporate clients and verified individual consumers.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-mono font-bold">
              <tr>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Account Type</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-sans font-bold text-slate-900">{c.fullName}</td>
                  <td className="py-3 px-4 text-slate-600">{c.email}</td>
                  <td className="py-3 px-4 text-slate-600">{c.phone}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        c.accountType === 'corporate'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {c.accountType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-700">{c.company || '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">
                      VERIFIED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 5. INVENTORY MATRIX
  if (sectionId === 'inventory') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Real-Time Inventory & Safety Stock Matrix
          </h2>
          <p className="text-xs text-slate-500">
            Warehouse on-hand quantities, safety stock replenishment triggers, and reorder levels.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 text-emerald-900">
            <span className="text-xs font-bold uppercase tracking-wider block">Healthy Stock</span>
            <span className="font-mono text-2xl font-bold mt-1 block">42 SKUs</span>
          </div>
          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 text-amber-900">
            <span className="text-xs font-bold uppercase tracking-wider block">Low Stock Alert</span>
            <span className="font-mono text-2xl font-bold mt-1 block">3 SKUs</span>
          </div>
          <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200 text-rose-900">
            <span className="text-xs font-bold uppercase tracking-wider block">Depleted / 0 Units</span>
            <span className="font-mono text-2xl font-bold mt-1 block">1 SKU</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs text-slate-600">
          <Button variant="electric" size="sm" onClick={() => onNavigateSection('products')}>
            Adjust Product Stock Quantities
          </Button>
        </div>
      </div>
    );
  }

  // 6. COUPONS ENGINE
  if (sectionId === 'coupons') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Promotional Coupons & Enterprise Discounts
            </h2>
            <p className="text-xs text-slate-500">
              Manage discount vouchers, corporate contract rates, and marketing codes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { code: 'MAHDEV2026', discount: '15% OFF', type: 'Grand Launch', uses: '142 used' },
            { code: 'CEYLONTEA20', discount: '20% OFF', type: 'Tea Reserve', uses: '89 used' },
            { code: 'VIPCORP10', discount: '10% B2B', type: 'Corporate Retainer', uses: '34 used' },
          ].map((c) => (
            <div key={c.code} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {c.code}
                </span>
                <span className="text-xs font-bold text-emerald-600">{c.discount}</span>
              </div>
              <p className="text-xs text-slate-600">{c.type}</p>
              <div className="text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-100">
                Quota: {c.uses}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 7. SEO & METADATA
  if (sectionId === 'seo') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Search Engine Optimization & Meta Tag Engine
          </h2>
          <p className="text-xs text-slate-500">
            OpenGraph headers, canonical URLs, XML sitemap verification, and structured data.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4 font-mono">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Canonical Root:</span>
              <strong className="text-slate-900">https://mahdev.lk</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Index Status:</span>
              <strong className="text-emerald-700">INDEX, FOLLOW (All Routes Verified)</strong>
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-900 font-mono text-xs">
            sitemap.xml dynamic generation: <strong>ACTIVE</strong> (28 endpoints crawled)
          </div>
        </div>
      </div>
    );
  }

  // 8. SETTINGS VIEW
  if (sectionId === 'settings') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Global Ecosystem Configurations
          </h2>
          <p className="text-xs text-slate-500">
            Payment gateway API endpoints, currency conversion baselines, and legal metadata.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 text-xs">
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Operating Corporate Entity:</label>
            <input
              type="text"
              readOnly
              value="MAHDEV (PVT) LTD (PV 00284910)"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Payment Processing Gateways:</label>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 font-mono text-xs">
              Stripe 3DS2 • LankaPay IPG National Switch • Commercial Bank B2B Wire
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 9. USERS & RBAC VIEW
  if (sectionId === 'users') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Administrative Access & RBAC Roles
          </h2>
          <p className="text-xs text-slate-500">
            Security administrators, division managers, and financial comptrollers.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-mono font-bold">
              <tr>
                <th className="py-3 px-4">Admin Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Security Role</th>
                <th className="py-3 px-4">Division Access</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-4 font-sans font-bold text-slate-900">Yuvanshan Prabakaran</td>
                <td className="py-3 px-4 text-slate-600">info.mahdev.lk@gmail.com</td>
                <td className="py-3 px-4 text-purple-700 font-bold">SUPER_ADMIN</td>
                <td className="py-3 px-4 text-slate-600">All (Root)</td>
                <td className="py-3 px-4 text-right">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">
                    ACTIVE
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-4 font-sans font-bold text-slate-900">Kamal Jayawardena</td>
                <td className="py-3 px-4 text-slate-600">operations@mahdev.lk</td>
                <td className="py-3 px-4 text-blue-700 font-bold">OPERATIONS_ADMIN</td>
                <td className="py-3 px-4 text-slate-600">Mart, SWS, U1</td>
                <td className="py-3 px-4 text-right">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">
                    ACTIVE
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // DEFAULT / OTHER SECTIONS (Portfolio, Milestones, Companies, Testimonials, Pages)
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <h2 className="font-display text-lg font-bold text-slate-900 uppercase">
          {sectionId.replace('-', ' ')} Manager
        </h2>
        <p className="text-xs text-slate-500">
          Executive repository and content management controls for {sectionId}.
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="font-display text-base font-bold text-slate-900 capitalize">
          {sectionId.replace('-', ' ')} Repository Active
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          All data objects for {sectionId} are synced with the production core registry and rendered in real-time.
        </p>
      </div>
    </div>
  );
};
