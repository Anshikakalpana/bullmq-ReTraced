
import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || 'redis_cache';
const REDIS_PORT = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;



const redis = createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});


redis.on('connect', () => {
  console.log(' Redis connected successfully');
});

redis.on('error', (err) => {
  console.error(' Redis Error:', err);
});


(async () => {
  try {
    await redis.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    process.exit(1);
  }
})();

export default redis;
export function rPush(rPush: any) {
    throw new Error('Function not implemented.');
}

