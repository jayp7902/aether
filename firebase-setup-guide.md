# Firebase API 키 리퍼러 제한 해결 가이드

## 문제
```
Requests from referer http://localhost:8000/ are blocked.
API_KEY_HTTP_REFERRER_BLOCKED
```

## 해결 방법

### 1. Firebase 콘솔에서 API 키 설정 수정 (권장)

1. **Firebase 콘솔 접속**: https://console.firebase.google.com/
2. **프로젝트 선택**: `aether7-e20de`
3. **프로젝트 설정** (⚙️ 아이콘) → **일반** 탭
4. **API 키** 섹션에서 `AIzaSyDovLKo3djdRbs963vqKdbj-geRWyzMTrg` 찾기
5. **API 키 편집** 클릭
6. **애플리케이션 제한사항** 섹션에서:
   - **없음** 선택 (임시로 모든 리퍼러 허용)
   - 또는 **HTTP 리퍼러(웹사이트)** 선택 후 다음 URL들 추가:
     ```
     http://localhost:*
     http://127.0.0.1:*
     https://aether7-e20de.web.app/*
     https://aether7-e20de.firebaseapp.com/*
     ```
7. **저장** 클릭

### 2. 테스트 가능한 URL들

- `http://localhost:8080/register.html` (현재 실행 중)
- `http://localhost:3000/register.html`
- `http://localhost:8000/register.html`

### 3. Firebase Hosting 사용 (대안)

```bash
# Firebase CLI 설치 (권한 문제가 있다면 sudo 사용)
sudo npm install -g firebase-tools

# Firebase 로그인
firebase login

# 로컬 서버 실행
firebase serve --port 5000
```

### 4. 보안 주의사항

- **개발 환경에서만** API 키 제한을 해제하세요
- **프로덕션 배포 전에** 적절한 리퍼러 제한을 다시 설정하세요
- **API 키를 공개 저장소에 노출하지 마세요**

## 현재 상태

- ✅ 회원가입 로직 개선 완료
- ✅ Firebase 연결 로직 개선 완료
- ❌ API 키 리퍼러 제한으로 인한 차단
- 🔄 Firebase 콘솔에서 API 키 설정 수정 필요
