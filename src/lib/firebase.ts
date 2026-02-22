import * as dotenv from 'dotenv';
dotenv.config();

import admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

        if (Object.keys(serviceAccount).length > 0) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('✅ [Firebase] Admin SDK initialized');
        } else {
            console.warn('⚠️ [Firebase] FIREBASE_SERVICE_ACCOUNT is missing or empty');
        }
    } catch (error) {
        console.error('❌ [Firebase] Failed to initialize Admin SDK:', error);
    }
}

const getDb = () => {
    if (!admin.apps.length) {
        return null;
    }
    return admin.firestore();
};

export const db = getDb()!;
export default admin;
