# Decision Log

## 2026-03

### Project Architecture
**Date:** 2026-03-24
**Decision:** 雙語言架構（Node.js + Python）
**Reasoning:** 目標使用者群橫跨 JS 和 Python 生態系。Node.js 版本透過 `npx` 零安裝使用，Python 版本透過 `pip` 安裝。核心邏輯保持同步。

### CLI 形式
**Date:** 2026-03-24
**Decision:** 獨立 CLI 工具而非 Claude Code Plugin
**Reasoning:** 開源品質需求（C 級目標受眾）。獨立 CLI 更易分發、測試和維護。使用者不需要先安裝 Claude Code 就能預先設定。

### 手動步驟保留
**Date:** 2026-03-24
**Decision:** 保留 Discord Developer Portal / Telegram BotFather 手動操作
**Reasoning:** 這兩個平台沒有公開 API 建立 bot application。瀏覽器自動化太脆弱，不適合開源工具。
