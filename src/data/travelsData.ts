export interface TravelDestination {
  id: string;
  name: string;
  region: string;
  tagline: string;
  description: string;
  imageUrl: string;
  gallery: string[];
  bestTimeToVisit: string;
  highlights: string[];
  recommendedDays: string;
}

export interface TravelPackage {
  id: string;
  title: string;
  destination: string;
  duration: string;
  tagline: string;
  description: string;
  heroImage: string;
  gallery: string[];
  highlights: string[];
  price: string;
  pricePerPerson: number;
  priceNote: string;
  availability: string;
  difficulty: 'Easy' | 'Moderate' | 'Active';
  tourType: 'Private Tour' | 'Small Group' | 'Luxury Expedition';
  badge?: string;
  overview: string;
  itinerary: {
    day: number;
    title: string;
    location: string;
    description: string;
    meals: string;
    stay: string;
  }[];
  included: string[];
  excluded: string[];
  pricingTiers: {
    tier: string;
    price: string;
    description: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
}

export interface DayTour {
  id: string;
  title: string;
  location: string;
  duration: string;
  imageUrl: string;
  description: string;
  highlights: string[];
  price: string;
  included: string[];
}

export interface Vehicle {
  id: string;
  name: string;
  category: 'Luxury Sedan' | 'VIP Van' | '4x4 Expedition' | 'Executive Coach';
  capacity: string;
  luggage: string;
  imageUrl: string;
  features: string[];
  dailyRate: string;
}

export interface TravelStory {
  id: string;
  title: string;
  traveler: string;
  origin: string;
  packageTaken: string;
  quote: string;
  rating: number;
  date: string;
  image: string;
}

export const TRAVEL_DESTINATIONS: TravelDestination[] = [
  {
    id: 'sigiriya-cultural-triangle',
    name: 'Sigiriya & Cultural Triangle',
    region: 'Central Province',
    tagline: 'Ancient UNESCO Citadel & Giant Rock Fortress',
    description:
      'Rise above the emerald jungle canopy to explore the 5th-century palace in the sky built by King Kashyapa, alongside the sacred cave temples of Dambulla and the ancient ruins of Polonnaruwa.',
    imageUrl:
      'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=800&q=80',
    ],
    bestTimeToVisit: 'December to April, July to September',
    highlights: ['Sigiriya Lion Rock Climb at Sunrise', 'Dambulla Golden Cave Temple', 'Pidurangala Panoramic Viewpoint', 'Minneriya Elephant Gathering'],
    recommendedDays: '2 - 3 Days',
  },
  {
    id: 'ella-tea-highlands',
    name: 'Ella & Nuwara Eliya Highlands',
    region: 'Hill Country',
    tagline: 'Misty Cloud Forests, Tea Estates & Scenic Train Rides',
    description:
      'Traverse cascading waterfalls, emerald Ceylon tea plantations, and the architectural marvel of the Nine Arch Bridge before resting in colonial Nuwara Eliya.',
    imageUrl:
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=800&q=80',
    ],
    bestTimeToVisit: 'January to May, August to September',
    highlights: ['Blue Train Journey from Kandy to Ella', 'Nine Arch Bridge at Morning Mist', 'Ceylon Tea Factory Plucking Tour', 'Little Adam’s Peak Hike'],
    recommendedDays: '3 - 4 Days',
  },
  {
    id: 'yala-wildlife-safari',
    name: 'Yala & Udawalawe Wild Safaris',
    region: 'Southern Wilderness',
    tagline: 'Highest Leopard Density on Earth & Elephant Herds',
    description:
      'Embark on private 4x4 open-top game drives through dry-zone scrublands, tracking elusive Sri Lankan leopards, sloth bears, marsh crocodiles, and wild elephant families.',
    imageUrl:
      'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80',
    ],
    bestTimeToVisit: 'February to July (Best Leopard Sightings)',
    highlights: ['Private 4x4 Dawn Safari Game Drive', 'Leopard & Sloth Bear Tracking', 'Udawalawe Elephant Transit Home', 'Luxury Tented Bush Camps'],
    recommendedDays: '2 - 3 Days',
  },
  {
    id: 'galle-south-coast',
    name: 'Galle Fort & Southern Coastlines',
    region: 'Southern Province',
    tagline: '17th-Century Dutch Fortresses, Coral Reefs & Surf',
    description:
      'Cobblestone alleys lined with boutique gemstone shops, colonial villas, stilt fishermen at twilight, and turquoise Indian Ocean beaches in Mirissa, Weligama, and Unawatuna.',
    imageUrl:
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1589779257635-3b98401f8e12?auto=format&fit=crop&w=800&q=80',
    ],
    bestTimeToVisit: 'November to April (Calm Turquoise Seas)',
    highlights: ['Galle Dutch Fort Walking Ramparts Tour', 'Blue Whale Watching Expedition', 'Surf Coaching in Weligama Bay', 'Sea Turtle Hatchery Sanctuary'],
    recommendedDays: '3 - 5 Days',
  },
  {
    id: 'trincomalee-east-coast',
    name: 'Trincomalee & Passikudah',
    region: 'Eastern Province',
    tagline: 'Untouched White Sand Beaches & Pigeon Island Snorkeling',
    description:
      'Crystal-clear shallow lagoons, coral reefs teeming with blacktip reef sharks and sea turtles at Pigeon Island Marine National Park, and the ancient Koneswaram Temple perched over Swami Rock.',
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    ],
    bestTimeToVisit: 'May to September (Sun-Drenched East Coast)',
    highlights: ['Pigeon Island Marine National Park Snorkeling', 'Koneswaram Temple Cliff Walk', 'Marble Beach Turquoise Lagoon', 'Passikudah Coral Bay'],
    recommendedDays: '3 - 4 Days',
  },
  {
    id: 'kandy-sacred-city',
    name: 'Kandy & Knuckles Cloud Forests',
    region: 'Central Province',
    tagline: 'Sacred Temple of the Tooth & UNESCO Biosphere Treks',
    description:
      'The spiritual heart of Sri Lanka nestled around a royal lake, housing the Sacred Tooth Relic of the Buddha, surrounded by the dramatic biodiversity of the Knuckles Mountain Range.',
    imageUrl:
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=800&q=80',
    ],
    bestTimeToVisit: 'Year-Round (July/August for Esala Perahera)',
    highlights: ['Temple of the Sacred Tooth Relic (Sri Dalada Maligawa)', 'Royal Botanical Gardens Peradeniya', 'Knuckles Mountain Waterfall Treks', 'Kandyan Cultural Fire Dancers'],
    recommendedDays: '2 - 3 Days',
  },
];

