// 통합 QR 코드 관리 시스템
// 모든 페이지에서 동일한 QR코드 생성 및 표시

class UnifiedQRCodeManager {
    constructor() {
        this.isGenerating = false;
        this.initializeSystem();
    }

    // 시스템 초기화
    initializeSystem() {
        console.log('=== 통합 QR 코드 시스템 초기화 시작 ===');
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        console.log('=== 통합 QR 코드 시스템 초기화 완료 ===');
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // QR코드 버튼 제거됨 - 페이지 로드 시 자동 생성
        const qrButtonSelectors = [];
        let foundButtons = [];
        
        qrButtonSelectors.forEach(selector => {
            const button = document.querySelector(selector);
            if (button) {
                foundButtons.push(button);
            }
        });
        
        foundButtons.forEach(button => {
            // 기존 이벤트 리스너 제거
            button.removeEventListener('click', this.handleQRCodeClick);
            
            // 새 이벤트 리스너 등록
            button.addEventListener('click', this.handleQRCodeClick.bind(this));
        });

        console.log(`✅ ${foundButtons.length}개의 QR 코드 버튼 이벤트 리스너 등록 완료`);
        
        // 페이지 로드 시 자동으로 QR 코드 생성
        this.autoGenerateQRCode();
    }
    
    // 페이지 로드 시 자동 QR 코드 생성
    async autoGenerateQRCode() {
        try {
            console.log('=== 자동 QR 코드 생성 시작 ===');
            
            // Firebase 초기화 대기
            await this.waitForFirebaseInitialization();
            
            // Firebase Auth 사용자 대기
            await this.waitForFirebaseAuth();
            
            // 로그인 상태 확인
            const user = this.getCurrentUser();
            if (!user) {
                console.log('로그인되지 않음 - QR 코드 생성 건너뜀');
                return;
            }
            
            // QR 코드 컨테이너 확인
            const container = document.getElementById('qr-code-container');
            if (!container) {
                console.log('QR 코드 컨테이너를 찾을 수 없음');
                return;
            }
            
            console.log('자동 QR 코드 생성 시작 - 사용자:', user.email);
            await this.generateQRCode(container, user);
            console.log('✅ 자동 QR 코드 생성 완료');
            
        } catch (error) {
            console.error('자동 QR 코드 생성 실패:', error);
        }
    }
    
