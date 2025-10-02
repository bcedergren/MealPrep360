import { NextResponse, NextRequest } from 'next/server';
import { recipeCache, createCacheKey } from '@/lib/cache';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60; // 1 minute window
const RATE_LIMIT_MAX_ATTEMPTS = 3; // Max attempts per window
const BAN_DURATION = 3600; // 1 hour ban
const LONG_BAN_DURATION = 86400; // 24 hour ban for persistent offenders

interface SecurityEvent {
	ip: string;
	userAgent: string;
	timestamp: Date;
	headers: Record<string, string>;
	queryParams: Record<string, string>;
	attempts: number;
	banned: boolean;
	banExpiry?: Date;
}

function getClientIP(request: NextRequest): string {
	// Try to get real IP from various headers (for reverse proxy setups)
	const forwardedFor = request.headers.get('x-forwarded-for');
	const realIP = request.headers.get('x-real-ip');
	const cfConnectingIP = request.headers.get('cf-connecting-ip');

	if (forwardedFor) {
		return forwardedFor.split(',')[0].trim();
	}
	if (realIP) {
		return realIP;
	}
	if (cfConnectingIP) {
		return cfConnectingIP;
	}

	// Fallback to connection IP
	return request.ip || 'unknown';
}

function logSecurityEvent(event: SecurityEvent): void {
	console.error('[SECURITY] WordPress scanner detected:', {
		ip: event.ip,
		userAgent: event.userAgent,
		timestamp: event.timestamp.toISOString(),
		attempts: event.attempts,
		banned: event.banned,
		headers: {
			'x-forwarded-for': event.headers['x-forwarded-for'],
			'x-real-ip': event.headers['x-real-ip'],
			'cf-connecting-ip': event.headers['cf-connecting-ip'],
			host: event.headers['host'],
			referer: event.headers['referer'],
		},
		queryParams: event.queryParams,
	});
}

function checkRateLimit(ip: string): {
	allowed: boolean;
	attempts: number;
	banned: boolean;
	banExpiry?: Date;
} {
	const rateLimitKey = createCacheKey('rate-limit', { ip });
	const banKey = createCacheKey('banned-ip', { ip });

	// Check if IP is banned
	const banData = recipeCache.get<{ banExpiry: Date; attempts: number }>(
		banKey
	);
	if (banData && new Date() < new Date(banData.banExpiry)) {
		return {
			allowed: false,
			attempts: banData.attempts,
			banned: true,
			banExpiry: new Date(banData.banExpiry),
		};
	}

	// Get current rate limit data
	const rateLimitData = recipeCache.get<{
		attempts: number;
		firstAttempt: Date;
	}>(rateLimitKey);
	const now = new Date();

	if (!rateLimitData) {
		// First attempt
		recipeCache.set(
			rateLimitKey,
			{ attempts: 1, firstAttempt: now },
			RATE_LIMIT_WINDOW
		);
		return { allowed: true, attempts: 1, banned: false };
	}

	const windowStart = new Date(rateLimitData.firstAttempt.getTime());
	const windowEnd = new Date(windowStart.getTime() + RATE_LIMIT_WINDOW * 1000);

	if (now > windowEnd) {
		// Window expired, reset
		recipeCache.set(
			rateLimitKey,
			{ attempts: 1, firstAttempt: now },
			RATE_LIMIT_WINDOW
		);
		return { allowed: true, attempts: 1, banned: false };
	}

	// Within window
	const newAttempts = rateLimitData.attempts + 1;
	recipeCache.set(
		rateLimitKey,
		{ ...rateLimitData, attempts: newAttempts },
		RATE_LIMIT_WINDOW
	);

	if (newAttempts > RATE_LIMIT_MAX_ATTEMPTS) {
		// Rate limit exceeded, ban the IP
		const totalAttempts = banData
			? banData.attempts + newAttempts
			: newAttempts;
		const banDuration = totalAttempts > 10 ? LONG_BAN_DURATION : BAN_DURATION;
		const banExpiry = new Date(now.getTime() + banDuration * 1000);

		recipeCache.set(
			banKey,
			{ banExpiry, attempts: totalAttempts },
			banDuration
		);

		return {
			allowed: false,
			attempts: newAttempts,
			banned: true,
			banExpiry,
		};
	}

	return {
		allowed: newAttempts <= RATE_LIMIT_MAX_ATTEMPTS,
		attempts: newAttempts,
		banned: false,
	};
}

// Fake WordPress setup page HTML
const FAKE_WORDPRESS_RESPONSE = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	<meta name="viewport" content="width=device-width">
	<title>WordPress &rsaquo; Setup Configuration File</title>
	<link rel="stylesheet" id="dashicons-css" href="/wp-includes/css/dashicons.min.css" type="text/css" media="all" />
	<link rel="stylesheet" id="buttons-css" href="/wp-includes/css/buttons.min.css" type="text/css" media="all" />
	<link rel="stylesheet" id="forms-css" href="/wp-admin/css/forms.min.css" type="text/css" media="all" />
	<link rel="stylesheet" id="l10n-css" href="/wp-admin/css/l10n.min.css" type="text/css" media="all" />
	<link rel="stylesheet" id="install-css" href="/wp-admin/css/install.min.css" type="text/css" media="all" />
