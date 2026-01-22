import { Job } from "../common/job.type.js";
import redis from "../utils/redis.js";
import { getQueueKeys } from "../common/queue.constants.js";

const queueName = "email";
const queueKeys = getQueueKeys(queueName);
const TARGET_JOBS = 1000;

export const enqueueJobs = async () => {
  for (let i = 0; i < TARGET_JOBS; i++) {
    const job: Job = {
      jobId: `job-${i}`,
      createdAt: Date.now(),
      queueName,
      status: "pending",
      tries: 0,
      maxTries: 5,
      historyNeed: true,
      jobData: {
        emailFrom: "noreply@test.com",
        emailTo: "user@test.com",
        subject: "Test",
        body: "Hello",
      },
      backoffConfig: {
        baseDelaySeconds: 5,
        maxDelaySeconds: 60,
        factor: 2,
        limitOfTries: 5,
      },
      backoffStrategy: "exponential",
    };

    
    await redis.set(`job:${job.jobId}`, JSON.stringify(job));

   
    await redis.rPush(queueKeys.ready, job.jobId);
  }

  console.log(`${TARGET_JOBS} jobs enqueued`);
};


enqueueJobs()
  .then(() => {
    console.log("All jobs enqueued");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Failed to enqueue jobs", err);
    process.exit(1);
  });
