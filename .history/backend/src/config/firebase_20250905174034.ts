import admin from 'firebase-admin';

// Firebase Admin SDK 초기화
let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;

try {
  const hasRequiredEnv = Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );

  if (hasRequiredEnv) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      clientId: process.env.FIREBASE_CLIENT_ID,
      authUri: process.env.FIREBASE_AUTH_URI,
      tokenUri: process.env.FIREBASE_TOKEN_URI,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });

    db = admin.firestore();
    auth = admin.auth();
    console.log('Firebase Admin SDK 초기화 성공');
  } else {
    console.warn('Firebase 환경변수가 없어 더미 모드로 실행합니다. 실제 Firebase 연동은 비활성화됩니다.');
    db = {} as admin.firestore.Firestore;
    auth = {} as admin.auth.Auth;
  }
} catch (error) {
  console.error('Firebase Admin SDK 초기화 실패:', error);
  // 더미 객체로 초기화 (개발 환경에서 Firebase 설정이 없을 때)
  db = {} as admin.firestore.Firestore;
  auth = {} as admin.auth.Auth;
}

export { db, auth };
