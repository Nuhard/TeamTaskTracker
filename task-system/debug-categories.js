const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- Checking Task Categories ---");
    const tasks = await prisma.task.groupBy({
        by: ['category'],
        _count: { category: true }
    });
    console.log(JSON.stringify(tasks, null, 2));
    console.log("--------------------------------");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
