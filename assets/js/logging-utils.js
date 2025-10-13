/**
 * Aether 로깅 유틸리티
 * 개발 환경에서만 콘솔 로그를 출력하고, 프로덕션에서는 숨김
 */
const LoggingUtils = {
    /**
     * 개발 환경인지 확인
     * @returns {boolean} 개발 환경이면 true, 프로덕션이면 false
     */
    isDevelopment: function() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname.includes('127.0.0.1') ||
               window.location.protocol === 'file:' ||
               window.location.hostname.includes('192.168.') ||
               window.location.hostname.includes('10.0.') ||
               window.location.hostname.includes('172.');
    },

    /**
     * 일반 로그 (개발 환경에서만)
     * @param {string} message - 로그 메시지
     * @param {...any} args - 추가 인자들
     */
    log: function(message, ...args) {
        if (this.isDevelopment()) {
            console.log(message, ...args);
        }
    },

    /**
     * 경고 로그 (개발 환경에서만)
     * @param {string} message - 경고 메시지
     * @param {...any} args - 추가 인자들
     */
    warn: function(message, ...args) {
        if (this.isDevelopment()) {
            console.warn(message, ...args);
        }
    },

    /**
     * 에러 로그 (항상 표시 - 프로덕션에서도)
     * @param {string} message - 에러 메시지
     * @param {...any} args - 추가 인자들
     */
    error: function(message, ...args) {
        // 에러는 항상 표시 (프로덕션에서도 중요)
        console.error(message, ...args);
    },

    /**
     * 정보 로그 (개발 환경에서만)
     * @param {string} message - 정보 메시지
     * @param {...any} args - 추가 인자들
     */
    info: function(message, ...args) {
        if (this.isDevelopment()) {
            console.info(message, ...args);
        }
    },

    /**
     * 디버그 로그 (개발 환경에서만)
     * @param {string} message - 디버그 메시지
     * @param {...any} args - 추가 인자들
     */
    debug: function(message, ...args) {
        if (this.isDevelopment()) {
            console.debug(message, ...args);
        }
    },

    /**
     * 그룹 로그 시작 (개발 환경에서만)
     * @param {string} label - 그룹 라벨
     */
    group: function(label) {
        if (this.isDevelopment()) {
            console.group(label);
        }
    },

    /**
     * 그룹 로그 종료 (개발 환경에서만)
     */
    groupEnd: function() {
        if (this.isDevelopment()) {
            console.groupEnd();
        }
    },

    /**
     * 테이블 로그 (개발 환경에서만)
     * @param {any} data - 테이블 데이터
     */
    table: function(data) {
        if (this.isDevelopment()) {
            console.table(data);
        }
    }
};

// 전역에서 접근 가능하도록 설정
window.LoggingUtils = LoggingUtils;

// 개발 환경 확인 로그 (한 번만)
if (LoggingUtils.isDevelopment()) {
    console.log('🔧 Aether 로깅 유틸리티 로드됨 (개발 모드)');
} else {
    console.log('🚀 Aether 로깅 유틸리티 로드됨 (프로덕션 모드 - 로그 숨김)');
}
