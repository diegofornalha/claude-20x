/**
 * Modern JavaScript for A2A Protocol Landing Page
 * Features: ES6+ modules, Intersection Observer, Performance optimization
 */

// ===============================
// CONSTANTS & CONFIGURATION
// ===============================

const CONFIG = {
    countdown: {
        duration: {
            hours: 3,
            minutes: 33,
            seconds: 34
        },
        storageKey: 'a2a_countdown_end_time',
        updateInterval: 1000
    },
    animations: {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    },
    tracking: {
        events: ['click', 'scroll', 'cta_interaction'],
        debug: false
    }
};

// ===============================
// UTILITY FUNCTIONS
// ===============================

/**
 * Debounce function for performance optimization
 */
const debounce = (func, wait, immediate) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
};

/**
 * Throttle function for scroll events
 */
const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

/**
 * Safe DOM query selector
 */
const safeQuery = (selector, context = document) => {
    try {
        return context.querySelector(selector);
    } catch (error) {
        console.warn(`Invalid selector: ${selector}`, error);
        return null;
    }
};

/**
 * Safe DOM query selector all
 */
const safeQueryAll = (selector, context = document) => {
    try {
        return context.querySelectorAll(selector);
    } catch (error) {
        console.warn(`Invalid selector: ${selector}`, error);
        return [];
    }
};

/**
 * Format number with leading zeros
 */
const formatTime = (num) => String(num).padStart(2, '0');

// ===============================
// COUNTDOWN TIMER CLASS
// ===============================

class CountdownTimer {
    constructor(elementId, config) {
        this.element = safeQuery(`#${elementId}`);
        this.config = config;
        this.endTime = this.getEndTime();
        this.intervalId = null;
        
        if (!this.element) {
            console.warn(`Countdown element #${elementId} not found`);
            return;
        }
        
        this.init();
    }
    
    /**
     * Get or create countdown end time
     */
    getEndTime() {
        const stored = localStorage.getItem(this.config.storageKey);
        
        if (stored && new Date(stored) > new Date()) {
            return new Date(stored);
        }
        
        const now = new Date();
        const endTime = new Date(now.getTime() + 
            (this.config.duration.hours * 3600 + 
             this.config.duration.minutes * 60 + 
             this.config.duration.seconds) * 1000
        );
        
        localStorage.setItem(this.config.storageKey, endTime.toISOString());
        return endTime;
    }
    
    /**
     * Calculate remaining time
     */
    getRemainingTime() {
        const now = new Date();
        const remaining = this.endTime - now;
        
        if (remaining <= 0) {
            return { hours: 0, minutes: 0, seconds: 0, expired: true };
        }
        
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        
        return { hours, minutes, seconds, expired: false };
    }
    
    /**
     * Update countdown display
     */
    updateDisplay() {
        const time = this.getRemainingTime();
        
        if (time.expired) {
            this.handleExpiration();
            return;
        }
        
        const timeString = `${formatTime(time.hours)}:${formatTime(time.minutes)}:${formatTime(time.seconds)}`;
        
        if (this.element) {
            this.element.textContent = timeString;
        }
    }
    
    /**
     * Handle countdown expiration
     */
    handleExpiration() {
        // Reset countdown to original duration
        this.endTime = this.getEndTime();
        this.updateDisplay();
        
        // Trigger custom event
        document.dispatchEvent(new CustomEvent('countdownExpired', {
            detail: { timestamp: new Date() }
        }));
    }
    
    /**
     * Start countdown
     */
    start() {
        this.updateDisplay();
        this.intervalId = setInterval(() => {
            this.updateDisplay();
        }, this.config.updateInterval);
    }
    
    /**
     * Stop countdown
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    
    /**
     * Initialize countdown
     */
    init() {
        this.start();
        
        // Handle visibility change to pause/resume timer
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stop();
            } else {
                this.start();
            }
        });
    }
}

// ===============================
// SCROLL ANIMATIONS CLASS
// ===============================

class ScrollAnimations {
    constructor(config) {
        this.config = config;
        this.observer = null;
        this.animatedElements = new Set();
        
        this.init();
    }
    
