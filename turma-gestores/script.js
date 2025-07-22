/**
 * SPARC Enhanced JavaScript - Turma Gestores
 * Implementa lazy loading, animations, performance tracking e PWA
 */

// =============================================
// PERFORMANCE TRACKING & WEB VITALS
// =============================================

class PerformanceTracker {
    constructor() {
        this.vitals = {};
        this.conversions = [];
        this.init();
    }

    init() {
        this.trackWebVitals();
        this.trackUserInteractions();
        this.setupErrorTracking();
    }

    trackWebVitals() {
        // Track Core Web Vitals
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                console.log(`${entry.name}: ${entry.value}`);
                this.vitals[entry.name] = entry.value;
            }
        }).observe({ entryTypes: ['measure', 'navigation', 'paint'] });

        // Track LCP (Largest Contentful Paint)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.vitals.lcp = lastEntry.startTime;
            console.log('LCP:', lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Track CLS (Cumulative Layout Shift)
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            this.vitals.cls = clsValue;
            console.log('CLS:', clsValue);
        }).observe({ entryTypes: ['layout-shift'] });

        // Track FID (First Input Delay)
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                this.vitals.fid = entry.processingStart - entry.startTime;
                console.log('FID:', this.vitals.fid);
            }
        }).observe({ entryTypes: ['first-input'] });
    }

    trackUserInteractions() {
        // Track button clicks with conversion metrics
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn')) {
                const buttonText = e.target.textContent.trim();
                const timestamp = Date.now();
                const conversion = {
                    type: 'cta_click',
                    element: buttonText,
                    timestamp,
                    url: e.target.href || '',
                    position: this.getElementPosition(e.target)
                };
                
                this.conversions.push(conversion);
                console.log('Conversion tracked:', conversion);
                
                // Send to analytics (simulate)
                this.sendToAnalytics(conversion);
            }
        });

        // Track scroll depth
        this.trackScrollDepth();
    }

    trackScrollDepth() {
        const sections = document.querySelectorAll('section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionName = entry.target.className || entry.target.tagName;
                    console.log(`Section viewed: ${sectionName}`);
                    this.sendToAnalytics({
                        type: 'section_view',
                        section: sectionName,
                        timestamp: Date.now()
                    });
                }
            });
        }, { threshold: 0.5 });

        sections.forEach(section => observer.observe(section));
    }

    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY
        };
    }

    sendToAnalytics(data) {
        // Simulate sending to analytics service
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/analytics', JSON.stringify(data));
        } else {
            fetch('/analytics', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            }).catch(err => console.log('Analytics failed:', err));
        }
    }

    setupErrorTracking() {
        window.addEventListener('error', (e) => {
            this.sendToAnalytics({
                type: 'javascript_error',
                message: e.message,
                filename: e.filename,
                line: e.lineno,
                timestamp: Date.now()
            });
        });
    }
}

// =============================================
// LAZY LOADING & IMAGE OPTIMIZATION
// =============================================

class LazyLoader {
    constructor() {
        this.images = [];
        this.observer = null;
        this.init();
    }

    init() {
        // Check for browser support
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            this.setupLazyImages();
        } else {
            // Fallback for older browsers
            this.loadAllImages();
        }
    }

    setupLazyImages() {
        // Convert background images to lazy loading
        const heroSection = document.querySelector('.hero');
        if (heroSection && !heroSection.dataset.loaded) {
            heroSection.dataset.src = 'path/to/hero-bg.jpg';
            this.observer.observe(heroSection);
        }

        // Future-proof for any img tags
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => this.observer.observe(img));
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadImage(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    }

    loadImage(element) {
        if (element.dataset.src) {
            if (element.tagName === 'IMG') {
                element.src = element.dataset.src;
                element.onload = () => element.classList.add('loaded');
            } else {
                // Handle background images
                element.style.backgroundImage = `url(${element.dataset.src})`;
                element.classList.add('loaded');
            }
            element.dataset.loaded = 'true';
        }
    }

    loadAllImages() {
        // Fallback: load all images immediately
        const images = document.querySelectorAll('[data-src]');
        images.forEach(img => this.loadImage(img));
    }
}

// =============================================
// MICRO-INTERACTIONS & ANIMATIONS
// =============================================

class AnimationController {
    constructor() {
        this.observers = [];
        this.init();
    }

    init() {
        this.setupScrollAnimations();
        this.setupHoverEffects();
        this.setupCountdown();
        this.setupLoadingStates();
    }

