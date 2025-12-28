import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const adminUser = await authenticate(request as any);
    if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        // Prevent deleting self
        if (params.id === adminUser.id) {
            return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const adminUser = await authenticate(request as any);
    if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { name, email, password, role } = await request.json();
        const dataToUpdate: any = { name, email, role };

        if (password) {
            const bcrypt = require('bcryptjs');
            dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: params.id },
            data: dataToUpdate
        });

        const { passwordHash: _, ...userWithoutPass } = updatedUser;
        return NextResponse.json(userWithoutPass);
    } catch (e) {
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}
