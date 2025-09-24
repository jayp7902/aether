# 🗑️ 사용 중단된 파일들

## ❌ 다음 파일들은 더 이상 사용하지 말 것

### 브랜드 생성 관련
- `create-initial-brands.js` - ❌ 중복 생성 위험
- `brand-template.html` 내 `createInitialBrandData()` 함수 - ❌ 중복 생성 위험
- `create-brands-data.html` - ⚠️ 임시 사용, 이제 안전한 도구 사용

### ✅ 대신 사용할 도구
- `safe-brand-initializer.html` - 🛡️ 안전한 브랜드 초기화
- `safe-brand-manager.js` - 🛡️ 브랜드 관리 클래스
- `cleanup-duplicate-brands.html` - 🧹 중복 데이터 정리

## 🔒 안전 규칙

1. **절대 `.add()` 메서드 사용 금지** (임의 ID 생성)
2. **항상 `.doc(id).set()` 사용** (명시적 ID)
3. **초기화 전 기존 데이터 확인 필수**
4. **백업 생성 후 작업**
5. **Dry Run 먼저 테스트**

## 🧹 정리 작업

### 즉시 삭제해야 할 함수들:

#### brand-template.html
```javascript
// ❌ 이 함수 삭제 필요
async function createInitialBrandData() {
    // 중복 생성 위험
}
```

#### create-initial-brands.js
```javascript
// ❌ 이 파일 전체 삭제 또는 사용 중단
```

### 안전한 패턴으로 교체
```javascript
// ✅ 올바른 방법
const brandManager = new SafeBrandManager(db);
await brandManager.initializeBrands(brandData, {
    dryRun: true,  // 먼저 테스트
    createBackup: true,
    forceOverwrite: false
});
```
