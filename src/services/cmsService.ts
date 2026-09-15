import {
  CmsEntityType,
  CmsDivision,
  CmsService as CmsServiceEntity,
  CmsProduct,
  CmsCategory,
  CmsPackage,
  CmsPortfolioProject,
  CmsGalleryItem,
  CmsMilestone,
  CmsTrustedCompany,
  CmsTestimonial,
  CmsPage,
  CmsBanner,
  CmsCoupon,
  HomepageCmsConfig,
} from '../types/cms';
import { DIVISIONS } from '../config/divisions';
import { COMPANY_MILESTONES } from '../data/homeData';
import { adminService } from './adminService';
import { DivisionId } from '../types';
import { COMPANY_INFO, CompanyInformation } from '../config/company';
import {
  firestoreSettingsService,
  firestoreDivisionsService,
  firestoreServicesService,
  firestoreProductsService,
  firestoreCategoriesService,
  firestorePortfolioService,
  firestoreGalleryService,
  firestoreMilestonesService,
  firestoreTrustedCompaniesService,
  firestoreTestimonialsService,
} from './firestore';
import { safeStorage } from '../utils/safeStorage';

const CMS_STORAGE_PREFIX = 'mahdev_cms_v1_';

export interface CmsFilterOptions {
  search?: string;
  divisionId?: string;
  status?: string;
  category?: string;
  includeDeleted?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class CmsService {
  private cache: Partial<Record<CmsEntityType, any[]>> = {};
  private listeners: Map<CmsEntityType, Set<() => void>> = new Map();
  private broadcastChannel: BroadcastChannel | null =
    typeof window !== 'undefined' && 'BroadcastChannel' in window
      ? new BroadcastChannel('mahdev_cms_sync_channel')
      : null;

  constructor() {
    this.initializeAllEntities();
    this.attachFirestoreSync();
    this.attachCrossTabSync();
  }

  private attachCrossTabSync(): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.addEventListener('message', (e) => {
        if (e.data?.type === 'cms_entity_updated' && e.data?.entity) {
          const entity = e.data.entity as CmsEntityType;
          const key = this.getStorageKey(entity);
          const stored = safeStorage.getItem(key);
          if (stored) {
            try {
              this.cache[entity] = JSON.parse(stored);
            } catch {}
          }
          const subs = this.listeners.get(entity);
          if (subs) {
            subs.forEach((cb) => cb());
          }
        }
      });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith(CMS_STORAGE_PREFIX)) {
          const entity = e.key.replace(CMS_STORAGE_PREFIX, '') as CmsEntityType;
          if (this.cache[entity] && e.newValue) {
            try {
              this.cache[entity] = JSON.parse(e.newValue);
              const subs = this.listeners.get(entity);
              if (subs) subs.forEach((cb) => cb());
            } catch {}
          }
        }
      });
    }
  }

  private attachFirestoreSync(): void {
    try {
      // 1. Company Settings
      firestoreSettingsService.subscribeCompanySettings(
        (firestoreCompany) => {
          if (firestoreCompany && firestoreCompany.name) {
            const current = this.getCompanyInfo();
            const colomboUpdate = firestoreCompany.offices?.colombo;
            const trincoUpdate = firestoreCompany.offices?.trincomalee;

            const merged: CompanyInformation = {
              ...current,
              ...firestoreCompany,
              offices: {
                colombo: {
                  ...current.offices.colombo,
                  ...(colomboUpdate || {}),
                  fullAddress: colomboUpdate?.address || current.offices.colombo.fullAddress,
                },
                trincomalee: {
                  ...current.offices.trincomalee,
                  ...(trincoUpdate || {}),
                  fullAddress: trincoUpdate?.address || current.offices.trincomalee.fullAddress,
                },
              },
              socials: {
                ...current.socials,
                ...(firestoreCompany.socials || {}),
              },
              workingHours: {
                ...current.workingHours,
                ...(firestoreCompany.workingHours || {}),
              },
            };
            const key = `${CMS_STORAGE_PREFIX}company_info`;
            safeStorage.setItem(key, JSON.stringify(merged));
            this.notify('pages');
          }
        },
        () => {}
      );

      // 2. Homepage Settings
      firestoreSettingsService.subscribeHomepageSettings(
        (homepageConf) => {
          if (homepageConf) {
            this.syncHomepageConfig(homepageConf);
          }
        }
      );

      // 3. Divisions
      firestoreDivisionsService.subscribeDivisions((divs) => {
        if (divs && Array.isArray(divs)) {
          this.syncEntityFromFirestore('divisions', divs);
        }
      });

      // 4. Services
      firestoreServicesService.subscribeServices((srvs) => {
        if (srvs && Array.isArray(srvs)) {
          this.syncEntityFromFirestore('services', srvs);
        }
      });

      // 5. Products
      firestoreProductsService.subscribeProducts((prods) => {
        if (prods && Array.isArray(prods)) {
          this.syncEntityFromFirestore('products', prods);
        }
      });

      // 6. Categories
      firestoreCategoriesService.subscribeCategories((cats) => {
        if (cats && Array.isArray(cats)) {
          this.syncEntityFromFirestore('categories', cats);
        }
      });

      // 7. Portfolio
      firestorePortfolioService.subscribePortfolio((port) => {
        if (port && Array.isArray(port)) {
          this.syncEntityFromFirestore('portfolio', port);
        }
      });

      // 8. Gallery
      firestoreGalleryService.subscribeGallery(undefined, (gal) => {
        if (gal && Array.isArray(gal)) {
          this.syncEntityFromFirestore('gallery', gal);
        }
      });

      // 9. Milestones
      firestoreMilestonesService.subscribeMilestones((ms) => {
        if (ms && Array.isArray(ms)) {
          this.syncEntityFromFirestore('milestones', ms);
        }
      });

      // 10. Trusted Companies
      firestoreTrustedCompaniesService.subscribeTrustedCompanies((comps) => {
        if (comps && Array.isArray(comps)) {
          this.syncEntityFromFirestore('companies', comps);
        }
      });

      // 11. Testimonials
      firestoreTestimonialsService.subscribeTestimonials(undefined, (tests) => {
        if (tests && Array.isArray(tests)) {
          this.syncEntityFromFirestore('testimonials', tests);
        }
      });
    } catch (e) {
      console.warn('[CmsService] Firestore multi-entity auto-sync initialization:', e);
    }
  }

  /**
   * Hydrates CMS cache directly from Firestore real-time stream
   */
  public syncEntityFromFirestore(entity: CmsEntityType, rawItems: any[]): void {
    if (!Array.isArray(rawItems)) return;

    let mapped: any[] = [];
    const now = new Date().toISOString();

    if (entity === 'divisions') {
      mapped = rawItems.map((d) => {
        const divKey: DivisionId =
          d.id === 'u1-studio' ? 'u1' : d.id === 'it-solutions' ? 'it' : d.id === 'online-mart' ? 'mart' : (d.id as DivisionId);
        const fallbackConfig = DIVISIONS[divKey] || DIVISIONS.sws;

        const resolvedVideo = d.heroVideoUrl || d.videoUrl || d.hero?.videoUrl || '';
        const resolvedImg =
          d.defaultImageUrl ||
          d.heroImageUrl ||
          d.imageUrl ||
          d.hero?.defaultImageUrl ||
          d.hero?.imageUrl ||
          d.hero?.bgImage ||
          (fallbackConfig as any).heroImageUrl ||
          '';
        const resolvedMediaType =
          d.heroMediaType ||
          d.hero?.mediaType ||
          (resolvedVideo ? 'video' : 'image');

        return {
          id: d.id.startsWith('div-') ? d.id : `div-${d.id}`,
          divisionKey: divKey,
          name: d.name || fallbackConfig.name,
          shortName: d.shortName || (fallbackConfig as any).shortName || d.name,
          order: typeof d.order === 'number' && d.order > 0 ? d.order : (divKey === 'sws' ? 1 : divKey === 'u1' ? 2 : divKey === 'it' ? 3 : divKey === 'travels' ? 4 : 5),
          tagline: d.hero?.subtitle || d.shortDescription || fallbackConfig.tagline,
          description: d.description || fallbackConfig.description,
          badge: d.hero?.badge || fallbackConfig.badge,
          route: d.route || `/${d.slug || d.id}`,
          accentColor: d.accentColor || fallbackConfig.accentColor || '#1d4ed8',
          gradient: (fallbackConfig as any).gradient || 'from-blue-600 to-indigo-700',
          heroHeadline: d.hero?.title || d.heroHeadline || fallbackConfig.heroHeadline,
          heroSubheadline: d.hero?.subtitle || d.shortDescription || fallbackConfig.heroSubheadline,
          heroImageUrl: resolvedImg,
          defaultImageUrl: resolvedImg,
          heroVideoUrl: resolvedVideo,
          videoUrl: resolvedVideo,
          heroMediaType: resolvedMediaType,
          hero: {
            title: d.hero?.title || d.heroHeadline || fallbackConfig.heroHeadline,
            subtitle: d.hero?.subtitle || d.shortDescription || fallbackConfig.heroSubheadline,
            badge: d.hero?.badge || fallbackConfig.badge,
            bgImage: resolvedImg,
            imageUrl: resolvedImg,
            defaultImageUrl: resolvedImg,
            videoUrl: resolvedVideo,
            mediaType: resolvedMediaType,
            ctaText: d.hero?.ctaText || 'Explore ' + (d.name || fallbackConfig.name),
          },
          isComingSoon: !!(d.isComingSoon || d.comingSoon || d.status === 'coming_soon'),
          comingSoon: !!(d.isComingSoon || d.comingSoon || d.status === 'coming_soon'),
          comingSoonTitle: d.comingSoonTitle || '',
          comingSoonMessage: d.comingSoonMessage || '',
          comingSoonExpectedLaunch: d.comingSoonExpectedLaunch || '',
          rentalAssetCount: (d as any).rentalAssetCount || '',
          logoUrl: d.logoUrl || d.logo || (fallbackConfig as any).logoUrl || '',
          contactEmail: d.contactEmail || (fallbackConfig as any).contactEmail || 'contact@mahdev.lk',
          iconName: (d as any).iconName || fallbackConfig.iconName || 'Sparkles',
          stats: (d as any).stats || fallbackConfig.stats || [],
          galleryImages: (d as any).galleryImages || [],
          seo: d.seo || {
            metaTitle: `${d.name} | Mahdev Group`,
            metaDescription: d.description,
            ogImage: resolvedImg,
            canonicalUrl: `https://mahdev.lk${d.route || '/' + d.slug}`,
          },
          isActive: d.status !== 'inactive' && d.isPublished !== false,
          isDeleted: d.status === 'inactive' && d.isPublished === false,
          createdAt: d.createdAt || now,
          updatedAt: d.updatedAt || now,
        };
      });
      mapped.sort((a, b) => (a.order || 99) - (b.order || 99));
    } else if (entity === 'services') {
      mapped = rawItems.map((s) => {
        const divId = s.divisionId || s.division || 'sws';
        const divName =
          s.divisionName ||
          (divId === 'u1' || divId === 'u1-studio'
            ? 'U1 Studio'
            : divId === 'it' || divId === 'it-solutions'
            ? 'Mahdev IT Solutions'
            : divId === 'travels'
            ? 'Mahdev Travels'
            : divId === 'mart' || divId === 'online-mart'
            ? 'Mahdev Online Mart'
            : 'SWS Event Management');

        return {
          id: s.id,
          divisionId: divId,
          divisionName: divName,
          title: s.title || s.name,
          name: s.name || s.title,
          description: s.description || '',
          imageUrl: s.imageUrl || (s.images && s.images[0]) || '',
          images: s.images || (s.imageUrl ? [s.imageUrl] : []),
          features: s.features || [],
          iconName: s.iconName || 'Sparkles',
          popular: Boolean(s.popular),
          badge: s.badge || '',
          startingPrice: s.startingPrice || s.price || 0,
          price: s.price || s.startingPrice || 0,
          currency: s.currency || 'USD',
          turnaroundTime: s.turnaroundTime || 'Flexible',
          order: s.order ?? 0,
          sortOrder: s.order ?? 0,
          isActive: s.status !== 'draft' && s.status !== 'inactive' && s.isPublished !== false,
          isDeleted: s.status === 'draft' && s.isPublished === false,
          createdAt: s.createdAt || now,
          updatedAt: s.updatedAt || now,
        };
      });
      mapped.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
    } else if (entity === 'products') {
      mapped = rawItems.map((p) => ({
        id: p.id,
        sku: p.sku || p.id,
        name: p.name,
        slug: p.slug || p.id,
        divisionId: p.division || 'mart',
        divisionName: 'Mahdev Online Mart',
        categoryId: p.categoryId || 'gear',
        categoryName: (p as any).categoryName || 'General Gear',
        price: p.price || 0,
        compareAtPrice: p.compareAtPrice || p.discountPrice || 0,
        currency: p.currency || 'USD',
        shortDescription: p.shortDescription || p.description?.substring(0, 100) || '',
        description: p.description || '',
        imageUrl: p.images?.[0] || (p as any).imageUrl || '',
        galleryImages: p.images || ((p as any).imageUrl ? [(p as any).imageUrl] : []),
        stockQuantity: p.stock || 0,
        stockStatus: (p.stock || 0) > 5 ? 'in_stock' : (p.stock || 0) > 0 ? 'low_stock' : 'out_of_stock',
        lowStockThreshold: 5,
        isFeatured: Boolean(p.isPublished),
        tags: (p as any).tags || [],
        specifications: (p as any).specifications || {},
        isActive: p.status !== 'draft' && p.status !== 'archived' && p.status !== 'out_of_stock',
        isDeleted: p.status === 'archived',
        createdAt: p.createdAt || now,
        updatedAt: p.updatedAt || now,
      }));
    } else if (entity === 'categories') {
      mapped = rawItems.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug || c.id,
        divisionId: c.division || 'mart',
        description: c.description || '',
        imageUrl: c.imageUrl || '',
        bannerUrl: c.imageUrl || '',
        displayOrder: c.order || 0,
        itemCount: (c as any).itemCount || 0,
        isActive: c.status !== 'inactive' && c.isPublished !== false,
        isDeleted: c.status === 'inactive' && c.isPublished === false,
        createdAt: c.createdAt || now,
        updatedAt: c.updatedAt || now,
      }));
    } else if (entity === 'portfolio') {
      mapped = rawItems.map((p) => ({
        id: p.id,
        sku: p.sku || (p as any).code || undefined,
        divisionId: p.division || (p as any).divisionId || 'sws',
        title: p.title || (p as any).name || 'Portfolio Project',
        category: p.category || 'Production',
        client: p.client || 'Corporate Client',
        year: p.year || '2026',
        summary: p.summary || p.description || '',
        fullDescription: p.fullDescription || p.description || p.summary || '',
        highlights: p.highlights || [],
        deliverables: p.deliverables || [],
        imageUrl: p.imageUrl || (p.galleryImages && p.galleryImages[0]) || '',
        galleryImages: p.galleryImages || (p.imageUrl ? [p.imageUrl] : []),
        liveUrl: p.liveUrl || '',
        impactMetrics: p.impactMetrics || [],
        tags: p.tags || [],
        isFeatured: Boolean(p.featured || (p as any).isFeatured),
        isActive: (p as any).isActive !== false && p.status !== 'draft',
        isDeleted: p.status === 'draft' && (p as any).isActive === false,
        createdAt: p.createdAt || now,
        updatedAt: p.updatedAt || now,
      }));
    } else if (entity === 'gallery') {
      mapped = rawItems.map((g) => ({
        id: g.id,
        sku: g.sku || (g as any).code || undefined,
        divisionId: g.division || (g as any).divisionId || 'sws',
        title: g.title || 'Gallery Media',
        category: (g as any).category || g.tag || 'General',
        type: g.type || 'image',
        mediaType: g.type || 'image',
        mediaUrl: g.url || (g as any).mediaUrl || (g as any).imageUrl || '',
        url: g.url || (g as any).mediaUrl || (g as any).imageUrl || '',
        thumbnailUrl: g.thumbnailUrl || g.url || (g as any).mediaUrl || (g as any).imageUrl || '',
        caption: g.caption || '',
        aspectRatio: (g as any).aspectRatio || '16:9',
        tags: (g as any).tags || (g.tag ? [g.tag] : []),
        sortOrder: g.order || (g as any).sortOrder || 1,
        isFeatured: Boolean(g.featured || (g as any).isFeatured),
        isActive: (g as any).isActive !== false && g.status !== 'inactive',
        isDeleted: g.status === 'inactive' && (g as any).isActive === false,
        createdAt: g.createdAt || now,
        updatedAt: g.updatedAt || now,
      }));
    } else if (entity === 'milestones') {
      mapped = rawItems.map((m) => ({
        id: m.id,
        year: m.year || '2026',
        title: m.title || '',
        description: m.description || '',
        divisionId: m.divisionId || 'sws',
        badge: m.badge || '',
        metric: m.metric || '',
        iconName: m.iconName || 'Award',
        keyOutcome: m.keyOutcome || '',
        highlight: Boolean(m.highlight),
        imageUrl: m.imageUrl || '',
        order: m.order || 0,
        sortOrder: m.order || 0,
        isActive: m.isPublished !== false && m.status !== 'draft',
        isDeleted: m.status === 'draft' && m.isPublished === false,
        createdAt: m.createdAt || now,
        updatedAt: m.updatedAt || now,
      }));
    } else if (entity === 'companies') {
      mapped = rawItems.map((c) => ({
        id: c.id,
        name: c.name || '',
        industry: c.industry || '',
        partnershipType: c.partnershipType || 'Strategic Partner',
        logoUrl: c.logoUrl || '',
        website: c.website || '',
        description: c.description || '',
        featured: Boolean(c.featured),
        order: c.order || 0,
        isActive: (c as any).isActive !== false && c.status !== 'inactive',
        isDeleted: c.status === 'inactive' && (c as any).isActive === false,
        createdAt: c.createdAt || now,
        updatedAt: c.updatedAt || now,
      }));
    } else if (entity === 'testimonials') {
      mapped = rawItems.map((t) => ({
        id: t.id,
        author: t.author || '',
        role: t.role || '',
        company: t.company || '',
        content: t.content || '',
        avatarUrl: t.avatarUrl || '',
        rating: t.rating || 5,
        divisionId: t.division || (t as any).divisionId || 'sws',
        date: t.date || '',
        verified: t.verified !== false,
        order: t.order || 0,
        featured: Boolean(t.featured),
        isActive: !t.isHidden && (t as any).isActive !== false,
        isDeleted: Boolean(t.isHidden),
        createdAt: t.createdAt || now,
        updatedAt: t.updatedAt || now,
      }));
    } else {
      mapped = rawItems;
    }

    this.cache[entity] = mapped;
    safeStorage.setItem(this.getStorageKey(entity), JSON.stringify(mapped));

    this.notify(entity);
  }

  private getStorageKey(entity: CmsEntityType): string {
    return `${CMS_STORAGE_PREFIX}${entity}`;
  }

  public subscribe(entity: CmsEntityType, callback: () => void): () => void {
    if (!this.listeners.has(entity)) {
      this.listeners.set(entity, new Set());
    }
    this.listeners.get(entity)!.add(callback);
    return () => {
      this.listeners.get(entity)?.delete(callback);
    };
  }

  private notify(entity: CmsEntityType): void {
    const subs = this.listeners.get(entity);
    if (subs && subs.size > 0) {
      const callbacks = Array.from(subs);
      // Asynchronously schedule callback execution to avoid updating components during another component's render phase
      if (typeof queueMicrotask === 'function') {
        queueMicrotask(() => {
          callbacks.forEach((cb) => {
            try {
              cb();
            } catch (err) {
              console.error(`[CmsService] Listener error for ${entity}:`, err);
            }
          });
        });
      } else {
        setTimeout(() => {
          callbacks.forEach((cb) => {
            try {
              cb();
            } catch (err) {
              console.error(`[CmsService] Listener error for ${entity}:`, err);
            }
          });
        }, 0);
      }
    }
    try {
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'cms_entity_updated',
          entity,
          timestamp: Date.now(),
        });
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(`mahdev_cms_${entity}_updated`, { detail: { entity } })
        );
      }
    } catch (err) {
      console.warn(`[CmsService] Broadcast notify notice for ${entity}:`, err);
    }
  }

  public initializeAllEntities(forceReset = false): void {
    const entities: CmsEntityType[] = [
      'divisions',
      'services',
      'products',
      'categories',
      'packages',
      'portfolio',
      'gallery',
      'milestones',
      'companies',
      'testimonials',
      'pages',
      'banners',
      'coupons',
    ];

    entities.forEach((entity) => {
      const key = this.getStorageKey(entity);
      const stored = safeStorage.getItem(key);
      if (!stored || forceReset) {
        const seedData = this.getSeedDataForEntity(entity);
        safeStorage.setItem(key, JSON.stringify(seedData));
        this.cache[entity] = seedData;
      } else {
        try {
          this.cache[entity] = JSON.parse(stored);
        } catch {
          const seedData = this.getSeedDataForEntity(entity);
          safeStorage.setItem(key, JSON.stringify(seedData));
          this.cache[entity] = seedData;
        }
      }
    });
  }

  private getSeedDataForEntity(entity: CmsEntityType): any[] {
    const now = new Date().toISOString();

    switch (entity) {
      case 'divisions':
        return Object.values(DIVISIONS).map((d) => ({
          id: `div-${d.id}`,
          divisionKey: d.id,
          name: d.name,
          shortName: d.shortName,
          tagline: d.tagline,
          description: d.description,
          badge: d.badge,
          route: d.route,
          accentColor: d.accentColor,
          gradient: d.gradient,
          heroHeadline: d.heroHeadline,
          heroSubheadline: d.heroSubheadline,
          heroImageUrl:
            d.id === 'sws'
              ? 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80'
              : d.id === 'u1'
              ? 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80'
              : d.id === 'it'
              ? 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
              : d.id === 'travels'
              ? 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80'
              : 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
          logoUrl: `https://mahdev.lk/assets/divisions/${d.id}-logo.png`,
          contactEmail: d.contactEmail,
          iconName: d.iconName,
          stats: d.stats,
          galleryImages: [
            {
              url:
                d.id === 'sws'
                  ? 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80'
                  : d.id === 'u1'
                  ? 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80'
                  : d.id === 'it'
                  ? 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
                  : d.id === 'travels'
                  ? 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80'
                  : 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
              title: `${d.name} Showcase Rig`,
              caption: `State-of-the-art deployment by ${d.name}.`,
            },
          ],
          seo: {
            metaTitle: `${d.name} | Mahdev Group`,
            metaDescription: `${d.tagline} — ${d.description}`,
            ogImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
            canonicalUrl: `https://mahdev.lk${d.route}`,
          },
          isActive: true,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        }));

      case 'services':
        // Real services populated via Firestore / Admin Portal
        return [];

      case 'products':
        // Real products populated via Firestore / Admin Portal
        return [];

      case 'categories':
        // Real categories populated via Firestore / Admin Portal
        return [];

      case 'packages':
        // Real packages populated via Firestore / Admin Portal
        return [];

      case 'portfolio':
        // Real portfolio projects populated via Firestore / Admin Portal
        return [];

      case 'gallery':
        // Real gallery items populated via Firestore / Admin Portal
        return [];

      case 'milestones':
        // Real verified milestones populated via Firestore / Admin Portal
        return [];

      case 'companies':
        // Real enterprise partners populated via Firestore / Admin Portal
        return [];

      case 'testimonials':
        // Real client testimonials populated via Firestore / Admin Portal
        return [];

      case 'pages':
        return [
          {
            id: 'page-privacy',
            slug: 'privacy-policy',
            title: 'Privacy & Data Protection Policy',
            category: 'legal',
            metaDescription: 'Official privacy governance and data protection commitments of Mahdev Pvt Ltd.',
            heroHeading: 'Privacy & Data Protection Policy',
            heroSubheading: 'Compliant with Sri Lanka Personal Data Protection Act (PDPA) & international standards.',
            content: `### 1. Corporate Commitment\nMahdev Pvt Ltd ("Mahdev", "we", "us", "our") is dedicated to safeguarding the personal information and corporate data entrusted to us by our clients, partners, and website visitors across all five operating divisions.\n\n### 2. Information We Collect\nWe collect information necessary to fulfill service bookings, physical deliveries, and enterprise project deliverables.\n\n### 3. Data Usage & Security\nYour information is never sold or disclosed to unauthorized third parties. All transmissions utilize TLS 1.3 encryption.`,
            sections: [
              {
                heading: 'Information Architecture & Security',
                body: 'We deploy bank-grade encryption and secure access controls across our internal cloud portals.',
              },
            ],
            isPublished: true,
            publishedAt: now,
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'page-terms',
            slug: 'terms-of-service',
            title: 'Master Terms of Service & SLA',
            category: 'legal',
            metaDescription: 'Institutional terms and conditions governing service engagements with Mahdev Pvt Ltd.',
            heroHeading: 'Terms of Service & Commercial Conditions',
            heroSubheading: 'Clear, transparent service-level agreements and corporate warranties.',
            content: `### 1. Engagement Protocols\nEvery engagement across SWS Event Management, U1 Studio, Mahdev IT, Mahdev Travels, and Mahdev Online Mart is governed by these master terms.\n\n### 2. Retainers & Cancellation\nService bookings require a formal retainer to lock dates and allocate specialized equipment and human talent.`,
            sections: [
              {
                heading: 'Scope Delivery & Acceptance',
                body: 'Deliverables are reviewed in milestone stages to ensure complete client satisfaction and SLA compliance.',
              },
            ],
            isPublished: true,
            publishedAt: now,
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'page-careers',
            slug: 'careers',
            title: 'Careers at Mahdev Group',
            category: 'corporate',
            metaDescription: 'Join Sri Lanka’s premier integrated multi-division enterprise.',
            heroHeading: 'Build the Extraordinary With Us',
            heroSubheading: 'Explore opportunities across event production, cinematography, software engineering, and luxury travel.',
            content: `### Join Our Cross-Disciplinary Team\nAt Mahdev, we believe the best work happens when creative artistry and rigorous engineering unite. We offer competitive compensation, fast-track career growth, and the opportunity to work on high-profile national and international projects.`,
            sections: [
              {
                heading: 'Our Culture & Benefits',
                body: 'Continuous learning stipends, modern equipment allowances, flexible hybrid work models, and comprehensive health coverage.',
              },
            ],
            isPublished: true,
            publishedAt: now,
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          },
        ];

      case 'banners':
        return [
          {
            id: 'ban-hero-01',
            title: 'Integrated Multi-Division Excellence',
            subtitle: 'One trusted parent company providing 360-degree event production, media, tech, travel, and commerce.',
            placement: 'home_hero',
            divisionId: 'all',
            targetUrl: '/explore',
            buttonText: 'Explore Ecosystem',
            imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
            bgGradient: 'from-blue-900 to-slate-900',
            badgeText: 'CORPORATE SYNERGY 2026',
            isActive: true,
            priority: 1,
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'ban-mart-promo',
            title: 'Official Sony & Canon Studio Hardware Season',
            subtitle: 'Authorized enterprise stock with island-wide express delivery and 3-year official warranty.',
            placement: 'mart_sale',
            divisionId: 'mart',
            targetUrl: '/mart',
            buttonText: 'Shop Cinema Hardware',
            imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
            badgeText: 'LIMITED STOCK DISCOUNT',
            isActive: true,
            priority: 2,
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'ban-announcement',
            title: 'VIP Colombo Economic Summit Staging Announced',
            subtitle: 'SWS Event Management and U1 Studio selected as primary production partners.',
            placement: 'announcement_bar',
            divisionId: 'sws',
            targetUrl: '/sws',
            buttonText: 'View Case Study',
            badgeText: 'PRESS RELEASE',
            isActive: true,
            priority: 3,
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          },
        ];

      case 'coupons':
        return [
          {
            id: 'cpn-welcome10',
            code: 'WELCOME10',
            description: '10% discount on first online mart order or studio booking.',
            discountType: 'percentage',
            discountValue: 10,
            currency: 'USD',
            minSpend: 100,
            maxDiscount: 150,
            validFrom: '2026-01-01',
            validUntil: '2026-12-31',
            usageLimit: 500,
            usageCount: 42,
            divisionRestriction: 'all',
            isActive: true,
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'cpn-swsgala15',
            code: 'SWSGALA15',
            description: '15% early-bird discount on annual corporate gala staging packages.',
            discountType: 'percentage',
            discountValue: 15,
            currency: 'USD',
            minSpend: 2500,
            maxDiscount: 750,
            validFrom: '2026-01-01',
            validUntil: '2026-12-31',
            usageLimit: 50,
            usageCount: 11,
            divisionRestriction: 'sws',
            isActive: true,
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'cpn-enterprise25',
            code: 'ENTERPRISE25',
            description: '$250 fixed credit on cloud software engineering retainers.',
            discountType: 'fixed',
            discountValue: 250,
            currency: 'USD',
            minSpend: 3000,
            validFrom: '2026-01-01',
            validUntil: '2026-12-31',
            usageLimit: 30,
            usageCount: 8,
            divisionRestriction: 'it',
            isActive: true,
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          },
        ];

      default:
        return [];
    }
  }

  // Generic Get All with filtering, search, sorting, and soft deletion toggle
  public getAll<T = any>(entity: CmsEntityType, options?: CmsFilterOptions): T[] {
    const list: any[] = this.cache[entity] || [];
    let results = [...list];

    // Filter soft deleted by default unless requested
    if (!options?.includeDeleted) {
      results = results.filter((item) => !item.isDeleted);
    }

    // Filter by Division
    if (options?.divisionId && options.divisionId !== 'all') {
      results = results.filter(
        (item) => item.divisionId === options.divisionId || item.divisionKey === options.divisionId
      );
    }

    // Filter by Status
    if (options?.status && options.status !== 'all') {
      if (options.status === 'active') {
        results = results.filter((item) => item.isActive !== false && item.isPublished !== false);
      } else if (options.status === 'inactive') {
        results = results.filter((item) => item.isActive === false || item.isPublished === false);
      } else if (options.status === 'deleted') {
        results = results.filter((item) => item.isDeleted === true);
      } else if (options.status === 'in_stock') {
        results = results.filter((item) => item.stockStatus === 'in_stock');
      } else if (options.status === 'low_stock') {
        results = results.filter((item) => item.stockStatus === 'low_stock');
      } else if (options.status === 'out_of_stock') {
        results = results.filter((item) => item.stockStatus === 'out_of_stock');
      }
    }

    // Search query
    if (options?.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      results = results.filter((item) => {
        const title = (item.title || item.name || item.code || item.author || '').toLowerCase();
        const desc = (item.description || item.summary || item.shortDescription || item.quote || '').toLowerCase();
        const sku = (item.sku || item.slug || '').toLowerCase();
        const client = (item.client || item.company || '').toLowerCase();
        return title.includes(q) || desc.includes(q) || sku.includes(q) || client.includes(q);
      });
    }

    // Sorting
    if (options?.sortBy) {
      const field = options.sortBy;
      const order = options.sortOrder === 'desc' ? -1 : 1;
      results.sort((a, b) => {
        const valA = a[field] ?? '';
        const valB = b[field] ?? '';
        if (typeof valA === 'string') {
          return valA.localeCompare(valB) * order;
        }
        return (valA > valB ? 1 : valA < valB ? -1 : 0) * order;
      });
    }

    return results as T[];
  }

  /**
   * Reorder items for an entity in CMS cache and localStorage
   */
  public reorder(entity: CmsEntityType, orderedIds: string[]): void {
    const list: any[] = this.cache[entity] || [];
    const updated = list
      .map((item) => {
        const newOrder = orderedIds.indexOf(item.id);
        return newOrder >= 0 ? { ...item, order: newOrder + 1, sortOrder: newOrder + 1 } : item;
      })
      .sort((a, b) => (a.order ?? a.sortOrder ?? 0) - (b.order ?? b.sortOrder ?? 0));

    this.cache[entity] = updated;
    safeStorage.setItem(this.getStorageKey(entity), JSON.stringify(updated));

    this.notify(entity);
  }

  public getById<T = any>(entity: CmsEntityType, id: string): T | null {
    const list: any[] = this.cache[entity] || [];
    const item = list.find((i) => i.id === id);
    return (item as T) || null;
  }

  public create<T = any>(entity: CmsEntityType, data: Partial<T>): T {
    const now = new Date().toISOString();
    const id = (data as any).id || `${entity.slice(0, 3)}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newItem: any = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      deletedAt: null,
    };

    const current = this.cache[entity] || [];
    const updated = [newItem, ...current];
    this.cache[entity] = updated;
    safeStorage.setItem(this.getStorageKey(entity), JSON.stringify(updated));

    adminService.logAudit({
      action: `CMS_CREATE_${entity.toUpperCase()}`,
      entityType: entity,
      entityId: id,
      details: `Created new ${entity.slice(0, -1)}: "${newItem.title || newItem.name || newItem.code || id}".`,
      status: 'success',
    });

    this.notify(entity);

    // Asynchronously synchronize to Firestore
    this.syncEntityItemToFirestore(entity, newItem);

    return newItem as T;
  }

  private async syncEntityItemToFirestore(entity: CmsEntityType, item: any): Promise<void> {
    try {
      if (entity === 'divisions') {
        const divKey = item.divisionKey || item.id?.replace('div-', '') || item.id;
        const videoUrl = item.heroVideoUrl || item.videoUrl || item.hero?.videoUrl || '';
        const imgUrl = item.defaultImageUrl || item.heroImageUrl || item.imageUrl || item.hero?.bgImage || '';
        const mediaType = item.heroMediaType || item.hero?.mediaType || (videoUrl ? 'video' : 'image');

        await firestoreDivisionsService.saveDivision(divKey, {
          id: divKey,
          divisionKey: item.divisionKey || divKey,
          name: item.name,
          shortName: item.shortName || item.name,
          order: typeof item.order === 'number' ? item.order : undefined,
          description: item.description,
          shortDescription: item.heroSubheadline || item.tagline || item.description,
          imageUrl: imgUrl,
          heroImageUrl: imgUrl,
          defaultImageUrl: imgUrl,
          heroVideoUrl: videoUrl,
          videoUrl: videoUrl,
          heroMediaType: mediaType,
          logoUrl: item.logoUrl || item.logo || '',
          logo: item.logoUrl || item.logo || '',
          accentColor: item.accentColor || '#1d4ed8',
          route: item.route || `/${divKey}`,
          slug: item.slug || divKey,
          isPublished: !item.isDeleted && item.isActive !== false,
          status: item.isComingSoon
            ? 'coming_soon'
            : item.isDeleted
            ? 'inactive'
            : item.isActive === false
            ? 'inactive'
            : 'active',
          isComingSoon: !!(item.isComingSoon || item.comingSoon),
          comingSoon: !!(item.isComingSoon || item.comingSoon),
          comingSoonTitle: item.comingSoonTitle || '',
          comingSoonMessage: item.comingSoonMessage || '',
          comingSoonExpectedLaunch: item.comingSoonExpectedLaunch || '',
          rentalAssetCount: item.rentalAssetCount || '',
          hero: {
            title: item.heroHeadline || item.name,
            subtitle: item.heroSubheadline || item.tagline || '',
            badge: item.badge || 'Enterprise Division',
            bgImage: imgUrl,
            imageUrl: imgUrl,
            defaultImageUrl: imgUrl,
            videoUrl: videoUrl,
            mediaType: mediaType,
            ctaText: 'Explore ' + item.name,
          },
          seo: item.seo,
        });
      } else if (entity === 'services') {
        await firestoreServicesService.saveService(item.id, {
          id: item.id,
          divisionId: item.divisionId || item.division || 'sws',
          division: item.divisionId || item.division || 'sws',
          divisionName: item.divisionName,
          name: item.name || item.title,
          title: item.title || item.name,
          slug: item.slug || item.id,
          description: item.description || item.shortDescription || '',
          imageUrl: item.imageUrl || (item.images && item.images[0]) || '',
          images: item.imageUrl ? [item.imageUrl] : item.images || [],
          price: item.startingPrice || item.price || 0,
          startingPrice: item.startingPrice || item.price || 0,
          currency: item.currency || 'USD',
          status: item.isDeleted ? 'draft' : (item.isActive === false ? 'draft' : 'active'),
          bookingEnabled: item.bookingEnabled !== false,
          quoteEnabled: item.quoteEnabled !== false,
          category: item.category,
          categoryId: item.categoryId,
          badge: item.badge,
          features: item.features || [],
          turnaroundTime: item.turnaroundTime,
          popular: item.popular,
          iconName: item.iconName,
        });
      } else if (entity === 'products') {
        await firestoreProductsService.saveProduct(item.id, {
          id: item.id,
          division: item.divisionId || item.division || 'mart',
          name: item.name,
          slug: item.slug || item.id,
          sku: item.sku || item.id,
          categoryId: item.categoryId || 'gear',
          description: item.description || item.shortDescription || '',
          price: item.price || 0,
          compareAtPrice: item.compareAtPrice || item.originalPrice || 0,
          images: item.galleryImages && item.galleryImages.length > 0 ? item.galleryImages : item.imageUrl ? [item.imageUrl] : [],
          stock: item.stockQuantity || item.stock || 0,
          status: item.isDeleted ? 'draft' : (item.isActive === false ? 'draft' : 'active'),
          hasVariants: Boolean(item.variants && item.variants.options && item.variants.options.length > 0),
          variants: item.variants?.options,
        });
      } else if (entity === 'categories') {
        await firestoreCategoriesService.saveCategory(item.id, {
          id: item.id,
          division: item.divisionId || item.division || 'mart',
          name: item.name,
          slug: item.slug || item.id,
          description: item.description || '',
          imageUrl: item.imageUrl || '',
          order: item.order || item.sortOrder || 0,
          status: item.isDeleted ? 'inactive' : (item.status || 'active'),
        });
      } else if (entity === 'portfolio') {
        await firestorePortfolioService.savePortfolio(item.id, {
          id: item.id,
          sku: item.sku || undefined,
          title: item.title,
          division: item.divisionId || item.division || 'sws',
          category: item.category || 'Production',
          client: item.client || 'Client',
          year: item.year || '2026',
          summary: item.summary || item.description || '',
          description: item.description || item.fullDescription || item.summary || '',
          highlights: item.highlights || [],
          deliverables: item.deliverables || [],
          imageUrl: item.imageUrl || (item.galleryImages && item.galleryImages[0]) || '',
          galleryImages: item.galleryImages || (item.imageUrl ? [item.imageUrl] : []),
          liveUrl: item.liveUrl || '',
          impactMetrics: item.impactMetrics || [],
          tags: item.tags || [],
          featured: Boolean(item.isFeatured || item.featured),
          status: item.isDeleted ? 'draft' : (item.isActive === false ? 'draft' : 'published'),
        });
      } else if (entity === 'gallery') {
        await firestoreGalleryService.saveGallery(item.id, {
          id: item.id,
          sku: item.sku || undefined,
          title: item.title,
          division: item.divisionId || item.division || 'sws',
          type: item.type || item.mediaType || 'image',
          url: item.url || item.mediaUrl || item.imageUrl || '',
          thumbnailUrl: item.thumbnailUrl || item.url || item.mediaUrl || '',
          caption: item.caption || '',
          aspectRatio: item.aspectRatio || '16:9',
          tag: item.category || (Array.isArray(item.tags) ? item.tags[0] : (item.tag || 'General')),
          category: item.category || (Array.isArray(item.tags) ? item.tags[0] : (item.tag || 'General')),
          tags: Array.isArray(item.tags) ? item.tags : (item.category ? [item.category] : []),
          order: item.sortOrder || item.order || 0,
          status: (item.isDeleted || item.isActive === false) ? 'hidden' : 'published',
        });
      } else if (entity === 'milestones') {
        await firestoreMilestonesService.saveMilestone(item.id, {
          id: item.id,
          year: item.year || '2026',
          title: item.title,
          description: item.description,
          divisionId: item.divisionId || 'sws',
          badge: item.badge || '',
          metric: item.metric || '',
          iconName: item.iconName || 'Award',
          keyOutcome: item.keyOutcome || '',
          highlight: Boolean(item.highlight),
          imageUrl: item.imageUrl || '',
          order: item.order || item.sortOrder || 0,
          status: item.isDeleted ? 'draft' : (item.isActive === false ? 'draft' : 'published'),
          isPublished: !item.isDeleted && item.isActive !== false,
        });
      } else if (entity === 'companies') {
        await firestoreTrustedCompaniesService.saveTrustedCompany(item.id, {
          id: item.id,
          name: item.name,
          industry: item.industry || '',
          partnershipType: item.partnershipType || 'Strategic Partner',
          logoUrl: item.logoUrl || '',
          website: item.website || '',
          description: item.description || '',
          isPublished: !item.isDeleted && item.isActive !== false,
          order: item.order || 0,
          status: item.isDeleted ? 'inactive' : (item.isActive === false ? 'inactive' : 'active'),
        });
      } else if (entity === 'testimonials') {
        await firestoreTestimonialsService.saveTestimonial(item.id, {
          id: item.id,
          author: item.author,
          role: item.role || '',
          company: item.company || '',
          message: item.content || item.message || '',
          quote: item.content || item.quote || item.message || '',
          avatarUrl: item.avatarUrl || '',
          rating: item.rating || 5,
          division: item.divisionId || item.division || 'sws',
          verified: item.verified !== false,
          order: item.order || 0,
          isFeatured: Boolean(item.featured || item.isFeatured),
          isHidden: item.isDeleted || item.isActive === false,
        });
      }
    } catch (err) {
      console.warn(`[Firestore Sync] Failed to sync ${entity}/${item.id}:`, err);
    }
  }

  private async deleteEntityItemFromFirestore(entity: CmsEntityType, id: string): Promise<void> {
    try {
      if (entity === 'products') {
        await firestoreProductsService.deleteProduct(id);
      } else if (entity === 'services') {
        await firestoreServicesService.deleteService(id);
      } else if (entity === 'divisions') {
        await firestoreDivisionsService.deleteDivision(id as any);
      } else if (entity === 'categories') {
        await firestoreCategoriesService.deleteCategory(id);
      } else if (entity === 'portfolio') {
        await firestorePortfolioService.deletePortfolio(id);
      } else if (entity === 'gallery') {
        await firestoreGalleryService.deleteGallery(id);
      } else if (entity === 'milestones') {
        await firestoreMilestonesService.deleteMilestone(id);
      } else if (entity === 'companies') {
        await firestoreTrustedCompaniesService.deleteTrustedCompany(id);
      } else if (entity === 'testimonials') {
        await firestoreTestimonialsService.deleteTestimonial(id);
      }
    } catch (err) {
      console.warn(`[Firestore Delete Sync] Failed to delete ${entity}/${id}:`, err);
    }
  }

  public update<T = any>(entity: CmsEntityType, id: string, data: Partial<T>): T | null {
    const current: any[] = this.cache[entity] || [];
    const index = current.findIndex((i) => i.id === id);
    if (index === -1) return null;

    const existing = current[index];
    const now = new Date().toISOString();
    const updatedItem: any = {
      ...existing,
      ...data,
      id,
      updatedAt: now,
    };

    current[index] = updatedItem;
    this.cache[entity] = [...current];
    safeStorage.setItem(this.getStorageKey(entity), JSON.stringify(this.cache[entity]));

    adminService.logAudit({
      action: `CMS_UPDATE_${entity.toUpperCase()}`,
      entityType: entity,
      entityId: id,
      details: `Updated ${entity.slice(0, -1)}: "${updatedItem.title || updatedItem.name || updatedItem.code || id}".`,
      status: 'success',
    });

    this.notify(entity);

    // Asynchronously synchronize update to Firestore
    this.syncEntityItemToFirestore(entity, updatedItem);

    return updatedItem as T;
  }

  /**
   * Reorder business divisions sequentially and sync to Firestore
   */
  public async reorderDivisions(orderedIds: string[]): Promise<void> {
    const current: CmsDivision[] = (this.cache.divisions || []) as CmsDivision[];
    orderedIds.forEach((rawId, idx) => {
      const order = idx + 1;
      const cleanId = rawId.replace('div-', '');
      const found = current.find((d) => d.id === rawId || d.id === `div-${cleanId}` || d.divisionKey === cleanId);
      if (found) {
        found.order = order;
      }
    });

    current.sort((a, b) => (a.order || 99) - (b.order || 99));
    this.cache.divisions = [...current];
    safeStorage.setItem(this.getStorageKey('divisions'), JSON.stringify(this.cache.divisions));

    adminService.logAudit({
      action: 'CMS_REORDER_DIVISIONS',
      entityType: 'divisions',
      entityId: 'all',
      details: `Reordered divisions: ${orderedIds.join(' > ')}`,
      status: 'success',
    });

    this.notify('divisions');

    // Sync to Firestore
    const cleanIds = orderedIds.map((id) => id.replace('div-', ''));
    await firestoreDivisionsService.reorderDivisions(cleanIds);
  }

  // Soft Deletion (marks isDeleted: true and sets deletedAt timestamp)
  public softDelete(entity: CmsEntityType, id: string): boolean {
    const current: any[] = this.cache[entity] || [];
    const index = current.findIndex((i) => i.id === id);
    if (index === -1) return false;

    const now = new Date().toISOString();
    current[index] = {
      ...current[index],
      isDeleted: true,
      deletedAt: now,
      updatedAt: now,
    };

    this.cache[entity] = [...current];
    safeStorage.setItem(this.getStorageKey(entity), JSON.stringify(this.cache[entity]));

    adminService.logAudit({
      action: `CMS_SOFT_DELETE_${entity.toUpperCase()}`,
      entityType: entity,
      entityId: id,
      details: `Soft deleted ${entity.slice(0, -1)} (ID: ${id}) into archive.`,
      status: 'warning',
    });

    this.notify(entity);

    // Sync soft deletion state to Firestore
    this.syncEntityItemToFirestore(entity, current[index]);

    return true;
  }

  // Hard Permanent Deletion (with audit log)
  public hardDelete(entity: CmsEntityType, id: string): boolean {
    const current: any[] = this.cache[entity] || [];
    const item = current.find((i) => i.id === id);
    if (!item) return false;

    const filtered = current.filter((i) => i.id !== id);
    this.cache[entity] = filtered;
    safeStorage.setItem(this.getStorageKey(entity), JSON.stringify(filtered));

    adminService.logAudit({
      action: `CMS_HARD_DELETE_${entity.toUpperCase()}`,
      entityType: entity,
      entityId: id,
      details: `Permanently removed ${entity.slice(0, -1)} "${item.title || item.name || item.code || id}" from database.`,
      status: 'warning',
    });

    this.notify(entity);

    // Sync permanent deletion to Firestore
    this.deleteEntityItemFromFirestore(entity, id);

    return true;
  }

  // Alias for permanentDelete
  public permanentDelete(entity: CmsEntityType, id: string): boolean {
    return this.hardDelete(entity, id);
  }

  // Restore Soft-Deleted Item
  public restore(entity: CmsEntityType, id: string): boolean {
    const current: any[] = this.cache[entity] || [];
    const index = current.findIndex((i) => i.id === id);
    if (index === -1) return false;

    const now = new Date().toISOString();
    current[index] = {
      ...current[index],
      isDeleted: false,
      deletedAt: null,
      updatedAt: now,
    };

    this.cache[entity] = [...current];
    safeStorage.setItem(this.getStorageKey(entity), JSON.stringify(this.cache[entity]));

    adminService.logAudit({
      action: `CMS_RESTORE_${entity.toUpperCase()}`,
      entityType: entity,
      entityId: id,
      details: `Restored archived ${entity.slice(0, -1)} (ID: ${id}) back to active status.`,
      status: 'success',
    });

    this.notify(entity);

    // Sync restoration to Firestore
    this.syncEntityItemToFirestore(entity, current[index]);

    return true;
  }

  public resetEntityToDefaults(entity: CmsEntityType): void {
    const seed = this.getSeedDataForEntity(entity);
    this.cache[entity] = seed;
    safeStorage.setItem(this.getStorageKey(entity), JSON.stringify(seed));

    adminService.logAudit({
      action: `CMS_RESET_${entity.toUpperCase()}`,
      entityType: entity,
      entityId: 'ALL',
      details: `Restored default factory data for ${entity}.`,
      status: 'warning',
    });

    this.notify(entity);
  }

  public getEntityCounts(): Record<CmsEntityType, { active: number; deleted: number; total: number }> {
    const counts = {} as Record<CmsEntityType, { active: number; deleted: number; total: number }>;
    const entities: CmsEntityType[] = [
      'divisions',
      'services',
      'products',
      'categories',
      'packages',
      'portfolio',
      'gallery',
      'milestones',
      'companies',
      'testimonials',
      'pages',
      'banners',
      'coupons',
    ];

    entities.forEach((entity) => {
      const list: any[] = this.cache[entity] || [];
      const active = list.filter((i) => !i.isDeleted).length;
      const deleted = list.filter((i) => i.isDeleted).length;
      counts[entity] = { active, deleted, total: list.length };
    });

    return counts;
  }

  // Get single division by division key with fallback to DIVISIONS config
  public getDivisionByKey(key: DivisionId): CmsDivision | null {
    const divisions = this.getAll<CmsDivision>('divisions');
    const found = divisions.find((d) => d.divisionKey === key || d.id === `div-${key}` || d.id === key);
    return found || null;
  }

  // ==========================================
  // HOMEPAGE CMS CONTROLS
  // ==========================================
  public getHomepageConfig(): HomepageCmsConfig {
    const key = `${CMS_STORAGE_PREFIX}homepage_config`;
    const stored = safeStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // fallback
      }
    }
    const defaultConf = this.getDefaultHomepageConfig();
    safeStorage.setItem(key, JSON.stringify(defaultConf));
    return defaultConf;
  }

  public updateHomepageConfig(partial: Partial<HomepageCmsConfig>): HomepageCmsConfig {
    const current = this.getHomepageConfig();
    const updated: HomepageCmsConfig = {
      ...current,
      ...partial,
      hero: { ...current.hero, ...(partial.hero || {}) },
      intro: { ...current.intro, ...(partial.intro || {}) },
      featuredServices: { ...current.featuredServices, ...(partial.featuredServices || {}) },
      featuredProducts: { ...current.featuredProducts, ...(partial.featuredProducts || {}) },
      portfolio: { ...current.portfolio, ...(partial.portfolio || {}) },
      milestones: { ...current.milestones, ...(partial.milestones || {}) },
      companies: { ...current.companies, ...(partial.companies || {}) },
      testimonials: { ...current.testimonials, ...(partial.testimonials || {}) },
      ctaSection: { ...current.ctaSection, ...(partial.ctaSection || {}) },
      seo: { ...current.seo, ...(partial.seo || {}) },
      updatedAt: new Date().toISOString(),
    };

    const key = `${CMS_STORAGE_PREFIX}homepage_config`;
    safeStorage.setItem(key, JSON.stringify(updated));

    adminService.logAudit({
      action: 'CMS_UPDATE_HOMEPAGE',
      entityType: 'homepage',
      entityId: 'main-home',
      details: 'Updated Homepage hero, showcase, CTAs, and section controls.',
      status: 'success',
    });

    // Notify listeners
    this.notifyHomepage();

    // Async sync to Cloud Firestore
    firestoreSettingsService.updateHomepageSettings(updated).catch((err) => {
      console.warn('[Firestore Sync] Homepage settings sync error:', err);
    });

    return updated;
  }

  public syncHomepageConfig(config: HomepageCmsConfig): void {
    const key = `${CMS_STORAGE_PREFIX}homepage_config`;
    try {
      safeStorage.setItem(key, JSON.stringify(config));
      this.notifyHomepage();
    } catch (e) {
      console.warn('[cmsService] Failed to sync homepage config to localStorage:', e);
    }
  }

  public resetHomepageConfig(): HomepageCmsConfig {
    const defaultConf = this.getDefaultHomepageConfig();
    const key = `${CMS_STORAGE_PREFIX}homepage_config`;
    safeStorage.setItem(key, JSON.stringify(defaultConf));

    adminService.logAudit({
      action: 'CMS_RESET_HOMEPAGE',
      entityType: 'homepage',
      entityId: 'main-home',
      details: 'Reset Homepage configuration to factory defaults.',
      status: 'warning',
    });

    this.notifyHomepage();

    // Async sync to Cloud Firestore
    firestoreSettingsService.updateHomepageSettings(defaultConf).catch((err) => {
      console.warn('[Firestore Sync] Homepage reset sync error:', err);
    });

    return defaultConf;
  }

  private homepageListeners: Set<() => void> = new Set();

  public subscribeHomepage(callback: () => void): () => void {
    this.homepageListeners.add(callback);
    return () => {
      this.homepageListeners.delete(callback);
    };
  }

  private notifyHomepage(): void {
    this.homepageListeners.forEach((cb) => cb());
  }

  public getDefaultHomepageConfig(): HomepageCmsConfig {
    return {
      hero: {
        badgeText: 'INTEGRATED ENTERPRISE CONGLOMERATE • EST. 2022',
        titleLine1: 'Creating Moments...',
        titleHighlight: 'Capturing Memories...',
        titleLine2: '& Delivering Innovation...',
        description:
          'Mahdev Pvt Ltd is a premier multi-division enterprise powering Sri Lanka’s most ambitious event decorations, fine-art photography and 8K films, scalable IT solutions, luxury travel expeditions, and professional hardware procurement.',
        mediaType: 'gradient',
        mediaUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80',
        videoEmbedUrl: '',
        primaryCtaLabel: 'Explore Business Divisions',
        primaryCtaLink: '#divisions',
        secondaryCtaLabel: 'Discover Services',
        secondaryCtaLink: '#featured-services',
        metrics: [
          { label: 'Business Divisions', value: '5', subtext: 'Synergized Operations' },
          { label: 'Client Satisfaction', value: '99.4%', subtext: 'Enterprise Rated' },
          { label: 'Projects Delivered', value: '1,450+', subtext: 'Island-wide & Global' },
          { label: 'Uptime & Reliability', value: '99.9%', subtext: 'Mission Critical' },
        ],
        showcaseItems: [
          {
            id: 'sws',
            name: 'SWS Event Management',
            badge: 'Luxury Events & Staging',
            tagline: 'Creating Moments... Luxury Event Decor & Rentals',
            highlight: '5,000+ Rental Inventory • Mandaps • Stage Lighting',
            image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
            route: '/sws',
          },
          {
            id: 'u1',
            name: 'U1 Studio',
            badge: 'Cinema & Photography',
            tagline: 'Capturing Memories... 8K Cinema & Commercials',
            highlight: 'Master Portraiture • Drone Filming • Brand Campaigns',
            image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=85',
            route: '/u1',
          },
          {
            id: 'it',
            name: 'Mahdev IT & Solutions',
            badge: 'Software & Cloud',
            tagline: 'Delivering Innovation... Web, Mobile & Enterprise Cloud',
            highlight: 'Custom Web Apps • Scalable API Systems • 99.9% SLA',
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=85',
            route: '/it',
          },
          {
            id: 'travels',
            name: 'Mahdev Travels',
            badge: 'Bespoke Travel',
            tagline: 'Discover Paradise... Curated Ceylon Itineraries',
            highlight: 'Chauffeur Fleet • Boutique Villas • Islandwide Tours',
            image: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=85',
            route: '/travels',
          },
          {
            id: 'mart',
            name: 'Mahdev Online Mart',
            badge: 'Decor & Tech Mart',
            tagline: 'Modern Living... Premium Decor & Smart Tech',
            highlight: 'Verified Hardware • Direct Islandwide Courier Delivery',
            image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=85',
            route: '/mart',
          },
        ],
      },
      intro: {
        badge: 'THE MAHDEV ADVANTAGE',
        headline: 'A Unified Ecosystem of Specialized Excellence',
        subheadline: 'Eliminating friction across multi-vendor logistics with a single trusted corporate partner.',
        description:
          'Founded in 2022 with a bold vision to elevate event decorations, photographic mastery, IT solutions, and luxury hospitality across Sri Lanka, Mahdev Pvt Ltd operates as an integrated group with five specialized divisions.',
        pillars: [
          { title: 'Turnkey Integration', desc: 'Seamless single-point coordination from event decor to studio cinematography and cloud IT systems.', icon: 'Layers' },
          { title: 'Enterprise Rigor', desc: 'ISO-aligned quality standards, calibrated hardware fleets, and SLA guarantees.', icon: 'ShieldCheck' },
          { title: 'Bespoke Craftsmanship', desc: 'Tailored solutions whether styling an opulent wedding decor, capturing 8K cinema, or building high-traffic cloud infrastructure.', icon: 'Sparkles' },
        ],
      },
      divisionsSection: {
        badge: 'Enterprise Portfolio',
        title: 'Operating Divisions',
        subtitle: 'Autonomous specialized units governed under Mahdev Group with direct in-house technical crews.',
        enabled: true,
      },
      whyMahdev: {
        badge: 'Operational Standards',
        title: 'The Enterprise Standard',
        subtitle: 'Rigorous quality control, in-house technical mastery, and clear accountability across every project.',
        enabled: true,
        guarantees: [
          {
            id: 'std-1',
            iconName: 'ShieldCheck',
            title: 'Direct Holding Governance',
            description: 'Zero third-party brokerages. You contract directly with certified in-house technical directors and crews.',
            tag: '100% In-House',
          },
          {
            id: 'std-2',
            iconName: 'Zap',
            title: 'Turnkey Execution Speed',
            description: 'From 3D CAD stage renders and software sprint cycles to immediate nationwide logistics.',
            tag: 'Turnkey SLA',
          },
          {
            id: 'std-3',
            iconName: 'Layers',
            title: '5,000+ Verified Assets',
            description: 'State-of-the-art concert audio, LED walls, German trussing, cinema cameras, and vehicle fleets.',
            tag: 'Fully Owned',
          },
          {
            id: 'std-4',
            iconName: 'PhoneCall',
            title: 'Dedicated Client Support Desk',
            description: 'Dedicated account managers ensuring uninterrupted coordination across all divisions 24/7.',
            tag: 'Always Active',
          },
        ],
      },
      featuredServices: {
        badge: 'FLAGSHIP SOLUTIONS',
        title: 'Featured Services & Solutions',
        subtitle: 'Explore key flagship services delivered across our 5 specialized enterprise divisions.',
        selectedServiceIds: ['srv-1', 'srv-2', 'srv-3', 'srv-4', 'srv-5', 'srv-6'],
        enabled: true,
      },
      featuredProducts: {
        badge: 'HARDWARE & COMMERCE',
        title: 'Enterprise Hardware & Procurement',
        subtitle: 'Calibrated cinema cameras, high-output lighting, pro audio, and certified electronics.',
        selectedProductIds: ['prod-001', 'prod-002', 'prod-003', 'prod-004'],
        spotlightBannerText: 'Official Sony FX9, RED V-Raptor, and Sennheiser dealer in Sri Lanka.',
        enabled: true,
      },
      portfolio: {
        badge: 'FEATURED WORK',
        title: 'Signature Portfolios & Case Studies',
        subtitle: 'Explore our latest high-impact deliverables across luxury event decor, cinema photography, and scalable IT solutions.',
        selectedProjectIds: ['proj-1', 'proj-2', 'proj-3', 'proj-4'],
        enabled: true,
      },
      decorationShowcase: {
        badge: 'SWS Precision Event Engineering',
        title: 'Cinematic Event & Decoration Showcase',
        subtitle: 'Experience the craftsmanship, lighting architectures, kinetic florals, and multi-camera live production engineered by Mahdev Event Management (SWS).',
        enabled: true,
        videos: [
          {
            id: 'decor-vid-1',
            title: 'Grand Royal Wedding Stagecraft & Architectural Floral Truss',
            category: 'Weddings',
            location: 'Shangri-La Ballroom, Colombo',
            duration: '0:48',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-wedding-table-with-flower-decorations-and-cutlery-42797-large.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
            description: 'Custom engineered kinetic floral canopy with gold-leaf mandap architecture, precision beam spotlights, and 1,200-guest seating alignment.',
            venueType: '5-Star Luxury Ballroom',
            divisionName: 'SWS Event Management',
            highlights: ['Bespoke Floral Rigging', 'Kinetic Lighting Control', 'Custom Mandap Architecture'],
          },
          {
            id: 'decor-vid-2',
            title: 'Atmospheric Open-Air Coastal Reception & Fairy Light Canopy',
            category: 'Floral & Canopy',
            location: 'Nilaveli Beachfront, Trincomalee',
            duration: '0:35',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-decorated-table-at-an-outdoor-wedding-42799-large.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
            description: 'Enchanted seaside evening ambiance featuring 20,000+ warm fairy light diodes, bamboo floral arches, and ocean breeze-resistant trussing.',
            venueType: 'Oceanfront Private Estate',
            divisionName: 'SWS Event Management',
            highlights: ['Weather-Resistant Truss', 'Fairy Light Sky Ceiling', 'Driftwood Floral Arches'],
          },
          {
            id: 'decor-vid-3',
            title: 'Enterprise Tech Summit Stage & Dynamic RGB Beam Matrix',
            category: 'Corporate Galas',
            location: 'BMICH Main Hall, Colombo',
            duration: '0:42',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-stage-lighting-at-a-concert-40879-large.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
            description: 'High-impact corporate keynote presentation with 3D projection mapping, synchronized beam fixtures, and ultra-wide P2.5 LED wall.',
            venueType: 'Convention Center Arena',
            divisionName: 'SWS Event Management',
            highlights: ['P2.5 Curved LED Wall', 'DMX Beam Sync', 'Corporate Keynote Staging'],
          },
          {
            id: 'decor-vid-4',
            title: 'Traditional Luxury Poruwa & Golden Lotus Floral Sanctum',
            category: 'Weddings',
            location: 'Cinnamon Grand, Colombo',
            duration: '0:50',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-celebration-table-with-champagne-glasses-and-flowers-42798-large.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
            description: 'Handcrafted wooden Poruwa with cascading orchids, brass oil lamp accents, and warm ambient illumination celebrating Sri Lankan heritage.',
            venueType: 'Heritage Banquet Hall',
            divisionName: 'SWS Event Management',
            highlights: ['Hand-Carved Poruwa', 'Fresh Orchid Cascades', 'Traditional Brass Accents'],
          },
          {
            id: 'decor-vid-5',
            title: 'Neon Gala Night & Kinetic Moving Heads Staging',
            category: 'Lighting & Truss',
            location: 'Galle Face Hotel, Colombo',
            duration: '0:38',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-concert-crowd-raising-hands-under-lights-42999-large.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
            description: 'Electrifying gala dinner production featuring 360-degree moving heads, haze effects, and elevated VIP lounge styling.',
            venueType: 'Historical Seafront Lawn',
            divisionName: 'SWS Event Management',
            highlights: ['360-Degree Moving Heads', 'Atmospheric Haze FX', 'Custom Truss Rigging'],
          },
        ],
      },
      milestones: {
        badge: 'OUR TRAJECTORY',
        title: 'Milestones of Excellence (2022 - Present)',
        subtitle: 'Key historical chapters shaping the expansion of Mahdev Pvt Ltd.',
        enabled: true,
        achievementsTitle: 'Key Verified Achievements',
        achievementsSubtitle: 'Tangible deliverables, certified quality benchmarks, and nationwide enterprise footprint.',
        achievements: [
          {
            id: 'projects',
            metric: '1,800+',
            label: 'Projects Completed',
            description: 'Successfully completed more than 1,800 projects across our event management, photography, and IT services.',
            badge: 'Deliverables',
            iconName: 'Briefcase',
            highlight: true,
          },
          {
            id: 'success-rate',
            metric: '98%',
            label: 'Success Rate',
            description: 'Maintaining a strong commitment to quality, reliability, and successful project delivery.',
            badge: 'Quality Standard',
            iconName: 'CheckCircle2',
          },
          {
            id: 'growth',
            metric: '5+',
            label: 'Years of Growth',
            description: 'Growing from an event management service into a multi-service registered private enterprise.',
            badge: 'Track Record',
            iconName: 'TrendingUp',
          },
          {
            id: 'divisions',
            metric: '3+',
            label: 'Core Business Divisions',
            description: 'Event Management, Photography & Creative Media, and IT & Digital Solutions.',
            badge: 'Multidisciplinary',
            iconName: 'Layers',
          },
          {
            id: 'coverage',
            metric: 'Islandwide',
            label: 'Service Coverage',
            description: 'Serving clients across Sri Lanka with our expanding range of specialized corporate and private services.',
            badge: 'Sri Lanka Wide',
            iconName: 'MapPin',
          },
          {
            id: 'vision',
            metric: 'One Vision',
            label: 'Multiple Solutions',
            description: 'Creating Moments. Capturing Memories. Delivering Innovation.',
            badge: 'Enterprise Creed',
            iconName: 'Sparkles',
            highlight: true,
          },
        ],
      },
      companies: {
        badge: 'CORPORATE PARTNERS',
        title: 'Trusted by Sri Lanka’s Leading Brands',
        subtitle: 'Collaborating with national institutions, luxury hotel chains, and technology leaders.',
        enabled: true,
      },
      testimonials: {
        badge: 'CLIENT ENDORSEMENTS',
        title: 'What Enterprise Leaders Say',
        subtitle: 'Verified reviews from managing directors, event chairs, and technology executives.',
        enabled: true,
      },
      ctaSection: {
        badge: 'DISPATCH YOUR INQUIRY',
        headline: 'Ready to Bring Your Vision to Life?',
        subheadline: 'Connect with our group leadership and division directors for immediate consultation and customized quotes.',
        primaryButtonText: 'Schedule Consultation',
        primaryButtonLink: '#contact',
        secondaryButtonText: 'Browse Catalog',
        secondaryButtonLink: '#featured-services',
        contactPhone: COMPANY_INFO.primaryPhone,
        contactEmail: COMPANY_INFO.email,
        corporateLocation: COMPANY_INFO.offices.colombo.fullAddress,
      },
      seo: {
        pageTitle: 'Mahdev (Pvt) Ltd - Creating Moments | Capturing Memories | Delivering Innovation',
        metaDescription: 'Creating Moments... Capturing Memories... & Delivering Innovation... Integrated enterprise spanning Event Decorations & Management, Photography & Studio Cinema, IT Solutions & Software, Travels, and Online Mart.',
        ogImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
        canonicalUrl: 'https://mahdev.lk/',
      },
      updatedAt: new Date().toISOString(),
    };
  }

  // ==========================================
  // CENTRALIZED COMPANY INFORMATION CRUD
  // ==========================================
  public getCompanyInfo(): CompanyInformation {
    const key = `${CMS_STORAGE_PREFIX}company_info`;
    const stored = safeStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...COMPANY_INFO,
          ...parsed,
          offices: {
            ...COMPANY_INFO.offices,
            ...(parsed.offices || {}),
          },
          socials: {
            ...COMPANY_INFO.socials,
            ...(parsed.socials || {}),
          },
          workingHours: {
            ...COMPANY_INFO.workingHours,
            ...(parsed.workingHours || {}),
          },
        };
      } catch {}
    }
    return COMPANY_INFO;
  }

  public updateCompanyInfo(updates: Partial<CompanyInformation>): CompanyInformation {
    const current = this.getCompanyInfo();
    const merged: CompanyInformation = {
      ...current,
      ...updates,
      phones: updates.phones || (updates.primaryPhone ? [updates.primaryPhone, updates.secondaryPhone || current.secondaryPhone] : current.phones),
      offices: {
        ...current.offices,
        ...(updates.offices || {}),
      },
      socials: {
        ...current.socials,
        ...(updates.socials || {}),
      },
      workingHours: {
        ...current.workingHours,
        ...(updates.workingHours || {}),
      },
    };

    const key = `${CMS_STORAGE_PREFIX}company_info`;
    safeStorage.setItem(key, JSON.stringify(merged));

    adminService.logAudit({
      action: 'UPDATE_COMPANY_INFO',
      entityType: 'System',
      entityId: 'SYS-COMPANY',
      details: 'Updated official Mahdev Pvt Ltd corporate details, phones, email, and office locations.',
      status: 'success',
    });

    // Notify listeners
    this.notify('pages');

    // Async sync to Cloud Firestore
    firestoreSettingsService.updateCompanySettings({
      name: merged.name,
      legalName: merged.legalName,
      tagline: merged.tagline,
      phones: merged.phones,
      email: merged.email,
      primaryPhone: merged.primaryPhone,
      secondaryPhone: merged.secondaryPhone,
      offices: {
        colombo: {
          name: merged.offices.colombo.name,
          address: merged.offices.colombo.fullAddress,
          city: merged.offices.colombo.city || 'Colombo',
          country: merged.offices.colombo.country || 'Sri Lanka',
          isHeadquarters: Boolean(merged.offices.colombo.isHeadquarters),
          mapQuery: merged.offices.colombo.mapQuery || 'Colombo, Sri Lanka',
        },
        trincomalee: {
          name: merged.offices.trincomalee.name,
          address: merged.offices.trincomalee.fullAddress,
          city: merged.offices.trincomalee.city || 'Trincomalee',
          country: merged.offices.trincomalee.country || 'Sri Lanka',
          isHeadquarters: false,
          mapQuery: merged.offices.trincomalee.mapQuery || 'Trincomalee, Sri Lanka',
        },
      },
      socials: merged.socials,
      workingHours: merged.workingHours,
    }).catch((err) => {
      console.warn('[Firestore Sync] Company settings sync error:', err);
    });

    return merged;
  }
}

export const cmsService = new CmsService();
