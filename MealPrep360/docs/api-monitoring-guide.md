# API Monitoring & Failure Detection Guide

## Overview

This application now includes comprehensive API monitoring to help you track when external API calls fail and understand the health of your `api.mealprep360.com` service.

> **Note**: The visual API health monitor is only available to users with ADMIN role. Console monitoring and health endpoint remain accessible to all authenticated users.

## Monitoring Features

### 1. Real-Time Visual Monitor

**Access**: Click the small status indicator in the footer or press `Ctrl+Shift+A` _(Admin users only)_

**Features**:

- ✅/❌ API health status indicator
- 🔴 Circuit breaker status
- Real-time call statistics (total, failed, fallbacks)
- Live feed of recent API calls with response times
- Color-coded status indicators

### 2. Console Monitoring

**Access**: Open browser DevTools → Console tab

**Features**:

- Structured logging of all API failures
- Detailed error information with timestamps
- Fallback response notifications
- Success logging (when enabled)

### 3. Health Check Endpoint

**Access**: `GET /api/health`

**Purpose**: Direct external API connectivity test that bypasses middleware

**Response Example**:

```json
{
	"status": "unhealthy",
	"externalApiAvailable": false,
	"responseTime": 5000,
	"timestamp": "2025-07-02T17:50:00.000Z",
	"error": {
		"type": "connection_reset",
		"message": "Connection reset by external API"
	},
	"message": "External API is not accessible - fallback mode active"
}
```

## How to Monitor API Failures

### Quick Status Check

1. **Visual Indicator**: Look at the footer of your app

   - 🟢 Green = API healthy
   - 🔴 Red = API having issues
   - Numbers in parentheses = fallback responses served

2. **Detailed View**: Click the indicator or press `Ctrl+Shift+A` to see:
   - Current health status
   - Circuit breaker state
   - Recent API calls with timestamps
   - Response times and error details

### Console Investigation

1. **Open DevTools**: F12 → Console tab

2. **View Detailed Report**: Press `Ctrl+Shift+R` to see:

   ```
   📊 API Health Report
   ┌─────────────────────┬─────────┐
   │ totalCalls          │ 25      │
   │ failedCalls         │ 8       │
   │ fallbackCalls       │ 5       │
   │ uptime              │ 68.0%   │
   └─────────────────────┬─────────┘
   ```

3. **Real-time Failure Logs**: Automatically logged as they happen:
   ```
   🚨 API Failure: /api/subscription
   Error: fetch failed
   Time: 5:50:23 PM
   Total Failures Today: 8
   Current Uptime: 68.0%
   ```

### Understanding the Circuit Breaker

**When it Opens**: After 5 consecutive failures
**What it Does**: Stops trying external API for 30 seconds
**Status**: Shows as 🔴 Open in the monitor
**Recovery**: Automatically resets when API becomes available

## Error Types You Might See

| Error Type         | Meaning                           | Action                               |
| ------------------ | --------------------------------- | ------------------------------------ |
| `connection_reset` | Server dropped connection         | Usually temporary, wait for recovery |
| `timeout`          | Request took too long             | Network or server performance issue  |
| `dns_error`        | Can't resolve api.mealprep360.com | DNS or domain issue                  |
| `network_error`    | General network failure           | Check internet connection            |
| `fetch failed`     | Generic fetch error               | Often ECONNRESET, temporary          |

## Fallback Mode

When the external API fails, the app automatically switches to fallback mode:

- ✅ **Subscription**: Returns FREE plan
- ✅ **Settings**: Returns default settings
- ✅ **Recipes**: Returns empty list
- ✅ **Shopping Lists**: Returns empty array
- ✅ **Meal Plans**: Returns empty list

**User Notification**: Orange toast notification appears: "⚠️ Running in offline mode"

## Debugging Steps

### 1. Check Overall Health

```javascript
// In browser console:
apiMonitor.printReport();
```

### 2. Test Direct Connectivity

```bash
# Check if external API is reachable:
curl https://api.mealprep360.com/api/health
```

### 3. Check Health Endpoint

Visit: `http://localhost:3000/api/health`

### 4. Monitor Live Calls

Keep the API monitor open (`Ctrl+Shift+A`) while using the app

### 5. Review Console Logs

Look for patterns in:

- Middleware debug logs
- Retry attempts
- Circuit breaker state changes

## Keyboard Shortcuts

- `Ctrl+Shift+A` - Toggle API health monitor _(Admin only)_
- `Ctrl+Shift+R` - Print detailed health report to console

## Troubleshooting Common Issues

### High Failure Rate

1. Check if `api.mealprep360.com` is down
2. Verify DNS resolution
3. Check network connectivity
4. Look for patterns in error types

### Circuit Breaker Stuck Open

1. Wait 30 seconds for automatic reset
2. Check if external API is actually working
3. Monitor for successful calls after reset

### Fallback Responses Not Working

1. Check browser console for errors
2. Verify middleware is processing requests
3. Look for "X-Fallback-Response" headers

### Performance Issues

1. Monitor response times in the health monitor
2. Check if circuit breaker is triggering appropriately
3. Review retry patterns and timeouts

## Monitoring in Production

For production monitoring, consider:

1. Setting up external monitoring for `api.mealprep360.com`
2. Adding metrics collection for uptime/downtime
3. Creating alerts for extended outages
4. Logging fallback usage rates

## Admin Access

To grant ADMIN role to a user:

1. **Database Access**: Connect to your MongoDB database
2. **Find User**: Locate the user by their Clerk ID or email:
   ```javascript
   db.users.findOne({ email: 'admin@example.com' });
   ```
3. **Update Role**: Set the role to 'ADMIN':
   ```javascript
   db.users.updateOne(
   	{ email: 'admin@example.com' },
   	{ $set: { role: 'ADMIN' } }
   );
   ```
4. **Verify**: The API health monitor will appear in the footer on next login

## Technical Details

- **Retry Logic**: 2 retries with 1-second delays
- **Timeout**: 10 seconds per request
- **Circuit Breaker**: 5 failures threshold, 30-second timeout
- **Cleanup**: Logs are cleaned up every hour (keeps 24 hours)
- **Headers**: Fallback responses include `X-Fallback-Response: true`
- **Role-Based Access**: Visual monitor restricted to ADMIN role only
