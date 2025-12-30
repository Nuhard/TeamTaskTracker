import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(request: Request) {
    try {
        const token = cookies().get("token")?.value;
        const decoded = token ? verifyToken(token) : null;

        if (!decoded || decoded.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const where: any = {};
        if (status && status !== "ALL") {
            where.status = status;
        }

        if (startDate || endDate) {
            where.date = {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {})
            };
        }

        const tasks = await prisma.task.findMany({
            where,
            include: {
                user: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { date: 'desc' },
            take: 100 // Limit for dashboard view
        });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error("Admin Master Feed Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
