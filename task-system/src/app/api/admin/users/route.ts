import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { hashPassword } from "@/lib/auth"; // Assuming this is exported or I need to implement/import it

export async function GET(request: Request) {
    const user = await authenticate(request as any);
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                tasks: {
                    select: { status: true, category: true, date: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(users);
    } catch (e) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const adminUser = await authenticate(request as any);
    if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { name, email, password, role } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and Password are required" }, { status: 400 });
        }

        // Check availability
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        // Hash (I need to check if hashPassword is exported from lib/auth, otherwise inline it or duplicate)
        // Checking previous view_file of lib/auth.ts... 
        // Logic from register route:
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: role || 'USER'
            }
        });

        const { passwordHash: _, ...userWithoutPass } = newUser;
        return NextResponse.json(userWithoutPass);

    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
    }
}
