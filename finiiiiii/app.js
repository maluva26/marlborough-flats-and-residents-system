// ========================================
// MARLBOROUGH FLATS & APARTMENTS
// Visitor Management System - JavaScript
// ========================================

// Data Storage Keys
const STORAGE_KEYS = {
    VISITORS: 'marlborough_visitors',
    ENTRIES: 'marlborough_entries',
    SETTINGS: 'marlborough_settings'
};

// Default passwords
const PASSWORDS = {
    admin: 'admin123',
    guard: 'guard123'
};

// Initialize data from localStorage or create default
function getStoredData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

function setStoredData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Generate unique 5-char PIN (format: NNLLN - 2 numbers, 2 letters, 1 number)
function generatePIN() {
    const numbers = '0123456789';
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluding confusing letters
    let pin = '';
    pin += numbers[Math.floor(Math.random() * numbers.length)];
    pin += numbers[Math.floor(Math.random() * numbers.length)];
    pin += letters[Math.floor(Math.random() * letters.length)];
    pin += letters[Math.floor(Math.random() * letters.length)];
    pin += numbers[Math.floor(Math.random() * numbers.length)];
    return pin;
}

// Calculate expiry date (14 days from now)
function calculateExpiryDate() {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString();
}

// DOM Elements
const elements = {
    // Login
    loginScreen: document.getElementById('loginScreen'),
    loginForm: document.getElementById('loginForm'),
    password: document.getElementById('password'),

    // Admin Dashboard
    adminDashboard: document.getElementById('adminDashboard'),
    logoutAdmin: document.getElementById('logoutAdmin'),

    // Stats
    pendingCount: document.getElementById('pendingCount'),
    approvedTodayCount: document.getElementById('approvedTodayCount'),
    totalVisitorsCount: document.getElementById('totalVisitorsCount'),
    entriesTodayCount: document.getElementById('entriesTodayCount'),
    currentDate: document.getElementById('currentDate'),
    recentActivity: document.getElementById('recentActivity'),

    // Pages
    visitorRequestForm: document.getElementById('visitorRequestForm'),
    visitorsTableBody: document.getElementById('visitorsTableBody'),
    entriesTableBody: document.getElementById('entriesTableBody'),

    // Modals
    pinModal: document.getElementById('pinModal'),
    viewRequestModal: document.getElementById('viewRequestModal'),
    accessModal: document.getElementById('accessModal'),

    // PIN Display
    displayPin: document.getElementById('displayPin'),
    summaryVisitor: document.getElementById('summaryVisitor'),
    summaryResident: document.getElementById('summaryResident'),
    summaryDate: document.getElementById('summaryDate'),
    summaryTime: document.getElementById('summaryTime'),
    closePinModal: document.getElementById('closePinModal'),

    // Gate Verify
    gateVerifyForm: document.getElementById('gateVerifyForm'),
    gateVerifyResult: document.getElementById('gateVerifyResult'),
    accessIcon: document.getElementById('accessIcon'),
    accessTitle: document.getElementById('accessTitle'),
    accessDetails: document.getElementById('accessDetails'),
    closeAccessModal: document.getElementById('closeAccessModal'),

    // Reports
    exportReport: document.getElementById('exportReport'),

    // Filter tabs
    filterTabs: document.querySelectorAll('.filter-tab')
};

// Current visitor request being created
let currentVisitorRequest = null;

// ========================================
// INITIALIZATION
// ========================================

