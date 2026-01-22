import { retryAfterFixedInterval , retryExponentially ,retryLinearly } from "./retryStrategy.js";
import { retryJob } from "./threeTierRetry.js";
import { Job, JobData, JobResult } from "../common/job.type.js";
import redis from "../utils/redis.js";


export const handleJobFailure=async(job:Job , result:JobResult):Promise<void>=>{

       const baseDelay = job.backoffConfig?.baseDelaySeconds ?? 5;

    //   await redis.set(`job:${job.jobId}`, JSON.stringify(job));
     const strategy= job.backoffStrategy ?? "exponential";


    switch(strategy){

        case "threeTier":
            return retryJob(job , result);

        case "linear":
            return retryLinearly(job, result , baseDelay);

        case "fixed":
            return  retryAfterFixedInterval(job, result , baseDelay);

        case "exponential":
            default:
            return retryExponentially(job, result);


    }
         


}