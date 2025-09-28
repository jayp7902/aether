// Firebase 설정 - 새로운 프로젝트 (aether-fixed)
const firebaseConfig = {
    apiKey: "AIzaSyDMXVksXuTT0rY33GHwlnE1a9tAGbviNFc",
    authDomain: "aether-fixed.firebaseapp.com",
    projectId: "aether-fixed",
    storageBucket: "aether-fixed.firebasestorage.app",
    messagingSenderId: "229862254275",
    appId: "1:229862254275:web:7190d726004e2da72b2476",
    measurementId: "G-2P6DLVTECY"
};

// Firebase 초기화 상태 변수
// firebaseInitialized 변수 제거 - 실제 Firebase 객체들만 확인
let auth = null;
let db = null;
let storage = null;
let persistenceEnabled = false;

// Firebase 초기화 재시도 카운터
let firebaseInitRetryCount = 0;
const MAX_FIREBASE_INIT_RETRIES = 3;

// 연결 상태 모니터링
let connectionCheckInterval = null;
let isOnline = navigator.onLine;

// Firebase 연결 상태 확인 및 재연결 함수
async function checkFirebaseConnection() {
    try {
        if (!db) {
            console.warn('Firebase가 초기화되지 않았습니다.');
            return false;
        }

        // 간단한 Firestore 연결 테스트
        const testRef = db.collection('_test_connection').limit(1);
        await testRef.get();
        console.log('Firebase 연결 상태: 정상');
        return true;
    } catch (error) {
        console.error('Firebase 연결 상태: 오류', error);
        return false;
    }
}

// Firebase 재연결 함수
async function reconnectFirebase() {
    try {
        console.log('Firebase 재연결 시도 중...');
        
        // 기존 연결 정리
        if (connectionCheckInterval) {
            clearInterval(connectionCheckInterval);
            connectionCheckInterval = null;
        }
        
        // Firebase 재초기화
        // firebaseInitialized 변수 제거됨
        auth = null;
        db = null;
        storage = null;
        persistenceEnabled = false;
        
        // 새로 초기화
        await initializeFirebase();
        
        console.log('Firebase 재연결 완료');
        return true;
    } catch (error) {
        console.error('Firebase 재연결 실패:', error);
        return false;
    }
}

// Firestore 설정 함수 (매우 안전한 방식)
async function setupFirestore() {
    if (!db || typeof db.enablePersistence !== 'function' || typeof db.enableNetwork !== 'function') {
        console.warn('Firestore가 완전히 초기화되지 않았습니다. 설정을 건너뜁니다.');
        return;
    }

    // 오프라인 지속성이 이미 활성화되었는지 확인
    if (!persistenceEnabled) {
        try {
            await db.enablePersistence({
                synchronizeTabs: true
            });
            console.log('Firestore 오프라인 지속성 활성화됨');
            persistenceEnabled = true;
        } catch (err) {
            if (err.code === 'failed-precondition') {
                console.warn('여러 탭이 열려있어 오프라인 지속성을 활성화할 수 없습니다');
            } else if (err.code === 'unimplemented') {
                console.warn('브라우저가 오프라인 지속성을 지원하지 않습니다');
            } else {
                console.warn('오프라인 지속성 활성화 실패:', err);
            }
        }
    }

    // 네트워크 연결 활성화
    try {
        await db.enableNetwork();
        console.log('Firestore 네트워크 연결 활성화됨');
    } catch (error) {
        console.error('Firestore 네트워크 연결 실패:', error);
        console.log('오프라인 모드로 계속 진행합니다');
    }
}

// Firebase 초기화 전 SDK 로드 확인
function checkFirebaseSDKLoaded() {
    return new Promise((resolve) => {
        if (typeof firebase !== 'undefined') {
            resolve(true);
            return;
        }

        let attempts = 0;
        const maxAttempts = 20;
        const interval = setInterval(() => {
            attempts++;
            if (typeof firebase !== 'undefined') {
                clearInterval(interval);
                resolve(true);
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                console.error('Firebase SDK 로드 실패');
                resolve(false);
            }
        }, 250);
    });
}

// Firebase 초기화 함수
async function initializeFirebase() {
    if (auth && db) {
        console.log('Firebase가 이미 초기화되어 있습니다.');
        return { success: true, auth, db };
    }

    try {
        // 네트워크 연결 확인
        if (!navigator.onLine) {
            throw new Error('네트워크 연결이 없습니다. 인터넷 연결을 확인해주세요.');
        }

        // Firebase SDK 로드 확인
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK가 로드되지 않았습니다.');
        }

        // Firebase 앱 초기화 (더 안전한 방식)
        if (!firebase.apps.length) {
            console.log('Firebase 앱 초기화 중...');
            firebase.initializeApp(firebaseConfig);
        } else {
            console.log('Firebase 앱이 이미 초기화되어 있습니다.');
        }

        // Auth 초기화
        auth = firebase.auth();
        console.log('Firebase Auth 초기화 완료');
        
        // Firestore 초기화
        db = firebase.firestore();
        console.log('Firebase Firestore 초기화 완료');
        
        // Storage 초기화
        try {
            if (firebase.storage && typeof firebase.storage === 'function') {
                storage = firebase.storage();
                console.log('Firebase Storage 초기화 완료');
            } else {
                console.warn('Firebase Storage 함수를 찾을 수 없음');
                storage = null;
            }
        } catch (error) {
            console.warn('Firebase Storage 초기화 실패:', error);
            storage = null;
        }
        
        // Firestore 설정 (안정적인 연결 우선)
        try {
            db.settings({
                ignoreUndefinedProperties: true, // undefined 속성 무시
                merge: true // 설정 충돌 방지
            });
            console.log('✅ Firestore 설정 완료 - 안정적인 연결 모드');
        } catch (settingsError) {
            console.warn('Firestore 설정이 이미 적용되었습니다:', settingsError.message);
        }

        // 오프라인 지속성 비활성화 (연결 문제 해결)
        console.log('오프라인 지속성 비활성화 - 연결 안정성 우선');
        
        // 네트워크 연결 상태 모니터링
        if (navigator.onLine === false) {
            console.warn('⚠️ 오프라인 상태에서 Firebase 초기화 시도');
        }
        
        // 네트워크 상태 변경 감지 (로그만, 자동 재연결 비활성화)
        window.addEventListener('online', () => {
            console.log('🌐 네트워크 연결 복구됨');
            // 자동 재연결 비활성화 (과도한 요청 방지)
        });
        
        window.addEventListener('offline', () => {
            console.warn('⚠️ 네트워크 연결 끊어짐');
        });

        // Auth 상태 확인 (최대 10초 대기)
        await Promise.race([
            new Promise((resolve) => {
                const unsubscribe = auth.onAuthStateChanged((user) => {
                    unsubscribe();
                    if (user) {
                        console.log('사용자 인증 상태 확인됨:', user.email);
                    }
                    resolve();
                });
            }),
            new Promise((resolve) => setTimeout(resolve, 10000))
        ]);

        // Firestore 연결 테스트 (간단한 확인만)
        try {
            console.log('Firestore 연결 테스트 중...');
            // 단일 간단한 테스트만 수행 (과도한 재시도 방지)
            await db.collection('test').limit(1).get();
            console.log('✅ Firestore 연결 테스트 성공');
        } catch (testError) {
            console.warn('⚠️ Firestore 연결 테스트 실패, 오프라인 모드로 진행:', testError.message);
            // 실패해도 계속 진행 (오프라인 모드 지원)
        }

        // firebaseInitialized 변수 제거됨
        if (storage) {
            console.log('🔥 Firebase 초기화 완료 (Auth, Firestore, Storage) - 안정적인 연결 모드');
        } else {
            console.log('🔥 Firebase 초기화 완료 (Auth, Firestore) - Storage 없음 - 안정적인 연결 모드');
        }
        
        // Rate Limiting 방지를 위한 요청 간격 설정
        if (window.firebaseLastRequest) {
            const timeSinceLastRequest = Date.now() - window.firebaseLastRequest;
            if (timeSinceLastRequest < 1000) {
                console.log('⚠️ Firebase 요청 간격 조정 중...');
                await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
            }
        }
        window.firebaseLastRequest = Date.now();
        
        // 전역 Firebase 객체 설정
        setGlobalFirebaseObjects();
        
        // Firebase 초기화 완료 이벤트 발생
        window.dispatchEvent(new CustomEvent('firebaseInitialized', {
            detail: { success: true, auth, db, storage }
        }));
        
        // Firebase 초기화 완료 플래그 설정
        // firebaseInitialized 변수 제거됨
        
        return { success: true, auth, db, storage };

    } catch (error) {
        console.error('Firebase 초기화 실패:', error);
        console.error('에러 상세 정보:', {
            name: error.name,
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        
        // Firebase 초기화 실패 이벤트 발생
        window.dispatchEvent(new CustomEvent('firebaseInitializationFailed', {
            detail: { error: error.message, code: error.code }
        }));
        
        // 네트워크 관련 에러인 경우 특별 처리
        if (error.message && (
            error.message.includes('network') || 
            error.message.includes('connection') ||
            error.message.includes('timeout') ||
            error.message.includes('disconnected')
        )) {
            console.warn('🌐 네트워크 연결 문제로 인한 Firebase 초기화 실패');
            console.warn('인터넷 연결을 확인하고 페이지를 새로고침해주세요.');
        }
        
        return { success: false, error: error.message || 'Firebase 초기화 실패', code: error.code };
    }
}

// 초기화 완료 대기 함수
function waitForInitialization(maxAttempts = 50) {
    return new Promise((resolve) => {
        let attempts = 0;
        
        function check() {
            if (auth && db) {
                resolve(true);
            } else if (attempts >= maxAttempts) {
                console.warn('Firebase 초기화 시간 초과');
                resolve(false);
            } else {
                attempts++;
                setTimeout(check, 100);
            }
        }
        
        check();
    });
}

// Firebase 초기화 재시도 함수
async function retryFirebaseInit() {
    if (firebaseInitRetryCount >= MAX_FIREBASE_INIT_RETRIES) {
        console.error('❌ Firebase 초기화 최대 재시도 횟수 초과');
        return false;
    }
    
    firebaseInitRetryCount++;
    console.log(`🔄 Firebase 초기화 재시도 (${firebaseInitRetryCount}/${MAX_FIREBASE_INIT_RETRIES})`);
    
    // 재시도 전 대기
    await new Promise(resolve => setTimeout(resolve, 2000 * firebaseInitRetryCount));
    
    try {
        const result = await initializeFirebase();
        if (result.success) {
            console.log(`✅ Firebase 초기화 재시도 성공 (${firebaseInitRetryCount}/${MAX_FIREBASE_INIT_RETRIES})`);
            return true;
        } else {
            console.error(`❌ Firebase 초기화 재시도 실패 (${firebaseInitRetryCount}/${MAX_FIREBASE_INIT_RETRIES}):`, result.error);
            return false;
        }
    } catch (error) {
        console.error(`❌ Firebase 초기화 재시도 실패 (${firebaseInitRetryCount}/${MAX_FIREBASE_INIT_RETRIES}):`, error);
        return false;
    }
}

// 페이지 로드 시 Firebase 초기화 시도 (개선됨)
document.addEventListener('DOMContentLoaded', function() {
    console.log('Firebase 초기화 시작');
    
    // 약간의 지연 후 초기화 시도 (스크립트 로딩 완료 보장)
    setTimeout(async () => {
        // Firebase SDK 로드 확인 후 초기화
        if (typeof firebase !== 'undefined') {
            console.log('Firebase SDK 로드 완료, 초기화 시작');
            const result = await initializeFirebase();
            if (!result.success) {
                await retryFirebaseInit();
            }
        } else {
            console.log('Firebase SDK 로드 대기 중...');
            // Firebase SDK 로드 대기
            let attempts = 0;
            const maxAttempts = 30;
            const checkFirebase = setInterval(async () => {
                attempts++;
                if (typeof firebase !== 'undefined') {
                    clearInterval(checkFirebase);
                    console.log('Firebase SDK 로드 완료, 초기화 시작');
                    const result = await initializeFirebase();
                    if (!result.success) {
                        await retryFirebaseInit();
                    }
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkFirebase);
                    console.log('Firebase SDK 로드 실패');
                }
            }, 200);
        }
    }, 300); // 300ms 지연
});

// Firebase 서비스 클래스 정의 후에 사용할 함수들 (나중에 정의)
let checkFirestoreConnection, isOfflineMode, showOfflineModeAlert, waitForFirebaseComplete;

