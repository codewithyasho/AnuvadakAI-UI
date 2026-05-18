# Anuvadak UI

Minimal web UI for Anuvadak AI Video Assistant. Upload a local audio or video file, generate a summary, and ask questions over the transcript using the chat endpoint.

## Endpoints

- Docs: <https://yashodeep2006-anuvadak-api.hf.space/docs>
- Summary (local files only): <https://yashodeep2006-anuvadak-api.hf.space/summary>
- Chat: <https://yashodeep2006-anuvadak-api.hf.space/chat>

## Usage

1. Open index.html in a browser.
2. Enter your GROQ_API_KEY and MISTRAL_API_KEY.
3. Upload a local media file and run the summary.
4. Use the session id to ask questions in the chat section.

## Notes

- Keys are sent directly from the browser to the API.
- Sessions reset when the API server restarts.
