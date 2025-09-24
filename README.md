# Aether - 한국 화장품 브랜드 쇼핑몰

## 📋 프로젝트 개요

Aether는 한국 화장품 브랜드들을 판매하는 동적 웹사이트입니다. Firebase 기반의 현대적인 아키텍처를 사용하여 브랜드 관리, 상품 관리, 포인트 시스템, 주문 관리 등을 제공합니다.

## 🏗️ 시스템 아키텍처

### 기술 스택
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **UI Framework**: Bootstrap 5
- **Icons**: Font Awesome
- **QR Code**: qrcode-generator
- **Fonts**: Montserrat (영문), Noto Sans JP (일본어)

### 주요 기능
- 🔥 **Firebase 기반 동적 시스템**
- 🏷️ **브랜드 관리 시스템**
- 📦 **상품 관리 시스템**
- 💰 **포인트 시스템 (3% 적립률)**
- 🛒 **주문 관리 시스템**
- 📱 **반응형 디자인**
- 🌐 **일본어 인터페이스**
- 🎨 **모노톤 디자인 (화이트/그레이/블랙)**

## 📁 프로젝트 구조

```
Aether7/
├── index.html                 # 메인 페이지
├── shop.html                  # 브랜드 목록 페이지
├── brand-template.html        # 동적 브랜드 페이지 템플릿
├── product-detail.html        # 상품 상세 페이지
├── cart.html                  # 장바구니 페이지
├── checkout.html              # 체크아웃 페이지
├── order-complete.html        # 주문 완료 페이지
├── login.html                 # 로그인 페이지
├── register.html              # 회원가입 페이지
├── profile.html               # 프로필 페이지
├── points.html                # 포인트 페이지
├── store-tablet.html          # 매장 태블릿 페이지
├── store-register.html        # 매장 등록 페이지
├── info.html                  # 정보 페이지
├── admin-dashboard.html       # 관리자 대시보드
├── assets/
│   ├── css/
│   │   ├── bootstrap.min.css
│   │   ├── templatemo.css
│   │   ├── custom.css
│   │   ├── fontawesome.css
│   │   └── ux-improvements.css
│   ├── js/
│   │   ├── firebase-config.js
│   │   ├── auth-utils.js
│   │   ├── common-qr-code.js
│   │   ├── performance-optimizer.js
│   │   ├── custom.js
│   │   ├── templatemo.js
│   │   └── slick.min.js
│   └── img/
│       ├── Brand Logo/        # 브랜드 로고
│       ├── SHOP BRAND/        # 쇼핑 브랜드 이미지
│       ├── PRODUCTS/          # 상품 이미지
│       ├── Product page/      # 상품 상세 이미지
│       ├── Featured Product/  # 추천 상품 이미지
│       └── MAIN BANNER/       # 메인 배너 이미지
├── firebase.json              # Firebase 설정
├── firestore.indexes.json     # Firestore 인덱스
├── firestore.rules            # Firestore 보안 규칙
├── manifest.json              # PWA 매니페스트
├── admin-setup-guide.md       # 관리자 설정 가이드
├── firebase-setup-guide.md    # Firebase 설정 가이드
├── DEPRECATED_FILES.md        # 사용 중단 파일 목록
└── README.md                  # 프로젝트 문서
```

