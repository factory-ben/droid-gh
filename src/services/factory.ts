import type { AppConfig } from "../config/env";
import type { RepositoryReference } from "./github";

export interface CommandInvocation {
  command: string;
  args: string[];
  commentBody: string;
  repository: RepositoryReference;
  issueNumber: number;
  commentAuthor: string;
  installationId: number;
  commentId: number;
}

export interface CommandResult {
  status: "queued" | "skipped" | "failed";
  message: string;
  referenceUrl?: string;
}

export class FactoryService {
  constructor(private readonly config: AppConfig) {}

  async executeCommand(invocation: CommandInvocation): Promise<CommandResult> {
    if (!this.config.FACTORY_API_KEY) {
      return {
        status: "skipped",
        message: "Factory API key is not configured; unable to run @droid commands."
      };
    }

    const payload = {
      workflowId: this.config.FACTORY_WORKFLOW_ID,
      command: invocation.command,
      arguments: invocation.args,
      context: {
        repository: invocation.repository,
        issueNumber: invocation.issueNumber,
        commentAuthor: invocation.commentAuthor,
        commentId: invocation.commentId,
        commentBody: invocation.commentBody
      }
    };

    try {
      const response = await fetch(`${this.config.FACTORY_BASE_URL}/api/internal/droid/commands`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.FACTORY_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const text = await response.text();
        return {
          status: "failed",
          message: `Factory responded with ${response.status}: ${text || response.statusText}`
        };
      }

      const data = (await response.json()) as { message?: string; url?: string };

      return {
        status: "queued",
        message: data.message ?? "Command forwarded to Factory for processing.",
        referenceUrl: data.url
      };
    } catch (error) {
      return {
        status: "failed",
        message: error instanceof Error ? error.message : "Unknown error calling Factory"
      };
    }
  }
}
