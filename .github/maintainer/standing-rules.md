# Standing Rules

## Stale Policy

| Condition | Days | Action |
|-----------|------|--------|
| Issue waiting on reporter | 30 | Comment asking for update |
| Issue waiting on reporter | 60 | Close as stale |
| PR waiting on author | 30 | Close as stale |

## Auto-Labels

| Condition | Label |
|-----------|-------|
| Issue mentions "discord" | `channel:discord` |
| Issue mentions "telegram" | `channel:telegram` |
| Issue mentions "python" or "pip" | `lang:python` |
| Issue mentions "node" or "npm" or "npx" | `lang:node` |
| First-time contributor | `first-contribution` |

## External PR Handling

- Never merge external PRs
- Extract intent and implement fixes directly
- Close PRs with explanation and credit

## Release Policy

- Semantic versioning (semver)
- npm 和 PyPI 同步發布
- 每次 release 包含 CHANGELOG 更新
