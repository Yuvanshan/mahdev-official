import { FirestoreProduct } from '../../types/firestore';
import { ProductOptionGroup } from '../../types/catalog';
import { BIRTHDAY_PARTY_CATEGORY } from './birthdayPartyCategory';

const birthdayImages = {
  balloon: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
  foil: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80',
  candle: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
  banner: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80',
  topper: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
  plates: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
  cups: 'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=800&q=80',
  hats: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
  swirls: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80',
  favors: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
} as const;

const themes = [
  { slug: 'pastel-rainbow', name: 'Pastel Rainbow', colors: ['Pastel Pink', 'Butter Yellow', 'Sky Blue', 'Mint Green'] },
  { slug: 'rose-gold', name: 'Rose Gold', colors: ['Rose Gold', 'Blush Pink', 'White', 'Gold'] },
  { slug: 'royal-blue-gold', name: 'Royal Blue & Gold', colors: ['Royal Blue', 'Gold', 'White', 'Navy'] },
  { slug: 'hot-pink-glam', name: 'Hot Pink Glam', colors: ['Hot Pink', 'Magenta', 'Silver', 'White'] },
  { slug: 'sage-garden', name: 'Sage Garden', colors: ['Sage Green', 'Cream', 'Gold', 'White'] },
  { slug: 'safari-jungle', name: 'Safari Jungle', colors: ['Leaf Green', 'Gold', 'Brown', 'Orange'] },
  { slug: 'space-explorer', name: 'Space Explorer', colors: ['Navy', 'Silver', 'Purple', 'Black'] },
  { slug: 'unicorn-dream', name: 'Unicorn Dream', colors: ['Lavender', 'Pink', 'Iridescent', 'White'] },
  { slug: 'dinosaur-adventure', name: 'Dinosaur Adventure', colors: ['Dinosaur Green', 'Orange', 'Brown', 'Yellow'] },
  { slug: 'classic-black-gold', name: 'Classic Black & Gold', colors: ['Black', 'Gold', 'White', 'Silver'] },
] as const;

const numberChoices = Array.from({ length: 10 }, (_, number) => String(number));
const ageChoices = Array.from({ length: 18 }, (_, index) => String(index + 1));