export const TRAVEL_PACKAGES: TravelPackage[] = [
  {
    id: 'grand-ceylon-odyssey',
    title: 'The Grand Ceylon Odyssey',
    destination: 'Island-Wide Classic Loop',
    duration: '10 Days / 9 Nights',
    tagline: 'Ancient Citadels, Cloud-Forest Blue Train, Leopard Safari & Coastal Fortresses',
    description:
      'Our definitive signature private journey connecting Sri Lanka’s most magnificent UNESCO World Heritage sites, mist-covered Ceylon tea estates, thrilling wildlife safaris, and Dutch colonial beaches.',
    heroImage:
      'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=800&q=80',
    ],
    highlights: [
      'Sunrise climb of Sigiriya Lion Rock fortress',
      'Scenic first-class reserved Blue Train journey through tea valleys',
      'Exclusive 4x4 safari in Yala National Park for leopard tracking',
      'Sunset walking tour of Galle Dutch Fort with local historian',
      'Private luxury air-conditioned vehicle & dedicated English-speaking chauffeur',
    ],
    price: '$1,480',
    pricePerPerson: 1480,
    priceNote: 'Per person based on twin sharing',
    availability: 'Daily Departures Year-Round',
    difficulty: 'Easy',
    tourType: 'Luxury Expedition',
    badge: 'Most Popular Choice',
    overview:
      'Experience the breathtaking soul of Sri Lanka on an unhurried, private journey with luxury boutique accommodations, private 4x4 game safaris, and seamless chauffeur logistics.',
    itinerary: [
      {
        day: 1,
        title: 'Arrival in Colombo & Transfer to Cultural Triangle',
        location: 'Sigiriya / Dambulla',
        description:
          'VIP welcome at Bandaranaike International Airport (CMB). Meet your private chauffeur-guide and travel through lush coconut plantations to your luxury jungle resort in Sigiriya.',
        meals: 'Dinner included',
        stay: 'Aliya Resort & Spa / Cinnamon Lodge',
      },
      {
        day: 2,
        title: 'Sigiriya Lion Rock & Minneriya Elephant Safari',
        location: 'Sigiriya & Minneriya',
        description:
          'Early morning ascent of King Kashyapa’s 5th-century Sigiriya Rock Fortress before the heat of the day. In the afternoon, embark on an open 4x4 jeep safari to witness the wild elephant gathering at Minneriya.',
        meals: 'Breakfast & Dinner',
        stay: 'Aliya Resort & Spa',
      },
      {
        day: 3,
        title: 'Dambulla Cave Temples & Royal City of Kandy',
        location: 'Dambulla to Kandy',
        description:
          'Visit the UNESCO Dambulla Rock Cave Temples adorned with centuries-old Buddhist murals. Proceed to Kandy, visit a traditional spice garden in Matale, and witness the evening sacred puja at the Temple of the Tooth.',
        meals: 'Breakfast & Dinner',
        stay: 'Earl’s Regency / The Grand Kandyan',
      },
      {
        day: 4,
        title: 'Iconic Ceylon Blue Train to Nuwara Eliya & Ella',
        location: 'Kandy to Ella',
        description:
          'Board the world-famous blue train through misty pine forests and tea-blanketed mountains. Disembark in Ella for panoramic views of Ella Gap.',
        meals: 'Breakfast & Dinner',
        stay: '98 Acres Resort & Spa / EKHO Ella',
      },
      {
        day: 5,
        title: 'Nine Arch Bridge & Tea Plantation Craft',
        location: 'Ella Highlands',
        description:
          'Morning walk to the iconic Nine Arch Bridge to watch the morning train cross the viaduct. Tour a working colonial Ceylon tea estate and factory with artisanal tea tasting.',
        meals: 'Breakfast & Dinner',
        stay: '98 Acres Resort & Spa',
      },
      {
        day: 6,
        title: 'Descend to Yala National Park Wilderness',
        location: 'Ella to Yala',
        description:
          'Pass by the roaring Rawana Falls and descend into the southern wild plains. Check into a luxury tented camp near Yala National Park.',
        meals: 'Breakfast, Lunch & Dinner',
        stay: 'Cinnamon Wild Yala / Jetwing Yala',
      },
      {
        day: 7,
        title: 'Dawn Leopard & Sloth Bear Safari',
        location: 'Yala National Park',
        description:
          'Dawn 4x4 private game drive with an expert naturalist tracker through Yala Block 1. Afternoon at leisure overlooking wild waterholes.',
        meals: 'Breakfast & Dinner',
        stay: 'Cinnamon Wild Yala',
      },
      {
        day: 8,
        title: 'Scenic Southern Coast to Galle Dutch Fort',
        location: 'Yala to Galle',
        description:
          'Drive along the scenic coastal highway, observing stilt fishermen in Koggala. Settle into Galle Fort, stroll cobblestone alleys, and watch the sunset from the lighthouse bastion.',
        meals: 'Breakfast & Dinner',
        stay: 'Fort Bazaar / Le Grand Galle',
      },
      {
        day: 9,
        title: 'Whale Watching & Coastal Beach Relaxation',
        location: 'Mirissa & Galle',
        description:
          'Optional morning catamaran cruise in Mirissa to spot blue whales. Afternoon at leisure on the golden sands of Unawatuna or indulging in an authentic Ayurvedic spa treatment.',
        meals: 'Breakfast & Dinner',
        stay: 'Fort Bazaar / Le Grand Galle',
      },
      {
        day: 10,
        title: 'Colombo City Highlights & Airport Departure',
        location: 'Galle to Colombo Airport',
        description:
          'Travel via the Southern Expressway to Colombo for a brief orientation drive past Independence Square and Old Parliament before airport drop-off.',
        meals: 'Breakfast included',
        stay: 'Departure Transfer',
      },
    ],
    included: [
      '9 Nights luxury 4-Star / 5-Star boutique hotel accommodations',
      'Private air-conditioned luxury SUV/Van with dedicated English-speaking chauffeur-guide',
      'Daily gourmet buffet breakfasts and 9 multi-course dinners',
      'All UNESCO site entrance tickets (Sigiriya, Dambulla Caves, Temple of Tooth, Galle Fort)',
      'Reserved 1st-Class Blue Train tickets (Kandy to Ella)',
      'Private 4x4 Safari Jeep with tracker at Yala National Park & Minneriya',
      'All fuel, toll fees, highway charges, and driver accommodation costs',
      '24/7 Mahdev Concierge on-ground emergency support',
    ],
    excluded: [
      'International flights & Sri Lanka ETA visa fees',
      'Lunch and alcoholic beverages (unless specified)',
      'Personal expenses, laundry, and tipping',
      'Optional hot air balloon or helicopter excursions',
    ],
    pricingTiers: [
      { tier: 'Standard Boutique (4-Star)', price: '$1,480 / Person', description: 'Curated heritage villas and 4-star boutique resorts.' },
      { tier: 'Luxury Signature (5-Star Luxury)', price: '$2,250 / Person', description: '5-Star luxury properties (98 Acres, Fort Bazaar, Cinnamon Wild).' },
      { tier: 'Ultra-Luxe & Chateaux', price: '$3,400 / Person', description: 'Tea Trails Relais & Châteaux, Amangalla & Wild Coast Tented Lodge.' },
    ],
    faqs: [
      {
        question: 'What is the visa process for Sri Lanka?',
        answer:
          'Most international travelers can obtain an Electronic Travel Authorization (ETA) online prior to arrival via the official portal, typically processed within 24–48 hours.',
      },
      {
        question: 'Can we customize this itinerary?',
        answer:
          'Yes, 100%! All our packages are private journeys. We can adjust the pace, upgrade hotels, add beach days, or incorporate specific activities to match your desires.',
      },
      {
        question: 'What type of transport is provided?',
        answer:
          'We use latest-model Toyota Land Cruisers, luxury Toyota Alphards, or private Mercedes-Benz / HiAce luxury vans equipped with high-speed Wi-Fi, chilled bottled water, and air conditioning.',
      },
    ],
  },
  {
    id: 'romantic-honeymoon-escape',
    title: 'Ceylon Romance & Tea Trails Honeymoon',
    destination: 'Ella, Nuwara Eliya & Mirissa Coast',
    duration: '7 Days / 6 Nights',
    tagline: 'Private Plunge Pools, Candlelight Dinners & Sunset Catamaran',
    description:
      'An intimate, luxurious retreat designed exclusively for couples celebrating love. Secluded mountain chalets with private plunge pools, candlelight dinners under the stars, and coastal catamaran sunset cruises.',
    heroImage:
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    ],
    highlights: [
      'Private pool villa with panoramic tea plantation vistas in Ella',
      'Romantic 5-course candlelit dinner in an organic spice plantation',
      'Couples 90-minute traditional Ayurvedic herbal massage and flower bath',
      'Private sunset sailing catamaran charter in Mirissa Bay',
      'Chilled champagne & tropical fruit basket upon hotel check-ins',
    ],
    price: '$1,850',
    pricePerPerson: 1850,
    priceNote: 'Per couple package rate',
    availability: 'Year-Round Romantic Escapes',
    difficulty: 'Easy',
    tourType: 'Private Tour',
    badge: 'Honeymoon Special',
    overview:
      'Crafted for newlyweds and anniversaries, this journey blends unhurried relaxation with breathtaking romantic scenery and personalized VIP surprises at every luxury stay.',
    itinerary: [
      {
        day: 1,
        title: 'Arrival & Scenic Flight / Drive to Tea Highlands',
        location: 'Nuwara Eliya / Hatton',
        description:
          'VIP airport greeting with fresh jasmine flower garlands. Private scenic transfer into the heart of the Ceylon tea country to check into your romantic colonial planter bungalow.',
        meals: 'Champagne Dinner included',
        stay: 'Ceylon Tea Trails / Heritance Tea Factory',
      },
      {
        day: 2,
        title: 'Artisanal Tea Plucking & Fireplace High Tea',
        location: 'Tea Country',
        description:
          'Enjoy private tea plucking with resident planters followed by high tea on the lawn overlooking the lake. Evening private fireplace dinner.',
        meals: 'Breakfast & Dinner',
        stay: 'Ceylon Tea Trails',
      },
      {
        day: 3,
        title: 'Ella Mountain Chalet & Private Pool Relaxation',
        location: 'Ella',
        description:
          'Scenic drive to Ella. Check into your private plunge pool villa with breathtaking morning views of Ella Rock.',
        meals: 'Breakfast & Candlelight Dinner',
        stay: '98 Acres Resort & Spa (Pool Villa)',
      },
      {
        day: 4,
        title: 'Couples Ayurvedic Rejuvenation & Nine Arch Sunrise',
        location: 'Ella',
        description:
          'Early sunrise photography at Nine Arch Bridge with private picnic breakfast. Afternoon 90-minute couples Ayurvedic massage and warm floral bath.',
        meals: 'Breakfast & Dinner',
        stay: '98 Acres Resort & Spa',
      },
      {
        day: 5,
        title: 'South Coast Beach Villa & Stilt Fishermen Twilight',
        location: 'Tangalle / Mirissa',
        description:
          'Descend to the golden southern coast. Check into an oceanfront boutique sanctuary with direct private beach access.',
        meals: 'Breakfast & Seafood Dinner',
        stay: 'Amanwella / Cape Weligama',
      },
      {
        day: 6,
        title: 'Private Sunset Catamaran Sailing',
        location: 'Mirissa Bay',
        description:
          'Board a private luxury catamaran for a 3-hour twilight cruise with canapés, wine, and dolphin watching as the sun dips into the Indian Ocean.',
        meals: 'Breakfast & Sunset Canapés',
        stay: 'Amanwella / Cape Weligama',
      },
      {
        day: 7,
        title: 'Galle Fort Stroll & Airport Farewell Transfer',
        location: 'Galle to CMB Airport',
        description:
          'Leisurely morning breakfast, souvenir shopping in Galle Fort’s artisanal jewelry quarter, and luxury private transfer to Colombo airport.',
        meals: 'Breakfast included',
        stay: 'Departure Transfer',
      },
    ],
    included: [
      '6 Nights in ultra-romantic luxury pool villas and colonial suites',
      'Private luxury sedan transport with dedicated discreet chauffeur',
      'Daily gourmet breakfasts and 4 curated romantic candlelit dinners',
      'Couples 90-minute Ayurvedic spa massage & floral bath',
      'Private sunset catamaran sailing cruise with wine & snacks',
      'Honeymoon cake, bed decoration, and sparkling wine on arrival',
    ],
    excluded: [
      'International flights & visas',
      'Personal alcoholic beverages (beyond included champagne)',
      'Optional aerial helicopter transfers',
    ],
    pricingTiers: [
      { tier: 'Luxury Honeymoon', price: '$1,850 / Couple', description: 'Curated 5-star private pool suites and boutique villas.' },
      { tier: 'Ultra-Luxe Relais & Châteaux', price: '$3,600 / Couple', description: 'Tea Trails, Cape Weligama & Amanwella private residences.' },
    ],
    faqs: [
      {
        question: 'Can we include a professional couples photo shoot?',
        answer:
          'Yes! We can coordinate with our sister studio U1 to arrange a professional lead photographer and 4K cinema drone operator for a sunrise session in Ella or Galle Fort.',
      },
    ],
  },
  {
    id: 'wildlife-safari-unleashed',
    title: 'Wild Sri Lanka: Leopards, Elephants & Whales',
    destination: 'Wilpattu, Minneriya, Yala & Mirissa',
    duration: '8 Days / 7 Nights',
    tagline: 'The Ultimate Big Four Wildlife & Marine Expedition',
    description:
      'Designed for wildlife photographers and nature lovers. Track the Asian Elephant, Leopard, Sloth Bear, and the Blue Whale across Sri Lanka’s premier national parks and marine sanctuaries.',
    heroImage:
      'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    ],
    highlights: [
      '4 Dedicated game drives with expert wildlife naturalists',
      'Wilpattu National Park natural sand-rimmed lakes (Villus)',
      'Yala National Park Block 1 & Block 5 leopard territories',
      'Blue Whale & Spinner Dolphin marine safari off Mirissa',
      'Photography beanbags & high-powered spotting scopes provided',
    ],
    price: '$1,620',
    pricePerPerson: 1620,
    priceNote: 'Per person based on twin sharing',
    availability: 'Best from November to April',
    difficulty: 'Moderate',
    tourType: 'Small Group',
    badge: 'Eco & Wildlife Focus',
    overview:
      'An exhilarating nature odyssey spanning ancient dry-zone forests, elephant gathering grounds, and oceanic trenches where the largest creatures on earth feed.',
    itinerary: [
      {
        day: 1,
        title: 'Arrival & Wilpattu Wilderness Camp',
        location: 'Wilpattu National Park',
        description:
          'Meet your naturalist guide and journey to the untamed wilderness of Wilpattu. Evening night walk around the camp perimeter for nocturnal loris spotting.',
        meals: 'Dinner included',
        stay: 'Mahoora Tented Safari Camp Wilpattu',
      },
      {
        day: 2,
        title: 'Full Day Wilpattu Safari & Leopard Tracking',
        location: 'Wilpattu National Park',
        description:
          'Full-day game drive with packed picnic lunch beside a scenic natural villu lake. Track leopards, spotted deer, barking deer, and endemic hornbills.',
        meals: 'Breakfast, Lunch & Dinner',
        stay: 'Mahoora Tented Safari Camp',
      },
      {
        day: 3,
        title: 'Sigiriya & Minneriya Elephant Gathering',
        location: 'Minneriya',
        description:
          'Travel to the central plains. Afternoon 4x4 safari at Minneriya National Park to observe herds of 150+ wild elephants bathing and grazing.',
        meals: 'Breakfast & Dinner',
        stay: 'Cinnamon Lodge Habarana',
      },
      {
        day: 4,
        title: 'Scenic Highlands Transit to Udawalawe',
        location: 'Udawalawe',
        description:
          'Journey south through scenic mountains. Visit the Elephant Transit Home to watch orphaned baby elephants being bottle-fed by rangers.',
        meals: 'Breakfast & Dinner',
        stay: 'Grand Udawalawe Safari Resort',
      },
      {
        day: 5,
        title: 'Udawalawe Safari & Transfer to Yala',
        location: 'Yala National Park',
        description:
          'Morning safari in Udawalawe across grasslands reminiscent of East Africa. Proceed to Yala for a luxury tented safari stay.',
        meals: 'Breakfast & Dinner',
        stay: 'Jetwing Yala / Cinnamon Wild',
      },
      {
        day: 6,
        title: 'Yala Dawn & Dusk Leopard Safaris',
        location: 'Yala National Park',
        description:
          'Dual game drives (morning and late afternoon) targeting prime leopard and sloth bear activity hours with a seasoned tracker.',
        meals: 'Breakfast, Lunch & Dinner',
        stay: 'Jetwing Yala',
      },
      {
        day: 7,
        title: 'Mirissa Blue Whale Ocean Expedition',
        location: 'Mirissa',
        description:
          'Morning private boat cruise along the southern continental shelf to encounter majestic Blue Whales, Bryde’s Whales, and pods of Spinner Dolphins.',
        meals: 'Breakfast & Dinner',
        stay: 'Weligama Bay Marriott Resort & Spa',
      },
      {
        day: 8,
        title: 'Sea Turtle Hatchery & Departure Transfer',
        location: 'Galle to Colombo Airport',
        description:
          'Visit a coastal sea turtle conservation sanctuary in Kosgoda before your highway transfer to Colombo International Airport.',
        meals: 'Breakfast included',
        stay: 'Departure Transfer',
      },
    ],
    included: [
      '7 Nights in luxury eco-lodges, safari camps, and 5-star beachfront resorts',
      'All 4x4 modified safari jeeps, park entry permits, and government wildlife tracker fees',
      'Private Marine Whale Watching vessel with marine biologist guide',
      'Daily breakfasts and 7 dinners',
      'Professional wildlife photography support and spotter gear',
    ],
    excluded: [
      'International airfare',
      'Sri Lanka visa fees',
      'Gratuities for safari jeep drivers and trackers',
    ],
    pricingTiers: [
      { tier: 'Wild Explorer Tier', price: '$1,620 / Person', description: 'Safari resorts, standard 4x4 open jeeps, and full park permits.' },
      { tier: 'Luxury Naturalist Tier', price: '$2,480 / Person', description: 'All-inclusive tented bush camps, private chef, and expert naturalist.' },
    ],
    faqs: [
      {
        question: 'What is the probability of seeing a leopard?',
        answer:
          'Yala Block 1 has the highest density of leopards in the world. With 2 full game drives, our travelers enjoy an estimated 85%+ success rate in spotting leopards.',
      },
    ],
  },
];

