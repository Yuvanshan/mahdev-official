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

      {/* 4. PRODUCT DETAIL MODAL */}
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
