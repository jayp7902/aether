// 인증 관련 공통 유틸리티 함수들 (충돌 방지 버전)

// 현재 사용자 정보를 저장할 전역 변수
let currentAuthUser = null;
let isAuthInitialized = false;

// 페이지별 인증 상태 감지 비활성화 리스트
const AUTH_DISABLED_PAGES = ['login.html', 'register.html'];

// 현재 페이지가 인증 상태 감지를 비활성화해야 하는지 확인
function shouldDisableAuthListener() {
    const currentPath = window.location.pathname;
    return AUTH_DISABLED_PAGES.some(page => currentPath.includes(page));
}

// Firebase 초기화 대기 함수 개선
function waitForFirebase() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50; // 5초 대기
        
        function check() {
            attempts++;
            
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.apps && firebase.apps.length > 0) {
                console.log('Firebase 초기화 완료');
                resolve();
            } else if (attempts >= maxAttempts) {
                console.warn('Firebase 초기화 시간 초과, localStorage 모드로 전환');
                resolve(); // 시간 초과해도 resolve하여 계속 진행
            } else {
                setTimeout(check, 100);
            }
        }
        
        check();
    });
}

// 현재 사용자 정보 가져오기 (Firebase + localStorage 지원, 호환성 개선)
function getCurrentUser() {
    // Firebase 사용자 확인 (안전한 방식)
    try {
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.apps && firebase.apps.length > 0) {
            const firebaseUser = firebase.auth().currentUser;
            if (firebaseUser) {
                return firebaseUser;
            }
        }
    } catch (error) {
        console.warn('Firebase 사용자 확인 중 오류:', error);
    }
    
    // localStorage에서 로그인 상태 확인 (여러 형식 지원)
    try {
        // 최신 방식 (aetherLoginStatus)
        const loginStatus = localStorage.getItem('aetherLoginStatus');
        if (loginStatus) {
            const parsed = JSON.parse(loginStatus);
            console.log('최신 로그인 상태 발견:', parsed.email);
            return parsed;
        }
        
        // 구 방식 호환성 (aetherLogin)
        const oldLoginStatus = localStorage.getItem('aetherLogin') || sessionStorage.getItem('aetherLogin');
        if (oldLoginStatus) {
            const parsed = JSON.parse(oldLoginStatus);
            console.log('구 방식 로그인 상태 발견, 최신 형식으로 변환:', parsed.email);
            
            // 최신 형식으로 변환하여 저장
            const newLoginStatus = {
                uid: parsed.uid || 'legacy_' + Date.now(),
                email: parsed.email,
                name: parsed.name || parsed.email.split('@')[0],
                loginTime: new Date().toISOString(),
                isLegacy: true
            };
            localStorage.setItem('aetherLoginStatus', JSON.stringify(newLoginStatus));
            
            // 구 데이터 제거
            localStorage.removeItem('aetherLogin');
            sessionStorage.removeItem('aetherLogin');
            
            return newLoginStatus;
        }
    } catch (e) {
        console.error('로그인 상태 파싱 오류:', e);
    }
    
    return null;
}