    /**
     * Initialize Intersection Observer
     */
    init() {
        if (!('IntersectionObserver' in window)) {
            // Fallback for older browsers
            this.fallbackAnimation();
            return;
        }
        
        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            {
                threshold: this.config.threshold,
                rootMargin: this.config.rootMargin
            }
        );
        
        this.observeElements();
    }
    
    /**
     * Handle intersection events
     */
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
                this.animateElement(entry.target);
                this.animatedElements.add(entry.target);
            }
        });
    }
    
    /**
     * Observe elements for animation
     */
    observeElements() {
        const elements = safeQueryAll('.benefit-card, .learning-card, .faq__item, .testimonial');
        
        elements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            this.observer.observe(element);
        });
    }
    
    /**
     * Animate individual element
     */
    animateElement(element) {
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }
    
    /**
     * Fallback animation for older browsers
     */
    fallbackAnimation() {
        const elements = safeQueryAll('.benefit-card, .learning-card, .faq__item, .testimonial');
        
        elements.forEach((element, index) => {
            setTimeout(() => {
                this.animateElement(element);
            }, index * 100);
        });
    }
    
    /**
     * Destroy observer
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
}

// ===============================
// SMOOTH SCROLL CLASS
// ===============================

class SmoothScroll {
    constructor() {
        this.init();
    }
    
    /**
     * Initialize smooth scroll
     */
    init() {
        // Handle anchor links
        document.addEventListener('click', this.handleClick.bind(this));
    }
    
    /**
     * Handle click events for smooth scrolling
     */
    handleClick(event) {
        const link = event.target.closest('a[href^="#"]');
        
        if (!link) return;
        
        const href = link.getAttribute('href');
        if (href === '#') return;
        
        const target = safeQuery(href);
        
        if (target) {
            event.preventDefault();
            this.scrollToElement(target);
        }
    }
    
    /**
     * Smooth scroll to element
     */
    scrollToElement(element) {
        const offsetTop = element.offsetTop - 80; // Account for fixed header
        
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// ===============================
// CTA TRACKING CLASS
// ===============================

class CTATracking {
    constructor(config) {
        this.config = config;
        this.interactions = [];
        
        this.init();
    }
    
    /**
     * Initialize CTA tracking
     */
    init() {
        this.trackCTAClicks();
        this.trackScrollDepth();
        this.trackTimeOnPage();
    }
    
    /**
     * Track CTA button clicks
     */
    trackCTAClicks() {
        const ctaButtons = safeQueryAll('.btn, a[href*="bit.ly"]');
        
        ctaButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                this.logEvent('cta_click', {
                    element: button.tagName,
                    text: button.textContent.trim(),
                    href: button.href,
                    timestamp: new Date().toISOString()
                });
                
                // Add visual feedback
                this.addClickFeedback(button);
            });
        });
    }
    
    /**
     * Track scroll depth
     */
    trackScrollDepth() {
        const scrollThresholds = [25, 50, 75, 90, 100];
        const trackedThresholds = new Set();
        
        const trackScroll = throttle(() => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            
            scrollThresholds.forEach(threshold => {
                if (scrollPercent >= threshold && !trackedThresholds.has(threshold)) {
                    trackedThresholds.add(threshold);
                    this.logEvent('scroll_depth', {
                        percentage: threshold,
                        timestamp: new Date().toISOString()
                    });
                }
            });
        }, 500);
        
        window.addEventListener('scroll', trackScroll);
    }
    
    /**
     * Track time on page
     */
    trackTimeOnPage() {
        const startTime = new Date();
        
        // Track every 30 seconds
        setInterval(() => {
            const timeOnPage = Math.round((new Date() - startTime) / 1000);
            this.logEvent('time_on_page', {
                seconds: timeOnPage,
                timestamp: new Date().toISOString()
            });
        }, 30000);
        
        // Track on page unload
        window.addEventListener('beforeunload', () => {
            const timeOnPage = Math.round((new Date() - startTime) / 1000);
            this.logEvent('session_end', {
                total_seconds: timeOnPage,
                timestamp: new Date().toISOString()
            });
        });
    }
    
    /**
     * Add visual feedback for button clicks
     */
    addClickFeedback(button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }
    
    /**
     * Log event for analytics
     */
    logEvent(event, data) {
        this.interactions.push({ event, data });
        
        if (this.config.debug) {
            console.log('Event logged:', event, data);
        }
        
        // Send to analytics service (implementation depends on your analytics provider)
        this.sendToAnalytics(event, data);
    }
    
    /**
     * Send data to analytics service
     */
    sendToAnalytics(event, data) {
        // Example: Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', event, data);
        }
        
        // Example: Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('track', event, data);
        }
        
        // Add your analytics implementation here
    }
}

