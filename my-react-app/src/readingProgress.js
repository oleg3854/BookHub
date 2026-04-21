export const READING_PROGRESS_PREFIX = 'book-progress-';
export const LEGACY_PAGE_PREFIX = 'book-page-';
export const READING_PROGRESS_EVENT = 'bookhub-reading-progress-updated';

export const getProgressStorageKey = (bookId) => `${READING_PROGRESS_PREFIX}${bookId}`;
export const getLegacyPageStorageKey = (bookId) => `${LEGACY_PAGE_PREFIX}${bookId}`;

const getStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
};

const toInteger = (value) => {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isInteger(parsedValue) ? parsedValue : null;
};

const toTimestamp = (value) => {
  const timestamp = Date.parse(value || '');
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const normalizeProgress = (bookId, progress) => {
  const page = toInteger(progress?.page);
  if (page === null || page < 0) {
    return null;
  }

  const totalPages = toInteger(progress?.totalPages);
  const safeTotalPages = totalPages && totalPages > 0 ? totalPages : page + 1;
  const safePage = Math.min(page, Math.max(safeTotalPages - 1, 0));
  const paragraphIndex = toInteger(progress?.paragraphIndex);
  const progressPercent = safeTotalPages
    ? Math.min(100, Math.max(1, Math.round(((safePage + 1) / safeTotalPages) * 100)))
    : 0;

  return {
    ...progress,
    bookId: Number.parseInt(bookId, 10),
    page: safePage,
    totalPages: safeTotalPages,
    paragraphIndex: paragraphIndex === null ? safePage * 5 : paragraphIndex,
    progressPercent,
    isFinished: progressPercent >= 100,
    updatedAt: progress?.updatedAt || null,
  };
};

export const loadSavedProgress = (bookId) => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    const savedProgress = storage.getItem(getProgressStorageKey(bookId));
    if (savedProgress) {
      return normalizeProgress(bookId, JSON.parse(savedProgress));
    }
  } catch (error) {
    console.error('Не удалось прочитать сохранённый прогресс:', error);
  }

  const legacyPage = toInteger(storage.getItem(getLegacyPageStorageKey(bookId)));
  if (legacyPage !== null && legacyPage > 0) {
    return normalizeProgress(bookId, {
      page: legacyPage,
      totalPages: legacyPage + 2,
      paragraphIndex: legacyPage * 5,
    });
  }

  return null;
};

export const saveBookProgress = (bookId, progress) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  const progressPayload = {
    ...progress,
    bookId: Number.parseInt(bookId, 10),
    updatedAt: progress.updatedAt || new Date().toISOString(),
  };

  storage.setItem(getProgressStorageKey(bookId), JSON.stringify(progressPayload));
  storage.setItem(getLegacyPageStorageKey(bookId), String(progressPayload.page));

  window.dispatchEvent(new CustomEvent(READING_PROGRESS_EVENT, { detail: progressPayload }));
};

export const clearBookProgress = (bookId) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(getProgressStorageKey(bookId));
  storage.setItem(getLegacyPageStorageKey(bookId), '0');
  window.dispatchEvent(new CustomEvent(READING_PROGRESS_EVENT, { detail: { bookId } }));
};

export const getStoredReadingProgress = () => {
  const storage = getStorage();
  if (!storage) {
    return [];
  }

  const progressByBook = new Map();

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);

    if (!key?.startsWith(READING_PROGRESS_PREFIX)) {
      continue;
    }

    const bookId = key.slice(READING_PROGRESS_PREFIX.length);

    try {
      const progress = normalizeProgress(bookId, JSON.parse(storage.getItem(key)));
      if (progress) {
        progressByBook.set(progress.bookId, progress);
      }
    } catch (error) {
      console.error('Не удалось прочитать прогресс книги:', error);
    }
  }

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);

    if (!key?.startsWith(LEGACY_PAGE_PREFIX)) {
      continue;
    }

    const bookId = key.slice(LEGACY_PAGE_PREFIX.length);
    const numericBookId = Number.parseInt(bookId, 10);
    if (progressByBook.has(numericBookId)) {
      continue;
    }

    const legacyPage = toInteger(storage.getItem(key));
    if (legacyPage !== null && legacyPage > 0) {
      const progress = normalizeProgress(bookId, {
        page: legacyPage,
        totalPages: legacyPage + 2,
        paragraphIndex: legacyPage * 5,
      });

      if (progress) {
        progressByBook.set(progress.bookId, progress);
      }
    }
  }

  return Array.from(progressByBook.values()).sort(
    (first, second) => toTimestamp(second.updatedAt) - toTimestamp(first.updatedAt),
  );
};