export const DAY_TOURS: DayTour[] = [
  {
    id: 'sigiriya-dambulla-day-tour',
    title: 'Sigiriya Rock & Dambulla Cave Temple Day Excursion',
    location: 'Cultural Triangle',
    duration: 'Full Day (10 - 12 Hours)',
    imageUrl:
      'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=800&q=80',
    description:
      'Climb the 1,200 steps to the 5th-century Sigiriya Sky Citadel, view the ancient frescoes and mirror wall, and explore the golden cave temples of Dambulla.',
    highlights: ['Sigiriya Lion Rock Entry', 'Dambulla 5 Sacred Caves', 'Traditional Village Lunch in Habarana', 'Private AC Chauffeur'],
    price: '$95 / Person',
    included: ['All entry tickets', 'Private AC Transport', 'English Chauffeur Guide', 'Village Lunch'],
  },
  {
    id: 'galle-fort-coastal-day-tour',
    title: 'Galle Dutch Fort, Stilt Fishermen & Turtle Sanctuary',
    location: 'Southern Coast',
    duration: 'Full Day (8 - 10 Hours)',
    imageUrl:
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=800&q=80',
    description:
      'Stroll the UNESCO ramparts of Galle Dutch Fort, witness stilt fishermen in Koggala, take a boat safari on Madu River mangrove tunnels, and visit a sea turtle hatchery.',
    highlights: ['Galle Fort Walking Tour', 'Madu River Mangrove Boat Safari', 'Kosgoda Turtle Conservation Center', 'Stilt Fishermen Twilight Photo Stop'],
    price: '$85 / Person',
    included: ['Private AC Vehicle', 'Madu River Boat Permit', 'Turtle Hatchery Entry', 'Guided Fort Walk'],
  },
  {
    id: 'kandy-tea-cultural-day-tour',
    title: 'Sacred Kandy, Royal Botanical Gardens & Tea Factory',
    location: 'Central Province',
    duration: 'Full Day (9 - 11 Hours)',
    imageUrl:
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=80',
    description:
      'Discover the sacred Temple of the Tooth Relic, stroll through 147 acres of tropical orchids at Peradeniya Gardens, and witness artisanal tea grading at Giragama Tea Estate.',
    highlights: ['Temple of the Sacred Tooth', 'Peradeniya Royal Botanical Gardens', 'Giragama Working Tea Factory', 'Kandyan Gemstone Museum'],
    price: '$90 / Person',
    included: ['All site entries', 'Private transport', 'Tea tasting session', 'Chauffeur guide'],
  },
  {
    id: 'yala-4x4-safari-day-tour',
    title: 'Yala National Park Afternoon 4x4 Leopard Safari',
    location: 'Yala Wilderness',
    duration: 'Half Day (6 Hours)',
    imageUrl:
      'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=800&q=80',
    description:
      'Board an open-roof safari jeep for a thrilling late afternoon safari in Yala National Park, tracking wild leopards, sloth bears, spotted deer, and marsh crocodiles.',
    highlights: ['Private 4x4 Safari Jeep', 'Experienced Wildlife Tracker', 'National Park Entry & Service Fees', 'High Leopard Territory Route'],
    price: '$110 / Person',
    included: ['4x4 Jeep hire', 'Park entry ticket', 'Wildlife tracker', 'Chilled water & snacks'],
  },
];

