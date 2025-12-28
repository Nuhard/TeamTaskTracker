const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const fs = require('fs');

async function main() {
    const users = await prisma.user.findMany();
    let output = "--- User Roles Debug ---\n";
    users.forEach(u => {
        output += `Email: ${u.email} | Role: '${u.role}' \n`;
    });
    fs.writeFileSync('debug-output.txt', output);
    console.log("Written to debug-output.txt");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
