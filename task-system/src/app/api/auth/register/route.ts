import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const { email, password, name } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
            },
        });

        const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });

        const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
        response.cookies.set("token", token, { httpOnly: true, path: "/" });

        return response;
    } catch (error) {
        console.error("Register Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
