import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const token = cookies().get("token")?.value;
        const decoded = token ? verifyToken(token) : null;

        if (!decoded) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                lastLogin: true
            }
        });

        if (!user) {
            console.log(`[AUTH_ME] User not found for ID: ${decoded.id}`);
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        console.log(`[AUTH_ME] ID: ${user.id} | Email: ${user.email} | Role: ${user.role}`);
        return NextResponse.json(user);
    } catch (error) {
        console.error("Profile Fetch Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
