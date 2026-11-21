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


