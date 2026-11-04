import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Heart,
  MapPin,
  MessageCircle,
  PackageCheck,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { DIVISIONS } from '../../config/divisions';
import { DivisionCard } from '../divisions/DivisionCard';
import { getDivisionCardItems } from '../../utils/divisionPresentation';
import { MAHDEV_WHATSAPP_NUMBER } from '../../utils/whatsapp';
import { formatCurrency } from '../../utils/currency';

const OCCASIONS = [
  { name: 'Weddings', terms: ['wedding', 'marriage'] },
  { name: 'Outdoor receptions', terms: ['outdoor', 'reception'] },
  { name: 'Engagements', terms: ['engagement', 'homecoming'] },
  { name: 'Baby showers', terms: ['baby', 'shower'] },
  { name: 'Big girl ceremonies', terms: ['big girl', 'half saree'] },
  { name: 'Cradle ceremonies', terms: ['cradle', 'newborn'] },
  { name: 'Birthdays', terms: ['birthday', 'birthday'] },
  { name: 'Corporate events', terms: ['corporate', 'conference'] },
];

const PROCESS = ['Explore services', 'Contact us', 'Confirm your booking', 'Enjoy the experience'];

const WHATSAPP_URL =
  `https://wa.me/${MAHDEV_WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi Mahdev, I would like to plan an event.')}`;

interface HomeDiscoverySectionsProps {
  onNavigate: (route: string) => void;
}

export const HomeDiscoverySections: React.FC<HomeDiscoverySectionsProps> = ({ onNavigate }) => (
  <HomeDiscoverySectionsContent onNavigate={onNavigate} />
);

