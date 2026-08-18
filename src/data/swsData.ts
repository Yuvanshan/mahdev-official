export interface SWSService {
  id: string;
  name: string;
  category: 'decor' | 'production' | 'media' | 'hospitality' | 'rentals' | 'packages';
  tagline: string;
  description: string;
  detailedDescription: string;
  startingPrice: string;
  priceNote?: string;
  imageUrl: string;
  gallery: string[];
  features: string[];
  specs?: { label: string; value: string }[];
  badge?: string;
  leadTime?: string;
  capacity?: string;
  iconName?: string;
}

export interface SWSPackage {
  id: string;
  name: string;
  tier: string;
  tagline: string;
  description: string;
  includedServices: string[];
  price: string;
  priceSubtext: string;
  images: string[];
  availability: string;
  badge?: string;
  popular?: boolean;
  idealFor: string;
  guestEstimate: string;
}

export interface SWSGalleryItem {
  id: string;
  title: string;
  category: 'Weddings' | 'Corporate' | 'Birthdays & Socials' | 'Stage & Lighting' | 'Dining & Decor';
  imageUrl: string;
  location: string;
  year: string;
  description: string;
  tags: string[];
}

export interface SWSPortfolioItem {
  id: string;
  title: string;
  client: string;
  eventType: string;
  date: string;
  location: string;
  guestCount: string;
  summary: string;
  detailedCase: string;
  imageUrl: string;
  gallery: string[];
  highlights: string[];
  servicesDelivered: string[];
  testimonial?: {
    quote: string;
    author: string;
    designation: string;
  };
}