function init() {
    // Set current date
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elements.currentDate.textContent = now.toLocaleDateString('en-US', options);

    // Initialize data if empty
    if (!localStorage.getItem(STORAGE_KEYS.VISITORS)) {
        setStoredData(STORAGE_KEYS.VISITORS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ENTRIES)) {
        setStoredData(STORAGE_KEYS.ENTRIES, []);
    }

    // Update all displays
    updateDashboardStats();
    renderVisitorsTable();
    renderEntriesTable();
    renderAdminGateHistory();
    renderReports();

    // Event Listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Login
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.logoutAdmin.addEventListener('click', handleLogout);

    // Visitor Request Form
    elements.visitorRequestForm.addEventListener('submit', handleVisitorRequest);

    // Gate Verify Form
    elements.gateVerifyForm.addEventListener('submit', handleGateVerify);

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateToPage(page);
        });
    });

    // Filter tabs
    elements.filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const filter = tab.dataset.filter;
            elements.filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderVisitorsTable(filter);
        });
    });

    // PIN Input handling for gate verify
    document.querySelectorAll('.pin-input').forEach(input => {
        input.addEventListener('input', handlePinInput);
        input.addEventListener('keydown', handlePinKeydown);
        input.addEventListener('paste', handlePinPaste);
    });

    // Modals
    elements.closePinModal.addEventListener('click', () => {
        copyPINToClipboard();
    });

    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            elements.viewRequestModal.classList.remove('active');
        });
    });

    elements.closeAccessModal.addEventListener('click', () => {
        elements.accessModal.classList.remove('active');
        // Clear PIN inputs for gate verify
        document.querySelectorAll('.pin-input').forEach(input => input.value = '');
    });

    // Export report
    elements.exportReport.addEventListener('click', exportReportToDocuments);
}

// ========================================
// AUTHENTICATION
// ========================================

function handleLogin(e) {
    e.preventDefault();
    const password = elements.password.value;

    if (password === PASSWORDS.admin) {
        showScreen('adminDashboard');
    } else {
        alert('Invalid password');
    }

    elements.password.value = '';
}

function handleLogout() {
    showScreen('login');
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// ========================================
// NAVIGATION
// ========================================

function navigateToPage(page) {
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });

    // Show page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(page + 'Page').classList.add('active');
}

// ========================================
// VISITOR REQUEST HANDLING
// ========================================

function handleVisitorRequest(e) {
    e.preventDefault();

    const visitorData = {
        id: Date.now().toString(),
        pin: generatePIN(),
        createdAt: new Date().toISOString(),
        expiryDate: calculateExpiryDate(),
        status: 'pending',

        // Resident details
        residentName: document.getElementById('residentName').value,
        residentUnit: document.getElementById('residentUnit').value,
        residentPhone: document.getElementById('residentPhone').value,

        // Visitor details
        visitorName: document.getElementById('visitorName').value,
        visitorPhone: document.getElementById('visitorPhone').value,
        visitorIdType: document.getElementById('visitorIdType').value,
        visitorIdNumber: document.getElementById('visitorIdNumber').value,

        // Visit details
        visitDate: document.getElementById('visitDate').value,
        visitTime: document.getElementById('visitTime').value,
        visitDuration: document.getElementById('visitDuration').value,
        visitPurpose: document.getElementById('visitPurpose').value,
        visitIntention: document.getElementById('visitIntention').value,

        // Entry tracking
        entryTime: null,
        exitTime: null,
        gate: null
    };

    // Save to storage
    const visitors = getStoredData(STORAGE_KEYS.VISITORS);
    visitors.unshift(visitorData);
    setStoredData(STORAGE_KEYS.VISITORS, visitors);

    // Show PIN modal
    showPinModal(visitorData);

    // Reset form
    elements.visitorRequestForm.reset();

    // Update displays
    updateDashboardStats();
    renderVisitorsTable();
    renderReports();
}

function showPinModal(visitor) {
    elements.displayPin.textContent = visitor.pin;
    elements.summaryVisitor.textContent = visitor.visitorName;
    elements.summaryResident.textContent = visitor.residentName + ' (' + visitor.residentUnit + ')';
    elements.summaryDate.textContent = formatDate(visitor.visitDate);
    elements.summaryTime.textContent = formatTime(visitor.visitTime);

    elements.pinModal.classList.add('active');
    currentVisitorRequest = visitor;
}

