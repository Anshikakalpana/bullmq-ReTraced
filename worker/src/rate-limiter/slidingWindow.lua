---@diagnostic disable: undefined-global

local redisKey = KEYS[1]
local statsKey = KEYS[2]
local globalStats = KEYS[3]

local limit = tonumber(ARGV[1])
local windowSize = tonumber(ARGV[2])      -- in ms
local tokensRequested = tonumber(ARGV[3])
local currentTime = tonumber(ARGV[4])     -- in ms

-- Window boundary
local windowStart = currentTime - windowSize

-- Remove old timestamps
redis.call("ZREMRANGEBYSCORE", redisKey, 0, windowStart)

-- Current request count
local count = tonumber(redis.call("ZCARD", redisKey)) or 0
local newCount = count + tokensRequested

-- If limit exceeded → block
if newCount > limit then
    local blocked = redis.call("HINCRBY", statsKey, "blocked", 1)
    local total = redis.call("HINCRBY", statsKey, "total", 1)

    redis.call("HINCRBY", globalStats, "blocked", 1)
    redis.call("HINCRBY", globalStats, "total", 1)

    return {
        0,                          -- blocked
        limit - count,              -- remaining
        (windowStart + windowSize) - currentTime, -- retry after
        windowStart + windowSize,   -- window reset time
        blocked,                    -- blocked count
        total,                      -- total count
          tonumber(redis.call("HGET", statsKey, "allowed")) or 0
    }
end

-- Allow the request
-- Only store timestamp entries
local id = tostring(currentTime) .. "-" .. tostring(math.random())
redis.call("ZADD", redisKey, currentTime, id)

-- Expire key after window
redis.call("EXPIRE", redisKey, math.floor(windowSize/1000) + 1)

local allowed = redis.call("HINCRBY", statsKey, "allowed", 1)
local total = redis.call("HINCRBY", statsKey, "total", 1)

redis.call("HINCRBY", globalStats, "allowed", 1)
redis.call("HINCRBY", globalStats, "total", 1)

return {

    1,                          -- allowed
    limit - newCount,           -- remaining
    (windowStart + windowSize) - currentTime,  -- retry after
    windowStart + windowSize,   -- window reset time
    allowed,                    -- allowed count
    total,                      -- total count
    tonumber(redis.call("HGET", statsKey, "blocked")) or 0

}