export const SWS_SERVICES: SWSService[] = [
  {
    id: 'wedding-decorations',
    name: 'Wedding Decorations',
    category: 'decor',
    tagline: 'Elegance & Grandeur for Your Sacred Union',
    description:
      'Opulent floral arches, bespoke aisle runners, customized mandap/altar architecture, romantic fairy-light canopies, and couture bridal tables.',
    detailedDescription:
      'Our master wedding decorators blend timeless tradition with contemporary luxury. We source fresh Dutch and local premium blooms, custom-fabricated metallic and wood structures, crystal chandeliers, and mood-adaptive wash lighting to turn your venue into a breathtaking dreamscape.',
    startingPrice: 'LKR 250,000',
    priceNote: 'Starting base package; scales with floral volume & venue scale',
    imageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
    ],
    features: [
      'Custom floral entryway and bridal aisle',
      'Grand main stage mandap or wedding backdrop',
      'Head table floral garland styling & fine charger plates',
      'Ambient uplighting & warm fairy light canopies',
      'Welcome archway with personalized calligraphy signage',
      'Cake table & champagne tower staging',
    ],
    specs: [
      { label: 'Setup Time', value: '6 - 10 Hours' },
      { label: 'Floral Grade', value: 'Fresh Premium Grade A Blooms' },
      { label: 'Coordination', value: 'Dedicated On-site Decor Lead' },
      { label: 'Custom Themes', value: 'Traditional, Rustic, Modern Glam, Tropical Bohemian' },
    ],
    badge: 'Signature Luxury',
    leadTime: '3 - 6 Weeks Recommended',
    iconName: 'Heart',
  },
  {
    id: 'birthday-decorations',
    name: 'Birthday Decorations',
    category: 'decor',
    tagline: 'Vibrant Themes for Milestone Celebrations',
    description:
      'Organic balloon installations, custom neon acrylic backdrops, thematic prop design, dessert table framing, and festive lighting.',
    detailedDescription:
      'Whether celebrating a 1st birthday fantasy, a Sweet Sixteen, or a milestone 50th golden jubilee, SWS crafts immersive thematic environments with organic balloon styling, laser-cut nameplates, themed photo booths, and bespoke table centerpieces.',
    startingPrice: 'LKR 85,000',
    priceNote: 'Standard theme layout for up to 100 guests',
    imageUrl:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
    ],
    features: [
      'Organic balloon garlands and archways',
      'Custom LED neon signage with celebrant name/age',
      'Cake plinth pedestals and cylinder dessert tables',
      'Interactive selfie booth with custom thematic props',
      'Kids activity zone or VIP lounge styling',
    ],
    specs: [
      { label: 'Setup Time', value: '3 - 5 Hours' },
      { label: 'Materials', value: 'Eco-biodegradable latex & acrylic' },
      { label: 'Themes', value: '100% Bespoke or Curated Library' },
    ],
    badge: 'Most Popular',
    leadTime: '1 - 2 Weeks Recommended',
    iconName: 'Gift',
  },
  {
    id: 'engagement-decorations',
    name: 'Engagement Decorations',
    category: 'decor',
    tagline: 'Intimate, Romantic & Picture-Perfect Settings',
    description:
      'Delicate circular floral rings, botanical photo backdrops, candlelit dinner tables, and elegant ring-exchange focal stages.',
    detailedDescription:
      'Celebrate the promise of forever with an intimate yet stylish engagement celebration. SWS combines romantic pastel palettes, geometric floral arches, floating glass candles, and ambient lighting to frame your ring ceremony flawlessly.',
    startingPrice: 'LKR 120,000',
    priceNote: 'Starting price for garden, rooftop, or banquet settings',
    imageUrl:
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
    ],
    features: [
      'Circular or hexagonal floral ceremony backdrop',
      'Illuminated "Forever & Always" or custom initials neon',
      'Mirrored acrylic stage plinth for the ring exchange',
      'Romantic candle-lined walkway & entrance mirror welcome',
      'Coordinated seating and high-top cocktail floral accents',
    ],
    specs: [
      { label: 'Setup Time', value: '4 - 6 Hours' },
      { label: 'Styling', value: 'Modern Romantic / Minimalist Chic' },
      { label: 'Lighting', value: 'Warm Amber Uplights & Tea-lights' },
    ],
    leadTime: '2 - 3 Weeks',
    iconName: 'Sparkles',
  },
  {
    id: 'corporate-events',
    name: 'Corporate Events',
    category: 'production',
    tagline: 'Executive Summits, Product Launches & Galas',
    description:
      'Branded stage builds, high-lumen digital backdrops, modular exhibition booths, VIP hospitality lounges, and registration desks.',
    detailedDescription:
      'We deliver precision-engineered corporate event environments that uphold your brand identity. From annual general meetings and high-profile product unveilings to award banquets, SWS handles spatial planning, branded physical structures, and smooth logistical execution.',
    startingPrice: 'LKR 350,000',
    priceNote: 'Custom quote based on stage dimensions & branding scale',
    imageUrl:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
    ],
    features: [
      'Seamless wooden/acrylic branded keynote stage backdrop',
      'Executive podium with discrete digital teleprompters',
      'Media interview photo wall with sponsor step-and-repeat',
      'Registration counters and directional wayfinding totems',
      'VIP lounge setups with executive leather/velvet furnishings',
    ],
    specs: [
      { label: 'Compliance', value: 'Fire-retardant structural materials' },
      { label: 'Branding', value: 'Pantone-accurate color printing' },
      { label: 'Staffing', value: 'Floor managers & backstage coordinators' },
    ],
    badge: 'Enterprise Grade',
    leadTime: '2 - 4 Weeks',
    iconName: 'Building2',
  },
  {
    id: 'stage-decorations',
    name: 'Stage Decorations',
    category: 'production',
    tagline: 'Bespoke Stage Architecture & Backdrops',
    description:
      'Architectural stage structures, 3D textured backdrops, crystal/floral hanging installations, LED matrix integration, and podiums.',
    detailedDescription:
      'The stage is the epicenter of every memorable event. SWS manufactures custom-sized stage platforms with premium carpeting, modular geometric frames, floral waterfall crowns, and acoustic paneling designed to maximize focal impact.',
    startingPrice: 'LKR 180,000',
    priceNote: 'Includes stage skirt, backdrop framing & primary lighting',
    imageUrl:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    ],
    features: [
      'Multi-tiered stage platforms with safety load ratings',
      'Custom fabricated wood, acrylic, and metallic arches',
      'Suspended floral chandeliers and geometric light frames',
      'Seamless velvet or glossy acrylic stage skin flooring',
      'Modular side wings for speaker ingress and tech control',
    ],
    specs: [
      { label: 'Stage Sizes', value: '12x8ft to 60x30ft concert stages' },
      { label: 'Load Capacity', value: 'Up to 750 kg/m² rated truss' },
      { label: 'Finish', value: 'High-gloss acrylic or matte carpet' },
    ],
    leadTime: '2 Weeks',
    iconName: 'Layers',
  },
  {
    id: 'venue-decorations',
    name: 'Venue Decorations',
    category: 'decor',
    tagline: 'Total Spatial Transformation',
    description:
      'Complete venue draping, ceiling installations, perimeter wall treatments, fairy-light tunnels, and garden marquee styling.',
    detailedDescription:
      'Turn blank banquet halls, private villas, outdoor lawns, or rustic warehouses into breathtaking environments. We provide ceiling draping, fairy light canopies, wall wraps, decorative pillar treatments, and ambient environmental styling.',
    startingPrice: 'LKR 190,000',
    priceNote: 'Dependent on total floor square footage and ceiling height',
    imageUrl:
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
    ],
    features: [
      'Ceiling fabric draping with center chandelier drop',
      'Perimeter curtain masking and uplight washes',
      'Entrance tunnel with fairy lights & hanging greenery',
      'Outdoor tree wrapping and pathway lantern styling',
      'Restroom & cocktail foyer continuity styling',
    ],
    specs: [
      { label: 'Ceiling Clearance', value: 'Up to 28ft rigging supported' },
      { label: 'Fabrics', value: 'Sheer chiffon, satin & blackout velvet' },
      { label: 'Outdoor Ready', value: 'Weatherproof cable & fixtures' },
    ],
    leadTime: '3 Weeks',
    iconName: 'Home',
  },
  {
    id: 'photography',
    name: 'Event Photography',
    category: 'media',
    tagline: 'Masterful High-Resolution Photojournalism',
    description:
      'Candid storytelling, VIP portraits, high-speed stage action, detail captures, and swift digital color-graded albums.',
    detailedDescription:
      'In direct synergy with our sister division U1 Studio, SWS deploys premier event photographers armed with full-frame Sony Alpha and Canon R-series cinema bodies, prime lenses, and discreet off-camera lighting to capture the emotion of every second.',
    startingPrice: 'LKR 95,000',
    priceNote: 'Full-day multi-camera crew with color correction',
    imageUrl:
      'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
    ],
    features: [
      'Two senior photographers with dual-slot backup cameras',
      'Unlimited high-resolution digital captures',
      'Same-day highlight preview for social media (15 photos)',
      'Professional color-grading and skin retouching',
      'Private cloud download gallery + physical archival flash drive',
    ],
    specs: [
      { label: 'Gear', value: 'Sony A7R V / Canon R5 + GM Lenses' },
      { label: 'Delivery', value: '48hr Highlight / 14-Day Full Album' },
      { label: 'Synergy', value: 'Powered by U1 Studio Media Unit' },
    ],
    badge: 'U1 Studio Synergy',
    leadTime: '1 - 2 Weeks',
    iconName: 'Camera',
  },
  {
    id: 'videography',
    name: 'Cinematic Videography',
    category: 'media',
    tagline: '4K Cinematic Teasers, Films & Drone Reels',
    description:
      'Cinematic 4K/60p wedding films, corporate recap highlights, multi-camera live switching, and licensed aerial drone sweeping perspectives.',
    detailedDescription:
      'We shoot motion like cinema. Using motorized gimbals, cinema lenses, wireless lavalier audio recorders, and 4K aerial drones, we deliver moving visual stories that make viewers relive every laugh, tear, and cheer.',
    startingPrice: 'LKR 145,000',
    priceNote: 'Cinematic trailer + full documentary feature film',
    imageUrl:
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    ],
    features: [
      '3-4 minute cinematic highlight film with custom music score',
      'Full extended documentary cut (60 - 90 mins)',
      'Licensed 4K drone cinematography for venue & grandeur',
      'Crisp 32-bit float audio capture of speeches & vows',
      'Vertical reels format (9:16) optimized for Instagram / TikTok',
    ],
    specs: [
      { label: 'Resolution', value: '4K DCI HDR 10-bit Color' },
      { label: 'Audio', value: 'Sennheiser Wireless & Soundboard Feed' },
      { label: 'Drone', value: 'DJI Mavic 3 Cine with Licensed Pilot' },
    ],
    badge: '4K Cinema',
    leadTime: '2 - 3 Weeks',
    iconName: 'Film',
  },
  {
    id: 'makeup',
    name: 'Bridal & Event Makeup',
    category: 'hospitality',
    tagline: 'High-Definition Artistry & Styling',
    description:
      'Celebrity bridal makeup, traditional saree draping, hair sculpturing, groom grooming, and touch-up concierge services.',
    detailedDescription:
      'Look and feel your most radiant self. Our certified beauty artists use luxury international cosmetics (Dior, MAC, Charlotte Tilbury, NARS) tailored to your skin tone, ensuring long-lasting, camera-ready perfection under hot studio lights.',
    startingPrice: 'LKR 65,000',
    priceNote: 'Bridal styling includes hair, draping & premium trial session',
    imageUrl:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
    ],
    features: [
      'Full pre-event bridal trial and skin consultation',
      'HD Airbrush or traditional high-pigment foundation',
      'Intricate hair sculpturing with fresh floral accessories',
      'Professional Kandyan, Indian, or Western saree / gown draping',
      'Dedicated touch-up artist on standby through reception',
    ],
    specs: [
      { label: 'Cosmetics', value: '100% Authentic Luxury Brands' },
      { label: 'Longevity', value: '16+ Hour Sweat & Tear Proof' },
      { label: 'Service', value: 'On-location mobile dressing team' },
    ],
    leadTime: '4 Weeks',
    iconName: 'Smile',
  },
  {
    id: 'buffet',
    name: 'Gourmet Buffet & Catering',
    category: 'hospitality',
    tagline: 'Exquisite Culinary Journeys',
    description:
      'Multi-cuisine buffet setups, live action cooking stations, customized 5-course sit-down banquets, canapés, and mocktail bars.',
    detailedDescription:
      'Delight your guests with culinary mastery. From authentic Sri Lankan royal feasts and Indian banquets to contemporary Western fusion menus, our executive catering partners craft dishes with pristine presentation and hygienic standards.',
    startingPrice: 'LKR 2,800',
    priceNote: 'Starting per-head rate for curated 3-course buffet',
    imageUrl:
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80',
    ],
    features: [
      'Customized menu design accommodating dietary preferences',
      'Live cooking stations (Carvery, Pasta, Hoppers, BBQ grill)',
      'Elegant chafing dishes with heated brass & stainless steel presentation',
      'Artisan mocktail and signature welcome drink stations',
      'Uniformed white-glove steward service & clean-up team',
    ],
    specs: [
      { label: 'Minimum Guests', value: '50 Persons' },
      { label: 'Cuisine Types', value: 'Sri Lankan, Western, Moghlai, Pan-Asian' },
      { label: 'Hygiene', value: 'ISO 22000 Certified Partner Kitchens' },
    ],
    leadTime: '2 - 3 Weeks',
    iconName: 'Utensils',
  },
  {
    id: 'tables-and-chairs',
    name: 'Tables & Chairs Rental',
    category: 'rentals',
    tagline: 'Premium Event Furniture & Seating Solutions',
    description:
      'Crystal Chiavari chairs, Louis XV ghost chairs, rustic wooden crossback chairs, banquet round tables, cocktail high-tops, and lounge sofas.',
    detailedDescription:
      'High-quality event furniture sets the tone for guest comfort and visual sophistication. We maintain an extensive inventory of impeccably maintained seating, dining tables, bespoke bar counters, and velvet VIP lounge sets.',
    startingPrice: 'LKR 450',
    priceNote: 'Per Chiavari chair per day; bulk discount bundles available',
    imageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
    ],
    features: [
      'Crystal, Gold, Mahogany, and White Chiavari chairs with soft cushions',
      'French Bistro Crossback chairs for rustic & vineyard vibes',
      '10-seater round banquet tables with luxury jacquard linen',
      'Sleek LED acrylic cocktail high-tables',
      'Delivery, positioning, cleaning, and post-event removal included',
    ],
    specs: [
      { label: 'Stock Volume', value: 'Up to 3,000 chairs available' },
      { label: 'Condition', value: 'Inspected & polished before every dispatch' },
      { label: 'Linens', value: 'Spun polyester, satin & damask options' },
    ],
    leadTime: '3 Days Notice',
    iconName: 'Grid',
  },
  {
    id: 'event-equipment',
    name: 'Event Equipment & Tech',
    category: 'production',
    tagline: 'Concert-Grade Audio, Visual & Power Gear',
    description:
      'Line-array sound systems, moving-head beam lighting, P2.6/P3.9 indoor & outdoor LED video walls, silent diesel generators, and heavy-duty truss rigs.',
    detailedDescription:
      'Flawless technical execution powered by world-class gear. SWS supplies professional PA systems, digital mixing consoles (Yamaha/Behringer), beam/spot moving heads, cold-spark pyrotechnics, heavy low-fog dry ice machines, and stable power infrastructure.',
    startingPrice: 'LKR 110,000',
    priceNote: 'Includes sound engineer, lighting technician & setup crew',
    imageUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    ],
    features: [
      'JBL / RCF line-array speaker systems with high-output subwoofers',
      'Wireless Shure UHF microphones & in-ear monitoring',
      'High-brightness 4K P2.9 LED video screen wall arrays',
      'Intelligent DMX moving heads, laser beams & haze machines',
      'Cold-spark fountains and dry-ice cloud effects for first dances',
    ],
    specs: [
      { label: 'Audio Power', value: 'Up to 25,000W RMS sound output' },
      { label: 'LED Wall', value: 'Seamless indoor & outdoor IP65 panels' },
      { label: 'Redundancy', value: 'Dual backup generators & UPS units' },
    ],
    badge: 'Pro Audio & Visual',
    leadTime: '1 Week Notice',
    iconName: 'Volume2',
  },
  {
    id: 'complete-packages',
    name: 'Complete Packages',
    category: 'packages',
    tagline: 'End-to-End Turnkey Event Management',
    description:
      'All-inclusive packages combining decor, photography, cinematic film, sound, stage, catering, makeup, and on-site master coordinators.',
    detailedDescription:
      'Experience zero stress on your special day. Our Complete Packages unite all 5 Mahdev ecosystem strengths under a single master event producer. One contract, one point of contact, absolute creative harmony, and substantial cost savings.',
    startingPrice: 'LKR 650,000',
    priceNote: 'Full-service turnkey event covering decor, media & audio-visual',
    imageUrl:
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
    ],
    features: [
      'Complete floral decoration, stage backdrop & entrance styling',
      'Full media coverage: 2 Photographers + 2 Videographers + Drone',
      'Professional audio-visual system with DJ & lighting engineer',
      'Bridal dressing & makeup with master artist',
      'Master of Ceremonies (MC) & on-day floor coordination manager',
      'Full set of tables, luxury Chiavari chairs & linens',
    ],
    specs: [
      { label: 'Savings', value: 'Up to 25% bundle savings vs individual hiring' },
      { label: 'Coordination', value: 'Lead Producer on-site 12 hours' },
      { label: 'Revisions', value: 'Unlimited pre-event 3D styling revisions' },
    ],
    badge: 'Best Value Bundle',
    leadTime: '4 - 8 Weeks',
    iconName: 'Package',
  },
];

