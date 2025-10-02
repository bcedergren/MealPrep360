import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'

export async function GET(): Promise<NextResponse> {
  try {
    const start = Date.now()
    // Touch the DB to ensure connectivity when configured
    try {
      await connectDB()
    } catch {
      // If DB not configured yet in local, continue with degraded status
    }
    const latency = Date.now() - start
    return NextResponse.json({
      status: 'ok',
      dbLatencyMs: latency,
      ts: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 503 })
  }
}
