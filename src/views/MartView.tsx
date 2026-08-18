import React, { useState, useEffect } from 'react';
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
import { Product, ProductVariant, CartItem, MART_PRODUCTS } from '../data/martData';
import { DIVISION_LIST } from '../config/divisions';
import { COMPANY_INFO, getTelLink } from '../config/company';

interface MartViewProps {
  onNavigate: (route: string) => void;
}

export const MartView: React.FC<MartViewProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check URL query parameters or path for sub-routes
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/mart/product/')) {
      const prodId = path.replace('/mart/product/', '');
      const matched = MART_PRODUCTS.find((p) => p.id === prodId || p.slug === prodId);
      if (matched) setSelectedProductForDetail(matched);
    } else if (path.startsWith('/mart/category/')) {
      const catId = path.replace('/mart/category/', '');
      setSelectedCategoryId(catId);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddToCart = (product: Product, variant?: ProductVariant, quantity: number = 1) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.product.id === product.id && i.selectedVariant?.id === variant?.id
      );

      const variantMod = variant?.priceModifier || 0;
      const unitPrice = product.price + variantMod;

      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + quantity;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          itemTotal: unitPrice * newQty,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            selectedVariant: variant,
            quantity,
            itemTotal: unitPrice * quantity,
          },
        ];
      }
    });

    showToast(`Added ${quantity}x ${product.name} to cart`);
    setCartOpen(true);
  };

  const handleUpdateCartQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(index);
      return;
    }
    setCartItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const variantMod = item.selectedVariant?.priceModifier || 0;
      const unitPrice = item.product.price + variantMod;

      updated[index] = {
        ...item,
        quantity: newQty,
        itemTotal: unitPrice * newQty,
      };
      return updated;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  const scrollToAnchor = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sisterDivisions = DIVISION_LIST.filter((d) => d.id !== 'mart');

  return (
    <div className="w-full flex flex-col bg-white">
      <SEOHead
        title="Mahdev Online Mart | Pure Ceylon Tea, Organic Spices & Lifestyle Tech"
        description="Premium e-commerce storefront by Mahdev Pvt Ltd. Shop direct-origin Ceylon teas, Alba cinnamon quills, Ayurvedic wellness elixirs, and lifestyle electronics with island-wide delivery."
        canonicalUrl="https://mahdev.lk/mart"
      />

      {/* Sticky Mart Sub-Header Ribbon */}
      <div className="sticky top-16 z-30 bg-slate-950/95 backdrop-blur-md border-b border-white/10 shadow-md text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Mahdev Group</span>
            </button>

            <span className="h-4 w-px bg-white/15 hidden sm:block" />

            <nav className="hidden sm:flex items-center gap-5 text-xs font-semibold text-slate-300">
              <button
                onClick={() => {
                  setSelectedCategoryId(null);
                  scrollToAnchor('products');
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                All Products
              </button>
              <button
                onClick={() => scrollToAnchor('categories')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Categories
              </button>
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-4">
            <a
              href={getTelLink(COMPANY_INFO.primaryPhone)}
              className="text-xs font-semibold text-slate-300 hover:text-white hidden md:flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>Helpline: {COMPANY_INFO.primaryPhone}</span>
            </a>

            {/* Cart Button with Reactive Badge */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0052FF] hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              aria-label="View Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Cart</span>
              {totalCartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-[#0052FF] font-mono text-[10px] font-bold flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

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
              Explore Sister Divisions in the Mahdev Ecosystem
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
          {sisterDivisions.map((sister) => (
            <div
              key={sister.id}
              onClick={() => onNavigate(sister.route)}
              className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-[#0052FF] group-hover:bg-[#0052FF] group-hover:text-white transition-colors">
                    <IconRenderer name={sister.iconName} className="w-4 h-4" />
                  </div>
                  <Badge size="sm" variant="default" className="text-[10px]">
                    {sister.badge}
                  </Badge>
                </div>
                <h4 className="font-display text-sm font-bold text-slate-900 group-hover:text-[#0052FF] transition-colors mb-1">
                  {sister.name}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2">{sister.tagline}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-[#0052FF]">
                <span>Explore {sister.shortName}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
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

      {/* 6. SLIDE-OUT CART DRAWER */}
      <MartCartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
      />
    </div>
  );
};
