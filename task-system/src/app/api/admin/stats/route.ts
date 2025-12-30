import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(req: Request) {
    try {
        const token = cookies().get("token")?.value;
        const decoded = token ? verifyToken(token) : null;

        if (!decoded || decoded.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        let dateFilter: any = {};
        if (startDate || endDate) {
            dateFilter.date = {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {})
            };
        }

        // Global Stats
        const totalTasks = await prisma.task.count({ where: dateFilter });
        const pendingTasks = await prisma.task.count({ where: { ...dateFilter, status: "PENDING" } });
        const inProgressTasks = await prisma.task.count({ where: { ...dateFilter, status: "IN_PROGRESS" } });
        const completedTasks = await prisma.task.count({ where: { ...dateFilter, status: "COMPLETED" } });

        // Category breakdown
        const categories = ["Axios", "Whatsapp", "Other Task", "Releases", "Monitoring"];
        const categoryStats = await Promise.all(categories.map(async (cat) => {
            const count = await prisma.task.count({ where: { ...dateFilter, category: cat } });
            return { name: cat, value: count };
        }));

        // User Reports (for activity section)
        const users = await (prisma.user as any).findMany({
            where: { role: 'USER' },
            include: {
                tasks: {
                    where: dateFilter
                }
            },
            orderBy: {
                lastLogin: 'desc'
            }
        });

        const userReports = users.map((user: any) => {
            const userTasks = user.tasks || [];
            const stats: Record<string, number> = {};
            categories.forEach(c => stats[c] = 0);
            userTasks.forEach((t: any) => {
                if (t.category) stats[t.category] = (stats[t.category] || 0) + 1;
            });

            const chartData = Object.entries(stats).map(([name, value]) => ({
                name,
                value,
                color: name === "Axios" ? "#3b82f6" :
                    name === "Whatsapp" ? "#22c55e" :
                        name === "Other Task" ? "#6366f1" :
                            name === "Releases" ? "#a855f7" : "#ec4899"
            }));

            return {
                id: user.id,
                name: user.name || "Unknown",
                email: user.email,
                totalTasks: userTasks.length,
                lastLogin: user.lastLogin,
                chartData
            };
        });

        return NextResponse.json({
            totalTasks,
            pendingTasks,
            inProgressTasks,
            completedTasks,
            categoryStats,
            userReports
        });
    } catch (error) {
        console.error("Admin Stats Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
