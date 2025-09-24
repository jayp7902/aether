// Aether 커스텀 JavaScript
// QR코드 관련 기능은 common-qr-code.js에서 처리

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== Aether 커스텀 JavaScript 로드 완료 ===');
    
    // 햄버거 메뉴 상태 감지 및 QR코드 버튼 제어
    setupMobileQRCodeControl();
});

// 모바일 QR코드 버튼 제어 함수
function setupMobileQRCodeControl() {
    const navbarCollapse = document.getElementById('templatemo_main_nav');
    const qrCodeBtnMobile = document.getElementById('qr-code-btn-mobile');
    
    if (!navbarCollapse || !qrCodeBtnMobile) {
        console.log('네비게이션 요소를 찾을 수 없습니다');
        return;
    }
    
    console.log('네비게이션 상태 확인:', navbarCollapse.classList.contains('show'));
    console.log('네비게이션 상태 (collapsing 포함):', navbarCollapse.classList.contains('collapsing'));
    
    // QR코드 버튼 상태를 설정하는 함수
    function setQRCodeButtonState(shouldShow) {
        if (shouldShow) {
            qrCodeBtnMobile.style.setProperty('display', 'flex', 'important');
            qrCodeBtnMobile.style.setProperty('visibility', 'visible', 'important');
            qrCodeBtnMobile.style.setProperty('opacity', '1', 'important');
            qrCodeBtnMobile.style.setProperty('pointer-events', 'auto', 'important');
        } else {
            qrCodeBtnMobile.style.setProperty('display', 'none', 'important');
            qrCodeBtnMobile.style.setProperty('visibility', 'hidden', 'important');
            qrCodeBtnMobile.style.setProperty('opacity', '0', 'important');
            qrCodeBtnMobile.style.setProperty('pointer-events', 'none', 'important');
        }
    }
    
    // 초기 상태 설정
    if (window.innerWidth <= 991.98) {
        // 모바일에서 햄버거 메뉴가 접혀있을 때만 QR코드 버튼 표시
        if (!navbarCollapse.classList.contains('show') && !navbarCollapse.classList.contains('collapsing')) {
            console.log('초기 상태: 모바일에서 햄버거 메뉴 접힘 - QR코드 버튼 표시');
            setQRCodeButtonState(true);
        } else {
            console.log('초기 상태: 모바일에서 햄버거 메뉴 펼침 - QR코드 버튼 숨김');
            setQRCodeButtonState(false);
        }
    } else {
        // 데스크톱에서는 모바일 QR코드 버튼 숨김
        console.log('초기 상태: 데스크톱 - 모바일 QR코드 버튼 숨김');
        setQRCodeButtonState(false);
    }
    
    // Bootstrap 5의 collapse 이벤트 리스너
    navbarCollapse.addEventListener('show.bs.collapse', function() {
        console.log('햄버거 메뉴 펼침 - QR코드 버튼 숨김');
        if (window.innerWidth <= 991.98) {
            setQRCodeButtonState(false);
        }
    });
    
    navbarCollapse.addEventListener('hide.bs.collapse', function() {
        console.log('햄버거 메뉴 접힘 - QR코드 버튼 표시');
        if (window.innerWidth <= 991.98) {
            setQRCodeButtonState(true);
        }
    });
    
    // 화면 크기 변경 감지
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 991.98) {
            // 모바일에서 햄버거 메뉴가 접혀있을 때만 QR코드 버튼 표시
            if (!navbarCollapse.classList.contains('show') && !navbarCollapse.classList.contains('collapsing')) {
                console.log('화면 크기 변경: 모바일에서 햄버거 메뉴 접힘 - QR코드 버튼 표시');
                setQRCodeButtonState(true);
            } else {
                console.log('화면 크기 변경: 모바일에서 햄버거 메뉴 펼침 - QR코드 버튼 숨김');
                setQRCodeButtonState(false);
            }
        } else {
            // 데스크톱에서는 모바일 QR코드 버튼 숨김
            console.log('화면 크기 변경: 데스크톱 - 모바일 QR코드 버튼 숨김');
            setQRCodeButtonState(false);
        }
    });
    
    // MutationObserver로 클래스 변경 감지 (추가 안전장치)
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (window.innerWidth <= 991.98) {
                    if (navbarCollapse.classList.contains('show') || navbarCollapse.classList.contains('collapsing')) {
                        console.log('MutationObserver: 햄버거 메뉴 펼침 감지 - QR코드 버튼 숨김');
                        setQRCodeButtonState(false);
                    } else {
                        console.log('MutationObserver: 햄버거 메뉴 접힘 감지 - QR코드 버튼 표시');
                        setQRCodeButtonState(true);
                    }
                }
            }
        });
    });
    
    observer.observe(navbarCollapse, {
        attributes: true,
        attributeFilter: ['class']
    });
}

// QR 코드 표시 함수는 common-qr-code.js에서 직접 처리

// 강제로 새 QR코드 생성 (common-qr-code.js 사용)
async function forceNewQRCode() {
    try {
        console.log('=== 강제 새 QR코드 생성 시작 ===');
        
        if (window.commonQRCodeManager) {
            await window.commonQRCodeManager.forceNewQRCode();
        } else {
            throw new Error('공통 QR 코드 매니저가 초기화되지 않았습니다.');
        }
        
    } catch (error) {
        console.error('강제 새 QR코드 생성 오류:', error);
        alert('에러가 발생했습니다.');
    }
}

// waitForFirebase 함수 정의 (common-qr-code.js에서 사용)
function waitForFirebase() {
    return new Promise((resolve) => {
        if (typeof firebase !== 'undefined' && firebase && firebase.firestore) {
            resolve();
        } else {
            const checkFirebase = setInterval(() => {
                if (typeof firebase !== 'undefined' && firebase && firebase.firestore) {
                    clearInterval(checkFirebase);
                    resolve();
                }
            }, 100);
        }
    });
}