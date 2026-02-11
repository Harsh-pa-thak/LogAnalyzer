
const fileInput = document.getElementById('logFile');
const fileInfo = document.getElementById('fileInfo');

fileInput.addEventListener('change', function () {
    if (fileInput.files.length > 0) {
        fileInfo.textContent = fileInput.files[0].name;
    } else {
        fileInfo.textContent = "No file selected";
    }
});
