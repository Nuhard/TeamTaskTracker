import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";

export async function GET(request: Request) {
    const user = await authenticate(request as any);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[/api/tasks GET] User:", user.email, "| Role:", user.role, "| ID:", user.id);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const filterDate = searchParams.get("date");
    const filterCategory = searchParams.get("category");

    const where: any = {};

    // CRITICAL: Always filter by userId for non-admins
    if (user.role !== 'ADMIN') {
        where.userId = user.id;
        console.log("[/api/tasks GET] Filtering for USER - userId:", user.id);
    } else {
        console.log("[/api/tasks GET] ADMIN user - showing all tasks");
    }

    if (status) {
        where.status = status;
    }

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

    console.log("[/api/tasks GET] WHERE clause:", JSON.stringify(where));

    try {
        const tasks = await prisma.task.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: { user: { select: { name: true, email: true } } }
        });

        console.log(`[/api/tasks GET] Found ${tasks.length} tasks for ${user.email}`);
        return NextResponse.json(tasks);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await authenticate(request as any);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { description, category, status, date, ticketNumber } = await request.json();

        if (!description) {
            return NextResponse.json({ error: "Description is required" }, { status: 400 });
        }

        try {
            const task = await prisma.task.create({
                data: {
                    description,
                    category,
                    ticketNumber: category === "Axios" ? ticketNumber : null,
                    status: status || "PENDING",
                    date: date ? new Date(date) : new Date(),
                    userId: user.id
                }
            });

            // Propagate status change to other users' tasks with the same Ticket Number
            const cleanTicket = task.ticketNumber?.trim();
            if (task.category === "Axios" && cleanTicket) {
                console.log(`[CREATE] Attempting to sync status for Ticket ${cleanTicket} to ${task.status}`);
                await prisma.task.updateMany({
                    where: {
                        category: "Axios",
                        ticketNumber: cleanTicket,
                        id: { not: task.id }
                    },
                    data: {
                        status: task.status
                    }
                });
            }

            revalidatePath('/dashboard');
            revalidatePath('/analytics');

            return NextResponse.json(task);
        } catch (dbError: any) {
            console.error("Database Error on Create:", dbError);
            return NextResponse.json({ error: "Database Error: " + dbError.message }, { status: 500 });
        }
    } catch (error: any) {
        console.error("General API Error:", error);
        return NextResponse.json({ error: "Internal Server Error: " + error.message }, { status: 500 });
    }
}
