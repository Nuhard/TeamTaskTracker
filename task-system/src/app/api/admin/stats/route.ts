import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";

export async function GET(request: NextRequest) {
    const user = await authenticate(request);

    if (!user || user.role !== 'ADMIN') {
        console.log("Stats API Unauthorized. User:", user ? `${user.email} (${user.role})` : "None");
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const filterDate = searchParams.get('date');
    const filterCategory = searchParams.get('category');

    console.log("Stats API authorized for:", user.email, "Filters:", { filterDate, filterCategory });

    try {
        // Build Where Clause for Tasks
        const taskWhere: any = {};
        if (filterCategory && filterCategory !== 'All') {
            taskWhere.category = filterCategory;
        }
        if (filterDate) {
            const startOfDay = new Date(filterDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(filterDate);
            endOfDay.setHours(23, 59, 59, 999);

            taskWhere.date = {
                gte: startOfDay,
                lte: endOfDay
            };
        }

        const totalUsers = await prisma.user.count();
        // Stats respecting filters
        const totalTasks = await prisma.task.count({ where: taskWhere });
        const completedTasks = await prisma.task.count({ where: { ...taskWhere, status: 'COMPLETED' } });
        const pendingTasks = await prisma.task.count({ where: { ...taskWhere, status: 'PENDING' } });
        const inProgressTasks = await prisma.task.count({ where: { ...taskWhere, status: 'IN_PROGRESS' } });

        console.log("DB Stats Fetched:", { totalUsers, totalTasks, completedTasks, pendingTasks, inProgressTasks });

        // Group by Category (Global) - respecting filters (though category filter makes this redundant if selected)
        const tasksByCategory = await prisma.task.groupBy({
            by: ['category'],
            where: taskWhere,
            _count: { category: true }
        });

        const categoryStats = tasksByCategory.map((item: any) => ({
            name: item.category || 'Uncategorized',
            value: item._count.category
        }));

        console.log("DEBUG: Category Stats from DB:", JSON.stringify(categoryStats, null, 2));

        // User-wise Stats
        const users = await prisma.user.findMany({
            include: {
                tasks: {
                    where: taskWhere, // Apply filters to user's tasks too
                    select: { category: true }
                }
            }
        });

        const userReports = users.map(user => {
            const stats: Record<string, number> = {};
            user.tasks.forEach(t => {
                const cat = t.category || 'Uncategorized';
                stats[cat] = (stats[cat] || 0) + 1;
            });

            const categoryColors: Record<string, string> = {
                'Axios': '#8b5cf6',      // violet-500
                'Whatsapp': '#22c55e',   // green-500
                'Other Task': '#64748b', // slate-500
                'Releases': '#f59e0b',   // amber-500
                'Monitoring': '#3b82f6', // blue-500
                'Uncategorized': '#ef4444' // red-500
            };

            const chartData = Object.keys(stats).map(key => ({
                name: key,
                value: stats[key],
                color: categoryColors[key] || '#d1d5db' // gray-300 fallback
            })).sort((a, b) => b.value - a.value); // Sort by highest count

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                totalTasks: user.tasks.length,
                chartData
            };
        });

        console.log("Final Response Payload size:", { userReportsCount: userReports.length });


        return NextResponse.json({
            totalUsers,
            totalTasks,
            completedTasks,
            pendingTasks,
            inProgressTasks,
            categoryStats,
            userReports // New field
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
