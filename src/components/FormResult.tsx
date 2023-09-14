import { ActionPanel, Detail, Action, LocalStorage, Icon } from "@raycast/api";

import { useState, useRef, useEffect, useCallback } from "react";
import fetch from "node-fetch";
import { WorkspaceConfig } from "../types";

type ResultMaybe = {
  completed: boolean;
  result: object | string;
};

type GetJobUpdatesResponse = {
  running?: boolean;
  completed?: boolean;
  new_logs?: string;
  mem_peak?: any;
};

async function getJobUpdates(workspace: WorkspaceConfig, jobId: string): Promise<GetJobUpdatesResponse> {
  const url = `${workspace.remoteURL}api/w/${workspace.workspaceId}/jobs_u/getupdate/${jobId}?running=false&log_offset=100000`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${workspace.workspaceToken}`,
    },
  });

  let data;
  try {
    data = (await response.json()) as GetJobUpdatesResponse;
  } catch (error) {
    console.error(error);
    return {};
  }
  return data;
}

interface JobDetails {
  running?: boolean;
  workspace_id?: string;
  id: string;
  parent_job?: string;
  created_by: string;
  created_at: string;
  started_at: string;
  duration_ms: number;
  success: boolean;
  script_path?: string;
  script_hash?: string;
  args?: {
    property1?: any;
    property2?: any;
  };
  result?: any;
  logs?: string;
  deleted?: boolean;
  raw_code?: string;
  canceled: boolean;
  canceled_by?: string;
  canceled_reason?: string;
  job_kind: string;
  schedule_path?: string;
  permissioned_as: string;
  flow_status?: {
    step?: number;
    modules?: Array<{
      type?: string;
      id?: string;
      job?: string;
      count?: number;
      iterator?: {
        index?: number;
        itered?: any[];
        args?: any;
      };
      flow_jobs?: string[];
      branch_chosen?: {
        type?: string;
        branch?: number;
      };
      branchall?: {
        branch?: number;
        len?: number;
      };
      approvers?: {
        resume_id?: number;
        approver?: string;
      }[];
    }>;
    failure_module?: {
      type?: string;
      id?: string;
      job?: string;
      count?: number;
      iterator?: {
        index?: number;
        itered?: any[];
        args?: any;
      };
      flow_jobs?: string[];
      branch_chosen?: {
        type?: string;
        branch?: number;
      };
      branchall?: {
        branch?: number;
        len?: number;
      };
      approvers?: {
        resume_id?: number;
        approver?: string;
      }[];
      parent_module?: string;
    };
    retry?: {
      fail_count?: number;
      failed_jobs?: string[];
    };
  };
  raw_flow?: {
    modules?: Array<{
      id?: string;
      value?: {
        input_transforms?: {
          [key: string]: {
            value?: any;
            type?: string;
          };
        };
        content?: string;
        language?: string;
        path?: string;
        lock?: string;
        type?: string;
        tag?: string;
        concurrent_limit?: number;
        concurrency_time_window_s?: number;
      };
      stop_after_if?: {
        skip_if_stopped?: boolean;
        expr?: string;
      };
      sleep?: {
        value?: any;
        type?: string;
      };
      cache_ttl?: number;
      timeout?: number;
      summary?: string;
      mock?: {
        enabled?: boolean;
        return_value?: any;
      };
      suspend?: {
        required_events?: number;
        timeout?: number;
        resume_form?: {
          schema?: any;
        };
      };
      retry?: {
        constant?: {
          attempts?: number;
          seconds?: number;
        };
        exponential?: {
          attempts?: number;
          multiplier?: number;
          seconds?: number;
        };
      };
    }>;
    failure_module?: {
      id?: string;
      value?: {
        input_transforms?: {
          [key: string]: {
            value?: any;
            type?: string;
          };
        };
        content?: string;
        language?: string;
        path?: string;
        lock?: string;
        type?: string;
        tag?: string;
        concurrent_limit?: number;
        concurrency_time_window_s?: number;
      };
      stop_after_if?: {
        skip_if_stopped?: boolean;
        expr?: string;
      };
      sleep?: {
        value?: any;
        type?: string;
      };
      cache_ttl?: number;
      timeout?: number;
      summary?: string;
      mock?: {
        enabled?: boolean;
        return_value?: any;
      };
      suspend?: {
        required_events?: number;
        timeout?: number;
        resume_form?: {
          schema?: any;
        };
      };
      retry?: {
        constant?: {
          attempts?: number;
          seconds?: number;
        };
        exponential?: {
          attempts?: number;
          multiplier?: number;
          seconds?: number;
        };
      };
    };
    same_worker?: boolean;
    concurrent_limit?: number;
    concurrency_time_window_s?: number;
    skip_expr?: string;
    cache_ttl?: number;
  };
  is_flow_step: boolean;
  language?: string;
  is_skipped: boolean;
  email: string;
  visible_to_owner: boolean;
  mem_peak?: number;
  tag: string;
  type: "CompletedJob" | "QueuedJob";
}

async function getJobDetails(workspace: WorkspaceConfig, jobId: string): Promise<JobDetails> {
  const url = `${workspace.remoteURL}api/w/${workspace.workspaceId}/jobs_u/get/${jobId}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${workspace.workspaceToken}`,
    },
  });

  return (await response.json()) as JobDetails;
}

async function CancelQueuedJob(workspace: WorkspaceConfig, jobId: string): Promise<string> {
  const url = `${workspace.remoteURL}api/w/${workspace.workspaceId}/jobs_u/queue/cancel/${jobId}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${workspace.workspaceToken}`,
    },
    body: JSON.stringify({
      reason: "Canceled by user from Raycast Extension",
    }),
  });

  let data;
  try {
    data = await response.text();
  } catch (error) {
    console.error(error);
    return "";
  }
  return data;
}

type ResultMarkdownInput = {
  path: string;
  jobId: string;
  username: string;
  progress: number;
  status: string;
  startTime: Date;
  endTime?: Date;
};

function ResultMarkdown(workspace: WorkspaceConfig, details: JobDetails, result: string): string {
  const jobUrl = `${workspace.remoteURL}run/${details.id}?workspace=${workspace.workspaceId}`;
  const totalSteps = details.flow_status?.modules?.length || 1;
  const currentStep = details.flow_status?.step || 0;

  const jobKind = details.job_kind;

  let status = "Queued";
  if (details.type === "CompletedJob") {
    status = "Completed";
  } else if (details.running) {
    status = "Running";
  }
  if (details.canceled) {
    status = "Canceled";
  }

  let progress;
  if (jobKind === "flow") {
    progress = Math.floor((currentStep / totalSteps) * 100);
  } else {
    progress = Math.min(Math.floor((new Date().getTime() - new Date(details.started_at).getTime()) / 1000), 100);
  }
  if (status === "Completed") {
    progress = 100;
  }

  // Use emojis for progress bar and invert it
  let progressBar = "🟩".repeat(progress / 10) + "⬜".repeat(10 - progress / 10);

  if (status === "Canceled" || (status === "Completed" && details.success === false)) {
    progressBar = "🟥".repeat(10);
  }

  const progressEmoji = progress === 100 ? "✅" : "⏳";
  let timeTaken = "";
  if (details.type === "CompletedJob") {
    timeTaken = ` (ran in ${details.duration_ms / 1000}s)`;
  } else {
    timeTaken = ` (running for ${(new Date().getTime() - new Date(details.started_at).getTime()) / 1000}s)`;
  }
  let resultMessage = "";

  if (result.length < 1000) {
    resultMessage = `\`\`\`
${result}
\`\`\``;
  } else {
    if (status === "Completed" || status === "Canceled") {
      resultMessage =
        "\n\nResult is too long to display. You can copy the result to clipboard using the copy action, or cmd + enter";
    }
  }

  return `
📜 ${details.script_path}

👤 by ${details.created_by}

🆔 [${details.id}](${jobUrl})

📅 started: ${new Date(details.started_at).toISOString()}

${progressBar} ${progressEmoji} ${status}${timeTaken}

---

### Result
${resultMessage}
  `;
}

