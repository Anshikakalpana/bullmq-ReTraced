import { Job } from "../common/job.type.js";
import { getQueueKeys } from "../common/queue.constants.js";
import jobHandler from "../handlers/email.handler.js";
import redis from "../utils/redis.js";

export const processJobManually = async(deadJob :Job, queueName:string):Promise<void>=>{

        try{
            if(!deadJob){
                throw new Error("Invalid jobId provided for manual retry");
            }
            const queue = getQueueKeys( queueName);

              const result = await jobHandler(deadJob);

                if(result.success){
                    deadJob.status="completed";
                    
                    await redis.sRem( queue.dlq, deadJob.jobId);
                    return;
                }
                deadJob.status="failed";

                console.log("Job manual retry failed, moving back to DLQ", { job: JSON.stringify(deadJob) });


            
        }catch(err){

        }
           

}