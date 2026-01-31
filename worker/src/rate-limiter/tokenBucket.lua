---@diagnostic disable: undefined-global

local redisKey = KEYS[1]

local limit = tonumber(ARGV[1]) or 0
local refillRatePerSec = tonumber(ARGV[2])
local currentTime = tonumber(ARGV[3]) -- MUST be in ms
local tokenRequested = tonumber(ARGV[4])

local lastRefillKey = redisKey .. ":last_refill"

local lastRefillTime = tonumber(redis.call("GET", lastRefillKey))
if not lastRefillTime then
    lastRefillTime = currentTime
end

local currentTokens = tonumber(redis.call("GET", redisKey)) or limit

local elapsedSec = (currentTime - lastRefillTime) / 1000
local tokensToAdd = math.floor(elapsedSec * refillRatePerSec)

if tokensToAdd > 0 then
    currentTokens = math.min(limit, currentTokens + tokensToAdd)
    redis.call("SET", lastRefillKey, currentTime)
end

if tokenRequested > currentTokens then
    local retryAfterMs = math.ceil((tokenRequested - currentTokens) / refillRatePerSec * 1000)
    return { 0, currentTokens, retryAfterMs }
end

currentTokens = currentTokens - tokenRequested
redis.call("SET", redisKey, currentTokens)

local ttlMs = math.ceil((limit / refillRatePerSec) * 1000)
redis.call("PEXPIRE", redisKey, ttlMs)
redis.call("PEXPIRE", lastRefillKey, ttlMs)

return { 1, currentTokens, 0 }
