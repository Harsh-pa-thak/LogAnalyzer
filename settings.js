/*
  LogAI — settings.js
  Theme switching logic + settings page interactivity
*/

// ── Theme definitions ────────────────────────────────────────────────────────
const THEMES = {
    dark: {
        name: "Dark",
        sub: "Midnight Navy",
        emoji: "",
        file: "themes/dark.css",
        swatch: "linear-gradient(135deg, #0f172a, #3b82f6)",
    },
    light: {
        name: "Light",
        sub: "Clean & Minimal",
        emoji: "",
        file: "themes/light.css",
        swatch: "linear-gradient(135deg, #f1f5f9, #2563eb)",
    },
    github: {
        name: "GitHub",
        sub: "Primer Dark",
        emoji: "",
        file: "themes/github.css",
        swatch: "linear-gradient(135deg, #0d1117, #3fb950)",
    },
    jetbrains: {
        name: "JetBrains",
        sub: "Darcula",
        emoji: "",
        file: "themes/jetbrains.css",
        swatch: "linear-gradient(135deg, #1e1f22, #cc7832)",
    },
};

const THEME_KEY = "logai_theme";

// ── Apply theme globally ──────────────────────────────────────────────────────
function applyTheme(themeId) {
    const theme = THEMES[themeId] || THEMES.dark;
    let link = document.getElementById("theme-css");
    if (!link) {
        link = document.createElement("link");
        link.id = "theme-css";
        link.rel = "stylesheet";
        document.head.appendChild(link);
    }
    link.href = theme.file;
    localStorage.setItem(THEME_KEY, themeId);
    document.documentElement.setAttribute("data-theme", themeId);
}

// ── Load saved theme on any page ─────────────────────────────────────────────
function loadSavedTheme() {
    const saved = localStorage.getItem(THEME_KEY) || "dark";
    applyTheme(saved);
}

// Call immediately (anti-FOUC)
loadSavedTheme();

// ── Settings page: build theme grid ──────────────────────────────────────────
function buildThemeGrid() {
    const grid = document.getElementById("themeGrid");
    if (!grid) return;

    const current = localStorage.getItem(THEME_KEY) || "dark";

    Object.entries(THEMES).forEach(([id, t]) => {
        const card = document.createElement("div");
        card.className = "theme-card" + (id === current ? " active" : "");
        card.setAttribute("data-theme-id", id);
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `Switch to ${t.name} theme`);

        card.innerHTML = `
            <div class="theme-card-swatch" style="background:${t.swatch};">${t.emoji}</div>
            <div>
                <div class="theme-card-label">${t.name}</div>
                <div class="theme-card-sub">${t.sub}</div>
            </div>
            <div class="theme-card-check" aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <polyline points="20 6 9 17 4 12" stroke="white" stroke-width="3"
                        stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
        `;

        card.addEventListener("click", () => {
            // Remove active from all
            grid.querySelectorAll(".theme-card").forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            applyTheme(id);
            showThemeToast(t.name);
        });

        grid.appendChild(card);
    });
}

// ── Toast feedback ────────────────────────────────────────────────────────────
function showThemeToast(name) {
    let toast = document.getElementById("themeToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "themeToast";
        toast.className = "theme-toast";
        document.body.appendChild(toast);
    }
    toast.textContent = `✓  Switched to ${name} theme`;
    toast.classList.add("visible");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("visible"), 2200);
}

// ── Settings page user info ───────────────────────────────────────────────────
async function loadSettingsUser() {
    const SUPABASE_URL = "https://eqwsqthpdlwwgfxrjujg.supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable_qYwkc1f4o5MO9Mw91mUzoQ_94GS3iAx";

    if (!window.supabase) return;

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true }
    });

    const { data } = await client.auth.getSession();

    const planBadge = document.getElementById("settingsPlan");
    const emailBadge = document.getElementById("settingsEmail");
    const limitBadge = document.getElementById("settingsLimit");

    if (data.session && data.session.user) {
        const email = data.session.user.email || "";
        if (emailBadge) emailBadge.textContent = email;
        if (planBadge) { planBadge.textContent = "Pro"; planBadge.className = "settings-badge-accent"; }
        if (limitBadge) limitBadge.textContent = "20 per day";
    } else {
        if (emailBadge) emailBadge.textContent = "Guest (not signed in)";
        if (planBadge) planBadge.textContent = "Free";
        if (limitBadge) limitBadge.textContent = "3 per day";
    }
}

// ── Init on DOMContentLoaded ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    buildThemeGrid();
    loadSettingsUser();
});
