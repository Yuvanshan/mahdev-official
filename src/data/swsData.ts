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

export type RentalCategory =
  | 'seating'
  | 'tables-linens'
  | 'stage-truss'
  | 'audio-sound'
  | 'lighting-fx'
  | 'led-displays'
  | 'tents-canopies'
  | 'catering-ware'
  | 'power-climate';

export interface SWSRentalItem {
  id: string;
  name: string;
  category: RentalCategory;
  categoryLabel: string;
  tagline: string;
  description: string;
  dailyRate: string;
  unit: string;
  minOrderQuantity: number;
  availableStock: number;
  imageUrl: string;
  specs: { label: string; value: string }[];
  features: string[];
  popular?: boolean;
  badge?: string;
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
  category: 'Weddings' | 'Conferences' | 'Corporate' | 'Birthdays & Socials' | 'Stage & Lighting' | 'Dining & Decor';
  imageUrl: string;
  images?: string[];
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
    name: 'Executive & Business Events',
    category: 'production',
    tagline: 'Executive Summits, Product Launches & Galas',
    description:
      'Branded stage builds, high-lumen digital backdrops, modular exhibition booths, VIP hospitality lounges, and registration desks.',
    detailedDescription:
      'We deliver precision-engineered event environments that uphold your brand identity. From annual general meetings and high-profile product unveilings to award banquets, SWS handles spatial planning, branded physical structures, and smooth logistical execution.',
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
      'Cinematic 4K/60p wedding films, executive recap highlights, multi-camera live switching, and licensed aerial drone sweeping perspectives.',
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
    name: 'Luxury Chairs & Tables Rental',
    category: 'rentals',
    tagline: 'Crystal Chiavari, Ghost, Crossback & Banquet Tables',
    description:
      'Extensive stock of Crystal Chiavari chairs, Louis XV ghost chairs, French crossback vineyard chairs, round banquet tables, cocktail high-tops, and VIP lounge seating.',
    detailedDescription:
      'High-quality event furniture sets the tone for guest comfort and visual sophistication. We maintain an inventory of over 3,500 impeccably maintained chairs, 10-seater round dining tables with luxury jacquard linen, bespoke bar counters, and velvet VIP lounge sets with white-glove setup and delivery across Sri Lanka.',
    startingPrice: 'LKR 450 / item',
    priceNote: 'Per chair per day; bulk packages with linens and tables available',
    imageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
    ],
    features: [
      'Crystal, Gold, Mahogany, White, and Silver Chiavari chairs with plush cushions',
      'French Bistro Crossback vineyard chairs for rustic & garden celebrations',
      '10-seater round banquet tables with premium damask/jacquard linens',
      'Sleek LED illuminated cocktail high-tables and barstools',
      'Delivery, placement, alignment, and post-event removal included',
    ],
    specs: [
      { label: 'Stock Volume', value: 'Over 3,500 chairs in active inventory' },
      { label: 'Condition', value: 'Inspected, cleaned & polished before dispatch' },
      { label: 'Linens', value: 'Spun polyester, satin & damask options' },
    ],
    badge: 'High-Demand Rental',
    leadTime: '3 Days Notice',
    iconName: 'Grid',
  },
  {
    id: 'audio-lighting-rental',
    name: 'Sound Systems & Stage Lighting Rental',
    category: 'rentals',
    tagline: 'JBL Line-Arrays, DMX Moving Heads & Special FX Rigs',
    description:
      'Dry-hire and managed rental of professional JBL/RCF line-arrays, Behringer X32/Yamaha mixers, Shure wireless mics, intelligent beam moving heads, and cold-spark fireworks.',
    detailedDescription:
      'Concert-calibrated sound reinforcement and visual impact for weddings, conferences, and live bands. Complete with experienced sound engineers, lighting designers, power distribution, and backup generators.',
    startingPrice: 'LKR 85,000 / day',
    priceNote: 'Flexible configurations from compact acoustic setups to festival line-arrays',
    imageUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    ],
    features: [
      'JBL VRX / RCF line-array speaker modules & dual 18" subwoofers',
      'Shure UHF wireless microphones with feedback suppression',
      '350W DMX moving-head beam/spot lights and ambient LED uplighters',
      'Cold-spark safe pyrotechnics & low-fog dry ice clouds for first dances',
      'Experienced on-site sound and lighting engineers for the full duration',
    ],
    specs: [
      { label: 'Audio Power', value: 'Up to 25,000W RMS concert output' },
      { label: 'DMX Control', value: 'GrandMA / Titan computerized consoles' },
      { label: 'Safety', value: 'Indoor fire-safe cold spark technology' },
    ],
    badge: 'Pro AV & FX',
    leadTime: '5 Days Notice',
    iconName: 'Volume2',
  },
  {
    id: 'led-wall-display-rental',
    name: 'Ultra-HD LED Video Wall & Displays Rental',
    category: 'rentals',
    tagline: 'P2.6 / P3.9 Seamless Indoor & Outdoor LED Matrices',
    description:
      'High-brightness modular LED screen walls for stage backdrops, keynote presentations, live video relays, and cinema wedding visual showcases.',
    detailedDescription:
      'Crystal-clear visual impact under any ambient light. We provide customized curveable LED panels with NovaStar 4K processors, live video switchers, and dedicated broadcast technicians.',
    startingPrice: 'LKR 95,000 / day',
    priceNote: 'Priced per square meter or standardized stage backdrop packages',
    imageUrl:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
    ],
    features: [
      'P2.6 ultra-fine pitch indoor panels with 3,840Hz refresh rate',
      'P3.9 IP65 waterproof high-brightness panels for outdoor daytime events',
      'NovaStar 4K processing with seamless video switching',
      'Truss mounting or ground-stack rigging with safety counterweights',
    ],
    specs: [
      { label: 'Resolution', value: 'Up to 4K / 8K resolution arrays' },
      { label: 'Brightness', value: 'Up to 5,500 nits daylight readable' },
      { label: 'Mounting', value: 'Fly-in truss or heavy base ground-stack' },
    ],
    badge: '4K Display Tech',
    leadTime: '1 Week Notice',
    iconName: 'Tv',
  },
  {
    id: 'truss-stage-rental',
    name: 'Stage Platforms & Truss Structures Rental',
    category: 'rentals',
    tagline: 'Heavy-Duty Aluminium Truss, Mandap Frames & Podiums',
    description:
      'Modular stage decks, heavy-duty aluminium box truss grids, Poruwa structural mandap frames, catwalks, and mirror runway platforms.',
    detailedDescription:
      'Engineered for structural safety and aesthetics. SWS rents modular stage platforms adjustable from 1ft to 5ft heights, finished with high-gloss acrylic, plush carpeting, or mirrored glass, backed by heavy aluminium box trussing for lighting and audio rigging.',
    startingPrice: 'LKR 65,000 / day',
    priceNote: 'Custom dimensions engineered to venue blueprint',
    imageUrl:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    ],
    features: [
      'Heavy-duty aluminium 300x300mm & 400x400mm global box truss',
      'Modular 8x4ft stage decks with high load-bearing ratings (750 kg/m²)',
      'High-gloss white acrylic, black carpet, or mirror floor finishes',
      'Safety handrails, wheelchair ramps, and stage skirting included',
    ],
    specs: [
      { label: 'Truss Rating', value: 'TUV Certified structural aluminium' },
      { label: 'Stage Sizes', value: 'From 12x8ft up to 80x40ft concert stages' },
      { label: 'Safety', value: 'Engineered wind-load and weight calculations' },
    ],
    badge: 'Structural Rigging',
    leadTime: '1 Week Notice',
    iconName: 'Layers',
  },
  {
    id: 'tents-generators-rental',
    name: 'Marquees, Canopies & Silent Generator Rentals',
    category: 'rentals',
    tagline: 'Waterproof Marquee Tents, Pagodas & 45kVA-250kVA Power Units',
    description:
      'Weatherproof luxury marquee tents, European pagoda canopies, silent mobile diesel generators, industrial mist cooling fans, and distribution panels.',
    detailedDescription:
      'Ensure uninterrupted celebrations in any weather. SWS provides heavy-gauge aluminium clear-span marquees with transparent window panels, silent soundproof generator trucks, and portable climate solutions for outdoor wedding lawns and remote destinations.',
    startingPrice: 'LKR 75,000 / day',
    priceNote: 'Includes transport, fuel capacity, and certified electrician operator',
    imageUrl:
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
    ],
    features: [
      'Clear-span waterproof marquee tents with clear roof or white lining',
      'European 10x10ft & 20x20ft pagoda canopies with sidewalls',
      'Silent soundproof diesel generators (45kVA to 250kVA rating)',
      'Industrial heavy-duty mist fans and mobile AC cooling units',
    ],
    specs: [
      { label: 'Generator Noise', value: '< 65dB ultra-silent casing' },
      { label: 'Tent Durability', value: 'Wind-resistant 850gsm PVC fabric' },
      { label: 'Power Backup', value: 'Automatic Transfer Switch (ATS) enabled' },
    ],
    badge: 'Climate & Power',
    leadTime: '4 Days Notice',
    iconName: 'ShieldCheck',
  },
  {
    id: 'catering-chafing-rental',
    name: 'Royal Chafing Dishes & Banquet Ware Rentals',
    category: 'rentals',
    tagline: 'Brass & Gold Chafing Sets, Crystal Stemware & Dinner Sets',
    description:
      'Luxury heated roll-top chafing dishes, fine porcelain dinnerware sets, gold cutlery, crystal wine goblets, champagne towers, and drink dispensers.',
    detailedDescription:
      'Equip your banquet with regal table appointments. We supply polished brass and stainless steel chafing dishes with induction/fuel burners, elegant charger plates, silverware, and multi-tier champagne towers for high-end celebrations.',
    startingPrice: 'LKR 3,500 / unit',
    priceNote: 'Discounts apply for full 100+ guest banquet packages',
    imageUrl:
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80',
    ],
    features: [
      'Gold, Rose-Gold & Mirror-Polished Stainless Steel Chafing Dishes',
      'Roll-top glass viewing lids with food-grade stainless steel pans',
      'Fine bone china dinner and dessert plates',
      'Lead-free crystal wine glasses, champagne flutes & water goblets',
    ],
    specs: [
      { label: 'Sanitization', value: 'Commercial high-temp sterilized' },
      { label: 'Materials', value: '18/10 surgical grade stainless steel' },
    ],
    badge: 'Banquet Luxury',
    leadTime: '3 Days Notice',
    iconName: 'Utensils',
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
    name: 'Complete Turnkey Packages',
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
      'The most sought-after package by modern couples and event hosts. Features lavish floral volume, full cinema coverage, and dynamic lighting.',
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
    idealFor: 'Grand Weddings, High-Profile Receptions, Executive Galas',
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
    name: 'Executive Summit & Expo Suite',
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
    priceSubtext: 'Tax invoice, SLA agreement & dedicated production lead',
    images: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
    ],
    availability: 'Available Weekdays & Weekends (14 Days Notice)',
    badge: 'Enterprise Ready',
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
    category: 'Conferences',
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    location: 'BMICH Main Arena, Colombo',
    year: '2024',
    description: 'Curved 4K LED screen backdrop with synchronized intelligent blue lighting and live audio broadcast.',
    tags: ['Keynote Stage', 'LED Video Wall', 'Summit'],
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
    category: 'Conferences',
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
    eventType: 'Enterprise Jubilee & Awards Ceremony',
    date: 'October 2024',
    location: 'Shangri-La Ballroom, Colombo',
    guestCount: '600 Executives & International Dignitaries',
    summary:
      'A high-profile enterprise gala featuring curved P2.6 LED video arrays, bespoke executive awards stage, and VIP hospitality protocol.',
    detailedCase:
      'We designed an immersive enterprise gala honoring 75 years of heritage. The stage featured a 40x12ft LED screen displaying bespoke historical documentaries produced by U1 Studio, paired with high-impact DMX lighting cues synced to live keynote speeches.',
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
    ],
    highlights: [
      'P2.6 LED curve wall with custom motion countdown and heritage timeline graphics',
      'Simultaneous live-feed relay to 4 satellite hospitality lounges',
      'Flawless acoustic tuning for 600 attendees and international CEO addresses',
      'Strict brand guideline adherence across all physical fabrications',
    ],
    servicesDelivered: [
      'Executive Events',
      'Stage Decorations',
      'Event Equipment & LED Wall',
      'Live Broadcasting',
    ],
    testimonial: {
      quote:
        'The technical execution and production quality provided by SWS was world-class. Our board and international partners were thoroughly impressed.',
      author: 'Kavinda Perera',
      designation: 'Head of Brand Communications, Hemas',
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

export const SWS_RENTAL_CATEGORIES = [
  { id: 'all', label: 'All Equipment & Rentals', icon: 'Layers' },
  { id: 'seating', label: 'Chairs & VIP Sofas', icon: 'Armchair' },
  { id: 'tables-linens', label: 'Tables & Fine Linens', icon: 'Grid' },
  { id: 'stage-truss', label: 'Staging, Truss & Mandaps', icon: 'Box' },
  { id: 'audio-sound', label: 'Concert Audio & Sound', icon: 'Volume2' },
  { id: 'lighting-fx', label: 'DMX Lighting & Special FX', icon: 'Sparkles' },
  { id: 'led-displays', label: '4K LED Video Walls', icon: 'Tv' },
  { id: 'tents-canopies', label: 'Marquees & Canopies', icon: 'Tent' },
  { id: 'power-climate', label: 'Generators & Cooling', icon: 'ShieldCheck' },
  { id: 'catering-ware', label: 'Chafing & Banquet Ware', icon: 'Utensils' },
];

export const SWS_RENTAL_INVENTORY: SWSRentalItem[] = [
  // SEATING
  {
    id: 'rent-chiavari-crystal',
    name: 'Crystal Clear Chiavari Chairs',
    category: 'seating',
    categoryLabel: 'Chairs & VIP Sofas',
    tagline: 'High-clarity luxury resin chairs with plush white/ivory velvet cushion',
    description:
      'The gold standard for modern luxury weddings. Ultra-clear optical resin with UV stabilization and high load capacity, complete with sanitized cushions.',
    dailyRate: 'LKR 550',
    unit: 'per chair / day',
    minOrderQuantity: 50,
    availableStock: 1200,
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Material', value: 'Polycarbonate Optical Crystal Resin' },
      { label: 'Weight Capacity', value: '250 kg per chair' },
      { label: 'Cushion', value: 'High-density foam with velvet/satin cover' },
    ],
    features: ['Crystal clear gloss finish', 'Non-marking floor glides', 'Delivered wiped and wrapped', 'Indoor and outdoor safe'],
    popular: true,
    badge: 'Most Popular',
  },
  {
    id: 'rent-chiavari-gold',
    name: 'Royal Gold Chiavari Chairs',
    category: 'seating',
    categoryLabel: 'Chairs & VIP Sofas',
    tagline: 'Metallic gold hardwood Chiavari chairs with gold/white cushion',
    description:
      'Classic regal ambiance. Hand-lacquered metallic champagne gold with matching cushioned seating for grand ballroom receptions.',
    dailyRate: 'LKR 480',
    unit: 'per chair / day',
    minOrderQuantity: 50,
    availableStock: 1500,
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Material', value: 'Solid Hardwood Beech with Metallic Gold Lacquer' },
      { label: 'Weight Capacity', value: '200 kg' },
      { label: 'Cushion', value: 'Gold brocade or ivory velvet' },
    ],
    features: ['High-luster royal gold tone', 'Stackable design for rapid floor setup', 'Inspected before dispatch'],
    popular: true,
  },
  {
    id: 'rent-crossback-wood',
    name: 'French Rustic Crossback Vineyard Chairs',
    category: 'seating',
    categoryLabel: 'Chairs & VIP Sofas',
    tagline: 'Natural aged wood chairs with woven rattan seats for rustic & garden events',
    description:
      'Authentic European vineyard charm. Crafted from solid ash wood with natural curved backrests and woven rattan cushions.',
    dailyRate: 'LKR 650',
    unit: 'per chair / day',
    minOrderQuantity: 30,
    availableStock: 800,
    imageUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Material', value: 'Solid Aged Ash Wood with Rattan Inlay' },
      { label: 'Finish', value: 'Natural Antique Oak / Weathered Driftwood' },
      { label: 'Style', value: 'French Provincial / Rustic Farmhouse' },
    ],
    features: ['Curved ergonomic back support', 'Perfect for lawn and garden setups', 'Natural matte organic feel'],
    badge: 'Rustic Trend',
  },
  {
    id: 'rent-vip-sofa-chesterfield',
    name: 'Royal VIP Velvet Chesterfield Lounge Suite',
    category: 'seating',
    categoryLabel: 'Chairs & VIP Sofas',
    tagline: 'Deep-buttoned tufted velvet 3-seater sofa + 2 armchairs + gold coffee table',
    description:
      'The ultimate seating for VIP guests, bridal couples, and dignitaries. Deep button tufting with high-resilience foam and brushed gold metal plinths.',
    dailyRate: 'LKR 35,000',
    unit: 'per 4-piece set / day',
    minOrderQuantity: 1,
    availableStock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Pieces Included', value: '1x 3-Seater Sofa, 2x Armchairs, 1x Gold Marble Table' },
      { label: 'Fabric', value: 'Stain-resistant Royal Emerald / Midnight Blue / Ivory Velvet' },
      { label: 'Frame', value: 'Solid Kiln-Dried Hardwood' },
    ],
    features: ['Hand-tufted deep button styling', 'Polished brass/gold accents', 'White-glove placement'],
    popular: true,
    badge: 'VIP Lounge',
  },

  // TABLES & LINENS
  {
    id: 'rent-table-round-10pax',
    name: '6ft Round Banquet Tables (10-Seater)',
    category: 'tables-linens',
    categoryLabel: 'Tables & Fine Linens',
    tagline: 'Heavy-duty commercial folding round tables with floor-length jacquard cloths',
    description:
      'Standard 72-inch round banquet tables built from 18mm marine plywood with rubber edge molding and heavy-gauge folding steel legs.',
    dailyRate: 'LKR 2,200',
    unit: 'per table + linen / day',
    minOrderQuantity: 10,
    availableStock: 180,
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Diameter', value: '72 inches (183 cm) — 10 to 12 persons' },
      { label: 'Top Material', value: '18mm Marine Plywood with protective edge' },
      { label: 'Legs', value: 'Locking heavy tubular steel' },
    ],
    features: ['Includes ironed floor-length linen cloth', 'Available in White, Cream, Black, or Navy', 'Stable anti-wobble design'],
  },
  {
    id: 'rent-table-mirror-head',
    name: 'Mirrored Glass Luxury Head Table (Bridal)',
    category: 'tables-linens',
    categoryLabel: 'Tables & Fine Linens',
    tagline: 'Beveled mirror glass top with polished gold/silver steel base',
    description:
      'A breathtaking statement piece for the bride and groom or executive dais. High-reflection beveled glass reflects floral arrangements and candlelight.',
    dailyRate: 'LKR 28,000',
    unit: 'per 8ft unit / day',
    minOrderQuantity: 1,
    availableStock: 12,
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Dimensions', value: '8ft L x 3.5ft W x 30in H (Seats 6-8)' },
      { label: 'Top', value: '10mm Toughened Safety Beveled Mirror Glass' },
      { label: 'Frame', value: 'Electroplated Stainless Steel Gold' },
    ],
    features: ['Ultra-reflective glamour look', 'Integrated hidden cable channels for florals/candles', 'Polished scratch-free glass'],
    badge: 'Bridal Highlight',
  },
  {
    id: 'rent-table-cocktail-led',
    name: 'Illuminated LED Cocktail High-Tables',
    category: 'tables-linens',
    categoryLabel: 'Tables & Fine Linens',
    tagline: 'Wireless battery-powered RGB glowing bar tables with spandex covers',
    description:
      'Creates a chic lounge atmosphere for pre-dinner cocktails and evening after-parties. 16 selectable colors and smooth fades via wireless remote.',
    dailyRate: 'LKR 3,800',
    unit: 'per unit / day',
    minOrderQuantity: 6,
    availableStock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Height', value: '43 inches (110 cm) bar height' },
      { label: 'Battery Life', value: '10 - 12 hours continuous RGB illumination' },
      { label: 'Control', value: 'Infrared wireless remote color changer' },
    ],
    features: ['IP65 waterproof for lawn/poolside use', 'No unsightly power cords', 'Includes stretch lycra cover'],
  },

  // STAGE, MANDAP & TRUSS
  {
    id: 'rent-truss-box-global',
    name: 'Global Aluminium Box Truss System (300x300mm)',
    category: 'stage-truss',
    categoryLabel: 'Staging, Truss & Mandaps',
    tagline: 'TUV-certified structural box truss for lighting, LED screens & goalposts',
    description:
      'High-tensile conical aluminium trussing for stage arches, flying audio rigs, lighting boxes, and entrance gateway frames.',
    dailyRate: 'LKR 45,000',
    unit: 'per 20x20ft goalpost grid / day',
    minOrderQuantity: 1,
    availableStock: 200,
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Alloy', value: 'EN-AW 6082 T6 Structural Aluminium' },
      { label: 'Main Tube', value: '50mm x 2mm wall thickness' },
      { label: 'Certification', value: 'TUV Rheinland Structural Safety' },
    ],
    features: ['Conical quick-lock spigots', 'Heavy steel base plates & safety outriggers', 'Includes rigging hardware & safety cables'],
    badge: 'TUV Certified',
  },
  {
    id: 'rent-stage-modular-deck',
    name: 'Modular High-Load Stage Platforms with Skirting',
    category: 'stage-truss',
    categoryLabel: 'Staging, Truss & Mandaps',
    tagline: '8x4ft modular staging decks adjustable from 1ft to 4ft with black/mirror finish',
    description:
      'Heavy-duty non-slip aluminum stage risers with telescopic legs, safety guardrails, steps, and full flame-retardant velvet skirting.',
    dailyRate: 'LKR 3,500',
    unit: 'per 8x4ft deck panel / day',
    minOrderQuantity: 4,
    availableStock: 120,
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Deck Size', value: '8ft x 4ft (2.44m x 1.22m)' },
      { label: 'Load Capacity', value: '750 kg/m² uniform distributed load' },
      { label: 'Surface', value: 'Waterproof anti-slip plywood or high-gloss white/mirror' },
    ],
    features: ['Telescopic height adjust (1.5ft, 2ft, 3ft, 4ft)', 'Interlocking side clamps for zero wobble', 'Includes stage steps with safety grip'],
  },
  {
    id: 'rent-mandap-poruwa-frame',
    name: 'Traditional & Modern Mandap / Poruwa Structural Frames',
    category: 'stage-truss',
    categoryLabel: 'Staging, Truss & Mandaps',
    tagline: 'Self-supporting 4-pillar & 6-pillar steel/brass framework for floral styling',
    description:
      'Heavy structural frames engineered specifically to support heavy floral garlands, brass lamps, hanging crystal chandeliers, and fabric drapes.',
    dailyRate: 'LKR 35,000',
    unit: 'per structure / day',
    minOrderQuantity: 1,
    availableStock: 18,
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Footprint', value: '12x12ft up to 16x16ft canopy frame' },
      { label: 'Weight Bearing', value: 'Up to 600kg floral/chandelier overhead load' },
      { label: 'Base', value: 'Heavy weighted steel foundation plates' },
    ],
    features: ['Fast 2-hour assembly by skilled crew', 'Pre-fitted attachment points for floral foam', 'Available in Gold, Brass, and White'],
    popular: true,
  },

  // AUDIO & SOUND
  {
    id: 'rent-pa-jbl-linearray',
    name: 'JBL VRX / RCF Concert Line-Array Sound System (20,000W)',
    category: 'audio-sound',
    categoryLabel: 'Concert Audio & Sound',
    tagline: 'Complete active line-array tops + dual 18" subwoofers + live engineer',
    description:
      'Crystal-clear speech intelligibility and deep chest-thumping musical dynamics for weddings, live bands, and executive keynotes up to 1,500 guests.',
    dailyRate: 'LKR 95,000',
    unit: 'per day (with crew)',
    minOrderQuantity: 1,
    availableStock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Total Output', value: '20,000 Watts RMS Concert Clarity' },
      { label: 'Components', value: '6x VRX932LAP Line Tops, 4x Dual 18" Subs, 4x Stage Monitors' },
      { label: 'Sound Pressure', value: '136 dB peak SPL with zero distortion' },
    ],
    features: ['Includes Behringer X32 / Yamaha QL5 digital console', 'Dedicated front-of-house sound engineer included', 'Dual redundant power line conditioners'],
    badge: 'Concert Grade',
    popular: true,
  },
  {
    id: 'rent-mic-shure-wireless',
    name: 'Shure QLXD / Axient Digital Wireless Mic Kit (4 Handhelds)',
    category: 'audio-sound',
    categoryLabel: 'Concert Audio & Sound',
    tagline: 'Professional 24-bit digital wireless microphones with SM58 / Beta 87A capsules',
    description:
      'Flawless speech delivery without dropouts or feedback. True digital diversity antenna switching with 100m crystal-clear range.',
    dailyRate: 'LKR 18,000',
    unit: 'per 4-mic rack / day',
    minOrderQuantity: 1,
    availableStock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1520523839898-50712825d3a3?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Audio Quality', value: '24-bit / 48kHz uncompressed digital audio' },
      { label: 'Operating Range', value: '100 meters line-of-sight' },
      { label: 'Latency', value: '< 2.9 ms lowest in class' },
    ],
    features: ['4x Shure wireless handheld mics with heavy stands', 'Directional paddle antenna distribution kit', 'Rechargeable lithium battery banks'],
  },

  // LIGHTING & FX
  {
    id: 'rent-lighting-moving-heads',
    name: '350W Beam & Spot Moving Head Stage Lights (Pack of 8)',
    category: 'lighting-fx',
    categoryLabel: 'DMX Lighting & Special FX',
    tagline: 'Intelligent DMX moving light fixtures with motorized prism, gobos & colors',
    description:
      'Create dramatic concert beams, sweeping grand entrance spotlights, and crisp monogram projections across dance floors and ceilings.',
    dailyRate: 'LKR 45,000',
    unit: 'per 8-head set / day',
    minOrderQuantity: 1,
    availableStock: 16,
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Lamp Source', value: '350W High-Intensity Discharge Arc Lamp' },
      { label: 'Beam Angle', value: '2° super-sharp piercing beam' },
      { label: 'Effects', value: '14 colors + 17 rotating gobos + 8-facet prism' },
    ],
    features: ['Includes Titan Mobile DMX lighting controller', 'Lighting designer and programmer on-site', 'Full truss clamps and DMX cabling included'],
    popular: true,
  },
  {
    id: 'rent-fx-cold-sparks',
    name: 'Cold-Spark Safe Pyrotechnic Fountain Machines (4 Units)',
    category: 'lighting-fx',
    categoryLabel: 'DMX Lighting & Special FX',
    tagline: '100% indoor-safe non-flammable cold fireworks for first dances & entrances',
    description:
      'Creates dazzling 15ft glowing golden fountains with ZERO smoke, ZERO smell, and completely cold-to-the-touch particles approved for indoor ballrooms.',
    dailyRate: 'LKR 32,000',
    unit: 'per 4-machine package / day',
    minOrderQuantity: 1,
    availableStock: 12,
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Fountain Height', value: 'Adjustable from 6ft to 16ft' },
      { label: 'Safety', value: 'Cold granular composite — zero burn hazard' },
      { label: 'Control', value: 'DMX wireless trigger synchronization' },
    ],
    features: ['Certified ballroom safe', 'Granular titanium powder refills included', 'Precision timing for couple entrance & cake cutting'],
    badge: 'Wedding Essential',
    popular: true,
  },
  {
    id: 'rent-fx-low-fog',
    name: 'Heavy Low-Fog Dry Ice Smoke Generator (Dance on Clouds)',
    category: 'lighting-fx',
    categoryLabel: 'DMX Lighting & Special FX',
    tagline: 'Thick, ground-hugging pure white cloud effect that never rises above knees',
    description:
      'Transform the bridal first dance into a dreamlike fairytale. Uses authentic medical-grade CO2 dry ice to create dense ground clouds that evaporate cleanly.',
    dailyRate: 'LKR 25,000',
    unit: 'per event / day',
    minOrderQuantity: 1,
    availableStock: 10,
    imageUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Effect Output', value: 'Covers 3,000 sq ft dance floor in 30 seconds' },
      { label: 'Medium', value: '100% Solid CO2 Dry Ice (No sticky chemicals)' },
      { label: 'Residue', value: 'Zero residue, zero smell, will not trigger fire alarms' },
    ],
    features: ['High-capacity 30kg dry ice hopper', 'Operator handles delivery, ice prep, and timed blast', 'Guaranteed cloud retention for 6+ minutes'],
    badge: 'First Dance Magic',
    popular: true,
  },

  // LED DISPLAYS
  {
    id: 'rent-led-p26-indoor',
    name: 'P2.6 Ultra-HD Seamless Indoor LED Video Wall (16x9ft)',
    category: 'led-displays',
    categoryLabel: '4K LED Video Walls',
    tagline: 'High-refresh 3,840Hz fine pixel pitch screen with NovaStar 4K processing',
    description:
      'Unsurpassed image sharpness for luxury wedding backdrop visuals, live camera feeds, 4K keynote presentations, and cinematic highlight reels.',
    dailyRate: 'LKR 140,000',
    unit: 'per 16x9ft array / day',
    minOrderQuantity: 1,
    availableStock: 10,
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Pixel Pitch', value: '2.6mm Ultra-Fine Pitch' },
      { label: 'Brightness', value: '1,200 nits high-contrast black LEDs' },
      { label: 'Refresh Rate', value: '3,840Hz flicker-free for 8K video cameras' },
    ],
    features: ['NovaStar VX1000 4K video processor', 'Includes live HDMI / SDI video switcher', 'Dedicated video technician on-site throughout'],
    badge: '4K Cinema LED',
    popular: true,
  },
  {
    id: 'rent-led-p39-outdoor',
    name: 'P3.9 Weatherproof Outdoor High-Brightness LED Screen (20x10ft)',
    category: 'led-displays',
    categoryLabel: '4K LED Video Walls',
    tagline: 'IP65 waterproof 5,500 nits daylight-readable screen for outdoor festivals & concerts',
    description:
      'Vivid high-definition clarity even under direct Sri Lankan tropical sunlight and rain. Die-cast aluminum modular cabinets with heavy ground ballast.',
    dailyRate: 'LKR 175,000',
    unit: 'per 20x10ft array / day',
    minOrderQuantity: 1,
    availableStock: 6,
    imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Brightness', value: '5,500 nits daylight ultra-bright' },
      { label: 'Ingress Protection', value: 'IP65 Front & Rear Full Waterproof' },
      { label: 'Cabinet', value: '500x1000mm Die-Cast Lightweight Aluminum' },
    ],
    features: ['Visible in midday sunlight', 'Wind-resistant structural trussing', 'High-speed video playback console'],
  },

  // TENTS & CANOPIES
  {
    id: 'rent-tent-marquee-clear',
    name: 'Clear-Span Luxury Marquee Tent (40ft x 60ft)',
    category: 'tents-canopies',
    categoryLabel: 'Marquees & Canopies',
    tagline: 'German-engineered clear-span structure with panoramic transparent walls & roof',
    description:
      'Turn open lawns and estates into a weatherproof luxury ballroom. No internal center poles, maximizing interior floor layout and lighting rigs.',
    dailyRate: 'LKR 125,000',
    unit: 'per setup / day',
    minOrderQuantity: 1,
    availableStock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Dimensions', value: '40ft Width x 60ft Length x 16ft Eave Height (Seats 250)' },
      { label: 'Structure', value: 'Extruded Hard Pressed Aluminum 6061/T6' },
      { label: 'Fabric', value: 'Flame-retardant UV-resistant 850g/m² PVC' },
    ],
    features: ['Transparent glass-like roof and sidewalls', 'Engineered to withstand 90 km/h wind gusts', 'Integrated lighting hanging points'],
    badge: 'Grand Lawn Venue',
  },
  {
    id: 'rent-tent-pagoda-20x20',
    name: 'European Pagoda High-Peak Canopy (20ft x 20ft)',
    category: 'tents-canopies',
    categoryLabel: 'Marquees & Canopies',
    tagline: 'Elegant pointed-peak canopies with arched window sidewalls for buffets & VIPs',
    description:
      'Compact elegance for food stalls, VIP welcoming lounges, photobooths, and poolside shade. Modular interconnectivity with rain gutters.',
    dailyRate: 'LKR 18,000',
    unit: 'per unit / day',
    minOrderQuantity: 2,
    availableStock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Dimensions', value: '20ft x 20ft (6m x 6m) — 400 sq ft' },
      { label: 'Peak Height', value: '17ft high architectural roofline' },
      { label: 'Walls', value: 'Removable zip-open arched church window panels' },
    ],
    features: ['Quick 45-minute erection', 'Clean bright white aesthetic', 'Rain gutter connectors for multi-tent setups'],
  },

  // POWER & CLIMATE
  {
    id: 'rent-power-generator-65kva',
    name: '65kVA Silent Soundproof Diesel Generator Truck',
    category: 'power-climate',
    categoryLabel: 'Generators & Cooling',
    tagline: 'Whisper-quiet acoustic canopy generator with automatic transfer switch (ATS)',
    description:
      'Guarantees 100% uninterrupted power for heavy lighting, air conditioners, sound rigs, and catering warmers without audible engine roar.',
    dailyRate: 'LKR 48,000',
    unit: 'per day (with diesel fuel)',
    minOrderQuantity: 1,
    availableStock: 6,
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Prime Output', value: '65kVA / 52kW Three-Phase 400V / 230V' },
      { label: 'Noise Level', value: 'Ultra-silent 62 dB @ 7 meters' },
      { label: 'Runtime', value: '12 hours continuous run on single tank' },
    ],
    features: ['Includes certified master electrician operator', 'Equipped with 3-phase main distribution board and 50m cables', 'Emergency automatic failover backup'],
    badge: 'Power Redundancy',
  },
  {
    id: 'rent-cooling-mist-fans',
    name: 'Industrial High-Pressure Cooling Mist Fans (Set of 4)',
    category: 'power-climate',
    categoryLabel: 'Generators & Cooling',
    tagline: 'Centrifugal ultra-fine atomizing mist fans that cool ambient air by up to 8°C',
    description:
      'Keep outdoor daytime wedding guests cool and comfortable under the tropical sun. Micro-droplet mist evaporates instantly without wetting clothes.',
    dailyRate: 'LKR 16,000',
    unit: 'per 4-fan set / day',
    minOrderQuantity: 1,
    availableStock: 24,
    imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Blade Diameter', value: '26-inch industrial oscillating fan' },
      { label: 'Coverage', value: 'Covers up to 500 sq ft per fan unit' },
      { label: 'Water Tank', value: '45-liter internal reservoir (8 hours continuous)' },
    ],
    features: ['Cools ambient temperature by 4°C - 8°C', '3-speed heavy oscillation', 'Zero wetness micro-atomization'],
  },

  // CATERING & BANQUET WARE
  {
    id: 'rent-catering-gold-chafing',
    name: 'Royal Gold & Rose Gold Heated Roll-Top Chafing Dishes',
    category: 'catering-ware',
    categoryLabel: 'Chafing & Banquet Ware',
    tagline: 'Luxury roll-top brass/gold buffet chafers with glass viewing windows',
    description:
      'Elevate your buffet line with high-polish 18/10 stainless steel chafers electroplated in regal mirror gold. Smooth 90° and 180° roll-top opening.',
    dailyRate: 'LKR 3,800',
    unit: 'per unit / day (with chafing fuel)',
    minOrderQuantity: 4,
    availableStock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Capacity', value: '9-Liter Full Size GN 1/1 Food Pan' },
      { label: 'Heating', value: 'Dual chafing fuel burner cups or induction ready' },
      { label: 'Lid', value: 'Hydraulic soft-close roll-top with tempered glass window' },
    ],
    features: ['Mirror gold royal finish', 'Sterilized and polished prior to dispatch', 'Includes serving tongs and food pans'],
    popular: true,
    badge: 'Banquet Luxury',
  },
  {
    id: 'rent-catering-champagne-tower',
    name: '5-Tier Cascading Crystal Champagne Fountain Tower',
    category: 'catering-ware',
    categoryLabel: 'Chafing & Banquet Ware',
    tagline: '55-glass lead-free crystal coupe tower with LED illuminated drip tray',
    description:
      'The iconic wedding toast centerpiece. Precision engineered interlocking base ensures a seamless champagne cascade from the summit to all 55 glasses.',
    dailyRate: 'LKR 22,000',
    unit: 'per tower setup / day',
    minOrderQuantity: 1,
    availableStock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
    specs: [
      { label: 'Glass Count', value: '55x Vintage Crystal Champagne Coupes' },
      { label: 'Base', value: 'Acrylic drip reservoir with built-in RGB soft glow' },
      { label: 'Height', value: '38 inches on tabletop' },
    ],
    features: ['Includes white-glove setup and post-toast clearing', 'Reinforced stabilizing glass spacers', 'Guaranteed spill-contained catch basin'],
    badge: 'Iconic Toast',
  },
];
