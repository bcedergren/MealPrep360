# 🔐 How to Get Your Authentication Token for API Testing

This guide helps you get a valid JWT token for testing MealPrep360 API endpoints in the Swagger UI.

## ❌ Common Authentication Issues

If you're getting 401 Unauthorized errors, it's usually because:

1. **Token is expired** - Clerk tokens expire frequently
2. **Wrong token format** - Using a token that's not from Clerk
3. **Including "Bearer "** - Swagger UI adds this automatically
4. **Old cached token** - Using a stale token from localStorage

## ✅ Step-by-Step Token Setup

### Step 1: Log Into Your Main Application

1. Open a new browser tab
2. Go to your MealPrep360 application URL
3. **Make sure you are fully logged in**
4. Keep this tab open during API testing

### Step 2: Get a Fresh Token

1. In your logged-in application tab, open **Browser Developer Tools** (F12)
2. Go to the **Network** tab
3. **Refresh the page** or navigate to any section of your app
4. Look for any API request (usually to `/api/user`, `/api/recipes`, etc.)
5. Click on the request to view details
6. In the **Request Headers** section, find the `Authorization` header
7. Copy **ONLY** the JWT token part (everything after `Bearer `)

**Example:**

```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhenAiOiJodHRwczovL2V4YW1wbGUuY2xlcmsuYWNjb3VudHMuZGV2IiwibmJmIjoxNjk...
```

**Copy this part:** `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhenAiOiJodHRwczovL2V4YW1wbGUuY2xlcmsuYWNjb3VudHMuZGV2IiwibmJmIjoxNjk...`

### Step 3: Set Token in Swagger UI

1. Go back to your API documentation page (`/docs`)
2. Click the **🔒 Authorize** button (top-right area)
3. You'll see "ClerkAuth (http, Bearer)" - click **Authorize** next to it
4. In the **Value** field, paste your JWT token
   - ⚠️ **DO NOT** include "Bearer " - Swagger adds this automatically
   - ✅ **Just paste the token directly**
5. Click **Authorize**
6. Click **Close**

### Step 4: Test Authentication

1. First, test the **`/api/test-auth`** endpoint - this gives detailed feedback
2. Then test **`/api/user`** endpoint
3. If both work, you're ready to test other endpoints

## 🔧 Troubleshooting

### If you still get 401 errors:

**Check Token Format:**

- Token should start with `eyJ` (JWT format)
- Should be very long (500+ characters)
- Should NOT include "Bearer " in the Swagger UI field

**Check Token Freshness:**

- Get a NEW token from a current browser session
- Don't reuse old tokens from yesterday/earlier sessions
- Clerk tokens expire frequently for security

**Verify Application Login:**

- Make sure you're actually logged in to the main app
- Try logging out and back in
- Verify the Network tab shows Authorization headers in requests

**Common Mistakes:**

- ❌ Using localStorage tokens (often expired)
- ❌ Including "Bearer " in Swagger UI value field
- ❌ Using tokens from different environments (dev vs prod)
- ❌ Using API keys instead of session tokens

## 🛠️ Debug Endpoints

Use these endpoints to diagnose authentication issues:

- **`/api/test-auth`** - Simple auth test with detailed error messages
- **`/api/auth/token`** - Detailed authentication status and debugging info
- **`/api/user`** - Basic user info (good first test)

## 📝 Token Validation Checklist

Before testing other endpoints, verify your token:

- [ ] I am logged into the main MealPrep360 application
- [ ] I got the token from a current Network request (not localStorage)
- [ ] The token starts with `eyJ`
- [ ] I did NOT include "Bearer " in the Swagger UI value field
- [ ] The `/api/test-auth` endpoint returns success
- [ ] I can see the 🔒 lock icon next to endpoint names in Swagger UI

## 💡 Pro Tips

1. **Keep your main app tab open** - this maintains your session
2. **Get fresh tokens frequently** - they expire for security
3. **Test simple endpoints first** - `/api/test-auth`, then `/api/user`
4. **Check the console** - look for detailed debug information
5. **Use incognito mode** to test from scratch if needed

---

If you're still having issues after following this guide, the token might be from a different Clerk environment or there could be a configuration issue. Check with your development team.