function copyPINToClipboard() {
    const pin = elements.displayPin.textContent;
    navigator.clipboard.writeText(pin).then(() => {
        alert('PIN copied to clipboard!');
    }).catch(() => {
        // Fallback
    });
    elements.pinModal.classList.remove('active');
}

// ========================================
// VERIFICATION AT GATE
// ========================================

function handlePinInput(e) {
    const input = e.target;
    const value = input.value.toUpperCase();

    // Allow only alphanumeric
    input.value = value.replace(/[^A-Z0-9]/g, '');

    // Move to next input
    if (value.length === 1) {
        const index = parseInt(input.dataset.index);
        const inputs = document.querySelectorAll('.pin-input');
        if (index < 4) {
            inputs[index + 1].focus();
        }
    }

    // Update hidden field
    updateFullPin();
}

function handlePinKeydown(e) {
    const input = e.target;
    const index = parseInt(input.dataset.index);

    if (e.key === 'Backspace' && input.value === '') {
        const inputs = document.querySelectorAll('.pin-input');
        if (index > 0) {
            inputs[index - 1].focus();
        }
    }
}

function handlePinPaste(e) {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData('text');
    const cleanPaste = paste.replace(/[^A-Z0-9]/g, '').substring(0, 5);

    const inputs = document.querySelectorAll('.pin-input');
    for (let i = 0; i < cleanPaste.length; i++) {
        if (inputs[i]) {
            inputs[i].value = cleanPaste[i].toUpperCase();
        }
    }
    inputs[Math.min(cleanPaste.length, 4)].focus();
    updateFullPin();
}

function updateFullPin() {
    let pin = '';
    document.querySelectorAll('.pin-input').forEach(input => {
        pin += input.value;
    });
    document.getElementById('gateFullPin').value = pin;
}

function handleGateVerify(e) {
    e.preventDefault();

    const pin = document.getElementById('gateFullPin').value.toUpperCase();

    if (pin.length !== 5) {
        showAccessModal(false, 'Please enter the complete 5-character PIN');
        return;
    }

    const visitors = getStoredData(STORAGE_KEYS.VISITORS);
    const visitor = visitors.find(v => v.pin.toUpperCase() === pin);

    if (!visitor) {
        showAccessModal(false, 'Invalid PIN. No visitor request found with this code.');
        return;
    }

    if (visitor.status === 'expired') {
        showAccessModal(false, 'This PIN has expired. Please request a new visit.');
        return;
    }

    if (visitor.status === 'completed') {
        showAccessModal(false, 'This visit has already been completed.');
        return;
    }

    // Check date/time window
    const visitDateTime = new Date(visitor.visitDate + 'T' + visitor.visitTime);
    const now = new Date();
    const expiry = new Date(visitor.expiryDate);

    if (now > expiry) {
        visitor.status = 'expired';
        setStoredData(STORAGE_KEYS.VISITORS, visitors);
        showAccessModal(false, 'This PIN has expired.');
        return;
    }

    // First time entry - record entry
    if (!visitor.entryTime) {
        visitor.entryTime = now.toISOString();
        visitor.status = 'approved';
        visitor.gate = 'Main Gate';

        // Save entry log
        const entries = getStoredData(STORAGE_KEYS.ENTRIES);
        entries.unshift({
            id: visitor.id,
            visitorId: visitor.id,
            pin: visitor.pin,
            visitorName: visitor.visitorName,
            residentName: visitor.residentName,
            entryTime: visitor.entryTime,
            exitTime: null,
            gate: 'Main Gate'
        });
        setStoredData(STORAGE_KEYS.ENTRIES, entries);

        setStoredData(STORAGE_KEYS.VISITORS, visitors);

        // Show success
        showAccessModal(true, `
            <p><strong>Welcome!</strong></p>
            <p>Visitor: ${visitor.visitorName}</p>
            <p>Visiting: ${visitor.residentName} (${visitor.residentUnit})</p>
            <p>Purpose: ${getPurposeLabel(visitor.visitPurpose)}</p>
            <p>Entry Time: ${formatDateTime(now)}</p>
        `);

        updateDashboardStats();
        renderEntriesTable();
        renderAdminGateHistory();
    } else {
        // Already entered - record exit
        visitor.exitTime = now.toISOString();
        visitor.status = 'completed';

        // Update entry log
        const entries = getStoredData(STORAGE_KEYS.ENTRIES);
        const entry = entries.find(e => e.visitorId === visitor.id);
        if (entry) {
            entry.exitTime = now.toISOString();
        }
        setStoredData(STORAGE_KEYS.ENTRIES, entries);

        setStoredData(STORAGE_KEYS.VISITORS, visitors);

        showAccessModal(true, `
            <p><strong>Goodbye!</strong></p>
            <p>Visitor: ${visitor.visitorName}</p>
            <p>Exit Time: ${formatDateTime(now)}</p>
            <p>Thank you for visiting Marlborough Flats.</p>
        `);

        updateDashboardStats();
        renderEntriesTable();
        renderAdminGateHistory();
    }
}