export function FormResult({ path, jobId, workspace }: { path: string; jobId: string; workspace: WorkspaceConfig }) {
  // const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [success, setSuccess] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);

  const [markdown, setMarkdown] = useState("");

  const [result, setResult] = useState("");
  // const [jobKind, setJobKind] = useState("");

  if (!jobId) {
    return <Detail markdown="An error occurred." />;
  }

  const jobUrl = `${workspace.remoteURL}run/${jobId}?workspace=${workspace.workspaceId}`;

  useEffect(() => {
    const updateMarkdown = async () => {
      const details = await getJobDetails(workspace, jobId);

      let result = "";
      if (details.type === "CompletedJob") {
        setCompleted(details.type === "CompletedJob");
        setSuccess(details.success);
        setIsLoading(false);
        clearInterval(timer);
        if (typeof details.result === "string") {
          result = details.result;
        } else {
          result = JSON.stringify(details.result, null, 4);
        }

        setResult(result);
      }

      setMarkdown(ResultMarkdown(workspace, details, result));
    };
    const timer = setInterval(updateMarkdown, 1000);

    updateMarkdown();

    return () => clearInterval(timer);
  }, [workspace, jobId]);

  // flow by path, with latest run
  const time = new Date().getTime();
  LocalStorage.setItem(`${path}:last_exec_time`, time);

  return (
    <Detail
      actions={
        <ActionPanel>
          <Action.OpenInBrowser title="Open Job" url={jobUrl} />
          {completed && success && <Action.CopyToClipboard title="Copy Result" content={result} />}
          {!completed && (
            <Action
              icon={Icon.XMarkCircle}
              title="Cancel Job"
              onAction={async () => {
                CancelQueuedJob(workspace, jobId);
                setCompleted(true);
              }}
            />
          )}

          <Action.OpenInBrowser
            title="Open Past Runs"
            url={`${workspace.remoteURL}runs/${path}?workspace=${workspace.workspaceId}`}
          />
        </ActionPanel>
      }
      isLoading={isLoading}
      markdown={markdown}
    />
  );
}
