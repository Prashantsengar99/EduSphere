// ============================================
// STUDENT DATA - API INTEGRATION
// ============================================

const StudentData = {
    // ===== API BASE URL =====
    API_BASE: 'https://your-api.com/api', // Change to your actual API
    
    // ===== LOCAL STORAGE KEYS (for caching) =====
    KEYS: {
        STUDENT: 'edusphere_student',
        STUDENT_TOKEN: 'edusphere_student_token',
        STUDENT_GRADES: 'edusphere_student_grades',
        STUDENT_ATTENDANCE: 'edusphere_student_attendance',
        STUDENT_ASSIGNMENTS: 'edusphere_student_assignments',
        STUDENT_SCHEDULE: 'edusphere_student_schedule',
        STUDENT_FEES: 'edusphere_student_fees',
        STUDENT_LIBRARY: 'edusphere_student_library',
        STUDENT_NOTICES: 'edusphere_student_notices',
        STUDENT_SETTINGS: 'edusphere_student_settings'
    },

    // ============================================
    // AUTHENTICATION
    // ============================================
    
    // Login
    async login(email, password) {
        try {
            const response = await fetch(`${this.API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role: 'student' })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Save token and student data
                localStorage.setItem(this.KEYS.STUDENT_TOKEN, data.token);
                localStorage.setItem(this.KEYS.STUDENT, JSON.stringify(data.student));
                
                // Fetch all student data
                await this.fetchAllData(data.token);
                
                return { success: true, student: data.student };
            }
            return { success: false, message: data.message || 'Login failed' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error. Please try again.' };
        }
    },

    // Logout
    logout() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        window.location.href = 'login.html';
    },

    // Get current student
    getStudent() {
        const data = localStorage.getItem(this.KEYS.STUDENT);
        return data ? JSON.parse(data) : null;
    },

    // Get token
    getToken() {
        return localStorage.getItem(this.KEYS.STUDENT_TOKEN);
    },

    // ============================================
    // FETCH ALL DATA
    // ============================================
    
    async fetchAllData(token) {
        const endpoints = [
            { key: this.KEYS.STUDENT_GRADES, url: '/student/grades' },
            { key: this.KEYS.STUDENT_ATTENDANCE, url: '/student/attendance' },
            { key: this.KEYS.STUDENT_ASSIGNMENTS, url: '/student/assignments' },
            { key: this.KEYS.STUDENT_SCHEDULE, url: '/student/schedule' },
            { key: this.KEYS.STUDENT_FEES, url: '/student/fees' },
            { key: this.KEYS.STUDENT_LIBRARY, url: '/student/library' },
            { key: this.KEYS.STUDENT_NOTICES, url: '/student/notices' },
            { key: this.KEYS.STUDENT_SETTINGS, url: '/student/settings' }
        ];

        const promises = endpoints.map(async ({ key, url }) => {
            try {
                const response = await fetch(`${this.API_BASE}${url}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    localStorage.setItem(key, JSON.stringify(data.data));
                }
            } catch (error) {
                console.error(`Error fetching ${url}:`, error);
            }
        });

        await Promise.all(promises);
    },

    // ============================================
    // FETCH SPECIFIC DATA
    // ============================================
    
    async fetchGrades() {
        const token = this.getToken();
        if (!token) return [];
        
        try {
            const response = await fetch(`${this.API_BASE}/student/grades`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem(this.KEYS.STUDENT_GRADES, JSON.stringify(data.data));
                return data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching grades:', error);
            return this.getGrades(); // Return cached data
        }
    },

    async fetchAttendance() {
        const token = this.getToken();
        if (!token) return [];
        
        try {
            const response = await fetch(`${this.API_BASE}/student/attendance`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem(this.KEYS.STUDENT_ATTENDANCE, JSON.stringify(data.data));
                return data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching attendance:', error);
            return this.getAttendance();
        }
    },

    async fetchAssignments() {
        const token = this.getToken();
        if (!token) return [];
        
        try {
            const response = await fetch(`${this.API_BASE}/student/assignments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem(this.KEYS.STUDENT_ASSIGNMENTS, JSON.stringify(data.data));
                return data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching assignments:', error);
            return this.getAssignments();
        }
    },

    async fetchSchedule() {
        const token = this.getToken();
        if (!token) return [];
        
        try {
            const response = await fetch(`${this.API_BASE}/student/schedule`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem(this.KEYS.STUDENT_SCHEDULE, JSON.stringify(data.data));
                return data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching schedule:', error);
            return this.getSchedule();
        }
    },

    async fetchFees() {
        const token = this.getToken();
        if (!token) return [];
        
        try {
            const response = await fetch(`${this.API_BASE}/student/fees`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem(this.KEYS.STUDENT_FEES, JSON.stringify(data.data));
                return data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching fees:', error);
            return this.getFees();
        }
    },

    async fetchLibrary() {
        const token = this.getToken();
        if (!token) return [];
        
        try {
            const response = await fetch(`${this.API_BASE}/student/library`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem(this.KEYS.STUDENT_LIBRARY, JSON.stringify(data.data));
                return data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching library:', error);
            return this.getLibrary();
        }
    },

    async fetchNotices() {
        const token = this.getToken();
        if (!token) return [];
        
        try {
            const response = await fetch(`${this.API_BASE}/student/notices`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem(this.KEYS.STUDENT_NOTICES, JSON.stringify(data.data));
                return data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching notices:', error);
            return this.getNotices();
        }
    },

    // ============================================
    // GET CACHED DATA
    // ============================================
    
    getGrades() {
        const data = localStorage.getItem(this.KEYS.STUDENT_GRADES);
        return data ? JSON.parse(data) : [];
    },

    getAttendance() {
        const data = localStorage.getItem(this.KEYS.STUDENT_ATTENDANCE);
        return data ? JSON.parse(data) : [];
    },

    getAssignments() {
        const data = localStorage.getItem(this.KEYS.STUDENT_ASSIGNMENTS);
        return data ? JSON.parse(data) : [];
    },

    getSchedule() {
        const data = localStorage.getItem(this.KEYS.STUDENT_SCHEDULE);
        return data ? JSON.parse(data) : [];
    },

    getFees() {
        const data = localStorage.getItem(this.KEYS.STUDENT_FEES);
        return data ? JSON.parse(data) : [];
    },

    getLibrary() {
        const data = localStorage.getItem(this.KEYS.STUDENT_LIBRARY);
        return data ? JSON.parse(data) : [];
    },

    getNotices() {
        const data = localStorage.getItem(this.KEYS.STUDENT_NOTICES);
        return data ? JSON.parse(data) : [];
    },

    getSettings() {
        const data = localStorage.getItem(this.KEYS.STUDENT_SETTINGS);
        return data ? JSON.parse(data) : {
            theme: 'light',
            notifications: true,
            language: 'en'
        };
    },

    // ============================================
    // UPDATE DATA
    // ============================================
    
    async updateProfile(data) {
        const token = this.getToken();
        if (!token) return { success: false, message: 'Not authenticated' };

        try {
            const response = await fetch(`${this.API_BASE}/student/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.success) {
                const student = this.getStudent();
                const updated = { ...student, ...data };
                localStorage.setItem(this.KEYS.STUDENT, JSON.stringify(updated));
            }
            return result;
        } catch (error) {
            console.error('Error updating profile:', error);
            return { success: false, message: 'Network error' };
        }
    },

    async updateSettings(settings) {
        const token = this.getToken();
        if (!token) return { success: false, message: 'Not authenticated' };

        try {
            const response = await fetch(`${this.API_BASE}/student/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });
            const result = await response.json();
            if (result.success) {
                localStorage.setItem(this.KEYS.STUDENT_SETTINGS, JSON.stringify(settings));
            }
            return result;
        } catch (error) {
            console.error('Error updating settings:', error);
            return { success: false, message: 'Network error' };
        }
    },

    // ============================================
    // GET STATS (from cached data)
    // ============================================
    
    getStats() {
        const grades = this.getGrades();
        const attendance = this.getAttendance();
        const assignments = this.getAssignments();

        // Calculate average grade
        let avgGrade = 0;
        if (grades.length > 0) {
            const total = grades.reduce((sum, g) => sum + g.score, 0);
            avgGrade = Math.round(total / grades.length);
        }

        // Calculate average attendance
        let avgAttendance = 0;
        if (attendance.length > 0) {
            const total = attendance.reduce((sum, a) => sum + a.percentage, 0);
            avgAttendance = Math.round(total / attendance.length);
        }

        // Count pending assignments
        const pendingAssignments = assignments.filter(a => a.status === 'pending').length;

        return {
            avgGrade,
            avgAttendance,
            pendingAssignments,
            totalAssignments: assignments.length,
            totalFees: this.getFees().length
        };
    },

    // ============================================
    // REFRESH ALL DATA
    // ============================================
    
    async refreshAllData() {
        const token = this.getToken();
        if (!token) return { success: false, message: 'Not authenticated' };

        try {
            await this.fetchAllData(token);
            return { success: true };
        } catch (error) {
            console.error('Error refreshing data:', error);
            return { success: false, message: 'Error refreshing data' };
        }
    },

    // ============================================
    // CLEAR CACHE
    // ============================================
    
    clearCache() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
};

// Make available globally
window.StudentData = StudentData;

console.log('🎓 Student Data API Integration loaded!');