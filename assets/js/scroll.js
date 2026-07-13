/**
 * ========================================
 * EDUSPHERE - Scroll & Animations
 * ========================================
 */

class ScrollManager {
  constructor() {
    this.progressBar = document.getElementById('scroll-progress');
    this.sections = document.querySelectorAll('[data-animate]');
    this.init();
  }

  init() {
    this.setupScrollProgress();
    this.setupScrollAnimations();
    this.setupSmoothAnchors();
  }

  setupScrollProgress() {
    if (!this.progressBar) return;

    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      this.progressBar.style.width = `${progress}%`;
    }, { passive: true });
  }

  setupScrollAnimations() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target;
          
          // Add visible class
          target.classList.add('visible');
          
          // Trigger counter if present
          if (target.dataset.counter) {
            this.animateCounter(target);
          }

          // Trigger stagger animation
          if (target.classList.contains('stagger-children')) {
            target.classList.add('visible');
          }

          // Unobserve after animation
          if (!target.dataset.keepObserving) {
            observer.unobserve(target);
          }
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    this.sections.forEach(el => observer.observe(el));
  }

  animateCounter(element) {
    const target = parseInt(element.dataset.counter);
    if (isNaN(target)) return;

    let current = 0;
    const increment = Math.ceil(target / 60);
    const duration = 2000;
    const startTime = performance.now();

    const updateCounter = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      current = Math.floor(progress * target);
      
      element.textContent = current.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = target.toLocaleString();
      }
    };

    requestAnimationFrame(updateCounter);
  }

  setupSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;
        
        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();
        
        const navHeight = document.getElementById('navbar')?.offsetHeight || 80;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      });
    });
  }
}

// Initialize scroll manager
document.addEventListener('DOMContentLoaded', () => {
  window.scrollManager = new ScrollManager();
});