    // Firebase 초기화 대기
    async waitForFirebaseInitialization() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (typeof window.FirebaseService === 'function' && 
                    window.FirebaseService.isFirebaseAvailable && 
                    window.FirebaseService.isFirebaseAvailable()) {
                    console.log('Firebase 초기화 완료 확인됨');
                    resolve();
                } else {
                    console.log('Firebase 초기화 대기 중...');
                    setTimeout(checkFirebase, 500);
                }
            };
            checkFirebase();
        });
    }
    
    // Firebase Auth 사용자 대기
    async waitForFirebaseAuth() {
        return new Promise((resolve) => {
            // 이미 사용자가 있으면 즉시 반환
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                console.log('Firebase Auth 사용자 이미 존재');
                resolve();
                return;
            }
            
            console.log('Firebase Auth 사용자 대기 중...');
            let attempts = 0;
            const maxAttempts = 50; // 5초 대기
            
            const checkInterval = setInterval(() => {
                attempts++;
                
                if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                    console.log('Firebase Auth 사용자 확인됨');
                    clearInterval(checkInterval);
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.log('Firebase Auth 사용자 대기 시간 초과');
                    clearInterval(checkInterval);
                    resolve(); // 시간 초과되어도 계속 진행
                }
            }, 100);
        });
    }

    // QR코드 클릭 핸들러
    handleQRCodeClick(e) {
        console.log('🔍 QR코드 버튼 클릭됨!', e.target);
        e.preventDefault();
        e.stopPropagation();
        this.showQRCodeModal();
    }

    // QR코드 모달 표시 (더 이상 사용하지 않음 - 페이지에 직접 표시)
    async showQRCodeModal() {
        console.log('QR코드 모달은 더 이상 사용하지 않음 - 페이지에 직접 표시됨');
        // 모달 대신 페이지의 QR 코드 컨테이너에 직접 표시
        await this.autoGenerateQRCode();
    }

    // QR코드 생성 (모든 페이지에서 동일)
    async generateQRCode(container, user) {
        try {
            console.log('=== 통합 QR코드 생성 시작 ===');
            
            const userId = user?.uid;
            console.log('사용자 ID:', userId);
            
            let qrToken = null;
            
            // 1. 먼저 사용자 데이터에서 기존 QR 토큰 확인
            console.log('🔍 1단계: 사용자 데이터에서 QR 토큰 확인 시작');
            qrToken = await this.getUserQRToken(user);
            console.log('🔍 1단계 결과: QR 토큰', qrToken ? '발견됨' : '없음', qrToken);
            
            // 2. 기존 토큰이 없으면 새로 생성
            if (!qrToken && typeof window.FirebaseService === 'function' && window.FirebaseService.isFirebaseAvailable()) {
                console.log('🔍 2단계: Firebase에서 새 QR 토큰 생성 시작');
                try {
                    qrToken = await window.FirebaseService.getOrCreateQRToken(userId);
                    console.log('✅ Firebase를 통해 QR 토큰 생성:', qrToken);
                } catch (firebaseError) {
                    console.error('❌ Firebase QR 토큰 생성 실패:', firebaseError);
                    throw new Error('Firebase에서 QR 토큰을 가져올 수 없습니다. 인터넷 연결을 확인해주세요.');
                }
            } else if (!qrToken) {
                throw new Error('Firebase 연결이 필요합니다. 인터넷 연결을 확인해주세요.');
            }
            
            if (qrToken) {
                // QR코드 생성 및 표시
                console.log('QR 토큰 확인됨, generateQRCodeElement 호출 시작');
                console.log('컨테이너 요소:', container);
                this.generateQRCodeElement(container, qrToken);
                console.log('✅ 통합 QR코드 생성 완료');
            } else {
                throw new Error('QR 토큰을 생성할 수 없습니다.');
            }

        } catch (error) {
            console.error('통합 QR코드 생성 실패:', error);
            container.innerHTML = '<div class="text-center p-4"><i class="fas fa-exclamation-triangle fa-3x text-secondary mb-3"></i><p class="text-muted japanese-text">QRコード生成エラー<br>もう一度お試しください</p></div>';
        }
    }

    // QR코드 요소 생성 (모든 페이지에서 동일)
    generateQRCodeElement(container, data) {
        try {
            console.log('통합 QR코드 생성 시작, 데이터:', data);
            
            // 데이터 유효성 검사
            if (!data || typeof data !== 'string') {
                throw new Error('유효하지 않은 QR 데이터: ' + data);
            }
            
            // 컨테이너 초기화
            console.log('컨테이너 초기화 전:', container.innerHTML);
            container.innerHTML = '';
            console.log('컨테이너 초기화 후:', container.innerHTML);
            
            // Canvas 요소 생성 (컨테이너 내부에 2px 여백을 위해 196px로 설정)
            const canvas = document.createElement('canvas');
            canvas.width = 196;
            canvas.height = 196;
            canvas.style.borderRadius = '4px';
            console.log('Canvas 요소 생성 완료:', canvas);
            
            // QR 코드 생성
            if (typeof qrcode !== 'undefined') {
                const qr = qrcode(0, 'M'); // 오류정정 레벨 M
                qr.addData(String(data));
                qr.make();
                
                const ctx = canvas.getContext('2d');
                const moduleCount = qr.getModuleCount();
                const cellSize = Math.floor(196 / moduleCount);
                const margin = Math.floor((196 - cellSize * moduleCount) / 2);
                
                // 배경 흰색으로 채우기
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, 196, 196);
                
                // QR 코드 그리기
                ctx.fillStyle = '#000000';
                for (let row = 0; row < moduleCount; row++) {
                    for (let col = 0; col < moduleCount; col++) {
                        if (qr.isDark(row, col)) {
                            ctx.fillRect(
                                margin + col * cellSize,
                                margin + row * cellSize,
                                cellSize,
                                cellSize
                            );
                        }
                    }
                }
                
                container.appendChild(canvas);
                console.log('Canvas를 컨테이너에 추가 완료');
                console.log('컨테이너 최종 상태:', container.innerHTML);
                console.log('통합 QR코드 Canvas 생성 완료');
                
            } else {
                throw new Error('QR코드 라이브러리가 로드되지 않았습니다');
            }
            
        } catch (error) {
            console.error('통합 QR코드 생성 실패:', error);
            container.innerHTML = '<div class="text-center p-4"><i class="fas fa-exclamation-triangle fa-3x text-secondary mb-3"></i><p class="text-muted japanese-text">QRコード生成エラー<br>もう一度お試しください</p></div>';
        }
    }

    // 강제로 새 QR코드 생성
    async forceNewQRCode() {
        try {
            console.log('=== 강제 새 QR코드 생성 시작 ===');
            
            const user = this.getCurrentUser();
            const userId = user?.uid;
            
            if (!userId) {
                alert('로그인이 필요합니다.');
                return;
            }
            
            // Firebase를 통해 새 QR토큰 생성
            if (typeof window.FirebaseService === 'function' && window.FirebaseService.isFirebaseAvailable()) {
                try {
                    const newQrToken = await window.FirebaseService.getOrCreateQRToken(userId);
                    console.log('✅ Firebase를 통해 새 QR토큰 생성:', newQrToken);
                    
                    // QR코드 이미지 업데이트
                    const container = document.getElementById('qr-code-container');
                    if (container) {
                        this.generateQRCodeElement(container, newQrToken);
                    }
                } catch (firebaseError) {
                    console.error('Firebase QR토큰 생성 실패:', firebaseError);
                    throw new Error('Firebase에서 QR토큰을 생성할 수 없습니다.');
                }
            } else {
                throw new Error('Firebase 연결이 필요합니다.');
            }
            
        } catch (error) {
            console.error('강제 새 QR코드 생성 오류:', error);
            alert('에러가 발생했습니다.');
        }
    }

    // 모달 닫기 이벤트 리스너 설정
    setupModalCloseListeners(modal) {
        try {
            console.log('=== 모달 닫기 이벤트 리스너 설정 시작 ===');
            
            // 기존 이벤트 리스너 제거 (중복 방지)
            const closeButton = modal.querySelector('.btn-close');
            const modalBackdrop = modal.querySelector('.modal-backdrop');
            
            if (closeButton) {
                // 기존 이벤트 리스너 제거
                closeButton.removeEventListener('click', this.handleModalClose);
                // 새 이벤트 리스너 추가
                closeButton.addEventListener('click', (e) => this.handleModalClose(e));
                console.log('✅ 닫기 버튼 이벤트 리스너 설정 완료');
            }
            
            // 모달 배경 클릭 시 닫기
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.handleModalClose(e);
                }
            });
            
            // ESC 키로 닫기
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('show')) {
                    this.handleModalClose(e);
                }
            });
            
            console.log('✅ 모달 닫기 이벤트 리스너 설정 완료');
            
        } catch (error) {
            console.error('모달 닫기 이벤트 리스너 설정 실패:', error);
        }
    }
    
    // 모달 닫기 처리
    handleModalClose(e) {
        try {
            console.log('=== 모달 닫기 처리 시작 ===');
            
            const modal = document.getElementById('qr-code-modal');
            if (!modal) {
                console.error('모달을 찾을 수 없습니다');
                return;
            }
            
            // Bootstrap 모달 닫기
            const bootstrapModal = bootstrap.Modal.getInstance(modal);
            if (bootstrapModal) {
                bootstrapModal.hide();
                console.log('✅ Bootstrap 모달 닫기 완료');
            } else {
                // 수동으로 모달 닫기
                modal.classList.remove('show');
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
                modal.removeAttribute('aria-modal');
                
                // 배경 제거
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) {
                    backdrop.remove();
                }
                
                // body에서 모달 클래스 제거
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
                
                console.log('✅ 수동 모달 닫기 완료');
            }
            
            // QR코드 컨테이너 초기화
            const container = document.getElementById('qr-code-container') || document.getElementById('qr-code-modal-container');
            if (container) {
                container.innerHTML = '<div class="d-flex justify-content-center align-items-center" style="height: 220px;"><div class="spinner-border text-secondary" role="status"><span class="visually-hidden">読み込み中...</span></div></div>';
                console.log('✅ QR코드 컨테이너 초기화 완료');
            }
            
            // 생성 상태 리셋
            this.isGenerating = false;
            console.log('✅ 모달 닫기 처리 완료');
            
        } catch (error) {
            console.error('모달 닫기 처리 실패:', error);
        }
    }

    // 로그인 필요 모달 표시
    showLoginRequiredModal() {
        try {
            console.log('=== 로그인 필요 모달 표시 시작 ===');
            
            // 기존 모달이 있으면 제거
            const existingModal = document.getElementById('login-required-modal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // 세련된 모달 HTML 생성
            const modalHTML = `
                <div class="modal fade" id="login-required-modal" tabindex="-1" aria-labelledby="login-required-modal-label" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content border-0 shadow-lg" style="max-width: 400px; border-radius: 20px;">
                            <div class="modal-body text-center p-5">
                                <div class="mb-4">
                                    <div class="mx-auto mb-3" style="width: 80px; height: 80px; background: linear-gradient(135deg, #6c757d 0%, #495057 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                        <i class="fas fa-user-lock text-white" style="font-size: 32px;"></i>
                                    </div>
                                    <h4 class="japanese-heading text-dark mb-3" style="font-weight: 600;">ログインが必要です</h4>
                                    <p class="japanese-text text-muted mb-4" style="line-height: 1.6;">
                                        QRコードを表示するには<br>
                                        アカウントにログインしてください
                                    </p>
                                </div>
                                <div class="d-grid gap-2">
                                    <button type="button" class="btn btn-dark rounded-pill py-2" onclick="window.location.href='login.html'" style="font-weight: 500;">
                                        <i class="fas fa-sign-in-alt me-2"></i>ログインページへ
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary rounded-pill py-2" data-bs-dismiss="modal" style="font-weight: 500;">
                                        <i class="fas fa-times me-2"></i>キャンセル
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // 모달을 body에 추가
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // 모달 표시
            const modal = document.getElementById('login-required-modal');
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
            
            // 모달이 닫힐 때 제거
            modal.addEventListener('hidden.bs.modal', function() {
                modal.remove();
            });
            
            console.log('✅ 로그인 필요 모달 표시 완료');
            
        } catch (error) {
            console.error('로그인 필요 모달 표시 실패:', error);
            // 폴백으로 기본 alert 사용
            alert('QRコードを表示するにはログインが必要です。');
            window.location.href = 'login.html';
        }
    }

    // 현재 사용자 정보 가져오기 (Firebase Auth 전용)
    getCurrentUser() {
        try {
            // Firebase Auth에서 직접 현재 사용자 확인
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                const user = firebase.auth().currentUser;
                console.log('✅ Firebase Auth에서 사용자 정보 가져옴:', user.email);
                return {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName
                };
            }
            
            // auth-utils.js의 getCurrentUser 함수 사용 (fallback)
            if (typeof window.getCurrentUser === 'function') {
                const user = window.getCurrentUser();
                if (user) {
                    console.log('✅ auth-utils.js에서 사용자 정보 가져옴:', user.email);
                    return user;
                }
            }
            
            // localStorage에서 사용자 정보 확인 (최후의 수단)
            const loginStatus = localStorage.getItem('loginStatus');
            if (loginStatus) {
                try {
                    const userData = JSON.parse(loginStatus);
                    if (userData.email) {
                        console.log('✅ localStorage에서 사용자 정보 가져옴:', userData.email);
                        return {
                            uid: userData.uid,
                            email: userData.email,
                            displayName: userData.name
                        };
                    }
                } catch (e) {
                    console.warn('localStorage 사용자 정보 파싱 실패:', e);
                }
            }
            
            console.log('❌ 사용자 정보를 찾을 수 없음');
            return null;
        } catch (error) {
            console.error('사용자 정보 가져오기 실패:', error);
            return null;
        }
    }
    
    // 사용자 데이터에서 QR 토큰 직접 가져오기
    async getUserQRToken(user) {
        try {
            console.log('🔍 사용자 데이터에서 QR 토큰 검색 중...');
            
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                const db = firebase.firestore();
                const userDoc = await db.collection('users').doc(user.email).get();
                
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    if (userData.qrToken) {
                        console.log('✅ 사용자 데이터에서 QR 토큰 발견:', userData.qrToken);
                        return userData.qrToken;
                    }
                }
            }
            
            console.log('❌ 사용자 데이터에서 QR 토큰을 찾을 수 없음');
            return null;
        } catch (error) {
            console.error('QR 토큰 검색 실패:', error);
            return null;
        }
    }
}

// 전역 변수
let unifiedQRCodeManager = null;

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== 통합 QR 코드 시스템 DOM 로드 감지 ===');
    initializeUnifiedQRCodeSystem();
});

// 통합 QR 코드 시스템 초기화 함수
function initializeUnifiedQRCodeSystem() {
    console.log('=== 통합 QR 코드 시스템 초기화 시작 ===');
    
    if (unifiedQRCodeManager) {
        console.log('⚠️ 통합 QR 코드 매니저가 이미 초기화되어 있습니다.');
        return;
    }
    
    // UnifiedQRCodeManager 클래스가 정의되었는지 확인
    if (typeof UnifiedQRCodeManager === 'undefined') {
        console.error('❌ UnifiedQRCodeManager 클래스가 정의되지 않았습니다.');
        return;
    }
    
    // 즉시 초기화 시도
    try {
        unifiedQRCodeManager = new UnifiedQRCodeManager();
        console.log('✅ 통합 QR 코드 매니저 초기화 완료');
        
        // 전역 변수로 명시적 노출
        window.unifiedQRCodeManager = unifiedQRCodeManager;
        window.commonQRCodeManager = unifiedQRCodeManager; // 호환성 유지
        
        console.log('✅ 통합 QR 코드 매니저 전역 노출 완료');
        
    } catch (error) {
        console.error('❌ 통합 QR 코드 매니저 초기화 실패:', error);
    }
}

// 전역 함수로 노출 (기존 코드와의 호환성)
window.showQRCode = function() {
    if (unifiedQRCodeManager) {
        unifiedQRCodeManager.showQRCodeModal();
    } else {
        console.error('통합 QR 코드 매니저가 초기화되지 않았습니다.');
    }
};

window.forceNewQRCode = function() {
    if (unifiedQRCodeManager) {
        unifiedQRCodeManager.forceNewQRCode();
    } else {
        console.error('통합 QR 코드 매니저가 초기화되지 않았습니다.');
    }
};

// 포인트 페이지용 통합 함수는 각 페이지에서 직접 구현

console.log('=== 통합 QR 코드 시스템 스크립트 로드됨 ===');