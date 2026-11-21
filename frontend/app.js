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

// index.html -> story.html
if (openStoryBtn) {
    openStoryBtn.addEventListener("click", () => {
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

if (storyText) {
    storyText.textContent = localStorage.getItem("story") || "No story yet.";
}

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

//------------------file upload-----------------------------------
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");

if (uploadBtn) {
    uploadBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        if (!file) return;
        localStorage.setItem("story", await file.text());
        window.location.href = "story.html";
    });
}

//-------------------------ascii art--------------------------

const artBtn = document.getElementById("artBtn");
const asciiArt = document.getElementById("asciiArt");

async function makeAsciiArt(text) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "x-api-key": API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
            "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
            model: "claude-sonnet-5-5",
            max_tokens: 1024,
            messages: [{
                role: "user",
                content: "Draw a kid-friendly ASCII art picture of the main scene in this story. " +
                         "Keep it under 30 lines and 60 characters wide. " +
                         "Reply with ONLY the ASCII art, no explanation.\n\n" + text
            }]
        })
    });
    const data = await res.json();
    return data.content[0].text;
}

function catFrame(i) {
    const paint = ["~", "~*", "~*~", "~*~*"][i % 4];
    const dots = ".".repeat(i % 4);
    return " /\\_/\\\n" +
           "( ^‿^ )__/ " + paint + "\n" +
           "  > ^ <\n\n" +
           "The Cheshire Cat is drawing" + dots;
}

if (artBtn) {
    artBtn.addEventListener("click", async () => {
        let i = 0;
        asciiArt.textContent = catFrame(i);
        const loading = setInterval(() => {
            i++;
            asciiArt.textContent = catFrame(i);
        }, 300);

        try {
            const art = await makeAsciiArt(localStorage.getItem("story"));
            clearInterval(loading);
            asciiArt.textContent = art;
        } catch (e) {
            clearInterval(loading);
            asciiArt.textContent = "Couldn't draw the scene.";
            console.error(e);
        }
    });
}

