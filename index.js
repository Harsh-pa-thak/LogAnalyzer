const SUPABASE_URL = "https://eqwsqthpdlwwgfxrjujg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qYwkc1f4o5MO9Mw91mUzoQ_94GS3iAx";

// ── Anonymous identity (persisted across sessions) ──────────────────────────
let anonId = localStorage.getItem("anon_id");
if (!anonId) {
    anonId = crypto.randomUUID();
    localStorage.setItem("anon_id", anonId);
}

// #1 — Usage counter (client-side tracking per day)
const ANON_LIMIT = 3;
function getUsageToday() {
    const stored = JSON.parse(localStorage.getItem("usage_today") || "{}");
    const today = new Date().toISOString().slice(0, 10);
    if (stored.date !== today) return { date: today, count: 0 };
    return stored;
}
function bumpUsage() {
    const u = getUsageToday();
    u.count++;
    localStorage.setItem("usage_today", JSON.stringify(u));
    updateUsageBadge();
}
function updateUsageBadge() {
    const u = getUsageToday();
    const left = Math.max(0, ANON_LIMIT - u.count);
    const el = document.getElementById("usageText");
    if (el) el.textContent = `${left} of ${ANON_LIMIT} left`;
    // Change dot color when running low
    const dot = document.querySelector(".usage-counter .usage-dot");
    if (dot) dot.style.background = left === 0 ? "#ef4444" : left === 1 ? "#eab308" : "#3b82f6";
}

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

window.supabaseClient = supabaseClient;




// ── DOM refs ─────────────────────────────────────────────────────────────────
const fileInput = document.getElementById("logFile");
const fileInfo = document.getElementById("fileInfo");
const analyzeBtn = document.getElementById("analyzeBtn");
const emptyState = document.getElementById("emptyState");
const resultsContent = document.getElementById("resultsContent");
const dropZone = document.getElementById("dropZone");
const appLoader = document.getElementById("appLoader");
const btnText = analyzeBtn.querySelector(".btn-text");
const spinner = analyzeBtn.querySelector(".spinner");

const progressSection = document.getElementById("progressSection");
const progressBar = document.getElementById("progressBar");
const progressMessage = document.getElementById("progressMessage");
const stagePreprocess = document.getElementById("stagePreprocess");
const stageAnalyze = document.getElementById("stageAnalyze");
const stageSynthesize = document.getElementById("stageSynthesize");
const statLines = document.getElementById("statLines");
const statCritical = document.getElementById("statCritical");
const statErrors = document.getElementById("statErrors");
const statWarnings = document.getElementById("statWarnings");

// Auth UI elements
const userEmailEl = document.getElementById("userEmail");
const userAvatarEl = document.getElementById("userAvatar");
const loginCtaEl = document.getElementById("loginCta");
const guestChipEl = document.getElementById("guestChip");
const logoutBtn = document.getElementById("logoutBtn");

// ── Auth UI toggle (no page switch — dashboard is always visible) ─────────────
function setAuthUI(user) {
    if (user) {
        // Logged-in state
        userEmailEl.textContent = user.email || "";
        const initials = (user.email || "?").slice(0, 2).toUpperCase();
        userAvatarEl.textContent = initials;
        userAvatarEl.style.display = "flex";
        loginCtaEl.classList.remove("visible");
        guestChipEl.classList.remove("visible");
        document.getElementById("nudgeBanner").classList.remove("visible"); // #2
        document.getElementById("usageCounter").classList.remove("visible"); // #1
    } else {
        // Anonymous state
        userEmailEl.textContent = "";
        userAvatarEl.style.display = "none";
        loginCtaEl.classList.add("visible");
        guestChipEl.classList.add("visible");
        document.getElementById("usageCounter").classList.add("visible"); // #1
        updateUsageBadge(); // #1
        // #2 Show nudge unless user dismissed it this session
        if (!sessionStorage.getItem("nudge_dismissed")) {
            document.getElementById("nudgeBanner").classList.add("visible");
        }
    }
}

// #2 — Nudge banner dismiss
document.getElementById("nudgeClose").addEventListener("click", () => {
    document.getElementById("nudgeBanner").classList.remove("visible");
    sessionStorage.setItem("nudge_dismissed", "1");
});

