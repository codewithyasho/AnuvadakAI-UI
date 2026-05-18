const API_BASE = "https://yashodeep2006-anuvadak-api.hf.space";

const groqKeyInput = document.getElementById("groqKey");
const mistralKeyInput = document.getElementById("mistralKey");
const statusBox = document.getElementById("statusBox");
const sessionIdEl = document.getElementById("sessionId");
const summaryEl = document.getElementById("summaryText");
const chatLog = document.getElementById("chatLog");

const runLocalBtn = document.getElementById("runLocal");
const askChatBtn = document.getElementById("askChat");

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

function ensureSummaryKeys() {
    const groq = groqKeyInput.value.trim();
    const mistral = mistralKeyInput.value.trim();
    if (!groq || !mistral) {
        setStatus("Please enter both API keys.", "error");
        return null;
    }
    return { groq, mistral };
}

function ensureChatKey() {
    const groq = groqKeyInput.value.trim();
    if (!groq) {
        setStatus("Please enter your Groq API key.", "error");
        return null;
    }
    return groq;
}

function updateSummary(data) {
    currentSessionId = data.session_id || "";
    sessionIdEl.textContent = currentSessionId || "--";
    if (data.summary_status === "failed") {
        summaryEl.textContent = data.summary_error
            ? `Summarization failed: ${data.summary_error}`
            : "Summary failed. Go to the chat section below 👇";
        return;
    }

    summaryEl.textContent = data.summary || "Summary unavailable.";
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

runLocalBtn.addEventListener("click", async () => {
    const keys = ensureSummaryKeys();
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
    formData.append("GROQ_API_KEY", keys.groq);
    formData.append("MISTRAL_API_KEY", keys.mistral);

    try {
        const response = await fetch(`${API_BASE}/summary`, {
            method: "POST",
            body: formData,
        });

        const data = await handleJsonResponse(response);
        if (!response.ok) {
            setStatus(data.detail || "Request failed.", "error");
            return;
        }

        updateSummary(data);
        if (data.summary_status === "failed") {
            setStatus("Summary failed. Go to the chat section below 👇", "error");
            return;
        }
        setStatus("Summary ready. Session id stored.", "success");
    } catch (error) {
        setStatus("Network error. Please try again.", "error");
    } finally {
        setLoading(runLocalBtn, false, "Analyze Local File");
    }
});

askChatBtn.addEventListener("click", async () => {
    const groqKey = ensureChatKey();
    if (!groqKey) return;

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
                query: question,
                GROQ_API_KEY: groqKey,
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
