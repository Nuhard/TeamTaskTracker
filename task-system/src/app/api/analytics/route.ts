import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";

export async function GET(request: Request) {
    // Allow any authenticated user to view global stats
    const user = await authenticate(request as any);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 1. Global Category Stats
        const globalTasks = await prisma.task.groupBy({
            by: ['category'],
            _count: {
                category: true,
            },
        });

        const stats: Record<string, number> = {};
        const categories = ["Axios", "Whatsapp", "Other Task", "Releases", "Monitoring"];
        categories.forEach(c => stats[c] = 0);
        globalTasks.forEach((t: any) => {
            if (t.category) stats[t.category] = t._count.category;
        });

        // 2. User-wise Activity
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                tasks: {
                    orderBy: { date: 'desc' },
                    // Limit to recent tasks if list gets too long, but removing limit for now as per "view all" request implication
                    select: {
                        id: true,
                        description: true,
                        category: true,
                        ticketNumber: true,
                        status: true,
                        date: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        const userActivity = users.map((u: any) => ({
            id: u.id,
            name: u.name || u.email, // Fallback to email if name is missing
            totalTasks: u.tasks.length,
            tasks: u.tasks
        }));

        return NextResponse.json({
            currentUserId: user.id,
            globalStats: stats,
            userActivity: userActivity
        });
    } catch (error: any) {
        console.error("Analytics Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
