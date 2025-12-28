const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- Debugging Admin Stats Logic ---");
    try {
        const totalUsers = await prisma.user.count();
        console.log("Total Users:", totalUsers);

        const totalTasks = await prisma.task.count();
        console.log("Total Tasks:", totalTasks);

        const completedTasks = await prisma.task.count({ where: { status: 'COMPLETED' } });
        console.log("Completed Tasks:", completedTasks);

        const pendingTasks = await prisma.task.count({ where: { status: 'PENDING' } });
        console.log("Pending Tasks:", pendingTasks);

        const inProgressTasks = await prisma.task.count({ where: { status: 'IN_PROGRESS' } });
        console.log("In Progress Tasks:", inProgressTasks);

        // Group by Category (Global)
        const tasksByCategory = await prisma.task.groupBy({
            by: ['category'],
            _count: { category: true }
        });

        const categoryStats = tasksByCategory.map((item) => ({
            name: item.category || 'Uncategorized',
            value: item._count.category
        }));

        console.log("Category Stats:", JSON.stringify(categoryStats, null, 2));

        // User-wise Stats
        const users = await prisma.user.findMany({
            include: {
                tasks: {
                    select: { category: true }
                }
            }
        });

        const userReports = users.map(user => {
            const stats = {};
            user.tasks.forEach(t => {
                const cat = t.category || 'Uncategorized';
                stats[cat] = (stats[cat] || 0) + 1;
            });

            const chartData = Object.keys(stats).map(key => ({
                name: key,
                value: stats[key]
            }));

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                totalTasks: user.tasks.length,
                chartData
            };
        });

        console.log("User Reports Sample (First User):", JSON.stringify(userReports[0], null, 2));

    } catch (error) {
        console.error("Error executing logic:", error);
    } finally {
        await prisma.$disconnect();
    }
    console.log("-----------------------------------");
}

main();
