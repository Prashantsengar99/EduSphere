// ============================================
// PRINCIPAL UTILITIES
// ============================================

function showToast(message, type = 'info') {
    let toast = document.getElementById('toast');
    if (!toast) {
        const div = document.createElement('div');
        div.id = 'toast';
        div.className = 'toast';
        document.body.appendChild(div);
        toast = div;
    }
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 4000);
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function animateCounter(el, target, prefix = '', suffix = '') {
    if (!el) return;
    const duration = 1200;
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);
        el.textContent = prefix + current.toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatCurrency(amount) {
    return '₹' + (amount || 0).toLocaleString();
}