function showAccessModal(granted, message) {
    elements.accessIcon.className = 'access-icon ' + (granted ? 'granted' : 'denied');
    elements.accessIcon.innerHTML = '<i class="fas fa-' + (granted ? 'check' : 'times') + '"></i>';
    elements.accessTitle.textContent = granted ? 'Access Granted' : 'Access Denied';
    elements.accessTitle.style.color = granted ? 'var(--success)' : 'var(--danger)';
    elements.accessDetails.innerHTML = message;
    elements.accessModal.classList.add('active');
}

// ========================================
// TABLE RENDERING
// ========================================

function renderVisitorsTable(filter = 'all') {
    const visitors = getStoredData(STORAGE_KEYS.VISITORS);
    let filtered = visitors;

    if (filter !== 'all') {
        filtered = visitors.filter(v => v.status === filter);
    }

    elements.visitorsTableBody.innerHTML = '';

    if (filtered.length === 0) {
        elements.visitorsTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--gray)">No visitor requests found</td></tr>';
        return;
    }

    filtered.forEach(visitor => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(visitor.visitDate)}</td>
            <td>${visitor.visitorName}</td>
            <td>${visitor.residentName} (${visitor.residentUnit})</td>
            <td>${getPurposeLabel(visitor.visitPurpose)}</td>
            <td>${formatTime(visitor.visitTime)}</td>
            <td><span class="pin-code-display">${visitor.pin}</span></td>
            <td><span class="status-badge ${visitor.status}">${visitor.status}</span></td>
            <td>
                <button class="action-btn view" data-id="${visitor.id}">
                    <i class="fas fa-eye"></i>
                </button>
                ${visitor.status === 'pending' ? `
                    <button class="action-btn approve" data-id="${visitor.id}">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="action-btn delete" data-id="${visitor.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </td>
        `;

        // Event listeners for buttons
        row.querySelector('.view').addEventListener('click', () => viewRequest(visitor));

        const approveBtn = row.querySelector('.approve');
        if (approveBtn) {
            approveBtn.addEventListener('click', () => approveRequest(visitor.id));
        }

        const deleteBtn = row.querySelector('.delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteRequest(visitor.id));
        }

        elements.visitorsTableBody.appendChild(row);
    });
}

