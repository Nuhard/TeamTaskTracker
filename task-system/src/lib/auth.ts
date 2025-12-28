import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-this";

export interface SessionUser {
    id: string;
    email: string;
    role: string;
    name: string | null;
}

export function signToken(payload: SessionUser) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

export function verifyToken(token: string): SessionUser | null {
    try {
        return jwt.verify(token, JWT_SECRET) as SessionUser;
    } catch (e: any) {
        console.error("JWT Verification Failed:", e.message);
        return null;
    }
}

export async function getSession(): Promise<SessionUser | null> {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    return verifyToken(token);
}

// Middleware helper to enforce auth
export async function authenticate(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    if (!token) return null;
    return verifyToken(token);
}
