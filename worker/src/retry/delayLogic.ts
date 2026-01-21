
import { Job, JobResult ,BackoffConfig } from "../common/job.type.js";
import { moveJobToDLQ } from "../dlq/dlq.producer.js";
import { delayJob } from "../delay-jobs/delay-job.js";
import { ackJob } from "../queue/ack.js";




export const handleRetryOrDLQ = async (
  job: Job,
  result: JobResult,
  delaySeconds: number | 0 
): Promise<boolean> => {
 
 const runAt= Date.now() + delaySeconds * 1000;

  if (job.tries >= job.maxTries) {
    job.status = "dead";
    await moveJobToDLQ(job, result);
    console.log("job_moved_to_dlq", {
      jobId: job.jobId,
      tries: job.tries,
    });
    return true; // handled
  }

  if (runAt !== undefined) {
    await delayJob(job, runAt);
  
    job.status = "delayed";
    console.log("job_delayed", {
      jobId: job.jobId,
      runAt,
    });
    return true; // handled
  }

  return false; // continue
};
