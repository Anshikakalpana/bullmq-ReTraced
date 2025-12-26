import redis from '../utils/redis';
import { getQueueKeys } from '../common/queue.constants';
import { job ,JobResult} from './job.type';
import { jobFailureType } from '../common/failures/error.type';
import { JobErrorCode } from '../common/failures/jobErrorCodes';


export const createJob = async (jobData: job): Promise<JobResult> => {
  const newJobResult: JobResult = {
   
    success: false,
    error: undefined,
    finishedAt: Date.now(),
  };

  try {
    const newJob: job = {
      jobId: jobData.jobId,
      createdAt: Date.now(),
      jobData: jobData.jobData,
      queueName: jobData.queueName,
      status: 'pending',
      tries: 0,
      maxTries: jobData.maxTries,
      type: jobData.type,
      priority: jobData.priority ?? 0,
      runAt: jobData.runAt,
    };

    if (!newJob.jobData.emailFrom || !newJob.jobData.emailTo || !newJob.jobData.subject || !newJob.jobData.body) {
      newJobResult.error = {
        code: JobErrorCode.INVALID_JOB_DATA,
        message: 'Invalid job data: emailFrom, emailTo, subject, and body are required',
        failedAt: Date.now(),
      };
      return newJobResult;
    }

    const queues = getQueueKeys(newJob.queueName);

    
    if (newJob.runAt && newJob.runAt > Date.now()) {
      await redis.zAdd(queues.delayed, {
        score: newJob.runAt,
        value: JSON.stringify(newJob),
      });
    } else {
      await redis.rPush(queues.ready, JSON.stringify(newJob));
    }
 

    newJobResult.success = true;
    return newJobResult;

  } catch (err: any) {
    newJobResult.error = {
      code: JobErrorCode.JOB_CREATION_FAILED,
      message: err.message,
      stack: err.stack,
      failedAt: Date.now(),
    };
    return newJobResult;
  }
};





// in worker folder

// export const fetchNextJob = async (queueName: string): Promise<job | null> => {
//   try {
//     const queue = getQueueKeys(queueName);
//     const result = await redis.lPop(queue.ready);

//     if (result) {
//       return JSON.parse(result) as job;
//     }
//     return null;
//   } catch (err) {
//     console.error('Error fetching job from queue:', err);
//     throw err;
//   }
// };






const getJobStatus= async (jobId: string) => {
  try{
    if(!jobId){
      throw new Error('Invalid jobId');
    }

  }catch(err){
    console.error('Error getting job status:', err);
    throw err;
  }

};





// const retryJob = async (jobData: job): Promise<void> => {
//   try {
//     jobData.tries += 1;
//     jobData.updatedAt = Date.now();
//     jobData.status = 'pending';
//     const queue = getQueueKeys(jobData.queueName);
//     await redis.rPush(queue.ready, JSON.stringify(jobData));
//   } catch (err) {
//     console.error('Error retrying job:', err);
//     throw err;
//   }
// };





// const moveJobToDLQ = async (jobData: job, result: JobResult): Promise<void> => {

//   try{
//     if(result.error===undefined){
//       throw new Error('JobResult error is undefined, cannot move to DLQ');
//     }
//     const queue = getQueueKeys(jobData.queueName);

//     await redis.rPush(queue.dlq, JSON.stringify({...jobData, error: result.error}));
//   }catch(err){
//     console.error('Error moving job to DLQ:', err);
//     throw err;
//   }

// }





const dlqOrRetryJob = async (jobData: job, result: JobResult) => {
  if (!result.error) return;

  const errorCode = result.error.code as JobErrorCode;
 
  if (
    jobFailureType.permanentFailures.has(errorCode) ||
    jobData.tries >= jobData.maxTries
  ) {
    await moveJobToDLQ(jobData, result);
    return;
  }

  await retryJob(jobData);
};