// 관리자 권한 확인 함수 (Firebase 기반)
async function checkAdminPermission(email) {
    if (!email) return false;
    
    // Firebase 초기화 대기
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
        console.log(`🔍 FirebaseService 체크 (시도 ${attempts + 1}/${maxAttempts}):`, {
            'FirebaseService 정의됨': typeof FirebaseService !== 'undefined',
            'FirebaseService 타입': typeof FirebaseService,
            'FirebaseService.isFirebaseAvailable 함수': typeof FirebaseService?.isFirebaseAvailable
        });
        
        if (typeof FirebaseService !== 'undefined' && FirebaseService.isFirebaseAvailable()) {
            console.log('✅ Firebase 사용 가능, 관리자 권한 확인 시작');
            break;
        }
        
        console.log(`Firebase 초기화 대기 중... (${attempts + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
    }
    
    if (attempts >= maxAttempts) {
        console.warn('❌ Firebase 초기화 시간 초과, 관리자 권한 확인 불가');
        return false;
    }
    
    // Firebase가 사용 가능한 경우 Firebase에서 관리자 권한 확인
    try {
        const isAdmin = await FirebaseService.isAdmin(email);
        console.log(`관리자 권한 확인 (Firebase): ${email} - ${isAdmin ? '관리자' : '일반 사용자'}`);
        return isAdmin;
    } catch (error) {
        console.error('Firebase 관리자 권한 확인 실패:', error);
        console.warn('Firebase 연결 실패로 관리자 권한 확인 불가');
        return false;
    }
}

// 사용자 표시 이름 생성 (공통 함수)
function getUserDisplayName(user, loginStatus) {
    let email = '';
    
    // 이메일 추출
    if (user && user.email) {
        email = user.email;
    } else if (loginStatus && loginStatus.email) {
        email = loginStatus.email;
    }
    
    // 이메일 앞부분(@앞)을 표시 이름으로 사용
    if (email) {
        return email.split('@')[0];
    }
    
    // 이메일이 없으면 기본값
    return 'ユーザー';
}

// 사용자 메뉴 업데이트 (Firebase + localStorage 지원)
async function updateUserMenu() {
    let user = getCurrentUser();
    let loginStatus = null;
    
    // Firebase 사용자가 없으면 localStorage에서 확인
    if (!user) {
        try {
            loginStatus = JSON.parse(localStorage.getItem('aetherLoginStatus') || 'null');
        } catch (e) {
            loginStatus = null;
        }
    }
    
    // 데스크톱용 메뉴 요소들
    const userNameElement = document.getElementById('user-name');
    const loginMenu = document.getElementById('login-menu');
    const registerMenu = document.getElementById('register-menu');
    const profileMenu = document.getElementById('profile-menu');
    const pointsMenu = document.getElementById('points-menu');
    const adminMenu = document.getElementById('admin-menu');
    const logoutMenu = document.getElementById('logout-menu');
    const logoutMenuItem = document.getElementById('logout-menu-item');
    
    // 모바일용 메뉴 요소들
    const loginMenuMobile = document.getElementById('login-menu-mobile');
    const registerMenuMobile = document.getElementById('register-menu-mobile');
    const profileMenuMobile = document.getElementById('profile-menu-mobile');
    const pointsMenuMobile = document.getElementById('points-menu-mobile');
    const adminMenuMobile = document.getElementById('admin-menu-mobile');
    const logoutMenuMobile = document.getElementById('logout-menu-mobile');
    const logoutMenuItemMobile = document.getElementById('logout-menu-item-mobile');

    if (user || loginStatus) {
        // 로그인된 상태 (Firebase 또는 localStorage)
        if (userNameElement) {
            const displayName = getUserDisplayName(user, loginStatus);
            userNameElement.textContent = displayName;
            userNameElement.classList.remove('d-none');
        }
        
        // 관리자 권한 확인 (비동기 처리)
        const userEmail = (user && user.email) || (loginStatus && loginStatus.email);
        let isAdmin = false;
        
        console.log('🔍 auth-utils.js 관리자 권한 확인 시작:', userEmail);
        console.log('🔍 user 객체:', user);
        console.log('🔍 loginStatus 객체:', loginStatus);
        
        if (userEmail) {
            try {
                console.log('🔍 checkAdminPermission 함수 호출 시작');
                isAdmin = await checkAdminPermission(userEmail);
                console.log('🔍 checkAdminPermission 결과:', isAdmin);
            } catch (error) {
                console.error('❌ 관리자 권한 확인 실패:', error);
                isAdmin = false;
            }
        } else {
            console.log('⚠️ 사용자 이메일이 없어서 관리자 권한 확인 불가');
        }
        
        // 데스크톱 메뉴 업데이트
        console.log('🔧 데스크톱 메뉴 업데이트 시작, isAdmin:', isAdmin);
        if (loginMenu) loginMenu.style.display = 'none';
        if (registerMenu) registerMenu.style.display = 'none';
        if (profileMenu) profileMenu.style.display = 'block';
        if (pointsMenu) pointsMenu.style.display = 'block';
        if (adminMenu) {
            adminMenu.style.display = isAdmin ? 'block' : 'none';
            console.log('🔧 관리자 메뉴 표시 설정:', isAdmin ? 'block' : 'none');
            console.log('🔧 adminMenu 요소:', adminMenu);
            console.log('🔧 adminMenu 현재 display:', adminMenu.style.display);
        } else {
            console.warn('⚠️ adminMenu 요소를 찾을 수 없습니다');
        }
        if (logoutMenu) logoutMenu.style.display = 'block';
        if (logoutMenuItem) logoutMenuItem.style.display = 'block';
        
        // 모바일 메뉴 업데이트
        console.log('🔧 모바일 메뉴 업데이트 시작, isAdmin:', isAdmin);
        if (loginMenuMobile) loginMenuMobile.style.display = 'none';
        if (registerMenuMobile) registerMenuMobile.style.display = 'none';
        if (profileMenuMobile) profileMenuMobile.style.display = 'block';
        if (pointsMenuMobile) pointsMenuMobile.style.display = 'block';
        if (adminMenuMobile) {
            adminMenuMobile.style.display = isAdmin ? 'block' : 'none';
            console.log('🔧 모바일 관리자 메뉴 표시 설정:', isAdmin ? 'block' : 'none');
            console.log('🔧 adminMenuMobile 요소:', adminMenuMobile);
            console.log('🔧 adminMenuMobile 현재 display:', adminMenuMobile.style.display);
        } else {
            console.warn('⚠️ adminMenuMobile 요소를 찾을 수 없습니다');
        }
        if (logoutMenuMobile) logoutMenuMobile.style.display = 'block';
        if (logoutMenuItemMobile) logoutMenuItemMobile.style.display = 'block';
    } else {
        // 로그인되지 않은 상태
        if (userNameElement) {
            userNameElement.textContent = '';
            userNameElement.classList.add('d-none');
        }
        
        // 데스크톱 메뉴 업데이트
        if (loginMenu) loginMenu.style.display = 'block';
        if (registerMenu) registerMenu.style.display = 'block';
        if (profileMenu) profileMenu.style.display = 'none';
        if (pointsMenu) pointsMenu.style.display = 'none';
        if (logoutMenu) logoutMenu.style.display = 'none';
        if (logoutMenuItem) logoutMenuItem.style.display = 'none';
        
        // 모바일 메뉴 업데이트
        if (loginMenuMobile) loginMenuMobile.style.display = 'block';
        if (registerMenuMobile) registerMenuMobile.style.display = 'block';
        if (profileMenuMobile) profileMenuMobile.style.display = 'none';
        if (pointsMenuMobile) pointsMenuMobile.style.display = 'none';
        if (logoutMenuMobile) logoutMenuMobile.style.display = 'none';
        if (logoutMenuItemMobile) logoutMenuItemMobile.style.display = 'none';
    }
    
    console.log('✅ updateUserMenu 함수 실행 완료');
    return Promise.resolve();
}

// 토스트 알림 시스템
function showToast(message, type = 'info', duration = 3000) {
    // 기존 토스트 컨테이너 확인 또는 생성
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(toastContainer);
    }
    
    // 토스트 아이템 생성
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 250px;
        max-width: 350px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
    `;
    
    // 아이콘 설정
    const icon = document.createElement('i');
    icon.className = 'fas';
    switch (type) {
        case 'success':
            icon.className += ' fa-check-circle';
            toast.style.borderLeft = '4px solid #343a40';
            break;
        case 'error':
            icon.className += ' fa-exclamation-circle';
            toast.style.borderLeft = '4px solid #6c757d';
            break;
        case 'warning':
            icon.className += ' fa-exclamation-triangle';
            toast.style.borderLeft = '4px solid #495057';
            break;
        default:
            icon.className += ' fa-info-circle';
            toast.style.borderLeft = '4px solid #6c757d';
    }
    icon.style.color = '#6c757d';
    
    // 메시지 텍스트
    const messageText = document.createElement('span');
    messageText.textContent = message;
    messageText.style.flex = '1';
    
    // 닫기 버튼
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 18px;
        color: #6c757d;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    closeBtn.onclick = () => removeToast(toast);
    
    // 토스트 구성
    toast.appendChild(icon);
    toast.appendChild(messageText);
    toast.appendChild(closeBtn);
    toastContainer.appendChild(toast);
    
    // 애니메이션 시작
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 10);
    
    // 자동 제거
    setTimeout(() => {
        removeToast(toast);
    }, duration);
}

