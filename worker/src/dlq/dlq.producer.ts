

import redis from "../utils/redis.js";
import { Job ,JobResult } from "../common/job.type.js";
import { getQueueKeys } from "../common/queue.constants.js";
import { dlq } from "./dlq.types.js";
export const moveJobToDLQ = async (
  jobData: Job,
  result: JobResult
): Promise<void> => {


  try {
    if (!result.error) {
      throw new Error("JobResult error is undefined, cannot move to DLQ");
    }

    const dlqJob:dlq = {
      
      jobId: jobData.jobId,

      queueName: jobData.queueName,

      jobData: structuredClone(jobData.jobData), //deep copy snapshot of data so that it dosent change anywhere in between

      status: "dead" as const, // once dead always dead until manually retried

      maxTries: jobData.maxTries,

      actualTries: jobData.tries,


      lastError: {
        code: result.error.code,
        message: result.error.message ?? "Unknown error",
        stack: result.error.stack,
        failedAt: Date.now(),
      },

      retries: jobData.retries,

      backoffConfig: jobData.backoffConfig,

      backoffStrategy: jobData.backoffStrategy,

      createdAt: jobData.createdAt,

    };

    const queue = getQueueKeys(jobData.queueName);



    await redis.rPush(queue.dlq, JSON.stringify(dlqJob));


  } catch (err) {


    console.error("Error moving job to DLQ:", err);
    throw err;


  }
};
