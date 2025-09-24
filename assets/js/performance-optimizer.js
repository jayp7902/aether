/**
 * Aether Performance Optimizer
 * 성능 최적화를 위한 유틸리티 함수들
 */

class PerformanceOptimizer {
    constructor() {
        this.imageCache = new Map();
        this.loadedImages = new Set();
        this.intersectionObserver = null;
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.setupImageLazyLoading();
        this.setupPreloadCriticalResources();
    }

    // Intersection Observer 설정
    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            this.intersectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        this.intersectionObserver.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.1
            });
        }
    }

    // 이미지 지연 로딩 설정
    setupImageLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            if (this.intersectionObserver) {
                this.intersectionObserver.observe(img);
            } else {
                // Fallback for older browsers
                this.loadImage(img);
            }
        });
    }

    // 이미지 로딩
    loadImage(img) {
        const src = img.dataset.src;
        if (!src || this.loadedImages.has(src)) return;

        // 이미지 캐시 확인
        if (this.imageCache.has(src)) {
            img.src = this.imageCache.get(src);
            img.classList.remove('lazy');
            this.loadedImages.add(src);
            return;
        }

        // 새 이미지 로딩
        const tempImg = new Image();
        tempImg.onload = () => {
            img.src = src;
            img.classList.remove('lazy');
            this.imageCache.set(src, src);
            this.loadedImages.add(src);
        };
        tempImg.onerror = () => {
            img.src = img.dataset.fallback || 'assets/img/placeholder-brand.svg';
            img.classList.remove('lazy');
        };
        tempImg.src = src;
    }

    // 중요 리소스 사전 로딩
    setupPreloadCriticalResources() {
        const criticalResources = [
            'assets/css/bootstrap.min.css',
            'assets/css/templatemo.css',
            'assets/css/custom.css',
            'assets/js/firebase-config.js'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = resource.endsWith('.css') ? 'style' : 'script';
            document.head.appendChild(link);
        });
    }

    // Firebase 쿼리 최적화
    optimizeFirebaseQuery(query, options = {}) {
        const {
            limit = 20,
            cacheTime = 5 * 60 * 1000, // 5분
            enableCache = true
        } = options;

        if (enableCache) {
            const cacheKey = this.generateCacheKey(query);
            const cached = this.getFromCache(cacheKey);
            
            if (cached && Date.now() - cached.timestamp < cacheTime) {
                return Promise.resolve(cached.data);
            }
        }

        return query.limit(limit).get().then(snapshot => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            if (enableCache) {
                const cacheKey = this.generateCacheKey(query);
                this.setCache(cacheKey, data);
            }

            return data;
        });
    }

    // 캐시 키 생성
    generateCacheKey(query) {
        return `firebase_${query._query.path.segments.join('_')}_${Date.now()}`;
    }

    // 캐시에서 데이터 가져오기
    getFromCache(key) {
        try {
            const cached = localStorage.getItem(key);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.warn('캐시 읽기 실패:', error);
            return null;
        }
    }

    // 캐시에 데이터 저장
    setCache(key, data) {
        try {
            const cacheData = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('캐시 저장 실패:', error);
        }
    }

    // 메모리 사용량 최적화
    optimizeMemoryUsage() {
        // 사용하지 않는 이미지 캐시 정리
        const maxCacheSize = 50;
        if (this.imageCache.size > maxCacheSize) {
            const entries = Array.from(this.imageCache.entries());
            const toDelete = entries.slice(0, entries.length - maxCacheSize);
            toDelete.forEach(([key]) => this.imageCache.delete(key));
        }

        // 가비지 컬렉션 유도
        if (window.gc) {
            window.gc();
        }
    }

    // 네트워크 상태 확인
    checkNetworkStatus() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            const isSlowConnection = connection.effectiveType === 'slow-2g' || 
                                   connection.effectiveType === '2g' ||
                                   connection.effectiveType === '3g';
            
            if (isSlowConnection) {
                this.enableLowBandwidthMode();
            }
        }
    }

    // 저대역폭 모드 활성화
    enableLowBandwidthMode() {
        // 이미지 품질 낮추기
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (img.dataset.lowQuality) {
                img.src = img.dataset.lowQuality;
            }
        });

        // 애니메이션 비활성화
        document.body.classList.add('low-bandwidth');
    }

    // 성능 메트릭 수집
    collectPerformanceMetrics() {
        if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0];
            const paint = performance.getEntriesByType('paint');
            
            const metrics = {
                pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime,
                firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime
            };

            console.log('성능 메트릭:', metrics);
            return metrics;
        }
        return null;
    }

    // 디바운스 함수
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 스로틀 함수
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// 전역 인스턴스 생성
window.performanceOptimizer = new PerformanceOptimizer();

// 유틸리티 함수들
window.utils = {
    debounce: window.performanceOptimizer.debounce.bind(window.performanceOptimizer),
    throttle: window.performanceOptimizer.throttle.bind(window.performanceOptimizer)
};
