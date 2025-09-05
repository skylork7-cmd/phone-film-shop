# Phone Film Shop Backend API

이 프로젝트는 Phone Film Shop의 백엔드 API 서버입니다.

## 기능

- 상품 관리 (CRUD)
- 주문 관리
- 사용자 관리
- Firebase Admin SDK 연동
- JWT 인증

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
```bash
cp env.example .env
```

`.env` 파일에 Firebase 설정 정보를 입력하세요.

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 프로덕션 빌드
```bash
npm run build
npm start
```

## API 엔드포인트

### 상품 관리
- `GET /api/products` - 상품 목록 조회
- `GET /api/products/:id` - 상품 상세 조회
- `POST /api/products` - 상품 생성 (관리자)
- `PUT /api/products/:id` - 상품 수정 (관리자)
- `DELETE /api/products/:id` - 상품 삭제 (관리자)

### 주문 관리
- `GET /api/orders` - 주문 목록 조회 (관리자)
- `POST /api/orders` - 주문 생성
- `PUT /api/orders/:id/status` - 주문 상태 업데이트 (관리자)
- `DELETE /api/orders/:id` - 주문 삭제 (관리자)

### 관리자 기능
- `GET /api/admin/users` - 사용자 목록 조회
- `GET /api/admin/test` - 연결 테스트

### 헬스 체크
- `GET /health` - 서버 상태 확인

## 환경 변수

- `FIREBASE_PROJECT_ID` - Firebase 프로젝트 ID
- `FIREBASE_PRIVATE_KEY` - Firebase 개인 키
- `FIREBASE_CLIENT_EMAIL` - Firebase 클라이언트 이메일
- `JWT_SECRET` - JWT 시크릿 키
- `PORT` - 서버 포트 (기본값: 5001)
- `NODE_ENV` - 환경 설정 (development/production)
