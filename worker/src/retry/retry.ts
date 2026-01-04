import redis from "../utils/redis.js";
import { job, JobResult ,delay } from "../common/job.type.js";
import { getQueueKeys } from "../common/queue.constants.js";
import { moveJobToDLQ } from "../dlq/dlq.producer.js";
import { delayJob } from "../delay-jobs/delay-job.js";

export const retryJob = async (delayData:delay ,jobData: job, result: JobResult): Promise<void> => {
  try {
    // safety guards
if (!jobData || !jobData.queueName) {
  console.error("Invalid job data received for retry");
  return;
}

    //Increment tries 
    jobData.tries += 1;
    jobData.updatedAt = Date.now();

    // max tries exceeded → move to dlq
    if (jobData.tries > jobData.maxTries) {
      jobData.status = "dead";
      await moveJobToDLQ(jobData, result);
     console.log("job_moved_to_dlq", {
     jobId: jobData.jobId,
     tries: jobData.tries,
});

      return;
    }

    //  delay retry window
    if (
      jobData.tries >= delayData.limitOfTries &&
      jobData.tries <= jobData.maxTries
    ) {
      const MAX_BACKOFF_SECONDS = 60 * 60; // 1 hour cap

  const backoffSeconds = Math.min(
  delayData.retryAfterSeconds *
    Math.pow(2, jobData.tries - delayData.limitOfTries),
  MAX_BACKOFF_SECONDS
);
     

      await delayJob(jobData, backoffSeconds);
      console.log(`job retry after ${backoffSeconds} seconds`);
       jobData.status = "pending";

    console.log("job_delayed", {
    jobId: jobData.jobId,
    delaySeconds: backoffSeconds,
   });



      return;
    }

    //  Immediate retry
 
    jobData.status = "pending";


    const queue = getQueueKeys(jobData.queueName);
   await redis.rPush(queue.ready, JSON.stringify(jobData));
   console.log("job_requeued_immediately", {
    jobId: jobData.jobId,
});


  } catch (err) {
    console.error("Error retrying job:", err);
    throw err;
  }
};

// export default retryJob;



// import redis from "../utils/redis.js";
// import { job, JobResult, delay } from "../common/job.type.js";
// import { getQueueKeys } from "../common/queue.constants.js";
// import { moveJobToDLQ } from "../dlq/dlq.producer.js";
// import { delayJob } from "../delay-jobs/delay-job.js";

// const retryJob = async (
//   delayData: delay,
//   jobData: job,
//   result: JobResult
// ): Promise<void> => {
//   try {
//     // Validation
//     if (!jobData?.queueName || !jobData?.jobId) {
//       console.error("Invalid job data received for retry", { jobData });
//       return;
//     }

//     if (!delayData || delayData.limitOfTries < 0 || delayData.retryAfterSeconds < 0) {
//       console.error("Invalid delay configuration", { delayData });
//       return;
//     }

//     // Update job metadata
//     jobData.tries += 1;
//     jobData.updatedAt = Date.now();

//     console.log("job_retry_attempt", {
//       jobId: jobData.jobId,
//       tries: jobData.tries,
//       maxTries: jobData.maxTries,
//       queueName: jobData.queueName,
//     });

//     // Check if max tries exceeded
//     if (jobData.tries > jobData.maxTries) {
//       jobData.status = "dead";
//       await moveJobToDLQ(jobData, result);
      
//       console.log("job_moved_to_dlq", {
//         jobId: jobData.jobId,
//         tries: jobData.tries,
//         maxTries: jobData.maxTries,
//       });
      
//       return;
//     }

//     // Determine retry strategy
//     const shouldDelay = jobData.tries >= delayData.limitOfTries;

//     if (shouldDelay) {
//       // Exponential backoff with cap
//       const MAX_BACKOFF_SECONDS = 60 * 60; // 1 hour
//       const exponentialFactor = jobData.tries - delayData.limitOfTries;
      
//       const backoffSeconds = Math.min(
//         delayData.retryAfterSeconds * Math.pow(2, exponentialFactor),
//         MAX_BACKOFF_SECONDS
//       );

//       jobData.status = "delayed";
//       await delayJob(jobData, backoffSeconds);
      
//       console.log("job_delayed_retry", {
//         jobId: jobData.jobId,
//         tries: jobData.tries,
//         delaySeconds: backoffSeconds,
//         nextRetryAt: new Date(Date.now() + backoffSeconds * 1000).toISOString(),
//       });
//     } else {
//       // Immediate retry
//       jobData.status = "pending";
      
//       const queue = getQueueKeys(jobData.queueName);
//       await redis.rPush(queue.ready, JSON.stringify(jobData));
      
//       console.log("job_requeued_immediately", {
//         jobId: jobData.jobId,
//         tries: jobData.tries,
//         queueName: jobData.queueName,
//       });
//     }
//   } catch (err) {
//     console.error("Error retrying job:", {
//       error: err instanceof Error ? err.message : String(err),
//       jobId: jobData?.jobId,
//       queueName: jobData?.queueName,
//       tries: jobData?.tries,
//     });
    
    
//   }
// };

// export default retryJob;