function removeToast(toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

// 로그아웃 함수
async function logout() {
    try {
        console.log('=== 로그아웃 시작 ===');
        
        // Firebase 로그아웃
        if (typeof firebase !== 'undefined' && firebase.auth) {
            await firebase.auth().signOut();
            console.log('Firebase 로그아웃 완료');
        }
        
        // 모든 localStorage 로그인 상태 제거
        localStorage.removeItem('aetherLoginStatus');
        localStorage.removeItem('aetherLogin');
        sessionStorage.removeItem('aetherLogin');
        console.log('로그인 상태 정보 제거 완료');
        
        // FirebaseService 로그아웃 호출 (있는 경우)
        if (typeof FirebaseService !== 'undefined') {
            await FirebaseService.logoutUser();
            console.log('FirebaseService 로그아웃 완료');
        }
        
        // 전역 변수 초기화
        currentAuthUser = null;
        
        console.log('로그아웃 성공');
        showToast('ログアウトしました。', 'success', 2000);
        await updateUserMenu();
        
        // 현재 페이지에 따라 적절한 페이지로 리다이렉트
        setTimeout(() => {
            redirectAfterLogout();
        }, 1000);
    } catch (error) {
        console.error('로그아웃 중 오류 발생:', error);
        
        // 오류가 발생해도 강제로 로그인 상태 제거
        localStorage.removeItem('aetherLoginStatus');
        localStorage.removeItem('aetherLogin');
        sessionStorage.removeItem('aetherLogin');
        currentAuthUser = null;
        
        showToast('ログアウトしました。', 'success', 2000);
        await updateUserMenu();
        setTimeout(() => {
            redirectAfterLogout();
        }, 1000);
    }
}

// 로그아웃 후 리다이렉트 처리
function redirectAfterLogout() {
    const currentPath = window.location.pathname;
    const currentOrigin = window.location.origin;
    
    // 현재 페이지가 어느 디렉토리에 있는지 확인
    if (currentPath.includes('/PRODUCTS PAGE/')) {
        // 상품 페이지에서 로그아웃한 경우 - 루트의 index.html로 이동
        window.location.href = currentOrigin + '/';
    } else if (currentPath.includes('/brands/')) {
        // 브랜드 페이지에서 로그아웃한 경우 - 루트의 index.html로 이동
        window.location.href = currentOrigin + '/';
    } else if (currentPath.includes('profile.html') || currentPath.includes('points.html')) {
        // 프로필이나 포인트 페이지에서 로그아웃한 경우 - 루트의 index.html로 이동
        window.location.href = currentOrigin + '/';
    } else {
        // 기본적으로 현재 페이지에 머물거나 상대 경로로 index.html 이동
        if (currentPath === '/' || currentPath.endsWith('index.html')) {
            // 이미 홈페이지에 있으면 새로고침
            window.location.reload();
        } else {
            // 루트로 이동
            window.location.href = '/';
        }
    }
}

// 프로필 페이지로 이동
function showProfile() {
    window.location.href = 'profile.html';
}

// 카트 개수 업데이트
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('aetherCart') || '[]');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    // 데스크톱용 장바구니 카운트 업데이트
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
    }
    
    // 모바일용 장바구니 카운트 업데이트
    const cartCountMobileElement = document.getElementById('cart-count-mobile');
    if (cartCountMobileElement) {
        cartCountMobileElement.textContent = totalItems;
    }
}