## 🚀 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone [repository-url]
cd Aether7
```

### 2. Firebase 설정
1. Firebase Console에서 새 프로젝트 생성
2. 웹 앱 등록
3. `assets/js/firebase-config.js` 파일에 설정 정보 입력
4. Firestore Database 활성화
5. Authentication 활성화 (Email/Password, Anonymous)
6. Storage 활성화

### 3. 로컬 서버 실행
```bash
python3 -m http.server 8000
```

### 4. 브라우저에서 접속
```
http://localhost:8000
```

## 🔧 주요 기능 설명

### 1. 동적 페이지 시스템
- **브랜드 페이지**: `brand-template.html?brand=브랜드코드`
- **상품 상세 페이지**: `product-detail.html?id=상품ID`
- Firebase에서 실시간 데이터 로드

### 2. 관리자 대시보드
- **포인트 관리**: 사용자 포인트 적립/차감, QR 토큰 시스템
- **주문 관리**: 주문 상태 관리, 배송 처리
- **브랜드 관리**: 브랜드 추가/수정/삭제, 이미지 관리
- **상품 관리**: 상품 추가/수정/삭제, 검색/필터링
- **고객 관리**: 사용자 정보 관리
- **분석**: 매출 및 사용자 통계

### 3. 포인트 시스템
- 구매 금액의 3% 포인트 적립
- QR 코드를 통한 포인트 적립
- 체크아웃 시 포인트 사용 가능
- 매장 태블릿을 통한 포인트 관리

### 4. 반응형 디자인
- **Desktop**: 1200px 이상
- **Tablet**: 768px - 1199px
- **Mobile**: 767px 이하
- 모든 페이지에서 완전 반응형 지원

### 5. 성능 최적화
- 이미지 지연 로딩
- Firebase 쿼리 캐싱
- 성능 메트릭 수집
- 네트워크 상태 감지
- 정사각형 상품 이미지 최적화

## 📊 브랜드 정보

현재 등록된 브랜드:
1. **LALARECIPE** - 스킨케어
2. **LUCINDE** - 앰플/크림
3. **COSCELL** - 화장품
4. **Make heal** - 메이크업
5. **Monday Museum** - 화장품
6. **Plareceta** - 스킨케어
7. **Catch By Sonyouna** - 화장품
8. **Medipeel** - 스킨케어
9. **Dancing Whale** - 화장품

## 🔐 관리자 계정

관리자 계정은 Firebase Authentication을 통해 관리됩니다.
- 관리자 이메일: Firebase 콘솔에서 확인 가능
- 보안상 비밀번호는 코드에 하드코딩되지 않습니다.

## 🎨 디자인 시스템

### 색상 팔레트
- **Primary**: 화이트 (#FFFFFF)
- **Secondary**: 그레이 (#6C757D)
- **Dark**: 블랙 (#000000)
- **Background**: 라이트 그레이 (#F8F9FA)

### 폰트 시스템
- **영문**: Montserrat (400, 600, 700, 800)
- **일본어**: Noto Sans JP (400, 600, 700, 800)
- **아이콘**: Font Awesome 5

## 🌐 브라우저 지원

- Chrome (권장)
- Firefox
- Safari
- Edge
- 모바일 브라우저 (iOS Safari, Chrome Mobile)

## 🔧 개발 가이드

### 새로운 브랜드 추가
1. 관리자 대시보드 → 브랜드 관리
2. "새로운 브랜드를 추가" 버튼 클릭
3. 브랜드 정보 입력 및 이미지 업로드
4. 저장

### 새로운 상품 추가
1. 관리자 대시보드 → 상품 관리
2. "새로운 상품을 추가" 버튼 클릭
3. 상품 정보 입력 및 이미지 업로드
4. 저장

### 포인트 시스템 관리
1. 관리자 대시보드 → 포인트 관리
2. 사용자 검색
3. 포인트 적립/차감

## 🚀 배포 준비

### 프로덕션 환경 설정
1. Firebase 프로젝트 프로덕션 설정
2. 도메인 설정 및 SSL 인증서
3. CDN 설정 (선택사항)
4. 성능 모니터링 설정

### 권장 배포 플랫폼
- **Vercel** (추천) - 무료, Firebase와 호환성 좋음
- **Netlify** - 무료, 정적 사이트 최적화
- **AWS S3 + CloudFront** - 확장성 좋음

## 🚨 주의사항

1. **Firebase 설정**: 프로젝트 실행 전 Firebase 설정이 완료되어야 합니다.
2. **이미지 업로드**: Firebase Storage 사용 시 Blaze 플랜이 필요할 수 있습니다.
3. **로컬 개발**: HTTPS가 아닌 환경에서는 일부 기능이 제한될 수 있습니다.
4. **결제 시스템**: 현재 결제 시스템은 구현되지 않았습니다.

## 📞 지원

- **이메일**: aether7info@gmail.com
- **주소**: 〒169-0072 東京都新宿区大久保2丁目21-10 ジュネス大久保 102号

## 📄 라이선스

Copyright © 2024 Aether. All rights reserved.

---

**버전**: 2.0.0  
**최종 업데이트**: 2024년 12월  
**개발자**: Aether Team