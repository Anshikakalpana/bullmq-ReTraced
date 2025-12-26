// import { dlq } from "./dlq.types.js";
// const dlqProducer = async (data: dlq): Promise<dlq> => {
//   if (!data) {
//     throw new Error("No data provided to DLQ producer");
//   }

//   if (data.actualTries >= data.maxTries) {
//     data.failureType = 'POISON';
//   } else {
//     data.failureType = 'TEMPORARY';
//   }

//   data.updatedAt = Date.now();
//   data.status = 'dead';

//   return data;
// };


import redis from "../utils/redis.js";
import { job ,JobResult } from "../common/job.type.js";
import { getQueueKeys } from "../common/queue.constants.js";

export const moveJobToDLQ = async (jobData: job, result: JobResult): Promise<void> => {

  try{
    if(result.error===undefined){
      throw new Error('JobResult error is undefined, cannot move to DLQ');
    }
    const queue = getQueueKeys(jobData.queueName);



    await redis.rPush(queue.dlq, JSON.stringify({...jobData, error: result.error}));



  }catch(err){
    console.error('Error moving job to DLQ:', err);
    throw err;
  }

}