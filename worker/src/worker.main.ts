
import redis from "./utils/redis.js";
import { Job, JobResult, RetryAttempt } from "./common/job.type.js";
import { moveJobToDLQ } from "./dlq/dlq.producer.js";
import { permanentFailures, temporaryFailures } from "./common/failures/error.type.js";
import { JobErrorCode } from "./common/failures/jobErrorCodes.js";
import { retryJob } from "./retry/threeTierRetry.js";
import {
  retryLinearly,
  retryExponentially,
  retryAfterFixedInterval,
} from "./retry/retryStrategy.js";

const processJob = async (job: Job): Promise<void> => {
  if (!job) {
    throw new Error("No job provided for processing");
  }

  try {
    
   const url = "http://host.docker.internal:3002/api/auth";



    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
    });

    
    let result: JobResult;
    try {
      result = await res.json();
    } catch {
      throw new Error("Invalid JSON response from webhook");
    }

    if (!result) {
      throw new Error("Job handler did not return a result");
    }

    if (result.success) {
     job.status = "completed";
  job.updatedAt = Date.now();
  await redis.set(`job:${job.jobId}`, JSON.stringify(job));
  return;
    }

    const error = result.error;

    // Permanent failure → DLQ
    if (error?.code && permanentFailures.has(error.code)) {
      job.status = "failed";
      job.updatedAt= Date.now();
await redis.set(`job:${job.jobId}`, JSON.stringify(job));
      await moveJobToDLQ(job, result);
      return;
    }

    // Temporary failure → Retry
    if (error?.code && temporaryFailures.has(error.code)) {
      job.status = "delayed";

      const retryAttempt: RetryAttempt = {
        attemptedAt: Date.now(),
        trigger: "AUTO",
        changesMade: false,
        result: "PENDING",
        error,
      };

      job.retryAttempts = [...(job.retryAttempts ?? []), retryAttempt];
       job.tries += 1;
  job.updatedAt = Date.now();
 
      if (!job.backoffConfig) {
        throw new Error("Missing backoffConfig for retry");
      }

      const baseDelay = job.backoffConfig.baseDelaySeconds || 5;
      await redis.set(`job:${job.jobId}`, JSON.stringify(job));


      if (job.backoffStrategy === "threeTier") {
        await retryJob(job, result);
        return;
      } else if (job.backoffStrategy === "exponential") {
        await retryExponentially(job, result);
        return;
      } else if (job.backoffStrategy === "fixed") {
        await retryAfterFixedInterval(job, result, baseDelay);
        return;
      } else if (job.backoffStrategy === "linear") {
        await retryLinearly(job, result, baseDelay);
        return;
      }
    }

    // Unknown error → DLQ
    job.status = "failed";
    await moveJobToDLQ(job, result);
  } catch (err) {
    job.status = "failed";

    const result: JobResult = {
      success: false,
      error: {
        code: JobErrorCode.UNKNOWN_ERROR,
        message: (err as Error).message,
        failedAt: Date.now(),
      },
      finishedAt: Date.now(),
    };

await redis.set(`job:${job.jobId}`, JSON.stringify(job));

    await moveJobToDLQ(job, result);
    console.error("Error processing job:", err);
    return;
  }
};

export default processJob;






















// import { Job, JobResult ,RetryAttempt } from "./common/job.type.js";
// import { moveJobToDLQ } from "./dlq/dlq.producer.js";
// import jobHandler from "./handlers/email.handler.js";
// import { permanentFailures, temporaryFailures } from "./common/failures/error.type.js";
// import { JobErrorCode  } from "./common/failures/jobErrorCodes.js";
// import { retryJob } from "./retry/threeTierRetry.js";
// import { retryLinearly ,retryExponentially ,retryAfterFixedInterval } from "./retry/retryStrategy.js";




// const processJob = async (job: Job): Promise<void> => {

//   if (!job) {
//     throw new Error("No job provided for processing");
//   }
// try{
//   //const result: JobResult = await jobHandler(job);
// const url = "http://localhost:3002/"

// const res = await fetch(url, {
//   method: "POST",
//   headers: { "Content-Type": "application/json" },
//   body: JSON.stringify(job),
// });

// const result = await res.json();


//   if (!result) {
//     throw new Error("Job handler did not return a result");
//   }

//   if (result.success) {
//     job.status = "completed";
    
//     return;
//   }

//   const error = result.error;

//   //  Permanent failure → DLQ
//   if (error?.code && permanentFailures.has(error.code)) {
//     job.status = "failed";

    
//     await moveJobToDLQ(job, result);
//     return;
//   }



//   //  Temporary failure → Retry
//   if (error?.code && temporaryFailures.has(error.code)) {
//      job.status="delayed";
    
//     const retryAttempt : RetryAttempt = {

//       attemptedAt: Date.now(),
//       trigger: 'AUTO',
//       changesMade: false,
//       result: 'PENDING',
//       error,
      

//     }
//     job.retryAttempts = [...(job.retryAttempts ?? []), retryAttempt];

    
//     if(!job.backoffConfig){

//       throw new Error("Missing backoffConfig for retry");

//     }

//     const baseDelay= job.backoffConfig.baseDelaySeconds || 5; // default 5 seconds

//     if(job.backoffStrategy==='threeTier'){

//       await retryJob(job , result);

//       return;

//     } else if (job.backoffStrategy==='exponential'){

//       await retryExponentially(job , result);

//       return;

//     } else if (job.backoffStrategy==='fixed'){

  
  
//       await retryAfterFixedInterval(job , result , baseDelay); 

//       return;

//     } else if (job.backoffStrategy==='linear'){

//       await retryLinearly( job , result , baseDelay);

//       return ;

//     }
    
//   }

//   //  Unknown error → fail-safe DLQ
//   job.status = "failed";
//   await moveJobToDLQ(job, result);
// }
// catch(err){
//   job.status="failed";
//   const result:JobResult={
//     success:false,
//     error:{
//       code:JobErrorCode.UNKNOWN_ERROR,
//       message:(err as Error).message,
//       failedAt:Date.now()
//     },
//     finishedAt:Date.now()
//     }
//   await moveJobToDLQ(job ,result);
//   console.error('Error processing job:', err);
// return;

// }
// };
// export default processJob;