export const SWS_PACKAGES: SWSPackage[] = [
  {
    id: 'silver-elegance',
    name: 'Silver Elegance Package',
    tier: 'Essential Luxury',
    tagline: 'Refined curation for intimate weddings and celebrations',
    description:
      'Designed for gatherings up to 150 guests looking for exquisite design and reliable coverage without excessive complexity.',
    includedServices: [
      'Main Stage Backdrop & Floral Arch',
      'Head Table & Cake Table Floral Styling',
      'Entrance Welcome Signage with Fresh Florals',
      '1 Lead Photographer (8 Hours Coverage)',
      '1 Videographer (Cinematic Highlights 3-5 Mins)',
      'Standard PA Sound System with 2 Wireless Mics',
      'Warm Fairy-light Canopy & Ambient Uplights',
      '150 Chiavari Chairs with Cushions & Table Linens',
    ],
    price: 'LKR 480,000',
    priceSubtext: 'Inclusive of logistics in Greater Colombo & Western Province',
    images: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80',
    ],
    availability: 'Available Year-Round (15 Days Advance Booking)',
    idealFor: 'Intimate Weddings, Engagements, Milestone Birthdays',
    guestEstimate: '50 - 150 Guests',
  },
  {
    id: 'gold-prestige',
    name: 'Gold Prestige Package',
    tier: 'Signature Grandeur',
    tagline: 'Our flagship all-inclusive wedding and gala production suite',
    description:
      'The most sought-after package by modern couples and corporate hosts. Features lavish floral volume, full cinema coverage, and dynamic lighting.',
    includedServices: [
      'Grand 30ft Customized Floral Stage / Mandap Architecture',
      'Walkway Pillar Florals & Mirror Carpet Aisle',
      'Luxury Bridal Table Styling with Crystal Centerpieces',
      '2 Senior Photographers (Full Day Unlimited High-Res)',
      '2 Cinema Videographers with 4K Aerial Drone Coverage',
      'Professional Line-Array Sound System + DJ Console',
      'Full Intelligent Moving-Head Lighting Rig & Wash',
      'Dry-Ice Cloud Effect & 4x Cold-Spark Pyrotechnics for First Dance',
      'Bridal Makeup & Hair Styling with Pre-Event Trial',
      'Up to 300 Crystal/Gold Chiavari Chairs & Damask Linens',
      'Dedicated Senior Event Coordinator on-site 12 Hours',
    ],
    price: 'LKR 980,000',
    priceSubtext: 'Save 22% compared to separate individual service bookings',
    images: [
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
    ],
    availability: 'Limited Weekend Availability (30 Days Advance)',
    popular: true,
    badge: 'Most Popular Choice',
    idealFor: 'Grand Weddings, High-Profile Receptions, Corporate Galas',
    guestEstimate: '200 - 400 Guests',
  },
  {
    id: 'royal-diamond',
    name: 'Royal Diamond Bespoke',
    tier: 'Ultra Luxury Couture',
    tagline: 'Uncompromised opulence, celebrity styling, and full spatial mastery',
    description:
      'An uninhibited showcase of luxury. Custom 3D environmental architecture, international imported blooms, 4K multi-cam live broadcast, and concierge hospitality.',
    includedServices: [
      '100% Bespoke Stage & Ceiling Floral Hanging Installations (5,000+ Blooms)',
      'Total Hall Fabric Draping & Fairy Light Tunnel (Up to 10,000 sq ft)',
      'P2.9 Ultra-HD LED Video Wall (20x10ft) with Custom Motion Graphics',
      '3 Master Photographers + 3 Cinema Videographers + FPV Drone Pilot',
      'Full Multi-Track Live Streaming to YouTube/Private Portal in 4K',
      'Complete Concert-Grade Acoustics & Intelligent Laser Lighting Show',
      'Bridal + 4 Bridesmaids Makeup & Styling Suite',
      'Live Saxophonist & Acoustic Lounge Trio for Cocktail Hour',
      'Cold-Spark Fountains (8x), Low-Fog Cloud & Confetti Blaster',
      'Unlimited Luxury Seating, Mirrored Banquet Tables & Bar Lounges',
      'Lead Master Producer + 3 Floor Directors with Walkie Coordination',
    ],
    price: 'LKR 1,850,000',
    priceSubtext: 'Fully bespoke customization; prices tailored to architectural scale',
    images: [
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    ],
    availability: 'Exclusive (Max 2 Bookings Per Month)',
    badge: 'VIP Royalty',
    idealFor: 'Celebrity Weddings, High-Net-Worth Galas, International Summits',
    guestEstimate: '350 - 1,000+ Guests',
  },
  {
    id: 'corporate-summit-suite',
    name: 'Corporate Summit & Expo Suite',
    tier: 'Executive Enterprise',
    tagline: 'High-precision production for conferences, launches & award nights',
    description:
      'Engineered specifically for enterprise clarity. Ultra-crisp audio reinforcement, dual LED presentation screens, branding totems, and swift turnarounds.',
    includedServices: [
      'Keynote Stage Backdrop with Pantone-Matched Branding & Wooden Truss',
      'Dual P3.9 LED Presentation Displays (16x9 ratio)',
      'Digital Teleprompters & Microflex Executive Podium Microphones',
      'Simultaneous Interpretation Booth & Headset Integration Ready',
      'Multi-Cam Recording & 1080p Webcast Uplink',
      'Executive Lounge Furnishings & Media Step-and-Repeat Wall',
      'VIP Registration Counters & QR Scanner Totems',
      'Technical Director, AV Technicians & On-Site IT Support by Mahdev IT',
    ],
    price: 'LKR 750,000',
    priceSubtext: 'Corporate tax invoice, SLA agreement & dedicated corporate lead',
    images: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
    ],
    availability: 'Available Weekdays & Weekends (14 Days Notice)',
    badge: 'Corporate Ready',
    idealFor: 'Annual Conferences, Tech Summits, Product Unveilings, Award Nights',
    guestEstimate: '100 - 800 Attendees',
  },
];

