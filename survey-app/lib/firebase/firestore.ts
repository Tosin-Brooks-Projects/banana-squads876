import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  addDoc,
  onSnapshot,
  getCountFromServer,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import { User, Survey, SurveyResponse, Answer, ResponseMetadata, SurveyQuickStats, PartialResponse } from '@/lib/types';

// User operations
export async function createUser(user: User): Promise<void> {
  await setDoc(doc(db, 'users', user.id), {
    ...user,
    createdAt: Timestamp.fromDate(user.createdAt),
    updatedAt: Timestamp.fromDate(user.updatedAt),
  });
}

export async function getUser(userId: string): Promise<User | null> {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  } as User;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const q = query(collection(db, 'users'), where('username', '==', username), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  } as User;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<void> {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  const user = await getUserByUsername(username);
  return user !== null;
}

// Get user by a previous username (for redirect handling)
// Returns the user and their current username if found, null otherwise
export async function getUserByPreviousUsername(previousUsername: string): Promise<{ user: User; currentUsername: string } | null> {
  const normalizedPrevious = previousUsername.toLowerCase();

  // First, check the username_redirects collection for efficient lookup
  const redirectDoc = await getDoc(doc(db, 'username_redirects', normalizedPrevious));

  if (redirectDoc.exists()) {
    const redirectData = redirectDoc.data();
    const expiresAt = redirectData.expiresAt?.toDate();

    // Check if redirect is still valid
    if (expiresAt && new Date() < expiresAt) {
      const userData = await getUser(redirectData.userId);
      if (userData && userData.username) {
        return {
          user: userData,
          currentUsername: userData.username,
        };
      }
    }
  }

  // The username_redirects collection is the authoritative source for redirects.
  // Legacy data without redirect entries will not be found, which is acceptable
  // as username changes should always create redirect entries going forward.
  return null;
}

// Create a username redirect entry for efficient lookups
export async function createUsernameRedirect(
  oldUsername: string,
  userId: string,
  expiresAt: Date
): Promise<void> {
  const normalizedUsername = oldUsername.toLowerCase();
  await setDoc(doc(db, 'username_redirects', normalizedUsername), {
    userId,
    oldUsername,
    expiresAt: Timestamp.fromDate(expiresAt),
    createdAt: Timestamp.now(),
  });
}

// Reserved usernames that cannot be used
export const RESERVED_USERNAMES = [
  'admin',
  'dashboard',
  'api',
  'login',
  'logout',
  'signup',
  'signin',
  'register',
  'settings',
  'profile',
  'account',
  'help',
  'support',
  'about',
  'contact',
  'terms',
  'privacy',
  'onboarding',
  'create',
  'edit',
  'delete',
  'new',
  'test',
  'demo',
  'example',
  'user',
  'users',
  'survey',
  'surveys',
  'app',
  'www',
  'mail',
  'email',
  'blog',
  'docs',
  'status',
  'static',
  'assets',
  'public',
  'private',
  'root',
  'system',
  'null',
  'undefined',
];

export function isUsernameReserved(username: string): boolean {
  return RESERVED_USERNAMES.includes(username.toLowerCase());
}

// Survey operations
export async function createSurvey(survey: Omit<Survey, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'surveys'), {
    ...survey,
    createdAt: Timestamp.fromDate(survey.createdAt),
    updatedAt: Timestamp.fromDate(survey.updatedAt),
    publishedAt: survey.publishedAt ? Timestamp.fromDate(survey.publishedAt) : null,
    responseCount: 0,
  });
  return docRef.id;
}

// Create a free survey (unlimited free surveys allowed)
export async function createFreeSurveyAtomic(
  userId: string,
  survey: Omit<Survey, 'id'>
): Promise<string> {
  const surveyRef = doc(collection(db, 'surveys'));

  await setDoc(surveyRef, {
    ...survey,
    createdAt: Timestamp.fromDate(survey.createdAt),
    updatedAt: Timestamp.fromDate(survey.updatedAt),
    publishedAt: survey.publishedAt ? Timestamp.fromDate(survey.publishedAt) : null,
    responseCount: 0,
  });

  return surveyRef.id;
}

// Legacy error class kept for backwards compatibility
export class FreeTierAlreadyUsedError extends Error {
  constructor() {
    super('Free tier already used');
    this.name = 'FreeTierAlreadyUsedError';
  }
}

export async function getSurvey(surveyId: string): Promise<Survey | null> {
  const docRef = doc(db, 'surveys', surveyId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    publishedAt: data.publishedAt?.toDate(),
  } as Survey;
}

export async function getSurveyBySlug(userId: string, slug: string): Promise<Survey | null> {
  const q = query(
    collection(db, 'surveys'),
    where('userId', '==', userId),
    where('slug', '==', slug),
    limit(1)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    publishedAt: data.publishedAt?.toDate(),
  } as Survey;
}

export async function checkSlugExists(userId: string, slug: string): Promise<boolean> {
  const survey = await getSurveyBySlug(userId, slug);
  return survey !== null;
}

