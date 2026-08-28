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

  constructor() {
    this.initializeAllEntities();
    this.attachFirestoreSync();
  }

  private attachFirestoreSync(): void {
    try {
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
            localStorage.setItem(key, JSON.stringify(merged));
            this.notify('pages');
          }
        },
        () => {
          // Fallback gracefully if firestore is offline
        }
      );
    } catch (e) {
      console.warn('[CmsService] Firestore settings auto-sync initialization:', e);
    }
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
    if (subs) {
      subs.forEach((cb) => cb());
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
      const stored = localStorage.getItem(key);
      if (!stored || forceReset) {
        const seedData = this.getSeedDataForEntity(entity);
        localStorage.setItem(key, JSON.stringify(seedData));
        this.cache[entity] = seedData;
      } else {
        try {
          this.cache[entity] = JSON.parse(stored);
        } catch {
          const seedData = this.getSeedDataForEntity(entity);
          localStorage.setItem(key, JSON.stringify(seedData));
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
        return COMPANY_MILESTONES.map((m, idx) => ({
          id: m.id || `ms-${idx + 1}`,
          year: m.year,
          title: m.title,
          description: m.description,
          divisionId: m.divisionId,
          badge: m.badge || 'Milestone',
          keyOutcome: m.keyOutcome || 'Established high-grade benchmark.',
          highlight: !!m.highlight,
          imageUrl: m.imageUrl || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
          order: idx + 1,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        }));

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
    localStorage.setItem(this.getStorageKey(entity), JSON.stringify(updated));

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
        await firestoreDivisionsService.saveDivision(divKey, {
          name: item.name,
          description: item.description,
          status: item.isDeleted ? 'inactive' : (item.status || 'active'),
          hero: item.hero,
          seo: item.seo,
          logo: item.logo,
        });
      } else if (entity === 'services') {
        await firestoreServicesService.saveService(item.id, {
          division: item.divisionId,
          name: item.name || item.title,
          slug: item.slug || item.id,
          description: item.description || item.shortDescription,
          images: item.imageUrl ? [item.imageUrl] : item.images || [],
          price: item.startingPrice || item.price || 100,
          currency: item.currency || 'USD',
          status: item.isDeleted ? 'draft' : (item.isActive === false ? 'draft' : 'active'),
          bookingEnabled: item.bookingEnabled !== false,
          quoteEnabled: item.quoteEnabled !== false,
        });
      } else if (entity === 'products') {
        await firestoreProductsService.saveProduct(item.id, {
          division: item.divisionId,
          name: item.name,
          slug: item.slug || item.id,
          sku: item.sku,
          categoryId: item.categoryId,
          description: item.description || item.shortDescription,
          price: item.price,
          compareAtPrice: item.compareAtPrice || item.originalPrice,
          images: item.galleryImages && item.galleryImages.length > 0 ? item.galleryImages : item.imageUrl ? [item.imageUrl] : [],
          stock: item.stockQuantity,
          status: item.isDeleted ? 'draft' : (item.isActive === false ? 'draft' : 'active'),
          hasVariants: Boolean(item.variants && item.variants.options && item.variants.options.length > 0),
          variants: item.variants?.options,
        });
      } else if (entity === 'categories') {
        await firestoreCategoriesService.saveCategory(item.id, {
          division: item.divisionId,
          name: item.name,
          slug: item.slug || item.id,
          description: item.description,
          imageUrl: item.imageUrl,
          order: item.order || item.sortOrder || 0,
          status: item.isDeleted ? 'inactive' : (item.status || 'active'),
        });
      } else if (entity === 'portfolio') {
        await firestorePortfolioService.savePortfolio(item.id, item);
      } else if (entity === 'gallery') {
        await firestoreGalleryService.saveGallery(item.id, item);
      } else if (entity === 'milestones') {
        await firestoreMilestonesService.saveMilestone(item.id, item);
      } else if (entity === 'companies') {
        await firestoreTrustedCompaniesService.saveTrustedCompany(item.id, item);
      } else if (entity === 'testimonials') {
        await firestoreTestimonialsService.saveTestimonial(item.id, item);
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
    localStorage.setItem(this.getStorageKey(entity), JSON.stringify(this.cache[entity]));

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
    localStorage.setItem(this.getStorageKey(entity), JSON.stringify(this.cache[entity]));

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
    localStorage.setItem(this.getStorageKey(entity), JSON.stringify(filtered));

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
    localStorage.setItem(this.getStorageKey(entity), JSON.stringify(this.cache[entity]));

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
    localStorage.setItem(this.getStorageKey(entity), JSON.stringify(seed));

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
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // fallback
      }
    }
    const defaultConf = this.getDefaultHomepageConfig();
    localStorage.setItem(key, JSON.stringify(defaultConf));
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
    localStorage.setItem(key, JSON.stringify(updated));

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
      localStorage.setItem(key, JSON.stringify(config));
      this.notifyHomepage();
    } catch (e) {
      console.warn('[cmsService] Failed to sync homepage config to localStorage:', e);
    }
  }

  public resetHomepageConfig(): HomepageCmsConfig {
    const defaultConf = this.getDefaultHomepageConfig();
    const key = `${CMS_STORAGE_PREFIX}homepage_config`;
    localStorage.setItem(key, JSON.stringify(defaultConf));

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

  private getDefaultHomepageConfig(): HomepageCmsConfig {
    return {
      hero: {
        badgeText: 'INTEGRATED ENTERPRISE CONGLOMERATE',
        titleLine1: 'Creating Moments.',
        titleHighlight: 'Capturing Memories.',
        titleLine2: 'Delivering Innovation.',
        description:
          'Mahdev Pvt Ltd is a premier multi-division enterprise powering Sri Lanka’s most ambitious events, cinematic films, cloud architectures, luxury travel expeditions, and professional hardware procurement.',
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
      },
      intro: {
        badge: 'THE MAHDEV ADVANTAGE',
        headline: 'A Unified Ecosystem of Specialized Excellence',
        subheadline: 'Eliminating friction across multi-vendor logistics with a single trusted corporate partner.',
        description:
          'Founded with a bold vision to elevate creative production, computational engineering, and luxury hospitality across Sri Lanka, Mahdev Pvt Ltd operates as an integrated group with five specialized divisions.',
        pillars: [
          { title: 'Turnkey Integration', desc: 'Seamless single-point coordination from stage setup to software and aerial VIP travel.', icon: 'Layers' },
          { title: 'Enterprise Rigor', desc: 'ISO-aligned quality standards, calibrated hardware fleets, and SLA guarantees.', icon: 'ShieldCheck' },
          { title: 'Bespoke Craftsmanship', desc: 'Tailored solutions whether engineering a custom wedding or building high-traffic cloud infrastructure.', icon: 'Sparkles' },
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
        subtitle: 'Calibrated cinema cameras, high-output lighting, pro audio, and certified Ceylon goods.',
        selectedProductIds: ['prod-001', 'prod-002', 'prod-003', 'prod-004'],
        spotlightBannerText: 'Official Sony FX9, RED V-Raptor, and Sennheiser dealer in Sri Lanka.',
        enabled: true,
      },
      portfolio: {
        badge: 'FEATURED WORK',
        title: 'Signature Portfolios & Case Studies',
        subtitle: 'Explore our latest high-impact deliverables across music concerts, cinema films, and cloud software.',
        selectedProjectIds: ['proj-1', 'proj-2', 'proj-3', 'proj-4'],
        enabled: true,
      },
      milestones: {
        badge: 'OUR TRAJECTORY',
        title: 'Milestones of Excellence (2018 - Present)',
        subtitle: 'Key historical chapters shaping the expansion of Mahdev Pvt Ltd.',
        enabled: true,
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
        pageTitle: 'Corporate Ecosystem | Mahdev Pvt Ltd',
        metaDescription: 'Creating Moments. Capturing Memories. Delivering Innovation. Integrated enterprise spanning Event Management, Studio Cinema, IT & Cloud, Travels, and E-Commerce.',
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
    const stored = localStorage.getItem(key);
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
    localStorage.setItem(key, JSON.stringify(merged));

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
