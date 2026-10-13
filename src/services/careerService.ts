import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from '../lib/tursoFirestore';
import { db, sanitizeForFirestore } from '../lib/firebase';

export type CareerOpeningStatus = 'draft' | 'published' | 'closed';
export type CareerApplicationStatus = 'new' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';

export interface CareerOpening {
  id: string;
  title: string;
  divisionId: string;
  location: string;
  employmentType: string;
  experience: string;
  description: string;
  responsibilities?: string[];
  status: CareerOpeningStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CareerApplication {
  id: string;
  openingId: string;
  candidateName: string;
  email: string;
  phone: string;
  portfolioUrl?: string;
  coverLetter?: string;
  cvStoragePath: string;
  cvFileName: string;
  status: CareerApplicationStatus;
  createdAt: string;
}

const OPENINGS = 'careerOpenings';
const APPLICATIONS = 'careerApplications';

export async function getPublishedCareerOpenings(): Promise<CareerOpening[]> {
  const snapshot = await getDocs(query(
    collection(db, OPENINGS),
    where('status', '==', 'published'),
    orderBy('createdAt', 'desc'),
    limit(100)
  ));
  return snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id } as CareerOpening));
}

export async function getCareerOpeningsForAdmin(): Promise<CareerOpening[]> {
  const snapshot = await getDocs(query(collection(db, OPENINGS), orderBy('createdAt', 'desc'), limit(250)));
  return snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id } as CareerOpening));
}

export async function getCareerApplications(): Promise<CareerApplication[]> {
  const snapshot = await getDocs(query(
    collection(db, APPLICATIONS),
    orderBy('createdAt', 'desc'),
    limit(500)
  ));
  return snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id } as CareerApplication));
}

export async function saveCareerOpening(
  opening: Omit<CareerOpening, 'createdAt' | 'updatedAt'>,
  existingCreatedAt?: string
): Promise<void> {
  const now = new Date().toISOString();
  await setDoc(doc(db, OPENINGS, opening.id), sanitizeForFirestore({
    ...opening,
    createdAt: existingCreatedAt || now,
    updatedAt: now,
  }), { merge: true });
}

export async function deleteCareerOpening(id: string): Promise<void> {
  await deleteDoc(doc(db, OPENINGS, id));
}

export async function updateCareerApplicationStatus(
  id: string,
  status: CareerApplicationStatus
): Promise<void> {
  await updateDoc(doc(db, APPLICATIONS, id), { status });
}

export async function uploadCareerCv(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension !== 'pdf' || (file.type && file.type !== 'application/pdf')) {
    throw new Error('Choose a PDF CV.');
  }
  if (!file.size || file.size > 10 * 1024 * 1024) {
    throw new Error('CV files must be no larger than 10 MB.');
  }

  const response = await fetch('/api/careers/cv', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'X-CV-Filename': encodeURIComponent(file.name),
    },
    body: file,
  });
  const result = await response.json() as { success?: boolean; storagePath?: string; error?: string };
  if (!response.ok || !result.success || !result.storagePath) {
    throw new Error(result.error || `CV upload failed (HTTP ${response.status}).`);
  }
  return result.storagePath;
}

export async function submitCareerApplication(
  opening: CareerOpening,
  application: {
    candidateName: string;
    email: string;
    phone: string;
    portfolioUrl: string;
    coverLetter: string;
    cvStoragePath: string;
    cvFileName: string;
  }
): Promise<string> {
  const id = crypto.randomUUID();
  await setDoc(doc(db, APPLICATIONS, id), sanitizeForFirestore({
    openingId: opening.id,
    candidateName: application.candidateName,
    email: application.email,
    phone: application.phone,
    portfolioUrl: application.portfolioUrl,
    coverLetter: application.coverLetter,
    cvStoragePath: application.cvStoragePath,
    cvFileName: application.cvFileName,
  }));
  return id;
}

export interface CareerApplicationStatusResult {
  status: CareerApplicationStatus;
  createdAt: string;
  openingTitle: string;
}

export async function lookupCareerApplicationStatus(
  email: string,
  reference: string
): Promise<CareerApplicationStatusResult> {
  const params = new URLSearchParams({ email: email.trim(), reference: reference.trim() });
  const response = await fetch(`/api/careers/status?${params}`, {
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const result = await response.json() as {
    success?: boolean;
    application?: CareerApplicationStatusResult;
    error?: string;
  };
  if (!response.ok || !result.success || !result.application) {
    throw new Error(result.error || `Application status lookup failed (HTTP ${response.status}).`);
  }
  return result.application;
}

export async function deleteCareerApplication(id: string): Promise<string | null> {
  const response = await fetch(`/api/careers/application?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const result = await response.json() as {
    success?: boolean;
    cleanupWarning?: string;
    error?: string;
  };
  if (!response.ok || !result.success) {
    throw new Error(result.error || `Application deletion failed (HTTP ${response.status}).`);
  }
  return result.cleanupWarning || null;
}

export function getCareerCvUrl(applicationId: string): string {
  return `/api/careers/cv?id=${encodeURIComponent(applicationId)}`;
}
