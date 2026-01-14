import redis from "../utils/redis.js";
import { Job, JobResult ,BackoffConfig } from "../common/job.type.js";
import { getQueueKeys } from "../common/queue.constants.js";
import { moveJobToDLQ } from "../dlq/dlq.producer.js";
import { delayJob } from "../delay-jobs/delay-job.js";
import { exponentialBackoffStrategy } from "./backoffStrategy.js";



export const handleRetryOrDLQ = async (
  job: Job,
  result: JobResult,
  delaySeconds?: number
): Promise<boolean> => {
  job.tries += 1;
  job.updatedAt = Date.now();

  if (job.tries > job.maxTries) {
    job.status = "dead";
    await moveJobToDLQ(job, result);
    console.log("job_moved_to_dlq", {
      jobId: job.jobId,
      tries: job.tries,
    });
    return true; // handled
  }

  if (delaySeconds !== undefined) {
    await delayJob(job, delaySeconds);
    job.status = "delayed";
    console.log("job_delayed", {
      jobId: job.jobId,
      delaySeconds,
    });
    return true; // handled
  }

  return false; // continue
};