export async function generateUniqueSlug(userId: string, baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await checkSlugExists(userId, slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
    if (counter > 100) {
      // Fallback to timestamp-based slug
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  return slug;
}

export async function getSuggestedSlugs(userId: string, baseSlug: string): Promise<string[]> {
  const suggestions: string[] = [];

  // Try numbered variants
  for (let i = 1; i <= 3; i++) {
    const slug = `${baseSlug}-${i}`;
    if (!(await checkSlugExists(userId, slug))) {
      suggestions.push(slug);
    }
  }

  // Try with current year
  const year = new Date().getFullYear();
  const yearSlug = `${baseSlug}-${year}`;
  if (!(await checkSlugExists(userId, yearSlug))) {
    suggestions.push(yearSlug);
  }

  // Try with "new" prefix
  const newSlug = `new-${baseSlug}`;
  if (!(await checkSlugExists(userId, newSlug))) {
    suggestions.push(newSlug);
  }

  return suggestions.slice(0, 3);
}

export async function getUserSurveys(userId: string): Promise<Survey[]> {
  const q = query(
    collection(db, 'surveys'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      publishedAt: data.publishedAt?.toDate(),
    } as Survey;
  });
}

export async function updateSurvey(surveyId: string, updates: Partial<Survey>): Promise<void> {
  const docRef = doc(db, 'surveys', surveyId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteSurvey(surveyId: string): Promise<void> {
  const batchSize = 500;

  // 1. Delete all responses for this survey
  const responsesSnapshot = await getDocs(
    query(collection(db, 'responses'), where('surveyId', '==', surveyId))
  );

  const responseDocs = responsesSnapshot.docs;
  for (let i = 0; i < responseDocs.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = responseDocs.slice(i, i + batchSize);
    chunk.forEach(responseDoc => batch.delete(responseDoc.ref));
    await batch.commit();
  }

  // 2. Delete all partial responses for this survey
  const partialResponsesSnapshot = await getDocs(
    query(collection(db, 'partialResponses'), where('surveyId', '==', surveyId))
  );

  const partialDocs = partialResponsesSnapshot.docs;
  for (let i = 0; i < partialDocs.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = partialDocs.slice(i, i + batchSize);
    chunk.forEach(partialDoc => batch.delete(partialDoc.ref));
    await batch.commit();
  }

  // 3. Delete the survey itself
  await deleteDoc(doc(db, 'surveys', surveyId));
}

// Response operations
export interface CreateResponseData {
  respondentName?: string;
  respondentEmail?: string;
  answers: Answer[];
}

export class ResponseLimitExceededError extends Error {
  constructor() {
    super('Response limit exceeded');
    this.name = 'ResponseLimitExceededError';
  }
}

export async function createResponse(
  surveyId: string,
  responseData: CreateResponseData,
  metadata?: Partial<ResponseMetadata>,
  responseLimit?: number
): Promise<string> {
  const responseDoc = {
    surveyId,
    respondentName: responseData.respondentName || null,
    respondentEmail: responseData.respondentEmail || null,
    answers: responseData.answers,
    completedAt: Timestamp.now(),
    metadata: {
      completionTime: metadata?.completionTime || 0,
      userAgent: metadata?.userAgent || null,
      ipAddress: metadata?.ipAddress || null,
    },
  };

  // If no response limit, just add the document directly
  if (!responseLimit) {
    const docRef = await addDoc(collection(db, 'responses'), responseDoc);
    return docRef.id;
  }

  // Use a transaction with the survey document's responseCount field
  const newDocRef = doc(collection(db, 'responses'));
  const surveyRef = doc(db, 'surveys', surveyId);

  await runTransaction(db, async (transaction) => {
    // Read the survey document to get current count
    const surveyDoc = await transaction.get(surveyRef);

    if (!surveyDoc.exists()) {
      throw new Error('Survey not found');
    }

    const surveyData = surveyDoc.data();
    const currentCount = surveyData.responseCount || 0;

    if (currentCount >= responseLimit) {
      throw new ResponseLimitExceededError();
    }

    // Atomically increment the count and add the response
    transaction.update(surveyRef, {
      responseCount: currentCount + 1,
      updatedAt: Timestamp.now(),
    });
    transaction.set(newDocRef, responseDoc);
  });

  return newDocRef.id;
}

export async function getSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
  const q = query(
    collection(db, 'responses'),
    where('surveyId', '==', surveyId),
    orderBy('completedAt', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      completedAt: data.completedAt.toDate(),
    } as SurveyResponse;
  });
}

export async function getResponseCount(surveyId: string): Promise<number> {
  const q = query(collection(db, 'responses'), where('surveyId', '==', surveyId));
  const snapshot = await getDocs(q);
  return snapshot.size;
}

// Real-time listeners
export function subscribeToUserSurveys(
  userId: string,
  callback: (surveys: Survey[]) => void
): () => void {
  const q = query(
    collection(db, 'surveys'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const surveys = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        publishedAt: data.publishedAt?.toDate(),
      } as Survey;
    });
    callback(surveys);
  });
}

