/**
 * ========================================
 * EDUSPHERE - Page Loader
 * ========================================
 */

class PageLoader {
  constructor() {
    this.loader = document.getElementById('loader');
    this.init();
  }

  init() {
    // Hide loader when page is fully loaded
    window.addEventListener('load', () => {
      this.hide();
    });

    // Fallback: hide after 3 seconds
    setTimeout(() => this.hide(), 3000);
  }

  hide() {
    if (!this.loader) return;
    this.loader.classList.add('hidden');
    
    // Remove from DOM after transition
    setTimeout(() => {
      if (this.loader) {
        this.loader.remove();
      }
    }, 500);
  }
}

// Initialize loader
document.addEventListener('DOMContentLoaded', () => {
  window.pageLoader = new PageLoader();
});