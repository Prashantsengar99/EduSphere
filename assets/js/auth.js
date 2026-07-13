/**
 * ========================================
 * EDUSPHERE - Authentication System (FINAL FIX)
 * ========================================
 */

(function() {
  'use strict';

  console.log('🚀 Auth.js loading...');

  // ========================================
  // AUTH CLASS
  // ========================================
  class AuthSystem {
    constructor() {
      this.storageKey = 'edusphere_users';
      this.sessionKey = 'edusphere_session';
      this.users = [];
      this.initialized = false;
      
      this.init();
    }

    init() {
      try {
        this.loadUsers();
        this.ensureAllUsers(); // <-- NEW: Always ensures all users exist
        this.initialized = true;
        console.log('✅ AuthSystem initialized successfully');
      } catch (e) {
        console.error('❌ AuthSystem init error:', e);
        this.initialized = false;
      }
    }

    /**
     * Load users from localStorage
     */
    loadUsers() {
      try {
        const data = localStorage.getItem(this.storageKey);
        this.users = data ? JSON.parse(data) : [];
        console.log('📂 Users loaded:', this.users.length);
        return this.users;
      } catch (e) {
        console.error('Error loading users:', e);
        this.users = [];
        return [];
      }
    }

    /**
     * Save users to localStorage
     */
    saveUsers() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.users));
        console.log('💾 Users saved:', this.users.length);
        return true;
      } catch (e) {
        console.error('Error saving users:', e);
        return false;
      }
    }

    /**
     * Get all users
     */
    getUsers() {
      this.loadUsers();
      return this.users;
    }

    /**
     * NEW: Ensure all 5 demo users exist
     * This runs every time the page loads
     */
    ensureAllUsers() {
      this.loadUsers();
      
      // Define all required users
      const requiredUsers = [
        {
          id: 'user_demo_1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'student',
          createdAt: new Date().toISOString(),
          lastLogin: null
        },
        {
          id: 'user_demo_2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          password: 'password123',
          role: 'teacher',
          createdAt: new Date().toISOString(),
          lastLogin: null
        },
        {
          id: 'user_demo_3',
          firstName: 'Demo',
          lastName: 'Parent',
          email: 'parent@example.com',
          password: 'password123',
          role: 'parent',
          createdAt: new Date().toISOString(),
          lastLogin: null
        },
        {
          id: 'user_demo_4',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
          password: 'password123',
          role: 'admin',
          createdAt: new Date().toISOString(),
          lastLogin: null
        },
        {
          id: 'user_demo_5',
          firstName: 'Principal',
          lastName: 'Sir',
          email: 'principal@example.com',
          password: 'password123',
          role: 'principal',
          createdAt: new Date().toISOString(),
          lastLogin: null
        }
      ];

      let changed = false;

      // Check each required user
      requiredUsers.forEach(requiredUser => {
        const exists = this.users.find(u => u.email === requiredUser.email);
        if (!exists) {
          this.users.push(requiredUser);
          changed = true;
          console.log('✅ Added missing user:', requiredUser.email, '(', requiredUser.role, ')');
        }
      });

      if (changed) {
        this.saveUsers();
        console.log('✅ All 5 users are now present!');
      }

      // Log all users for debugging
      console.log('📧 Current users:', this.users.map(u => u.email + ' (' + u.role + ')').join(', '));
    }

    /**
     * Register a new user
     */
    register(firstName, lastName, email, password, role = 'student') {
      console.log('📝 Register called:', { firstName, lastName, email, role });
      
      try {
        if (!firstName || !lastName || !email || !password) {
          return { success: false, message: 'All fields are required.' };
        }

        this.loadUsers();

        const existing = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          return { success: false, message: 'An account with this email already exists.' };
        }

        const newUser = {
          id: 'user_' + Date.now(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.toLowerCase().trim(),
          password: password,
          role: role,
          createdAt: new Date().toISOString(),
          lastLogin: null
        };

        this.users.push(newUser);
        this.saveUsers();

        console.log('✅ User registered:', newUser.email);
        
        return { 
          success: true, 
          message: 'Account created successfully!',
          user: { ...newUser, password: undefined }
        };
      } catch (e) {
        console.error('❌ Register error:', e);
        return { success: false, message: 'Registration failed. Please try again.' };
      }
    }

    /**
     * Login user
     */
    login(email, password, remember = false) {
      console.log('🔐 Login attempt:', email);
      
      try {
        if (!email || !password) {
          return { success: false, message: 'Email and password are required.' };
        }

        this.loadUsers();

        const user = this.users.find(u => 
          u.email.toLowerCase() === email.toLowerCase() && 
          u.password === password
        );

        console.log('👤 User found:', user ? 'Yes (Role: ' + user.role + ')' : 'No');

        if (!user) {
          return { success: false, message: 'Invalid email or password.' };
        }

        user.lastLogin = new Date().toISOString();
        this.saveUsers();

        const sessionData = {
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          loggedInAt: new Date().toISOString(),
          remember: remember
        };

        if (remember) {
          localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
          console.log('💾 Session saved to localStorage');
        } else {
          sessionStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
          console.log('💾 Session saved to sessionStorage');
        }

        const userData = { ...user, password: undefined };
        console.log('✅ Login successful for:', userData.email, 'Role:', userData.role);
        
        return { 
          success: true, 
          message: 'Login successful!',
          user: userData
        };
      } catch (e) {
        console.error('❌ Login error:', e);
        return { success: false, message: 'Login failed. Please try again.' };
      }
    }

    /**
     * Get current logged in user
     */
    getCurrentUser() {
      try {
        this.loadUsers();
        
        let session = sessionStorage.getItem(this.sessionKey);
        if (session) {
          const data = JSON.parse(session);
          const user = this.users.find(u => u.id === data.userId);
          if (user) {
            console.log('👤 Current user from sessionStorage:', user.firstName, 'Role:', user.role);
            return { ...user, password: undefined };
          }
        }

        session = localStorage.getItem(this.sessionKey);
        if (session) {
          const data = JSON.parse(session);
          const user = this.users.find(u => u.id === data.userId);
          if (user) {
            console.log('👤 Current user from localStorage:', user.firstName, 'Role:', user.role);
            return { ...user, password: undefined };
          }
        }

        console.log('👤 No user logged in');
        return null;
      } catch (e) {
        console.error('Error getting current user:', e);
        return null;
      }
    }

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
      return this.getCurrentUser() !== null;
    }

    /**
     * Logout user
     */
    logout() {
      try {
        sessionStorage.removeItem(this.sessionKey);
        localStorage.removeItem(this.sessionKey);
        console.log('🚪 User logged out');
        return { success: true };
      } catch (e) {
        console.error('Error logging out:', e);
        return { success: false };
      }
    }

    /**
     * Reset password
     */
    resetPassword(email) {
      this.loadUsers();
      
      const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        return { success: false, message: 'No account found with this email address.' };
      }

      const tempPassword = 'temp_' + Math.random().toString(36).substring(2, 8);
      user.password = tempPassword;
      this.saveUsers();

      return { 
        success: true, 
        message: `Password reset! (Demo: "${tempPassword}")`
      };
    }

    /**
     * Get all users (admin only)
     */
    getAllUsers() {
      this.loadUsers();
      return this.users.map(u => ({ ...u, password: undefined }));
    }

    /**
     * Delete user
     */
    deleteUser(userId) {
      this.loadUsers();
      this.users = this.users.filter(u => u.id !== userId);
      this.saveUsers();
      return { success: true, message: 'User deleted successfully!' };
    }

    /**
     * Get users by role
     */
    getUsersByRole(role) {
      this.loadUsers();
      return this.users.filter(u => u.role === role).map(u => ({ ...u, password: undefined }));
    }

    /**
     * Force reset demo users (for debugging)
     */
    resetDemoUsers() {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.sessionKey);
      sessionStorage.removeItem(this.sessionKey);
      this.users = [];
      this.ensureAllUsers();
      console.log('🔄 Demo users reset!');
      return { success: true, message: 'Demo users reset successfully!' };
    }
  }

  // ========================================
  // CREATE GLOBAL AUTH INSTANCE
  // ========================================
  let Auth = null;

  try {
    Auth = new AuthSystem();
    console.log('✅ Auth instance created successfully!');
  } catch (e) {
    console.error('❌ Failed to create Auth instance:', e);
    Auth = {
      login: () => ({ success: false, message: 'Auth not available' }),
      register: () => ({ success: false, message: 'Auth not available' }),
      logout: () => ({ success: false }),
      getCurrentUser: () => null,
      isLoggedIn: () => false,
      resetPassword: () => ({ success: false, message: 'Auth not available' }),
      getUsers: () => [],
      getAllUsers: () => [],
      deleteUser: () => ({ success: false, message: 'Auth not available' }),
      getUsersByRole: () => [],
      resetDemoUsers: () => ({ success: false, message: 'Auth not available' })
    };
  }

  // ========================================
  // EXPOSE TO GLOBAL SCOPE
  // ========================================
  window.Auth = Auth;
  window.auth = Auth;
  window.__Auth = Auth;
  
  console.log('🔑 Auth exposed globally as:');
  console.log('   - window.Auth');
  console.log('   - window.auth');
  console.log('   - window.__Auth');

})();

console.log('✅ Auth.js execution complete');