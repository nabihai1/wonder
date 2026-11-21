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

const catBtn = document.getElementById("catBtn");

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
    storyText.textContent = sessionStorage.getItem("story") || "No story yet.";
}

if (storyDisplay) {
    storyDisplay.textContent = localStorage.getItem("story") || "";
}

// ---------- Reading + highlighting ----------
let wordSpans = [];
let wordStarts = [];
let highlightTimer = null;
let usingRealBoundaries = false;
let currentUtterance = null;

const MS_PER_CHAR = 70;   // raise if highlight runs ahead of the voice, lower if it lags

// Wrap each word of the text in a <span>, keeping the original spacing
function renderWords(text) {
    storyText.textContent = "";
    wordSpans = [];
    wordStarts = [];

    let lastEnd = 0;
    for (const match of text.matchAll(/\S+/g)) {
        if (match.index > lastEnd) {
            storyText.appendChild(
                document.createTextNode(text.slice(lastEnd, match.index))
            );
        }
        const span = document.createElement("span");
        span.className = "word";
        span.textContent = match[0];
        storyText.appendChild(span);

        wordSpans.push(span);
        wordStarts.push(match.index);
        lastEnd = match.index + match[0].length;
    }
}

function clearHighlight() {
    wordSpans.forEach((span) => span.classList.remove("highlight"));
}

function highlightWordAt(charIndex) {
    let current = 0;
    for (let i = 0; i < wordStarts.length; i++) {
        if (wordStarts[i] <= charIndex) current = i;
        else break;
    }
    clearHighlight();
    if (wordSpans[current]) wordSpans[current].classList.add("highlight");
}

// Estimate which word is being spoken, using word length for timing
function startEstimatedHighlight(rate) {
    let i = 0;

    function step() {
        if (usingRealBoundaries || i >= wordSpans.length) return;

        clearHighlight();
        wordSpans[i].classList.add("highlight");

        const word = wordSpans[i].textContent;
        let ms = ((word.length + 1) * MS_PER_CHAR) / rate;
        if (/[.!?]$/.test(word)) ms += 350;
        else if (/[,;:]$/.test(word)) ms += 150;

        i++;
        highlightTimer = setTimeout(step, ms);
    }

    step();
}

function stopReading() {
    currentUtterance = null;
    clearTimeout(highlightTimer);
    usingRealBoundaries = false;
    window.speechSynthesis.cancel();
    clearHighlight();
}

// ---------- Cheshire Cat voice ----------
const CAT_VOICE_NAME = "Google UK English Male";
let catVoice = null;

function loadCatVoice() {
    const voices = window.speechSynthesis.getVoices();
    catVoice =
        voices.find((v) => v.name === CAT_VOICE_NAME) ||
        voices.find((v) => v.lang === "en-GB") ||
        null;
}

loadCatVoice();
window.speechSynthesis.addEventListener("voiceschanged", loadCatVoice);

function readStory() {
    if (!storyText) return;
    stopReading();

    const text = storyText.textContent.trim();
    if (!text) return;

    renderWords(text);

    const speech = new SpeechSynthesisUtterance(text);
    currentUtterance = speech;

    if (catVoice) speech.voice = catVoice;
    speech.pitch = 1.3;
    speech.rate = 0.95;

    // Start the estimated highlight when the voice actually begins
    speech.onstart = () => {
        if (currentUtterance !== speech) return;
        startEstimatedHighlight(speech.rate);
    };

    // If the voice does send real word events, switch to those
    speech.onboundary = (e) => {
        if (currentUtterance !== speech) return;
        if (e.name && e.name !== "word") return;
        usingRealBoundaries = true;
        clearTimeout(highlightTimer);
        highlightWordAt(e.charIndex);
    };

    speech.onend = () => {
        if (currentUtterance !== speech) return;
        clearTimeout(highlightTimer);
        clearHighlight();
    };

    window.speechSynthesis.speak(speech);
}

if (catBtn) {
    catBtn.addEventListener("click", () => {
        if (window.speechSynthesis.speaking) {
            stopReading();   // click again to stop
        } else {
            readStory();
        }
    });
}

// Stop talking if the person leaves the page
window.addEventListener("beforeunload", () => window.speechSynthesis.cancel());

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

function showPage() {
    stopReading();
    renderPageText(pages[currentPage]);
    pageIndicator.textContent = `Page ${currentPage + 1} of ${pages.length}`;
    backBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage === pages.length - 1;
}