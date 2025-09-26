import Fastify from "fastify";

import { appConfig, port } from "./config/env";
import { FactoryService } from "./services/factory";
import { GitHubService } from "./services/github";
import { registerGitHubWebhook } from "./webhooks/githubWebhook";

export async function createServer() {
  const app = Fastify({ logger: true });

  app.addContentTypeParser("application/json", { parseAs: "buffer" }, (_request, body, done) => {
    done(null, body);
  });

  const githubService = new GitHubService(appConfig);
  const factoryService = new FactoryService(appConfig);

  await registerGitHubWebhook(app, {
    config: appConfig,
    githubService,
    factoryService
  });

  app.get("/healthz", async () => ({ status: "ok" }));

  return app;
}

async function start() {
  const app = await createServer();

  try {
    await app.listen({ port, host: "0.0.0.0" });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}
