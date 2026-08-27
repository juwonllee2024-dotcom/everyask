# Verification record

Date: 2026-08-27
Version: v0.1.0

## Local commands

- `npm ci` — pass; 1 package audited, 0 vulnerabilities
- `npm test` — pass; 11 tests, 11 passed, 0 failed
- `npm run lint` — pass; 8 source files and manifest privacy policy checked
- `npm run typecheck` — pass; MV3 manifest, injection export, and core contract checked
- `npm run build` — pass; `dist/` created
- `npm run smoke` — pass; 2/3 example asks covered, missing follow-up generated
- `npm run audit` — pass; 0 vulnerabilities
- `git diff --check` — pass; no whitespace errors

## Example scenario

Input request contains three asks: write README, add unit tests, publish a release.
Answer contains the first two only.

Expected result: 2 complete, 1 missing, and a follow-up containing only `Publish a release`.

## Release artifact

`EveryAsk-v0.1.0.zip` SHA-256: `f68e0e76b135bc10f4ef7597ddd130e1acae5b7a491267213128bda3260e4dd1`