// 로그인이 필요한 페이지에서 사용하는 함수
function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        alert('ログインが必要です。');
        const currentUrl = encodeURIComponent(window.location.href);
        window.location.href = `login.html?redirect=${currentUrl}`;
        return false;
    }
    return true;
}

// 페이지 초기화 함수 (단순화)
async function initializePage() {
    try {
        // 카트 개수 업데이트
        updateCartCount();
        
        // 인증 상태 감지가 비활성화된 페이지인지 확인
        if (shouldDisableAuthListener()) {
            console.log('인증 상태 감지 비활성화 페이지:', window.location.pathname);
            // 단순히 현재 사용자 상태만 확인하여 메뉴 업데이트
            await updateUserMenu();
            return;
        }
        
        // Firebase 초기화 대기
        await waitForFirebase();
        
        // 현재 사용자 상태 확인 (한 번만)
        const user = getCurrentUser();
        currentAuthUser = user;
        await updateUserMenu();
        
        // 일반 페이지에서만 인증 상태 변화 감지
        if (!isAuthInitialized) {
            isAuthInitialized = true;
            firebase.auth().onAuthStateChanged(async (user) => {
                currentAuthUser = user;
                await updateUserMenu();
                console.log('인증 상태 변경:', user ? user.email : '로그아웃');
                
                // 로그인 시 방문 기록 저장 및 카트 동기화
                if (user && user.email) {
                    try {
                        await window.recordUserVisit(user.email, 'login', {
                            loginTime: new Date().toISOString(),
                            pageTitle: document.title
                        });
                        
                        // 카트 동기화 설정
                        if (window.CartSyncService) {
                            console.log('🛒 로그인 시 카트 동기화 시작');
                            console.log('🔍 사용자 정보 디버깅:', {
                                uid: user.uid,
                                email: user.email,
                                displayName: user.displayName,
                                uidLength: user.uid?.length,
                                uidType: typeof user.uid
                            });
                            
                            // Firebase에서 카트 로드
                            const syncedCart = await window.CartSyncService.syncCart(user.uid);
                            console.log('✅ 카트 동기화 완료:', syncedCart.length, '개 상품');
                            
                            // 실시간 카트 리스너 설정
                            window.CartSyncService.setupCartListener(user.uid);
                            
                            // 카트 카운트 업데이트
                            updateCartCount();
                        }
                    } catch (error) {
                        console.warn('로그인 시 카트 동기화 실패:', error);
                    }
                }
            });
        }
        
    } catch (error) {
        console.error('페이지 초기화 중 오류:', error);
        // 에러가 발생해도 기본 메뉴는 표시
        await updateUserMenu();
    }
}

