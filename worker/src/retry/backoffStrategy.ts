import { BackoffConfig } from "../common/job.type";

export const exponentialBackoffStrategy = (
  backoffParams: BackoffConfig,
  currentTry: number
): number => {

  try {
 const exponent =
  currentTry >= backoffParams.limitOfTries
    ? currentTry - backoffParams.limitOfTries
    : 0;


    const backoffSeconds = Math.min(
      backoffParams.baseDelaySeconds * Math.pow(backoffParams.factor, exponent) +
        (backoffParams.jitterSeconds || 0),
      backoffParams.maxDelaySeconds
    );

    if (backoffSeconds <= 0) {
      throw new Error("Invalid backoff strategy parameters");
    }

    return backoffSeconds;

  } catch (err) {
    console.error("Error calculating backoff strategy:", err);
    throw err;
  }
};
