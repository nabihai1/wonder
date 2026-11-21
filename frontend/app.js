const makePagesBtn = document.getElementById("makePagesBtn");
const backBtn = document.getElementById("backBtn");

// index.html -> story.html
if (makePagesBtn) {
    makePagesBtn.addEventListener("click", () => {
        const story = document.getElementById("storyInput").value;
        sessionStorage.setItem("story", story); // save it for the next page
        window.location.href = "story.html";
    });
}

// story.html -> index.html
if (backBtn) {
    backBtn.addEventListener("click", () => {
        window.location.href = "index.html";
    });
}

// On story.html, show the saved story
const storyText = document.getElementById("storyText");
if (storyText) {
    storyText.textContent = sessionStorage.getItem("story") || "No story yet.";
}
const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");

function openStory() {
    const text = document.getElementById("story-input").value;

    if (!text.trim()) {
        alert("Please paste a story first!");
        return;
    }

    localStorage.setItem("story", text);

    window.location.href = "story.html";
}

const storyDisplay = document.getElementById("story-display");
    if (storyDisplay) {
        storyDisplay.textContent = localStorage.getItem("story") || "";
}

function readStory() {
    const text = localStorage.getItem("story");

    if (!text) return;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    window.speechSynthesis.speak(speech);
}

function stopReading() {
    window.speechSynthesis.cancel();
}

function goBack() {
    window.speechSynthesis.cancel();
    window.location.href = "index.html";
}