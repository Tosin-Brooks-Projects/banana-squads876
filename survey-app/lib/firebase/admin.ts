import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let auth: Auth;
let db: Firestore;

function getFirebaseAdmin() {
  if (getApps().length === 0) {
    // In production, use service account credentials
    // In development, can use application default credentials
    let serviceAccount: Record<string, unknown> | undefined;

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountKey) {
      try {
        serviceAccount = JSON.parse(serviceAccountKey);
      } catch (parseError) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', parseError);
      }
    }

    if (serviceAccount) {
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      // Fallback for development - requires GOOGLE_APPLICATION_CREDENTIALS env var
      // or running in a Google Cloud environment
      app = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  } else {
    app = getApps()[0];
  }

  auth = getAuth(app);
  db = getFirestore(app);
  return { app, auth, db };
}

export async function verifyAuthToken(authHeader: string | null): Promise<{
  uid: string;
  email?: string;
} | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1];
  if (!token) {
    return null;
  }

  try {
    const { auth } = getFirebaseAdmin();
    const decodedToken = await auth.verifyIdToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Get survey using Admin SDK (bypasses security rules)
export async function getSurveyAdmin(surveyId: string): Promise<{
  id: string;
  userId: string;
  title: string;
  status: string;
  paymentStatus?: string;
  pricingTier?: string;
  paymentId?: string;
} | null> {
  try {
    const { db } = getFirebaseAdmin();
    const docRef = db.collection('surveys').doc(surveyId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) return null;

    const data = docSnap.data();
    if (!data) return null;

    return {
      id: docSnap.id,
      userId: data.userId,
      title: data.title,
      status: data.status,
      paymentStatus: data.paymentStatus,
      pricingTier: data.pricingTier,
      paymentId: data.paymentId,
    };
  } catch (error) {
    console.error('Error getting survey with Admin SDK:', error);
    return null;
  }
}

// Update survey using Admin SDK (bypasses security rules)
export async function updateSurveyAdmin(surveyId: string, updates: Record<string, unknown>): Promise<boolean> {
  try {
    const { db } = getFirebaseAdmin();
    const docRef = db.collection('surveys').doc(surveyId);
    await docRef.update({
      ...updates,
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error updating survey with Admin SDK:', error);
    return false;
  }
}
