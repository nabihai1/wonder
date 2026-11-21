const openStoryBtn = document.getElementById("openStoryBtn");
const mainBtn = document.getElementById("mainBtn");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const pageIndicator = document.getElementById("page-indicator");
const settingsBtn = document.getElementById("settingsBtn");
const settingsOverlay = document.getElementById("settingsOverlay");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const themeBtns = document.querySelectorAll(".theme-btn");
const storyText = document.getElementById("story-display");
const biggerBtn = document.getElementById("biggerBtn");
const smallerBtn = document.getElementById("smallerBtn");
const catBtn = document.getElementById("catBtn");

// ---------- Reading + highlighting ----------
let wordSpans = [];
let wordStarts = [];
let highlightTimer = null;
let usingRealBoundaries = false;
let currentUtterance = null;

const MS_PER_CHAR = 70;   // raise if highlight runs ahead of the voice, lower if it lags

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

    speech.onstart = () => {
        if (currentUtterance !== speech) return;
        startEstimatedHighlight(speech.rate);
    };

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
            stopReading();
        } else {
            readStory();
        }
    });
}

window.addEventListener("beforeunload", () => window.speechSynthesis.cancel());

// ---------- Page navigation ----------

// index.html -> story.html
if (openStoryBtn) {
    openStoryBtn.addEventListener("click", () => {
        const story = document.getElementById("story-input").value;
        // save in both places so every version of the story page can find it
        try {
            localStorage.setItem("story", story);
            sessionStorage.setItem("story", story);
        } catch (e) {}
        window.location.href = "story.html";
    });
}

// story.html -> index.html
if (mainBtn) {
    mainBtn.addEventListener("click", () => {
        stopReading();
        window.location.href = "index.html";
    });
}

// ---------- Pagination: 4 words per page ----------
(function () {
    const WORDS_PER_PAGE = 4;

    const textEl = document.getElementById("story-display");
    const labelEl = document.getElementById("page-indicator");
    const prevEl = document.getElementById("backBtn");
    const nextEl = document.getElementById("nextBtn");

    if (!textEl) return; // not on story.html

    let saved = "";
    try {
        saved = localStorage.getItem("story") || sessionStorage.getItem("story") || "";
    } catch (e) {}

    const words = saved.trim().split(/\s+/).filter(Boolean);
    const pages = [];
    for (let i = 0; i < words.length; i += WORDS_PER_PAGE) {
        pages.push(words.slice(i, i + WORDS_PER_PAGE).join(" "));
    }
    if (pages.length === 0) pages.push("No story yet.");

    let current = 0;

    function render() {
        if (typeof stopReading === "function") stopReading(); // stop the Cat on page change
        textEl.textContent = pages[current];
        if (labelEl) labelEl.textContent = `Page ${current + 1} of ${pages.length}`;
        if (prevEl) prevEl.disabled = current === 0;
        if (nextEl) nextEl.disabled = current === pages.length - 1;
    }

    if (nextEl) nextEl.addEventListener("click", () => {
        if (current < pages.length - 1) { current++; render(); }
    });

    if (prevEl) prevEl.addEventListener("click", () => {
        if (current > 0) { current--; render(); }
    });

    // Let the Cat code read the current page
    window.getCurrentPageText = () => pages[current];

    render();
})();

// ---------- Settings popup ----------
function openSettings() {
    settingsOverlay.classList.remove("hidden");
}

function closeSettings() {
    settingsOverlay.classList.add("hidden");
}

if (settingsBtn) settingsBtn.addEventListener("click", openSettings);
if (closeSettingsBtn) closeSettingsBtn.addEventListener("click", closeSettings);

if (settingsOverlay) {
    settingsOverlay.addEventListener("click", (e) => {
        if (e.target === settingsOverlay) closeSettings();
    });
}

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

let savedTheme = "dark";
try {
    savedTheme = localStorage.getItem("theme") || "dark";
} catch (e) {}
setTheme(savedTheme);

themeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        setTheme(btn.dataset.theme);
        try {
            localStorage.setItem("theme", btn.dataset.theme);
        } catch (e) {}
    });
});

// ---------- Font size ----------
const MIN_SIZE = 12;
const MAX_SIZE = 48;
const STEP = 2;

let fontSize = 20;

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


