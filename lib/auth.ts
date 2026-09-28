import { SignJWT, jwtVerify } from 'jose';

export const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only_123';
const key = new TextEncoder().encode(JWT_SECRET);

export async function signToken(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(key);
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, key);
        return payload;
    } catch (error) {
        return null; // Token is invalid or expired
    }
}