function renderEntriesTable() {
    const entries = getStoredData(STORAGE_KEYS.ENTRIES);

    elements.entriesTableBody.innerHTML = '';

    if (entries.length === 0) {
        elements.entriesTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray)">No entries recorded</td></tr>';
        return;
    }

    entries.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.entryTime ? formatDateTime(new Date(entry.entryTime)) : '-'}</td>
            <td>${entry.exitTime ? formatDateTime(new Date(entry.exitTime)) : '-'}</td>
            <td>${entry.visitorName}</td>
            <td>${entry.residentName}</td>
            <td><span class="pin-code-display">${entry.pin}</span></td>
            <td>${entry.gate || '-'}</td>
        `;
        elements.entriesTableBody.appendChild(row);
    });
}

function renderAdminGateHistory() {
    const entries = getStoredData(STORAGE_KEYS.ENTRIES);
    const container = document.getElementById('adminGateHistory');

    if (!container) return;

    if (entries.length === 0) {
        container.innerHTML = '<p class="no-activity">No entries recorded yet</p>';
        return;
    }

    container.innerHTML = '';
    entries.slice(0, 10).forEach(entry => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <div class="activity-icon entry">
                <i class="fas fa-sign-in-alt"></i>
            </div>
            <div class="activity-details">
                <h4>${entry.visitorName}</h4>
                <p>${entry.residentName}</p>
            </div>
            <div class="activity-time">${formatDateTime(new Date(entry.entryTime))}</div>
        `;
        container.appendChild(item);
    });
}

// ========================================
// DASHBOARD STATS
// ========================================

function updateDashboardStats() {
    const visitors = getStoredData(STORAGE_KEYS.VISITORS);
    const entries = getStoredData(STORAGE_KEYS.ENTRIES);

    const today = new Date().toDateString();

    const pending = visitors.filter(v => v.status === 'pending').length;
    const approvedToday = visitors.filter(v => {
        const date = new Date(v.createdAt).toDateString();
        return date === today && (v.status === 'approved' || v.status === 'completed');
    }).length;
    const totalVisitors = visitors.length;
    const entriesToday = entries.filter(e => {
        if (!e.entryTime) return false;
        const date = new Date(e.entryTime).toDateString();
        return date === today;
    }).length;

    elements.pendingCount.textContent = pending;
    elements.approvedTodayCount.textContent = approvedToday;
    elements.totalVisitorsCount.textContent = totalVisitors;
    elements.entriesTodayCount.textContent = entriesToday;

    // Recent activity
    renderRecentActivity(visitors, entries);
}

