const WebSocket = require('ws');
const http = require('http');

// Create HTTP server
const server = http.createServer((req, res) => {
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('WebSocket server is running');
});

// Create WebSocket server instance
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Set();

// WebSocket connection handler
wss.on('connection', (ws) => {
	console.log('New client connected');
	clients.add(ws);

	// Send welcome message
	ws.send(
		JSON.stringify({
			type: 'connection',
			message: 'Connected to WebSocket server',
		})
	);

	// Message handler
	ws.on('message', (message) => {
		try {
			const data = JSON.parse(message);
			console.log('Received:', data);

			// Broadcast message to all connected clients
			clients.forEach((client) => {
				if (client !== ws && client.readyState === WebSocket.OPEN) {
					client.send(JSON.stringify(data));
				}
			});
		} catch (error) {
			console.error('Error processing message:', error);
		}
	});

	// Handle client disconnection
	ws.on('close', () => {
		console.log('Client disconnected');
		clients.delete(ws);
	});

	// Handle errors
	ws.on('error', (error) => {
		console.error('WebSocket error:', error);
		clients.delete(ws);
	});
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
	console.log(`WebSocket server is running on port ${PORT}`);
});