// ── DOMContentLoaded — always show dashboard, then resolve auth state ─────────
window.addEventListener("DOMContentLoaded", async () => {

    marked.setOptions({
        highlight: function (code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
        }
    });

    // Fade out loader — dashboard is always accessible, no auth gate
    setTimeout(() => {
        appLoader.style.opacity = "0";
        setTimeout(() => {
            appLoader.style.display = "none";
            document.getElementById("dashboardView").classList.add("visible"); // #11 fade in
        }, 500);
    }, 600);

    // Check session and update header UI only
    const { data } = await supabaseClient.auth.getSession();
    setAuthUI(data.session ? data.session.user : null);

    // Keep UI in sync if the user logs in/out in another tab
    supabaseClient.auth.onAuthStateChange((_event, session) => {
        setAuthUI(session ? session.user : null);
    });
});

// ── Avatar dropdown ───────────────────────────────────────────────────────────
const userDropdown = document.getElementById("userDropdown");

userAvatarEl.addEventListener("click", (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle("open");
});

document.addEventListener("click", () => userDropdown.classList.remove("open"));

logoutBtn.addEventListener("click", async () => {
    userDropdown.classList.remove("open");
    await supabaseClient.auth.signOut();
    setAuthUI(null);
});

// ── History link guard — redirect to login if not authenticated ───────────────
document.getElementById("navHistory").addEventListener("click", async (e) => {
    e.preventDefault();
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) {
        window.location.href = "history.html";
    } else {
        window.location.href = "login.html?return=history.html";
    }
});

// ----------------------------------------------------------------
// Existing dashboard / upload logic (unchanged)
// ----------------------------------------------------------------

dropZone.addEventListener("click", (e) => {
    if (e.target !== analyzeBtn && !analyzeBtn.contains(e.target)) {
        fileInput.click();
    }
});

["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

["dragenter", "dragover"].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add("drag-over"), false);
});

["dragleave", "drop"].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove("drag-over"), false);
});

dropZone.addEventListener("drop", (e) => {
    handleFiles(e.dataTransfer.files);
}, false);

fileInput.addEventListener("change", () => {
    handleFiles(fileInput.files);
});

function handleFiles(files) {
    if (files.length > 0) {
        const f = files[0];
        fileInfo.textContent = f.name;
        fileInput.files = files;
        analyzeBtn.disabled = false;
        fileInfo.style.color = "#3b82f6";

        // #8 — File preview (size + estimated chunks)
        const sizeKB = (f.size / 1024).toFixed(1);
        const sizeTxt = f.size >= 1048576 ? (f.size / 1048576).toFixed(1) + " MB" : sizeKB + " KB";
        document.getElementById("fileSizeInfo").textContent = sizeTxt;
        const estChunks = Math.max(1, Math.ceil(f.size / 30000)); // ~30KB per chunk
        document.getElementById("fileChunkInfo").textContent = "~" + estChunks + " chunk" + (estChunks > 1 ? "s" : "");
        document.getElementById("filePreview").classList.add("visible");
    }
}



function setStage(stage) {
    [stagePreprocess, stageAnalyze, stageSynthesize].forEach(el => {
        el.classList.remove("active", "complete");
    });

    if (stage === "preprocess") stagePreprocess.classList.add("active");
    if (stage === "analyze") {
        stagePreprocess.classList.add("complete");
        stageAnalyze.classList.add("active");
    }
    if (stage === "synthesize") {
        stagePreprocess.classList.add("complete");
        stageAnalyze.classList.add("complete");
        stageSynthesize.classList.add("active");
    }
    if (stage === "complete") {
        stagePreprocess.classList.add("complete");
        stageAnalyze.classList.add("complete");
        stageSynthesize.classList.add("complete");
    }
}

