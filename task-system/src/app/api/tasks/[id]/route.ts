import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const token = cookies().get("token")?.value;
        const decoded = token ? verifyToken(token) : null;

        if (!decoded) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        const { description, category, ticketNumber, status, date } = await request.json();

        const task = await prisma.task.update({
            where: { id, userId: decoded.id },
            data: {
                description,
                category,
                ticketNumber,
                status,
                date: date ? new Date(date) : undefined
            }
        });

        return NextResponse.json(task);
    } catch (error) {
        console.error("PUT Task Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const token = cookies().get("token")?.value;
        const decoded = token ? verifyToken(token) : null;

        if (!decoded) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;

        await prisma.task.delete({
            where: { id, userId: decoded.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE Task Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
