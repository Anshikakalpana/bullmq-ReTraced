import { Job, JobResult } from "../common/job.type.js";
import { handleRetryOrDLQ } from "./delayLogic.js";
import { exponentialBackoffStrategy } from "./backoffStrategy.js";

export const retryAfterFixedInterval = async  (
  job: Job,
  jobresult :JobResult,
  baseDelay: number,
): Promise<void> => {
 try{
    if(!job || !jobresult){
      throw new Error("Invalid job or job result data");
    }

    // delay the job and retry the job after baseDelay seconds
      await handleRetryOrDLQ(job, jobresult, baseDelay);

      return;

    }catch(err){

    console.error("Error in retryAfterFixedInterval:", err);

    throw err;
    
  }
  
 
};



export const retryLinearly = async  (
  job: Job,
  jobresult :JobResult,
  baseDelay: number,
): Promise<void> => {
 try{
    if(!job || !jobresult){
      throw new Error("Invalid job or job result data");
    }

   
       const linearDelayInSeconds = baseDelay * job.tries;
    // delay the job and retry the job after linearDelayInSeconds
      await handleRetryOrDLQ(job, jobresult, linearDelayInSeconds);



      return;

    }catch(err){
    console.error("Error in retryLinearly:", err);
    throw err;
    
  }
  
 
};


export const retryExponentially = async  (
   
  job: Job,
  jobresult :JobResult,
  
): Promise<void> => {
     const backoffParams= job.backoffConfig;

 try{
    if(!job || !jobresult){
      throw new Error("Invalid job or job result data");
    }

    

  const backoffSeconds = exponentialBackoffStrategy(
  backoffParams,
  job.tries
);


    // delay the job and retry the job after backoffSeconds
      await handleRetryOrDLQ(job, jobresult, backoffSeconds);



      return;

    }catch(err){
    console.error("Error in retryExponentially:", err);
    throw err;
    
  }
  
 
};