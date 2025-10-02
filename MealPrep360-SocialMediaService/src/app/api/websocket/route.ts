import { NextResponse } from 'next/server';

export async function GET() {
        const websocketUrl =
                process.env.WEBSOCKET_URL || 'ws://localhost:8080';
        return NextResponse.json({
                websocketUrl,
        });
}
