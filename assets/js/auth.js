/**
 * ========================================
 * EDUSPHERE - Authentication System (ADMIN FIX)
 * ========================================
 */

(function() {
  'use strict';

  console.log('🚀 Auth.js loading...');

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
        this.ensureAdminUser();
        this.initialized = true;
        console.log('✅ AuthSystem initialized');
      } catch (e) {
        console.error('❌ AuthSystem error:', e);
      }
    }

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

    getUsers() {
      this.loadUsers();
      return this.users;
    }

    /**
     * Ensure admin user exists - FIXED
     */
    ensureAdminUser() {
      this.loadUsers();
      
      // Check if admin exists
      const adminExists = this.users.find(u => u.role === 'admin');
      
      if (!adminExists) {
        console.log('👑 No admin found, creating default admin...');
        
        const defaultAdmin = {
          id: 'admin_default_' + Date.now(),
          firstName: 'Super',
          lastName: 'Admin',
          email: 'admin@edusphere.com',
          password: 'admin123',
          role: 'admin',
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          lastLogin: null,
          isActive: true
        };
        
        this.users.push(defaultAdmin);
        this.saveUsers();
        console.log('✅ Default admin created!');
        console.log('📧 Admin: admin@edusphere.com / admin123');
      } else {
        console.log('👑 Admin already exists:', adminExists.email);
      }

      console.log('📧 All users:', this.users.map(u => u.email + ' (' + u.role + ')').join(', '));
    }

    /**
     * CREATE USER - Only Admin
     */
    createUser(firstName, lastName, email, password, role = 'student', createdBy = 'admin') {
      console.log('👤 Creating user:', { firstName, lastName, email, role });
      
      try {
        if (!firstName || !lastName || !email || !password) {
          return { success: false, message: 'All fields are required.' };
        }

        this.loadUsers();

        const existing = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          return { success: false, message: 'User with this email already exists.' };
        }

        const newUser = {
          id: 'user_' + Date.now(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.toLowerCase().trim(),
          password: password,
          role: role,
          createdBy: createdBy,
          createdAt: new Date().toISOString(),
          lastLogin: null,
          isActive: true
        };

        this.users.push(newUser);
        this.saveUsers();

        console.log('✅ User created:', newUser.email, 'Role:', newUser.role);
        
        return { 
          success: true, 
          message: 'User created successfully!',
          user: { ...newUser, password: undefined }
        };
      } catch (e) {
        console.error('❌ Create user error:', e);
        return { success: false, message: 'Failed to create user.' };
      }
    }

    /**
     * LOGIN - Fixed
     */
    login(email, password, remember = false) {
      console.log('🔐 Login attempt:', email);
      
      try {
        if (!email || !password) {
          return { success: false, message: 'Email and password are required.' };
        }

        this.loadUsers();

        // Find active user
        const user = this.users.find(u => 
          u.email.toLowerCase() === email.toLowerCase() && 
          u.password === password &&
          u.isActive !== false
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

        console.log('✅ Login successful:', user.email, 'Role:', user.role);
        
        return { 
          success: true, 
          message: 'Login successful!',
          user: { ...user, password: undefined }
        };
      } catch (e) {
        console.error('❌ Login error:', e);
        return { success: false, message: 'Login failed. Please try again.' };
      }
    }

    /**
     * GET CURRENT USER - Fixed
     */
    getCurrentUser() {
      try {
        this.loadUsers();
        
        let session = sessionStorage.getItem(this.sessionKey);
        if (session) {
          const data = JSON.parse(session);
          const user = this.users.find(u => u.id === data.userId && u.isActive !== false);
          if (user) {
            console.log('👤 Current user from sessionStorage:', user.email, 'Role:', user.role);
            return { ...user, password: undefined };
          }
        }

        session = localStorage.getItem(this.sessionKey);
        if (session) {
          const data = JSON.parse(session);
          const user = this.users.find(u => u.id === data.userId && u.isActive !== false);
          if (user) {
            console.log('👤 Current user from localStorage:', user.email, 'Role:', user.role);
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

    isLoggedIn() {
      return this.getCurrentUser() !== null;
    }

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

    updateUser(userId, updates) {
      try {
        this.loadUsers();
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
          return { success: false, message: 'User not found.' };
        }

        const allowedUpdates = ['firstName', 'lastName', 'email', 'role', 'isActive'];
        allowedUpdates.forEach(field => {
          if (updates[field] !== undefined) {
            this.users[userIndex][field] = updates[field];
          }
        });

        this.saveUsers();
        return { success: true, message: 'User updated successfully!' };
      } catch (e) {
        console.error('Update user error:', e);
        return { success: false, message: 'Failed to update user.' };
      }
    }

    deleteUser(userId) {
      try {
        this.loadUsers();
        const user = this.users.find(u => u.id === userId);
        if (user && user.role === 'admin') {
          const adminCount = this.users.filter(u => u.role === 'admin').length;
          if (adminCount <= 1) {
            return { success: false, message: 'Cannot delete the last admin user.' };
          }
        }

        this.users = this.users.filter(u => u.id !== userId);
        this.saveUsers();
        return { success: true, message: 'User deleted successfully!' };
      } catch (e) {
        console.error('Delete user error:', e);
        return { success: false, message: 'Failed to delete user.' };
      }
    }

    resetUserPassword(userId, newPassword) {
      try {
        this.loadUsers();
        const user = this.users.find(u => u.id === userId);
        if (!user) {
          return { success: false, message: 'User not found.' };
        }

        if (newPassword.length < 6) {
          return { success: false, message: 'Password must be at least 6 characters.' };
        }

        user.password = newPassword;
        this.saveUsers();
        return { success: true, message: 'Password reset successfully!' };
      } catch (e) {
        console.error('Reset password error:', e);
        return { success: false, message: 'Failed to reset password.' };
      }
    }

    getUsersByRole(role) {
      this.loadUsers();
      return this.users.filter(u => u.role === role).map(u => ({ ...u, password: undefined }));
    }

    getAllUsers() {
      this.loadUsers();
      return this.users.map(u => ({ ...u, password: undefined }));
    }

    isAdmin() {
      const user = this.getCurrentUser();
      return user && user.role === 'admin';
    }

    register() {
      return { 
        success: false, 
        message: 'Self-registration is disabled. Please contact admin to create an account.' 
      };
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
  }

  // ========================================
  // EXPOSE TO GLOBAL SCOPE
  // ========================================
  window.Auth = Auth;
  window.auth = Auth;
  window.__Auth = Auth;
  
  console.log('🔑 Auth available: window.Auth');

})();

console.log('✅ Auth.js execution complete');