const fileInput = document.getElementById("logFile");
const fileInfo = document.getElementById("fileInfo");
const analyzeBtn = document.getElementById("analyzeBtn");
const emptyState = document.getElementById("emptyState");
const resultsContent = document.getElementById("resultsContent");
const dropZone = document.getElementById("dropZone");
const appLoader = document.getElementById("appLoader");
const btnText = analyzeBtn.querySelector(".btn-text");
const spinner = analyzeBtn.querySelector(".spinner");

window.addEventListener("DOMContentLoaded", () => {
    marked.setOptions({
        highlight: function (code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
        }
    });

    setTimeout(() => {
        appLoader.style.opacity = "0";
        setTimeout(() => {
            appLoader.style.display = "none";
        }, 500);
    }, 800);
});

// Drag & Drop
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
    dropZone.addEventListener(eventName, highlight, false);
});

["dragleave", "drop"].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dropZone.classList.add("drag-over");
}

function unhighlight() {
    dropZone.classList.remove("drag-over");
}

dropZone.addEventListener("drop", handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

fileInput.addEventListener("change", () => {
    handleFiles(fileInput.files);
});

function handleFiles(files) {
    if (files.length > 0) {
        fileInfo.textContent = files[0].name;
        fileInput.files = files; // Sync if dropped
        analyzeBtn.disabled = false;
        fileInfo.style.color = "#3b82f6";
    }
}

// Analysis Logic
async function uploadLog() {
    const file = fileInput.files[0];
    if (!file) return;

    setLoading(true);

    // Clear previous results
    emptyState.classList.add("hidden");
    resultsContent.innerHTML = "";
    resultsContent.classList.remove("hidden");

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch('http://localhost:8000/analyze', {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            // Render Markdown
            const htmlContent = marked.parse(data.analysis);
            resultsContent.innerHTML = htmlContent;
        } else {
            resultsContent.innerHTML = `<div style="color: #ef4444; padding: 20px; text-align: center;">
                <h3>Error Encountered</h3>
                <p>${data.error}</p>
            </div>`;
        }
    } catch (error) {
        resultsContent.innerHTML = `<div style="color: #ef4444; padding: 20px; text-align: center;">
            <h3>Connection Error</h3>
            <p>${error.message}</p>
        </div>`;
    } finally {
        setLoading(false);
    }
}

function setLoading(isLoading) {
    analyzeBtn.disabled = isLoading;
    if (isLoading) {
        btnText.textContent = "Processing...";
        spinner.style.display = "block";
    } else {
        btnText.textContent = "Start Analysis";
        spinner.style.display = "none";
    }
}

analyzeBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent dropzone click
    uploadLog();
});