// 수동 초기화 함수 (points.html 등에서 사용)
async function initializeAuthUtils() {
    console.log('auth-utils.js 수동 초기화 시작');
    await updateUserMenu();
    updateCartCount();
    
    // Firebase가 준비된 경우 인증 상태 모니터링 시작
    if (typeof firebase !== 'undefined' && firebase.auth && !isAuthInitialized) {
        isAuthInitialized = true;
        firebase.auth().onAuthStateChanged(async (user) => {
            currentAuthUser = user;
            await updateUserMenu();
            console.log('auth-utils.js 인증 상태 변경:', user ? user.email : '로그아웃');
            
            // 로그인 시 방문 기록 저장 및 카트 동기화
            if (user && user.email) {
                try {
                    await window.recordUserVisit(user.email, 'login', {
                        loginTime: new Date().toISOString(),
                        pageTitle: document.title
                    });
                    
                    // 카트 동기화 설정
                    if (window.CartSyncService) {
                        console.log('🛒 로그인 시 카트 동기화 시작 (auth-utils)');
                        
                        // Firebase에서 카트 로드
                        const syncedCart = await window.CartSyncService.syncCart(user.uid);
                        console.log('✅ 카트 동기화 완료 (auth-utils):', syncedCart.length, '개 상품');
                        
                        // 실시간 카트 리스너 설정
                        window.CartSyncService.setupCartListener(user.uid);
                        
                        // 카트 카운트 업데이트
                        updateCartCount();
                    }
                } catch (error) {
                    console.warn('로그인 시 카트 동기화 실패 (auth-utils):', error);
                }
            }
        });
    }
}

