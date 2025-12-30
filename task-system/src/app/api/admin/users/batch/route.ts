import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const token = cookies().get("token")?.value;
        const decoded = token ? verifyToken(token) : null;

        if (!decoded || decoded.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userIds, action, role } = await request.json();

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ error: "No users selected" }, { status: 400 });
        }

        if (action === "DELETE") {
            // Prevent deleting self
            const filteredIds = userIds.filter(id => id !== decoded.id);
            await prisma.user.deleteMany({
                where: { id: { in: filteredIds } }
            });

            await prisma.auditLog.create({
                data: {
                    userId: decoded.id,
                    action: "BATCH_DELETE",
                    details: `Deleted ${filteredIds.length} users`
                }
            });
        } else if (action === "CHANGE_ROLE") {
            await prisma.user.updateMany({
                where: { id: { in: userIds } },
                data: { role }
            });

            await prisma.auditLog.create({
                data: {
                    userId: decoded.id,
                    action: "BATCH_ROLE_CHANGE",
                    details: `Changed role to ${role} for ${userIds.length} users`
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Batch Action Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