// #4 — Stat count-up animation
function animateCount(el, target, duration = 700) {
    const start = performance.now();
    const from = parseInt(el.textContent.replace(/,/g, "")) || 0;
    const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        el.textContent = Math.round(from + (target - from) * ease).toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

function updateStats(stats) {
    if (!stats) return;
    if (statLines && stats.total_lines !== undefined) animateCount(statLines, stats.total_lines);
    if (statCritical && stats.critical !== undefined) animateCount(statCritical, stats.critical);
    if (statErrors && stats.errors !== undefined) animateCount(statErrors, stats.errors);
    if (statWarnings && stats.warnings !== undefined) animateCount(statWarnings, stats.warnings);
}

// #7 — Toast notification system
function showToast(msg, type = "info", duration = 3000) {
    const existing = document.getElementById("logaiToast");
    if (existing) existing.remove();

    const colors = {
        info: { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.3)", text: "#93c5fd" },
        success: { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.3)", text: "#6ee7b7" },
        error: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.3)", text: "#fca5a5" },
    };
    const c = colors[type] || colors.info;

    const toast = document.createElement("div");
    toast.id = "logaiToast";
    toast.style.cssText = `
        position:fixed;bottom:28px;right:28px;z-index:9999;
        padding:12px 18px;border-radius:12px;
        background:${c.bg};border:1px solid ${c.border};
        color:${c.text};font-family:'Inter',sans-serif;font-size:13.5px;font-weight:500;
        backdrop-filter:blur(12px);box-shadow:0 8px 32px rgba(0,0,0,0.4);
        opacity:0;transform:translateY(8px);
        transition:opacity 0.25s ease,transform 0.25s ease;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    });
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(8px)";
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function resetProgress() {
    progressBar.style.width = "0%";
    progressMessage.textContent = "Preparing...";
    setStage("");
}





async function getAccessToken() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error || !data.session) {
        throw new Error("You must login first.");
    }
    return data.session.access_token;
}




async function uploadLog() {
    const file = fileInput.files[0];
    if (!file) return;

    setLoading(true);
    resetProgress();

    progressSection.classList.remove("hidden");
    document.getElementById("statsSection").classList.add("hidden");
    document.getElementById("copyBtn").style.display = "none";
    document.getElementById("downloadBtn").style.display = "none";
    emptyState.classList.add("hidden");
    resultsContent.innerHTML = "";
    resultsContent.classList.remove("hidden");

    const formData = new FormData();
    formData.append("file", file);

    // #1 — Bump client-side usage counter (anonymous only)
    const { data: sessionChk } = await supabaseClient.auth.getSession();
    if (!sessionChk.session) bumpUsage();

    try {
        // Build headers — token is optional (anonymous users skip auth)
        const reqHeaders = { "x-anon-id": anonId };
        try {
            const token = await getAccessToken();
            reqHeaders["Authorization"] = `Bearer ${token}`;
        } catch (_) {
            // Not logged in — proceed as anonymous
        }

        const response = await fetch("https://loganalyzer-4vu8.onrender.com/analyze-stream", {
            method: "POST",
            headers: reqHeaders,
            body: formData,
        });

        // ── Usage limit handling ─────────────────────────────────────────
        if (response.status === 403) {
            const data = await response.json();
            if (data.detail === "FREE_LIMIT_REACHED") {
                showLimitModal("free");
            } else if (data.detail === "USER_LIMIT_REACHED") {
                showLimitModal("user");
            } else {
                throw new Error(data.detail || "Access denied");
            }
            setLoading(false);
            return;
        }

        if (response.status === 401) {
            throw new Error("Session expired. Please login again.");
        }

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Server error");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const data = JSON.parse(line.slice(6));
                handleSSEEvent(data);
            }
        }

    } catch (error) {
        resultsContent.innerHTML = `
            <div style="color:#ef4444;padding:20px;text-align:center;">
                <h3>Error</h3>
                <p>${error.message}</p>
            </div>
        `;
    } finally {
        setLoading(false);
    }
}


function handleSSEEvent(data) {
    switch (data.stage) {
        case "preprocessing":
            setStage("preprocess");
            progressBar.style.width = "10%";
            progressMessage.textContent = "Preprocessing log file...";
            break;

        case "preprocessed":
            progressBar.style.width = "20%";
            progressMessage.textContent = "Preprocessing complete. Splitting into chunks...";
            updateStats(data.stats);
            // Reveal the stats grid
            document.getElementById("statsSection").classList.remove("hidden");
            break;

        case "chunking":
            progressBar.style.width = "22%";
            progressMessage.textContent = data.message || "Splitting into chunks...";
            break;

        case "analyzing": {
            setStage("analyze");
            const p = 25 + (data.chunk_index / data.total_chunks) * 50;
            progressBar.style.width = p + "%";
            progressMessage.textContent = data.message || `Analyzing chunk ${data.chunk_index}/${data.total_chunks}...`;
            break;
        }

        case "chunk_done": {
            // #6 — Collapsible chunk results
            const chunkWrap = document.createElement("div");
            chunkWrap.className = "chunk-section";

            const chunkHeader = document.createElement("div");
            chunkHeader.className = "chunk-header chunk-toggle";
            chunkHeader.innerHTML = `<span>Chunk ${data.chunk_index}/${data.total_chunks} Analysis</span><svg class="chunk-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="6 9 12 15 18 9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

            const chunkBody = document.createElement("div");
            chunkBody.className = "chunk-body markdown-body chunk-collapsible open";
            chunkBody.innerHTML = marked.parse(data.result);

            // Collapse previous chunks
            resultsContent.querySelectorAll(".chunk-collapsible.open").forEach(el => {
                el.classList.remove("open");
                el.previousElementSibling?.querySelector(".chunk-chevron")?.classList.add("collapsed");
            });

            chunkHeader.addEventListener("click", () => {
                chunkBody.classList.toggle("open");
                chunkHeader.querySelector(".chunk-chevron").classList.toggle("collapsed");
            });

            chunkWrap.appendChild(chunkHeader);
            chunkWrap.appendChild(chunkBody);
            resultsContent.appendChild(chunkWrap);
            break;
        }

        case "synthesizing":
            setStage("synthesize");
            progressBar.style.width = "80%";
            progressMessage.textContent = data.message || "Synthesizing final report...";
            break;

        case "complete":
            setStage("complete");
            progressBar.style.width = "100%";
            progressMessage.textContent = "Analysis complete.";
            resultsContent.innerHTML = marked.parse(data.result);
            updateStats(data.stats);
            // Show copy & download buttons
            document.getElementById("copyBtn").style.display = "flex";
            document.getElementById("downloadBtn").style.display = "flex";
            // #5 — Show New Analysis button
            document.getElementById("newAnalysisBtn").style.display = "flex";
            // #3 — Browser notification (only if tab is in background)
            if (document.hidden && Notification.permission === "granted") {
                new Notification("LogAI", { body: "Your log analysis is complete!", icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>" });
            }
            break;

        case "error":
            resultsContent.innerHTML = `<div style="color:#ef4444;padding:16px 0;"><strong>Error:</strong> ${data.message}</div>`;
            break;
    }
}


