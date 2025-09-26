import { App } from "@octokit/app";
import { Octokit } from "@octokit/rest";

import type { AppConfig } from "../config/env";

export interface RepositoryReference {
  owner: string;
  repo: string;
}

type InstallationClient = Awaited<ReturnType<App["getInstallationOctokit"]>>;

export class GitHubService {
  private readonly app: App;

  constructor(private readonly config: AppConfig) {
    this.app = new App({
      appId: config.GITHUB_APP_ID,
      privateKey: config.GITHUB_PRIVATE_KEY,
      Octokit
    });
  }

  async getInstallationClient(installationId: number): Promise<InstallationClient> {
    return this.app.getInstallationOctokit(installationId);
  }

  async postComment(params: {
    installationId: number;
    repository: RepositoryReference;
    issueNumber: number;
    body: string;
  }): Promise<void> {
    const octokit = await this.getInstallationClient(params.installationId);

    await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner: params.repository.owner,
      repo: params.repository.repo,
      issue_number: params.issueNumber,
      body: params.body
    });
  }
}