export const SWS_GALLERY_ITEMS: SWSGalleryItem[] = [
  {
    id: 'gal-1',
    title: 'Cinnamon Grand Royal Mandap',
    category: 'Weddings',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    location: 'Cinnamon Grand, Colombo',
    year: '2025',
    description: 'A botanical fairytale with 3,000 fresh white hydrangeas, roses, and gold crystal chandelier accents.',
    tags: ['Royal Mandap', 'Fresh Florals', 'Luxury Wedding'],
  },
  {
    id: 'gal-2',
    title: 'Dialog Axiata National Tech Summit',
    category: 'Corporate',
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    location: 'BMICH Main Arena, Colombo',
    year: '2024',
    description: 'Curved 4K LED screen backdrop with synchronized intelligent blue lighting and live audio broadcast.',
    tags: ['Keynote Stage', 'LED Video Wall', 'Corporate'],
  },
  {
    id: 'gal-3',
    title: 'Golden Jubilee Luxury Birthday',
    category: 'Birthdays & Socials',
    imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80',
    location: 'Shangri-La Ballroom, Colombo',
    year: '2025',
    description: 'Gold chrome organic balloon installation, customized acrylic typography, and neon celebration plinths.',
    tags: ['Organic Balloons', 'Milestone 50th', 'Neon Glow'],
  },
  {
    id: 'gal-4',
    title: 'Grand Concert Audio-Visual Rig',
    category: 'Stage & Lighting',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    location: 'Viharamahadevi Amphitheatre',
    year: '2024',
    description: '20-head moving light array with synchronized laser effects, line-array acoustics, and heavy fog.',
    tags: ['Concert AV', 'Intelligent DMX', 'Heavy Bass'],
  },
  {
    id: 'gal-5',
    title: 'Vintage Botanical Engagement Soiree',
    category: 'Weddings',
    imageUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80',
    location: 'Mount Lavinia Heritage Hotel',
    year: '2025',
    description: 'Pastel peach and eucalyptus circular backdrop overlooking the Indian Ocean at twilight.',
    tags: ['Engagement', 'Beachfront', 'Circular Arch'],
  },
  {
    id: 'gal-6',
    title: 'Gourmet Royal Banquet Table Styling',
    category: 'Dining & Decor',
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
    location: 'Galle Face Hotel, Colombo',
    year: '2024',
    description: 'Crystal stemware, custom velvet runners, tapered candelabras, and handwritten gold calligraphy place cards.',
    tags: ['Banquet Table', 'Fine Dining', 'Luxury Linen'],
  },
  {
    id: 'gal-7',
    title: 'Commercial Brand Launch Stage',
    category: 'Corporate',
    imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
    location: 'Hilton Colombo Main Hall',
    year: '2024',
    description: 'Clean minimalist matte black stage with high-contrast neon brand typography and reveal pyrotechnics.',
    tags: ['Brand Launch', 'Product Reveal', 'Executive'],
  },
  {
    id: 'gal-8',
    title: 'Fairy Light Garden Marquee Canopy',
    category: 'Dining & Decor',
    imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
    location: 'Water’s Edge Lawn, Battaramulla',
    year: '2025',
    description: 'Over 5,000 warm white micro-LED strings cascading from a 20ft central marquee crown.',
    tags: ['Garden Marquee', 'Fairy Lights', 'Outdoor Elegance'],
  },
  {
    id: 'gal-9',
    title: 'Sweet Sixteen Pastel Carnival',
    category: 'Birthdays & Socials',
    imageUrl: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80',
    location: 'Private Villa, Bentota',
    year: '2025',
    description: 'Pastel pink, lavender, and mint organic balloon wall with carousel dessert staging and photo booth.',
    tags: ['Sweet 16', 'Dessert Table', 'Pastel Party'],
  },
];

