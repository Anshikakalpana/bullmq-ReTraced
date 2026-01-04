import { job, JobResult } from "./common/job.type.js";
import { moveJobToDLQ } from "./dlq/dlq.producer.js";
import jobHandler from "./handlers/email.handler.js";
import { permanentFailures, temporaryFailures } from "./common/failures/error.type.js";
import { JobErrorCode } from "./common/failures/jobErrorCodes.js";
import { retryJob } from "./retry/retry.js";

const QUEUES = ['jobQueue']; 

const processJob = async (job: job): Promise<void> => {

  if (!job) {
    throw new Error("No job provided for processing");
  }
try{
  const result: JobResult = await jobHandler(job);

  if (!result) {
    throw new Error("Job handler did not return a result");
  }

  if (result.success) {
    job.status = "completed";
    return;
  }

  const error = result.error;

  //  Permanent failure → DLQ
  if (error?.code && permanentFailures.has(error.code)) {
    job.status = "failed";
    await moveJobToDLQ(job, result);
    return;
  }

  //  Temporary failure → Retry
  if (error?.code && temporaryFailures.has(error.code)) {
    job.status="delayed";

    const delayData = {
      retryAfterSeconds: 5,
      limitOfTries: 3   // delay starts after 3 attempts
    };

    await retryJob(delayData, job, result);
    return;
  }

  //  Unknown error → fail-safe DLQ
  job.status = "failed";
  await moveJobToDLQ(job, result);
}
catch(err){
  job.status="failed";
  const result:JobResult={
    success:false,
    error:{
      code:JobErrorCode.UNKNOWN_ERROR,
      message:(err as Error).message,
      failedAt:Date.now()
    },
    finishedAt:Date.now()
    }
  await moveJobToDLQ(job ,result);
  console.error('Error processing job:', err);
return;

}
};
export default processJob;




// const processJob = async (job: job): Promise<void> => {
//   if (!job?.jobId || !job?.queueName) {
//     throw new Error("Invalid job data");
//   }

//   const queue = getQueueKeys(job.queueName);
  
//   try {
//     // Add timeout
//     const result = await Promise.race([
//       jobHandler(job),
//       new Promise((_, reject) => 
//         setTimeout(() => reject(new Error('Timeout')), 300000)
//       )
//     ]);

//     if (!result) {
//       throw new Error("Job handler did not return a result");
//     }

//     if (result.success) {
//       job.status = "completed";
//       await redis.hSet(queue.jobs, job.jobId, JSON.stringify(job)); 
//       await redis.sRem(queue.processing, job.jobId); 
//       return;
//     }

//     const error = result.error;

//     if (error?.code && permanentFailures.has(error.code)) {
//       job.status = "failed";
//       await moveJobToDLQ(job, result);
//       await redis.sRem(queue.processing, job.jobId);
//       return;
//     }

//     if (error?.code && temporaryFailures.has(error.code)) {
//       // Remove redundant status update - let retryJob handle it
//       const delayData = { retryAfterSeconds: 5, limitOfTries: 3 };
//       await retryJob(delayData, job, result);
//       await redis.sRem(queue.processing, job.jobId); 
//       return;
//     }

//     job.status = "failed";
//     await moveJobToDLQ(job, result);
//     await redis.sRem(queue.processing, job.jobId); 
    
//   } catch (err) {
//     const errorMsg = err instanceof Error ? err.message : String(err); 
//     job.status = "failed";
    
//     const result: JobResult = {
//       success: false,
//       error: {
//         code: JobErrorCode.UNKNOWN_ERROR,
//         message: errorMsg,
//         stack: err instanceof Error ? err.stack : undefined;
//         failedAt: Date.now()
//       },
//       finishedAt: Date.now()
//     };
    
//     try {
//       await moveJobToDLQ(job, result);
//     } catch (dlqErr) {
//       console.error('Failed to move to DLQ:', dlqErr); 
//     }
    
//     await redis.sRem(queue.processing, job.jobId); 
//     console.error('Error processing job:', { jobId: job.jobId, error: errorMsg });
//   }
// };