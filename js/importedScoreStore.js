const DEFAULT_DATABASE_NAME = 'interactive-piano-helper-imported-scores';
const DATABASE_VERSION = 1;
const STORE_NAME = 'scores';

function getIndexedDB(options = {}) {
    if ('indexedDB' in options) return options.indexedDB;
    return typeof indexedDB !== 'undefined' ? indexedDB : null;
}

function createStorageError(code, message, details = null) {
    return {
        code,
        message,
        details
    };
}

function failure(code, message, details = null) {
    return {
        ok: false,
        error: createStorageError(code, message, details)
    };
}

function success(payload = {}) {
    return {
        ok: true,
        ...payload
    };
}

function normalizeRecord(record = {}) {
    const now = new Date().toISOString();
    const id = typeof record.id === 'string' && record.id.trim() ? record.id.trim() : '';
    const filename = typeof record.filename === 'string' ? record.filename.trim() : '';
    const title = typeof record.title === 'string' && record.title.trim()
        ? record.title.trim()
        : filename || id;
    const xmlText = typeof record.xmlText === 'string' ? record.xmlText : '';

    return {
        id,
        title,
        filename,
        createdAt: typeof record.createdAt === 'string' && record.createdAt.trim()
            ? record.createdAt.trim()
            : now,
        xmlText,
        descriptor: record.descriptor && typeof record.descriptor === 'object'
            ? { ...record.descriptor }
            : {},
        diagnostics: Array.isArray(record.diagnostics)
            ? record.diagnostics.map(diagnostic => ({ ...diagnostic }))
            : []
    };
}

function toListRecord(record) {
    if (!record) return null;
    return {
        id: record.id,
        title: record.title,
        filename: record.filename,
        createdAt: record.createdAt,
        descriptor: record.descriptor,
        diagnostics: record.diagnostics
    };
}

function requestToPromise(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));
    });
}

function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted.'));
        transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed.'));
    });
}

export async function openImportedScoreStore(options = {}) {
    const indexedDbRef = getIndexedDB(options);
    if (!indexedDbRef) {
        return failure(
            'STORAGE_UNAVAILABLE',
            'Imported score storage is unavailable in this browser.'
        );
    }

    const databaseName = options.databaseName || DEFAULT_DATABASE_NAME;

    try {
        const db = await new Promise((resolve, reject) => {
            const request = indexedDbRef.open(databaseName, DATABASE_VERSION);

            request.onupgradeneeded = () => {
                const database = request.result;
                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('title', 'title', { unique: false });
                    store.createIndex('filename', 'filename', { unique: false });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error('Failed to open imported score storage.'));
            request.onblocked = () => reject(new Error('Imported score storage is blocked by another browser tab.'));
        });

        return success({ db });
    } catch (error) {
        return failure(
            'STORAGE_OPEN_FAILED',
            'Imported score storage could not be opened.',
            error?.message || String(error)
        );
    }
}

export async function saveImportedScore(record, options = {}) {
    const normalizedRecord = normalizeRecord(record);
    if (!normalizedRecord.id) {
        return failure('INVALID_RECORD', 'Imported score records require an id.');
    }
    if (!normalizedRecord.xmlText) {
        return failure('INVALID_RECORD', 'Imported score records require MusicXML text.');
    }

    const openResult = await openImportedScoreStore(options);
    if (!openResult.ok) return openResult;

    const { db } = openResult;
    try {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        transaction.objectStore(STORE_NAME).put(normalizedRecord);
        await transactionDone(transaction);
        return success({ record: normalizedRecord });
    } catch (error) {
        return failure(
            'SAVE_FAILED',
            'Imported score could not be saved in browser storage.',
            error?.message || String(error)
        );
    } finally {
        db.close();
    }
}

export async function listImportedScores(options = {}) {
    const openResult = await openImportedScoreStore(options);
    if (!openResult.ok) return { ...openResult, records: [] };

    const { db } = openResult;
    try {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const records = await requestToPromise(transaction.objectStore(STORE_NAME).getAll());
        await transactionDone(transaction);
        return success({
            records: records
                .map(toListRecord)
                .filter(Boolean)
                .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        });
    } catch (error) {
        return failure(
            'LIST_FAILED',
            'Imported scores could not be listed from browser storage.',
            error?.message || String(error)
        );
    } finally {
        db.close();
    }
}

export async function getImportedScore(id, options = {}) {
    if (typeof id !== 'string' || !id.trim()) {
        return failure('INVALID_ID', 'Imported score id is required.');
    }

    const openResult = await openImportedScoreStore(options);
    if (!openResult.ok) return openResult;

    const { db } = openResult;
    try {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const record = await requestToPromise(transaction.objectStore(STORE_NAME).get(id));
        await transactionDone(transaction);
        if (!record) {
            return failure('NOT_FOUND', 'Imported score was not found in this browser.');
        }
        return success({ record });
    } catch (error) {
        return failure(
            'GET_FAILED',
            'Imported score could not be loaded from browser storage.',
            error?.message || String(error)
        );
    } finally {
        db.close();
    }
}

export async function deleteImportedScore(id, options = {}) {
    if (typeof id !== 'string' || !id.trim()) {
        return failure('INVALID_ID', 'Imported score id is required.');
    }

    const openResult = await openImportedScoreStore(options);
    if (!openResult.ok) return openResult;

    const { db } = openResult;
    try {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        transaction.objectStore(STORE_NAME).delete(id);
        await transactionDone(transaction);
        return success({ id });
    } catch (error) {
        return failure(
            'DELETE_FAILED',
            'Imported score could not be removed from browser storage.',
            error?.message || String(error)
        );
    } finally {
        db.close();
    }
}
