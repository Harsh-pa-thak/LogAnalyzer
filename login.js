const SUPABASE_URL     = "https://eqwsqthpdlwwgfxrjujg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qYwkc1f4o5MO9Mw91mUzoQ_94GS3iAx";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const loginEmailEl    = document.getElementById("loginEmail");
const loginPasswordEl = document.getElementById("loginPassword");
const loginBtn        = document.getElementById("loginBtn");
const loginBtnText    = document.getElementById("loginBtnText");
const loginSpinner    = document.getElementById("loginSpinner");
const signupBtn       = document.getElementById("signupBtn");
const loginError      = document.getElementById("loginError");
const loginSuccess    = document.getElementById("loginSuccess");

// If user is already logged in, skip this page → go straight to dashboard
window.addEventListener("DOMContentLoaded", async () => {
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) {
        window.location.replace("index.html");
    }
});

function setLoading(on) {
    loginBtn.disabled = signupBtn.disabled = on;
    loginBtnText.textContent = on ? "Signing in..." : "Sign In";
    loginSpinner.classList.toggle("visible", on);
}

function showError(msg) {
    loginError.textContent = msg;
    loginError.className = "lc-alert error visible";
    loginSuccess.classList.remove("visible");
}

function showSuccess(msg) {
    loginSuccess.textContent = msg;
    loginSuccess.className = "lc-alert success visible";
    loginError.classList.remove("visible");
}

// ── Sign In ──────────────────────────────────────────────────────────────────
loginBtn.addEventListener("click", async () => {
    const email    = loginEmailEl.value.trim();
    const password = loginPasswordEl.value;
    if (!email || !password) { showError("Please enter your email and password."); return; }

    setLoading(true);
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) { showError(error.message || "Login failed."); return; }

    // Honor ?return= param so limit modal can send user back after login
    const returnTo = new URLSearchParams(window.location.search).get("return") || "index.html";
    window.location.replace(returnTo);
});

// ── Sign Up ──────────────────────────────────────────────────────────────────
signupBtn.addEventListener("click", async () => {
    const email    = loginEmailEl.value.trim();
    const password = loginPasswordEl.value;
    if (!email || !password) { showError("Please enter an email and password."); return; }

    signupBtn.disabled = true;
    signupBtn.textContent = "Creating account...";

    const { error } = await supabaseClient.auth.signUp({ email, password });

    signupBtn.disabled = false;
    signupBtn.textContent = "Create Account";

    if (error) { showError(error.message || "Sign up failed."); return; }
    showSuccess("Account created! Check your email to confirm, then sign in.");
});
