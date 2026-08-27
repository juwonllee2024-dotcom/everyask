# Contributing

EveryAsk is intentionally small, local, and model-agnostic.

## Development

```bash
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run smoke
npm run audit
```

Keep new behavior behind a focused test. Do not add network calls, persistent user-data collection, broad host permissions, or automatic message sending without a documented design review and explicit maintainer approval.

For browser adapters, include a fixture or a deterministic DOM test. Selectors change; a failing fixture is better than a silent false claim.
