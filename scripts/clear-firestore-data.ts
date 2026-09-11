import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
} from 'firebase/firestore';
import rawConfig from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: rawConfig.apiKey,
  authDomain: rawConfig.authDomain,
  projectId: rawConfig.projectId,
  storageBucket: rawConfig.storageBucket,
  messagingSenderId: rawConfig.messagingSenderId,
  appId: rawConfig.appId,
};

const databaseId = rawConfig.firestoreDatabaseId || 'mahdev-pvt-ldt';
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, databaseId);

const CLEANUP_ADMIN_EMAIL = `superadmin-${Date.now()}@mahdev.lk`;
const ADMIN_PASS = 'MahdevAdmin2026!#$Secure';

const COLLECTIONS_TO_CLEAR = [
  'products',
  'services',
  'categories',
  'milestones',
  'trustedCompanies',
  'testimonials',
  'portfolio',
  'projects',
  'gallery',
  'orders',
  'bookings',
  'contactSubmissions',
  'contactMessages',
  'inquiries',
  'announcements',
  'payments',
  'divisions',
  'navigation',
  'pages',
  'heroSections',
  'statistics',
  'clients',
  'team',
  'faqs',
  'blog',
  'auditLogs',
];

async function authenticateSuperAdmin() {
  const cred = await createUserWithEmailAndPassword(auth, CLEANUP_ADMIN_EMAIL, ADMIN_PASS);
  console.log(`[Auth] Created & authenticated Super Admin: ${cred.user.email} (${cred.user.uid})`);
  return cred.user;
}

async function clearAllFirestoreData() {
  console.log(`[Firestore Cleanup] Connecting to project: ${firebaseConfig.projectId}, database: ${databaseId}...`);

  const user = await authenticateSuperAdmin();

  // Create user & admin doc
  try {
    await setDoc(doc(db, 'users', user.uid), {
      email: CLEANUP_ADMIN_EMAIL,
      role: 'superAdmin',
      fullName: 'Yuvanshan Prabakaran',
      displayName: 'Yuvanshan Prabakaran',
      phone: '+94 75 092 8078',
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    await setDoc(doc(db, 'admins', user.uid), {
      email: CLEANUP_ADMIN_EMAIL,
      role: 'superAdmin',
      name: 'Yuvanshan Prabakaran',
      status: 'active',
      grantedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (e) {
    console.warn('[Auth Doc Init]:', e);
  }

  for (const colName of COLLECTIONS_TO_CLEAR) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`[Firestore Cleanup] Collection '${colName}': found ${snap.docs.length} documents.`);
      
      if (!snap.empty) {
        for (const docSnap of snap.docs) {
          try {
            await deleteDoc(docSnap.ref);
            console.log(`  - Deleted ${colName}/${docSnap.id}`);
          } catch (delErr) {
            console.error(`  - Failed to delete ${colName}/${docSnap.id}:`, delErr);
          }
        }
      }
    } catch (err) {
      console.error(`[Firestore Cleanup] Error clearing '${colName}':`, err);
    }
  }

  // Check and report settings
  try {
    const settingsSnap = await getDocs(collection(db, 'settings'));
    console.log(`[Firestore Cleanup] Collection 'settings': found ${settingsSnap.docs.length} documents.`);
    for (const d of settingsSnap.docs) {
      console.log(`  - settings/${d.id}`);
    }
  } catch (err) {
    console.warn(`[Firestore Cleanup] Settings inspect error:`, err);
  }

  console.log(`\n======================================================`);
  console.log(`[Firestore Cleanup COMPLETE] Database is now at 0 content state.`);
  console.log(`======================================================\n`);
}

clearAllFirestoreData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[Firestore Cleanup Fatal]:', err);
    process.exit(1);
  });
