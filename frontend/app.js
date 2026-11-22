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
const storyInput = document.getElementById("story-input");

// ---------- Story id + rewards ----------
function getStoryId() {
    const text = localStorage.getItem("story") || "";
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = (hash * 31 + text.charCodeAt(i)) | 0;
    }
    return String(hash);
}

// Returns true only the first time a reward is earned for this story
function awardCookies(reason, amount) {
    const flag = `reward_${reason}_${getStoryId()}`;
    if (localStorage.getItem(flag)) return false;
    localStorage.setItem(flag, "1");
    const total = parseInt(localStorage.getItem("cookies"), 10) || 0;
    localStorage.setItem("cookies", String(total + amount));
    return true;
}

const rewardsOverlay = document.getElementById("rewardsOverlay");
const closeRewardBtn = document.getElementById("closeRewardBtn");

function showReward(title, message) {
    if (!rewardsOverlay) return;
    document.getElementById("rewardTitle").textContent = title;
    document.getElementById("rewardMessage").textContent = message;
    rewardsOverlay.classList.remove("hidden");
}

if (closeRewardBtn) {
    closeRewardBtn.addEventListener("click", () => {
        rewardsOverlay.classList.add("hidden");
    });
}

// Load previously entered text
if (storyInput) {
    storyInput.value = localStorage.getItem("savedStory") || "";

    // Save text whenever the user types
    storyInput.addEventListener("input", () => {
        localStorage.setItem("savedStory", storyInput.value);
    });
}

// ---------- Reading + highlighting ----------
let wordSpans = [];
let wordStarts = [];
let highlightTimer = null;
let usingRealBoundaries = false;
let currentUtterance = null;

const MS_PER_CHAR = 70;   // raise if highlight runs ahead of the voice, lower if it lags

// ---------- Picture words ----------
const PICTURE_WORDS = {
    // animals
    cat: "🐱", kitten: "🐱", dog: "🐶", puppy: "🐶", rabbit: "🐰", bunny: "🐰",
    mouse: "🐭", rat: "🐀", bird: "🐦", duck: "🦆", owl: "🦉", chicken: "🐔",
    hen: "🐔", pig: "🐷", cow: "🐮", horse: "🐴", sheep: "🐑", goat: "🐐",
    fish: "🐟", frog: "🐸", turtle: "🐢", snake: "🐍", lizard: "🦎",
    caterpillar: "🐛", butterfly: "🦋", bee: "🐝", ant: "🐜", spider: "🕷️",
    snail: "🐌", bear: "🐻", lion: "🦁", tiger: "🐯", monkey: "🐵",
    elephant: "🐘", giraffe: "🦒", zebra: "🦓", fox: "🦊", wolf: "🐺",
    deer: "🦌", squirrel: "🐿️", hedgehog: "🦔", bat: "🦇", penguin: "🐧",
    whale: "🐳", dolphin: "🐬", octopus: "🐙", crab: "🦀", shark: "🦈",
    dragon: "🐉", unicorn: "🦄", dinosaur: "🦕", flamingo: "🦩", parrot: "🦜",
    dodo: "🦤", lobster: "🦞", oyster: "🦪", pigeon: "🐦", eagle: "🦅",

    // people
    girl: "👧", boy: "👦", baby: "👶", man: "👨", woman: "👩",
    mom: "👩", mother: "👩", dad: "👨", father: "👨", grandma: "👵",
    grandpa: "👴", friend: "🧑‍🤝‍🧑", king: "🤴", queen: "👑", prince: "🤴",
    princess: "👸", knight: "🛡️", fairy: "🧚", wizard: "🧙", witch: "🧙‍♀️",
    teacher: "🧑‍🏫", doctor: "🧑‍⚕️", soldier: "💂", ghost: "👻",
    robot: "🤖", alien: "👽", giant: "🧌",

    // food and drink
    tea: "🍵", teapot: "🫖", cup: "☕", coffee: "☕", milk: "🥛",
    water: "💧", juice: "🧃", cake: "🍰", cookie: "🍪", candy: "🍬",
    chocolate: "🍫", bread: "🍞", butter: "🧈", cheese: "🧀", egg: "🥚",
    apple: "🍎", banana: "🍌", orange: "🍊", lemon: "🍋", grape: "🍇",
    strawberry: "🍓", cherry: "🍒", peach: "🍑", pear: "🍐", watermelon: "🍉",
    carrot: "🥕", corn: "🌽", potato: "🥔", tomato: "🍅", mushroom: "🍄",
    pizza: "🍕", sandwich: "🥪", soup: "🍲", pie: "🥧", tart: "🥧",
    honey: "🍯", jam: "🍓", icecream: "🍦", donut: "🍩", popcorn: "🍿",
    salt: "🧂", pepper: "🌶️", food: "🍽️", dinner: "🍽️", lunch: "🥪",
    breakfast: "🥞",

    // nature
    tree: "🌳", flower: "🌸", rose: "🌹", tulip: "🌷", sunflower: "🌻",
    leaf: "🍃", leaves: "🍂", grass: "🌱", garden: "🏡", forest: "🌲",
    mountain: "⛰️", hill: "⛰️", river: "🏞️", lake: "🏞️", ocean: "🌊",
    sea: "🌊", wave: "🌊", beach: "🏖️", island: "🏝️", rock: "🪨",
    sun: "☀️", moon: "🌙", star: "⭐", sky: "🌤️", cloud: "☁️",
    rain: "🌧️", snow: "❄️", wind: "💨", storm: "⛈️", rainbow: "🌈",
    fire: "🔥", ice: "🧊", night: "🌙", day: "☀️", hole: "🕳️",

    // home and things
    house: "🏠", home: "🏠", castle: "🏰", school: "🏫", door: "🚪",
    window: "🪟", key: "🔑", lock: "🔒", bed: "🛏️", chair: "🪑",
    table: "🍽️", bottle: "🍾", box: "📦", gift: "🎁", present: "🎁",
    book: "📖", letter: "✉️", pen: "🖊️", pencil: "✏️", paper: "📄",
    map: "🗺️", clock: "⏰", watch: "⌚", time: "⏰", bell: "🔔",
    lamp: "💡", candle: "🕯️", mirror: "🪞", umbrella: "☂️", bag: "👜",
    hat: "🎩", crown: "👑", shoe: "👟", dress: "👗", shirt: "👕",
    glasses: "👓", ring: "💍", phone: "📱", computer: "💻", tv: "📺",
    ball: "⚽", toy: "🧸", teddy: "🧸", kite: "🪁", balloon: "🎈",
    drum: "🥁", guitar: "🎸", music: "🎵", song: "🎵", piano: "🎹",
    sword: "🗡️", shield: "🛡️", treasure: "💰", money: "💰", coin: "🪙",
    card: "🃏", cards: "🃏", flag: "🚩", tent: "⛺", magic: "✨",
    potion: "🧪", wand: "🪄", fan: "🪭", glove: "🧤", gloves: "🧤",

    // getting around
    car: "🚗", bus: "🚌", train: "🚂", boat: "⛵", ship: "🚢",
    plane: "✈️", bike: "🚲", rocket: "🚀", road: "🛣️", bridge: "🌉",

    // feelings and body
    heart: "❤️", love: "❤️", happy: "😊", sad: "😢", angry: "😠",
    scared: "😨", surprised: "😮", tired: "😴", sleep: "😴", smile: "😊",
    grin: "😁", laugh: "😂", cry: "😢", eye: "👁️", eyes: "👀",
    hand: "✋", foot: "🦶", ear: "👂", nose: "👃", mouth: "👄",
    tooth: "🦷", head: "🙂",

    // Wonderland
    wonderland: "✨", alice: "👧", rabbit: "🐰", hatter: "🎩",
    caterpillar: "🐛", spade: "♠️", club: "♣️", diamond: "♦️", party: "🎉",
    birthday: "🎂", dream: "💭", game: "🎲", croquet: "🏑"
};

