/**
 * ========================================
 * EDUSPHERE - Main Application (FINAL FIX)
 * ========================================
 */

class App {
  constructor() {
    this.init();
  }

  init() {
    this.setupRippleEffect();
    this.setupSmoothScroll();
    this.setupFormValidation();
    this.setupBackToTop();
    this.setupPasswordToggle();
  }

  /**
   * Ripple Effect for Buttons
   */
  setupRippleEffect() {
    document.querySelectorAll('.ripple').forEach(btn => {
      btn.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    });
  }

  /**
   * Smooth scroll for all internal links
   */
  setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(link => {
      link.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          const navHeight = document.getElementById('navbar')?.offsetHeight || 80;
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
          window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        }
      });
    });
  }

  /**
   * Form validation for all forms - FIXED
   */
  setupFormValidation() {
    document.querySelectorAll('form[data-validate]').forEach(form => {
      // Define methods inside the loop so they have access to the form
      const showError = function(field, message) {
        const parent = field.closest('.form-group') || field.parentElement;
        let error = parent.querySelector('.form-error');
        if (!error) {
          error = document.createElement('p');
          error.className = 'form-error text-red-500 text-sm mt-1';
          parent.appendChild(error);
        }
        error.textContent = message;
        field.classList.add('border-red-500');
      };

      const clearError = function(field) {
        const parent = field.closest('.form-group') || field.parentElement;
        const error = parent.querySelector('.form-error');
        if (error) error.remove();
        field.classList.remove('border-red-500');
      };

      const isValidEmail = function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      };

      const isValidPhone = function(phone) {
        return /^[0-9+\-\s()]{10,15}$/.test(phone);
      };

      const submitForm = function(form) {
        const submitBtn = form.querySelector('[type="submit"]');
        const originalText = submitBtn?.textContent || 'Submit';
        
        if (submitBtn) {
          submitBtn.textContent = 'Submitting...';
          submitBtn.disabled = true;
        }
        
        setTimeout(() => {
          if (submitBtn) {
            submitBtn.textContent = '✓ Submitted!';
            submitBtn.className = submitBtn.className.replace(/btn-\w+/g, 'btn-success');
          }
          
          const successMsg = document.createElement('div');
          successMsg.className = 'p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg mt-4';
          successMsg.textContent = 'Thank you! Your submission has been received.';
          
          form.appendChild(successMsg);
          
          setTimeout(() => {
            if (submitBtn) {
              submitBtn.textContent = originalText;
              submitBtn.disabled = false;
              submitBtn.className = submitBtn.className.replace(/btn-success/g, 'btn-primary');
            }
            form.reset();
            setTimeout(() => successMsg.remove(), 5000);
          }, 3000);
        }, 1500);
      };

      // Add submit event listener
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        let isValid = true;
        
        this.querySelectorAll('[required]').forEach(field => {
          if (!field.value.trim()) {
            isValid = false;
            showError(field, 'This field is required');
          } else if (field.type === 'email' && !isValidEmail(field.value)) {
            isValid = false;
            showError(field, 'Please enter a valid email address');
          } else if (field.type === 'tel' && !isValidPhone(field.value)) {
            isValid = false;
            showError(field, 'Please enter a valid phone number');
          } else {
            clearError(field);
          }
        });
        
        if (isValid) {
          submitForm(this);
        }
      });
    });
  }

  /**
   * Back to Top Button
   */
  setupBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 500) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    });
    
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /**
   * Password toggle for login/register forms
   */
  setupPasswordToggle() {
    document.querySelectorAll('.password-toggle').forEach(btn => {
      btn.addEventListener('click', function() {
        const input = this.closest('.relative')?.querySelector('input');
        if (!input) return;
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        this.innerHTML = type === 'password' 
          ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
      });
    });
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  console.log('✅ App initialized');
});

// ========================================
// ADD BACK-TO-TOP BUTTON TO HTML (if not exists)
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('back-to-top')) {
    const btn = document.createElement('button');
    btn.id = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.className = 'fixed bottom-8 right-8 p-3 rounded-full bg-primary text-white shadow-lg hover:bg-primary-dark transition-all duration-300 opacity-0 invisible transform translate-y-4 z-40';
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>`;
    document.body.appendChild(btn);
    
    const style = document.createElement('style');
    style.textContent = `
      #back-to-top.visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);
  }
});