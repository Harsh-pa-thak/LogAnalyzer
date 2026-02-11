const fileInput = document.getElementById("logFile");
const fileInfo = document.getElementById("fileInfo");
const chooseBtn = document.getElementById("chooseBtn");
const analyzeBtn = document.getElementById("analyzeBtn");
const resultsDiv = document.getElementById("results");

chooseBtn.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
        fileInfo.textContent = fileInput.files[0].name;
    } else {
        fileInfo.textContent = "No file selected";
    }
});

async function uploadLog() {
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a log file first.");
        return;
    }

    analyzeBtn.disabled = true;
    resultsDiv.textContent = "Analyzing...";

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("/analyze", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            resultsDiv.textContent = data.analysis;
        } else {
            resultsDiv.textContent = "Error: " + data.error;
        }
    } catch (error) {
        resultsDiv.textContent = "Error: " + error.message;
    } finally {
        analyzeBtn.disabled = false;
    }
}

analyzeBtn.addEventListener("click", uploadLog);

document.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        uploadLog();
    }
});