// Builds one word: colors b/d/p/q and puts an emoji above picture words
function buildWord(word) {
    const span = document.createElement("span");
    span.className = "word";

    const letters = document.createElement("span");
    for (const ch of word) {
        if (/[bdpq]/i.test(ch)) {
            const l = document.createElement("span");
            l.className = "letter-" + ch.toLowerCase();
            l.textContent = ch;
            letters.appendChild(l);
        } else {
            letters.appendChild(document.createTextNode(ch));
        }
    }

    const key = word.toLowerCase().replace(/[^a-z]/g, "");
    const emoji =
        PICTURE_WORDS[key] ||
        PICTURE_WORDS[key.replace(/ies$/, "y")] ||   // bunnies -> bunny
        PICTURE_WORDS[key.replace(/es$/, "")] ||     // boxes -> box
        PICTURE_WORDS[key.replace(/s$/, "")];        // cats -> cat
    if (emoji) {
        const ruby = document.createElement("ruby");
        const rt = document.createElement("rt");
        rt.textContent = emoji;
        ruby.appendChild(letters);
        ruby.appendChild(rt);
        span.appendChild(ruby);
    } else {
        span.appendChild(letters);
    }
    return span;
}

function renderWords(text) {
    storyText.textContent = "";
    wordSpans = [];
    wordStarts = [];

    let lastEnd = 0;

    for (const match of text.matchAll(/\S+/g)) {
        if (match.index > lastEnd) {
            storyText.appendChild(
                document.createTextNode(
                    text.slice(lastEnd, match.index)
                )
            );
        }

        const span = document.createElement("span");
        span.className = "word";
        span.textContent = match[0];

        // Click an individual word to hear it
        span.addEventListener("click", () => {
            stopReading();

            span.classList.add("highlight");

            const speech = new SpeechSynthesisUtterance(
                span.textContent
            );

            if (catVoice) speech.voice = catVoice;

            speech.pitch = 1.3;
            speech.rate = 0.95;

            currentUtterance = speech;

            speech.onend = () => {
                if (currentUtterance === speech) {
                    currentUtterance = null;
                    clearHighlight();
                }
            };

            window.speechSynthesis.speak(speech);
        });

        const span = buildWord(match[0]);
        storyText.appendChild(span);

        wordSpans.push(span);
        wordStarts.push(match.index);

        lastEnd = match.index + match[0].length;
    }

    if (lastEnd < text.length) {
        storyText.appendChild(
            document.createTextNode(text.slice(lastEnd))
        );
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

// ---------- Reading speed ----------
const speedBtns = document.querySelectorAll(".speed-btn");
let readingRate = 0.95;

try {
    const savedRate = parseFloat(localStorage.getItem("readingRate"));
    if (savedRate) readingRate = savedRate;
} catch (e) {}

function setSpeed(rate) {
    readingRate = rate;
    speedBtns.forEach((btn) => {
        btn.classList.toggle("active", parseFloat(btn.dataset.rate) === rate);
    });
    try {
        localStorage.setItem("readingRate", rate);
    } catch (e) {}
}

setSpeed(readingRate);

speedBtns.forEach((btn) => {
    btn.addEventListener("click", () => setSpeed(parseFloat(btn.dataset.rate)));
});

function readStory() {
    if (!storyText) return;
    stopReading();

    const text = window.getCurrentPageText
        ? window.getCurrentPageText()
        : storyText.textContent.trim();
    const text = (window.getCurrentPageText ? window.getCurrentPageText() : storyText.textContent).trim();
    if (!text) return;

    const speech = new SpeechSynthesisUtterance(text);
    currentUtterance = speech;

    if (catVoice) speech.voice = catVoice;
    speech.pitch = 1.3;
    speech.rate = readingRate;

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

        if (!story.trim()) {
            alert("Please enter a story first!");
            return;
        }

        try {
            localStorage.setItem("story", story);
            sessionStorage.setItem("story", story);

            awardCookies("booked", 1);
        } catch (error) {
            console.error("Could not save story:", error);
        }

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

    //let current = 0;
    const storyId = getStoryId();

    const savedPage = Number(
    localStorage.getItem("savedPage_" + storyId)
    );

    let current = Number.isInteger(savedPage)
    ? Math.max(0, Math.min(savedPage, pages.length - 1))
    : 0;


    function render() {
        if (typeof stopReading === "function") stopReading(); // stop the Cat on page change
        renderWords(pages[current]);
        if (labelEl) labelEl.textContent = `Page ${current + 1} of ${pages.length}`;
        if (prevEl) prevEl.disabled = current === 0;
        if (nextEl) nextEl.disabled = current === pages.length - 1;
    stopReading();

    renderWords(pages[current]);

    if (labelEl) {
        labelEl.textContent =
            `Page ${current + 1} of ${pages.length}`;
    }

    if (prevEl) {
        prevEl.disabled = current === 0;
    }

    if (nextEl) {
        nextEl.disabled = current === pages.length - 1;
    }

    const finishBtn = document.getElementById("finishStoryBtn");

    if (finishBtn) {
        finishBtn.style.display =
            current === pages.length - 1 && saved.trim()
                ? "inline-block"
                : "none";
    }
}


    if (nextEl) nextEl.addEventListener("click", () => {
        if (current < pages.length - 1) { current++; render(); }
    });

    if (prevEl) prevEl.addEventListener("click", () => {
        if (current > 0) { current--; render(); }
    });

    // // Let the Cat code read the current page
    // window.getCurrentPageText = () => pages[current];

    // render();

    window.getCurrentPageText = () => pages[current];

// ---------- Finish Story ----------
const finishBtn = document.getElementById("finishStoryBtn");

if (finishBtn) {
    finishBtn.addEventListener("click", () => {
        if (current !== pages.length - 1 || !saved.trim()) {
            return;
        }

        const earned = awardCookies("completed", 5);

        if (earned) {
            showReward(
                "🎉 Congratulations!",
                "You finished your story and earned 5 cookies! 🍪"
            );
        } else {
            showReward(
                "Amazing Reader! 📖",
                "You've already earned your completion reward!"
            );
        }
    });
}

// ---------- Save and Leave ----------
const saveBtn = document.getElementById("saveStoryBtn");

if (saveBtn) {
    saveBtn.addEventListener("click", () => {
        if (!saved.trim()) return;

        localStorage.setItem(
            "savedPage_" + storyId,
            String(current)
        );

        const earned = awardCookies("saved", 1);

        alert(
            earned
                ? "Progress saved! You earned 1 cookie! 🍪"
                : "Your progress has been saved! 📖"
        );

        stopReading();
        window.location.href = "index.html";
    });
}
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
const MAX_SIZE = 100;
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

// ---------- Reading Assistants ----------
function setupToggle(btnId, className) {
    try {
        if (localStorage.getItem(className) === "on") document.body.classList.add(className);
    } catch (e) {}
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.classList.toggle("active", document.body.classList.contains(className));
    btn.addEventListener("click", () => {
        const on = document.body.classList.toggle(className);
        btn.classList.toggle("active", on);
        try {
            localStorage.setItem(className, on ? "on" : "off");
        } catch (e) {}
    });
}

setupToggle("pictureToggleBtn", "picture-words");
setupToggle("letterToggleBtn", "letter-helper");
setupToggle("fontToggleBtn", "dyslexic");
