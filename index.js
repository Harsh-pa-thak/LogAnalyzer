const SUPABASE_URL = "https://eqwsqthpdlwwgfxrjujg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qYwkc1f4o5MO9Mw91mUzoQ_94GS3iAx";

// ── Anonymous identity (persisted across sessions) ──────────────────────────
let anonId = localStorage.getItem("anon_id");
if (!anonId) {
    anonId = crypto.randomUUID();
    localStorage.setItem("anon_id", anonId);
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
        guestChipEl.classList.remove("visible");   // #13 hide guest chip
    } else {
        // Anonymous state
        userEmailEl.textContent = "";
        userAvatarEl.style.display = "none";
        loginCtaEl.classList.add("visible");
        guestChipEl.classList.add("visible");      // #13 show guest chip
    }
}

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
        fileInfo.textContent = files[0].name;
        fileInput.files = files;
        analyzeBtn.disabled = false;
        fileInfo.style.color = "#3b82f6";
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
        info:    { bg: "rgba(59,130,246,0.15)",  border: "rgba(59,130,246,0.3)",  text: "#93c5fd" },
        success: { bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.3)",  text: "#6ee7b7" },
        error:   { bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.3)",   text: "#fca5a5" },
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
            // Stream each chunk result live into the results panel as it arrives
            const chunkHeader = document.createElement("div");
            chunkHeader.className = "chunk-header";
            chunkHeader.textContent = `Chunk ${data.chunk_index}/${data.total_chunks} Analysis`;

            const chunkBody = document.createElement("div");
            chunkBody.className = "chunk-body markdown-body";
            chunkBody.innerHTML = marked.parse(data.result);

            resultsContent.appendChild(chunkHeader);
            resultsContent.appendChild(chunkBody);
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
    const body = isFree
        ? "You've used your <strong>3 free analyses</strong> for today.<br>Login to get 20 analyses per day."
        : "You've used your <strong>20 daily analyses</strong>.<br>Your limit resets at midnight UTC.";

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
    uploadLog();
});

// Copy report to clipboard
document.getElementById("copyBtn").addEventListener("click", () => {
    const text = resultsContent.innerText;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById("copyBtn");
        btn.title = "Copied!";
        setTimeout(() => { btn.title = "Copy report"; }, 2000);
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
});


// Sidebar — Dashboard link is now a plain <a> in HTML; no JS needed for nav.