function setLoading(isLoading) {
    analyzeBtn.disabled = isLoading;
    btnText.textContent = isLoading ? "Processing..." : "Start Analysis";
    spinner.style.display = isLoading ? "block" : "none";
}

// ── Limit modal (injected without touching existing HTML) ────────────────────
function showLimitModal(type) {
    // Remove any existing modal
    const existing = document.getElementById("limitModal");
    if (existing) existing.remove();

    const isFree = type === "free";
    const title = isFree ? "Free Limit Reached" : "Daily Limit Reached";
    // #15 — Countdown to midnight UTC
    const now = new Date();
    const midnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const hoursLeft = Math.ceil((midnightUTC - now) / 3600000);
    const countdownTxt = `Resets in ~${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""}.`;
    const body = isFree
        ? `You've used your <strong>3 free analyses</strong> for today.<br>Login to get 20 analyses per day.<br><span style="font-size:12px;color:#475569;">${countdownTxt}</span>`
        : `You've used your <strong>20 daily analyses</strong>.<br><span style="font-size:12px;color:#475569;">${countdownTxt}</span>`;

    const modal = document.createElement("div");
    modal.id = "limitModal";
    modal.innerHTML = `
        <div id="limitModalBackdrop" style="
            position:fixed;inset:0;z-index:9000;
            background:rgba(0,0,10,0.72);
            backdrop-filter:blur(6px);
            display:flex;align-items:center;justify-content:center;padding:24px;
        ">
            <div style="
                background:rgba(15,23,42,0.98);
                border:1px solid rgba(148,163,184,0.14);
                border-radius:20px;
                padding:40px 36px 32px;
                max-width:400px;width:100%;
                box-shadow:0 32px 64px rgba(0,0,0,0.6),0 0 80px rgba(59,130,246,0.08);
                font-family:'Inter',sans-serif;
                text-align:center;
            ">
                <div style="
                    width:52px;height:52px;margin:0 auto 20px;
                    background:linear-gradient(135deg,rgba(239,68,68,0.2),rgba(239,68,68,0.1));
                    border:1px solid rgba(239,68,68,0.25);
                    border-radius:14px;display:flex;align-items:center;justify-content:center;
                ">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <h3 style="color:#f8fafc;font-size:18px;font-weight:700;margin:0 0 10px;letter-spacing:-0.3px;">${title}</h3>
                <p style="color:#64748b;font-size:13.5px;line-height:1.6;margin:0 0 28px;">${body}</p>
                ${isFree ? `
                <button id="limitModalLogin" style="
                    width:100%;padding:13px 20px;
                    background:linear-gradient(135deg,#3b82f6,#6366f1);
                    border:none;border-radius:10px;
                    font-family:'Inter',sans-serif;font-size:14.5px;font-weight:600;
                    color:#fff;cursor:pointer;margin-bottom:10px;
                    box-shadow:0 4px 16px rgba(59,130,246,0.35);
                ">Login</button>
                <button id="limitModalSignup" style="
                    width:100%;padding:12px 20px;
                    background:transparent;border:1px solid rgba(99,102,241,0.35);
                    border-radius:10px;font-family:'Inter',sans-serif;
                    font-size:14px;font-weight:500;color:#a5b4fc;cursor:pointer;margin-bottom:10px;
                ">Create Account</button>` : `
                <button id="limitModalGotIt" style="
                    width:100%;padding:13px 20px;
                    background:linear-gradient(135deg,#3b82f6,#6366f1);
                    border:none;border-radius:10px;
                    font-family:'Inter',sans-serif;font-size:14.5px;font-weight:600;
                    color:#fff;cursor:pointer;margin-bottom:10px;
                    box-shadow:0 4px 16px rgba(59,130,246,0.35);
                ">Got it</button>`}
                <button id="limitModalClose" style="
                    margin-top:12px;width:100%;padding:11px 20px;
                    background:transparent;border:1px solid rgba(148,163,184,0.14);
                    border-radius:10px;font-family:'Inter',sans-serif;
                    font-size:13.5px;color:#64748b;cursor:pointer;
                    transition:border-color 0.2s,color 0.2s;
                ">Dismiss</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    if (isFree) {
        document.getElementById("limitModalLogin").addEventListener("click", () => {
            modal.remove();
            window.location.href = "login.html?return=index.html";
        });
        document.getElementById("limitModalSignup").addEventListener("click", () => {
            modal.remove();
            window.location.href = "login.html?return=index.html";
        });
    } else {
        document.getElementById("limitModalGotIt").addEventListener("click", () => modal.remove());
    }
    document.getElementById("limitModalClose").addEventListener("click", () => modal.remove());
    document.getElementById("limitModalBackdrop").addEventListener("click", (e) => {
        if (e.target === document.getElementById("limitModalBackdrop")) modal.remove();
    });
}

analyzeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    // #3 — Request notification permission on first analysis
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
    uploadLog();
});

