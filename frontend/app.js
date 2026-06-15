/* app.js */
// Point this at a running Django backend to use the real API.
// Leave null for DEMO mode: an in-memory store with mock ML prediction
// and duplicate detection (sample data only, nothing is persisted).
const BACKEND_API = window.__TICKETING_API__ || null;
const BASE_URL = BACKEND_API || '/api';
const DEMO = !BACKEND_API;
let currentDuplicateData = null;

// ── Demo backend (used when DEMO === true) ──────────────────────────────────
const demoCategories = [
  { key: 'Bug', words: ['error', 'crash', 'broken', 'fail', 'bug', 'exception', '500', 'not working'] },
  { key: 'Authentication', words: ['login', 'password', 'auth', 'sign in', 'token', 'session', 'mfa', 'otp'] },
  { key: 'Billing', words: ['invoice', 'payment', 'charge', 'refund', 'billing', 'subscription', 'card'] },
  { key: 'Performance', words: ['slow', 'timeout', 'lag', 'latency', 'performance', 'hang', 'freeze'] },
  { key: 'Feature Request', words: ['add', 'feature', 'request', 'would like', 'enhancement', 'support for'] },
];
function predictCategory(text) {
  const t = (text || '').toLowerCase();
  let best = 'General', score = 0;
  for (const c of demoCategories) {
    const s = c.words.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0);
    if (s > score) { score = s; best = c.key; }
  }
  return best;
}
function predictPriority(text) {
  const t = (text || '').toLowerCase();
  if (/(down|outage|critical|urgent|data loss|security|breach|cannot|can't|all users)/.test(t)) return 'Critical';
  if (/(error|crash|fail|blocked|broken|payment|login)/.test(t)) return 'High';
  if (/(slow|intermittent|sometimes|minor)/.test(t)) return 'Medium';
  return 'Low';
}
function uuid() {
  return 'xxxxxxxxyxxx4xxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  }) + Date.now().toString(16);
}
function jaccard(a, b) {
  const sa = new Set((a || '').toLowerCase().split(/\W+/).filter(Boolean));
  const sb = new Set((b || '').toLowerCase().split(/\W+/).filter(Boolean));
  if (!sa.size || !sb.size) return 0;
  let inter = 0; sa.forEach((w) => { if (sb.has(w)) inter++; });
  return inter / (sa.size + sb.size - inter);
}
let demoTickets = [
  { id: uuid(), title: 'Login page returns 500 error', description: 'Users are unable to sign in; the login endpoint intermittently returns a 500 internal server error after the latest deploy.', priority: 'Critical', status: 'Open', category: 'Authentication', created_at: '2026-06-14T09:12:00Z' },
  { id: uuid(), title: 'Invoice PDF shows wrong total', description: 'The generated invoice PDF rounds the tax incorrectly so the billing total is off by a few cents for some customers.', priority: 'High', status: 'In Progress', category: 'Billing', created_at: '2026-06-13T15:40:00Z' },
  { id: uuid(), title: 'Dashboard loads slowly on large workspaces', description: 'For workspaces with many tickets the dashboard takes 8-10 seconds to load; performance degrades with volume.', priority: 'Medium', status: 'Open', category: 'Performance', created_at: '2026-06-12T11:05:00Z' },
  { id: uuid(), title: 'Add dark mode support', description: 'Would like a dark theme toggle for the app to reduce eye strain during night shifts.', priority: 'Low', status: 'Open', category: 'Feature Request', created_at: '2026-06-10T08:30:00Z' },
  { id: uuid(), title: 'Password reset email not delivered', description: 'Some users report the password reset email never arrives; auth/email pipeline may be dropping messages.', priority: 'High', status: 'Resolved', category: 'Authentication', created_at: '2026-06-08T17:22:00Z' },
];
function demoApi(path, opts = {}) {
  const method = (opts.method || 'GET').toUpperCase();
  if (path === '/tickets/' && method === 'GET') {
    const data = [...demoTickets].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return Promise.resolve({ ok: true, status: 200, json: async () => data });
  }
  if (path === '/tickets/' && method === 'POST') {
    const body = JSON.parse(opts.body || '{}');
    if (!body.ignore_duplicates) {
      let best = null, bestScore = 0;
      for (const t of demoTickets) {
        const s = jaccard(body.title + ' ' + body.description, t.title + ' ' + t.description);
        if (s > bestScore) { bestScore = s; best = t; }
      }
      if (best && bestScore >= 0.45) {
        return Promise.resolve({
          ok: false, status: 409,
          json: async () => ({ duplicate_info: { duplicate_title: best.title, similarity_score: bestScore, duplicate_of: best.id } }),
        });
      }
    }
    const ticket = {
      id: uuid(), title: body.title, description: body.description,
      priority: predictPriority(body.title + ' ' + body.description),
      status: 'Open', category: predictCategory(body.title + ' ' + body.description),
      created_at: new Date().toISOString(),
    };
    demoTickets.unshift(ticket);
    return Promise.resolve({ ok: true, status: 201, json: async () => ticket });
  }
  return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
}
// Unified API call: demo store or real backend
function api(path, opts) {
  if (DEMO) return demoApi(path, opts);
  return fetch(`${BASE_URL}${path}`, opts);
}

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
        const response = await api('/tickets/');
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
        const response = await api('/tickets/');
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
        const response = await api('/tickets/', {
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

// Lightweight ticket detail view (notification summary)
async function viewTicketDetails(id) {
    try {
        const response = await api('/tickets/');
        const tickets = await response.json();
        const t = tickets.find(x => x.id === id);
        if (!t) return showNotification('Ticket not found', 'critical');
        showNotification(`#${t.id.slice(0, 8)} · ${t.title} — ${t.priority} / ${t.status} (${t.category || 'Uncategorized'})`, 'primary');
    } catch (err) {
        showNotification('Failed to load ticket details', 'critical');
    }
}

window.onload = () => loadDashboard();
