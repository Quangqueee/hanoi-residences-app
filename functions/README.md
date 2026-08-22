# Cloud Functions

Callable dùng chung với app Expo (Hướng 1).

## `generateListingSummary`

- Region: `asia-southeast1`
- Auth + role `admin` | `landlord`
- Secret: `GROQ_API_KEY`

```bash
cd functions
npm install
npm run build

# Một lần: set secret
firebase functions:secrets:set GROQ_API_KEY

firebase deploy --only functions:generateListingSummary
```

App gọi qua `src/lib/ai-service.ts` → `httpsCallable('generateListingSummary')`.
