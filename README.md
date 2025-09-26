# Droid GitHub Agent

Companion repo demonstrating the Factory webhook service that reacts to `@droidie` mentions on pull requests.

## Commands

- `npm run dev` – run the Fastify webhook server with auto-reload
- `npm run start` – run the compiled server from `dist`
- `npm run tunnel` – launch the Smee tunnel (requires `SMEE_CHANNEL`)

## Environment

Create `.env` from `.env.example` and populate:

```bash
PORT=3000
GITHUB_APP_ID=<app id>
GITHUB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GITHUB_WEBHOOK_SECRET=<secret>
FACTORY_API_KEY=<optional>
```

If you want to point `droid exec` at an existing checkout, set `REPO_WORKDIR`.
