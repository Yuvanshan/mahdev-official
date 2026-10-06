export interface U1Service {
  id: string;
  name: string;
  tagline: string;
  category: 'media' | 'portrait' | 'commercial' | 'print';
  description: string;
  detailedDescription: string;
  imageUrl: string;
  gallery: string[];
  deliverables: string[];
  duration?: string;
  startingPrice: string;
  priceNote?: string;
  badge?: string;
  gearUsed?: string;
}

export interface U1PortfolioItem {
  id: string;
  title: string;
  category: 'Weddings' | 'Portraits' | 'Commercial & Product' | 'Pre-Shoots' | 'Events & Cinema';
  client: string;
  year: string;
  location: string;
  imageUrl: string;
  aspectRatio?: 'portrait' | 'landscape' | 'square';
  cameraMetadata?: {
    camera: string;
    lens: string;
    focalLength?: string;
    aperture?: string;
  };
  description: string;
  tags: string[];
}

export interface U1Package {
  id: string;
  name: string;
  tier: string;
  tagline: string;
  description: string;
  duration: string;
  price: string;
  priceNote?: string;
  deliverables: string[];
  imageUrl: string;
  gallery: string[];
  popular?: boolean;
  badge?: string;
  idealFor: string;
  locationType: 'Studio & On-Location' | 'Studio Exclusive' | 'On-Location Worldwide';
}

