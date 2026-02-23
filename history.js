// ================================================================
// LogAI — history.js
// Handles auth check, fetching, and rendering analysis history
// on the standalone history.html page.
// ================================================================

const SUPABASE_URL = "https://eqwsqthpdlwwgfxrjujg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qYwkc1f4o5MO9Mw91mUzoQ_94GS3iAx";

if (!window.supabase) {
    console.error("[LogAI] Supabase CDN failed to load.");
}

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        }
    }
);

// ----------------------------------------------------------------
// DOM refs
// ----------------------------------------------------------------
const appLoader = document.getElementById("appLoader");
const historyPage = document.getElementById("historyPage");
const userEmailEl = document.getElementById("userEmail");
const userAvatarEl = document.getElementById("userAvatar");
const userDropdown = document.getElementById("userDropdown");
const logoutBtn = document.getElementById("logoutBtn");
const historySkeleton = document.getElementById("historySkeleton");
const historyEmpty = document.getElementById("historyEmpty");
const historyList = document.getElementById("historyList");
const historyCount = document.getElementById("historyCount");

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
async function getAccessToken() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error || !data.session) {
        throw new Error("Not authenticated.");
    }
    return data.session.access_token;
}

function populateHeader(user) {
    if (user && user.email) {
        userEmailEl.textContent = user.email;
        userAvatarEl.textContent = user.email.slice(0, 2).toUpperCase();
    }
}

// ----------------------------------------------------------------
// Init — session guard
// ----------------------------------------------------------------
window.addEventListener("DOMContentLoaded", async () => {

    // Configure marked
    marked.setOptions({
        highlight: function (code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
        }
    });

    const { data } = await supabaseClient.auth.getSession();

    // Fade out loader
    setTimeout(() => {
        appLoader.style.opacity = "0";
        setTimeout(() => {
            appLoader.style.display = "none";
            if (!data.session) {
                // Not logged in — redirect to the main page
                window.location.href = "index.html";
                return;
            }
            populateHeader(data.session.user);
            historyPage.classList.remove("hidden");
            fetchHistory();
        }, 500);
    }, 600);
});

// ----------------------------------------------------------------
// Dropdown toggle
// ----------------------------------------------------------------
userAvatarEl.addEventListener("click", (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle("open");
});

document.addEventListener("click", () => {
    userDropdown.classList.remove("open");
});

logoutBtn.addEventListener("click", async () => {
    userDropdown.classList.remove("open");
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
});