export async function getResponseCountFast(surveyId: string): Promise<number> {
  const q = query(collection(db, 'responses'), where('surveyId', '==', surveyId));
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

export async function getSurveyQuickStats(surveyId: string): Promise<SurveyQuickStats> {
  const q = query(
    collection(db, 'responses'),
    where('surveyId', '==', surveyId),
    orderBy('completedAt', 'desc')
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return {
      totalResponses: 0,
      completedResponses: 0,
      startedResponses: 0,
      completionRate: 0,
      averageCompletionTime: 0,
      lastResponseDate: null,
    };
  }

  const responses = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      completedAt: data.completedAt?.toDate() || new Date(),
      completionTime: data.metadata?.completionTime || 0,
      isComplete: data.metadata?.completionTime > 0,
    };
  });

  const completedResponses = responses.filter((r) => r.isComplete).length;
  const totalResponses = responses.length;
  const completionRate = totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;

  const completionTimes = responses
    .filter((r) => r.completionTime > 0)
    .map((r) => r.completionTime);
  const averageCompletionTime =
    completionTimes.length > 0
      ? completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length
      : 0;

  const lastResponseDate = responses.length > 0 ? responses[0].completedAt : null;

  return {
    totalResponses,
    completedResponses,
    startedResponses: totalResponses - completedResponses,
    completionRate: Math.round(completionRate),
    averageCompletionTime: Math.round(averageCompletionTime),
    lastResponseDate,
  };
}

// Partial Response Operations
// Collection: partialResponses
// Required index: surveyId ASC, sessionId ASC

export interface SavePartialResponseData {
  surveyId: string;
  sessionId: string;
  answers: Answer[];
  currentStage: number;
  totalStages: number;
  percentComplete: number;
  lastMilestone: number;
  respondentName?: string;
  respondentEmail?: string;
  adventureState?: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _getPartialResponseId(
  surveyId: string,
  sessionId: string
): Promise<string | null> {
  const q = query(
    collection(db, 'partialResponses'),
    where('surveyId', '==', surveyId),
    where('sessionId', '==', sessionId),
    limit(1)
  );

  const snapshot = await getDocs(q);
  return snapshot.empty ? null : snapshot.docs[0].id;
}

export async function savePartialResponse(
  data: SavePartialResponseData
): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const documentData = {
    surveyId: data.surveyId,
    sessionId: data.sessionId,
    answers: data.answers,
    currentStage: data.currentStage,
    totalStages: data.totalStages,
    percentComplete: data.percentComplete,
    lastMilestone: data.lastMilestone,
    respondentName: data.respondentName || null,
    respondentEmail: data.respondentEmail || null,
    adventureState: data.adventureState || null,
    expiresAt: Timestamp.fromDate(expiresAt),
    updatedAt: Timestamp.now(),
  };

  // Use a deterministic document ID based on surveyId and sessionId to prevent duplicates
  const docId = `${data.surveyId}_${data.sessionId}`;
  const docRef = doc(db, 'partialResponses', docId);

  // Use a transaction to atomically check existence and update/create
  await runTransaction(db, async (transaction) => {
    const existingDoc = await transaction.get(docRef);

    if (existingDoc.exists()) {
      // Update existing document without overwriting createdAt
      transaction.update(docRef, documentData);
    } else {
      // Create new document with createdAt
      transaction.set(docRef, {
        ...documentData,
        createdAt: Timestamp.now(),
      });
    }
  });

  return docId;
}

export async function getPartialResponse(
  surveyId: string,
  sessionId: string
): Promise<PartialResponse | null> {
  // Use deterministic document ID for direct lookup (more efficient than query)
  const docId = `${surveyId}_${sessionId}`;
  const docRef = doc(db, 'partialResponses', docId);
  const docSnapshot = await getDoc(docRef);

  if (!docSnapshot.exists()) return null;

  const data = docSnapshot.data();

  const expiresAt = data.expiresAt?.toDate();
  if (expiresAt && new Date() > expiresAt) {
    await deleteDoc(docSnapshot.ref);
    return null;
  }

  return {
    id: docSnapshot.id,
    surveyId: data.surveyId,
    sessionId: data.sessionId,
    answers: data.answers || [],
    currentStage: data.currentStage || 0,
    totalStages: data.totalStages || 0,
    percentComplete: data.percentComplete || 0,
    lastMilestone: data.lastMilestone || 0,
    respondentName: data.respondentName || undefined,
    respondentEmail: data.respondentEmail || undefined,
    adventureState: data.adventureState || undefined,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    expiresAt: expiresAt || new Date(),
  };
}

export async function deletePartialResponse(
  surveyId: string,
  sessionId: string
): Promise<void> {
  // Use the deterministic ID directly - no need to query
  const docId = `${surveyId}_${sessionId}`;
  await deleteDoc(doc(db, 'partialResponses', docId));
}
