/**
 * Google Reviews Integration Types & Data Models
 * Mahdev Group - Google Business Profile / Maps Official Review Synchronization
 * Branches: Trincomalee Branch & Colombo Branch
 */

import { DivisionId } from './firestore';

export type GoogleReviewBranch = 'all' | 'trincomalee' | 'colombo';

export interface GoogleReview {
  id: string; // Document ID / Review ID (e.g., 'gr-12345' or Google review resource name)
  googleReviewId?: string; // Original Google Place review ID
  placeId?: string; // Google Maps Place ID

  // Genuine Google Customer Review Details
  authorName: string; // Customer display name from Google
  authorPhotoUrl?: string; // Google user profile image URL
  authorUrl?: string; // Link to Google user reviewer profile
  rating: number; // 1 - 5 star rating
  text: string; // Original, unaltered review text from Google
  relativePublishTimeDescription?: string; // e.g. "a month ago", "3 weeks ago"
  publishTime?: string; // ISO 8601 string or Unix timestamp
  date?: string; // Formatted year/date string (e.g. "2026")

  // Provenance & Branch Metadata
  source: 'google';
  sourceBadge: 'Google Verified Review';
  branch?: GoogleReviewBranch;
  branchName?: string; // e.g. "Trincomalee Branch" | "Colombo Branch"

  // Admin Portal Curation (Never alters original review content)
  isFeatured: boolean; // Featured on landing page
  isHidden: boolean; // Hidden by admin without altering original Google review
  divisionId?: DivisionId | 'all'; // Linked operating division (e.g. 'sws', 'u1', 'it', 'travels', 'mart', 'all')
  divisionName?: string;
  adminNotes?: string;
  order?: number;

  createdAt: string;
  updatedAt: string;
}

export interface GoogleBranchProfile {
  id: 'trincomalee' | 'colombo';
  name: string;
  address: string;
  mapsUrl: string;
  writeReviewUrl: string;
  placeId?: string;
  rating: number;
  totalReviews: number;
}

export interface GoogleReviewsConfig {
  placeId: string; // Google Maps Place ID
  apiKey?: string; // Optional custom Google Maps Platform API Key
  businessName: string; // e.g. "Mahdev Pvt Ltd / SWS Event Management"
  formattedAddress?: string; // e.g. "Colombo & Trincomalee, Sri Lanka"
  mapsUrl: string; // Official Google Maps place URL
  writeReviewUrl: string; // Direct link to write a review on Google
  overallRating: number; // Google average rating (e.g. 5.0)
  totalReviews: number; // Total user reviews count on Google Maps

  // Branch Specific Google Business Profile URLs
  trincomaleeMapsUrl: string;
  trincomaleeWriteReviewUrl: string;
  colomboMapsUrl: string;
  colomboWriteReviewUrl: string;
  
  // Website Display Controls
  enabled: boolean; // Enable/disable Google Reviews section on public website
  maxDisplayCount: number; // Max reviews shown on Landing Page (e.g. 6)
  minStarRating: number; // Minimum stars to show on public site (e.g. 4)
  featuredOnly: boolean; // Only display reviews marked as isFeatured
  defaultBranchFilter?: GoogleReviewBranch;

  // Synchronization Metadata
  lastSyncedAt: string | null;
  syncStatus: 'synced' | 'syncing' | 'idle' | 'error';
  errorMessage?: string;
  autoSyncEnabled?: boolean;
}
