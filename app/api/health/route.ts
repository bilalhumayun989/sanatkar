import { NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';

export async function GET() {
    const checks = {
        api: 'OK',
        timestamp: new Date().toISOString(),
        database: 'CHECKING',
        env: {
            hasDbUrl: !!process.env.DATABASE_URL,
            hasJwtSecret: !!process.env.JWT_SECRET,
            nodeEnv: process.env.NODE_ENV,
        }
    };

    try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`;
        checks.database = 'CONNECTED';
    } catch (error: any) {
        checks.database = `ERROR: ${error.message}`;
    }

    return NextResponse.json(checks, { status: 200 });
}
