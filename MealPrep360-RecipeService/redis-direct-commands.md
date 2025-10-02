# Redis Direct Commands for MealPrep360 Recipe Service

## 🔌 Connecting to Redis

### Using Redis CLI

```bash
# If you have redis-cli installed locally
redis-cli -h <REDIS_HOST> -p <REDIS_PORT> -a <REDIS_PASSWORD>

# Or with username
redis-cli -h <REDIS_HOST> -p <REDIS_PORT> --user <REDIS_USER> --pass <REDIS_PASSWORD>
```

### Using RedisInsight or Another GUI

Connect using your Redis credentials to get a visual interface.

## 📋 Key Queue Names

The service uses these Redis keys:

- `recipe-generation-queue` - Queue for recipe generation jobs
- `image-generation-queue` - Queue for image generation jobs

## 🔍 Diagnostic Commands

### 1. Check Queue Lengths

```redis
# Check recipe generation queue length
LLEN recipe-generation-queue

# Check image generation queue length
LLEN image-generation-queue
```

### 2. View Queue Contents (Without Removing)

```redis
# View all messages in recipe queue
LRANGE recipe-generation-queue 0 -1

# View first 5 messages
LRANGE recipe-generation-queue 0 4

# View all messages in image queue
LRANGE image-generation-queue 0 -1
```

### 3. Inspect a Specific Message

Each message is a JSON string with format: `{"jobId":"<uuid>","season":"<season>"}`

```redis
# Get the first message without removing it
LINDEX recipe-generation-queue 0
```

### 4. Check All Keys

```redis
# List all keys (be careful in production)
KEYS *

# List keys matching pattern
KEYS *queue*
KEYS recipe-*
```

## 🛠️ Management Commands

### 1. Remove a Specific Message

```redis
# Remove one instance of a specific message
LREM recipe-generation-queue 1 '{"jobId":"specific-job-id","season":"fall"}'
```

### 2. Move Message Between Queues

```redis
# Move from one queue to another (atomic operation)
RPOPLPUSH recipe-generation-queue recipe-generation-queue-backup
```

### 3. Clear a Queue (⚠️ Use with Caution)

```redis
# Delete entire queue
DEL recipe-generation-queue

# Or rename for backup
RENAME recipe-generation-queue recipe-generation-queue-old
```

### 4. Process Messages Manually

```redis
# Pop and get a message (removes it from queue)
RPOP recipe-generation-queue

# Pop from right and push to left (requeue)
RPOPLPUSH recipe-generation-queue recipe-generation-queue
```

## 📊 Monitoring Commands

### 1. Monitor Real-time Commands

```redis
# Watch all Redis commands in real-time
MONITOR
```

### 2. Check Redis Info

```redis
# Get server information
INFO

# Get specific sections
INFO clients
INFO memory
INFO stats
```

### 3. Check Queue Activity

```redis
# Get queue length history (if tracking)
LLEN recipe-generation-queue
# Run multiple times to see if it's changing
```

## 🔧 Troubleshooting Scripts

### 1. List All Job Messages with Details

```bash
# In redis-cli, you can run Lua scripts
EVAL "
local messages = redis.call('LRANGE', KEYS[1], 0, -1)
local result = {}
for i, msg in ipairs(messages) do
    table.insert(result, i .. ': ' .. msg)
end
return result
" 1 recipe-generation-queue
```

### 2. Count Messages by Season

```bash
EVAL "
local messages = redis.call('LRANGE', KEYS[1], 0, -1)
local seasons = {}
for _, msg in ipairs(messages) do
    local data = cjson.decode(msg)
    seasons[data.season] = (seasons[data.season] or 0) + 1
end
local result = {}
for season, count in pairs(seasons) do
    table.insert(result, season .. ': ' .. count)
end
return result
" 1 recipe-generation-queue
```

## 🚨 Emergency Actions

### 1. Backup Queue Before Changes

```redis
# Create backup of queue
EVAL "
local messages = redis.call('LRANGE', KEYS[1], 0, -1)
for _, msg in ipairs(messages) do
    redis.call('LPUSH', KEYS[2], msg)
end
return #messages
" 2 recipe-generation-queue recipe-generation-queue-backup
```

### 2. Requeue Failed Messages

If you have job IDs that need to be requeued:

```redis
# Add a job back to queue
LPUSH recipe-generation-queue '{"jobId":"your-job-id","season":"fall"}'
```

### 3. Clear Stuck Messages

```redis
# Remove all messages for a specific job ID (using Lua)
EVAL "
local messages = redis.call('LRANGE', KEYS[1], 0, -1)
local removed = 0
for _, msg in ipairs(messages) do
    local data = cjson.decode(msg)
    if data.jobId == ARGV[1] then
        redis.call('LREM', KEYS[1], 1, msg)
        removed = removed + 1
    end
end
return removed
" 1 recipe-generation-queue "job-id-to-remove"
```

## 📝 Common Scenarios

### Scenario 1: Jobs Stuck in Queue

```redis
# 1. Check queue length
LLEN recipe-generation-queue

# 2. View messages
LRANGE recipe-generation-queue 0 -1

# 3. If workers aren't running, messages will accumulate here
```

### Scenario 2: Clear Test Messages

```redis
# Remove all test messages (containing specific pattern)
EVAL "
local messages = redis.call('LRANGE', KEYS[1], 0, -1)
local removed = 0
for _, msg in ipairs(messages) do
    if string.find(msg, 'test') then
        redis.call('LREM', KEYS[1], 1, msg)
        removed = removed + 1
    end
end
return removed
" 1 recipe-generation-queue
```

### Scenario 3: Move Dead Letters

```redis
# Move messages to dead letter queue for investigation
EVAL "
local count = 0
while redis.call('LLEN', KEYS[1]) > 0 do
    local msg = redis.call('RPOP', KEYS[1])
    if msg then
        redis.call('LPUSH', KEYS[2], msg)
        count = count + 1
    end
end
return count
" 2 recipe-generation-queue recipe-generation-queue-dead

# Then inspect dead letter queue
LRANGE recipe-generation-queue-dead 0 -1
```

## ⚡ Quick Status Check

Run these commands in sequence for a quick health check:

```redis
# 1. Check both queue lengths
LLEN recipe-generation-queue
LLEN image-generation-queue

# 2. Peek at first message in each
LINDEX recipe-generation-queue 0
LINDEX image-generation-queue 0

# 3. Check Redis memory usage
INFO memory

# 4. Check connected clients (workers would show as clients)
CLIENT LIST
```

## 🔐 Safety Notes

1. **Always backup queues** before bulk operations
2. **Use LINDEX** to view without removing
3. **Use transactions (MULTI/EXEC)** for atomic operations
4. **Monitor queue lengths** to detect processing issues
5. **Don't use KEYS in production** - use SCAN instead for large datasets
