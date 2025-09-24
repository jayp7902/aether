# 🚀 Netlify 배포 가이드

## 📋 배포 전 체크리스트

### ✅ 필수 준비사항
- [ ] Firebase 프로젝트 설정 완료
- [ ] Firebase 설정 파일 (`firebase-config.js`) 프로덕션 키로 업데이트
- [ ] 도메인 이름 준비 (선택사항)
- [ ] Netlify 계정 생성

## 🚀 배포 단계

### 1단계: Netlify 계정 생성
1. [Netlify](https://netlify.com) 접속
2. "Sign up" 클릭
3. GitHub 계정으로 로그인 (추천)

### 2단계: 프로젝트 업로드

#### 방법 1: 드래그 앤 드롭 (간단)
1. 프로젝트 폴더를 압축 (ZIP 파일)
2. Netlify 대시보드에서 "Sites" 클릭
3. "Add new site" → "Deploy manually"
4. ZIP 파일을 드래그 앤 드롭

#### 방법 2: GitHub 연동 (추천)
1. 프로젝트를 GitHub 저장소에 업로드
2. Netlify에서 "New site from Git"
3. GitHub 선택 후 저장소 연결
4. 빌드 설정:
   - Build command: `echo 'Static site'`
   - Publish directory: `.`

### 3단계: 도메인 설정
1. Netlify 대시보드 → Site settings → Domain management
2. 기본 도메인: `your-site-name.netlify.app`
3. 커스텀 도메인 추가 (선택사항)

### 4단계: 환경 변수 설정 (필요시)
1. Site settings → Environment variables
2. Firebase 설정을 환경 변수로 관리:
   ```
   FIREBASE_API_KEY=your-api-key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   ```

## 🔧 Firebase 프로덕션 설정

### 1. Firebase 프로젝트 설정
1. [Firebase Console](https://console.firebase.google.com) 접속
2. 프로젝트 선택
3. Project settings → General
4. "Add app" → Web app 추가
5. 프로덕션용 설정 복사

### 2. Firebase 설정 파일 업데이트
`assets/js/firebase-config.js` 파일을 프로덕션 설정으로 업데이트:

```javascript
const firebaseConfig = {
  apiKey: "your-production-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 3. Firebase 보안 규칙 설정
1. Firestore Database → Rules
2. 프로덕션용 보안 규칙 적용
3. Authentication → Settings
4. 승인된 도메인에 Netlify 도메인 추가

## 🌐 도메인 설정

### 커스텀 도메인 연결
1. 도메인 구매 (예: Namecheap, GoDaddy)
2. Netlify에서 "Add custom domain"
3. DNS 설정:
   ```
   Type: CNAME
   Name: www
   Value: your-site.netlify.app
   
   Type: A
   Name: @
   Value: 75.2.60.5
   ```

### SSL 인증서
- Netlify에서 자동으로 Let's Encrypt SSL 인증서 제공
- HTTPS 강제 설정 가능

## 📊 성능 최적화

### 이미지 최적화
1. Netlify의 자동 이미지 최적화 활성화
2. WebP 형식 자동 변환
3. 지연 로딩 구현

### 캐싱 설정
- `netlify.toml`에서 캐시 헤더 설정
- CDN 자동 제공

## 🔍 모니터링 및 분석

### Netlify Analytics
1. Site settings → Analytics
2. 방문자 통계 확인
3. 성능 메트릭 모니터링

### Firebase Analytics
1. Firebase Console → Analytics
2. 사용자 행동 분석
3. 전환율 추적

## 🚨 문제 해결

### 일반적인 문제들

#### 1. Firebase 연결 오류
- 도메인이 Firebase 승인된 도메인에 추가되었는지 확인
- API 키가 올바른지 확인

#### 2. 리다이렉션 문제
- `_redirects` 파일 설정 확인
- `netlify.toml` 설정 확인

#### 3. 이미지 로딩 문제
- 이미지 경로가 상대 경로인지 확인
- Firebase Storage 권한 설정 확인

## 📞 지원

- **Netlify 문서**: [docs.netlify.com](https://docs.netlify.com)
- **Firebase 문서**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **Aether 팀**: aether7info@gmail.com

---

**배포 완료 후 확인사항:**
- [ ] 메인 페이지 로딩 확인
- [ ] 브랜드 페이지 동작 확인
- [ ] 로그인/회원가입 기능 확인
- [ ] 관리자 대시보드 접근 확인
- [ ] 모바일 반응형 확인
