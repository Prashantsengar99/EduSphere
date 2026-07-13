/**
 * ========================================
 * EDUSPHERE - Performance Optimization
 * ========================================
 */

class PerformanceOptimizer {
  constructor() {
    this.init();
  }

  init() {
    this.deferNonCriticalCSS();
    this.lazyLoadImages();
    this.preloadCriticalAssets();
    this.optimizeFonts();
    this.setupCache();
    this.optimizeThirdPartyScripts();
    this.setupResourceHints();
  }

  /**
   * Defer non-critical CSS
   */
  deferNonCriticalCSS() {
    const styles = document.querySelectorAll('link[rel="stylesheet"][data-defer="true"]');
    styles.forEach(link => {
      link.setAttribute('media', 'print');
      link.setAttribute('onload', "this.media='all'");
    });
  }

  /**
   * Lazy load images with Intersection Observer
   */
  lazyLoadImages() {
    if ('IntersectionObserver' in window) {
      const images = document.querySelectorAll('img[loading="lazy"], img[data-src]');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });
      images.forEach(img => observer.observe(img));
    }
  }

  /**
   * Preload critical assets
   */
  preloadCriticalAssets() {
    const critical = [
      '/assets/css/variables.css',
      '/assets/css/utilities.css',
      '/assets/css/style.css'
    ];
    critical.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = href;
      document.head.appendChild(link);
    });

    // Preload critical fonts
    const fonts = [
      { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', as: 'style' },
      { href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap', as: 'style' }
    ];
    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = font.href.split('?')[0];
      document.head.appendChild(link);
    });
  }

  /**
   * Optimize Google Fonts
   */
  optimizeFonts() {
    document.querySelectorAll('link[href*="fonts.googleapis.com"]').forEach(link => {
      if (!link.href.includes('display=swap')) {
        link.href += '&display=swap';
      }
    });
  }

  /**
   * Setup cache control
   */
  setupCache() {
    // Add cache-control meta tag
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Cache-Control';
    meta.content = 'public, max-age=31536000, immutable';
    document.head.appendChild(meta);

    // Add version to static assets
    const version = Date.now().toString(36);
    document.querySelectorAll('link[rel="stylesheet"]:not([data-no-version])').forEach(link => {
      if (!link.href.includes('?')) {
        link.href += `?v=${version}`;
      }
    });
    document.querySelectorAll('script[src]:not([data-no-version])').forEach(script => {
      if (!script.src.includes('?')) {
        script.src += `?v=${version}`;
      }
    });
  }

  /**
   * Optimize third-party scripts
   */
  optimizeThirdPartyScripts() {
    const scripts = document.querySelectorAll('script[data-delay]');
    scripts.forEach(script => {
      const delay = parseInt(script.dataset.delay) || 3000;
      setTimeout(() => {
        const newScript = document.createElement('script');
        newScript.src = script.src;
        newScript.async = true;
        script.parentNode.replaceChild(newScript, script);
      }, delay);
    });
  }

  /**
   * Setup resource hints (dns-prefetch, preconnect)
   */
  setupResourceHints() {
    const resources = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://cdn.tailwindcss.com'
    ];
    resources.forEach(url => {
      // DNS Prefetch
      const dns = document.createElement('link');
      dns.rel = 'dns-prefetch';
      dns.href = url;
      document.head.appendChild(dns);

      // Preconnect
      const preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = url;
      preconnect.crossOrigin = 'anonymous';
      document.head.appendChild(preconnect);
    });
  }

  /**
   * Measure performance
   */
  measurePerformance() {
    if ('performance' in window && 'navigation' in performance) {
      const nav = performance.navigation;
      const timing = performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
      
      console.log(`⏱️ Load Time: ${loadTime}ms`);
      console.log(`⏱️ DOM Ready: ${domReady}ms`);
      
      // Report to analytics
      if (window.gtag) {
        gtag('event', 'performance', {
          'load_time': loadTime,
          'dom_ready': domReady
        });
      }
    }
  }
}

// Initialize performance optimization
document.addEventListener('DOMContentLoaded', () => {
  window.performanceOptimizer = new PerformanceOptimizer();
});

// Measure performance on load
window.addEventListener('load', () => {
  if (window.performanceOptimizer) {
    window.performanceOptimizer.measurePerformance();
  }
});