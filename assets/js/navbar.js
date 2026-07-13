/**
 * ========================================
 * EDUSPHERE - Navigation
 * ========================================
 */

class Navbar {
  constructor() {
    this.nav = document.getElementById('navbar');
    this.menuBtn = document.getElementById('menu-btn');
    this.mobileMenu = document.getElementById('mobile-menu');
    this.dropdowns = document.querySelectorAll('.dropdown-trigger');
    this.lastScroll = 0;
    this.init();
  }

  init() {
    this.setupMobileMenu();
    this.setupScroll();
    this.setupDropdowns();
    this.setupActiveLink();
  }

  setupMobileMenu() {
    if (!this.menuBtn || !this.mobileMenu) return;

    this.menuBtn.addEventListener('click', () => {
      const isOpen = this.mobileMenu.classList.toggle('open');
      this.menuBtn.setAttribute('aria-expanded', isOpen);
      this.mobileMenu.setAttribute('aria-hidden', !isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close menu on link click
    this.mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        this.mobileMenu.classList.remove('open');
        this.menuBtn.setAttribute('aria-expanded', 'false');
        this.mobileMenu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
      if (!this.nav.contains(e.target) && this.mobileMenu.classList.contains('open')) {
        this.mobileMenu.classList.remove('open');
        this.menuBtn.setAttribute('aria-expanded', 'false');
        this.mobileMenu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    });
  }

  setupScroll() {
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      
      if (currentScroll > 100) {
        this.nav.classList.add('scrolled');
      } else {
        this.nav.classList.remove('scrolled');
      }

      // Hide/show on scroll
      if (currentScroll > this.lastScroll && currentScroll > 300) {
        this.nav.style.transform = 'translateY(-100%)';
      } else {
        this.nav.style.transform = 'translateY(0)';
      }

      this.lastScroll = currentScroll;
    }, { passive: true });
  }

  setupDropdowns() {
    this.dropdowns.forEach(trigger => {
      const dropdown = trigger.querySelector('.dropdown-menu');
      if (!dropdown) return;

      // Desktop hover
      trigger.addEventListener('mouseenter', () => {
        if (window.innerWidth >= 1024) {
          dropdown.classList.add('open');
        }
      });

      trigger.addEventListener('mouseleave', () => {
        if (window.innerWidth >= 1024) {
          dropdown.classList.remove('open');
        }
      });

      // Mobile click
      trigger.addEventListener('click', (e) => {
        if (window.innerWidth < 1024) {
          e.preventDefault();
          dropdown.classList.toggle('open');
        }
      });
    });
  }

  setupActiveLink() {
    const currentPath = window.location.pathname;
    const navLinks = this.nav.querySelectorAll('a:not(.dropdown-trigger)');
    
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPath || (currentPath === '/' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  }
}

// Initialize navbar
document.addEventListener('DOMContentLoaded', () => {
  window.navbar = new Navbar();
});