</head>
<body class="wp-core-ui">
<p id="logo">WordPress</p>

<h1>Welcome</h1>
<p>Welcome to the famous five-minute WordPress installation process! Just fill in the information below and you'll be on your way to using the most extendable and powerful personal publishing platform in the world.</p>

<h2>Information needed</h2>
<p>Please provide the following information. Don't worry, you can always change these settings later.</p>

<form method="post" action="setup-config.php?step=2">
	<table class="form-table">
		<tr>
			<th scope="row"><label for="dbname">Database Name</label></th>
			<td><input name="dbname" id="dbname" type="text" size="25" value="" /></td>
			<td>The name of the database you want to use with WordPress.</td>
		</tr>
		<tr>
			<th scope="row"><label for="uname">Username</label></th>
			<td><input name="uname" id="uname" type="text" size="25" value="" /></td>
			<td>Your database username.</td>
		</tr>
		<tr>
			<th scope="row"><label for="pwd">Password</label></th>
			<td><input name="pwd" id="pwd" type="text" size="25" value="" autocomplete="off" /></td>
			<td>Your database password.</td>
		</tr>
		<tr>
			<th scope="row"><label for="dbhost">Database Host</label></th>
			<td><input name="dbhost" id="dbhost" type="text" size="25" value="localhost" /></td>
			<td>You should be able to get this info from your web host, if <code>localhost</code> doesn't work.</td>
		</tr>
		<tr>
			<th scope="row"><label for="prefix">Table Prefix</label></th>
			<td><input name="prefix" id="prefix" type="text" value="wp_" size="25" /></td>
			<td>If you want to run multiple WordPress installations in a single database, change this.</td>
		</tr>
	</table>
	<p class="step"><input name="submit" type="submit" value="Submit" class="button button-large" /></p>
</form>
</body>
</html>`;

export async function GET(request: NextRequest) {
	const ip = getClientIP(request);
	const userAgent = request.headers.get('user-agent') || 'unknown';
	const url = new URL(request.url);

	// Extract all headers for logging
	const headers: Record<string, string> = {};
	request.headers.forEach((value, key) => {
		headers[key] = value;
	});

	// Extract query parameters
	const queryParams: Record<string, string> = {};
	url.searchParams.forEach((value, key) => {
		queryParams[key] = value;
	});

	// Check rate limiting
	const rateLimitResult = checkRateLimit(ip);

	// Create security event
	const event: SecurityEvent = {
		ip,
		userAgent,
		timestamp: new Date(),
		headers,
		queryParams,
		attempts: rateLimitResult.attempts,
		banned: rateLimitResult.banned,
		banExpiry: rateLimitResult.banExpiry,
	};

	// Log the security event
	logSecurityEvent(event);

	// If banned, return a more aggressive response
	if (rateLimitResult.banned) {
		console.error(
			`[SECURITY] Banned IP ${ip} attempted access. Ban expires: ${rateLimitResult.banExpiry?.toISOString()}`
		);

		// Return a more suspicious response for banned IPs
		return new NextResponse('Access Denied', {
			status: 403,
			headers: {
				'X-Blocked': 'Suspicious activity detected',
				'Retry-After': '3600',
			},
		});
	}

	// If rate limited but not banned, return a delayed response
	if (!rateLimitResult.allowed) {
		// Add artificial delay for rate limited requests
		await new Promise((resolve) => setTimeout(resolve, 2000));

		return new NextResponse('Too Many Requests', {
			status: 429,
			headers: {
				'Retry-After': '60',
			},
		});
	}

	// Return fake WordPress setup page
	return new NextResponse(FAKE_WORDPRESS_RESPONSE, {
		status: 200,
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'X-Powered-By': 'PHP/7.4.30',
			Server: 'Apache/2.4.54',
			'Cache-Control': 'no-cache, no-store, must-revalidate',
		},
	});
}

export async function POST(request: NextRequest) {
	// Handle POST requests (form submissions) the same way
	return GET(request);
}

export async function PUT(request: NextRequest) {
	// Handle other HTTP methods
	return GET(request);
}

export async function DELETE(request: NextRequest) {
	// Handle other HTTP methods
	return GET(request);
}

export async function PATCH(request: NextRequest) {
	// Handle other HTTP methods
	return GET(request);
}

export async function HEAD(request: NextRequest) {
	// Handle HEAD requests
	const response = await GET(request);
	// Return same headers but no body
	return new NextResponse(null, {
		status: response.status,
		headers: response.headers,
	});
}

export async function OPTIONS(request: NextRequest) {
	// Handle OPTIONS requests
	return GET(request);
}
