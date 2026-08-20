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
import { FEATURED_SERVICES, COMPANY_MILESTONES, TRUSTED_COMPANIES } from '../data/homeData';
import { MASTER_CATALOG_PRODUCTS } from '../data/catalog/products';
import { MASTER_CATALOG_CATEGORIES } from '../data/catalog/categories';
import { MASTER_BOOKABLE_SERVICES } from '../data/bookingServices';
import { PORTFOLIO_PROJECTS_DATA, TESTIMONIALS_DATA } from '../data/corporateData';
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
        return FEATURED_SERVICES.map((s, idx) => ({
          id: s.id || `srv-${idx + 1}`,
          divisionId: s.divisionId,
          divisionName: s.divisionName,
          title: s.title,
          description: s.description,
          features: s.features || [],
          iconName: s.iconName || 'Sparkles',
          popular: !!s.popular,
          badge: s.badge || 'Enterprise Service',
          startingPrice: s.divisionId === 'sws' ? 1800 : s.divisionId === 'u1' ? 750 : s.divisionId === 'it' ? 2500 : 950,
          currency: 'USD',
          turnaroundTime: s.turnaroundTime || '2-3 Weeks',
          isActive: true,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        }));

      case 'products':
        return MASTER_CATALOG_PRODUCTS.map((p: any) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          slug: p.slug,
          divisionId: p.divisionId,
          divisionName: p.divisionName,
          categoryId: p.categoryId,
          categoryName: p.categoryName,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          currency: p.currency,
          shortDescription: p.shortDescription,
          description: p.description,
          imageUrl: p.imageUrl,
          galleryImages: p.galleryImages || [p.imageUrl],
          stockQuantity: p.stockQuantity,
          stockStatus: p.stockStatus,
          lowStockThreshold: p.lowStockThreshold || 10,
          isFeatured: !!p.isFeatured,
          tags: p.tags || [],
          specifications: p.specifications || {},
          warrantyInfo: p.warrantyInfo || '1-Year Official Manufacturer Warranty',
          isActive: true,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        }));

      case 'categories':
        return MASTER_CATALOG_CATEGORIES.map((c: any, idx) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          divisionId: c.divisionId,
          description: c.description || `High caliber offerings for ${c.name}`,
          iconName: c.icon || 'Layers',
          bannerUrl: c.bannerImage || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
          itemCount: c.itemCount || 12,
          displayOrder: idx + 1,
          isActive: true,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        }));

      case 'packages': {
        const pkgs: CmsPackage[] = [];
        MASTER_BOOKABLE_SERVICES.forEach((service) => {
          service.packages.forEach((pkg, pIdx) => {
            pkgs.push({
              id: pkg.id || `pkg-${service.id}-${pIdx + 1}`,
              serviceId: service.id,
              serviceTitle: service.name,
              divisionId: service.divisionId as DivisionId,
              name: pkg.name,
              tagline: pkg.description,
              price: pkg.price,
              currency: pkg.currency || 'USD',
              duration: pkg.duration || 'Full Session',
              features: pkg.features || [],
              popular: pIdx === 1,
              isCustomQuote: pkg.price === 0,
              isActive: true,
              isDeleted: false,
              createdAt: now,
              updatedAt: now,
            });
          });
        });
        return pkgs;
      }

      case 'portfolio':
        return PORTFOLIO_PROJECTS_DATA.map((proj) => ({
          id: proj.id,
          divisionId: proj.divisionId,
          title: proj.title,
          category: proj.category,
          client: proj.client,
          year: proj.year,
          summary: proj.summary,
          fullDescription: proj.fullDescription || proj.summary,
          highlights: proj.highlights || [],
          deliverables: proj.deliverables || [],
          imageUrl: proj.imageUrl,
          galleryImages: proj.galleryImages || [proj.imageUrl],
          liveUrl: proj.liveUrl || 'https://mahdev.lk',
          impactMetrics: proj.impactMetrics || [{ label: 'Satisfaction', value: '100%' }],
          tags: proj.tags || ['Enterprise', 'Production'],
          isFeatured: true,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        }));

      case 'gallery':
        return [
          {
            id: 'gal-sws-01',
            divisionId: 'sws',
            title: 'BMICH Grand Gala Main Stage',
            category: 'Stage & Lighting',
            mediaType: 'image',
            url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
            caption: '40m curved 4K LED volume matrix with line-array acoustic trusses.',
            tags: ['Concert', 'LED Matrix', 'BMICH'],
            isFeatured: true,
            location: 'Colombo, Sri Lanka',
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'gal-sws-02',
            divisionId: 'sws',
            title: 'Royal Mandap Floral Installation',
            category: 'Luxury Wedding',
            mediaType: 'image',
            url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
            caption: 'Carved teakwood mandap with imported cascading white orchids.',
            tags: ['Wedding', 'Floral Architecture', 'Bentota'],
            isFeatured: true,
            location: 'Bentota Estate',
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'gal-u1-01',
            divisionId: 'u1',
            title: 'Cinema 8K RED V-Raptor Rig',
            category: 'Cinematography',
            mediaType: 'image',
            url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
            caption: 'Filming on location across misty Nuwara Eliya tea hills.',
            tags: ['8K Cinema', 'Documentary', 'Anamorphic'],
            isFeatured: true,
            location: 'Central Highlands',
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'gal-u1-02',
            divisionId: 'u1',
            title: 'Fine-Art Bridal Portrait',
            category: 'Fashion & Bridal',
            mediaType: 'image',
            url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
            caption: 'Studio lighting masterclass and medium format digital capture.',
            tags: ['Fashion', 'Portrait', 'Studio'],
            isFeatured: true,
            location: 'U1 Flagship Studio',
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'gal-it-01',
            divisionId: 'it',
            title: 'Cloud Telemetry & Operations Center',
            category: 'Enterprise IT',
            mediaType: 'image',
            url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
            caption: 'Real-time microservices monitoring dashboard with sub-50ms sync.',
            tags: ['Cloud', 'DevOps', 'React'],
            isFeatured: true,
            location: 'Mahdev HQ',
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'gal-travels-01',
            divisionId: 'travels',
            title: 'Ceylon Highland Helicopter Expedition',
            category: 'Luxury Travel',
            mediaType: 'image',
            url: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80',
            caption: 'Chartered aerial transfers over Sigiriya Rock Fortress.',
            tags: ['Helicopter', 'Sigiriya', 'VIP Concierge'],
            isFeatured: true,
            location: 'Sigiriya, Sri Lanka',
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'gal-mart-01',
            divisionId: 'mart',
            title: 'Authorized Sony FX9 Broadcast Fleet',
            category: 'Hardware & Procurement',
            mediaType: 'image',
            url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
            caption: 'Calibrated broadcast equipment warehouse ready for island dispatch.',
            tags: ['Sony', 'Broadcast', 'Hardware'],
            isFeatured: true,
            location: 'Colombo Fulfillment Center',
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          },
        ];

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
        return TRUSTED_COMPANIES.map((c, idx) => ({
          id: c.id,
          name: c.name,
          industry: c.industry,
          partnershipType: c.partnershipType,
          logoUrl: c.logo || 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=200&q=80',
          website: c.website || 'https://example.com',
          description: c.description || `Key collaborative partner for ${c.industry} excellence.`,
          featured: !!c.featured,
          order: idx + 1,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        }));

      case 'testimonials':
        return TESTIMONIALS_DATA.map((t, idx) => ({
          id: t.id || `test-${idx + 1}`,
          author: t.author,
          role: t.role,
          company: t.company,
          quote: t.quote,
          rating: t.rating,
          divisionId: t.divisionId,
          divisionName: t.divisionName || 'Mahdev Group',
          avatarInitials: t.avatarInitials || t.author.split(' ').map((n) => n[0]).join(''),
          photoUrl: t.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          date: t.date || '2026',
          verified: t.verified ?? true,
          isFeatured: true,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        }));

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
      if (entity === 'divisions' && item.divisionKey) {
        await firestoreDivisionsService.saveDivision(item.divisionKey, item);
      } else if (entity === 'services') {
        await firestoreServicesService.saveService(item.id, {
          division: item.divisionId,
          name: item.title,
          description: item.description,
          price: item.startingPrice || 100,
        });
      } else if (entity === 'products') {
        await firestoreProductsService.saveProduct(item.id, {
          division: item.divisionId,
          name: item.name,
          price: item.price,
          description: item.description,
          sku: item.sku,
        });
      } else if (entity === 'categories') {
        await firestoreCategoriesService.saveCategory(item.id, {
          division: item.divisionId,
          name: item.name,
          slug: item.slug,
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
    return updated;
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
    return merged;
  }
}

export const cmsService = new CmsService();
