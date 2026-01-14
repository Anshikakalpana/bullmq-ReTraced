// processDLQJob(dlqJob)
//   ├─ inspect error
//   ├─ decide retry / discard
//   ├─ requeue original job




import redis from "../utils/redis.js";
import { getQueueKeys } from "../common/queue.constants.js";
import { permanentFailures , temporaryFailures } from "../common/failures/error.type.js";
import {  Job } from "../common/job.type.js";
import { dlq ,DLQRetryAttempt} from "./dlq.types.js";



export const processDLQJob = async (dlqJob: dlq): Promise<void> => {
  if (!dlqJob) {
    throw new Error("Invalid DLQ job");
  }

  if (!dlqJob.lastError ) {
    console.error("DLQ job has no error metadata", { jobId: dlqJob.jobId });
    return;
  }

  const queue = getQueueKeys(dlqJob.queueName);
  const error = typeof dlqJob.lastError === 'string' ? JSON.parse(dlqJob.lastError) : dlqJob.lastError;

  


  if (permanentFailures.has(error?.code)) {


   const originalDLQ = JSON.stringify(dlqJob);

dlqJob.status = 'poisoned';
dlqJob.failureType = 'POISON';
dlqJob.updatedAt = Date.now();

await redis.lRem(queue.dlq, 0, originalDLQ);
await redis.rPush(queue.poison, JSON.stringify(dlqJob));

    console.log("DLQ job permanently discarded and added to poison queue", {
      jobId: dlqJob.jobId,
      errorCode: error?.code,
    });

    return;
  }

  
  

  if (temporaryFailures.has(error.code)) {
    const retryAttempt: DLQRetryAttempt = {
      attemptedAt: Date.now(),
      trigger: 'AUTO',
      changesMade: false,
      result: 'SUCCESS',
      error,
    };

    const updatedDLQ: dlq = {
      ...dlqJob,
      updatedAt: Date.now(),
      retries: [...(dlqJob.retries ?? []), retryAttempt],
    };

    const retryJob: Job = {
      jobId: dlqJob.jobId,
      queueName: dlqJob.queueName,
      jobData: dlqJob.jobData as any,
      status: 'pending',
      tries: 0,
      backoffConfig: dlqJob.backoffConfig,
      maxTries: dlqJob.maxTries,
      priority: dlqJob.priority,
      runAt: dlqJob.runAt,
      createdAt: Date.now(),
    };

    await redis.multi()
      .lRem(queue.dlq, 0, JSON.stringify(dlqJob)) // remove from DLQ
      .rPush(queue.ready, JSON.stringify(retryJob)) // requeue
      .exec();

    console.log("DLQ job requeued", {
      jobId: retryJob.jobId,
      queue: retryJob.queueName,
    });

    return;
  }


  

  console.warn("DLQ job retained (unknown failure type)", {
    jobId: dlqJob.jobId,
    error: error?.code,
  });
};
