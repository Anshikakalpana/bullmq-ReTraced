import  redis from "../utils/redis.js";
import fs from "fs";
import path from "path";

let tokenBucketSHA: string | null = null;


async function loadTokenBucketScript() {
  if (!tokenBucketSHA) {
    const luaScript = fs.readFileSync(
      path.join(process.cwd(), "src/algo-lua/tokenBucket.lua"),
      "utf8"
    );

   tokenBucketSHA = await (redis as any).script("load", luaScript);

    console.log("Token Bucket Script SHA Loaded:", tokenBucketSHA);
  }
  return tokenBucketSHA;
}


export async function tokenBucketAlgorithm(
  key: string,
  limit: number,
  refillRatePerSecond: number,
  tokensRequested: number
) {
  await loadTokenBucketScript();

  const redisKey = `token_bucket:{${key}}`;

  const now = Date.now(); // ✅ ms

  const raw: any = await redis.evalsha(
    tokenBucketSHA!,
    1, // ✅ only 1 key
    redisKey,
    limit.toString(),
    refillRatePerSecond.toString(),
    now.toString(),
    tokensRequested.toString()
  );

  return {
    allowed: raw[0] === 1,
    algorithmName: "token bucket",
    tokensRemaining: raw[1],
    retryAfterMs: raw[2],
  };
}
