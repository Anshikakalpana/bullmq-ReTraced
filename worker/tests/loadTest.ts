import redis from "../src/utils/redis.js";

const JOBS = 10000;
const QUEUE = "queue:email:ready";

(async () => {
  console.time("enqueue");

  for (let i = 0; i < JOBS; i++) {
    await redis.lPush(QUEUE, JSON.stringify({
      jobId: `job-${i}`,
      jobData: { subject: "SUCCESS" },
      tries: 0,
      maxTries: 3
    }));
  }

  console.timeEnd("enqueue");
  console.log("Enqueued", JOBS, "jobs");
  process.exit(0);
})();
