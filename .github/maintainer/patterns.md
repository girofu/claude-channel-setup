# Observed Patterns

## Codebase Patterns

### 雙語言同步
- Node.js 和 Python 版本的 API 驗證邏輯完全鏡像
- 新增 channel 時需同時更新兩個版本
- 測試結構也保持對應

### Channel 模組化
- 每個 channel 是獨立模組（discord.ts / telegram.ts）
- 共享 config 管理和 Claude Code 整合邏輯
- 新增 channel 只需加一個模組 + 更新 SUPPORTED_CHANNELS

## Recurring Issues

_（專案剛建立，尚無 recurring issues）_

## Contributor Patterns

_（尚無外部貢獻者資料）_