// Firebase 서비스 클래스
class FirebaseService {
    // 사용자 ID를 email로 변환하는 헬퍼 함수
    static getUserDocumentId(userId) {
        // userId가 email인지 확인 (이메일 형식 체크)
        if (userId && userId.includes('@') && userId.includes('.')) {
            return userId; // 이미 email
        }
        
        // Firebase Auth에서 현재 사용자의 email 가져오기
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.email) {
            console.log('✅ 현재 사용자 이메일 발견:', currentUser.email);
            return currentUser.email;
        }
        
        // uid를 사용할 수 없으므로 에러 발생
        console.error('❌ 사용자 이메일을 찾을 수 없음. currentUser:', currentUser);
        throw new Error('사용자 이메일을 찾을 수 없습니다. 다시 로그인해주세요.');
    }

    // Firebase 사용 가능 여부 체크 (매우 안전한 검사)
    static isFirebaseAvailable() {
        const checks = {
            auth: auth !== null,
            db: db !== null,
            firebase: typeof firebase !== 'undefined',
            firebaseApps: firebase.apps && firebase.apps.length > 0,
            storage: storage !== null
        };
        
        console.log('🔍 Firebase 사용 가능 여부 체크:', checks);
        
        // Storage는 선택적이므로 필수 조건에서 제외
        // Auth와 DB가 초기화되었으면 사용 가능
        const isAvailable = auth !== null && 
                           db !== null && 
                           typeof firebase !== 'undefined' &&
                           firebase.apps && 
                           firebase.apps.length > 0;
                           
        // 추가 확인: Auth와 DB가 실제로 작동하는지 테스트
        if (isAvailable) {
            try {
                // Auth 객체가 실제로 작동하는지 확인
                if (auth.currentUser !== undefined) {
                    console.log('✅ Firebase Auth 작동 확인됨');
                }
                // DB 객체가 실제로 작동하는지 확인
                if (db.collection) {
                    console.log('✅ Firebase Firestore 작동 확인됨');
                }
            } catch (error) {
                console.warn('⚠️ Firebase 객체 작동 확인 실패:', error);
                return false;
            }
        }
                           
        console.log('🔍 Firebase 사용 가능 결과:', isAvailable);
        return isAvailable;
    }

    // Firebase 재연결 함수
    static async reconnectFirebase() {
        try {
            console.log('🔄 Firebase 재연결 시도...');
            
            // Firestore 연결 테스트
            if (db) {
                await db.collection('test').limit(1).get();
                console.log('✅ Firebase 재연결 성공');
                return true;
            }
        } catch (error) {
            console.warn('⚠️ Firebase 재연결 실패:', error.message);
            return false;
        }
    }

    // 사용자 등록 (중복 체크 강화 + 재시도 메커니즘)
    static async registerUser(email, password, userData, retryCount = 0) {
        console.log('🚀 registerUser 함수 호출됨:', email, `(시도 ${retryCount + 1}/3)`);
        console.log('📊 Firebase 상태:', {
            isFirebaseAvailable: this.isFirebaseAvailable(),
            // firebaseInitialized 변수 제거됨
            auth: typeof auth !== 'undefined',
            db: typeof db !== 'undefined'
        });
        
        if (!this.isFirebaseAvailable()) {
            console.log('❌ Firebase 사용 불가, 회원가입 실패');
            return { success: false, error: 'Firebase 연결이 필요합니다. 인터넷 연결을 확인해주세요.' };
        }

        console.log('✅ Firebase 사용 가능, 회원가입 진행');
        try {
            // 네트워크 상태 확인
            if (!navigator.onLine) {
                throw new Error('네트워크 연결이 끊어졌습니다. 인터넷 연결을 확인해주세요.');
            }

    // Firebase에서만 중복 체크 (로컬 저장소 사용 안함)
    console.log('🔍 이메일 중복 체크 시작:', email);
    const isDuplicate = await this.checkEmailDuplicate(email);
    if (isDuplicate) {
        console.log('❌ 중복 이메일 발견:', email);
        return { success: false, error: 'このメールアドレスは既に使用されています。' };
    }
    console.log('✅ 이메일 중복 체크 통과:', email);

            // Firebase Auth로 사용자 생성 (재시도 메커니즘 포함)
            console.log('🔥 Firebase Auth로 사용자 생성 시도:', email);
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            console.log('✅ Firebase Auth 사용자 생성 성공:', user.uid);

            // QR 토큰 생성
            const qrToken = `QR_${user.uid}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log('🎫 QR 토큰 생성:', qrToken);

            // Firestore에 저장할 사용자 데이터
            const firestoreUserData = {
                ...userData,
                email: email,
                points: 300, // 신규 가입자에게 300포인트 지급
                welcomeBonusClaimed: true, // 웰컴 보너스 지급 완료 플래그
                qrToken: qrToken,
                qrTokenCreatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Firestore에 사용자 프로필 저장 (재시도 메커니즘 포함)
            console.log('🔥 Firestore에 사용자 문서 저장 시도:', user.uid);
            console.log('📝 저장할 데이터:', firestoreUserData);
            
            // 웰컴 보너스 포인트 히스토리 추가
            const welcomeBonusHistory = {
                userId: user.uid,
                userEmail: email,
                type: 'welcome_bonus',
                points: 300,
                reason: '신규 가입 웰컴 보너스',
                balanceAfter: 300,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isWelcomeBonus: true
            };
            
            // Firestore 연결 테스트
            try {
                console.log('🔗 Firestore 연결 테스트 시작...');
                await db.collection('test').limit(1).get();
                console.log('✅ Firestore 연결 테스트 성공');
            } catch (testError) {
                console.warn('⚠️ Firestore 연결 테스트 실패:', testError);
                if (retryCount < 2) {
                    console.log(`🔄 Firestore 연결 실패로 인한 재시도 (${retryCount + 1}/3)`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                    return this.registerUser(email, password, userData, retryCount + 1);
                }
                throw testError;
            }
            
            // 실제 사용자 문서 저장 (email을 문서 ID로 사용)
            console.log('💾 Firestore에 사용자 문서 저장 중...');
            await db.collection('users').doc(email).set(firestoreUserData);
            console.log('✅ Firestore 사용자 문서 저장 성공:', email);
            
            // 웰컴 보너스 포인트 히스토리 저장
            await db.collection('pointHistory').add(welcomeBonusHistory);
            console.log('✅ 웰컴 보너스 포인트 히스토리 저장 완료');

            // 저장 확인을 위한 조회
            try {
                const savedDoc = await db.collection('users').doc(email).get();
                if (savedDoc.exists) {
                    console.log('✅ 저장 확인 성공:', savedDoc.data());
                } else {
                    console.warn('⚠️ 저장 확인 실패: 문서가 존재하지 않음');
                }
            } catch (verifyError) {
                console.warn('⚠️ 저장 확인 중 오류:', verifyError);
            }

            // 사용자 역할 설정 (관리자/일반 사용자)
            await this.setUserRole(user.uid, email);

            console.log('🎉 사용자 등록 완전 성공:', user.uid);
            return { success: true, user: user };
        } catch (error) {
            console.error('❌ Firebase 사용자 등록 실패:', error);
            console.error('❌ 에러 상세 정보:', {
                code: error.code,
                message: error.message,
                stack: error.stack
            });
            
            // 네트워크 관련 에러인 경우 재시도
            if (retryCount < 2 && (
                error.code === 'unavailable' || 
                error.code === 'network-request-failed' ||
                error.message.includes('network') ||
                error.message.includes('connection') ||
                error.message.includes('timeout')
            )) {
                console.log(`🔄 네트워크 에러로 인한 재시도 (${retryCount + 1}/3):`, error.message);
                await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
                return this.registerUser(email, password, userData, retryCount + 1);
            }
            
            // Firebase Auth 에러 코드별 상세 메시지
            let errorMessage = error.message;
            if (error.code) {
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage = 'このメールアドレスは既に使用されています。';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'メールアドレスの形式が正しくありません。';
                        break;
                    case 'auth/weak-password':
                        errorMessage = 'パスワードが弱すぎます。6文字以上で入力してください。';
                        break;
                    case 'auth/operation-not-allowed':
                        errorMessage = 'メール/パスワード認証が有効になっていません。';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'ネットワークエラーが発生しました。接続を確認してください。';
                        break;
                    case 'permission-denied':
                        errorMessage = 'Firestore 권한이 없습니다. Firebase 설정을 확인해주세요.';
                        break;
                    case 'unavailable':
                        errorMessage = 'Firebase 서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.';
                        break;
                    default:
                        errorMessage = `회원가입 실패: ${error.message}`;
                }
            }
            
            return { success: false, error: errorMessage, code: error.code };
        }
    }

    // 관리자 권한 확인
    static async isAdmin(userEmail) {
        try {
            console.log('🔍 관리자 권한 확인 시작:', userEmail);
            
            if (!this.isFirebaseAvailable()) {
                console.log('❌ Firebase 사용 불가, 관리자 권한 확인 불가');
                return false;
            }

            console.log('✅ Firebase 사용 가능, Firestore 조회 시작');
            console.log('🔧 db 객체 확인:', typeof db);
            console.log('🔧 firebase 객체 확인:', typeof firebase);
            
            // Firestore에서 관리자 이메일 목록 조회
            const adminDoc = await db.collection('admins').doc('admin-emails').get();
            
            if (adminDoc.exists) {
                const adminData = adminDoc.data();
                const adminEmails = adminData.emails || [];
                
                const isAdmin = adminEmails.includes(userEmail);
                // 보안상 관리자 이메일 목록은 로그에 출력하지 않음
                console.log(`🎯 관리자 권한 확인: ${isAdmin ? '✅ 관리자' : '❌ 일반 사용자'}`);
                return isAdmin;
            } else {
                console.log('❌ 관리자 문서가 존재하지 않습니다.');
                console.log('💡 Firebase Console에서 admins 컬렉션을 생성해주세요.');
                return false;
            }
        } catch (error) {
            console.error('❌ 관리자 권한 확인 실패:', error);
            console.error('❌ 오류 상세:', error.message);
            console.error('❌ 오류 스택:', error.stack);
            return false;
        }
    }

    // 사용자 역할 설정 (회원가입 시)
    static async setUserRole(userId, userEmail) {
        try {
            if (!this.isFirebaseAvailable()) {
                console.log('Firebase 사용 불가, 사용자 역할 설정 불가');
                return;
            }

            // 관리자 권한 확인
            const isAdmin = await this.isAdmin(userEmail);
            const userRole = isAdmin ? 'admin' : 'user';

            // 사용자 문서에 역할 추가
            await db.collection('users').doc(userId).update({
                role: userRole,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log(`사용자 역할 설정 완료: ${userEmail} - ${userRole}`);
        } catch (error) {
            console.error('사용자 역할 설정 실패:', error);
        }
    }

    // 이메일 중복 체크 (Firebase + localStorage + Firebase Auth)
    static async checkEmailDuplicate(email) {
        try {
            console.log('중복 체크 시작:', email);
            
            // 1. Firebase Auth에서 중복 체크 (가장 확실한 방법)
            if (this.isFirebaseAvailable()) {
                try {
                    // Firebase Auth fetchSignInMethodsForEmail 사용
                    const signInMethods = await auth.fetchSignInMethodsForEmail(email);
                    if (signInMethods && signInMethods.length > 0) {
                        console.log('Firebase Auth에서 중복 이메일 발견:', email);
                        return true;
                    }
                } catch (authError) {
                    console.warn('Firebase Auth 중복 체크 실패:', authError);
                }
                
                // 2. Firestore에서 중복 체크
                try {
                    const usersSnapshot = await db.collection('users')
                        .where('email', '==', email)
                        .limit(1)
                        .get();
                    
                    if (!usersSnapshot.empty) {
                        console.log('Firestore에서 중복 이메일 발견:', email);
                        return true;
                    }
                } catch (firestoreError) {
                    console.warn('Firestore 중복 체크 실패:', firestoreError);
                }
            }

            // 3. localStorage 중복 체크 제거 (Firebase만 사용)

            console.log('중복 체크 완료: 사용 가능한 이메일', email);
            return false;
        } catch (error) {
            console.error('중복 체크 실패:', error);
            return false; // 에러 시 허용 (사용자 경험 우선)
        }
    }

    // 관리자 계정 생성 함수
    static async createAdminAccount() {
        try {
            console.log('=== 관리자 계정 생성 시도 ===');
            
            // Firebase 초기화 대기
            let attempts = 0;
            const maxAttempts = 50;
            
            while (attempts < maxAttempts && !this.isFirebaseAvailable()) {
                console.log(`Firebase 초기화 대기 중... (${attempts + 1}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!this.isFirebaseAvailable()) {
                console.error('Firebase 사용 불가, 관리자 계정 생성 실패');
                return { success: false, error: 'Firebase not available' };
            }
            
            const adminEmail = 'admin7@gmail.com';
            const adminPassword = 'admin123!';
            
            // 관리자 계정 생성
            const userCredential = await auth.createUserWithEmailAndPassword(adminEmail, adminPassword);
            const user = userCredential.user;
            
            console.log('✅ 관리자 계정 생성 성공:', user.email);
            
            // 사용자 문서 생성
            await db.collection('users').doc(adminEmail).set({
                email: adminEmail,
                name: 'Administrator',
                role: 'admin',
                createdAt: new Date(),
                points: 0,
                addresses: [],
                cardInfo: null
            });
            
            console.log('✅ 관리자 사용자 문서 생성 완료');
            
            return { success: true, user: user };
            
        } catch (error) {
            console.error('관리자 계정 생성 실패:', error);
            
            if (error.code === 'auth/email-already-in-use') {
                console.log('관리자 계정이 이미 존재함');
                return { success: true, message: 'Account already exists' };
            }
            
            return { success: false, error: error.code, message: error.message };
        }
    }

    // 사용자 로그인 (더 안전한 에러 처리)
    static async loginUser(email, password) {
        console.log('=== 로그인 시도 시작 ===');
        console.log('이메일:', email);
        
        // Firebase 초기화 대기
        let attempts = 0;
        const maxAttempts = 100; // 10초 대기
        
        while (attempts < maxAttempts && !this.isFirebaseAvailable()) {
            console.log(`Firebase 초기화 대기 중... (${attempts + 1}/${maxAttempts})`);
            console.log('현재 Firebase 상태:', {
                auth: auth !== null,
                db: db !== null,
                firebase: typeof firebase !== 'undefined',
                firebaseApps: firebase.apps && firebase.apps.length > 0
            });
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.log('Firebase 사용 가능:', this.isFirebaseAvailable());

        if (!this.isFirebaseAvailable()) {
            console.log('Firebase 사용 불가 - 서버 연결을 확인해주세요');
            return { 
                success: false, 
                error: 'auth/network-request-failed', 
                message: 'ネットワークエラーが発生しました。接続を確認してください。' 
            };
        }
        
        // Firebase 초기화가 완료되었는지 한 번 더 확인
        if (!this.isFirebaseAvailable()) {
            console.log('Firebase 초기화가 아직 완료되지 않음, 추가 대기...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (!this.isFirebaseAvailable()) {
                console.log('Firebase 초기화 타임아웃 - 서버 연결을 확인해주세요');
                return { 
                    success: false, 
                    error: 'auth/network-request-failed', 
                    message: 'ネットワークエラーが発生しました。接続を確認してください。' 
                };
            }
        }

        try {
            // Firebase Auth로 로그인 시도
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // 사용자 프로필 가져오기 (email을 문서 ID로 사용)
            let userDoc = await db.collection('users').doc(user.email).get();
            let userData = {};
            
            if (userDoc.exists) {
                userData = userDoc.data();
                console.log('✅ 이메일 기반 사용자 문서 발견:', user.email);
            } else {
                // UID 기반 문서가 있는지 확인
                const uidDoc = await db.collection('users').doc(user.uid).get();
                if (uidDoc.exists) {
                    console.log('⚠️ UID 기반 문서 발견, 이메일 기반으로 마이그레이션:', user.uid);
                    userData = uidDoc.data();
                    // 이메일 기반 문서로 복사
                    await db.collection('users').doc(user.email).set({
                        ...userData,
                        email: user.email,
                        uid: user.uid,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    // UID 기반 문서 삭제
                    await db.collection('users').doc(user.uid).delete();
                    console.log('✅ UID → 이메일 기반 문서 마이그레이션 완료');
                } else {
                    // 새로운 사용자 문서 생성
                    userData = {
                        email: user.email,
                        uid: user.uid,
                        name: user.displayName || user.email.split('@')[0],
                        points: 0,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    await db.collection('users').doc(user.email).set(userData);
                    console.log('새 사용자 문서 생성:', user.email);
                }
            }

            // 관리자 권한 확인
            const isAdmin = await this.isAdmin(user.email);
            const userRole = isAdmin ? 'admin' : 'user';
            
            console.log('Firebase 로그인 성공:', user.email, `역할: ${userRole}`);

            // Firebase 전용 로그인 완료
            const userInfo = {
                uid: user.uid,
                email: user.email,
                name: userData.name || user.displayName || user.email.split('@')[0],
                points: userData.points || 0,
                isFirebase: true,
                role: userRole,
                isAdmin: isAdmin,
                ...userData
            };

            return { success: true, user: userInfo };
        } catch (error) {
            console.error('Firebase 로그인 실패:', error);
            
            // Firebase Authentication 관련 에러는 구체적인 메시지를 반환
            if (error.code && (
                error.code === 'auth/user-not-found' ||
                error.code === 'auth/wrong-password' ||
                error.code === 'auth/invalid-email' ||
                error.code === 'auth/invalid-login-credentials' ||
                error.code === 'auth/user-disabled' ||
                error.code === 'auth/too-many-requests' ||
                error.code === 'auth/network-request-failed'
            )) {
                console.log('Firebase Authentication 에러 - 구체적인 에러 메시지 반환:', error.code);
                
                // invalid-login-credentials는 더 안전하게 처리
                if (error.code === 'auth/invalid-login-credentials') {
                    console.log('🔍 invalid-login-credentials 에러 - v2.7 안전한 처리 (기존 경로)');
                    console.log('🔍 확인할 이메일:', email);
                    
                    // fetchSignInMethodsForEmail이 신뢰할 수 없으므로 안전한 처리
                    console.log('⚠️ fetchSignInMethodsForEmail 신뢰할 수 없음 - 기본적으로 비밀번호 오류로 처리 (기존 경로)');
                    console.log('💡 사용자 친화적 접근: 대부분의 경우 비밀번호 오류이므로 기본 처리');
                    
                    return { 
                        success: false, 
                        error: 'auth/wrong-password', 
                        message: 'メールアドレスまたはパスワードが一致しません。' 
                    };
                }
                
                return { success: false, error: error.code, message: error.message };
            }
            
            // auth/internal-error인 경우 실제 에러 메시지를 파싱
            if (error.code === 'auth/internal-error' && error.message) {
                console.log('auth/internal-error 파싱 시도:', error.message);
                
                try {
                    // JSON 파싱 시도
                    const errorData = JSON.parse(error.message);
                    console.log('파싱된 에러 데이터:', errorData);
                    
                    if (errorData.error && errorData.error.message) {
                        const actualError = errorData.error.message;
                        console.log('실제 에러 메시지:', actualError);
                        
                        // INVALID_LOGIN_CREDENTIALS인 경우 - 더 안전한 방법으로 처리
                        if (actualError === 'INVALID_LOGIN_CREDENTIALS') {
                            console.log('🔍 INVALID_LOGIN_CREDENTIALS 감지 - v2.7 안전한 처리');
                            
                            // fetchSignInMethodsForEmail이 신뢰할 수 없으므로, 다른 방법 사용
                            // sendPasswordResetEmail을 실제로 호출하지 않고 에러만 확인
                            try {
                                // 실제로는 이메일을 보내지 않고, 에러만 확인하는 방법
                                // 하지만 이 방법도 이메일을 보내므로, 더 간단한 방법 사용
                                
                                console.log('⚠️ fetchSignInMethodsForEmail 신뢰할 수 없음 - 기본적으로 비밀번호 오류로 처리');
                                console.log('💡 사용자 친화적 접근: 대부분의 경우 비밀번호 오류이므로 기본 처리');
                                
                                return { 
                                    success: false, 
                                    error: 'auth/wrong-password', 
                                    message: 'メールアドレスまたはパスワードが一致しません。' 
                                };
                                
                            } catch (error) {
                                console.log('❌ 이메일 확인 중 오류:', error);
                                return { 
                                    success: false, 
                                    error: 'auth/wrong-password', 
                                    message: 'メールアドレスまたはパスワードが一致しません。' 
                                };
                            }
                        }
                        
                        // auth/internal-error에서 처리한 경우 여기서 종료
                        console.log('🔄 auth/internal-error 처리 완료, 함수 종료');
                        return { 
                            success: false, 
                            error: 'auth/invalid-login-credentials', 
                            message: 'メールアドレスまたはパスワードが一致しません。' 
                        };
                    }
                } catch (parseError) {
                    console.log('JSON 파싱 실패:', parseError);
                }
            }
            
            // 기타 에러의 경우 Firebase 에러 그대로 반환
            console.log('기타 Firebase 에러:', error.code, error.message);
            return { success: false, error: error.code || 'auth/unknown-error', message: error.message };
        }
    }



    // 사용자 로그아웃
    static async logoutUser() {
        try {
            if (this.isFirebaseAvailable()) {
                await auth.signOut();
                console.log('Firebase 로그아웃 성공');
            }
            
            // Firebase 전용 로그아웃 완료
            console.log('Firebase 로그아웃 완료');
            return { success: true };
        } catch (error) {
            console.error('로그아웃 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 사용자 계정 삭제
    static async deleteUserAccount(uid, email) {
        try {
            let deleteSuccessful = false;

            // Firebase에서 사용자 삭제
            if (this.isFirebaseAvailable()) {
                try {
                    const user = auth.currentUser;
                    if (user && user.uid === uid) {
                        // 1. Firestore에서 사용자 데이터 삭제 (UID 기반)
                        await db.collection('users').doc(uid).delete();
                        console.log('Firestore 사용자 데이터 삭제 성공 (UID)');

                        // 2. Firestore에서 사용자 데이터 삭제 (이메일 기반)
                        try {
                            await db.collection('users').doc(email).delete();
                            console.log('Firestore 사용자 데이터 삭제 성공 (이메일)');
                        } catch (emailDocError) {
                            console.log('이메일 기반 사용자 문서 없음 또는 삭제 실패:', emailDocError.message);
                        }

                        // 3. 주문 내역 삭제
                        const ordersSnapshot = await db.collection('orders')
                            .where('userId', '==', uid)
                            .get();
                        
                        const ordersBatch = db.batch();
                        ordersSnapshot.forEach(doc => {
                            ordersBatch.delete(doc.ref);
                        });
                        
                        // 이메일 기반 주문 내역도 삭제
                        const emailOrdersSnapshot = await db.collection('orders')
                            .where('userEmail', '==', email)
                            .get();
                        
                        emailOrdersSnapshot.forEach(doc => {
                            ordersBatch.delete(doc.ref);
                        });
                        
                        await ordersBatch.commit();
                        console.log('주문 내역 삭제 성공:', ordersSnapshot.size + emailOrdersSnapshot.size, '건');

                        // 4. 포인트 히스토리 삭제 (UID 기반)
                        const pointHistorySnapshot = await db.collection('pointHistory')
                            .where('userId', '==', uid)
                            .get();
                        
                        const pointBatch = db.batch();
                        pointHistorySnapshot.forEach(doc => {
                            pointBatch.delete(doc.ref);
                        });
                        
                        // 이메일 기반 포인트 히스토리도 삭제
                        const emailPointHistorySnapshot = await db.collection('pointHistory')
                            .where('userEmail', '==', email)
                            .get();
                        
                        emailPointHistorySnapshot.forEach(doc => {
                            pointBatch.delete(doc.ref);
                        });
                        
                        await pointBatch.commit();
                        console.log('포인트 히스토리 삭제 성공:', pointHistorySnapshot.size + emailPointHistorySnapshot.size, '건');

                        // 5. QR 토큰 삭제
                        const qrTokenSnapshot = await db.collection('qrTokens')
                            .where('userId', '==', uid)
                            .get();
                        
                        const qrBatch = db.batch();
                        qrTokenSnapshot.forEach(doc => {
                            qrBatch.delete(doc.ref);
                        });
                        await qrBatch.commit();
                        console.log('QR 토큰 삭제 성공:', qrTokenSnapshot.size, '건');

                        // 6. Firebase Auth에서 사용자 삭제
                        await user.delete();
                        console.log('Firebase Auth 사용자 삭제 성공');
                        
                        // 7. localStorage 정리
                        this.clearUserDataFromLocalStorage(email);
                        
                        deleteSuccessful = true;
                    }
                } catch (firebaseError) {
                    console.warn('Firebase 사용자 삭제 실패:', firebaseError);
                }
            }

            // Firebase 전용 사용자 삭제 완료
            deleteSuccessful = true;

            if (deleteSuccessful) {
                console.log('사용자 계정 삭제 완료:', email);
                return { success: true };
            } else {
                return { success: false, error: '계정 삭제에 실패했습니다.' };
            }
        } catch (error) {
            console.error('계정 삭제 중 오류:', error);
            return { success: false, error: error.message };
        }
    }


    // 사용자 프로필 조회
    static async getUserProfile(uid) {
        try {
            const doc = await db.collection('users').doc(uid).get();
            if (doc.exists) {
                console.log('프로필 조회 성공');
                return { success: true, data: doc.data() };
            } else {
                console.log('프로필이 존재하지 않습니다');
                return { success: false, error: '프로필을 찾을 수 없습니다' };
            }
        } catch (error) {
            console.error('프로필 조회 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 사용자 프로필 업데이트 (이메일 기반)
    static async updateUserProfile(userEmail, userData) {
        try {
            await db.collection('users').doc(userEmail).update({
                ...userData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('프로필 업데이트 성공:', userEmail);
            return { success: true };
        } catch (error) {
            console.error('프로필 업데이트 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 주문 저장 함수
    static async saveOrder(orderData) {
        console.log('주문 저장 시작:', orderData);
        
        if (!this.isFirebaseAvailable()) {
            console.log('Firebase 사용 불가 - 네트워크 연결을 확인해주세요');
            return { 
                success: false, 
                error: 'network-error', 
                message: 'ネットワークエラーが発生しました。接続を確認してください。' 
            };
        }

        try {
            // 현재 사용자 확인
            const user = auth.currentUser;
            if (!user) {
                throw new Error('로그인이 필요합니다.');
            }

            // 주문 총액 계산
            const totalAmount = orderData.items.reduce((sum, item) => {
                return sum + (item.price * item.quantity);
            }, 0);

            // 적립 포인트 계산 (3%)
            const pointsToAdd = Math.floor(totalAmount * 0.03);

            // Firestore에 주문 저장 (이메일 기반 문서 ID 사용)
            const timestamp = Date.now();
            const orderDocId = `${user.email.replace('@', '_at_').replace('.', '_dot_')}_${timestamp}`;
            
            const orderRef = db.collection('orders').doc(orderDocId);
            await orderRef.set({
                userId: user.uid,
                userEmail: user.email,
                ...orderData,
                totalAmount: totalAmount,
                pointsEarned: pointsToAdd,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // 포인트 적립 (이메일 기반)
            await this.addPoints(user.email, pointsToAdd, `주문 ${orderDocId} 포인트 적립`);

            console.log('주문 저장 성공:', orderDocId);
            return { 
                success: true, 
                orderId: orderDocId,
                pointsEarned: pointsToAdd 
            };
        } catch (error) {
            console.error('주문 저장 실패:', error);
            return { 
                success: false, 
                error: error.code || 'order-save-failed', 
                message: '주문 저장에 실패했습니다. 다시 시도해주세요.' 
            };
        }
    }


    // 사용자 주문 이력 조회
    static async getUserOrders(uid) {
        console.log('사용자 주문 이력 조회:', uid);

        if (!this.isFirebaseAvailable()) {
            console.log('Firebase 사용 불가 - 네트워크 연결을 확인해주세요');
            return [];
        }

        try {
            const snapshot = await db.collection('orders')
                .where('userId', '==', uid)
                .orderBy('createdAt', 'desc')
                .get();

            const orders = [];
            snapshot.forEach(doc => {
                orders.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log('주문 이력 조회 성공:', orders.length);
            return orders;
        } catch (error) {
            console.error('주문 이력 조회 실패:', error);
            return [];
        }
    }


    // 포인트 적립 (이메일 기반)
    static async addPoints(userEmail, points, reason = '포인트 적립') {
        console.log('포인트 적립 시작:', { userEmail, points, reason });

        if (!this.isFirebaseAvailable()) {
            console.log('Firebase 사용 불가 - 네트워크 연결을 확인해주세요');
            return { 
                success: false, 
                error: 'network-error', 
                message: 'ネットワークエラーが発生しました。接続を確認してください。' 
            };
        }

        try {
            // 현재 포인트 조회
            const userDoc = await db.collection('users').doc(userEmail).get();
            const currentPoints = userDoc.exists ? (userDoc.data().points || 0) : 0;
            
            // 포인트 업데이트
            await db.collection('users').doc(userEmail).set({
                points: currentPoints + points,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // 포인트 이력 저장
            await db.collection('pointHistory').add({
                userId: userEmail,
                userEmail: userEmail,
                points: points,
                type: 'earn',
                reason: reason,
                balance: currentPoints + points,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('포인트 적립 성공:', points, '사용자:', userEmail);
            return { success: true, points: currentPoints + points };
        } catch (error) {
            console.error('포인트 적립 실패:', error);
            return { 
                success: false, 
                error: error.code || 'points-add-failed', 
                message: '포인트 적립에 실패했습니다. 다시 시도해주세요.' 
            };
        }
    }

    // 포인트 사용/차감 (이메일 기반)
    static async usePoints(userEmail, points, reason = '포인트 사용') {
        console.log('포인트 사용 시작:', { userEmail, points, reason });

        if (!this.isFirebaseAvailable()) {
            console.log('Firebase 사용 불가 - 네트워크 연결을 확인해주세요');
            return { 
                success: false, 
                error: 'network-error', 
                message: 'ネットワークエラーが発生しました。接続を確認してください。' 
            };
        }

        try {
            // 현재 포인트 조회
            const userDoc = await db.collection('users').doc(userEmail).get();
            if (!userDoc.exists) {
                return { success: false, error: '사용자를 찾을 수 없습니다' };
            }
            
            const currentPoints = userDoc.data().points || 0;
            
            // 포인트 부족 체크
            if (currentPoints < points) {
                return { success: false, error: '포인트가 부족합니다' };
            }
            
            const newPoints = currentPoints - points;
            
            // 포인트 업데이트
            await db.collection('users').doc(userEmail).set({
                points: newPoints,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // 포인트 이력 저장
            await db.collection('pointHistory').add({
                userId: userEmail,
                userEmail: userEmail,
                points: points,
                type: 'use',
                reason: reason,
                balance: newPoints,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('포인트 사용 성공:', points, '사용자:', userEmail);
            return { success: true, points: newPoints };
        } catch (error) {
            console.error('포인트 사용 실패:', error);
            return { 
                success: false, 
                error: error.code || 'points-use-failed', 
                message: '포인트 사용에 실패했습니다. 다시 시도해주세요.' 
            };
        }
    }

    // 오프라인 포인트 적립 (이메일 기반)


    // 오프라인 포인트 사용/차감 (이메일 기반)


    // 사용자 포인트 조회
    static async getUserPoints(uid) {
        console.log('사용자 포인트 조회:', uid);

        if (!this.isFirebaseAvailable()) {
            console.log('Firebase 사용 불가 - 네트워크 연결을 확인해주세요');
            return 0;
        }

        try {
            const doc = await db.collection('users').doc(uid).get();
            const points = doc.exists ? (doc.data().points || 0) : 0;
            
            console.log('포인트 조회 성공:', points);
            return points;
        } catch (error) {
            console.error('포인트 조회 실패:', error);
            return 0;
        }
    }

    // 오프라인 포인트 조회


    // 포인트 이력 조회
    static async getPointHistory(uid) {
        console.log('포인트 이력 조회:', uid);

        if (!this.isFirebaseAvailable()) {
            console.log('Firebase 사용 불가 - 네트워크 연결을 확인해주세요');
            return [];
        }

        try {
            const snapshot = await db.collection('pointHistory')
                .where('userId', '==', uid)
                .get();

            const history = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                history.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt ? {
                        seconds: data.createdAt.seconds || data.createdAt._seconds || 0,
                        nanoseconds: data.createdAt.nanoseconds || data.createdAt._nanoseconds || 0
                    } : { seconds: Date.now() / 1000, nanoseconds: 0 }
                });
            });

            // JavaScript에서 정렬
            history.sort((a, b) => {
                const timeA = a.createdAt.seconds * 1000 + a.createdAt.nanoseconds / 1000000;
                const timeB = b.createdAt.seconds * 1000 + b.createdAt.nanoseconds / 1000000;
                return timeB - timeA;
            });

            console.log('포인트 이력 조회 성공:', history.length);
            return history;
        } catch (error) {
            console.error('포인트 이력 조회 실패:', error);
            return [];
        }
    }

    // 오프라인 포인트 이력 조회


    // QR 코드용 사용자 토큰 생성
    static async generateUserQRToken(uid) {
        const qrToken = 'QR_' + uid + '_' + Date.now();

        if (!this.isFirebaseAvailable()) {
            console.log('Firebase 사용 불가 - 네트워크 연결을 확인해주세요');
            return { 
                success: false, 
                error: 'network-error', 
                message: 'ネットワークエラーが発生しました。接続を確認してください。' 
            };
        }

        try {
            const userRef = db.collection('users').doc(uid);
            
            await userRef.update({
                qrToken: qrToken,
                qrTokenCreatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('QR 토큰 생성 성공:', qrToken);
            return { success: true, qrToken: qrToken };
        } catch (error) {
            console.error('Firebase QR 토큰 생성 실패, localStorage로 폴백:', error);
            return { 
                success: false, 
                error: error.code || 'qr-token-failed', 
                message: 'QR 토큰 생성에 실패했습니다. 다시 시도해주세요.' 
            };
        }
    }

    // 오프라인 QR 토큰 생성 (제거됨 - Firebase 전용 사용)

    // QR 토큰으로 사용자 정보 조회 (매장용) - 개선된 버전
    static async getUserByQRToken(qrToken) {
        console.log('=== QR 토큰 검색 시작 ===');
        console.log('입력된 QR토큰:', qrToken);
        console.log('QR토큰 타입:', typeof qrToken);
        console.log('QR토큰 길이:', qrToken ? qrToken.length : 0);
        
        if (!qrToken || qrToken.trim() === '') {
            console.error('빈 QR토큰입니다');
            return { success: false, error: 'QR토큰이 비어있습니다' };
        }
        
        const cleanQRToken = qrToken.trim();
        
        // Firebase 시도
        if (this.isFirebaseAvailable()) {
            try {
                console.log('Firebase에서 QR토큰 검색 시도...');
                const snapshot = await db.collection('users')
                    .where('qrToken', '==', cleanQRToken)
                    .limit(1)
                    .get();
                
                console.log('Firebase 조회 결과 - 문서 수:', snapshot.size);
                
                if (!snapshot.empty) {
                    const userDoc = snapshot.docs[0];
                    const userData = userDoc.data();
                    
                    console.log('Firebase에서 QR 토큰 사용자 조회 성공');
                    console.log('찾은 사용자:', { uid: userDoc.id, email: userData.email, name: userData.name });
                    
                    return { 
                        success: true, 
                        user: {
                            uid: userDoc.id,
                            name: userData.name || userData.email || 'Unknown',
                            email: userData.email,
                            points: userData.points || 0,
                            phone: userData.phone
                        }
                    };
                } else {
                    console.log('Firebase에서 QR토큰 사용자를 찾을 수 없음');
                }
            } catch (error) {
                console.error('Firebase QR 토큰 조회 실패, localStorage로 폴백:', error);
            }
        } else {
            console.log('Firebase 사용 불가, localStorage로 바로 이동');
        }
        
        // localStorage에서 검색
        try {
            console.log('localStorage에서 QR토큰 검색 시도...');
            const users = JSON.parse(localStorage.getItem('aetherUsers') || '[]');
            console.log('localStorage 사용자 수:', users.length);
            
            // 전체 사용자들의 QR토큰 로그
            users.forEach((user, index) => {
                console.log(`사용자 ${index + 1}: ${user.email} - QR토큰: '${user.qrToken || '없음'}'`);
                if (user.qrToken === cleanQRToken) {
                    console.log(`✅ 매칭 발견! 사용자: ${user.email}`);
                }
            });
            
            const user = users.find(u => u.qrToken === cleanQRToken);
            
            if (user) {
                console.log('localStorage에서 QR 토큰 사용자 조회 성공');
                console.log('찾은 사용자:', { uid: user.uid, email: user.email, name: user.name });
                
                // localStorage에서 Firebase로 동기화 시도
                this.syncUserToFirebase(user);
                
                return {
                    success: true,
                    user: {
                        uid: user.uid,
                        name: user.name || user.email || 'Unknown',
                        email: user.email,
                        points: user.points || 0,
                        phone: user.phone
                    }
                };
            } else {
                console.log('localStorage에서 QR토큰 사용자를 찾을 수 없음');
            }
        } catch (error) {
            console.error('localStorage QR 토큰 조회 실패:', error);
        }
        
        // 마지막 수단: 이메일 형식 검사
        if (cleanQRToken.includes('@') && cleanQRToken.includes('.')) {
            console.log('이메일 형식 QR코드 감지, 이메일로 사용자 검색');
            
            try {
                const users = JSON.parse(localStorage.getItem('aetherUsers') || '[]');
                const userByEmail = users.find(u => u.email === cleanQRToken);
                
                if (userByEmail) {
                    console.log('이메일로 사용자 찾기 성공');
                    
                    // QR토큰이 없다면 생성
                    if (!userByEmail.qrToken) {
                        const newQRToken = `QR_${userByEmail.uid}_${Date.now()}`;
                        userByEmail.qrToken = newQRToken;
                        userByEmail.qrTokenCreatedAt = new Date().toISOString();
                        
                        // localStorage 업데이트
                        const userIndex = users.findIndex(u => u.email === cleanQRToken);
                        if (userIndex !== -1) {
                            users[userIndex] = userByEmail;
                            localStorage.setItem('aetherUsers', JSON.stringify(users));
                            console.log('새 QR토큰 생성:', newQRToken);
                        }
                    }
                    
                    return {
                        success: true,
                        user: {
                            uid: userByEmail.uid,
                            name: userByEmail.name || userByEmail.email || 'Unknown',
                            email: userByEmail.email,
                            points: userByEmail.points || 0,
                            phone: userByEmail.phone
                        }
                    };
                }
            } catch (error) {
                console.error('이메일 검색 실패:', error);
            }
        }
        
        console.log('=== QR 토큰 검색 실패 ===');
        console.log('검색한 QR토큰:', cleanQRToken);
        console.log('사용 가능한 모든 방법을 시도했지만 사용자를 찾을 수 없습니다');
        
        return { 
            success: false, 
            error: `有効なQRコードではありません。\n\nデバッグ情報:\nQRトークン: ${cleanQRToken}\nタイプ: ${typeof cleanQRToken}\n長さ: ${cleanQRToken.length}` 
        };
    }

    // 현재 로그인된 사용자 정보 가져오기
    static getCurrentUser() {
        return auth.currentUser;
    }

    // 인증 상태 변화 감지
    static onAuthStateChanged(callback) {
        return auth.onAuthStateChanged(callback);
    }

    // 에러 메시지 현지화 (더 자세한 메시지)
    static getLocalizedErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'このメールアドレスは登録されていません。',
            'auth/wrong-password': 'メールアドレスまたはパスワードが一致しません。',
            'auth/invalid-email': 'メールアドレスの形式が正しくありません。',
            'auth/invalid-login-credentials': 'メールアドレスまたはパスワードが一致しません。',
            'auth/user-disabled': 'このアカウントは無効化されています。',
            'auth/too-many-requests': 'ログイン試行回数が多すぎます。しばらく待ってから再試行してください。',
            'auth/network-request-failed': 'ネットワークエラーが発生しました。接続を確認してください。',
            'auth/email-already-in-use': 'このメールアドレスは既に使用されています。',
            'auth/weak-password': 'パスワードが弱すぎます。6文字以上で入力してください。',
            'auth/invalid-input': 'メールアドレスとパスワードを入力してください。',
            'auth/storage-error': 'データの読み込みに失敗しました。',
            'auth/unknown-error': 'ログイン中にエラーが発生しました。もう一度お試しください。',
            'auth/internal-error': 'システムエラーが発生しました。しばらく待ってから再試行してください。'
        };
        
        // 에러 코드가 없거나 알 수 없는 경우
        if (!errorCode) {
            return 'ログイン中にエラーが発生しました。もう一度お試しください。';
        }
        
        // 에러 메시지 반환
        const message = errorMessages[errorCode];
        console.log('🔍 에러 메시지 현지화:', {
            errorCode: errorCode,
            message: message || '기본 메시지 사용'
        });
        
        return message || 'ログイン中にエラーが発生しました。もう一度お試しください。';
    }

    // 관리자용 함수들
    
    // 모든 사용자 조회 (관리자용)
    static async getAllUsers(limit = 50) {
        try {
            const snapshot = await db.collection('users')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            
            const users = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                users.push({
                    uid: doc.id,
                    ...data,
                    createdAt: data.createdAt ? data.createdAt.toDate() : null
                });
            });
            
            console.log('전체 사용자 조회 성공');
            return { success: true, users: users };
        } catch (error) {
            console.error('전체 사용자 조회 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 전체 포인트 히스토리 조회 (관리자용)
    static async getAllPointHistory(limit = 100) {
        try {
            const snapshot = await db.collection('pointHistory')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            
            const history = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                history.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt ? data.createdAt.toDate() : null
                });
            });
            
            console.log('전체 포인트 히스토리 조회 성공');
            return { success: true, history: history };
        } catch (error) {
            console.error('전체 포인트 히스토리 조회 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 통계 데이터 조회 (관리자용)
    static async getAdminStats() {
        try {
            // 전체 사용자 수
            const usersSnapshot = await db.collection('users').get();
            const totalUsers = usersSnapshot.size;

            // 오늘 가입한 사용자 수
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayUsersSnapshot = await db.collection('users')
                .where('createdAt', '>=', today)
                .get();
            const todayUsers = todayUsersSnapshot.size;

            // 오늘 포인트 활동
            const todayPointsSnapshot = await db.collection('pointHistory')
                .where('createdAt', '>=', today)
                .get();
            
            let todayPointsEarned = 0;
            let todayPointsUsed = 0;
            let todayTransactions = 0;

            todayPointsSnapshot.forEach(doc => {
                const data = doc.data();
                todayTransactions++;
                if (data.type === 'earn' || data.type === 'admin_add') {
                    todayPointsEarned += data.points;
                } else if (data.type === 'use' || data.type === 'admin_subtract') {
                    todayPointsUsed += data.points;
                }
            });

            // 전체 포인트 합계
            let totalPointsInSystem = 0;
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                totalPointsInSystem += userData.points || 0;
            });

            console.log('관리자 통계 조회 성공');
            return {
                success: true,
                stats: {
                    totalUsers,
                    todayUsers,
                    todayPointsEarned,
                    todayPointsUsed,
                    todayTransactions,
                    totalPointsInSystem
                }
            };
        } catch (error) {
            console.error('관리자 통계 조회 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 사용자 검색 (관리자용)
    static async searchUsers(searchTerm) {
        try {
            // 이메일로 검색
            const emailSnapshot = await db.collection('users')
                .where('email', '>=', searchTerm)
                .where('email', '<=', searchTerm + '\uf8ff')
                .get();

            // 이름으로 검색
            const nameSnapshot = await db.collection('users')
                .where('name', '>=', searchTerm)
                .where('name', '<=', searchTerm + '\uf8ff')
                .get();

            const users = new Map();

            // 중복 제거하면서 결과 합치기
            emailSnapshot.forEach(doc => {
                const data = doc.data();
                users.set(doc.id, {
                    uid: doc.id,
                    ...data,
                    createdAt: data.createdAt ? data.createdAt.toDate() : null
                });
            });

            nameSnapshot.forEach(doc => {
                const data = doc.data();
                users.set(doc.id, {
                    uid: doc.id,
                    ...data,
                    createdAt: data.createdAt ? data.createdAt.toDate() : null
                });
            });

            console.log('사용자 검색 성공');
            return { success: true, users: Array.from(users.values()) };
        } catch (error) {
            console.error('사용자 검색 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 관리자 포인트 조작 (적립/차감)
    static async adminAdjustPoints(uid, points, reason) {
        try {
            const userRef = db.collection('users').doc(uid);
            const pointHistoryRef = db.collection('pointHistory');
            
            await db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                
                if (!userDoc.exists) {
                    throw new Error('사용자를 찾을 수 없습니다');
                }
                
                const currentPoints = userDoc.data().points || 0;
                const newPoints = Math.max(0, currentPoints + points); // 포인트가 음수가 되지 않도록
                
                // 사용자 포인트 업데이트
                transaction.update(userRef, {
                    points: newPoints,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // 포인트 히스토리 추가
                transaction.set(pointHistoryRef.doc(), {
                    userId: uid,
                    type: points > 0 ? 'admin_add' : 'admin_subtract',
                    points: Math.abs(points),
                    reason: reason,
                    balanceAfter: newPoints,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    adminAction: true
                });
            });
            
            console.log('관리자 포인트 조작 성공:', points);
            return { success: true, pointsAdjusted: points };
        } catch (error) {
            console.error('관리자 포인트 조작 실패:', error);
            return { success: false, error: error.message };
        }
    }
    // 관리자 권한 검증 (Firebase 기반으로 변경)
    static async checkAdminPermission(email) {
        return await this.isAdmin(email);
    }

    // 현재 사용자가 관리자인지 확인
    static async isCurrentUserAdmin() {
        try {
            // Firebase 사용자 확인
            if (this.isFirebaseAvailable()) {
                const user = firebase.auth().currentUser;
                if (user) {
                    return this.checkAdminPermission(user.email);
                }
            }
            
            // localStorage 사용자 확인
            const localUser = localStorage.getItem('aetherUser');
            if (localUser) {
                const userData = JSON.parse(localUser);
                return this.checkAdminPermission(userData.email);
            }
            
            return false;
        } catch (error) {
            console.error('관리자 권한 확인 실패:', error);
            return false;
        }
    }

    // 관리자 로그인 상태 확인
    static async getAdminLoginStatus() {
        try {
            const isAdmin = await this.isCurrentUserAdmin();
            if (!isAdmin) {
                return { success: false, error: '관리자 권한이 없습니다' };
            }

            // Firebase 사용자 정보
            if (this.isFirebaseAvailable()) {
                const user = firebase.auth().currentUser;
                if (user) {
                    return {
                        success: true,
                        admin: {
                            uid: user.uid,
                            email: user.email,
                            name: user.displayName || user.email,
                            isFirebaseUser: true
                        }
                    };
                }
            }

            // localStorage 사용자 정보
            const localUser = localStorage.getItem('aetherUser');
            if (localUser) {
                const userData = JSON.parse(localUser);
                return {
                    success: true,
                    admin: {
                        uid: userData.uid,
                        email: userData.email,
                        name: userData.name || userData.email,
                        isFirebaseUser: false
                    }
                };
            }

            return { success: false, error: '로그인이 필요합니다' };
        } catch (error) {
            console.error('관리자 로그인 상태 확인 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 관리자용 일일 통계 조회
    static async getAdminDailyStats(date = new Date()) {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            let stats = {
                date: date.toDateString(),
                earnedPoints: 0,
                usedPoints: 0,
                newCustomers: 0,
                totalTransactions: 0,
                transactions: []
            };

            if (this.isFirebaseAvailable()) {
                // Firebase에서 통계 조회
                const pointHistorySnapshot = await db.collection('pointHistory')
                    .where('timestamp', '>=', startOfDay)
                    .where('timestamp', '<=', endOfDay)
                    .get();

                pointHistorySnapshot.forEach(doc => {
                    const data = doc.data();
                    stats.totalTransactions++;
                    
                    if (data.type === 'earn') {
                        stats.earnedPoints += data.points;
                    } else if (data.type === 'use') {
                        stats.usedPoints += data.points;
                    }
                    
                    stats.transactions.push({
                        id: doc.id,
                        ...data,
                        timestamp: data.timestamp.toDate()
                    });
                });
            } else {
                // localStorage에서 통계 조회
                const pointHistory = JSON.parse(localStorage.getItem('aetherPointHistory') || '[]');
                
                pointHistory.forEach(transaction => {
                    const transactionDate = new Date(transaction.timestamp);
                    if (transactionDate >= startOfDay && transactionDate <= endOfDay) {
                        stats.totalTransactions++;
                        
                        if (transaction.type === 'earn') {
                            stats.earnedPoints += transaction.points;
                        } else if (transaction.type === 'use') {
                            stats.usedPoints += transaction.points;
                        }
                        
                        stats.transactions.push(transaction);
                    }
                });
            }

            return { success: true, stats };
        } catch (error) {
            console.error('일일 통계 조회 실패:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ===================
    // 포인트 유효기간 관리
    // ===================
    
    /**
     * 만료된 포인트 조회 및 제거
     */
    static async cleanupExpiredPoints(userId) {
        try {
            if (!this.isFirebaseAvailable()) {
                return this.cleanupExpiredPointsOffline(userId);
            }
            
            console.log('만료된 포인트 정리 시작:', userId);
            
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            
            // 만료된 포인트 이력 조회
            const expiredPointsQuery = await db.collection('pointHistory')
                .where('userId', '==', userId)
                .where('type', '==', 'earn')
                .where('timestamp', '<', oneYearAgo.toISOString())
                .where('expired', '!=', true)
                .get();
            
            let totalExpiredPoints = 0;
            const batch = db.batch();
            
            expiredPointsQuery.forEach(doc => {
                const pointData = doc.data();
                totalExpiredPoints += pointData.points;
                
                // 만료 표시
                batch.update(doc.ref, {
                    expired: true,
                    expiredAt: new Date().toISOString()
                });
            });
            
            if (totalExpiredPoints > 0) {
                // 사용자 포인트에서 차감
                const userRef = db.collection('users').doc(userId);
                const userDoc = await userRef.get();
                
                if (userDoc.exists) {
                    const currentPoints = userDoc.data().points || 0;
                    const newPoints = Math.max(0, currentPoints - totalExpiredPoints);
                    
                    batch.update(userRef, {
                        points: newPoints,
                        lastExpiredCleanup: new Date().toISOString()
                    });
                    
                    // 만료 이력 추가
                    const expiredHistoryRef = db.collection('pointHistory').doc();
                    batch.set(expiredHistoryRef, {
                        userId: userId,
                        points: totalExpiredPoints,
                        type: 'expire',
                        reason: 'ポイント有効期限切れ',
                        timestamp: new Date().toISOString(),
                        createdAt: new Date().toISOString()
                    });
                }
                
                await batch.commit();
                console.log(`만료된 포인트 정리 완료: ${totalExpiredPoints}포인트`);
            }
            
            return {
                success: true,
                expiredPoints: totalExpiredPoints,
                message: `${totalExpiredPoints}포인트가 만료되어 제거되었습니다`
            };
            
        } catch (error) {
            console.error('만료 포인트 정리 실패:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 오프라인 만료 포인트 정리
     */

    
    /**
     * 사용자의 포인트 유효기간 정보 조회
     */
    static async getPointExpiryInfo(userId) {
        try {
            if (!this.isFirebaseAvailable()) {
                return this.getPointExpiryInfoOffline(userId);
            }
            
            const now = new Date();
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            
            // 곧 만료될 포인트 (다음 달 내)
            const soonExpireQuery = await db.collection('pointHistory')
                .where('userId', '==', userId)
                .where('type', '==', 'earn')
                .where('expired', '!=', true)
                .get();
            
            let soonExpirePoints = 0;
            let totalActivePoints = 0;
            
            soonExpireQuery.forEach(doc => {
                const pointData = doc.data();
                const earnDate = new Date(pointData.timestamp);
                const expireDate = new Date(earnDate.getFullYear() + 1, earnDate.getMonth(), earnDate.getDate());
                
                if (expireDate > now) {
                    totalActivePoints += pointData.points;
                    
                    if (expireDate <= nextMonth) {
                        soonExpirePoints += pointData.points;
                    }
                }
            });
            
            return {
                success: true,
                soonExpirePoints: soonExpirePoints,
                totalActivePoints: totalActivePoints,
                message: soonExpirePoints > 0 ? 
                    `${soonExpirePoints}포인트가 다음 달에 만료됩니다` : 
                    '다음 달에 만료될 포인트가 없습니다'
            };
            
        } catch (error) {
            console.error('포인트 유효기간 정보 조회 실패:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 오프라인 포인트 유효기간 정보 조회
     */

    
    // ===================
    // 관리자 권한 관리 (Firebase 기반)
    // ===================
    
    // 관리자 권한 확인 (Firebase 기반)
    static async checkAdminPermission(userEmail) {
        if (!userEmail) {
            return { success: false, error: "이메일이 제공되지 않았습니다." };
        }

        try {
            const isAdmin = await this.isAdmin(userEmail);
            
            if (isAdmin) {
                return { success: true, message: "관리자 권한이 확인되었습니다." };
            } else {
                return { success: false, error: "관리자 권한이 없습니다." };
            }
        } catch (error) {
            return { success: false, error: "관리자 권한 확인 중 오류가 발생했습니다." };
        }
    }
    
    /**
     * 관리자 로그인 상태 확인
     */
    static async getAdminLoginStatus() {
        try {
            // Firebase 사용자 확인
            if (this.isFirebaseAvailable() && firebase.auth && firebase.auth().currentUser) {
                const user = firebase.auth().currentUser;
                console.log('Firebase 사용자 확인:', user.email);
                
                const adminCheck = await this.checkAdminPermission(user.email);
                
                if (adminCheck.success) {
                    return {
                        success: true,
                        admin: {
                            uid: user.uid,
                            email: user.email,
                            name: user.displayName || user.email.split('@')[0],
                            isFirebase: true
                        }
                    };
                } else {
                    return { success: false, error: adminCheck.error };
                }
            }
            
            // localStorage 사용자 확인
            const loginStatus = localStorage.getItem('aetherLoginStatus');
            if (loginStatus) {
                const user = JSON.parse(loginStatus);
                console.log('로컬 스토리지 사용자 확인:', user.email);
                
                const adminCheck = await this.checkAdminPermission(user.email);
                
                if (adminCheck.success) {
                    return {
                        success: true,
                        admin: {
                            uid: user.uid || 'local_' + Date.now(),
                            email: user.email,
                            name: user.name || user.email.split('@')[0],
                            isFirebase: false
                        }
                    };
                } else {
                    return { success: false, error: adminCheck.error };
                }
            }
            
            return { success: false, error: '로그인되지 않음' };
            
        } catch (error) {
            console.error('관리자 로그인 상태 확인 실패:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * QR토큰으로 사용자 조회
     */
    // Firebase 전용 QR 토큰 관리 시스템
    static async getOrCreateQRToken(userId) {
        console.log('🔍 Firebase 전용 QR 토큰 조회/생성 시작:', userId);
        
        if (!this.isFirebaseAvailable()) {
            throw new Error('Firebase 연결이 불가능합니다. 인터넷 연결을 확인해주세요.');
        }
        
        try {
            // 1. Firebase에서 기존 QR토큰 확인 (email을 문서 ID로 사용)
            console.log('📡 Firebase에서 QR토큰 검색 중...');
            const documentId = this.getUserDocumentId(userId);
            const userDoc = await db.collection('users').doc(documentId).get();
            
            if (userDoc.exists && userDoc.data().qrToken) {
                const token = userDoc.data().qrToken;
                console.log('✅ Firebase에서 기존 QR토큰 발견:', token);
                return token;
            }
            
            // 2. 새 QR토큰 생성 (사용자별 고유, 영구)
            const newToken = `QR_${userId}_PERMANENT_${Date.now()}`;
            console.log('🆕 새 영구 QR토큰 생성:', newToken);
            
            // Firebase에 저장 (email을 문서 ID로 사용)
            await db.collection('users').doc(documentId).set({
                qrToken: newToken,
                qrTokenUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log('✅ Firebase에 QR토큰 저장 완료 (merge: true)');
            
            return newToken;
        } catch (error) {
            console.error('❌ Firebase QR토큰 조회/생성 실패:', error);
            
            // 구체적인 에러 메시지 제공
            if (error.code === 'permission-denied') {
                throw new Error('Firebase 권한이 없습니다. 로그인 상태를 확인해주세요.');
            } else if (error.code === 'unavailable') {
                throw new Error('Firebase 서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.');
            } else if (error.code === 'not-found') {
                throw new Error('사용자 문서를 찾을 수 없습니다. 계정을 다시 확인해주세요.');
            } else {
                throw new Error(`QR토큰 생성에 실패했습니다: ${error.message}`);
            }
        }
    }
    
    // Firebase 전용 QR 토큰 관리 - localStorage 동기화 제거

    static async getUserByQRToken(qrToken) {
        console.log('QR 토큰으로 사용자 검색:', qrToken);
        
        // Firebase 시도
        if (this.isFirebaseAvailable()) {
            try {
                const snapshot = await db.collection('users')
                    .where('qrToken', '==', qrToken)
                    .limit(1)
                    .get();
                
                if (!snapshot.empty) {
                    const userDoc = snapshot.docs[0];
                    const userData = userDoc.data();
                    
                    console.log('Firebase에서 QR 토큰 사용자 조회 성공');
                    console.log('Firebase 사용자 데이터:', {
                        uid: userDoc.id,
                        name: userData.name,
                        email: userData.email,
                        points: userData.points,
                        phone: userData.phone,
                        전체데이터: userData
                    });
                    
                    // 사용자 데이터에 일관된 식별자 추가
                    const userResult = {
                        uid: userData.email || userDoc.id, // 이메일을 우선 사용, 없으면 문서 ID
                        email: userData.email,
                        name: userData.name,
                        points: userData.points || 0,
                        phone: userData.phone,
                        documentId: userDoc.id, // 실제 문서 ID도 보관
                        ...userData
                    };
                    
                    // 포인트 이력에서 실제 포인트 계산
                    let calculatedPoints = userData.points || 0;
                    try {
                        console.log('포인트 이력에서 실제 포인트 계산 시작...');
                        console.log('검색 조건:', `userId = ${userResult.uid} , userEmail = ${userResult.email} , documentId = ${userResult.documentId}`);
                        
                        // 전체 포인트 이력을 가져와서 여러 조건으로 필터링
                        const pointHistorySnapshot = await db.collection('pointHistory').get();
                        
                        let earnedPoints = 0;
                        let usedPoints = 0;
                        let foundHistories = [];
                        
                        pointHistorySnapshot.forEach(doc => {
                            const historyData = doc.data();
                            // userId 또는 userEmail로 매칭 (모든 가능한 식별자 확인)
                            if (historyData.userId === userResult.uid || 
                                historyData.userEmail === userResult.email ||
                                historyData.userId === userResult.email ||
                                historyData.userId === userResult.documentId ||
                                historyData.userEmail === userResult.uid) {
                                
                                foundHistories.push({
                                    docId: doc.id,
                                    type: historyData.type,
                                    points: historyData.points,
                                    reason: historyData.reason
                                });
                                
                                if (historyData.type === 'earn' || historyData.type === 'admin_add' || historyData.type === 'welcome_bonus') {
                                    earnedPoints += historyData.points || 0;
                                } else if (historyData.type === 'use' || historyData.type === 'admin_subtract') {
                                    usedPoints += historyData.points || 0;
                                }
                            }
                        });
                        
                        calculatedPoints = earnedPoints - usedPoints;
                        console.log('포인트 이력 검색 결과:', {
                            foundHistories: foundHistories.length,
                            histories: foundHistories,
                            earnedPoints,
                            usedPoints,
                            calculatedPoints,
                            userDataPoints: userData.points
                        });
                        
                        // 포인트 이력이 있고 계산이 맞지 않으면 경고만 출력 (자동 업데이트 하지 않음)
                        if (foundHistories.length > 0 && calculatedPoints !== (userData.points || 0)) {
                            console.warn('⚠️ 포인트 불일치 감지하지만 자동 업데이트하지 않음:', {
                                userDataPoints: userData.points,
                                calculatedPoints: calculatedPoints,
                                difference: (userData.points || 0) - calculatedPoints,
                                reason: '포인트 이력과 사용자 데이터 불일치'
                            });
                        } else if (foundHistories.length === 0) {
                            console.log('포인트 이력이 없음, 사용자 데이터 포인트 유지:', userData.points);
                        } else {
                            console.log('포인트 일치 확인됨:', userData.points);
                        }
                        
                    } catch (pointError) {
                        console.warn('포인트 이력 계산 실패:', pointError);
                    }
                    
                    // 계산된 포인트로 사용자 결과 업데이트
                    userResult.points = calculatedPoints;
                    
                    return { 
                        success: true, 
                        user: userResult
                    };
                }
            } catch (error) {
                console.error('Firebase QR 토큰 조회 실패, localStorage로 폴백:', error);
            }
        }
        
        // localStorage에서 검색
        try {
            const users = JSON.parse(localStorage.getItem('aetherUsers') || '[]');
            const user = users.find(u => u.qrToken === qrToken);
            
            if (user) {
                console.log('localStorage에서 QR 토큰 사용자 조회 성공');
                return {
                    success: true,
                    user: {
                        uid: user.uid,
                        name: user.name,
                        email: user.email,
                        points: user.points || 0,
                        phone: user.phone
                    }
                };
            }
        } catch (error) {
            console.error('localStorage QR 토큰 조회 실패:', error);
        }
        
        console.log('QR 토큰을 찾을 수 없음:', qrToken);
        return { success: false, error: '유효하지 않은 QR 코드입니다' };
    }
    
    // localStorage 사용자를 Firebase로 동기화 (비동기)
    static async syncUserToFirebase(user) {
        if (!this.isFirebaseAvailable() || !user.email) return;
        
        try {
            console.log('Firebase로 사용자 동기화 시도:', user.email);
            
            // Firebase에 사용자가 없다면 생성
            const snapshot = await db.collection('users')
                .where('email', '==', user.email)
                .limit(1)
                .get();
            
            if (snapshot.empty) {
                await db.collection('users').doc(user.uid || user.email).set({
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    points: user.points || 0,
                    qrToken: user.qrToken,
                    qrTokenCreatedAt: user.qrTokenCreatedAt || new Date().toISOString(),
                    createdAt: user.createdAt || new Date().toISOString(),
                    syncedFromLocalStorage: true
                });
                console.log('Firebase에 사용자 동기화 완료');
            }
        } catch (error) {
            console.warn('Firebase 동기화 실패 (무시):', error);
        }
    }
    
    /**
     * 사용자 QR토큰 생성 또는 기존 토큰 반환 - 개선된 버전
     */
    static async generateUserQRToken(userId, forceNew = false) {
        try {
            console.log('=== QR토큰 생성/조회 시작 ===');
            console.log('입력된 userId:', userId);
            console.log('강제 새로 생성:', forceNew);
            
            if (!userId) {
                throw new Error('userId가 필요합니다');
            }
            
            // 기존 QR토큰 확인 (강제 새로 생성이 아닌 경우)
            if (!forceNew) {
                console.log('기존 QR토큰 확인 시작...');
                
                // localStorage에서 기존 토큰 확인
                let users = JSON.parse(localStorage.getItem('aetherUsers') || '[]');
                const existingUserIndex = users.findIndex(u => u.uid === userId || u.email === userId);
                const existingUser = existingUserIndex !== -1 ? users[existingUserIndex] : null;
                
                console.log('localStorage 사용자 검색 결과:', existingUser ? `발견 (${existingUser.email})` : '없음');
                
                if (existingUser && existingUser.qrToken) {
                    console.log('기존 QR토큰 발견:', existingUser.qrToken);
                    return { success: true, qrToken: existingUser.qrToken };
                }
                
                // Firebase에서 기존 토큰 확인
                if (this.isFirebaseAvailable()) {
                    try {
                        console.log('Firebase에서 기존 토큰 확인 시도...');
                        const userDoc = await db.collection('users').doc(userId).get();
                        if (userDoc.exists && userDoc.data().qrToken) {
                            const existingToken = userDoc.data().qrToken;
                            console.log('Firebase에서 기존 QR토큰 발견:', existingToken);
                            
                            // localStorage에도 동기화
                            if (existingUser) {
                                users[existingUserIndex].qrToken = existingToken;
                                users[existingUserIndex].qrTokenCreatedAt = new Date().toISOString();
                                localStorage.setItem('aetherUsers', JSON.stringify(users));
                                console.log('localStorage에 Firebase 토큰 동기화 완료');
                            }
                            
                            return { success: true, qrToken: existingToken };
                        } else {
                            console.log('Firebase에서 기존 QR토큰 없음');
                        }
                    } catch (error) {
                        console.warn('Firebase에서 기존 토큰 확인 실패:', error);
                    }
                }
            }
            
            // 새 QR토큰 생성
            const qrToken = `QR_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log('새 QR토큰 생성:', qrToken);
            
            let firebaseSuccess = false;
            let localStorageSuccess = false;
            
            // Firebase에 저장 시도
            if (this.isFirebaseAvailable()) {
                try {
                    await db.collection('users').doc(userId).set({
                        qrToken: qrToken,
                        qrTokenCreatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        qrTokenUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                    
                    console.log('Firebase QR 토큰 저장 성공:', qrToken);
                    firebaseSuccess = true;
                } catch (firebaseError) {
                    console.warn('Firebase QR 토큰 저장 실패:', firebaseError);
                }
            }
            
            // localStorage에 저장 (항상 시도)
            try {
                const users = JSON.parse(localStorage.getItem('aetherUsers') || '[]');
                console.log('localStorage 사용자 수:', users.length);
                
                let userIndex = users.findIndex(u => u.uid === userId || u.email === userId);
                
                if (userIndex === -1) {
                    // 사용자가 없다면 기본 사용자 생성
                    const loginStatus = JSON.parse(localStorage.getItem('aetherLoginStatus') || '{}');
                    
                    // userId가 이메일 형식인지 확인
                    const isEmail = userId.includes('@');
                    
                    const newUser = {
                        uid: isEmail ? (loginStatus.uid || 'local_' + Date.now()) : userId,
                        email: isEmail ? userId : (loginStatus.email || `${userId}@unknown.com`),
                        name: loginStatus.name || loginStatus.email || (isEmail ? userId.split('@')[0] : userId),
                        points: 0,
                        qrToken: qrToken,
                        qrTokenCreatedAt: new Date().toISOString(),
                        createdAt: new Date().toISOString()
                    };
                    users.push(newUser);
                    userIndex = users.length - 1;
                    console.log('새 사용자 생성:', newUser.email, 'UID:', newUser.uid);
                } else {
                    // 기존 사용자 업데이트
                    users[userIndex].qrToken = qrToken;
                    users[userIndex].qrTokenCreatedAt = new Date().toISOString();
                    users[userIndex].qrTokenUpdatedAt = new Date().toISOString();
                    console.log('기존 사용자 QR토큰 업데이트:', users[userIndex].email, 'UID:', users[userIndex].uid);
                }
                
                localStorage.setItem('aetherUsers', JSON.stringify(users));
                console.log('localStorage QR 토큰 저장 성공');
                localStorageSuccess = true;
                
            } catch (localError) {
                console.error('localStorage QR 토큰 저장 실패:', localError);
            }
            
            if (firebaseSuccess || localStorageSuccess) {
                console.log('=== QR토큰 생성 성공 ===');
                console.log('최종 QR토큰:', qrToken);
                console.log('Firebase 저장:', firebaseSuccess);
                console.log('localStorage 저장:', localStorageSuccess);
                
                // 생성된 토큰으로 즉시 검증
                setTimeout(() => {
                    this.verifyToken(qrToken, userId);
                }, 100);
                
                return { success: true, qrToken: qrToken };
            } else {
                console.error('=== QR토큰 생성 실패 ===');
                console.error('Firebase 저장:', firebaseSuccess);
                console.error('localStorage 저장:', localStorageSuccess);
                throw new Error('모든 저장 방법이 실패했습니다');
            }
            
        } catch (error) {
            console.error('QR 토큰 생성 실패:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * QR토큰 검증 함수 (디버깅용)
     */
    static async verifyToken(qrToken, userId) {
        try {
            console.log('=== QR토큰 검증 시작 ===');
            console.log('검증할 토큰:', qrToken);
            console.log('예상 userId:', userId);
            
            const result = await this.getUserByQRToken(qrToken);
            
            if (result.success) {
                console.log('✅ QR토큰 검증 성공!');
                console.log('찾은 사용자:', result.user.email);
                console.log('찾은 UID:', result.user.uid);
                
                if (result.user.uid === userId || result.user.email === userId) {
                    console.log('✅ 사용자 ID 매칭 성공!');
                } else {
                    console.warn('⚠️ 사용자 ID 불일치!');
                    console.warn('예상:', userId);
                    console.warn('실제:', result.user.uid, '/', result.user.email);
                }
            } else {
                console.error('❌ QR토큰 검증 실패:', result.error);
            }
            
        } catch (error) {
            console.error('❌ QR토큰 검증 중 오류:', error);
        }
    }
    
    /**
     * 사용자 포인트 이력 조회
     */
    static async getPointHistory(userId) {
        try {
            if (!this.isFirebaseAvailable()) {
                return this.getPointHistoryOffline(userId);
            }
            
            console.log('포인트 이력 조회 시작:', userId);
            
            const snapshot = await db.collection('pointHistory')
                .where('userId', '==', userId)
                .orderBy('timestamp', 'desc')
                .limit(50)
                .get();
            
            const history = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                history.push({
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp || data.createdAt
                });
            });
            
            console.log(`Firebase 포인트 이력 조회 성공: ${history.length}건`);
            return history;
            
        } catch (error) {
            console.error('Firebase 포인트 이력 조회 실패:', error);
            return this.getPointHistoryOffline(userId);
        }
    }
    
    /**
     * 오프라인 포인트 이력 조회
     */

    
    /**
     * 사용자 주문 이력 조회
     */
    static async getOrderHistory(userId) {
        try {
            if (!this.isFirebaseAvailable()) {
                console.log('Firebase 연결 실패 - 주문 이력 조회 불가 (Firebase 전용)');
                return [];
            }
            
            console.log('주문 이력 조회 시작:', userId);
            
            // orderBy 없이 조회 (인덱스 문제 해결)
            const snapshot = await db.collection('orders')
                .where('userId', '==', userId)
                .limit(20)
                .get();
            
            const orders = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                orders.push({
                    id: doc.id,
                    ...data
                });
            });
            
            // 클라이언트 측에서 정렬 (Firestore Timestamp 지원)
            orders.sort((a, b) => {
                let timeA, timeB;
                
                // A 주문의 시간 처리
                if (a.orderDate && a.orderDate.seconds) {
                    timeA = new Date(a.orderDate.seconds * 1000);
                } else if (a.orderDate && a.orderDate.toDate) {
                    timeA = a.orderDate.toDate();
                } else if (a.orderDate) {
                    timeA = new Date(a.orderDate);
                } else if (a.createdAt && a.createdAt.seconds) {
                    timeA = new Date(a.createdAt.seconds * 1000);
                } else if (a.createdAt && a.createdAt.toDate) {
                    timeA = a.createdAt.toDate();
                } else if (a.createdAt) {
                    timeA = new Date(a.createdAt);
                } else {
                    timeA = new Date(0);
                }
                
                // B 주문의 시간 처리
                if (b.orderDate && b.orderDate.seconds) {
                    timeB = new Date(b.orderDate.seconds * 1000);
                } else if (b.orderDate && b.orderDate.toDate) {
                    timeB = b.orderDate.toDate();
                } else if (b.orderDate) {
                    timeB = new Date(b.orderDate);
                } else if (b.createdAt && b.createdAt.seconds) {
                    timeB = new Date(b.createdAt.seconds * 1000);
                } else if (b.createdAt && b.createdAt.toDate) {
                    timeB = b.createdAt.toDate();
                } else if (b.createdAt) {
                    timeB = new Date(b.createdAt);
                } else {
                    timeB = new Date(0);
                }
                
                return timeB.getTime() - timeA.getTime(); // 최신순
            });
            
            console.log(`Firebase 주문 이력 조회 성공: ${orders.length}건`);
            return orders;
            
        } catch (error) {
            console.error('Firebase 주문 이력 조회 실패:', error);
            console.log('Firebase 전용 시스템 - localStorage 폴백 사용 안함');
            return [];
        }
    }
    
    /**
     * Firebase 전용 - localStorage 주문 이력 조회 제거됨
     */

    
    // 포인트 이력 조회 (Firebase)
    static async getPointHistory(uid) {
        console.log('포인트 이력 조회 시작:', uid);
        
        if (!this.isFirebaseAvailable()) {
            console.log('Firebase 사용 불가 - 네트워크 연결을 확인해주세요');
            return [];
        }
        
        try {
            const snapshot = await db.collection('pointHistory')
                .where('userId', '==', uid)
                .orderBy('timestamp', 'desc')
                .limit(50)
                .get();
            
            const history = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                history.push({
                    id: doc.id,
                    ...data,
                    // Firestore Timestamp를 JavaScript Date로 변환
                    timestamp: data.timestamp && data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
                    createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                });
            });
            
            console.log(`Firebase 포인트 이력 조회 성공: ${history.length}건`);
            return history;
        } catch (error) {
            console.error('Firebase 포인트 이력 조회 실패:', error);
            // Firebase 실패 시 localStorage 폴백
            return [];
        }
    }
    
    // 포인트 이력 조회 (localStorage)


    // 브랜드 삭제
    static async deleteBrand(brandId) {
        try {
            console.log('🗑️ Firebase 브랜드 삭제 시작:', brandId);
            
            if (!this.isFirebaseAvailable()) {
                console.error('❌ Firebase 사용 불가');
                return { success: false, error: 'Firebase 연결이 필요합니다.' };
            }

            // Firestore에서 브랜드 문서 삭제
            await db.collection('brands').doc(brandId).delete();
            
            console.log('✅ Firebase 브랜드 삭제 성공:', brandId);
            return { success: true, message: '브랜드가 성공적으로 삭제되었습니다.' };
            
        } catch (error) {
            console.error('❌ Firebase 브랜드 삭제 실패:', error);
            return { success: false, error: error.message || '브랜드 삭제에 실패했습니다.' };
        }
    }
}

// QR 코드 관련 전역 함수들
window.generateQRCode = async function(userId) {
    try {
        const result = await FirebaseService.generateUserQRToken(userId);
        if (result.success) {
            return result.qrToken;
        }
        throw new Error(result.error || 'QRコード生成に失敗しました。');
    } catch (error) {
        console.error('QR コード生成エラー:', error);
        throw error;
    }
};

// window.showQRCode 함수 제거 - 각 페이지에서 자체 구현

// 전역 변수로 Firebase 서비스 노출
window.FirebaseService = FirebaseService;

// FirebaseService의 static 메서드를 window에 직접 노출
window.FirebaseService_getOrCreateQRToken = function(userId) {
    return FirebaseService.getOrCreateQRToken(userId);
};
window.FirebaseService_getUserByQRToken = function(qrToken) {
    return FirebaseService.getUserByQRToken(qrToken);
};
window.FirebaseService_isFirebaseAvailable = function() {
    return FirebaseService.isFirebaseAvailable();
};

// Firebase 객체들을 안전하게 전역 변수로 노출 (초기화 완료 후)
function setGlobalFirebaseObjects() {
    if (typeof firebase !== 'undefined') {
        window.firebase = firebase;
    }
    if (typeof auth !== 'undefined') {
        window.auth = auth;
    }
    if (typeof db !== 'undefined') {
        window.db = db;
    }
}

// FirebaseService 로드 확인 로그 - v2.8 (에러 메시지 일관성 수정)
console.log('🔥🔥🔥 FirebaseService 전역 export 완료 - v2.8 (새 프로젝트 aether-fixed) 🔥🔥🔥');
console.log('window.FirebaseService:', typeof window.FirebaseService);
console.log('window.FirebaseService_getOrCreateQRToken:', typeof window.FirebaseService_getOrCreateQRToken);
console.log('usePoints 함수 확인:', typeof FirebaseService.usePoints);
console.log('usePointsOffline 함수 확인:', typeof FirebaseService.usePointsOffline);

// 관리자 계정 생성 함수 전역 노출
window.createAdminAccount = FirebaseService.createAdminAccount;

// 전역 함수들 정의 (FirebaseService 클래스 정의 후)
window.checkFirestoreConnection = async function() {
    if (!FirebaseService.isFirebaseAvailable()) {
        console.log('Firebase 초기화되지 않음 - localStorage 모드');
        return true;
    }

    try {
        // db 객체 존재 여부 확인
        if (typeof db !== 'undefined' && db) {
            await db.collection('test').limit(1).get();
            console.log('Firestore 연결 정상');
            return true;
        } else {
            console.log('db 객체가 정의되지 않음 - localStorage 모드');
            return true;
        }
    } catch (error) {
        console.warn('Firestore 연결 실패:', error);
        return true;
    }
};

window.isOfflineMode = function() {
    return !FirebaseService.isFirebaseAvailable();
};

window.showOfflineModeAlert = function() {
    if (window.isOfflineMode()) {
        console.log('🔄 오프라인 모드로 동작 중입니다. 모든 데이터는 브라우저에 저장됩니다.');
    }
};

window.waitForFirebaseComplete = waitForInitialization;

// 사용자 방문 기록 저장 함수 (전역)
window.recordUserVisit = async function(userEmail, visitType = 'page_view', additionalData = {}) {
    try {
        if (!userEmail || !FirebaseService.isFirebaseAvailable()) {
            console.log('방문 기록 저장 건너뜀:', userEmail ? 'Firebase 미사용' : '사용자 이메일 없음');
            return;
        }
        
        const db = firebase.firestore();
        const visitData = {
            userEmail: userEmail,
            visitType: visitType, // 'login', 'page_view', 'action', 'purchase' 등
            timestamp: new Date(),
            userAgent: navigator.userAgent,
            pageUrl: window.location.href,
            referrer: document.referrer,
            ...additionalData
        };
        
        await db.collection('userVisits').add(visitData);
        console.log('✅ 사용자 방문 기록 저장:', userEmail, visitType);
    } catch (error) {
        console.error('❌ 방문 기록 저장 실패:', error);
    }
};

// Firebase 기반 카트 동기화 시스템
window.CartSyncService = {
    // Firebase 카트 데이터 저장
    async saveCartToFirebase(cartData, userEmail) {
        try {
            console.log('🛒 Firebase 카트 저장 시도:', {
                userEmail: userEmail,
                cartLength: cartData?.length || 0,
                firebaseAvailable: FirebaseService.isFirebaseAvailable(),
                cartData: cartData
            });
            
            // 사용자 이메일 상세 디버깅
            console.log('🔍 CartSyncService 사용자 이메일 디버깅:', {
                userEmail: userEmail,
                userEmailType: typeof userEmail,
                userEmailLength: userEmail?.length,
                userEmailFirst10: userEmail?.substring(0, 10),
                userEmailLast10: userEmail?.substring(userEmail.length - 10),
                firebaseCurrentUserEmail: firebase?.auth?.currentUser?.email,
                isEmailFormat: userEmail?.includes('@')
            });
            
            if (!userEmail) {
                console.log('❌ 사용자 이메일 없음 - Firebase 카트 저장 실패');
                return false;
            }
            
            // Firebase 초기화 대기 (최대 5초)
            let attempts = 0;
            const maxAttempts = 50;
            while (attempts < maxAttempts && !FirebaseService.isFirebaseAvailable()) {
                console.log(`⏳ Firebase 초기화 대기 중... (${attempts + 1}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!FirebaseService.isFirebaseAvailable()) {
                console.log('❌ Firebase 초기화 타임아웃 - localStorage만 사용');
                return false;
            }
            
            const db = firebase.firestore();
            await db.collection('userCarts').doc(userEmail).set({
                cart: cartData,
                lastUpdated: new Date(),
                userEmail: userEmail,
                deviceInfo: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform
                }
            });
            
            console.log('✅ Firebase 카트 저장 완료 (이메일):', userEmail, cartData.length, '개 상품');
            return true;
        } catch (error) {
            console.error('❌ Firebase 카트 저장 실패:', error);
            return false;
        }
    },
    
    // Firebase에서 카트 데이터 로드
    async loadCartFromFirebase(userEmail) {
        try {
            console.log('🛒 Firebase 카트 로드 시도:', {
                userEmail: userEmail,
                firebaseAvailable: FirebaseService.isFirebaseAvailable()
            });
            
            if (!FirebaseService.isFirebaseAvailable() || !userEmail) {
                console.log('Firebase 미사용 또는 사용자 없음 - 빈 카트 반환');
                return [];
            }
            
            const db = firebase.firestore();
            const cartDoc = await db.collection('userCarts').doc(userEmail).get();
            
            if (cartDoc.exists) {
                const cartData = cartDoc.data().cart || [];
                console.log('✅ Firebase 카트 로드 완료 (이메일):', userEmail, cartData.length, '개 상품');
                console.log('🛒 로드된 카트 데이터:', cartData);
                
                // localStorage 사용 안함 - Firebase 전용
                return cartData;
            } else {
                console.log('Firebase 카트 없음 - 빈 카트 반환');
                return [];
            }
        } catch (error) {
            console.error('❌ Firebase 카트 로드 실패:', error);
            // 오류 시 빈 카트 반환
            return [];
        }
    },
    
    // 카트 데이터 동기화 (저장 + 로드)
    async syncCart(userEmail, cartData = null) {
        try {
            console.log('🔄 카트 동기화 시작:', userEmail);
            
            // 현재 카트 데이터 가져오기 (Firebase 전용)
            if (!cartData) {
                cartData = [];
            }
            
            console.log('📦 전달된 카트 데이터:', cartData.length, '개 상품');
            
            // Firebase에서 기존 카트 데이터 로드
            const firebaseCart = await this.loadCartFromFirebase(userEmail);
            console.log('📦 Firebase 카트 데이터:', firebaseCart.length, '개 상품');
            
            // 더 최신 데이터가 있는 쪽을 선택
            let finalCart = cartData;
            
            if (firebaseCart.length > 0 && cartData.length > 0) {
                // 두 카트 모두 데이터가 있는 경우, 더 많은 상품이 있는 쪽을 선택
                if (firebaseCart.length > cartData.length) {
                    console.log('🔄 Firebase 카트가 더 많음 - Firebase 카트 사용');
                    finalCart = firebaseCart;
                } else if (cartData.length > firebaseCart.length) {
                    console.log('🔄 로컬 카트가 더 많음 - 로컬 카트 사용');
                    finalCart = cartData;
                } else {
                    console.log('🔄 카트 개수 동일 - 로컬 카트 사용');
                    finalCart = cartData;
                }
            } else if (firebaseCart.length > 0) {
                console.log('🔄 Firebase에만 데이터 있음 - Firebase 카트 사용');
                finalCart = firebaseCart;
            } else {
                console.log('🔄 로컬에만 데이터 있음 - 로컬 카트 사용');
                finalCart = cartData;
            }
            
            // 최종 선택된 카트를 Firebase에 저장
            const saved = await this.saveCartToFirebase(finalCart, userEmail);
            
            // localStorage 사용 안함 - Firebase 전용
            
            console.log('✅ 카트 동기화 완료 (이메일):', finalCart.length, '개 상품');
            return finalCart;
        } catch (error) {
            console.error('❌ 카트 동기화 실패:', error);
            return [];
        }
    },
    
    // 카트 리스너 설정 (실시간 동기화)
    setupCartListener(userEmail) {
        try {
            console.log('🛒 카트 리스너 설정 시도:', {
                userEmail: userEmail,
                firebaseAvailable: FirebaseService.isFirebaseAvailable(),
                currentPage: window.location.pathname
            });
            
            if (!FirebaseService.isFirebaseAvailable() || !userEmail) {
                console.log('Firebase 미사용 - 카트 리스너 설정 안함');
                return;
            }
            
            const db = firebase.firestore();
            db.collection('userCarts').doc(userEmail).onSnapshot((doc) => {
                console.log('🔄 Firebase 카트 변경 감지:', doc.exists ? '문서 존재' : '문서 없음');
                
                if (doc.exists) {
                    const cartData = doc.data().cart || [];
                    
                    console.log('🛒 Firebase 카트 변경 감지:', {
                        firebaseCartLength: cartData.length,
                        timestamp: new Date().toISOString()
                    });
                    
                    // Firebase 카트 변경 알림
                    console.log('🔄 카트 데이터 변경 감지 - 알림 전송 중...');
                    
                    // 각 페이지에서 자체적으로 카트를 관리하므로 여기서는 알림만
                    if (typeof window.onFirebaseCartChange === 'function') {
                        window.onFirebaseCartChange(cartData);
                    }
                    
                    // 카트 카운트 업데이트
                    if (typeof updateCartCount === 'function') {
                        updateCartCount();
                    }
                    
                    // 페이지별 카트 렌더링 함수 호출
                    if (typeof renderCart === 'function') {
                        renderCart();
                    }
                    if (typeof renderOrderItems === 'function') {
                        renderOrderItems();
                    }
                    
                    console.log('✅ 카트 실시간 업데이트 완료:', cartData.length, '개 상품');
                }
            });
            
            console.log('✅ 카트 실시간 리스너 설정 완료');
        } catch (error) {
            console.error('❌ 카트 리스너 설정 실패:', error);
        }
    }
};

// 자동 방문 기록 저장 및 카트 동기화 (페이지 로드 시)
document.addEventListener('DOMContentLoaded', function() {
    // Firebase 초기화 완료 후 사용자 확인하여 방문 기록 저장 및 카트 동기화
    setTimeout(async () => {
        try {
            if (firebase?.auth?.currentUser?.email) {
                await window.recordUserVisit(
                    firebase.auth.currentUser.email, 
                    'page_view',
                    { pageTitle: document.title }
                );
                
                // 카트 동기화 및 실시간 리스너 설정
                if (window.CartSyncService) {
                    console.log('🛒 전역 카트 동기화 시작');
                    
                    // 사용할 이메일 주소 확인
                    let emailToUse = firebase.auth.currentUser.email;
                    
                    // Firebase Auth currentUser가 null인 경우 auth-utils.js에서 사용자 정보 확인
                    if (!emailToUse && typeof getCurrentUser === 'function') {
                        const authUtilsUser = getCurrentUser();
                        if (authUtilsUser) {
                            emailToUse = authUtilsUser.email;
                            console.log('🔧 전역 카트 동기화: auth-utils.js에서 사용자 정보 사용:', emailToUse);
                        }
                    }
                    
                    if (emailToUse) {
                        console.log('🔍 전역 카트 동기화에 사용할 이메일:', emailToUse);
                        
                        // Firebase에서 카트 로드 (이메일 주소 사용)
                        const syncedCart = await window.CartSyncService.syncCart(emailToUse);
                        console.log('✅ 전역 카트 동기화 완료:', syncedCart.length, '개 상품');
                        
                        // 실시간 카트 리스너 설정 (이메일 주소 사용)
                        window.CartSyncService.setupCartListener(emailToUse);
                        console.log('🔄 전역 실시간 카트 리스너 설정 완료');
                        
                        // 카트 카운트 업데이트
                        if (typeof updateCartCount === 'function') {
                            updateCartCount();
                        }
                    } else {
                        console.log('전역 카트 동기화 건너뜀 - 사용자 이메일 없음');
                    }
                }
            }
        } catch (error) {
            console.warn('자동 방문 기록 저장 및 카트 동기화 실패:', error);
        }
    }, 3000); // Firebase 초기화 대기 (3초로 증가)
}); 