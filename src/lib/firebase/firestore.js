import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  writeBatch,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from './config';
import { cached, buildKey, invalidatePath, clearReadCache } from './read-cache';

export { clearReadCache };

// ==================== CRUD Helpers ====================

// Get a single document by ID
export async function getDocument(collectionName, docId) {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    }
    return { data: null, error: 'Document not found' };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

// Get all documents from a collection with optional filters.
// Reads go through the short-lived cache in ./read-cache, so returning to a page
// you just left does not re-run the same query over the network.
export async function getDocuments(collectionName, filters = [], sortBy = null, limitCount = null) {
  const res = await cached(
    buildKey(collectionName, filters, sortBy, limitCount),
    () => fetchDocuments(collectionName, filters, sortBy, limitCount),
  );
  // Every caller gets its own array. Several call sites sort the result in
  // place (client/messages, trainer/messages, getTrainerClients), which would
  // otherwise reorder the copy every other page is sharing.
  return res?.data ? { ...res, data: res.data.slice() } : res;
}

async function fetchDocuments(collectionName, filters = [], sortBy = null, limitCount = null) {
  try {
    let q = collection(db, collectionName);
    const constraints = [];

    filters.forEach(({ field, operator, value }) => {
      constraints.push(where(field, operator, value));
    });

    if (sortBy) {
      constraints.push(orderBy(sortBy.field, sortBy.direction || 'asc'));
    }

    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    q = query(q, ...constraints);
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { data: docs, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
}

// Get paginated documents
export async function getPaginatedDocuments(collectionName, filters = [], sortBy, pageSize = 20, lastDoc = null) {
  try {
    const constraints = [];

    filters.forEach(({ field, operator, value }) => {
      constraints.push(where(field, operator, value));
    });

    if (sortBy) {
      constraints.push(orderBy(sortBy.field, sortBy.direction || 'asc'));
    }

    constraints.push(limit(pageSize));

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

    return { data: docs, lastDoc: lastVisible, hasMore: docs.length === pageSize, error: null };
  } catch (error) {
    return { data: [], lastDoc: null, hasMore: false, error: error.message };
  }
}

// Add a new document (auto-generated ID)
export async function addDocument(collectionName, data) {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    invalidatePath(collectionName);
    return { id: docRef.id, error: null };
  } catch (error) {
    console.error(`[Firestore] addDocument(${collectionName}) failed:`, error.code, error.message);
    return { id: null, error: error.message };
  }
}

// Set a document with specific ID
export async function setDocument(collectionName, docId, data, merge = true) {
  try {
    await setDoc(doc(db, collectionName, docId), {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge });
    invalidatePath(collectionName);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

// Update specific fields of a document
export async function updateDocument(collectionName, docId, data) {
  try {
    await updateDoc(doc(db, collectionName, docId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    invalidatePath(collectionName);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

// Delete a document
export async function deleteDocument(collectionName, docId) {
  try {
    await deleteDoc(doc(db, collectionName, docId));
    invalidatePath(collectionName);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

// Get documents count
export async function getCollectionCount(collectionName, filters = []) {
  return cached(
    buildKey(collectionName, filters, null, null, 'count'),
    async () => {
      try {
        const constraints = filters.map(({ field, operator, value }) =>
          where(field, operator, value)
        );
        const q = query(collection(db, collectionName), ...constraints);
        const snapshot = await getCountFromServer(q);
        return { count: snapshot.data().count, error: null };
      } catch (error) {
        return { count: 0, error: error.message };
      }
    },
  );
}

// Batch write (for bulk operations)
export async function batchWrite(operations) {
  try {
    const batch = writeBatch(db);
    operations.forEach(({ type, collectionName, docId, data }) => {
      const ref = doc(db, collectionName, docId);
      switch (type) {
        case 'set':
          batch.set(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
          break;
        case 'update':
          batch.update(ref, { ...data, updatedAt: serverTimestamp() });
          break;
        case 'delete':
          batch.delete(ref);
          break;
      }
    });
    await batch.commit();
    [...new Set(operations.map(o => o.collectionName))].forEach(invalidatePath);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

// ==================== Tenant-Scoped Helpers ====================
// These helpers automatically scope queries to a specific tenant's sub-collection

/**
 * Get the tenant-scoped collection path
 * Example: getTenantPath('demo-tenant', 'members') => 'tenants/demo-tenant/members'
 */
export function getTenantPath(tenantId, collectionName) {
  if (!tenantId) {
    console.warn('getTenantPath called without tenantId, using root collection');
    return collectionName;
  }
  return `tenants/${tenantId}/${collectionName}`;
}

// Get a document from tenant's sub-collection
export async function getTenantDocument(tenantId, collectionName, docId) {
  return getDocument(getTenantPath(tenantId, collectionName), docId);
}

// Get all documents from tenant's sub-collection
export async function getTenantDocuments(tenantId, collectionName, filters = [], sortBy = null, limitCount = null) {
  return getDocuments(getTenantPath(tenantId, collectionName), filters, sortBy, limitCount);
}

// Get paginated documents from tenant's sub-collection
export async function getTenantPaginatedDocuments(tenantId, collectionName, filters = [], sortBy, pageSize = 20, lastDoc = null) {
  return getPaginatedDocuments(getTenantPath(tenantId, collectionName), filters, sortBy, pageSize, lastDoc);
}

// Add a document to tenant's sub-collection
export async function addTenantDocument(tenantId, collectionName, data) {
  return addDocument(getTenantPath(tenantId, collectionName), data);
}

// Set a document in tenant's sub-collection
export async function setTenantDocument(tenantId, collectionName, docId, data, merge = true) {
  return setDocument(getTenantPath(tenantId, collectionName), docId, data, merge);
}

// Update a document in tenant's sub-collection
export async function updateTenantDocument(tenantId, collectionName, docId, data) {
  return updateDocument(getTenantPath(tenantId, collectionName), docId, data);
}

// Delete a document from tenant's sub-collection
export async function deleteTenantDocument(tenantId, collectionName, docId) {
  return deleteDocument(getTenantPath(tenantId, collectionName), docId);
}

// Get count from tenant's sub-collection
export async function getTenantCollectionCount(tenantId, collectionName, filters = []) {
  return getCollectionCount(getTenantPath(tenantId, collectionName), filters);
}

/**
 * Fetch a specific set of documents by id, in chunks of 30 (Firestore's `in`
 * limit). Returns a Map of id -> doc.
 *
 * This exists because several admin pages used to load an ENTIRE collection
 * just to resolve a handful of names for the rows they render. With ~5k members
 * that was a multi-megabyte download per page view; fetching only the ids that
 * are actually on screen turns it into one or two small reads.
 */
export async function getTenantDocumentsByIds(tenantId, collectionName, ids) {
  const unique = [...new Set((ids || []).filter(Boolean))];
  const out = new Map();
  if (unique.length === 0) return out;

  const path = getTenantPath(tenantId, collectionName);
  const chunks = [];
  for (let i = 0; i < unique.length; i += 30) chunks.push(unique.slice(i, i + 30));

  const snapshots = await Promise.all(
    chunks.map((chunk) => getDocs(query(collection(db, path), where(documentId(), 'in', chunk))))
  );
  for (const snap of snapshots) {
    snap.docs.forEach((d) => out.set(d.id, { id: d.id, ...d.data() }));
  }
  return out;
}

/**
 * Load the members assigned to a trainer with a SERVER-SIDE filter
 * (members.assignedTrainer == trainerUid), instead of loading every member and
 * filtering in JS. Sorted by Arabic name. Single-field filter → auto-indexed.
 *
 * Note: the old client-side filter also OR'd `assignedTrainerDocId == trainerUid`,
 * but that compared a trainer DOC-ID field to an Auth UID and never matched, so
 * this is behavior-equivalent.
 */
export async function getTrainerClients(tenantId, trainerUid) {
  const { data, error } = await getTenantDocuments(
    tenantId,
    'members',
    [{ field: 'assignedTrainer', operator: '==', value: trainerUid }],
  );
  const sorted = (data || []).sort((a, b) => (a.fullName?.ar || '').localeCompare(b.fullName?.ar || ''));
  return { data: sorted, error };
}