// ===============================
// PERFORMANCE OPTIMIZATION CLASS
// ===============================

class PerformanceOptimizer {
    constructor() {
        this.init();
    }
    
    /**
     * Initialize performance optimizations
     */
    init() {
        this.lazyLoadImages();
        this.optimizeAnimations();
        this.preloadCriticalResources();
    }
    
    /**
     * Lazy load images
     */
    lazyLoadImages() {
        const images = safeQueryAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            images.forEach(img => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            });
        }
    }
    
    /**
     * Optimize animations for performance
     */
    optimizeAnimations() {
        // Use will-change property for animated elements
        const animatedElements = safeQueryAll('.btn, .countdown__display, .hero__background');
        
        animatedElements.forEach(element => {
            element.style.willChange = 'transform, opacity';
        });
        
        // Remove will-change after animation
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const element = mutation.target;
                    if (element.style.transform === '' && element.style.opacity === '') {
                        element.style.willChange = 'auto';
                    }
                }
            });
        });
        
        animatedElements.forEach(element => {
            observer.observe(element, { attributes: true, attributeFilter: ['style'] });
        });
    }
    
    /**
     * Preload critical resources
     */
    preloadCriticalResources() {
        // Preload fonts if using web fonts
        const criticalFonts = [
            'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap'
        ];
        
        criticalFonts.forEach(font => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'style';
            link.href = font;
            document.head.appendChild(link);
        });
    }
}

// ===============================
// MAIN APPLICATION CLASS
// ===============================

class A2AApp {
    constructor() {
        this.countdown = null;
        this.scrollAnimations = null;
        this.smoothScroll = null;
        this.ctaTracking = null;
        this.performanceOptimizer = null;
        
        this.init();
    }
    
    /**
     * Initialize application
     */
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeComponents();
            });
        } else {
            this.initializeComponents();
        }
    }
    
    /**
     * Initialize all components
     */
    initializeComponents() {
        try {
            // Initialize countdown timer
            this.countdown = new CountdownTimer('countdown', CONFIG.countdown);
            
            // Initialize scroll animations
            this.scrollAnimations = new ScrollAnimations(CONFIG.animations);
            
            // Initialize smooth scrolling
            this.smoothScroll = new SmoothScroll();
            
            // Initialize CTA tracking
            this.ctaTracking = new CTATracking(CONFIG.tracking);
            
            // Initialize performance optimizations
            this.performanceOptimizer = new PerformanceOptimizer();
            
            // Set up event listeners
            this.setupEventListeners();
            
            console.log('A2A Landing Page initialized successfully');
            
        } catch (error) {
            console.error('Error initializing A2A application:', error);
        }
    }
    
    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Handle countdown expiration
        document.addEventListener('countdownExpired', () => {
            console.log('Countdown expired and reset');
        });
        
        // Handle resize events
        window.addEventListener('resize', debounce(() => {
            this.handleResize();
        }, 250));
        
        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleResize();
            }, 500);
        });
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // Recalculate animations if needed
        if (this.scrollAnimations) {
            // Could add resize handling logic here
        }
    }
    
    /**
     * Destroy application
     */
    destroy() {
        if (this.countdown) {
            this.countdown.stop();
        }
        
        if (this.scrollAnimations) {
            this.scrollAnimations.destroy();
        }
    }
}

// ===============================
// INITIALIZE APPLICATION
// ===============================

// Initialize the application
const app = new A2AApp();

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { A2AApp, CountdownTimer, ScrollAnimations };
}

// Add to global scope for debugging
window.A2AApp = app;