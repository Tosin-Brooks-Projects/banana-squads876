const SESSION_KEY_PREFIX = 'survey_session_';

export function getOrCreateSessionId(surveyId: string): string {
  if (typeof window === 'undefined') return '';

  const key = `${SESSION_KEY_PREFIX}${surveyId}`;
  let sessionId = localStorage.getItem(key);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }

  return sessionId;
}

export function getSessionId(surveyId: string): string | null {
  if (typeof window === 'undefined') return null;

  const key = `${SESSION_KEY_PREFIX}${surveyId}`;
  return localStorage.getItem(key);
}

export function clearSession(surveyId: string): void {
  if (typeof window === 'undefined') return;

  const key = `${SESSION_KEY_PREFIX}${surveyId}`;
  localStorage.removeItem(key);
}
