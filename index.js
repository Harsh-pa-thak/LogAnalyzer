const fileInput = document.getElementById("logFile");
const fileInfo = document.getElementById("fileInfo");
const analyzeBtn = document.getElementById("analyzeBtn");
const emptyState = document.getElementById("emptyState");
const resultsContent = document.getElementById("resultsContent");
const dropZone = document.getElementById("dropZone");
const appLoader = document.getElementById("appLoader");
const btnText = analyzeBtn.querySelector(".btn-text");
const spinner = analyzeBtn.querySelector(".spinner");

// Progress elements
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
    dropZone.addEventListener(eventName, highlightDrop, false);
});

["dragleave", "drop"].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlightDrop, false);
});

function highlightDrop() {
    dropZone.classList.add("drag-over");
}

function unhighlightDrop() {
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
        fileInput.files = files;
        analyzeBtn.disabled = false;
        fileInfo.style.color = "#3b82f6";
    }
}

// Progress helpers
function setStage(stage) {
    [stagePreprocess, stageAnalyze, stageSynthesize].forEach(el => {
        el.classList.remove("active", "complete");
    });
    if (stage === "preprocess") {
        stagePreprocess.classList.add("active");
    } else if (stage === "analyze") {
        stagePreprocess.classList.add("complete");
        stageAnalyze.classList.add("active");
    } else if (stage === "synthesize") {
        stagePreprocess.classList.add("complete");
        stageAnalyze.classList.add("complete");
        stageSynthesize.classList.add("active");
    } else if (stage === "complete") {
        stagePreprocess.classList.add("complete");
        stageAnalyze.classList.add("complete");
        stageSynthesize.classList.add("complete");
    }
}

function updateStats(stats) {
    if (stats.total_lines !== undefined) statLines.textContent = stats.total_lines.toLocaleString();
    if (stats.critical !== undefined) statCritical.textContent = stats.critical.toLocaleString();
    if (stats.errors !== undefined) statErrors.textContent = stats.errors.toLocaleString();
    if (stats.warnings !== undefined) statWarnings.textContent = stats.warnings.toLocaleString();
}

function resetProgress() {
    progressBar.style.width = "0%";
    progressMessage.textContent = "Preparing...";
    setStage("");
    statLines.textContent = "—";
    statCritical.textContent = "—";
    statErrors.textContent = "—";
    statWarnings.textContent = "—";
}

// SSE Streaming Analysis
async function uploadLog() {
    const file = fileInput.files[0];
    if (!file) return;

    setLoading(true);
    resetProgress();

    // Show progress, hide empty state
    progressSection.classList.remove("hidden");
    emptyState.classList.add("hidden");
    resultsContent.innerHTML = "";
    resultsContent.classList.remove("hidden");

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("http://localhost:8000/analyze-stream", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Server error");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop(); // Keep incomplete line in buffer

            for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                try {
                    const data = JSON.parse(line.slice(6));
                    handleSSEEvent(data);
                } catch (e) {
                    // Skip malformed SSE lines
                }
            }
        }
    } catch (error) {
        resultsContent.innerHTML = `<div style="color: #ef4444; padding: 20px; text-align: center;">
            <h3>Error</h3>
            <p>${error.message}</p>
        </div>`;
    } finally {
        setLoading(false);
    }
}

function handleSSEEvent(data) {
    switch (data.stage) {
        case "preprocessing":
            setStage("preprocess");
            progressBar.style.width = "10%";
            progressMessage.textContent = data.message;
            break;

        case "preprocessed":
            progressBar.style.width = "20%";
            progressMessage.textContent = data.message;
            if (data.stats) updateStats(data.stats);
            break;

        case "chunking":
            progressBar.style.width = "25%";
            progressMessage.textContent = data.message;
            break;

        case "analyzing":
            setStage("analyze");
            const analyzeProgress = 25 + (data.chunk_index / data.total_chunks) * 50;
            progressBar.style.width = analyzeProgress + "%";
            progressMessage.textContent = data.message;
            btnText.textContent = `Analyzing ${data.chunk_index}/${data.total_chunks}...`;
            break;

        case "chunk_done":
            // Show chunk result incrementally
            const chunkHtml = marked.parse(data.result);
            resultsContent.innerHTML += `<div class="chunk-result">
                <h4 style="color: var(--primary); margin-bottom: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
                    Chunk ${data.chunk_index}/${data.total_chunks} Analysis
                </h4>
                ${chunkHtml}
                <hr style="border-color: var(--border-color); margin: 16px 0;">
            </div>`;
            break;

        case "synthesizing":
            setStage("synthesize");
            progressBar.style.width = "80%";
            progressMessage.textContent = data.message;
            btnText.textContent = "Synthesizing...";
            break;

        case "complete":
            setStage("complete");
            progressBar.style.width = "100%";
            progressMessage.textContent = "Analysis complete!";
            // Replace chunk results with final synthesis
            const finalHtml = marked.parse(data.result);
            resultsContent.innerHTML = finalHtml;
            if (data.stats) updateStats(data.stats);
            break;
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
    e.stopPropagation();
    uploadLog();
});
