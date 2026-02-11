
const fileInput = document.getElementById('logFile');
const fileInfo = document.getElementById('fileInfo');

fileInput.addEventListener('change', function () {
    if (fileInput.files.length > 0) {
        fileInfo.textContent = fileInput.files[0].name;
    } else {
        fileInfo.textContent = "No file selected";
    }
});

async function uploadLog() {
    const fileInput = document.getElementById("logFile");
    const file = fileInput.files[0];
    const analyzeBtn = document.getElementById("analyzeBtn");
    const loading = document.getElementById("loading");
    const resultsSection = document.getElementById("resultsSection");
    const resultDiv = document.getElementById("result");

    if (!file) {
        alert("Please select a log file first");
        return;
    }
    resultDiv.textContent = "";
    resultsSection.style.display = "none";
    analyzeBtn.disabled = true;
    loading.classList.add("active");
    const formData = new FormData();
    formData.append("file", file);
    try {
        const response = await fetch("/analyze", {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        resultDiv.textContent = data.analysis;
    } catch (error) {
        resultDiv.textContent = "Error: " + error.message;
    } finally {
        loading.classList.remove("active");
        analyzeBtn.disabled = false;
    }
    try {
        const response = await fetch("/analyze", {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        if (response.ok) {
            resultDiv.textContent = data.analysis;
            resultsSection.style.display = "block";
        } else {
            resultDiv.textContent = "Error: " + data.error;
            resultsSection.style.display = "block";
            resultDiv.className = "error";

        }
    } catch (error) {
        resultDiv.textContent = "Error: " + error.message;
        resultsSection.style.display = "block";
        resultDiv.className = "error";
    } finally {
        loading.classList.remove("active");
        analyzeBtn.disabled = false;
    }
}
document.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        uploadLog();
    }
});