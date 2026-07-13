/**
 * ========================================
 * EDUSPHERE - Dashboard Utilities
 * ========================================
 */

class DashboardManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupCharts();
        this.setupNotifications();
        this.setupQuickActions();
    }

    /**
     * Setup charts (placeholder for chart library)
     */
    setupCharts() {
        // This would integrate with Chart.js or similar
        console.log('Dashboard charts initialized');
    }

    /**
     * Setup notifications
     */
    setupNotifications() {
        // Check for new notifications
        const notifications = this.getNotifications();
        if (notifications.length > 0) {
            this.showNotificationBadge(notifications.length);
        }
    }

    /**
     * Get notifications from localStorage
     */
    getNotifications() {
        try {
            return JSON.parse(localStorage.getItem('edusphere_notifications')) || [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Show notification badge
     */
    showNotificationBadge(count) {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = count;
            badge.classList.remove('hidden');
        }
    }

    /**
     * Setup quick actions
     */
    setupQuickActions() {
        document.querySelectorAll('[data-action]').forEach(el => {
            el.addEventListener('click', function(e) {
                const action = this.dataset.action;
                this.handleAction(action);
            });
        });
    }

    /**
     * Handle quick actions
     */
    handleAction(action) {
        switch(action) {
            case 'add-user':
                window.location.href = 'register.html';
                break;
            case 'add-course':
                window.location.href = 'academics.html';
                break;
            case 'view-reports':
                window.location.href = '#reports';
                break;
            case 'settings':
                window.location.href = '#settings';
                break;
            default:
                console.log('Action:', action);
        }
    }

    /**
     * Update user avatar
     */
    updateAvatar(name) {
        const avatar = document.getElementById('user-avatar');
        if (avatar) {
            avatar.textContent = (name?.[0] || 'U').toUpperCase();
        }
    }

    /**
     * Update user info
     */
    updateUserInfo(user) {
        const name = user.firstName || 'User';
        const email = user.email || 'user@edusphere.com';
        const role = user.role || 'user';

        // Update all name displays
        document.querySelectorAll('.user-name-display, #user-name-display, #sidebar-user-name, #dashboard-user-name').forEach(el => {
            if (el) el.textContent = name;
        });

        // Update email
        document.querySelectorAll('#sidebar-user-email, #user-email-display').forEach(el => {
            if (el) el.textContent = email;
        });

        // Update role
        document.querySelectorAll('#dashboard-user-role, .user-role').forEach(el => {
            if (el) el.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        });

        // Update avatar
        this.updateAvatar(name);
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
    
    // Update user info if logged in
    const user = Auth.getCurrentUser();
    if (user) {
        window.dashboardManager.updateUserInfo(user);
    }
});