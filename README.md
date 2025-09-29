# Droid GitHub Agent

Fastify-based webhook receiver that listens for `@droid` mentions on pull request discussions, forwards supported
commands to Factory, and posts the resulting status back to GitHub.

## Key Features

- ✅ Verifies and handles GitHub App webhook deliveries.
- 🤖 Parses `@droid` commands from pull request comments (`review`, `heal`, `feedback`, `help`).
- 🔁 Retries GitHub API writes to improve robustness when posting replies.
- 🏭 Optionally delegates execution to Factory workflows while providing informative feedback when the integration is
  not configured.
- 🩺 Exposes `/healthz` for simple uptime checks.

## Architecture Overview

1. A GitHub App delivers `issue_comment` webhooks to `POST /webhook/github`.
2. The webhook signature is verified using `GITHUB_WEBHOOK_SECRET`.
3. Comments mentioning `@droid` are parsed to determine the requested command and arguments.
4. Supported commands are dispatched to Factory (if a `FACTORY_API_KEY` is configured).
5. The app posts a structured status reply back to the pull request conversation.

## Getting Started

### Prerequisites

- Node.js 20 LTS (18+ should work, but 20 is recommended).
- npm 9 or later (bundled with modern Node.js releases).

### Installation

```bash
git clone https://github.com/factory-ben/droid-gh.git
cd droid-gh
npm install
```

### Configuration

Copy `.env.example` to `.env` and fill in the required values:

| Variable              | Required | Description |
| --------------------- | -------- | ----------- |
| `PORT`                | No       | Port to bind the Fastify server (defaults to `3000`). |
| `GITHUB_APP_ID`       | Yes      | Numeric identifier of your GitHub App. |
| `GITHUB_PRIVATE_KEY`  | Yes      | PEM-encoded private key for the app. Use literal `\n` in `.env` – the app converts them to newlines at runtime. |
| `GITHUB_WEBHOOK_SECRET` | Yes    | Secret used to verify incoming webhook signatures. |
| `FACTORY_API_KEY`     | No       | Enables forwarding commands to Factory. Without it, commands are politely skipped. |
| `FACTORY_BASE_URL`    | No       | Factory API host (defaults to `https://app.factory.ai`). |
| `FACTORY_WORKFLOW_ID` | No       | Optional workflow identifier to run when commands are received. |

Keep your `.env` file private and never commit it to version control.

## Running the Server

### Development mode

```bash
npm run dev
```

Runs the Fastify server with live TypeScript reloading via `tsx`. Logs are emitted to stdout.

### Production build

```bash
npm run build
npm start
```

Compiles TypeScript into `dist/` and launches the compiled server.

### Health check

```bash
curl http://localhost:3000/healthz
```

Returns `{ "status": "ok" }` when the process is running.

## GitHub App Configuration

1. Create (or edit) a GitHub App in your account/organization.
2. Set the **Webhook URL** to your deployed server (e.g., `https://your-domain/webhook/github`). The webhook must be
   reachable over HTTPS. For local development you can use a tunneling service such as
   [`smee-client`](https://github.com/probot/smee-client) or [`cloudflared tunnel`](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/local/).
3. Set the **Webhook secret** to match `GITHUB_WEBHOOK_SECRET`.
4. Subscribe the app to **Issue comment** events (delivery contains `issue_comment.created` / `issue_comment.edited`).
5. Install the app on the repositories where you want `@droid` commands to function.
6. Provide the generated **App ID** and **Private key** in your `.env` file.

Once installed, comments mentioning `@droid` on pull requests will trigger the agent.

## Command Reference

| Command                              | Aliases      | Description |
| ------------------------------------ | ------------ | ----------- |
| `@droid review [args...]`            | –            | Queue a review workflow. Additional words after the command are passed as arguments. |
| `@droid heal [args...]`              | `@droid fix` | Request a healing/remediation workflow. |
| `@droid feedback [args...]`          | –            | Ask Droid for feedback on the pull request. |
| `@droid help`                        | `@droid ?`   | Display help / default guidance when no explicit command is supplied. |

If no recognizable command is provided after the mention, the agent defaults to `help`.

## Factory Integration Behaviour

- When `FACTORY_API_KEY` is missing, the service responds in GitHub acknowledging the command but notes that it was
  skipped.
- When configured, commands are posted to `POST /api/internal/droid/commands` on your Factory instance. Responses that
  include a `url` are surfaced back to GitHub as `View details` links.
- The service retries posting the status comment up to three times using exponential backoff.

## Testing

```bash
npm test
```

Runs the Vitest suite (currently covering command parsing logic). Add additional tests as you extend the webhook
workflow.

## Project Structure

```
src/
  commands/        # Parsing of @droid command invocations
  config/          # Environment validation and typed configuration
  services/        # GitHub and Factory integration helpers
  webhooks/        # Webhook registration and routing logic
```

Feel free to adapt the structure as your automation grows.
