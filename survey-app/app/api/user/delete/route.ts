import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { verifyAuthToken } from '@/lib/firebase/admin';

// Initialize Firebase Admin
function getFirebaseAdmin() {
  if (getApps().length === 0) {
    let serviceAccount: Record<string, unknown> | undefined;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      } catch {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY');
      }
    }

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  }

  return {
    auth: getAuth(),
    db: getFirestore(),
  };
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const user = await verifyAuthToken(authHeader);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { db, auth } = getFirebaseAdmin();
    const userId = user.uid;

    // Use batched writes for efficiency (Firestore limits to 500 operations per batch)
    const batchSize = 500;

    // 1. Get all surveys owned by this user
    const surveysSnapshot = await db
      .collection('surveys')
      .where('userId', '==', userId)
      .get();

    const surveyIds = surveysSnapshot.docs.map(doc => doc.id);

    // 2. Delete all responses for each survey
    for (const surveyId of surveyIds) {
      const responsesSnapshot = await db
        .collection('responses')
        .where('surveyId', '==', surveyId)
        .get();

      // Delete responses in batches
      const responseDocs = responsesSnapshot.docs;
      for (let i = 0; i < responseDocs.length; i += batchSize) {
        const batch = db.batch();
        const chunk = responseDocs.slice(i, i + batchSize);
        chunk.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }

      // 3. Delete partial responses for this survey
      const partialResponsesSnapshot = await db
        .collection('partialResponses')
        .where('surveyId', '==', surveyId)
        .get();

      const partialDocs = partialResponsesSnapshot.docs;
      for (let i = 0; i < partialDocs.length; i += batchSize) {
        const batch = db.batch();
        const chunk = partialDocs.slice(i, i + batchSize);
        chunk.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
    }

    // 4. Delete all surveys in batches
    for (let i = 0; i < surveysSnapshot.docs.length; i += batchSize) {
      const batch = db.batch();
      const chunk = surveysSnapshot.docs.slice(i, i + batchSize);
      chunk.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // 5. Delete username redirects created by this user
    const redirectsSnapshot = await db
      .collection('username_redirects')
      .where('userId', '==', userId)
      .get();

    for (let i = 0; i < redirectsSnapshot.docs.length; i += batchSize) {
      const batch = db.batch();
      const chunk = redirectsSnapshot.docs.slice(i, i + batchSize);
      chunk.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // 6. Delete the user document from Firestore
    await db.collection('users').doc(userId).delete();

    // 7. Delete the Firebase Auth user account
    await auth.deleteUser(userId);

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
      deletedData: {
        surveys: surveyIds.length,
        userId: userId,
      },
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account. Please try again or contact support.' },
      { status: 500 }
    );
  }
}
