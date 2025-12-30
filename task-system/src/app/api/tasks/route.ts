import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const filterCategory = searchParams.get("category");
        const filterDate = searchParams.get("date");

        const token = cookies().get("token")?.value;
        const decoded = token ? verifyToken(token) : null;

        if (!decoded) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!dbUser || dbUser.role === 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized - Admins cannot access user tasks" }, { status: 403 });
        }

        const where: any = { userId: decoded.id };

        if (filterCategory) {
            where.category = filterCategory;
        }

        if (filterDate) {
            const startOfDay = new Date(filterDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(filterDate);
            endOfDay.setHours(23, 59, 59, 999);
            where.date = {
                gte: startOfDay,
                lte: endOfDay
            };
        }

        const tasks = await prisma.task.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: { name: true, email: true }
                },
                comments: true
            }
        });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error("GET Tasks Error:", error);
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

        const dbUser = await prisma.user.findUnique({ where: { id: decoded.id } });
        console.log(`[POST_TASK] UID: ${decoded.id} | Email: ${decoded.email} | DB_Role: ${dbUser?.role}`);
        if (!dbUser || dbUser.role === 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized - Admins cannot log tasks" }, { status: 403 });
        }

        const { description, category, ticketNumber, status, date } = await request.json();

        if (!description) {
            return NextResponse.json({ error: "Description is required" }, { status: 400 });
        }

        const task = await prisma.task.create({
            data: {
                description,
                category,
                ticketNumber,
                status,
                date: date ? new Date(date) : undefined,
                userId: decoded.id
            }
        });

        return NextResponse.json(task);
    } catch (error) {
        console.error("POST Task Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
