import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";

export async function GET(request: Request) {
    const user = await authenticate(request as any);
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const tasks = await prisma.task.findMany({
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });

        // CSV Header
        let csv = "ID,Description,Category,Ticket Number,Status,Date,User Name,User Email,Created At\n";

        // CSV Rows
        tasks.forEach(t => {
            const cleanDesc = t.description.replace(/"/g, '""').replace(/\n/g, ' '); // Escape quotes and newlines
            const row = [
                t.id,
                `"${cleanDesc}"`,
                t.category || '',
                t.ticketNumber || '',
                t.status,
                t.date.toISOString(),
                t.user.name || '',
                t.user.email,
                t.createdAt.toISOString()
            ].join(",");
            csv += row + "\n";
        });

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="tasks-report-${new Date().toISOString().split('T')[0]}.csv"`
            }
        });

    } catch (e) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
