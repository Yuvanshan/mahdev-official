import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  ChevronLeft,
  ArrowRight,
  Sparkles,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { MartHeroSection } from '../components/mart/MartHeroSection';
import { MartCategoriesSection } from '../components/mart/MartCategoriesSection';
import { MartCatalogSection } from '../components/mart/MartCatalogSection';
import { MartProductDetailModal } from '../components/mart/MartProductDetailModal';
import { MartCartDrawer } from '../components/mart/MartCartDrawer';
import { SectionContainer } from '../components/ui/SectionContainer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { IconRenderer } from '../components/ui/IconRenderer';
import { Product, ProductVariant, MART_PRODUCTS, mapFirestoreProductToMart } from '../data/martData';
import { DIVISION_LIST } from '../config/divisions';
import { COMPANY_INFO, getTelLink } from '../config/company';
import { useCart } from '../context/CartContext';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { DataLoadingOverlay } from '../components/common/DataLoadingOverlay';

interface MartViewProps {
  onNavigate: (route: string) => void;
}

export const MartView: React.FC<MartViewProps> = ({ onNavigate }) => {
  const { addToCart, totalQuantity: totalCartCount, openCart } = useCart();
  const { products: rawProducts, categories: rawCategories, divisions, companySettings, isInitialLoading, isFetching } = useFirestoreDataContext();
  const primaryPhone = companySettings?.primaryPhone || COMPANY_INFO.primaryPhone;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check URL query parameters or path for sub-routes
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/mart/product/')) {
      const prodId = path.replace('/mart/product/', '');
      const liveList =
        rawProducts && rawProducts.length > 0
          ? rawProducts.map((p) => mapFirestoreProductToMart(p, rawCategories))
          : [];
      const matched = liveList.find((p) => p.id === prodId || p.slug === prodId);
      if (matched) setSelectedProductForDetail(matched);
    } else if (path.startsWith('/mart/category/')) {
      const catId = path.replace('/mart/category/', '');
      setSelectedCategoryId(catId);
    }
  }, [rawProducts, rawCategories]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddToCart = (product: Product, variant?: ProductVariant, quantity: number = 1) => {
    addToCart(product, variant, quantity);
    showToast(`Added ${quantity}x ${product.name} to cart`);
  };

  const scrollToAnchor = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sisterDivisions = useMemo(() => {
    const list = divisions && divisions.length > 0 ? divisions : DIVISION_LIST;
    const seen = new Set<string>(['mart']);
    const result = [];
    for (const d of list) {
      const rawId = (d.id || (d as any).slug || '').toLowerCase();
      const canonicalId =
        rawId === 'u1' || rawId === 'u1-studio' || rawId === 'u1-cinema'
          ? 'u1'
          : rawId === 'sws' || rawId === 'sws-event-management' || rawId === 'sws-events'
          ? 'sws'
          : rawId === 'it' || rawId === 'it-solutions' || rawId === 'mahdev-it'
          ? 'it'
          : rawId === 'travels' || rawId === 'mahdev-travels'
          ? 'travels'
          : rawId === 'mart' || rawId === 'online-mart' || rawId === 'mahdev-mart'
          ? 'mart'
          : rawId;

      if (!canonicalId || seen.has(canonicalId)) continue;
      seen.add(canonicalId);
      result.push({
        ...d,
        id: canonicalId,
      });
    }
    return result;
  }, [divisions]);

  return (
    <div className="w-full flex flex-col bg-white">
      <SEOHead
        title="Mahdev Online Mart | Curated Decor Items & Smart Tech Gear"
        description="Premium e-commerce storefront by Mahdev Pvt Ltd. Shop bespoke event & home decor, ambient stage lighting, smart electronics, and creator tech with island-wide delivery."
        canonicalUrl="https://mahdev.lk/mart"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. STOREFRONT HERO */}
      <MartHeroSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => scrollToAnchor('products')}
        onSelectCategory={(catId) => {
          setSelectedCategoryId(catId);
          scrollToAnchor('products');
        }}
        onExploreAll={() => {
          setSelectedCategoryId(null);
          scrollToAnchor('products');
        }}
      />

      {/* 2. CATEGORIES SECTION */}
      <MartCategoriesSection
        onSelectCategory={(catId) => {
          setSelectedCategoryId(catId);
          scrollToAnchor('products');
        }}
      />

      {/* 3. CATALOG & FILTERED PRODUCTS GRID */}
      <MartCatalogSection
        selectedCategoryId={selectedCategoryId}
        searchQuery={searchQuery}
        onSelectCategory={setSelectedCategoryId}
        onSearchChange={setSearchQuery}
        onViewProduct={(prod) => setSelectedProductForDetail(prod)}
        onAddToCart={(prod) => handleAddToCart(prod)}
      />

      {/* 4. SISTER DIVISIONS PROMOTION */}
      <SectionContainer background="white" paddingY="lg" hasBorderBottom>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
              Integrated Group Network
            </span>
            <h3 className="font-display text-xl font-bold text-slate-900 mt-1">
              Explore Sister Divisions in the Mahdev Group
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('/')}
            className="mt-4 md:mt-0 text-xs"
          >
            All Divisions Overview
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sisterDivisions.map((sister) => {
            const sisterRoute = sister.route || `/division/${(sister as any).slug || sister.id}`;
            const rawSisterLogo = (sister as any).logoUrl || (sister as any).imageUrl;
            const sisterLogo = typeof rawSisterLogo === 'string' && rawSisterLogo.trim() !== '' ? rawSisterLogo.trim() : null;
            const sisterTagline = sister.tagline || (sister as any).description;
            const sisterBadge = (sister as any).badge || 'Mahdev Division';
            const sisterShortName = (sister as any).shortName || sister.name;

            return (
              <div
                key={sister.id}
                onClick={() => onNavigate(sisterRoute)}
                className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-blue-50 text-[#0052FF] group-hover:bg-[#0052FF] group-hover:text-white transition-colors overflow-hidden">
                      {sisterLogo ? (
                        <img
                          src={sisterLogo}
                          alt={sister.name}
                          className="w-5 h-5 object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <IconRenderer name={sister.iconName || 'Layers'} className="w-4 h-4" />
                      )}
                    </div>
                    <Badge size="sm" variant="default" className="text-[10px]">
                      {sisterBadge}
                    </Badge>
                  </div>
                  <h4 className="font-display text-sm font-bold text-slate-900 group-hover:text-[#0052FF] transition-colors mb-1">
                    {sister.name}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{sisterTagline}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-[#0052FF]">
                  <span>Explore {sisterShortName}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </SectionContainer>

      {/* 5. PRODUCT DETAIL MODAL */}
      <MartProductDetailModal
        product={selectedProductForDetail}
        isOpen={!!selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        onAddToCart={(prod, variant, qty) => {
          handleAddToCart(prod, variant, qty);
          setSelectedProductForDetail(null);
        }}
        onSelectRelatedProduct={(relProd) => setSelectedProductForDetail(relProd)}
      />
    </div>
  );
};