export const VEHICLES: Vehicle[] = [
  {
    id: 'toyota-prado-luxury-suv',
    name: 'Toyota Land Cruiser Prado (4x4 Luxury SUV)',
    category: 'Luxury Sedan',
    capacity: '3 - 4 Passengers',
    luggage: '3 Large Bags',
    imageUrl:
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    features: ['Plush Leather Seats', 'Dual-Zone Air Conditioning', '4x4 High Ground Clearance', 'On-Board 4G Wi-Fi & USB Chargers'],
    dailyRate: '$120 / Day (Chauffeur-Driven)',
  },
  {
    id: 'toyota-alphard-vip',
    name: 'Toyota Alphard Executive Lounge VIP',
    category: 'VIP Van',
    capacity: '4 - 5 Passengers',
    luggage: '4 Large Bags',
    imageUrl:
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    features: ['Captain Ottoman Reclining Seats', 'Electric Sliding Doors', 'Ultra-Quiet Luxury Cabin', 'Chilled Mini-Fridge'],
    dailyRate: '$160 / Day (Chauffeur-Driven)',
  },
  {
    id: 'toyota-kdh-commuter',
    name: 'Toyota KDH Luxury High-Roof Van',
    category: 'VIP Van',
    capacity: '6 - 9 Passengers',
    luggage: '8 Large Bags',
    imageUrl:
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    features: ['Individual Reclining Seats', 'High Ceiling Airy Cabin', 'Rear Independent AC Controls', 'Spacious Rear Luggage Space'],
    dailyRate: '$95 / Day (Chauffeur-Driven)',
  },
  {
    id: 'toyota-coaster-coach',
    name: 'Toyota Coaster Executive Mini-Coach',
    category: 'Executive Coach',
    capacity: '14 - 22 Passengers',
    luggage: '20 Large Bags',
    imageUrl:
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    features: ['PA Microphone System for Tour Guide', 'Air Suspension Ride', 'Ample Overhead Luggage Compartments', 'Cooler Box & Reading Lights'],
    dailyRate: '$210 / Day (Chauffeur-Driven)',
  },
];