// ----------------------------------------------------------------
// Fetch history from backend
// ----------------------------------------------------------------
async function fetchHistory() {
    historySkeleton.classList.remove("hidden");
    historyEmpty.classList.add("hidden");
    historyList.innerHTML = "";
    historyCount.textContent = "";

    let token;
    try {
        token = await getAccessToken();
    } catch {
        historySkeleton.classList.add("hidden");
        historyList.innerHTML = `<p style="color:#ef4444;font-size:13px;">Auth error — please sign in again.</p>`;
        return;
    }

    try {
        const res = await fetch("http://127.0.0.1:8000/history", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const items = await res.json();

        historySkeleton.classList.add("hidden");

        if (!items || items.length === 0) {
            historyEmpty.classList.remove("hidden");
            return;
        }

        historyCount.textContent = `${items.length} ${items.length === 1 ? "analysis" : "analyses"}`;
        items.forEach(item => {
            historyList.appendChild(renderHistoryItem(item));
        });

    } catch (err) {
        historySkeleton.classList.add("hidden");
        historyList.innerHTML = `<p style="color:#ef4444;font-size:13px;">Failed to load history: ${err.message}</p>`;
    }
}

// ----------------------------------------------------------------
// Render a single history item with expandable detail panel
// ----------------------------------------------------------------
function renderHistoryItem(item) {
    const el = document.createElement("div");
    el.className = "history-item";

    const date = item.created_at
        ? new Date(item.created_at).toLocaleString("en-US", {
            month: "short", day: "numeric", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        })
        : "Unknown date";

    const totalLines = (item.total_lines ?? 0).toLocaleString();
    const critical = item.critical ?? 0;
    const errors = item.errors ?? 0;
    const warnings = item.warnings ?? 0;
    const fileName = item.file_name || "Untitled";
    const summary = item.summary || "_No summary stored._";

    el.innerHTML = `
        <!-- ── Header row ── -->
        <div class="history-item-header">
            <span class="history-filename">${fileName}</span>
            <span class="history-date">${date}</span>
        </div>

        <!-- ── Quick stats row ── -->
        <div class="history-stats-row">
            <div class="history-stat">
                <span class="history-stat-value">${totalLines}</span>
                <span class="history-stat-label">Lines</span>
            </div>
            <div class="history-stat">
                <span class="history-stat-value is-critical">${critical}</span>
                <span class="history-stat-label">Critical</span>
            </div>
            <div class="history-stat">
                <span class="history-stat-value is-error">${errors}</span>
                <span class="history-stat-label">Errors</span>
            </div>
            <div class="history-stat">
                <span class="history-stat-value is-warning">${warnings}</span>
                <span class="history-stat-label">Warnings</span>
            </div>
        </div>

        <!-- ── Toggle button ── -->
        <div class="history-item-toggle" id="toggle-${item.id}">
            View full report
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <polyline points="6 9 12 15 18 9" stroke="currentColor" stroke-width="2.5"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>

        <!-- ── Detail panel ── -->
        <div class="history-detail" id="detail-${item.id}">

            <!-- Stats cards (full size) -->
            <div class="detail-meta-grid">
                <div class="detail-meta-card">
                    <div class="detail-meta-value">${totalLines}</div>
                    <div class="detail-meta-label">Total Lines</div>
                </div>
                <div class="detail-meta-card">
                    <div class="detail-meta-value is-critical">${critical}</div>
                    <div class="detail-meta-label">Critical</div>
                </div>
                <div class="detail-meta-card">
                    <div class="detail-meta-value is-error">${errors}</div>
                    <div class="detail-meta-label">Errors</div>
                </div>
                <div class="detail-meta-card">
                    <div class="detail-meta-value is-warning">${warnings}</div>
                    <div class="detail-meta-label">Warnings</div>
                </div>
            </div>

            <!-- File + date meta -->
            <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px;">
                <div style="display:flex;flex-direction:column;gap:2px;">
                    <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600;">File</span>
                    <span style="font-size:13px;font-family:'JetBrains Mono',monospace;color:#f1f5f9;">${fileName}</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:2px;">
                    <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600;">Analyzed</span>
                    <span style="font-size:13px;color:#94a3b8;">${date}</span>
                </div>
            </div>

            <!-- Copy / Download actions -->
            <div class="detail-actions">
                <button class="icon-btn" title="Copy report" data-copy="${item.id}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
                <button class="icon-btn" title="Download report" data-download="${item.id}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>

            <!-- Report label -->
            <div class="detail-report-label">AI Analysis Report</div>

            <!-- Full rendered report -->
            <div class="detail-report-body markdown-body" id="report-${item.id}">
                ${marked.parse(summary)}
            </div>
        </div>
    `;

    // Toggle expand / collapse
    const toggleBtn = el.querySelector(`#toggle-${item.id}`);
    const detailPanel = el.querySelector(`#detail-${item.id}`);

    toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = detailPanel.classList.contains("open");
        detailPanel.classList.toggle("open", !isOpen);
        toggleBtn.classList.toggle("open", !isOpen);
        toggleBtn.childNodes[0].textContent = isOpen ? "View full report" : "Hide report";
    });

    // Copy button
    el.querySelector(`[data-copy="${item.id}"]`).addEventListener("click", (e) => {
        e.stopPropagation();
        const reportEl = document.getElementById(`report-${item.id}`);
        navigator.clipboard.writeText(reportEl.innerText).then(() => {
            const btn = e.currentTarget;
            btn.title = "Copied!";
            setTimeout(() => { btn.title = "Copy report"; }, 2000);
        });
    });

    // Download button
    el.querySelector(`[data-download="${item.id}"]`).addEventListener("click", (e) => {
        e.stopPropagation();
        const reportEl = document.getElementById(`report-${item.id}`);
        const blob = new Blob([reportEl.innerText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `logai-report-${fileName.replace(/\s+/g, "_")}.md`;
        a.click();
        URL.revokeObjectURL(url);
    });

    return el;
}
