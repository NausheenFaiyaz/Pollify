const STORAGE_PREFIX = "ps:submission-token";

export const getSubmissionToken = (pollSlug: string) => {
  const key = `${STORAGE_PREFIX}:${pollSlug}`;
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const token = `${pollSlug}:${crypto.randomUUID()}`;
  localStorage.setItem(key, token);
  return token;
};
