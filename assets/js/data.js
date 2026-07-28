// ============================================
// DATA MANAGEMENT SYSTEM
// ============================================

const AppData = {
    // ===== KEYS =====
    KEYS: {
        TEACHER: 'edusphere_teacher',
        STUDENTS: 'edusphere_students',
        CLASSES: 'edusphere_classes',
        ASSIGNMENTS: 'edusphere_assignments',
        ATTENDANCE: 'edusphere_attendance',
        GRADES: 'edusphere_grades',
        SCHEDULE: 'edusphere_schedule',
        MESSAGES: 'edusphere_messages',
        SETTINGS: 'edusphere_settings'
    },

    // ===== INITIALIZE DATA =====
    init() {
        // Check if data exists, if not, create seed data
        if (!localStorage.getItem(this.KEYS.TEACHER)) {
            this.seedData();
        }
    },

    // ===== SEED DATA =====
    seedData() {
        // Teacher Data
        const teacher = {
            id: 'TCH-001',
            name: 'Mr. Teacher',
            email: 'teacher@edusphere.com',
            phone: '+1 (555) 123-4567',
            role: 'teacher',
            designation: 'Senior Mathematics Teacher',
            qualification: 'M.Sc. Mathematics, B.Ed.',
            experience: 5,
            dob: '1985-01-15',
            gender: 'Male',
            address: '123 Education Street, City, State - 12345',
            skills: ['Mathematics', 'Science', 'Technology', 'Data Analysis', 'Curriculum Design'],
            languages: [
                { name: 'English', level: 'Fluent' },
                { name: 'Hindi', level: 'Native' },
                { name: 'French', level: 'Intermediate' }
            ],
            achievements: [
                { title: 'Best Teacher Award 2023', description: 'For excellence in teaching' },
                { title: 'Published Research Paper', description: 'Mathematics Education Journal' },
                { title: '100% Pass Rate', description: 'Class 10 Board Exams 2023' }
            ],
            joinedDate: '2020-06-01',
            status: 'active'
        };
        localStorage.setItem(this.KEYS.TEACHER, JSON.stringify(teacher));

        // Students Data
        const students = [
            { id: 'STU-001', name: 'Rahul Sharma', email: 'rahul@example.com', class: '10A', rollNo: 101, parent: 'Mr. Sharma', phone: '+91 98765 43210', attendance: 95, grades: { Mathematics: 95, Science: 88, English: 92 } },
            { id: 'STU-002', name: 'Priya Patel', email: 'priya@example.com', class: '10A', rollNo: 102, parent: 'Mrs. Patel', phone: '+91 98765 43211', attendance: 98, grades: { Mathematics: 88, Science: 91, English: 85 } },
            { id: 'STU-003', name: 'Amit Kumar', email: 'amit@example.com', class: '10B', rollNo: 103, parent: 'Mr. Kumar', phone: '+91 98765 43212', attendance: 78, grades: { Mathematics: 72, Science: 68, English: 75 } },
            { id: 'STU-004', name: 'Sneha Reddy', email: 'sneha@example.com', class: '10B', rollNo: 104, parent: 'Mrs. Reddy', phone: '+91 98765 43213', attendance: 92, grades: { Mathematics: 91, Science: 94, English: 88 } },
            { id: 'STU-005', name: 'Vikram Singh', email: 'vikram@example.com', class: '9A', rollNo: 105, parent: 'Mr. Singh', phone: '+91 98765 43214', attendance: 65, grades: { Mathematics: 58, Science: 62, English: 55 } },
            { id: 'STU-006', name: 'Anjali Gupta', email: 'anjali@example.com', class: '9A', rollNo: 106, parent: 'Mrs. Gupta', phone: '+91 98765 43215', attendance: 82, grades: { Mathematics: 85, Science: 78, English: 82 } },
            { id: 'STU-007', name: 'Arjun Nair', email: 'arjun@example.com', class: '9B', rollNo: 107, parent: 'Mr. Nair', phone: '+91 98765 43216', attendance: 45, grades: { Mathematics: 48, Science: 42, English: 50 } },
            { id: 'STU-008', name: 'Meera Iyer', email: 'meera@example.com', class: '9B', rollNo: 108, parent: 'Mrs. Iyer', phone: '+91 98765 43217', attendance: 88, grades: { Mathematics: 86, Science: 82, English: 90 } }
        ];
        localStorage.setItem(this.KEYS.STUDENTS, JSON.stringify(students));

        // Classes Data
        const classes = [
            { id: 'CLS-001', name: 'Mathematics', section: '10A', subject: 'Mathematics', students: ['STU-001', 'STU-002'], schedule: { days: ['Mon', 'Wed', 'Fri'], time: '10:00 AM' }, room: '301' },
            { id: 'CLS-002', name: 'Science', section: '10B', subject: 'Science', students: ['STU-003', 'STU-004'], schedule: { days: ['Tue', 'Thu', 'Sat'], time: '11:00 AM' }, room: '305' },
            { id: 'CLS-003', name: 'English', section: '9A', subject: 'English', students: ['STU-005', 'STU-006'], schedule: { days: ['Mon', 'Wed', 'Fri'], time: '09:00 AM' }, room: '201' },
            { id: 'CLS-004', name: 'History', section: '9B', subject: 'History', students: ['STU-007', 'STU-008'], schedule: { days: ['Tue', 'Thu'], time: '02:00 PM' }, room: '203' }
        ];
        localStorage.setItem(this.KEYS.CLASSES, JSON.stringify(classes));

        // Assignments Data
        const assignments = [
            { id: 'ASG-001', title: 'Algebra Quiz', class: '10A', subject: 'Mathematics', description: 'Solve equations 1-20', dueDate: '2024-08-20', maxScore: 100, submissions: { 'STU-001': 95, 'STU-002': 88 } },
            { id: 'ASG-002', title: 'Science Lab Report', class: '10B', subject: 'Science', description: 'Chemistry experiment results', dueDate: '2024-08-22', maxScore: 100, submissions: { 'STU-003': 72, 'STU-004': 91 } },
            { id: 'ASG-003', title: 'History Essay', class: '9A', subject: 'History', description: 'World War II analysis', dueDate: '2024-08-25', maxScore: 100, submissions: { 'STU-005': 45, 'STU-006': 82 } },
            { id: 'ASG-004', title: 'Math Problem Set', class: '9B', subject: 'Mathematics', description: 'Complete problem set 5-10', dueDate: '2024-08-18', maxScore: 100, submissions: { 'STU-007': 48, 'STU-008': 86 } }
        ];
        localStorage.setItem(this.KEYS.ASSIGNMENTS, JSON.stringify(assignments));

        // Attendance Data
        const attendance = [
            { date: '2024-08-16', class: '10A', records: { 'STU-001': 'present', 'STU-002': 'present' } },
            { date: '2024-08-16', class: '10B', records: { 'STU-003': 'late', 'STU-004': 'present' } },
            { date: '2024-08-16', class: '9A', records: { 'STU-005': 'absent', 'STU-006': 'present' } },
            { date: '2024-08-16', class: '9B', records: { 'STU-007': 'absent', 'STU-008': 'present' } }
        ];
        localStorage.setItem(this.KEYS.ATTENDANCE, JSON.stringify(attendance));

        // Schedule Data
        const schedule = [
            { day: 'Monday', time: '8:00 AM', subject: 'Mathematics', class: '10A', room: '301' },
            { day: 'Monday', time: '9:00 AM', subject: 'English', class: '9A', room: '201' },
            { day: 'Monday', time: '10:30 AM', subject: 'Science', class: '10B', room: '305' },
            { day: 'Monday', time: '11:30 AM', subject: 'History', class: '9B', room: '203' },
            { day: 'Monday', time: '1:30 PM', subject: 'Computer Science', class: '8A', room: 'Lab 101' },
            { day: 'Tuesday', time: '9:00 AM', subject: 'Science', class: '10B', room: '305' },
            { day: 'Tuesday', time: '10:30 AM', subject: 'Mathematics', class: '10A', room: '301' },
            { day: 'Tuesday', time: '1:30 PM', subject: 'English', class: '9A', room: '201' },
            { day: 'Tuesday', time: '2:30 PM', subject: 'History', class: '9B', room: '203' }
        ];
        localStorage.setItem(this.KEYS.SCHEDULE, JSON.stringify(schedule));

        // Messages Data
        const messages = [
            { id: 'MSG-001', from: 'Rahul Sharma', fromType: 'student', to: 'teacher', subject: 'Math Assignment Question', message: 'Ma\'am, I have a question about the math assignment. Could you please clarify the second question?', date: '2024-08-16T10:30:00', read: false },
            { id: 'MSG-002', from: 'Mrs. Patel', fromType: 'parent', to: 'teacher', subject: 'Priya\'s Progress', message: 'Dear Teacher, I wanted to check on my daughter\'s progress in science.', date: '2024-08-16T08:45:00', read: false },
            { id: 'MSG-003', from: 'Sneha Reddy', fromType: 'student', to: 'teacher', subject: 'Project Feedback', message: 'Thank you for the feedback on my project. I\'ve made the changes you suggested.', date: '2024-08-15T14:20:00', read: true },
            { id: 'MSG-004', from: 'Anjali Gupta', fromType: 'student', to: 'teacher', subject: 'Absence Notice', message: 'Ma\'am, I\'ll be absent tomorrow due to a family function.', date: '2024-08-15T09:15:00', read: true },
            { id: 'MSG-005', from: 'Vikram Singh', fromType: 'student', to: 'teacher', subject: 'History Assignment Help', message: 'Sir, I need help with the history assignment. Can we schedule a meeting?', date: '2024-08-14T16:00:00', read: true }
        ];
        localStorage.setItem(this.KEYS.MESSAGES, JSON.stringify(messages));

        // Settings Data
        const settings = {
            language: 'en',
            timezone: 'ist',
            dateFormat: 'dd/mm/yyyy',
            weekStart: 'monday',
            dashboardView: 'overview',
            notifications: {
                email: true,
                push: true,
                assignments: true,
                studentMessages: true,
                parentMessages: true,
                grades: false,
                systemUpdates: false
            },
            privacy: {
                profileVisibility: 'teachers',
                showContact: true,
                showSchedule: true,
                showActivity: false,
                allowDownload: false
            },
            security: {
                twoFactor: false,
                sessionTimeout: 30
            },
            appearance: {
                theme: 'system',
                accentColor: '#2563EB',
                fontSize: 'medium',
                compactMode: false,
                animations: true
            }
        };
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    },

    // ===== GET METHODS =====
    getTeacher() {
        const data = localStorage.getItem(this.KEYS.TEACHER);
        return data ? JSON.parse(data) : null;
    },

    getStudents() {
        const data = localStorage.getItem(this.KEYS.STUDENTS);
        return data ? JSON.parse(data) : [];
    },

    getStudentById(id) {
        const students = this.getStudents();
        return students.find(s => s.id === id);
    },

    getStudentsByClass(className) {
        const students = this.getStudents();
        return students.filter(s => s.class === className);
    },

    getClasses() {
        const data = localStorage.getItem(this.KEYS.CLASSES);
        return data ? JSON.parse(data) : [];
    },

    getClassById(id) {
        const classes = this.getClasses();
        return classes.find(c => c.id === id);
    },

    getAssignments() {
        const data = localStorage.getItem(this.KEYS.ASSIGNMENTS);
        return data ? JSON.parse(data) : [];
    },

    getAssignmentsByClass(className) {
        const assignments = this.getAssignments();
        return assignments.filter(a => a.class === className);
    },

    getAttendance() {
        const data = localStorage.getItem(this.KEYS.ATTENDANCE);
        return data ? JSON.parse(data) : [];
    },

    getAttendanceByDate(date) {
        const attendance = this.getAttendance();
        return attendance.filter(a => a.date === date);
    },

    getAttendanceByClass(className) {
        const attendance = this.getAttendance();
        return attendance.filter(a => a.class === className);
    },

    getSchedule() {
        const data = localStorage.getItem(this.KEYS.SCHEDULE);
        return data ? JSON.parse(data) : [];
    },

    getScheduleByDay(day) {
        const schedule = this.getSchedule();
        return schedule.filter(s => s.day.toLowerCase() === day.toLowerCase());
    },

    getMessages() {
        const data = localStorage.getItem(this.KEYS.MESSAGES);
        return data ? JSON.parse(data) : [];
    },

    getUnreadMessages() {
        const messages = this.getMessages();
        return messages.filter(m => !m.read);
    },

    getSettings() {
        const data = localStorage.getItem(this.KEYS.SETTINGS);
        if (data) return JSON.parse(data);
        // Return default settings
        return {
            language: 'en',
            timezone: 'ist',
            dateFormat: 'dd/mm/yyyy',
            weekStart: 'monday',
            dashboardView: 'overview',
            notifications: {
                email: true,
                push: true,
                assignments: true,
                studentMessages: true,
                parentMessages: true,
                grades: false,
                systemUpdates: false
            },
            privacy: {
                profileVisibility: 'teachers',
                showContact: true,
                showSchedule: true,
                showActivity: false,
                allowDownload: false
            },
            security: {
                twoFactor: false,
                sessionTimeout: 30
            },
            appearance: {
                theme: 'system',
                accentColor: '#2563EB',
                fontSize: 'medium',
                compactMode: false,
                animations: true
            }
        };
    },

    // ===== UPDATE METHODS =====
    updateTeacher(data) {
        const teacher = this.getTeacher();
        const updated = { ...teacher, ...data };
        localStorage.setItem(this.KEYS.TEACHER, JSON.stringify(updated));
        return updated;
    },

    addStudent(student) {
        const students = this.getStudents();
        student.id = 'STU-' + String(students.length + 1).padStart(3, '0');
        students.push(student);
        localStorage.setItem(this.KEYS.STUDENTS, JSON.stringify(students));
        return student;
    },

    updateStudent(id, data) {
        const students = this.getStudents();
        const index = students.findIndex(s => s.id === id);
        if (index !== -1) {
            students[index] = { ...students[index], ...data };
            localStorage.setItem(this.KEYS.STUDENTS, JSON.stringify(students));
            return students[index];
        }
        return null;
    },

    addAssignment(assignment) {
        const assignments = this.getAssignments();
        assignment.id = 'ASG-' + String(assignments.length + 1).padStart(3, '0');
        assignments.push(assignment);
        localStorage.setItem(this.KEYS.ASSIGNMENTS, JSON.stringify(assignments));
        return assignment;
    },

    updateAssignment(id, data) {
        const assignments = this.getAssignments();
        const index = assignments.findIndex(a => a.id === id);
        if (index !== -1) {
            assignments[index] = { ...assignments[index], ...data };
            localStorage.setItem(this.KEYS.ASSIGNMENTS, JSON.stringify(assignments));
            return assignments[index];
        }
        return null;
    },

    markAttendance(date, className, records) {
        const attendance = this.getAttendance();
        const existing = attendance.findIndex(a => a.date === date && a.class === className);
        if (existing !== -1) {
            attendance[existing].records = records;
        } else {
            attendance.push({ date, class: className, records });
        }
        localStorage.setItem(this.KEYS.ATTENDANCE, JSON.stringify(attendance));
        return attendance;
    },

    addMessage(message) {
        const messages = this.getMessages();
        message.id = 'MSG-' + String(messages.length + 1).padStart(3, '0');
        message.date = new Date().toISOString();
        message.read = false;
        messages.push(message);
        localStorage.setItem(this.KEYS.MESSAGES, JSON.stringify(messages));
        return message;
    },

    markMessageAsRead(id) {
        const messages = this.getMessages();
        const index = messages.findIndex(m => m.id === id);
        if (index !== -1) {
            messages[index].read = true;
            localStorage.setItem(this.KEYS.MESSAGES, JSON.stringify(messages));
            return messages[index];
        }
        return null;
    },

    updateSettings(settings) {
        const current = this.getSettings();
        const updated = { ...current, ...settings };
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(updated));
        return updated;
    },

    // ===== STATISTICS =====
    getStats() {
        const students = this.getStudents();
        const classes = this.getClasses();
        const assignments = this.getAssignments();
        const attendance = this.getAttendance();

        // Calculate average attendance
        let totalAttendance = 0;
        let attendanceCount = 0;
        students.forEach(s => {
            if (s.attendance) {
                totalAttendance += s.attendance;
                attendanceCount++;
            }
        });
        const avgAttendance = attendanceCount > 0 ? Math.round(totalAttendance / attendanceCount) : 0;

        // Calculate pending assignments
        const pending = assignments.filter(a => {
            const totalStudents = students.filter(s => s.class === a.class).length;
            const submitted = Object.keys(a.submissions || {}).length;
            return submitted < totalStudents;
        });

        return {
            totalStudents: students.length,
            totalClasses: classes.length,
            totalAssignments: assignments.length,
            pendingAssignments: pending.length,
            avgAttendance: avgAttendance,
            totalMessages: this.getMessages().length,
            unreadMessages: this.getUnreadMessages().length
        };
    },

    // ===== CLEAR DATA =====
    clearAllData() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        this.seedData();
    }
};

// Initialize on load
AppData.init();

// Make available globally
window.AppData = AppData;