import redis from "../../src/utils/redis.js";
import { getQueueKeys } from "../../src/common/queue.constants.js";

const queue = getQueueKeys("email");

const baseJob = {
  createdAt: Date.now(),
  updatedAt: Date.now(),
  queueName: "email",
  status: "pending",
  tries: 0,
  maxTries: 3,
};

const jobs = [
  {
    jobId: "job-success",
    jobData: { emailFrom: "a", emailTo: "b", subject: "SUCCESS", body: "ok" }
  },
  {
    jobId: "job-retry",
    jobData: { emailFrom: "a", emailTo: "b", subject: "NETWORK_ERROR", body: "retry" }
  },
  {
    jobId: "job-dlq",
    jobData: { emailFrom: "a", emailTo: "b", subject: "INVALID_JOB_DATA", body: "fail" }
  },
  {
    jobId: "job-crash",
    jobData: { emailFrom: "a", emailTo: "b", subject: "CRASH", body: "boom" }
  }
];

(async () => {
  for (const job of jobs) {
    await redis.lPush(queue.ready, JSON.stringify({ ...baseJob, ...job }));
    console.log("Pushed:", job.jobId);
  }
  process.exit(0);
})();