// QR 토큰 관리 함수들
async function getUserQRToken(userId) {
    try {
        if (!firebase.auth().currentUser) {
            throw new Error('ユーザーがログインしていません。');
        }

        const userDoc = await firebase.firestore().collection('users').doc(userId).get();
        if (userDoc.exists) {
            return userDoc.data().qrToken;
        }
        return null;
    } catch (error) {
        console.error('QRトークン読み込みエラー:', error);
        return null;
    }
}

async function generateQRToken(userId) {
    try {
        if (!firebase.auth().currentUser) {
            throw new Error('ユーザーがログインしていません。');
        }

        const timestamp = Date.now();
        const token = `QR_${userId}_${timestamp}`;
        
        await firebase.firestore().collection('users').doc(userId).update({
            qrToken: token,
            qrTokenUpdatedAt: timestamp
        });
        
        return token;
    } catch (error) {
        console.error('QRトークン生成エラー:', error);
        return null;
    }
}

async function ensureUserHasQRToken(userId) {
    try {
        let token = await getUserQRToken(userId);
        if (!token) {
            token = await generateQRToken(userId);
        }
        return token;
    } catch (error) {
        console.error('QRトークン確認エラー:', error);
        return null;
    }
}

// QR 코드 표시 함수
async function showQRCode() {
    try {
        const user = getCurrentUser();
        if (!user) {
            showToast('ログインが必要です。', 'warning');
            return;
        }

        const userId = user.uid;
        let qrToken = await ensureUserHasQRToken(userId);
        
        if (!qrToken) {
            showToast('QRコードの生成に失敗しました。', 'error');
            return;
        }

        const modal = new bootstrap.Modal(document.getElementById('qr-code-modal'));
        const container = document.getElementById('qr-code-container');
        
        if (!container) {
            console.error('QRコードコンテナが見つかりません。');
            return;
        }

        try {
            // QR 코드 생성
            const qr = qrcode(0, 'M');
            qr.addData(qrToken);
            qr.make();
            
            container.innerHTML = qr.createImgTag(5, 10);
            modal.show();
            
        } catch (error) {
            console.error('QRコード生成エラー:', error);
            container.innerHTML = '<div class="text-danger">QRコード生成に失敗しました</div>';
        }
    } catch (error) {
        console.error('QRコード表示エラー:', error);
        showToast('QRコードの表示に失敗しました。', 'error');
    }
}

// 전역 함수로 노출
window.getCurrentUserInfo = function() {
    return {
        user: getCurrentUser(),
        isLoggedIn: !!getCurrentUser()
    };
};

window.logout = logout;
window.showProfile = showProfile;
window.updateUserMenu = updateUserMenu;
window.requireAuth = requireAuth;
window.getUserDisplayName = getUserDisplayName;
window.initializeAuthUtils = initializeAuthUtils;
window.showToast = showToast;
window.showQRCode = showQRCode;

// DOMContentLoaded 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    // 약간의 지연 후 초기화 (다른 스크립트와 충돌 방지)
    setTimeout(() => {
        initializePage();
    }, 100);
});

// updateUserMenu 함수를 window 객체에 등록
window.updateUserMenu = updateUserMenu;

// 페이지 전환 시 메뉴 업데이트 (popstate 이벤트)
window.addEventListener('popstate', function() {
    setTimeout(async () => {
        await updateUserMenu();
    }, 100);
}); 