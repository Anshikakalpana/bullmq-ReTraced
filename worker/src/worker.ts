

const QUEUES = ['jobQueue']; 

export const processJob = async (job: any) => {
  console.log(` Processing job ${job.jobId}`);
  console.log(' Payload:', job.jobData);


  await new Promise((res) => setTimeout(res, 1000));

  console.log(` Job ${job.jobId} completed`);
};



