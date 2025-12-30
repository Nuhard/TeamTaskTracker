import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const { email, password, requiredRole } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Role restriction check
        if (requiredRole && user.role !== requiredRole) {
            const errorMsg = requiredRole === "ADMIN"
                ? "Access denied: Standard users cannot access the Admin Panel."
                : "Access denied: Admin accounts must use the Admin Login.";
            return NextResponse.json({ error: errorMsg }, { status: 403 });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Update lastLogin
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });

        const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
        response.cookies.set("token", token, { httpOnly: true, path: "/" });

        return response;
    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
