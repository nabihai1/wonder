const makePagesBtn = document.getElementById("makePagesBtn");
const backBtn = document.getElementById("backBtn");
const settingsBtn = document.getElementById("settingsBtn");
const settingsOverlay = document.getElementById("settingsOverlay");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const themeBtns = document.querySelectorAll(".theme-btn");

// ---------- Page navigation ----------

// index.html -> story.html
if (makePagesBtn) {
    makePagesBtn.addEventListener("click", () => {
        const story = document.getElementById("story-input").value;
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
// ---------- Settings popup ----------
function openSettings() {
    settingsOverlay.classList.remove("hidden");
}

function closeSettings() {
    settingsOverlay.classList.add("hidden");
}

if (settingsBtn) settingsBtn.addEventListener("click", openSettings);
if (closeSettingsBtn) closeSettingsBtn.addEventListener("click", closeSettings);

// Click the dark area outside the popup to close it
if (settingsOverlay) {
    settingsOverlay.addEventListener("click", (e) => {
        if (e.target === settingsOverlay) closeSettings();
    });
}

// Escape key closes it too
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && settingsOverlay) closeSettings();
});

// ---------- Theme ----------
function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    themeBtns.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.theme === theme);
    });
}

// Load the saved theme (defaults to dark)
let savedTheme = "dark";
try {
    savedTheme = localStorage.getItem("theme") || "dark";
} catch (e) {}
setTheme(savedTheme);

// Switch theme when a button is clicked
themeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        setTheme(btn.dataset.theme);
        try {
            localStorage.setItem("theme", btn.dataset.theme);
        } catch (e) {}
    });
});
