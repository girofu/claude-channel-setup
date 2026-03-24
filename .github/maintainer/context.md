# Project Context

## Vision

**claude-channel-setup** 是一個開源 CLI 工具，用於自動化 Claude Code channel plugins（Discord、Telegram）的設定流程。目標是將原本需要 7 個手動步驟的繁瑣設定，壓縮成一個互動式指令。提供 Node.js（`npx claude-channel-setup`）和 Python（`pip install claude-channel-setup`）兩種安裝方式。

## Current Priorities

1. **穩定核心功能** — 確保 Discord 和 Telegram 的 token 驗證、邀請 URL 生成、config 儲存正常運作
2. **完善文件** — README、CONTRIBUTING、使用範例、錯誤排除指南
3. **CI/CD** — 設定 GitHub Actions（測試 + 發布到 npm/PyPI）
4. **社群建設** — Issue/PR templates、行為守則、貢獻指南

## Success Metrics

- npm + PyPI 下載數（首月目標：100+）
- GitHub Stars（首季目標：50+）
- 使用者回報的設定成功率 > 95%
- Issue 回應時間 < 48 小時

## Areas

| Area | Status | Notes |
|------|--------|-------|
| `src/channels/` | Active | Discord + Telegram 驗證模組 |
| `src/lib/` | Stable | Config 管理、Claude Code 整合 |
| `src/commands/` | Active | 設定流程邏輯 |
| `src/utils/` | Stable | UI 工具 |
| `python/` | Active | Python 版本鏡像 |
| `tests/` | Active | Node.js 32 tests, Python 22 tests |
| `docs/` | Needs work | README 待建立 |

## Contribution Guidelines

- 所有 PR 需附測試（TDD 流程）
- Node.js 和 Python 版本功能需保持同步
- 支援 Node.js 18+ 和 Python 3.10+
- 使用繁體中文撰寫使用者面向的訊息（CLI 提示、錯誤訊息）
- 技術文件使用英文（README、API docs、code comments）

## Tone

技術性但友善。歡迎新手貢獻者，提供清楚的指引。回覆 Issue 時直接且有建設性。

## Out of Scope

- 不支援直接透過 Discord/Telegram API 建立 bot（需手動在 Developer Portal/BotFather 操作）
- 不負責 Claude Code 本身的 bug
- 不支援其他 channel（Slack、Fakechat 等）除非社群需求明確
- 不做 GUI 版本