// Copy report to clipboard
document.getElementById("copyBtn").addEventListener("click", () => {
    const text = resultsContent.innerText;
    navigator.clipboard.writeText(text).then(() => {
        showToast("Report copied to clipboard!", "success");
    });
});

// Download report as markdown file
document.getElementById("downloadBtn").addEventListener("click", () => {
    const text = resultsContent.innerText;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "logai-report.md";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Report downloaded!", "success");
});

// #5 — New Analysis button (reset the whole UI)
document.getElementById("newAnalysisBtn").addEventListener("click", () => {
    fileInput.value = "";
    fileInfo.textContent = "No file selected";
    fileInfo.style.color = "";
    analyzeBtn.disabled = true;
    resultsContent.innerHTML = "";
    resultsContent.classList.add("hidden");
    emptyState.classList.remove("hidden");
    progressSection.classList.add("hidden");
    document.getElementById("statsSection").classList.add("hidden");
    document.getElementById("copyBtn").style.display = "none";
    document.getElementById("downloadBtn").style.display = "none";
    document.getElementById("newAnalysisBtn").style.display = "none";
    document.getElementById("filePreview").classList.remove("visible");
    resetProgress();
    showToast("Ready for a new analysis", "info");
});

// #14 — Mobile sidebar toggle
const sidebar     = document.querySelector(".sidebar");
const backdrop    = document.getElementById("sidebarBackdrop");
const hamburger   = document.getElementById("hamburgerBtn");

hamburger.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    backdrop.classList.toggle("open");
});
backdrop.addEventListener("click", () => {
    sidebar.classList.remove("open");
    backdrop.classList.remove("open");
});
// Close sidebar when a nav link is clicked (mobile)
sidebar.querySelectorAll("nav a").forEach(link => {
    link.addEventListener("click", () => {
        sidebar.classList.remove("open");
        backdrop.classList.remove("open");
    });
});