    setupScrollAnimations() {
        const animatedElements = document.querySelectorAll('.benefit-card, .learning-card, .faq__item');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('animate-in');
                    }, index * 100); // Stagger animation
                }
            });
        }, { threshold: 0.1 });

        animatedElements.forEach(el => {
            el.classList.add('animate-ready');
            observer.observe(el);
        });

        this.observers.push(observer);
    }

    setupHoverEffects() {
        // Enhanced button interactions
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', this.createRippleEffect.bind(this));
        });

        // Parallax effect for hero background
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const hero = document.querySelector('.hero__background');
            if (hero) {
                hero.style.transform = `translateY(${scrolled * 0.5}px)`;
            }
        });
    }

    createRippleEffect(e) {
        const button = e.target;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }

    setupCountdown() {
        const countdownEl = document.getElementById('countdown');
        if (!countdownEl) return;

        // Set countdown to 4 hours from now
        const endTime = new Date().getTime() + (4 * 60 * 60 * 1000);
        
        const updateCountdown = () => {
            const now = new Date().getTime();
            const timeLeft = endTime - now;
            
            if (timeLeft > 0) {
                const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                
                countdownEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
                countdownEl.textContent = '00:00:00';
                clearInterval(countdownInterval);
            }
        };
        
        const countdownInterval = setInterval(updateCountdown, 1000);
        updateCountdown(); // Initial call
    }

    setupLoadingStates() {
        // Add loading states for CTAs
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn--primary')) {
                const btn = e.target;
                const originalText = btn.textContent;
                
                btn.classList.add('loading');
                btn.textContent = 'Redirecionando...';
                btn.disabled = true;
                
                // Simulate loading
                setTimeout(() => {
                    btn.classList.remove('loading');
                    btn.textContent = originalText;
                    btn.disabled = false;
                }, 1500);
            }
        });
    }
}

// =============================================
// PWA & SERVICE WORKER
// =============================================

class PWAManager {
    constructor() {
        this.init();
    }

    init() {
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupOfflineSupport();
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('SW registered:', registration);
            } catch (error) {
                console.log('SW registration failed:', error);
            }
        }
    }

    setupInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button
            const installBtn = document.createElement('button');
            installBtn.textContent = '📱 Instalar App';
            installBtn.className = 'btn btn--small install-btn';
            installBtn.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                animation: slideIn 0.3s ease;
            `;
            
            installBtn.addEventListener('click', async () => {
                deferredPrompt.prompt();
                const result = await deferredPrompt.userChoice;
                console.log('Install prompt result:', result);
                installBtn.remove();
                deferredPrompt = null;
            });
            
            document.body.appendChild(installBtn);
        });
    }

    setupOfflineSupport() {
        window.addEventListener('online', () => {
            this.showNetworkStatus('Conectado! 🌐', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showNetworkStatus('Modo offline 📴', 'warning');
        });
    }

    showNetworkStatus(message, type) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.className = `network-toast ${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#00ff00' : '#ffaa00'};
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// =============================================
// A/B TESTING FRAMEWORK
// =============================================

class ABTestController {
    constructor() {
        this.tests = {
            cta_color: {
                variants: ['green', 'orange', 'red'],
                weights: [0.4, 0.4, 0.2]
            },
            urgency_text: {
                variants: ['default', 'stronger', 'milder'],
                weights: [0.33, 0.33, 0.34]
            }
        };
        this.userVariants = {};
        this.init();
    }

    init() {
        this.assignUserToVariants();
        this.applyVariants();
    }

    assignUserToVariants() {
        // Use localStorage to maintain consistency
        const stored = localStorage.getItem('ab_variants');
        if (stored) {
            this.userVariants = JSON.parse(stored);
        } else {
            Object.keys(this.tests).forEach(testName => {
                this.userVariants[testName] = this.selectVariant(this.tests[testName]);
            });
            localStorage.setItem('ab_variants', JSON.stringify(this.userVariants));
        }
    }

    selectVariant(test) {
        const random = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < test.variants.length; i++) {
            cumulative += test.weights[i];
            if (random <= cumulative) {
                return test.variants[i];
            }
        }
        return test.variants[0];
    }

    applyVariants() {
        // Apply CTA color variant
        if (this.userVariants.cta_color === 'orange') {
            document.documentElement.style.setProperty('--color-success', '#ff8c00');
        } else if (this.userVariants.cta_color === 'red') {
            document.documentElement.style.setProperty('--color-success', '#ff4444');
        }

        // Apply urgency text variant
        const urgencyTitle = document.querySelector('.urgency__title');
        if (urgencyTitle && this.userVariants.urgency_text === 'stronger') {
            urgencyTitle.textContent = '🚨 ÚLTIMAS HORAS - VAGAS ESGOTANDO!';
        } else if (urgencyTitle && this.userVariants.urgency_text === 'milder') {
            urgencyTitle.textContent = '⏰ Oferta Por Tempo Limitado';
        }
    }
}

// =============================================
// INITIALIZATION
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 SPARC Enhanced Landing Page Loading...');
    
    // Initialize all modules
    const performance = new PerformanceTracker();
    const lazyLoader = new LazyLoader();
    const animations = new AnimationController();
    const pwa = new PWAManager();
    const abTest = new ABTestController();
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes ripple {
            to { transform: scale(4); opacity: 0; }
        }
        
        .animate-ready {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s ease;
        }
        
        .animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        .btn.loading {
            position: relative;
            pointer-events: none;
        }
        
        .btn.loading::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            margin: -10px 0 0 -10px;
            border: 2px solid transparent;
            border-top: 2px solid currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        img[data-src] {
            filter: blur(5px);
            transition: filter 0.3s;
        }
        
        img[data-src].loaded {
            filter: blur(0);
        }
    `;
    document.head.appendChild(style);
    
    console.log('✅ All SPARC modules initialized successfully!');
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PerformanceTracker,
        LazyLoader,
        AnimationController,
        PWAManager,
        ABTestController
    };
}