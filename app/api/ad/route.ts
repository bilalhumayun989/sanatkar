import { NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';

const defaultAd = {
  isActive: false,
  title: '',
  description: '',
  buttonText: '',
  buttonLink: '',
  imageUrl: '',
  badgeText: '',
};

export async function GET() {
  try {
    const ad = await prisma.ad.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, ad: ad ?? defaultAd });
  } catch (error) {
    console.error('Ad configuration query failed:', error);
    return NextResponse.json({ success: false, ad: defaultAd, message: 'Unable to load ad configuration.' }, { status: 500 });
  }
}
