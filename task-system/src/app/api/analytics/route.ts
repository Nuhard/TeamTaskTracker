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

        // Fetch all users with 'USER' role and their tasks to build the Team Analytics view
        const usersWithTasks = await prisma.user.findMany({
            where: { role: 'USER' },
            include: {
                tasks: {
                    orderBy: { date: 'desc' }
                }
            }
        });

        // Calculate Global Stats (Category Distribution for regular users)
        const allUserTasks = await prisma.task.findMany({
            where: {
                user: { role: 'USER' }
            }
        });
        const globalStats: Record<string, number> = {};
        allUserTasks.forEach(task => {
            const cat = task.category || "Other Task";
            globalStats[cat] = (globalStats[cat] || 0) + 1;
        });

        // Format User Activity for the board
        const userActivity = usersWithTasks.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            totalTasks: u.tasks.length,
            tasks: u.tasks.map(t => ({
                id: t.id,
                description: t.description,
                category: t.category,
                ticketNumber: t.ticketNumber,
                status: t.status,
                date: t.date.toISOString()
            }))
        }));

        return NextResponse.json({
            globalStats,
            userActivity,
            currentUserId: decoded.id
        });
    } catch (error) {
        console.error("Analytics Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