function renderRecentActivity(visitors, entries) {
    const container = elements.recentActivity;
    const activities = [];

    // Add recent visitor requests
    visitors.slice(0, 5).forEach(v => {
        activities.push({
            type: v.status === 'pending' ? 'pending' : 'approved',
            title: v.status === 'pending' ? 'New Visit Request' : 'Visit Approved',
            description: `${v.visitorName} visiting ${v.residentName}`,
            time: new Date(v.createdAt)
        });
    });

    // Add recent entries
    entries.slice(0, 5).forEach(e => {
        activities.push({
            type: e.exitTime ? 'exit' : 'entry',
            title: e.exitTime ? 'Visitor Exited' : 'Visitor Entered',
            description: e.visitorName,
            time: new Date(e.exitTime || e.entryTime)
        });
    });

    // Sort by time
    activities.sort((a, b) => b.time - a.time);

    if (activities.length === 0) {
        container.innerHTML = '<p class="no-activity">No recent activity</p>';
        return;
    }

    container.innerHTML = '';
    activities.slice(0, 10).forEach(activity => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <div class="activity-icon ${activity.type}">
                <i class="fas fa-${activity.type === 'pending' ? 'clock' : activity.type === 'approved' ? 'check' : activity.type === 'exit' ? 'sign-out-alt' : 'sign-in-alt'}"></i>
            </div>
            <div class="activity-details">
                <h4>${activity.title}</h4>
                <p>${activity.description}</p>
            </div>
            <div class="activity-time">${formatRelativeTime(activity.time)}</div>
        `;
        container.appendChild(item);
    });
}

// ========================================
// REPORTS
// ========================================

function renderReports() {
    const visitors = getStoredData(STORAGE_KEYS.VISITORS);
    const entries = getStoredData(STORAGE_KEYS.ENTRIES);

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const thisMonthVisitors = visitors.filter(v => {
        const date = new Date(v.createdAt);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    const thisMonthEntries = entries.filter(e => {
        if (!e.entryTime) return false;
        const date = new Date(e.entryTime);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    document.getElementById('reportTotalVisits').textContent = visitors.length;
    document.getElementById('reportPending').textContent = visitors.filter(v => v.status === 'pending').length;
    document.getElementById('reportApproved').textContent = visitors.filter(v => v.status === 'approved').length;
    document.getElementById('reportCompleted').textContent = visitors.filter(v => v.status === 'completed').length;
    document.getElementById('reportThisMonth').textContent = thisMonthVisitors.length;
    document.getElementById('reportEntriesThisMonth').textContent = thisMonthEntries.length;
}

function exportReportToDocuments() {
    const visitors = getStoredData(STORAGE_KEYS.VISITORS);
    const entries = getStoredData(STORAGE_KEYS.ENTRIES);

    // Generate report
    let report = 'MARLBOROUGH FLATS & APARTMENTS\n';
    report += 'VISITOR MANAGEMENT REPORT\n';
    report += '='.repeat(50) + '\n\n';
    report += 'Generated: ' + new Date().toLocaleString() + '\n\n';

    // Summary
    report += 'SUMMARY\n';
    report += '-'.repeat(30) + '\n';
    report += 'Total Visitor Requests: ' + visitors.length + '\n';
    report += 'Pending: ' + visitors.filter(v => v.status === 'pending').length + '\n';
    report += 'Approved: ' + visitors.filter(v => v.status === 'approved').length + '\n';
    report += 'Completed: ' + visitors.filter(v => v.status === 'completed').length + '\n';
    report += 'Expired: ' + visitors.filter(v => v.status === 'expired').length + '\n\n';

    // Detailed visitor list
    report += 'VISITOR DETAILS\n';
    report += '-'.repeat(30) + '\n';

    visitors.forEach((v, i) => {
        report += '\n' + (i + 1) + '. ' + v.visitorName + '\n';
        report += '   PIN: ' + v.pin + '\n';
        report += '   Resident: ' + v.residentName + ' (' + v.residentUnit + ')\n';
        report += '   Date: ' + formatDate(v.visitDate) + ' ' + formatTime(v.visitTime) + '\n';
        report += '   Purpose: ' + getPurposeLabel(v.visitPurpose) + '\n';
        report += '   Status: ' + v.status + '\n';
    });

    report += '\n\nENTRY LOG\n';
    report += '-'.repeat(30) + '\n';

    entries.forEach(e => {
        report += '\n' + e.visitorName + ' -> ' + e.residentName + '\n';
        report += '   Entry: ' + (e.entryTime ? formatDateTime(new Date(e.entryTime)) : '-') + '\n';
        report += '   Exit: ' + (e.exitTime ? formatDateTime(new Date(e.exitTime)) : '-') + '\n';
    });

    // Save to file (using Blob for download)
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Marlborough_Visitor_Report_' + new Date().toISOString().split('T')[0] + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ========================================
// VIEW/APPROVE REQUEST
// ========================================

function viewRequest(visitor) {
    const details = document.getElementById('requestDetails');
    details.innerHTML = `
        <div class="request-detail-row">
            <strong>PIN Code:</strong>
            <span>${visitor.pin}</span>
        </div>
        <div class="request-detail-row">
            <strong>Status:</strong>
            <span class="status-badge ${visitor.status}">${visitor.status}</span>
        </div>
        <div class="request-detail-row">
            <strong>Created:</strong>
            <span>${formatDateTime(new Date(visitor.createdAt))}</span>
        </div>
        <div class="request-detail-row">
            <strong>Expires:</strong>
            <span>${formatDate(new Date(visitor.expiryDate))}</span>
        </div>
        <hr style="border:none;border-top:1px solid #eee;margin:1rem 0">
        <h4 style="color:var(--primary);margin-bottom:0.75rem">Resident Details</h4>
        <div class="request-detail-row">
            <strong>Name:</strong>
            <span>${visitor.residentName}</span>
        </div>
        <div class="request-detail-row">
            <strong>Unit:</strong>
            <span>${visitor.residentUnit}</span>
        </div>
        <div class="request-detail-row">
            <strong>Phone:</strong>
            <span>${visitor.residentPhone}</span>
        </div>
        <hr style="border:none;border-top:1px solid #eee;margin:1rem 0">
        <h4 style="color:var(--primary);margin-bottom:0.75rem">Visitor Details</h4>
        <div class="request-detail-row">
            <strong>Name:</strong>
            <span>${visitor.visitorName}</span>
        </div>
        <div class="request-detail-row">
            <strong>Phone:</strong>
            <span>${visitor.visitorPhone}</span>
        </div>
        <div class="request-detail-row">
            <strong>ID Type:</strong>
            <span>${getIdTypeLabel(visitor.visitorIdType)}</span>
        </div>
        <div class="request-detail-row">
            <strong>ID Number:</strong>
            <span>${visitor.visitorIdNumber || 'N/A'}</span>
        </div>
        <hr style="border:none;border-top:1px solid #eee;margin:1rem 0">
        <h4 style="color:var(--primary);margin-bottom:0.75rem">Visit Details</h4>
        <div class="request-detail-row">
            <strong>Date:</strong>
            <span>${formatDate(visitor.visitDate)}</span>
        </div>
        <div class="request-detail-row">
            <strong>Time:</strong>
            <span>${formatTime(visitor.visitTime)}</span>
        </div>
        <div class="request-detail-row">
            <strong>Duration:</strong>
            <span>${visitor.visitDuration} hour(s)</span>
        </div>
        <div class="request-detail-row">
            <strong>Purpose:</strong>
            <span>${getPurposeLabel(visitor.visitPurpose)}</span>
        </div>
        <div class="request-detail-row">
            <strong>Intention:</strong>
            <span>${visitor.visitIntention}</span>
        </div>
    `;

    elements.viewRequestModal.classList.add('active');
}

function approveRequest(id) {
    const visitors = getStoredData(STORAGE_KEYS.VISITORS);
    const visitor = visitors.find(v => v.id === id);

    if (visitor) {
        visitor.status = 'approved';
        setStoredData(STORAGE_KEYS.VISITORS, visitors);
        renderVisitorsTable();
        updateDashboardStats();
        renderReports();

        alert('Request approved! PIN: ' + visitor.pin);
    }
}

function deleteRequest(id) {
    if (!confirm('Are you sure you want to delete this request?')) return;

    const visitors = getStoredData(STORAGE_KEYS.VISITORS);
    const filtered = visitors.filter(v => v.id !== id);
    setStoredData(STORAGE_KEYS.VISITORS, filtered);
    renderVisitorsTable();
    updateDashboardStats();
    renderReports();
    alert('Request deleted');
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(timeStr) {
    if (!timeStr) return '-';
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDateTime(date) {
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return minutes + 'm ago';
    if (hours < 24) return hours + 'h ago';
    if (days < 7) return days + 'd ago';
    return formatDate(date);
}

function getPurposeLabel(purpose) {
    const labels = {
        family: 'Family Visit',
        friend: 'Friend Visit',
        business: 'Business',
        delivery: 'Delivery',
        maintenance: 'Maintenance',
        other: 'Other'
    };
    return labels[purpose] || purpose;
}

function getIdTypeLabel(type) {
    const labels = {
        national_id: 'National ID',
        passport: 'Passport',
        drivers_license: "Driver's License"
    };
    return labels[type] || type;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);