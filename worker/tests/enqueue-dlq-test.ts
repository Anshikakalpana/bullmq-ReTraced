import { Job } from "../src/common/job.type.js";
import redis from "../src/utils/redis.js";

const JOBS = 1000;
const QUEUE = "queue:email";

(async () => {
  console.time("enqueue");

  for (let i = 0; i < JOBS; i++) {
    const job:Job = {
      jobId: `dlq-test-${i}`,
      createdAt: Date.now(),
      jobData: {
        emailFrom: "test@a.com",
        emailTo: "test@b.com",
        subject: "DLQ TEST",
        body: "Hello"
      },
      queueName: QUEUE,
      status: "pending",
      tries: 0,
      maxTries: 5,
      backoffStrategy: "exponential",
      backoffConfig: {
        baseDelaySeconds: 1,
        factor: 2,
        maxDelaySeconds: 30,
        limitOfTries: 2
      }
    };

    await redis.lPush("queue:email:ready", JSON.stringify(job));
  }

  console.timeEnd("enqueue");
  console.log(` Enqueued ${JOBS} DLQ test jobs`);
  process.exit(0);
})();
