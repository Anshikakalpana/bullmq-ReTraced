import { Job, JobResult } from "../common/job.type.js";
import { handleRetryOrDLQ } from "./delayLogic.js";
import { exponentialBackoffStrategy } from "./backoffStrategy.js";

// Fixed delay retry

export const retryAfterFixedInterval = async (
  job: Job,
  jobresult: JobResult,
  baseDelaySeconds: number,
): Promise<void> => {

  try {

    if (!job || !jobresult) {

      throw new Error("Invalid job or job result data");

    }

    await handleRetryOrDLQ(job, jobresult, baseDelaySeconds);

  } catch (err) {

    console.error("Error in retryAfterFixedInterval:", err);

    throw err;

  }

};

// Linear retry

export const retryLinearly = async (
  job: Job,
  jobresult: JobResult,
  baseDelaySeconds: number,
): Promise<void> => {

  try {

    if (!job || !jobresult) {

      throw new Error("Invalid job or job result data");

    }

    const linearDelaySeconds = baseDelaySeconds * (job.tries + 1);

    await handleRetryOrDLQ(job, jobresult, linearDelaySeconds);

  } catch (err) {

    console.error("Error in retryLinearly:", err);

    throw err;

  }

};

// Exponential retry
export const retryExponentially = async (
  job: Job,
  jobresult: JobResult,
): Promise<void> => {

  try {

    if (!job || !jobresult) {

      throw new Error("Invalid job or job result data");

    }

    const backoffParams = job.backoffConfig ?? {
      baseDelaySeconds: 5,
      maxDelaySeconds: 300,
      factor: 2,
      jitterSeconds: 5,
      limitOfTries: 6,
    };

    const backoffSeconds = exponentialBackoffStrategy(
      backoffParams,
      job.tries
    );

    await handleRetryOrDLQ(job, jobresult, backoffSeconds);

  } catch (err) {

    console.error("Error in retryExponentially:", err);

    throw err;

  }
  
};
