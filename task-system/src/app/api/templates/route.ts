import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const token = cookies().get("token")?.value;
        const decoded = token ? verifyToken(token) : null;

        if (!decoded) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const templates = await prisma.template.findMany({
            where: { userId: decoded.id },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(templates);
    } catch (error) {
        console.error("GET Templates Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const token = cookies().get("token")?.value;
        const decoded = token ? verifyToken(token) : null;

        if (!decoded) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, description, category } = await request.json();

        if (!name || !description) {
            return NextResponse.json({ error: "Name and description are required" }, { status: 400 });
        }

        const template = await prisma.template.create({
            data: {
                name,
                description,
                category,
                userId: decoded.id
            }
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("POST Template Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
