const API_BASE = "https://yashodeep2006-anuvadak-api.hf.space";

const groqKeyInput = document.getElementById("groqKey");
const mistralKeyInput = document.getElementById("mistralKey");
const statusBox = document.getElementById("statusBox");
const sessionIdEl = document.getElementById("sessionId");
const summaryEl = document.getElementById("summaryText");
const actionItemsEl = document.getElementById("actionItems");
const keyDecisionsEl = document.getElementById("keyDecisions");
const openQuestionsEl = document.getElementById("openQuestions");
const chatLog = document.getElementById("chatLog");

const runYtBtn = document.getElementById("runYt");
const runLocalBtn = document.getElementById("runLocal");
const askChatBtn = document.getElementById("askChat");

const ytUrlInput = document.getElementById("ytUrl");
const ytModeSelect = document.getElementById("ytMode");
const localFileInput = document.getElementById("localFile");
const localModeSelect = document.getElementById("localMode");
const chatQuestionInput = document.getElementById("chatQuestion");

const copyBtn = document.getElementById("copySession");

let currentSessionId = "";

function setStatus(message, type = "") {
    statusBox.textContent = message;
    statusBox.classList.remove("success", "error");
    if (type) {
        statusBox.classList.add(type);
    }
}

function setLoading(button, isLoading, label) {
    button.disabled = isLoading;
    button.textContent = isLoading ? "Working..." : label;
}

function ensureKeys() {
    const groq = groqKeyInput.value.trim();
    const mistral = mistralKeyInput.value.trim();
    if (!groq || !mistral) {
        setStatus("Please enter both API keys.", "error");
        return null;
    }
    return { groq, mistral };
}

function updateSummary(data) {
    currentSessionId = data.session_id || "";
    sessionIdEl.textContent = currentSessionId || "--";
    summaryEl.textContent = data.summary || "";
    actionItemsEl.textContent = data.action_items || "";
    keyDecisionsEl.textContent = data.key_decisions || "";
    openQuestionsEl.textContent = data.open_questions || "";
}

function appendChat(role, text) {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${role}`;
    bubble.textContent = text;
    chatLog.appendChild(bubble);
    chatLog.scrollTop = chatLog.scrollHeight;
}

async function handleJsonResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return response.json();
    }
    const text = await response.text();
    return { detail: text };
}

runYtBtn.addEventListener("click", async () => {
    const keys = ensureKeys();
    if (!keys) return;

    const url = ytUrlInput.value.trim();
    if (!url) {
        setStatus("Please enter a YouTube URL.", "error");
        return;
    }

    setLoading(runYtBtn, true, "Analyze YouTube");
    setStatus("Running YouTube analysis...");

    try {
        const response = await fetch(`${API_BASE}/summary/yt`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url,
                mode: ytModeSelect.value,
                groq_api_key: keys.groq,
                mistral_api_key: keys.mistral,
            }),
        });

        const data = await handleJsonResponse(response);
        if (!response.ok) {
            setStatus(data.detail || "Request failed.", "error");
            return;
        }

        updateSummary(data);
        setStatus("Summary ready. Session id stored.", "success");
    } catch (error) {
        setStatus("Network error. Please try again.", "error");
    } finally {
        setLoading(runYtBtn, false, "Analyze YouTube");
    }
});

runLocalBtn.addEventListener("click", async () => {
    const keys = ensureKeys();
    if (!keys) return;

    const file = localFileInput.files[0];
    if (!file) {
        setStatus("Please select a local media file.", "error");
        return;
    }

    setLoading(runLocalBtn, true, "Analyze Local File");
    setStatus("Uploading and analyzing local file...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", localModeSelect.value);
    formData.append("groq_api_key", keys.groq);
    formData.append("mistral_api_key", keys.mistral);

    try {
        const response = await fetch(`${API_BASE}/summary/local`, {
            method: "POST",
            body: formData,
        });

        const data = await handleJsonResponse(response);
        if (!response.ok) {
            setStatus(data.detail || "Request failed.", "error");
            return;
        }

        updateSummary(data);
        setStatus("Summary ready. Session id stored.", "success");
    } catch (error) {
        setStatus("Network error. Please try again.", "error");
    } finally {
        setLoading(runLocalBtn, false, "Analyze Local File");
    }
});

askChatBtn.addEventListener("click", async () => {
    const keys = ensureKeys();
    if (!keys) return;

    const question = chatQuestionInput.value.trim();
    if (!question) {
        setStatus("Please enter a question.", "error");
        return;
    }

    if (!currentSessionId) {
        setStatus("Run a summary first to get a session id.", "error");
        return;
    }

    setLoading(askChatBtn, true, "Ask");
    appendChat("user", question);

    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                session_id: currentSessionId,
                question,
                groq_api_key: keys.groq,
                mistral_api_key: keys.mistral,
            }),
        });

        const data = await handleJsonResponse(response);
        if (!response.ok) {
            appendChat("bot", data.detail || "Request failed.");
            return;
        }

        appendChat("bot", data.answer || "No answer returned.");
        chatQuestionInput.value = "";
    } catch (error) {
        appendChat("bot", "Network error. Please try again.");
    } finally {
        setLoading(askChatBtn, false, "Ask");
    }
});

copyBtn.addEventListener("click", async () => {
    if (!currentSessionId) {
        setStatus("No session id to copy yet.", "error");
        return;
    }
    try {
        await navigator.clipboard.writeText(currentSessionId);
        setStatus("Session id copied.", "success");
    } catch (error) {
        setStatus("Unable to copy. Please copy manually.", "error");
    }
});

document.querySelectorAll("[data-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-toggle");
        const input = document.getElementById(targetId);
        if (!input) return;
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        button.textContent = isPassword ? "Hide" : "Show";
    });
});

document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach((item) => {
            item.classList.remove("active");
        });
        document.querySelectorAll(".tab-pane").forEach((pane) => {
            pane.classList.remove("active");
        });
        tab.classList.add("active");
        const target = tab.getAttribute("data-tab");
        const panel = document.getElementById(`tab-${target}`);
        if (panel) panel.classList.add("active");
    });
});
