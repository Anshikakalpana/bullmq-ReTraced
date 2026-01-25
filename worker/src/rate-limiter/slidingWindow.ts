import  redis  from "../utils/redis.js";
import fs from "fs";
import path from "path";

let slidingWindowSHA: string | null = null;
let slidingWindowScript: string | null = null;

async function loadSlidingWindowScript() {
  if (!slidingWindowSHA) {
    slidingWindowScript = fs.readFileSync(
      path.join(process.cwd(), "src/rate-limiter/slidingWindow.lua"),
      "utf8"
    );

    slidingWindowSHA = await (redis as any).script("load", slidingWindowScript);

    console.log("Sliding Window Script SHA Loaded:", slidingWindowSHA);
  }
  return slidingWindowSHA;
}

export async function slidingWindowAlgorithm(
  key: string,
  limit: number,
windowSize: number,
  tokensRequested: number
) {
  await loadSlidingWindowScript();

  const redisKey = `sliding_window:{${key}}`;
  const statsKey = `stats:{${key}}`;
  const globalStatsKey = `stats:{${key}}:global`;

  const now = Date.now(); 

  try {
    const raw: any = await redis.evalsha(
      slidingWindowSHA!,
      0,
      redisKey,
      statsKey,
      globalStatsKey,
      limit.toString(),
      windowSize.toString(),
      tokensRequested.toString(),
      now.toString()
    );

    console.log("RAW REDIS RESULT:", raw);

    const allowed = raw[0] === 1;

    return {
      allowed,
      algorithmName: "sliding window",
      tokensRemaining: raw[1],
      retryAfterTime: raw[2],
      resetTime: raw[3],
      blockedRequests: raw[4],
      totalRequests: raw[5],
      allowedRequests: raw[6],
    };
  } catch (error: any) {

    if (error.message && error.message.includes('NOSCRIPT')) {
      console.log('Script not found on node, using EVAL instead');
      
      const raw: any = await redis.eval(
        slidingWindowScript!,
        0,
        redisKey,
        statsKey,
        globalStatsKey,
        limit.toString(),
        windowSize.toString(),
        tokensRequested.toString(),
        now.toString()
      );

      console.log("RAW REDIS RESULT (EVAL):", raw);

      const allowed = raw[0] === 1;

      return {
        allowed,
        algorithmName: "sliding window",
        tokensRemaining: raw[1],
        retryAfterTime: raw[2],
        resetTime: raw[3],
        blockedRequests: raw[4],
        totalRequests: raw[5],
        allowedRequests: raw[6],
      };
    }
    throw error;
  }
}