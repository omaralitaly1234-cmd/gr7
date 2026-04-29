// ============================================
// Audit Logging System
// Tracks all CRUD operations for security & compliance
// ============================================

import { addDoc, collection, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './config';

/**
 * Log an audit event (immutable — never updated or deleted)
 * 
 * @param {Object} params
 * @param {string} params.action - create|update|delete|login|logout|subscription_change|payment_confirm
 * @param {string} params.entity - member|trainer|tenant|payment|class|settings|user
 * @param {string} params.entityId - Document ID that was affected
 * @param {string|null} params.tenantId - Tenant context (null for platform-level)
 * @param {string} params.userId - Who performed the action
 * @param {string} params.userEmail - Email of who performed
 * @param {string} params.userRole - admin|superadmin|trainer|member
 * @param {Object} params.details - { before, after, description }
 * @param {string} params.severity - info|warning|critical
 */
export async function logAudit({
  action,
  entity,
  entityId,
  tenantId = null,
  userId,
  userEmail = '',
  userRole = '',
  details = {},
  severity = 'info',
}) {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      action,
      entity,
      entityId: entityId || '',
      tenantId,
      userId: userId || '',
      userEmail,
      userRole,
      details: {
        description: details.description || {},
        before: details.before || null,
        after: details.after || null,
      },
      severity,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Audit should never break the app
    console.error('[AUDIT] Failed to log event:', error.message);
  }
}

// ==================== Query Helpers (Super Admin) ====================

/**
 * Get recent audit logs
 */
export async function getRecentAuditLogs(limitCount = 50) {
  try {
    const q = query(
      collection(db, 'auditLogs'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return {
      data: snapshot.docs.map(d => ({ id: d.id, ...d.data() })),
      error: null,
    };
  } catch (error) {
    return { data: [], error: error.message };
  }
}

/**
 * Get audit logs for a specific tenant
 */
export async function getTenantAuditLogs(tenantId, limitCount = 50) {
  try {
    const q = query(
      collection(db, 'auditLogs'),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return {
      data: snapshot.docs.map(d => ({ id: d.id, ...d.data() })),
      error: null,
    };
  } catch (error) {
    return { data: [], error: error.message };
  }
}

/**
 * Get audit logs for a specific entity
 */
export async function getEntityAuditLogs(entity, entityId, limitCount = 20) {
  try {
    const q = query(
      collection(db, 'auditLogs'),
      where('entity', '==', entity),
      where('entityId', '==', entityId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return {
      data: snapshot.docs.map(d => ({ id: d.id, ...d.data() })),
      error: null,
    };
  } catch (error) {
    return { data: [], error: error.message };
  }
}

/**
 * Get audit logs by action type (e.g., all deletes)
 */
export async function getAuditLogsByAction(action, limitCount = 50) {
  try {
    const q = query(
      collection(db, 'auditLogs'),
      where('action', '==', action),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return {
      data: snapshot.docs.map(d => ({ id: d.id, ...d.data() })),
      error: null,
    };
  } catch (error) {
    return { data: [], error: error.message };
  }
}

// ==================== Convenience Loggers ====================

export const AuditActions = {
  // Auth
  LOGIN: 'login',
  LOGOUT: 'logout',
  PASSWORD_RESET: 'password_reset',
  
  // CRUD
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  
  // Subscription
  SUBSCRIPTION_CHANGE: 'subscription_change',
  TRIAL_START: 'trial_start',
  PLAN_UPGRADE: 'plan_upgrade',
  PLAN_DOWNGRADE: 'plan_downgrade',
  SUBSCRIPTION_EXPIRE: 'subscription_expire',
  
  // Payment
  PAYMENT_SUBMIT: 'payment_submit',
  PAYMENT_CONFIRM: 'payment_confirm',
  PAYMENT_REJECT: 'payment_reject',
  
  // Admin
  TENANT_SUSPEND: 'tenant_suspend',
  TENANT_REACTIVATE: 'tenant_reactivate',
  FEATURE_TOGGLE: 'feature_toggle',
};