export const U1_SERVICES: U1Service[] = [
  {
    id: 'photography',
    name: 'Photography',
    tagline: 'High-Fidelity Still Artistry & Storytelling',
    category: 'media',
    description:
      'Editorial, fine-art, and commercial still photography utilizing medium-format and full-frame sensor technology with bespoke color grading.',
    detailedDescription:
      'Our signature photography blends meticulous lighting control with authentic emotional resonance. Every frame is captured in uncompressed RAW format, hand-curated, and mastered through custom color profiles calibrated for print and ultra-high-resolution displays.',
    imageUrl:
      'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?auto=format&fit=crop&w=1200&q=85',
    ],
    deliverables: [
      'High-resolution uncompressed digital master files',
      'Individual fine-art color grading and skin toning',
      'Private password-protected cloud client gallery',
      'Full commercial and personal reproduction rights',
    ],
    duration: 'Custom / Hourly to Multi-Day',
    startingPrice: 'LKR 45,000',
    priceNote: 'Base 2-hour session with primary photographer',
    gearUsed: 'Sony A7R V (61MP) / G-Master Prime Lenses',
    badge: 'Master Craft',
  },
  {
    id: 'videography',
    name: 'Videography',
    tagline: 'Cinematic 4K/8K Motion Pictures & Films',
    category: 'media',
    description:
      'Cinema-grade films, dynamic promotional reels, documentary cinema, and drone cinematography recorded with 10-bit logarithmic color.',
    detailedDescription:
      'We shoot motion with director-level storytelling. Using motorized gimbals, anamorphic lenses, high-frame-rate 120fps recording, and studio-grade sound capture, our films captivate audiences and preserve the tempo of live moments.',
    imageUrl:
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=85',
    ],
    deliverables: [
      '4K UHD Cinematic Highlight Teaser (60 - 90 seconds)',
      'Full-Length Extended Feature Film (30 - 60 mins)',
      'Licensed music scoring and sound design mastering',
      'Vertical 9:16 reels optimized for social media',
    ],
    duration: 'Half-Day to Multi-Day Production',
    startingPrice: 'LKR 85,000',
    priceNote: 'Includes camera operator, motorized gimbal & 4K mastering',
    gearUsed: 'Sony FX3 & FX6 Cinema Line / DJI Ronin RS3 Pro',
    badge: '4K Cinema',
  },
  {
    id: 'wedding-photography',
    name: 'Wedding Photography',
    tagline: 'Timeless Romance & Editorial Elegance',
    category: 'media',
    description:
      'Documentary candids, fine-art bridal portraits, multi-cultural ceremony coverage, and luxurious legacy wedding albums.',
    detailedDescription:
      'Weddings are once-in-a-lifetime milestones. U1 Studio approaches weddings with photojournalistic discretion and fashion-editorial finesse, capturing fleeting tears, radiant joy, and magnificent ceremony grandeur.',
    imageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=85',
    ],
    deliverables: [
      'Dual senior master photographer coverage',
      'Unlimited high-resolution color-graded captures',
      '48-hour sneak peek highlight gallery (30 photos)',
      'Handcrafted Italian leather wedding album included in tiers',
    ],
    duration: 'Full Day (Up to 14 Hours)',
    startingPrice: 'LKR 125,000',
    priceNote: 'Scales with coverage hours & album inclusions',
    gearUsed: 'Dual Slot Dual Body Setup with Profoto A10 Flashes',
    badge: 'Signature Luxury',
  },
  {
    id: 'portrait-photography',
    name: 'Portrait Photography',
    tagline: 'Executive Headshots, Editorial & Fashion',
    category: 'portrait',
    description:
      'Personal branding, executive portraits, fashion modelling portfolios, and artistic fine-art character studies.',
    detailedDescription:
      'A great portrait reveals identity and commanding presence. Shot in our private Colombo studio with sculpted Profoto strobe lighting or outdoor golden-hour locations, our portraits elevate personal brands and modeling careers.',
    imageUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=85',
    ],
    deliverables: [
      '3 to 5 wardrobe/look changes',
      'High-end magazine skin retouching (frequency separation)',
      'Web-optimized headshot crops and LinkedIn formats',
      'High-res printable TIFF and JPEG masters',
    ],
    duration: '1.5 to 3 Hours',
    startingPrice: 'LKR 35,000',
    priceNote: 'Studio session including 10 magazine-retouched images',
    gearUsed: 'Sony 85mm & 135mm f/1.4 GM / Profoto Softboxes',
  },
  {
    id: 'product-photography',
    name: 'Product Photography',
    tagline: 'E-Commerce & High-End Commercial Advertising',
    category: 'commercial',
    description:
      'Pure white Amazon/e-commerce catalog captures, creative lifestyle staging, luxury jewelry macro imaging, and food styling.',
    detailedDescription:
      'Drive customer conversion with striking product visual assets. We utilize precision motorized turntables, reflection-free light tents, focus-stacking macro optics, and high-contrast styling for consumer brands and luxury retailers.',
    imageUrl:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=85',
    ],
    deliverables: [
      'Pixel-perfect 100% white/transparent background cutouts',
      'Creative contextual lifestyle table-top scenes',
      'Focus-stacked ultra-sharp jewelry & tech macros',
      'Optimized exports for web e-commerce & billboards',
    ],
    duration: 'Per SKU / Half-Day Studio Batch',
    startingPrice: 'LKR 4,500 / SKU',
    priceNote: 'Volume tier discounts available for full catalogs',
    gearUsed: 'Sony 90mm Macro G / Tethered Phase One Capture One Pro',
  },
  {
    id: 'event-photography',
    name: 'Event Photography',
    tagline: 'High-Impact Executive Galas, Concerts & Summits',
    category: 'media',
    description:
      'Fast-paced documentary coverage, VIP reception portraits, keynote stage action, and swift on-site media dispatch.',
    detailedDescription:
      'Whether covering an international business conference at BMICH or an intimate milestone birthday gala, U1 Studio delivers rapid-turnaround photojournalism that captures high-energy moments and executive prestige.',
    imageUrl:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=85',
    ],
    deliverables: [
      'Full venue, stage, audience, and VIP step-and-repeat coverage',
      'Same-night social media press kit (20 curated photos)',
      'Complete digital download gallery within 48 hours',
      'Comprehensive metadata tagging for enterprise archiving',
    ],
    duration: 'Hourly to Multi-Day Summit',
    startingPrice: 'LKR 55,000',
    priceNote: 'Up to 4 hours coverage with senior event photographer',
    gearUsed: 'Dual Sony Alpha bodies with 24-70mm & 70-200mm f/2.8 GM',
  },
  {
    id: 'pre-shoots',
    name: 'Pre-Shoots & Romance',
    tagline: 'Cinematic Concept Shoots & Love Stories',
    category: 'portrait',
    description:
      'Dreamy couple sessions at Sri Lanka’s most breathtaking locations—misty tea estates, heritage Galle Fort, and golden coastlines.',
    detailedDescription:
      'Celebrate your love story without wedding day time constraints. We scout dramatic locations, plan thematic moodboards, arrange wardrobe stylings, and shoot intimate editorial images and cinematic 4K video teasers.',
    imageUrl:
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=85',
    ],
    deliverables: [
      'Full-day location exploration (up to 3 scenic spots)',
      '50+ master-retouched editorial digital photographs',
      '2-minute 4K cinematic romantic trailer with drone filming',
      'Fine-art canvas print for reception welcome display',
    ],
    duration: 'Full Day (6 - 8 Hours)',
    startingPrice: 'LKR 75,000',
    priceNote: 'Includes location scouting & drone cinematography',
    badge: 'Trending Choice',
  },
  {
    id: 'studio-sessions',
    name: 'Studio Sessions',
    tagline: 'Controlled Lighting on Our Infinity Cyclorama',
    category: 'portrait',
    description:
      'Private studio bookings on our pristine 25ft infinity white cyclorama, textured hand-painted backdrops, and motorized lighting grids.',
    detailedDescription:
      'Step into our dedicated creative studio in Colombo. Fully air-conditioned with private makeup dressing suites, tethered 4K client monitoring, Profoto lighting modifiers, and infinite color backdrops.',
    imageUrl:
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?auto=format&fit=crop&w=1200&q=85',
    ],
    deliverables: [
      'Access to 25ft white infinity cyclorama and seamless color rolls',
      'Profoto D2 / B10 strobe lighting array with softboxes & beauty dishes',
      'Private dressing room, vanity mirrors & styling steamer',
      'Live tethered preview on 32-inch color-calibrated monitor',
    ],
    duration: '2-Hour Minimum to Full Day Rental',
    startingPrice: 'LKR 25,000',
    priceNote: 'Studio space hire with lighting assistance included',
    gearUsed: 'Profoto Lighting System / Matthews Grip Gear',
  },
  {
    id: 'photo-albums',
    name: 'Photo Albums',
    tagline: 'Handcrafted Flush-Mount Heritage Keepsakes',
    category: 'print',
    description:
      'Luxury lay-flat albums crafted with Italian full-grain leather, velvet, or linen covers and archival silver-halide HD photographic paper.',
    detailedDescription:
      'Digital photos live on screens, but true memories deserve tangible grandeur. Our master artisans hand-bind flush-mount albums that open flat with seamless panoramic spreads, guaranteed to resist fading for over 100 years.',
    imageUrl:
      'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=85',
    ],
    deliverables: [
      '12x18 or 10x15 inch luxury flush-mount album (40 - 60 pages)',
      'Choice of genuine Italian leather, velvet, or Japanese silk cover',
      'Laser-engraved or gold foil-stamped couple initials',
      'Handmade wooden presentation box with matching velvet lining',
    ],
    duration: '2 - 3 Weeks Handcrafting',
    startingPrice: 'LKR 40,000',
    priceNote: 'Includes custom page layout design and 2 revision rounds',
    badge: '100-Year Archival',
  },
  {
    id: 'photo-frames',
    name: 'Photo Frames & Canvases',
    tagline: 'Museum-Grade Framing & Acrylic Wall Art',
    category: 'print',
    description:
      'Custom solid-wood floating frames, diamond-polished HD acrylic glass mounts, and heavy cotton gallery-wrap canvases.',
    detailedDescription:
      'Turn your favorite captures into architectural centerpieces for your living room, executive office, or gallery wall. We use non-reflective museum glass, acid-free mats, and archival pigmented inks.',
    imageUrl:
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=85',
    ],
    deliverables: [
      'Custom sizing from 12x18 inch up to 40x60 inch grand scale',
      'Choice of teak, oak, matte black, or brushed champagne aluminum',
      'Anti-reflective UV protection museum acrylic glass',
      'Heavy-duty hanging hardware and wall-mounting template',
    ],
    duration: '5 - 7 Business Days',
    startingPrice: 'LKR 12,000',
    priceNote: 'Starting from 16x24 inch finished wooden frame',
  },
  {
    id: 'post-production',
    name: 'Post Production',
    tagline: 'High-End Color Grading, VFX & Retouching',
    category: 'media',
    description:
      'Professional DaVinci Resolve color mastering, frequency-separation skin retouching, background compositing, and audio noise cleaning.',
    detailedDescription:
      'Raw captures are only the starting canvas. Our certified colorists and digital retouch artists polish lighting tones, remove unwanted artifacts, match multi-camera profiles, and engineer cinematic color balance.',
    imageUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85',
    ],
    deliverables: [
      'High-end magazine beauty retouching without plastic loss of texture',
      'DaVinci Resolve Studio color grading (LUT generation & scene matching)',
      'Object removal, sky replacements, and composite expansions',
      'Batch audio cleanup and dialogue frequency balance',
    ],
    duration: '24 Hours to 5 Business Days',
    startingPrice: 'LKR 18,000',
    priceNote: 'Hourly grading or flat rate per batch',
    gearUsed: 'DaVinci Resolve Advanced Panel / EIZO ColorEdge Monitors',
  },
];

