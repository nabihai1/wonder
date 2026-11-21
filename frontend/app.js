const openStoryBtn = document.getElementById("openStoryBtn");
const backBtn = document.getElementById("backBtn");
const settingsBtn = document.getElementById("settingsBtn");
const settingsOverlay = document.getElementById("settingsOverlay");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const themeBtns = document.querySelectorAll(".theme-btn");
const storyText = document.getElementById("storyText");
const storyDisplay = document.getElementById("story-display");

const biggerBtn = document.getElementById("biggerBtn");
const smallerBtn = document.getElementById("smallerBtn");

const mainBtn = document.getElementById("mainBtn");

// ---------- Page navigation ----------

let pages = [];
let currentPage = 0;

function splitStory(text) {
    const words = text.trim().split(/\s+/);
    pages = [];

    for (let i = 0; i < words.length; i += 4) {
        pages.push(words.slice(i, i + 4).join(" "));
    }
}

// index.html -> story.html
if (openStoryBtn) {
    openStoryBtn.addEventListener("click", () => {
        const story = document.getElementById("story-input").value;

        if (!story.trim()) {
            alert("Please enter a story first!");
            return;
        }

        sessionStorage.setItem("story", story);
        window.location.href = "story.html";
    });
}

// On story.html, show the saved story

if (mainBtn) {
    mainBtn.addEventListener("click", () => {
        window.speechSynthesis.cancel();
        window.location.href = "index.html";
    });
}

if (storyDisplay) {
    const story = sessionStorage.getItem("story") || "";

    splitStory(story);
    displayPage();
}

function displayPage() {
    if (!storyDisplay) return;

    storyDisplay.textContent = pages[currentPage] || "";

    const indicator = document.getElementById("page-indicator");

    if (indicator) {
        indicator.textContent =
            `Page ${currentPage + 1} of ${pages.length}`;
    }
}

function nextPage() {
    if (currentPage < pages.length - 1) {
        currentPage++;
        displayPage();
    }
}

function previousPage() {
    if (currentPage > 0) {
        currentPage--;
        displayPage();
    }
}

function readStory() {
    const text = pages[currentPage];

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

// ---------- Font size ----------

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
    if (storyDisplay) storyDisplay.style.fontSize = fontSize + "px";

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
