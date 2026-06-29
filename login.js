const SUPABASE_URL = "https://eqwsqthpdlwwgfxrjujg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qYwkc1f4o5MO9Mw91mUzoQ_94GS3iAx";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const loginEmailEl = document.getElementById("loginEmail");
const loginPasswordEl = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const loginBtnText = document.getElementById("loginBtnText");
const loginSpinner = document.getElementById("loginSpinner");
const signupBtn = document.getElementById("signupBtn");
const loginError = document.getElementById("loginError");
const loginSuccess = document.getElementById("loginSuccess");
const githubBtn = document.getElementById("githubBtn");

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

loginBtn.addEventListener("click", async () => {
    const email = loginEmailEl.value.trim();
    const password = loginPasswordEl.value;
    if (!email || !password) { showError("Please enter your email and password."); return; }

    setLoading(true);
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) { showError(error.message || "Login failed."); return; }

    const returnTo = new URLSearchParams(window.location.search).get("return") || "index.html";
    window.location.replace(returnTo);
});

signupBtn.addEventListener("click", async () => {
    const email = loginEmailEl.value.trim();
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

githubBtn.addEventListener("click", async () => {
    githubBtn.disabled = true;
    githubBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
        Redirecting to GitHub...
    `;

    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "github",
        options: {
            redirectTo: "https://logaiapp.netlify.app/index.html"
        }
    });

    if (error) {
        showError(error.message || "GitHub sign-in failed.");
        githubBtn.disabled = false;
        githubBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            Continue with GitHub
        `;
    }
});