const productTypes = [
  {
    slug: 'balloon-garland-kit',
    name: 'Balloon Garland Kit',
    image: birthdayImages.balloon,
    price: 3250,
    pack: '48 assorted latex balloons, decorating strip and adhesive dots',
    options: (colors: readonly string[]): ProductOptionGroup[] => [
      { id: 'color', name: 'Color', options: [...colors] },
      { id: 'pack-size', name: 'Pack Size', options: ['24-piece kit', '48-piece kit', '72-piece kit'] },
    ],
  },
  {
    slug: 'foil-number-balloon',
    name: 'Foil Number Balloon',
    image: birthdayImages.foil,
    price: 950,
    pack: 'One reusable self-sealing foil number balloon; inflation straw included',
    options: (colors: readonly string[]): ProductOptionGroup[] => [
      { id: 'number', name: 'Number', options: [...numberChoices] },
      { id: 'color', name: 'Color', options: [...colors] },
    ],
  },
  {
    slug: 'birthday-candle-set',
    name: 'Birthday Number Candle Set',
    image: birthdayImages.candle,
    price: 650,
    pack: 'One decorative number candle with a food-safe pick',
    options: (colors: readonly string[]): ProductOptionGroup[] => [
      { id: 'number', name: 'Number', options: [...numberChoices] },
      { id: 'color', name: 'Color', options: [...colors] },
    ],
  },
  {
    slug: 'birthday-banner',
    name: 'Happy Birthday Banner',
    image: birthdayImages.banner,
    price: 1450,
    pack: 'One reusable birthday banner with hanging cord',
    options: (colors: readonly string[]): ProductOptionGroup[] => [
      { id: 'color', name: 'Color', options: [...colors] },
      { id: 'banner-length', name: 'Banner Length', options: ['2 metres', '3 metres'] },
    ],
  },
  {
    slug: 'number-cake-topper',
    name: 'Number Cake Topper',
    image: birthdayImages.topper,
    price: 850,
    pack: 'One food-contact-safe acrylic topper with protective film',
    options: (colors: readonly string[]): ProductOptionGroup[] => [
      { id: 'number', name: 'Number', options: [...ageChoices] },
      { id: 'color', name: 'Color', options: [...colors] },
    ],
  },
  {
    slug: 'paper-plate-set',
    name: 'Birthday Paper Plate Set',
    image: birthdayImages.plates,
    price: 1250,
    pack: 'Disposable paper plates for serving cake and party snacks',
    options: (_colors: readonly string[]): ProductOptionGroup[] => [
      { id: 'pack-size', name: 'Pack Size', options: ['8 plates', '16 plates', '24 plates'] },
    ],
  },
  {
    slug: 'party-cup-set',
    name: 'Birthday Party Cup Set',
    image: birthdayImages.cups,
    price: 1150,
    pack: 'Disposable party cups for cold drinks',
    options: (_colors: readonly string[]): ProductOptionGroup[] => [
      { id: 'pack-size', name: 'Pack Size', options: ['8 cups', '16 cups', '24 cups'] },
    ],
  },
  {
    slug: 'party-hat-set',
    name: 'Birthday Party Hat Set',
    image: birthdayImages.hats,
    price: 1350,
    pack: 'Lightweight cone hats with soft elastic bands',
    options: (colors: readonly string[]): ProductOptionGroup[] => [
      { id: 'color', name: 'Color', options: [...colors] },
      { id: 'pack-size', name: 'Pack Size', options: ['4 hats', '8 hats', '12 hats'] },
    ],
  },
  {
    slug: 'hanging-swirl-set',
    name: 'Hanging Swirl Decoration Set',
    image: birthdayImages.swirls,
    price: 1550,
    pack: 'Lightweight hanging ceiling swirls with reusable hooks',
    options: (colors: readonly string[]): ProductOptionGroup[] => [
      { id: 'color', name: 'Color', options: [...colors] },
      { id: 'pack-size', name: 'Pack Size', options: ['6 pieces', '12 pieces', '18 pieces'] },
    ],
  },
  {
    slug: 'party-favor-bag-set',
    name: 'Birthday Party Favor Bag Set',
    image: birthdayImages.favors,
    price: 1750,
    pack: 'Paper favor bags for sweets, small gifts and thank-you treats',
    options: (colors: readonly string[]): ProductOptionGroup[] => [
      { id: 'color', name: 'Color', options: [...colors] },
      { id: 'pack-size', name: 'Pack Size', options: ['6 bags', '12 bags', '24 bags'] },
    ],
  },
  {
    slug: 'spiral-birthday-candle-set',
    name: 'Spiral Birthday Candle Set',
    image: birthdayImages.candle,
    price: 550,
    pack: 'Ten colourful spiral cake candles with reusable holders',
    options: (colors: readonly string[]): ProductOptionGroup[] => [
      { id: 'color', name: 'Color', options: [...colors] },
      { id: 'pack-size', name: 'Pack Size', options: ['5 candles', '10 candles', '20 candles'] },
    ],
  },
  {
    slug: 'latex-birthday-balloon-pack',
    name: 'Latex Birthday Balloon Pack',
    image: birthdayImages.balloon,
    price: 1200,
    pack: 'Assorted latex balloons for home birthday decorations',
    options: (colors: readonly string[]): ProductOptionGroup[] => [
      { id: 'color', name: 'Color', options: [...colors] },
      { id: 'pack-size', name: 'Pack Size', options: ['10 balloons', '25 balloons', '50 balloons'] },
    ],
  },
  {
    slug: 'paper-confetti-popper-set',
    name: 'Paper Confetti Party Popper Set',
    image: birthdayImages.favors,
    price: 1450,
    pack: 'Hand-operated paper confetti poppers for supervised indoor celebrations; no pyrotechnics',
    options: (_colors: readonly string[]): ProductOptionGroup[] => [
      { id: 'pack-size', name: 'Pack Size', options: ['2 poppers', '4 poppers', '6 poppers'] },
      { id: 'confetti-color', name: 'Confetti Color', options: ['Pastel Mix', 'Gold & Silver', 'Rainbow'] },
    ],
  },
  {
    slug: 'hand-balloon-pump-kit',
    name: 'Hand Balloon Pump Kit',
    image: birthdayImages.balloon,
    price: 950,
    pack: 'Reusable hand pump with assorted party balloons',
    options: (_colors: readonly string[]): ProductOptionGroup[] => [
      { id: 'kit-size', name: 'Kit Size', options: ['Pump + 10 balloons', 'Pump + 25 balloons'] },
    ],
  },
  {
    slug: 'happy-birthday-foil-balloon',
    name: 'Happy Birthday Foil Balloon',
    image: birthdayImages.foil,
    price: 1250,
    pack: 'Reusable self-sealing Happy Birthday foil balloon; inflation straw included',
    options: (colors: readonly string[]): ProductOptionGroup[] => [
      { id: 'color', name: 'Color', options: [...colors] },
      { id: 'shape', name: 'Shape', options: ['Round', 'Star', 'Heart'] },
    ],
  },
] as const;

const createdAt = '2026-11-06T00:00:00.000Z';

export const BIRTHDAY_PARTY_PRODUCTS: FirestoreProduct[] = themes.flatMap((theme, themeIndex) =>
  productTypes.map((productType, typeIndex) => {
    const name = `${theme.name} ${productType.name}`;
    const slug = `${theme.slug}-${productType.slug}`;
    const image = productType.image;
    const sku = `MD-BDAY-${String(themeIndex + 1).padStart(2, '0')}${String(typeIndex + 1).padStart(2, '0')}`;
    const description = `${name} for birthdays and family celebrations. Includes ${productType.pack.toLowerCase()}. Theme colors: ${theme.colors.join(', ')}. Please confirm final dimensions, pack quantity and available stock before publishing.`;
    return {
      id: `birthday-${slug}`,
      sku,
      name,
      slug,
      division: 'mart',
      divisionId: 'mart',
      categoryId: BIRTHDAY_PARTY_CATEGORY.id,
      description,
      shortDescription: `${productType.pack}. ${theme.name} birthday theme.`,
      color: theme.colors[0],
      optionGroups: productType.options(theme.colors),
      specifications: {
        Theme: theme.name,
        'Pack Contents': productType.pack,
        'Product Image': 'Sample image; replace with a photo of the exact product before publishing.',
      },
      price: productType.price,
      currency: 'LKR',
      compareAtPrice: productType.price,
      images: [image],
      imageUrl: image,
      galleryImages: [image],
      stock: 0,
      stockQuantity: 0,
      isAvailable: false,
      isPublished: false,
      status: 'draft',
      hasVariants: false,
      tags: ['Birthday', 'Party Supplies', theme.name, productType.name],
      imageAlt: `${name} birthday party decoration`,
      seoDescription: `${name} birthday party supplies from Mahdev Mart in Sri Lanka.`,
      createdAt,
      updatedAt: createdAt,
    };
  })
);
