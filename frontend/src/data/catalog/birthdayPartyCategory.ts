import { FirestoreCategory } from '../../types/firestore';

const createdAt = '2026-11-06T00:00:00.000Z';

export const BIRTHDAY_PARTY_CATEGORY: FirestoreCategory = {
  id: 'birthday-party-supplies',
  name: 'Birthday Party Supplies',
  slug: 'birthday-party-supplies',
  description: 'Editable starter range of birthday decorations, tableware, number balloons, candles and party favors.',
  imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
  order: 2,
  division: 'mart',
  divisionId: 'mart',
  itemCount: 100,
  iconName: 'Gift',
  status: 'active',
  isPublished: true,
  createdAt,
  updatedAt: createdAt,
};
