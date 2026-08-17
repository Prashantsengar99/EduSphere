// ============================================
// PRINCIPAL API CONFIGURATION
// ============================================

const API_BASE = 'http://localhost:5002';

function getToken() {
    return localStorage.getItem('edusphere_token') || sessionStorage.getItem('edusphere_token');
}

function getUser() {
    try {
        return JSON.parse(localStorage.getItem('edusphere_user') || sessionStorage.getItem('edusphere_user'));
    } catch { return null; }
}

async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });
        if (response.status === 401) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
            return null;
        }
        const data = await response.json();
        console.log(`📡 ${endpoint}:`, data);
        return data;
    } catch (error) {
        console.error('❌ API Error:', error);
        showToast('Error connecting to server', 'error');
        return null;
    }
}