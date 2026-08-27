# Security

EveryAsk is designed to keep inspection local:

- It requests `activeTab`, `scripting`, and `clipboardWrite` only.
- It reads the current page only after the user clicks **Check this answer**.
- It does not use network requests, cookies, browser history, persistent storage, or auto-send.
- It does not claim to detect secrets, factual errors, or prompt injection.

If you find a security issue, do not publish sensitive details in a public issue. Use GitHub's private vulnerability reporting for this repository when available, or contact `juwonllee2024-dotcom@users.noreply.github.com` with reproduction steps and affected version.
