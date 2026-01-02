const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({ log: ['query'] });

async function main() {
    console.log("Checking DB...");
    const email = 'admin@sre.com';
    const password = 'adminSRE123';
    const name = 'Admin User';

    const passwordHash = await bcrypt.hash(password, 10);

    const existing = await prisma.user.findUnique({
        where: { email },
    });

    if (existing) {
        console.log(`User ${email} already exists. Updating to ADMIN role...`);
        await prisma.user.update({
            where: { email },
            data: {
                role: 'ADMIN',
                passwordHash: passwordHash
            }
        });
        console.log('User updated successfully.');
    } else {
        console.log(`Creating new Admin user ${email}...`);
        await prisma.user.create({
            data: {
                email,
                name,
                passwordHash,
                role: 'ADMIN',
            },
        });
        console.log('Admin user created successfully.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
