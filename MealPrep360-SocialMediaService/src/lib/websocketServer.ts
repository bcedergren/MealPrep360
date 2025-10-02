import { WebSocketServer, WebSocket } from 'ws';
import connectDB from './mongodb';
import { Notification, INotification } from '@/models/Notification';

const PORT = parseInt(process.env.WS_PORT || '8080', 10);

const wss = new WebSocketServer({ port: PORT });

interface ClientMap {
        [userId: string]: Set<WebSocket>;
}

const clients: ClientMap = {};

wss.on('connection', (ws: WebSocket, req) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const userId = url.searchParams.get('userId');
        if (!userId) {
                ws.close();
                return;
        }

        if (!clients[userId]) {
                clients[userId] = new Set();
        }
        clients[userId].add(ws);

        ws.on('close', () => {
                clients[userId].delete(ws);
                if (clients[userId].size === 0) {
                        delete clients[userId];
                }
        });
});

async function startNotificationStream() {
        await connectDB();
        const changeStream = Notification.watch([], { fullDocument: 'updateLookup' });
        changeStream.on('change', (change) => {
                if (change.operationType === 'insert') {
                        const notification = change.fullDocument as INotification;
                        const userClients = clients[notification.userId];
                        if (!userClients) {
                                return;
                        }
                        const message = JSON.stringify({
                                type: 'notification',
                                data: notification,
                        });
                        for (const client of userClients) {
                                if (client.readyState === WebSocket.OPEN) {
                                        client.send(message);
                                }
                        }
                }
        });
}

startNotificationStream().catch((err) => {
        console.error('Failed to start notification stream:', err);
});

console.log(`WebSocket server listening on ws://localhost:${PORT}`);