export const U1_PACKAGES: U1Package[] = [
  {
    id: 'u1-signature-wedding',
    name: 'Signature Wedding Cinema & Stills',
    tier: 'All-Inclusive Royal Suite',
    tagline: 'Comprehensive photography, cinematic film & heirloom album',
    description:
      'Our most acclaimed full-day wedding production suite. Covers the Poruwa, Christian church blessing, couple creative portraiture, and grand reception with zero compromises.',
    duration: 'Full Day (Up to 14 Hours)',
    price: 'LKR 280,000',
    priceNote: 'Includes both Photography + 4K Cinema Videography',
    deliverables: [
      '2 Senior Master Photographers + 2 Cinema Videographers',
      '1 Licensed 4K Aerial Drone Cinematographer',
      'Unlimited high-res color-graded digital still captures (700+ photos)',
      '3-4 Minute Cinematic Trailer Film + 60 Minute Extended Feature Film',
      '12x18 Inch Handcrafted Flush-Mount Italian Leather Wedding Album (50 Pages)',
      'Two 8x12 Inch Mini Parent Keepsake Albums',
      '20x30 Inch Framed Fine-Art Canvas for Reception Display',
      '48-Hour Social Media Sneak Peek (25 Photos + 30s Reel)',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=85',
    ],
    popular: true,
    badge: 'Most Popular Wedding Choice',
    idealFor: 'Couples seeking the ultimate seamless wedding media documentation',
    locationType: 'Studio & On-Location',
  },
  {
    id: 'u1-pre-shoot-romance',
    name: 'Pre-Shoot Romance & Cinematic Reel',
    tier: 'Romantic Location Curation',
    tagline: 'Dreamy destination love story across Sri Lanka’s finest horizons',
    description:
      'A full day dedicated to you. Travel to Nuwara Eliya tea hills, historic Galle Fort ramparts, or secluded southern beaches with our creative crew.',
    duration: 'Full Day (Up to 8 Hours)',
    price: 'LKR 95,000',
    priceNote: 'Covers up to 3 scenic location hops',
    deliverables: [
      '1 Lead Editorial Photographer + 1 Cinema Videographer',
      '4K Aerial Drone Perspectives of scenery and couple walks',
      '50 High-End Magazine Retouched Still Images',
      '2-Minute Cinematic Romantic Trailer with licensed indie music track',
      '16x24 Inch Teak Wood Framed Welcome Portrait for Wedding Foyer',
      'High-resolution cloud download link valid for 1 year',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=85',
    ],
    badge: 'Couples Favorite',
    idealFor: 'Engaged couples wanting cinematic reception teasers and framing',
    locationType: 'On-Location Worldwide',
  },
  {
    id: 'u1-editorial-portrait',
    name: 'Editorial Portrait & Executive Branding',
    tier: 'Studio Master Session',
    tagline: 'Commanding personal branding for executives, artists & models',
    description:
      'Experience magazine-grade lighting in our private Colombo studio. Perfect for executive leadership headshots, fashion modeling portfolios, and artist profiles.',
    duration: '2.5 Hours in Studio',
    price: 'LKR 48,000',
    priceNote: 'Includes full makeup styling consultation in-studio',
    deliverables: [
      'Unlimited wardrobe changes within session time (3 - 4 looks)',
      'Access to infinity white cyclorama & colored artistic backdrops',
      'Live tethered image preview on calibrated 32-inch 4K monitor',
      '15 Magazine-Retouched High-Resolution Masters (Frequency separation)',
      'LinkedIn, Instagram & Press-ready crops in both JPEG and TIFF',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=85',
    ],
    badge: 'Executive Standard',
    idealFor: 'CEOs, founders, actors, models, and personal brand creators',
    locationType: 'Studio Exclusive',
  },
  {
    id: 'u1-commercial-catalog',
    name: 'Commercial Product & Catalog Suite',
    tier: 'Enterprise Commercial',
    tagline: 'High-converting visual assets for e-commerce, food & fashion',
    description:
      'Engineered for retail brands looking to scale sales. Includes pure white cutouts, creative table-top lifestyle staging, and macro jewelry detailing.',
    duration: 'Full Day Studio Session (Up to 25 SKUs)',
    price: 'LKR 85,000',
    priceNote: 'Volume discounts for larger product batches',
    deliverables: [
      'Up to 25 Product SKUs shot from 3 key angles (75 total images)',
      'Pure white background clipping paths (PNG with transparency)',
      '5 Creative styled lifestyle scenes with curated props',
      'High-resolution TIFF master files + WebP compressed e-commerce files',
      'Full perpetual commercial advertising and billboard usage rights',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85',
    ],
    badge: 'Enterprise Choice',
    idealFor: 'E-commerce brands, fashion boutiques, jewelry makers & tech stores',
    locationType: 'Studio & On-Location',
  },
];