export const TRAVEL_STORIES: TravelStory[] = [
  {
    id: 'story-1',
    title: 'The Blue Train Through the Clouds Was Pure Magic',
    traveler: 'Marcus & Elena Vance',
    origin: 'Melbourne, Australia',
    packageTaken: 'The Grand Ceylon Odyssey (10 Days)',
    quote:
      'Mahdev Travels arranged our private trip flawlessly. Our chauffeur Roshan was not just a driver—he was our protector, storyteller, and spotter. The tea country mist and leopard sighting in Yala will stay in our hearts forever.',
    rating: 5,
    date: 'February 2026',
    image:
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'story-2',
    title: 'Unforgettable Honeymoon in Ella & Tangalle',
    traveler: 'Liam & Sophia Chen',
    origin: 'Singapore',
    packageTaken: 'Ceylon Romance & Tea Trails Honeymoon',
    quote:
      'Every hotel room had a special honeymoon surprise waiting for us. The private sunset catamaran in Mirissa and candlelit dinner in the tea hills were surreal. Truly world-class luxury hospitality.',
    rating: 5,
    date: 'January 2026',
    image:
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'story-3',
    title: 'Photographed 3 Leopards and a Blue Whale in One Week!',
    traveler: 'Dr. Arthur Pendelton',
    origin: 'London, United Kingdom',
    packageTaken: 'Wild Sri Lanka Expedition',
    quote:
      'As an avid wildlife photographer, I was blown away by the knowledge of Mahdev’s naturalist guides. They positioned our 4x4 perfectly for the golden morning light. Highly recommended for serious travelers.',
    rating: 5,
    date: 'March 2026',
    image:
      'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=600&q=80',
  },
];
