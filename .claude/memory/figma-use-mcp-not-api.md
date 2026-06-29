---
name: figma-use-mcp-not-api
description: 抓 Figma 設計稿一律用 Figma MCP，不要用 Figma REST API
metadata:
  type: feedback
---

抓 Figma 設計稿（screenshot / design context / metadata）**一律使用 Figma MCP 工具**，不要用 Figma REST API（curl + token）。

**Why:** 使用者 2026-06-29 明確指示「一律使用 figma mcp，不要使用 figma api」。
**How to apply:** 用 `mcp__figma__get_screenshot` / `get_design_context` / `get_metadata` 等 MCP 工具；即使 CLAUDE.md 寫了 API fallback，也以此偏好為準（MCP 可用時不要退回 API）。
</content>
