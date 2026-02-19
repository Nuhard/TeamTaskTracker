const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding sample data...");

    const passwordHash = await bcrypt.hash('password123', 10);

    // Create Users
    const user1 = await prisma.user.upsert({
        where: { email: 'dev@sre.com' },
        update: {},
        create: {
            email: 'dev@sre.com',
            name: 'Dev User',
            role: 'USER',
            passwordHash,
        },
    });

    const user2 = await prisma.user.upsert({
        where: { email: 'manager@sre.com' },
        update: {},
        create: {
            email: 'manager@sre.com',
            name: 'Manager User',
            role: 'ADMIN',
            passwordHash,
        },
    });

    console.log("Created users:", user1.email, user2.email);

    // Create Tasks
    const tasks = [
        {
            description: "Fix login page CSS",
            category: "Frontend",
            status: "PENDING",
            userId: user1.id,
            date: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
        },
        {
            description: "Optimize database queries",
            category: "Backend",
            status: "IN_PROGRESS",
            userId: user1.id,
            date: new Date(),
        },
        {
            description: "Prepare monthly report",
            category: "Documentation",
            status: "COMPLETED",
            userId: user2.id,
            date: new Date(new Date().setDate(new Date().getDate() - 1)), // Yesterday
        },
        {
            description: "Update dependencies",
            category: "Maintenance",
            status: "PENDING",
            userId: user1.id,
            date: new Date(new Date().setDate(new Date().getDate() + 2)),
        },
        {
            description: "Review PR #42",
            category: "Review",
            status: "IN_PROGRESS",
            userId: user2.id,
            date: new Date(),
        }
    ];

    for (const task of tasks) {
        await prisma.task.create({
            data: task
        });
    }

    console.log(`Created ${tasks.length} tasks.`);
    console.log("Seeding completed.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
