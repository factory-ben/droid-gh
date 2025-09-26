import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  Webhooks,
  type EmitterWebhookEvent,
  type EmitterWebhookEventName
} from "@octokit/webhooks";
import pRetry from "p-retry";

import type { AppConfig } from "../config/env";
import { parseDroidCommand } from "../commands/parser";
import { FactoryService } from "../services/factory";
import { GitHubService } from "../services/github";

interface RegisterOptions {
  config: AppConfig;
  githubService: GitHubService;
  factoryService: FactoryService;
}

export async function registerGitHubWebhook(app: FastifyInstance, options: RegisterOptions): Promise<void> {
  const webhooks = new Webhooks({ secret: options.config.GITHUB_WEBHOOK_SECRET });

  type IssueCommentEvent =
    | EmitterWebhookEvent<"issue_comment.created">
    | EmitterWebhookEvent<"issue_comment.edited">;

  const handleIssueComment = async ({ payload }: IssueCommentEvent): Promise<void> => {
    if (!payload.issue.pull_request) {
      return;
    }

    const parsed = parseDroidCommand(payload.comment.body ?? "");
    if (!parsed) {
      return;
    }

    const installationId = payload.installation?.id;
    if (!installationId) {
      app.log.warn("Received @droid command without installation id");
      return;
    }

    const result = await options.factoryService.executeCommand({
      command: parsed.command,
      args: parsed.args,
      commentBody: payload.comment.body,
      repository: {
        owner: payload.repository.owner.login,
        repo: payload.repository.name
      },
      issueNumber: payload.issue.number,
      commentAuthor: payload.comment.user?.login ?? "unknown",
      installationId,
      commentId: payload.comment.id
    });

    const reply = formatFactoryResult(result);

    await pRetry(
      () =>
        options.githubService.postComment({
          installationId,
          repository: {
            owner: payload.repository.owner.login,
            repo: payload.repository.name
          },
          issueNumber: payload.issue.number,
          body: reply
        }),
      { retries: 3 }
    );
  };

  webhooks.on("issue_comment.created", handleIssueComment);
  webhooks.on("issue_comment.edited", handleIssueComment);

  app.post("/webhook/github", async (request: FastifyRequest, reply: FastifyReply) => {
    const signature = request.headers["x-hub-signature-256"];
    const eventName = request.headers["x-github-event"];
    const deliveryId = request.headers["x-github-delivery"];

    if (typeof signature !== "string" || typeof eventName !== "string" || typeof deliveryId !== "string") {
      reply.code(400).send({ error: "Missing GitHub webhook headers" });
      return;
    }

    const payloadBuffer = request.body instanceof Buffer ? request.body : Buffer.from(JSON.stringify(request.body ?? {}));
    const payload = payloadBuffer.toString("utf8");

    try {
      await webhooks.verifyAndReceive({
        id: deliveryId,
        name: eventName as EmitterWebhookEventName,
        payload,
        signature
      });

      reply.code(202).send({ ok: true });
    } catch (error) {
      request.log.error({ err: error }, "Failed to verify GitHub signature");
      reply.code(401).send({ error: "Signature verification failed" });
    }
  });
}

function formatFactoryResult(result: Awaited<ReturnType<FactoryService["executeCommand"]>>): string {
  const header = `**Droid Command ${result.status === "queued" ? "Queued" : result.status === "skipped" ? "Skipped" : "Failed"}**`;
  const lines = [header, "", result.message];

  if (result.referenceUrl) {
    lines.push("", `[View details](${result.referenceUrl})`);
  }

  return lines.join("\n");
}
