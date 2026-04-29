// ============================================
// Database Seeder — Run once to initialize
// ============================================

import { initializePlans } from './subscription';
import { setDocument } from './firestore';

/**
 * Seed the database with initial data
 * - Creates Super Admin user document
 * - Initializes plan definitions in Firestore
 * - Sets platform settings
 * 
 * @param {string} superAdminUid - Firebase Auth UID of the super admin
 */
export async function seedDatabase(superAdminUid) {
  const results = { plans: null, superAdmin: null, settings: null };

  // 1. Initialize plans in Firestore
  const plansResult = await initializePlans();
  results.plans = plansResult.error ? `Error: ${plansResult.error}` : 'OK';

  // 2. Create/update Super Admin user document
  const adminResult = await setDocument('users', superAdminUid, {
    uid: superAdminUid,
    email: 'gr7.fit@gmail.com',
    displayName: 'مدير المنصة',
    role: 'superadmin',
    superAdmin: true,
    tenantId: null,
    tenantRole: null,
    isActive: true,
    lang: 'ar',
    fcmTokens: [],
  });
  results.superAdmin = adminResult.error ? `Error: ${adminResult.error}` : 'OK';

  // 3. Platform settings
  const settingsResult = await setDocument('platformSettings', 'general', {
    platformName: { ar: 'GR 7', en: 'GR 7' },
    supportEmail: 'gr7.fit@gmail.com',
    version: '2.1.0',
    maintenanceMode: false,
  });
  results.settings = settingsResult.error ? `Error: ${settingsResult.error}` : 'OK';

  return results;
}