const HomeDiscoverySectionsContent: React.FC<HomeDiscoverySectionsProps> = ({ onNavigate }) => {
  const { divisions, gallery } = useFirestoreDataContext();
  const galleryCards = useMemo(() => {
    const images = gallery
      .filter((item) => item.status !== 'hidden')
      .map((item) => {
        const candidates = [
          ...(Array.isArray(item.images) ? item.images : []),
          (item as any).imageUrl,
          (item as any).thumbnailUrl,
          item.mediaUrl,
          item.url,
        ].filter((url): url is string => typeof url === 'string' && url.trim().length > 0);
        const image = candidates.find((url) => !/\.(mp4|webm|mov|m4v|ogv)(?:[?#]|$)/i.test(url));
        if (!image) return null;
        return {
          image,
          searchText: `${item.title || ''} ${item.category || ''} ${item.tag || ''} ${item.caption || ''}`.toLowerCase(),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
    const usedImages = new Set<string>();

    return OCCASIONS.map((occasion, index) => {
      const match = images.find((item) =>
        !usedImages.has(item.image) && occasion.terms.some((term) => item.searchText.includes(term))
      );
      const entry = match || images.find((item) => !usedImages.has(item.image)) || images[index % images.length];
      if (!entry) return null;
      usedImages.add(entry.image);
      return { name: occasion.name, image: entry.image, filterTerm: occasion.terms[0] };
    })    .filter((item): item is { name: string; image: string; filterTerm: string } => item !== null);
  }, [gallery]);
  const divisionCards = useMemo(() => {
    const fallbackDivisions = Object.values(DIVISIONS).map((division, order) => ({
      id: division.id,
      name: division.name,
      slug: division.id,
      description: division.description,
      shortName: division.shortName,
      route: division.route,
      imageUrl: division.imageUrl,
      order,
      isPublished: true,
      createdAt: '',
      updatedAt: '',
    }));
    const requiredOrder = ['sws', 'u1', 'it', 'travels', 'mart'];
    const cards = getDivisionCardItems(divisions.length ? divisions : fallbackDivisions);
    return cards
      .filter((division) => requiredOrder.includes(division.id))
      .sort((left, right) => requiredOrder.indexOf(left.id) - requiredOrder.indexOf(right.id))
      .slice(0, 5)
      .map((division) => ({
        ...division,
        mediaType: 'image' as const,
        mediaUrl: division.mediaType === 'video' ? division.posterUrl : division.mediaUrl,
      }));
  }, [divisions]);

  return (
  <>
    <section className="home-trust-wrap" aria-label="Why choose Mahdev">
      <div className="home-trust-grid">
        <article className="home-trust-card">
          <span className="home-trust-icon"><Heart aria-hidden="true" /></span>
          <p><strong>Made with care</strong><span>Personal service, from first chat to final detail</span></p>
        </article>
        <article className="home-trust-card">
          <span className="home-trust-icon"><Sparkles aria-hidden="true" /></span>
          <p><strong>Five specialist teams</strong><span>Events, studio, IT, travel and retail</span></p>
        </article>
        <article className="home-trust-card">
          <span className="home-trust-icon"><MapPin aria-hidden="true" /></span>
          <p><strong>Trincomalee & Colombo</strong><span>Serving clients across Sri Lanka</span></p>
        </article>
        <article className="home-trust-card">
          <span className="home-trust-icon"><MessageCircle aria-hidden="true" /></span>
          <p><strong>Talk to a real person</strong><span>Enquire by form, phone or WhatsApp</span></p>
        </article>
      </div>
    </section>

    {galleryCards.length > 0 && (
      <section className="home-section home-occasions">
        <div className="home-section-heading">
          <p className="home-eyebrow">From the Mahdev gallery</p>
          <h2>What are you <em>celebrating?</em></h2>
        </div>
        <div className="home-occasion-grid">
          {galleryCards.map((occasion, index) => (
            <button
              type="button"
              className={`home-occasion${index === 0 ? ' home-occasion--feature' : ''}${index === 7 ? ' home-occasion--wide' : ''}`}
              key={`${occasion.name}-${occasion.image}`}
              style={{ backgroundImage: `linear-gradient(180deg, transparent 34%, rgba(14,20,36,.72)), url("${occasion.image}")` }}
              onClick={() => {
                onNavigate(`/sws?category=${encodeURIComponent(occasion.filterTerm)}`);
              }}
            >
              <span className="home-occasion-label">
                <span>{occasion.name}</span>
                <span className="home-occasion-more">Explore this collection <ArrowRight aria-hidden="true" /></span>
              </span>
            </button>
          ))}
        </div>
      </section>
    )}

    <div className="home-marquee" aria-label="Mahdev divisions">
      <div className="home-marquee-track" aria-hidden="true">
        {[0, 1].map((copy) => (
          <span className="home-marquee-run" key={copy}>
            SWS Event Management <i>✦</i> <em>U1 Studio</em> <i>✦</i> IT Solutions <i>✦</i>
            <em>Mahdev Travels</em> <i>✦</i> Online Mart <i>✦</i>
          </span>
        ))}
      </div>
    </div>

    <section className="home-section home-pillars">
      <div className="home-section-heading home-section-heading--split">
        <div>
          <p className="home-eyebrow">One group, many possibilities</p>
          <h2>Five pillars, <em>one</em> standard of care.</h2>
        </div>
        <button type="button" className="home-text-link" onClick={() => onNavigate('/contact')}>
          Not sure where to start? Ask us <ArrowRight aria-hidden="true" />
        </button>
      </div>
      <div className="home-pillar-grid">
        {divisionCards.map((division) => (
          <DivisionCard
            key={division.id}
            division={division}
            onNavigate={onNavigate}
            variant="standard"
            showLogo={false}
          />
        ))}
      </div>
    </section>
  </>
  );
};

interface HomeConversionSectionsProps {
  onNavigate: (route: string) => void;
}

export const HomeConversionSections: React.FC<HomeConversionSectionsProps> = ({ onNavigate }) => {
  const { products } = useFirestoreDataContext();
  const { addToCart, cartItems } = useCart();
  const [cartNotice, setCartNotice] = useState('');
  const featuredProducts = useMemo(
    () =>
      products
        .filter((product) => {
          const division = (product.divisionId || product.division || '').toLowerCase();
          return (division === 'mart' || division === 'online-mart') &&
            product.status !== 'archived' &&
            product.status !== 'draft' &&
            product.isAvailable !== false;
        })
        .slice(0, 4),
    [products]
  );

  return (
    <>
      <section className="home-section home-products">
        <div className="home-section-heading home-section-heading--split">
          <div>
            <p className="home-eyebrow">A little something extra</p>
            <h2>Party essentials, <em>delivered.</em></h2>
          </div>
          <button type="button" className="home-text-link" onClick={() => onNavigate('/mart')}>
            Visit the shop <ArrowRight aria-hidden="true" />
          </button>
        </div>
        {featuredProducts.length ? (
          <div className="home-product-grid">
            {featuredProducts.map((product) => {
              const isAdded = cartItems.some((item) => item.productId === product.id);
              const image = product.imageUrl || product.images?.[0] || '';
              return (
                <article className="home-product-card" key={product.id}>
                  <button
                    type="button"
                    className="home-product-image"
                    onClick={() => onNavigate(`/mart?product=${encodeURIComponent(product.id)}`)}
                    aria-label={`View ${product.name}`}
                  >
                    {image && <img src={image} alt={product.imageAlt || product.name} loading="lazy" />}
                    <span>Online Mart</span>
                  </button>
                  <div className="home-product-details">
                    <div>
                      <h3>{product.name}</h3>
                      <p>{formatCurrency(product.discountPrice ?? product.price, product.currency || 'LKR')}</p>
                    </div>
                    <button
                      type="button"
                      className={`home-product-add${isAdded ? ' is-added' : ''}`}
                      onClick={() => {
                        if (!isAdded) {
                          addToCart(product);
                          setCartNotice(`${product.name} added to your cart`);
                        }
                      }}
                      disabled={isAdded}
                      aria-label={isAdded ? `${product.name} added to cart` : `Add ${product.name} to cart`}
                    >
                      {isAdded ? <><Check aria-hidden="true" /> Added</> : <><ShoppingBag aria-hidden="true" /> Add to cart</>}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="home-product-empty">
            <PackageCheck aria-hidden="true" />
            <span>New finds are on their way.</span>
            <button type="button" className="home-text-link" onClick={() => onNavigate('/mart')}>Explore the Mart <ArrowRight aria-hidden="true" /></button>
          </div>
        )}
        <p className="sr-only" aria-live="polite">{cartNotice}</p>
      </section>

      <section className="home-process-section">
        <div className="home-section-heading">
          <p className="home-eyebrow">Simple from the start</p>
          <h2>From first hello to <em>beautifully done.</em></h2>
        </div>
        <ol className="home-process-grid">
          {PROCESS.map((step, index) => (
            <li key={step}>
              <span className="home-process-number">0{index + 1}</span>
              <strong>{step}</strong>
              <ArrowUpRight aria-hidden="true" />
            </li>
          ))}
        </ol>
      </section>

      <section className="home-cta-band">
        <div>
          <p className="home-eyebrow">Your next chapter starts here</p>
          <h2>Focus on your day. <em>We’ll design it.</em></h2>
        </div>
        <button type="button" className="home-button home-button--light" onClick={() => onNavigate('/contact')}>
          Request a quote <ArrowRight aria-hidden="true" />
        </button>
      </section>
    </>
  );
};
