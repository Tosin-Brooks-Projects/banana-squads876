import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
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
    db: getFirestore(),
  };
}

interface ExportData {
  exportedAt: string;
  user: Record<string, unknown> | null;
  surveys: Array<{
    survey: Record<string, unknown>;
    responses: Record<string, unknown>[];
    partialResponses: Record<string, unknown>[];
  }>;
  usernameRedirects: Record<string, unknown>[];
}

export async function GET(request: NextRequest) {
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

    const { db } = getFirebaseAdmin();
    const userId = user.uid;

    const exportData: ExportData = {
      exportedAt: new Date().toISOString(),
      user: null,
      surveys: [],
      usernameRedirects: [],
    };

    // 1. Get user profile
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      exportData.user = {
        id: userDoc.id,
        ...userData,
      };
    }

    // 2. Get all surveys owned by this user
    const surveysSnapshot = await db
      .collection('surveys')
      .where('userId', '==', userId)
      .get();

    for (const surveyDoc of surveysSnapshot.docs) {
      const surveyData = surveyDoc.data();
      const surveyId = surveyDoc.id;

      // Get all responses for this survey
      const responsesSnapshot = await db
        .collection('responses')
        .where('surveyId', '==', surveyId)
        .get();

      const responses = responsesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Get all partial responses for this survey
      const partialResponsesSnapshot = await db
        .collection('partialResponses')
        .where('surveyId', '==', surveyId)
        .get();

      const partialResponses = partialResponsesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      exportData.surveys.push({
        survey: {
          id: surveyId,
          ...surveyData,
        },
        responses,
        partialResponses,
      });
    }

    // 3. Get username redirects
    const redirectsSnapshot = await db
      .collection('username_redirects')
      .where('userId', '==', userId)
      .get();

    exportData.usernameRedirects = redirectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Return as JSON with proper headers for download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });

  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data. Please try again or contact support.' },
      { status: 500 }
    );
  }
}
