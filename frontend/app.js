/* app.js */
const BASE_URL = 'http://localhost:8000/api';
let currentDuplicateData = null;

// View management
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-menu a').forEach(a => a.classList.remove('active'));
    
    document.getElementById(viewId).classList.add('active');
    
    // Update sidebar active state
    const activeLink = Array.from(document.querySelectorAll('.nav-menu a')).find(a => a.innerText.toLowerCase().includes(viewId.toLowerCase()));
    if (activeLink) activeLink.classList.add('active');
    
    if (viewId === 'dashboard') loadDashboard();
    if (viewId === 'tickets') loadTickets();
}

// Notifications
function showNotification(message, type = 'primary') {
    const area = document.getElementById('notification-area');
    const note = document.createElement('div');
    note.className = `notification ${type}`;
    note.innerText = message;
    area.appendChild(note);
    setTimeout(() => note.remove(), 4000);
}

// Load Dashboard
async function loadDashboard() {
    try {
        const response = await fetch(`${BASE_URL}/tickets/`);
        const tickets = await response.json();
        
        // Stats
        const stats = {
            total: tickets.length,
            open: tickets.filter(t => t.status === 'Open').length,
            critical: tickets.filter(t => t.priority === 'Critical').length
        };
        
        renderStats(stats);
        renderRecentTickets(tickets.slice(0, 5));
    } catch (err) {
        showNotification('Error loading dashboard data', 'critical');
    }
}

function renderStats(stats) {
    const container = document.getElementById('stats-container');
    container.innerHTML = `
        <div class="stat-card">
            <span class="stat-title">Total Tickets</span>
            <span class="stat-value">${stats.total}</span>
        </div>
        <div class="stat-card">
            <span class="stat-title">Open Tickets</span>
            <span class="stat-value">${stats.open}</span>
        </div>
        <div class="stat-card">
            <span class="stat-title">Critical Issues</span>
            <span class="stat-value" style="color: var(--prio-critical)">${stats.critical}</span>
        </div>
    `;
}

function renderRecentTickets(tickets) {
    const container = document.getElementById('recent-tickets');
    if (tickets.length === 0) {
        container.innerHTML = '<p>No tickets found.</p>';
        return;
    }
    container.innerHTML = tickets.map(t => renderTicketCard(t)).join('');
}

async function loadTickets() {
    const container = document.getElementById('all-tickets');
    try {
        const response = await fetch(`${BASE_URL}/tickets/`);
        const tickets = await response.json();
        container.innerHTML = tickets.map(t => renderTicketCard(t)).join('');
    } catch (err) {
        container.innerHTML = '<p>Failed to load tickets.</p>';
    }
}

function renderTicketCard(ticket) {
    return `
        <div class="ticket-card" onclick="viewTicketDetails('${ticket.id}')">
            <div class="ticket-header">
                <span class="ticket-title">#${ticket.id.slice(0,8)} - ${ticket.title}</span>
                <div style="display: flex; gap: 8px;">
                    <span class="badge badge-P-${ticket.priority}">${ticket.priority}</span>
                    <span class="badge badge-S-${ticket.status.replace(' ', '')}">${ticket.status}</span>
                </div>
            </div>
            <p style="font-size: 0.9rem; color: var(--text-secondary);">${ticket.description.substring(0, 100)}...</p>
            <div class="ticket-meta">
                <span><i class="fa-solid fa-tag"></i> ${ticket.category || 'Uncategorized'}</span>
                <span><i class="fa-solid fa-calendar"></i> ${new Date(ticket.created_at).toLocaleDateString()}</span>
            </div>
        </div>
    `;
}

// Form Handling
document.getElementById('create-ticket-form').onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    
    await createTicket({ title, description });
};

async function createTicket(data, force = false) {
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

    try {
        const response = await fetch(`${BASE_URL}/tickets/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.status === 409) {
            const result = await response.json();
            showDuplicateModal(result.duplicate_info, data);
        } else if (response.ok) {
            showNotification('Ticket created successfully!', 'primary');
            document.getElementById('create-ticket-form').reset();
            switchView('dashboard');
        } else {
            showNotification('Failed to create ticket', 'critical');
        }
    } catch (err) {
        showNotification('Network error', 'critical');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-magic"></i> Create Ticket & Predict';
    }
}

function showDuplicateModal(info, originalData) {
    currentDuplicateData = originalData;
    const modal = document.getElementById('duplicate-modal');
    const infoDiv = document.getElementById('dup-info');
    infoDiv.innerHTML = `
        <strong>Title:</strong> ${info.duplicate_title}<br>
        <strong>Similarity Score:</strong> ${(info.similarity_score * 100).toFixed(1)}%<br>
        <strong>ID:</strong> #${info.duplicate_of.slice(0, 8)}
    `;
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('duplicate-modal').classList.remove('active');
}

async function forceCreateTicket() {
    closeModal();
    if (currentDuplicateData) {
        showNotification("Force creating ticket...", "primary");
        await createTicket({ ...currentDuplicateData, ignore_duplicates: true });
    }
}

window.onload = () => loadDashboard();
