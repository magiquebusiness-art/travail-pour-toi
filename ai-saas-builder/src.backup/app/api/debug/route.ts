/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { getDB } from '@/lib/db'


export async function GET() {
  try {
    const db = await getDB()

    // Test DB connection with a simple query
    const testResult = await db.prepare('SELECT 1 as test').first()

    return NextResponse.json({
      database: testResult ? 'connected' : 'error',
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('NEXT_PUBLIC') || k.includes('JWT_SECRET') || k.includes('DB')),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
