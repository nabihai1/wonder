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
if (mainBtn) {
    mainBtn.addEventListener("click", () => {
        window.location.href = "index.html";
    });
}

// On story.html, show the saved story
const storyText = document.getElementById("storyText");
if (storyText) {
    storyText.textContent = sessionStorage.getItem("story") || "No story yet.";
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

// ---------- Font size ----------
const biggerBtn = document.getElementById("biggerBtn");
const smallerBtn = document.getElementById("smallerBtn");

const MIN_SIZE = 12;  // px
const MAX_SIZE = 48;  // px
const STEP = 2;       // px per click

let fontSize = 20;    // default size in px (matches 1.25rem)

// Load the saved size, if there is one
try {
    const savedSize = parseInt(localStorage.getItem("fontSize"), 10);
    if (savedSize) fontSize = savedSize;
} catch (e) {}

function applyFontSize() {
    if (storyText) storyText.style.fontSize = fontSize + "px";
    try {
        localStorage.setItem("fontSize", fontSize);
    } catch (e) {}
}

applyFontSize();

if (biggerBtn) {
    biggerBtn.addEventListener("click", () => {
        fontSize = Math.min(fontSize + STEP, MAX_SIZE);
        applyFontSize();
    });
}

if (smallerBtn) {
    smallerBtn.addEventListener("click", () => {
        fontSize = Math.max(fontSize - STEP, MIN_SIZE);
        applyFontSize();
    });
}