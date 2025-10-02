const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const API_KEY = process.env.WEBSOCKET_API_KEY || 'default-api-key';
const CORS_ORIGINS = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'];

// Create HTTP server with health check
const server = http.createServer((req, res) => {
	// Add CORS headers
	const origin = req.headers.origin;
	if (CORS_ORIGINS.includes('*') || CORS_ORIGINS.includes(origin)) {
		res.setHeader('Access-Control-Allow-Origin', origin || '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
	}

	if (req.method === 'OPTIONS') {
		res.writeHead(200);
		res.end();
		return;
	}

	if (req.url === '/health') {
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({
			status: 'healthy',
			timestamp: new Date().toISOString(),
			connectedClients: clients.size,
			uptime: process.uptime()
		}));
		return;
	}

	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('WebSocket server is running');
});

// Authentication middleware
function authenticateConnection(req) {
	const url = new URL(req.url, `http://${req.headers.host}`);
	const token = url.searchParams.get('token');
	const apiKey = req.headers['x-api-key'];

	// Check API key for service-to-service communication
	if (apiKey) {
		if (apiKey !== API_KEY) {
			throw new Error('Invalid API key');
		}
		return { type: 'service', authenticated: true };
	}

	// Check JWT token for client authentication
	if (token) {
		try {
			const decoded = jwt.verify(token, JWT_SECRET);
			return { type: 'client', authenticated: true, user: decoded };
		} catch (error) {
			throw new Error('Invalid JWT token');
		}
	}

	throw new Error('No authentication provided');
}

// Rate limiting
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

function checkRateLimit(clientId) {
	const now = Date.now();
	const clientData = rateLimiter.get(clientId) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

	if (now > clientData.resetTime) {
		clientData.count = 1;
		clientData.resetTime = now + RATE_LIMIT_WINDOW;
	} else {
		clientData.count++;
	}

	rateLimiter.set(clientId, clientData);
	return clientData.count <= RATE_LIMIT_MAX_REQUESTS;
}

// Create WebSocket server instance with authentication
const wss = new WebSocket.Server({ 
	server,
	verifyClient: (info) => {
		try {
			const authResult = authenticateConnection(info.req);
			info.req.authResult = authResult;
			return true;
		} catch (error) {
			console.log('Authentication failed:', error.message);
			return false;
		}
	}
});

// Store connected clients with metadata
const clients = new Map();

// WebSocket connection handler
wss.on('connection', (ws, req) => {
	const authResult = req.authResult;
	const clientId = crypto.randomUUID();
	const clientIP = req.socket.remoteAddress;

	console.log(`New ${authResult.type} client connected: ${clientId}`);

	// Store client with metadata
	clients.set(clientId, {
		ws,
		type: authResult.type,
		user: authResult.user,
		connectedAt: new Date(),
		lastActivity: new Date(),
		ip: clientIP,
		messageCount: 0
	});

	// Send welcome message
	ws.send(
		JSON.stringify({
			type: 'connection',
			message: 'Connected to WebSocket server',
			clientId: clientId,
			authenticated: true
		})
	);

	// Message handler
	ws.on('message', (message) => {
		try {
			const client = clients.get(clientId);
			if (!client) return;

			// Update client activity
			client.lastActivity = new Date();
			client.messageCount++;

			// Check rate limit
			if (!checkRateLimit(clientId)) {
				ws.send(JSON.stringify({
					type: 'error',
					message: 'Rate limit exceeded',
					code: 'RATE_LIMIT_EXCEEDED'
				}));
				return;
			}

			const data = JSON.parse(message);
			console.log(`Received from ${clientId}:`, data);

			// Add metadata to message
			data.from = clientId;
			data.timestamp = new Date().toISOString();
			data.senderType = client.type;

			// Message validation
			if (!data.type || !data.message) {
				ws.send(JSON.stringify({
					type: 'error',
					message: 'Invalid message format',
					code: 'INVALID_MESSAGE'
				}));
				return;
			}

			// Handle different message types
			switch (data.type) {
				case 'broadcast':
					// Broadcast to all connected clients
					clients.forEach((clientData, id) => {
						if (id !== clientId && clientData.ws.readyState === WebSocket.OPEN) {
							clientData.ws.send(JSON.stringify(data));
						}
					});
					break;

				case 'private':
					// Send to specific client
					if (data.targetClientId) {
						const targetClient = clients.get(data.targetClientId);
						if (targetClient && targetClient.ws.readyState === WebSocket.OPEN) {
							targetClient.ws.send(JSON.stringify(data));
						} else {
							ws.send(JSON.stringify({
								type: 'error',
								message: 'Target client not found',
								code: 'CLIENT_NOT_FOUND'
							}));
						}
					}
					break;

				case 'ping':
					// Respond to ping
					ws.send(JSON.stringify({
						type: 'pong',
						timestamp: new Date().toISOString()
					}));
					break;

				default:
					// Default behavior: broadcast to all clients
					clients.forEach((clientData, id) => {
						if (id !== clientId && clientData.ws.readyState === WebSocket.OPEN) {
							clientData.ws.send(JSON.stringify(data));
						}
					});
			}
		} catch (error) {
			console.error('Error processing message:', error);
			ws.send(JSON.stringify({
				type: 'error',
				message: 'Error processing message',
				code: 'MESSAGE_PROCESSING_ERROR'
			}));
		}
	});

	// Handle client disconnection
	ws.on('close', () => {
		console.log(`Client disconnected: ${clientId}`);
		clients.delete(clientId);
	});

	// Handle errors
	ws.on('error', (error) => {
		console.error(`WebSocket error for ${clientId}:`, error);
		clients.delete(clientId);
	});
});

// Cleanup disconnected clients periodically
setInterval(() => {
	clients.forEach((client, clientId) => {
		if (client.ws.readyState === WebSocket.CLOSED) {
			console.log(`Cleaning up disconnected client: ${clientId}`);
			clients.delete(clientId);
		}
	});
}, 30000); // Clean up every 30 seconds

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
	console.log(`Secure WebSocket server is running on port ${PORT}`);
	console.log(`Health check available at: http://localhost:${PORT}/health`);
});