export const SWS_PORTFOLIO_ITEMS: SWSPortfolioItem[] = [
  {
    id: 'port-1',
    title: 'The Royal Cinnamon Wedding of Shanuka & Dilini',
    client: 'Shanuka & Dilini Wijesekera',
    eventType: 'Luxury 3-Day Wedding Celebration',
    date: 'December 2024',
    location: 'Cinnamon Grand & Cinnamon Lakeside, Colombo',
    guestCount: '450 Guests',
    summary:
      'A multi-day royal wedding featuring custom mandap architecture, 8,000 fresh blooms, 4K multi-cam broadcast, and gourmet live stations.',
    detailedCase:
      'SWS orchestrated complete end-to-end production across the Poruwa ceremony, Christian blessing, and high-energy grand reception. Highlights included a suspended 40ft floral chandelier, automated dry-ice cloud for the first dance, and a 12-piece live orchestra sound engineering setup.',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
    ],
    highlights: [
      'Custom 32ft Poruwa with hand-carved floral lattice and water fountain base',
      'Full 4K HDR cinematography delivered in partnership with U1 Studio',
      'Seamless coordination of 35 hospitality stewards and 12 technical crew',
      'Zero-delay acoustic coverage for 450 guests across both ballrooms',
    ],
    servicesDelivered: [
      'Wedding Decorations',
      'Stage Decorations',
      'Photography & Videography',
      'Bridal Makeup',
      'Tables & Chairs',
      'Event Equipment',
    ],
    testimonial: {
      quote:
        'SWS and the Mahdev team made our wedding look like something out of a royal magazine. Every guest was stunned by the floral ceiling and the seamless flow of the entire evening!',
      author: 'Dilini Wijesekera',
      designation: 'Bride & Architectural Consultant',
    },
  },
  {
    id: 'port-2',
    title: 'Hemas Holdings 75th Anniversary Gala',
    client: 'Hemas Holdings PLC',
    eventType: 'Corporate Jubilee & Awards Ceremony',
    date: 'October 2024',
    location: 'Shangri-La Ballroom, Colombo',
    guestCount: '600 Executives & International Dignitaries',
    summary:
      'A high-profile corporate gala featuring curved P2.6 LED video arrays, bespoke executive awards stage, and VIP hospitality protocol.',
    detailedCase:
      'We designed an immersive corporate gala honoring 75 years of heritage. The stage featured a 40x12ft LED screen displaying bespoke historical documentaries produced by U1 Studio, paired with high-impact DMX lighting cues synced to live keynote speeches.',
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
    ],
    highlights: [
      'P2.6 LED curve wall with custom motion countdown and heritage timeline graphics',
      'Simultaneous live-feed relay to 4 satellite hospitality lounges',
      'Flawless acoustic tuning for 600 attendees and international CEO addresses',
      'Strict corporate brand guideline adherence across all physical fabrications',
    ],
    servicesDelivered: [
      'Corporate Events',
      'Stage Decorations',
      'Event Equipment & LED Wall',
      'Live Broadcasting',
    ],
    testimonial: {
      quote:
        'The technical execution and production quality provided by SWS was world-class. Our board and international partners were thoroughly impressed.',
      author: 'Kavinda Perera',
      designation: 'Head of Corporate Communications, Hemas',
    },
  },
  {
    id: 'port-3',
    title: 'Sunset Garden Gala at Water’s Edge',
    client: 'Dr. Senaka & Mrs. Ruwani Bandara',
    eventType: 'Silver Wedding Anniversary & Garden Soiree',
    date: 'January 2025',
    location: 'Water’s Edge Grand Lawn, Battaramulla',
    guestCount: '250 Guests',
    summary:
      'Outdoor botanical marquee celebration with 5,000 fairy lights, live gourmet barbecue stations, and acoustic band staging.',
    detailedCase:
      'Transforming an open lawn into a magical twilight paradise. We erected an open-span transparent marquee with custom wood flooring, hanging glass orbs with tea-lights, acoustic sound treatment, and artisanal cocktail stations.',
    imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80',
    ],
    highlights: [
      'Waterproof transparent marquee canopy with 360-degree lake views',
      'Live BBQ carving stations with custom copper buffet display fixtures',
      'Warm atmospheric string lighting and lantern-lit botanical pathway',
      'Complete emergency weather-backup infrastructure on standby',
    ],
    servicesDelivered: [
      'Venue Decorations',
      'Buffet & Catering Management',
      'Tables & Chairs Rental',
      'Event Equipment',
    ],
    testimonial: {
      quote:
        'A night we and our friends will never forget. SWS took all the stress off our shoulders and created pure magic under the stars.',
      author: 'Dr. Senaka Bandara',
      designation: 'Client',
    },
  },
];