export const U1_PORTFOLIO_ITEMS: U1PortfolioItem[] = [
  {
    id: 'port-1',
    title: 'Serenade in Galle Fort',
    category: 'Weddings',
    client: 'Niroshan & Sandali',
    year: '2025',
    location: 'Amangalla & Galle Fort Ramparts',
    imageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
    aspectRatio: 'landscape',
    cameraMetadata: {
      camera: 'Sony A7R V',
      lens: 'FE 50mm f/1.2 GM',
      focalLength: '50mm',
      aperture: 'f/1.4',
    },
    description:
      'A golden hour editorial wedding portrait capturing the timeless colonial architecture and bridal radiance.',
    tags: ['Wedding', 'Editorial', 'Heritage', 'Galle Fort'],
  },
  {
    id: 'port-2',
    title: 'The Modern Monolith',
    category: 'Commercial & Product',
    client: 'AURA Timepieces Colombo',
    year: '2024',
    location: 'U1 Studio Cyclorama, Colombo 03',
    imageUrl:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85',
    aspectRatio: 'square',
    cameraMetadata: {
      camera: 'Sony A7R V',
      lens: 'FE 90mm f/2.8 Macro G OSS',
      focalLength: '90mm',
      aperture: 'f/11 (Focus Stacked)',
    },
    description:
      'High-precision luxury watch commercial capture utilizing 14 focus-stacked exposures on dark brushed slate.',
    tags: ['Macro', 'Product', 'Commercial', 'Luxury Watch'],
  },
  {
    id: 'port-3',
    title: 'Elegance in Twilight',
    category: 'Portraits',
    client: 'Ananya Senanayake',
    year: '2025',
    location: 'U1 Studio Private Suite',
    imageUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
    aspectRatio: 'portrait',
    cameraMetadata: {
      camera: 'Sony A7R V',
      lens: 'FE 85mm f/1.4 GM',
      focalLength: '85mm',
      aperture: 'f/2.0',
    },
    description:
      'Fashion editorial portrait sculpted with a 3-point Profoto softbox setup highlighting organic skin tonality.',
    tags: ['Fashion', 'Portrait', 'Studio Lighting', 'Editorial'],
  },
  {
    id: 'port-4',
    title: 'Mist of Nuwara Eliya',
    category: 'Pre-Shoots',
    client: 'Dulan & Himasha',
    year: '2025',
    location: 'Pedro Tea Estate, Nuwara Eliya',
    imageUrl:
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=85',
    aspectRatio: 'landscape',
    cameraMetadata: {
      camera: 'Sony FX3 Cinema',
      lens: 'FE 35mm f/1.4 GM',
      focalLength: '35mm',
      aperture: 'f/1.8',
    },
    description:
      'Cinematic love story frame amidst early morning mountain mist, capturing tender vows before wedding day.',
    tags: ['Pre-Shoot', 'Nuwara Eliya', 'Romantic', 'Cinematography'],
  },
  {
    id: 'port-5',
    title: 'Summit of Innovation',
    category: 'Events & Cinema',
    client: 'Dialog Axiata PLC',
    year: '2024',
    location: 'BMICH Main Auditorium, Colombo',
    imageUrl:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=85',
    aspectRatio: 'landscape',
    cameraMetadata: {
      camera: 'Sony FX6 Cinema',
      lens: 'FE 70-200mm f/2.8 GM OSS II',
      focalLength: '135mm',
      aperture: 'f/2.8',
    },
    description:
      'High-octane keynote address with synchronized dynamic blue wash lighting and multi-camera live broadcast.',
    tags: ['Executive Event', 'Keynote', 'Cinema Stage', 'Dialog'],
  },
  {
    id: 'port-6',
    title: 'The Royal Poruwa Rituals',
    category: 'Weddings',
    client: 'Dr. Kasun & Dr. Sachini',
    year: '2024',
    location: 'Cinnamon Grand Colombo',
    imageUrl:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85',
    aspectRatio: 'portrait',
    cameraMetadata: {
      camera: 'Sony A7R V',
      lens: 'FE 24-70mm f/2.8 GM II',
      focalLength: '48mm',
      aperture: 'f/2.8',
    },
    description:
      'Traditional Kandyan heritage wedding ceremony capturing the sacred exchange of wedding rings and blessings.',
    tags: ['Traditional Wedding', 'Kandyan Poruwa', 'Cinnamon Grand', 'Ceremony'],
  },
  {
    id: 'port-7',
    title: 'Acoustic Soundwaves',
    category: 'Commercial & Product',
    client: 'Sonic Ceylon Tech',
    year: '2025',
    location: 'U1 Studio Table-Top Suite',
    imageUrl:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85',
    aspectRatio: 'square',
    cameraMetadata: {
      camera: 'Sony A7R V',
      lens: 'FE 90mm f/2.8 Macro',
      focalLength: '90mm',
      aperture: 'f/8.0',
    },
    description:
      'High-contrast studio audio equipment photography featuring floating gold particle illumination.',
    tags: ['Headphones', 'Product Styling', 'Commercial', 'Audio'],
  },
  {
    id: 'port-8',
    title: 'Executive Presence',
    category: 'Portraits',
    client: 'Malik Jayawardena',
    year: '2024',
    location: 'U1 Studio Executive Bay',
    imageUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=85',
    aspectRatio: 'portrait',
    cameraMetadata: {
      camera: 'Sony A7R V',
      lens: 'FE 135mm f/1.8 GM',
      focalLength: '135mm',
      aperture: 'f/2.5',
    },
    description:
      'Executive leadership portrait for annual report publication with natural rim light separation.',
    tags: ['Executive', 'Headshot', 'Portraits', 'Leadership'],
  },
  {
    id: 'port-9',
    title: 'Golden Sunset Vows',
    category: 'Pre-Shoots',
    client: 'Thevindu & Natalie',
    year: '2025',
    location: 'Bentota Secluded Beachfront',
    imageUrl:
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=85',
    aspectRatio: 'landscape',
    cameraMetadata: {
      camera: 'DJI Mavic 3 Cine & Sony FX3',
      lens: 'FE 24mm f/1.4 GM',
      focalLength: '24mm',
      aperture: 'f/2.0',
    },
    description:
      'Panoramic oceanfront pre-shoot bathed in the fiery hues of the Indian Ocean twilight.',
    tags: ['Beach Sunset', 'Pre-Shoot', 'Drone Cinematography', 'Bentota'],
  },
];
