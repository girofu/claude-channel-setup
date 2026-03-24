# Contributing to claude-channel-setup

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Node.js

```bash
git clone https://github.com/girofu/claude-channel-setup.git
cd claude-channel-setup
npm install
npm test          # Run tests
npm run build     # Build CLI
```

### Python

```bash
python3 -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -e python/
pip install pytest pytest-asyncio
pytest python/tests/
```

## Development Workflow

1. **Fork** the repository
2. **Create a branch** from `main`: `git checkout -b my-feature`
3. **Write tests first** (TDD): we follow Red-Green-Refactor
4. **Implement** the feature/fix
5. **Run all tests**: both Node.js (`npm test`) and Python (`pytest python/tests/`)
6. **Submit a PR** with a clear description

## Code Style

### Node.js / TypeScript

- Strict TypeScript (`strict: true`)
- ESM modules
- No `any` types unless absolutely necessary

### Python

- Python 3.10+ with type hints
- `async/await` for HTTP operations
- Standard library where possible, `httpx` for HTTP

## Adding a New Channel

To add support for a new platform (e.g., Slack):

1. Create `src/channels/slack.ts` and `python/claude_channel_setup/channels/slack.py`
2. Implement token validation (API call to verify)
3. Add to `SUPPORTED_CHANNELS` in `src/commands/setup.ts` and `python/.../cli.py`
4. Write tests in both languages
5. Update README with setup instructions

## Dual-Language Sync

Node.js and Python versions must stay in sync:
- Same features, same error messages, same user flow
- PRs that modify one version should include corresponding changes in the other
- Test counts should be comparable

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Tests
- `chore:` Maintenance

## Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md). Include:
- Your OS, Node.js/Python version, and Claude Code version
- Steps to reproduce
- Full error output

## Questions?

Open a [Discussion](https://github.com/girofu/claude-channel-setup/discussions) or file an issue.
