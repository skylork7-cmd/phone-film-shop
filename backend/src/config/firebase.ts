import admin from 'firebase-admin';
import fs from 'fs';

// Firebase Admin SDK 초기화
let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;

try {
  const fromInlineJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const hasSplitEnvs = Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
  const fromCredentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  let credential: admin.credential.Credential | null = null;

  // 1) FIREBASE_SERVICE_ACCOUNT (JSON or BASE64-encoded JSON)
  if (!credential && fromInlineJson) {
    try {
      const jsonStr = (() => {
        try {
          JSON.parse(fromInlineJson);
          return fromInlineJson;
        } catch (_) {
          return Buffer.from(fromInlineJson, 'base64').toString('utf8');
        }
      })();
      const serviceAccount = JSON.parse(jsonStr);
      if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
        throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON');
      }
      credential = admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: (serviceAccount.private_key as string).replace(/\n/g, '\n')
      });
      console.log('Firebase Admin: using FIREBASE_SERVICE_ACCOUNT');
    } catch (e) {
      console.warn('FIREBASE_SERVICE_ACCOUNT 파싱 실패, 다음 방법으로 시도합니다:', (e as Error).message);
    }
  }

  // 2) 개별 ENV (split envs)
  if (!credential && hasSplitEnvs) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    } as admin.ServiceAccount;
    credential = admin.credential.cert(serviceAccount);
    console.log('Firebase Admin: using split env variables');
  }

  // 3) GOOGLE_APPLICATION_CREDENTIALS 파일 경로
  if (!credential && fromCredentialsPath) {
    try {
      const file = fs.readFileSync(fromCredentialsPath, 'utf8');
      const serviceAccount = JSON.parse(file);
      credential = admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: (serviceAccount.private_key as string).replace(/\n/g, '\n')
      });
      console.log('Firebase Admin: using GOOGLE_APPLICATION_CREDENTIALS file');
    } catch (e) {
      console.warn('GOOGLE_APPLICATION_CREDENTIALS 읽기 실패:', (e as Error).message);
    }
  }

  if (credential) {
    admin.initializeApp({ credential });
    db = admin.firestore();
    auth = admin.auth();
    console.log('Firebase Admin SDK 초기화 성공');
  } else {
    console.warn('[Firebase Admin] 환경변수/자격정보를 찾을 수 없어 더미 모드로 실행합니다. 실제 Firestore/Auth 호출은 비활성화됩니다.');
    // 안전한 더미 스텁 제공: collection/get/doc/update 사용 시 오류가 나지 않도록 최소 동작
    const dummy = {
      collection: (_name: string) => ({
        get: async () => ({ forEach: (_cb: any) => {} }),
        add: async (_data: any) => ({ id: 'dummy-id' }),
        doc: (_id: string) => ({
          set: async (_data: any, _opts?: any) => {},
          update: async (_data: any) => {},
          delete: async () => {}
        })
      })
    } as any;
    db = dummy as admin.firestore.Firestore;
    auth = {} as admin.auth.Auth;
  }
} catch (error) {
  console.error('Firebase Admin SDK 초기화 실패:', error);
  // 더미 객체로 초기화 (개발 환경에서 Firebase 설정이 없을 때)
  const dummy = {
    collection: (_name: string) => ({
      get: async () => ({ forEach: (_cb: any) => {} }),
      add: async (_data: any) => ({ id: 'dummy-id' }),
      doc: (_id: string) => ({
        set: async (_data: any, _opts?: any) => {},
        update: async (_data: any) => {},
        delete: async () => {}
      })
    })
  } as any;
  db = dummy as admin.firestore.Firestore;
  auth = {} as admin.auth.Auth;
}

export { db, auth };
