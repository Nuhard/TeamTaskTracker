const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-this";

function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (e) {
        console.error("DEBUG SCRIPT - Token Verification Failed:", e.message);
        return null;
    }
}

async function main() {
    console.log("--- Debugging Auth Logic ---");
    const email = 'admin@example.com';
    const password = 'Admin@SRED'; // Standard password from create-admin.js

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.error("User not found!");
            return;
        }
        console.log("User Found:", user.email, "Role:", user.role);

        if (user.role !== 'ADMIN') {
            console.error("User is NOT ADMIN! Role is:", user.role);
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        console.log("Password valid:", isValid);

        if (!isValid) {
            console.error("Password incorrect! Cannot generate valid token.");
            return;
        }

        // Generate Token
        const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
        console.log("Generated Token:", token.substring(0, 20) + "...");

        // Verify Token
        const decoded = verifyToken(token);
        console.log("Decoded Token:", decoded);

        if (!decoded || decoded.role !== 'ADMIN') {
            console.error("Decoded token invalid or missing ADMIN role");
        } else {
            console.log("Auth Logic Verification: SUCCESS");
        }

    } catch (error) {
        console.error("Error executing logic:", error);
    } finally {
        await prisma.$disconnect();
    }
    console.log("-----------------------------------");
}

main();
