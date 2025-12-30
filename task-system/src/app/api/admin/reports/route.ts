import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { format } from "date-fns";

export async function GET(req: Request) {
    try {
        const token = cookies().get("token")?.value;
        const decoded = token ? verifyToken(token) : null;

        if (!decoded || decoded.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const columnsParam = searchParams.get("columns");
        const selectedColumns = columnsParam ? columnsParam.split(",") : null;

        const tasks = await prisma.task.findMany({
            include: {
                user: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { date: 'desc' }
        });

        // Define all available columns
        const allColumns = {
            "id": "ID",
            "userName": "User Name",
            "userEmail": "User Email",
            "description": "Description",
            "category": "Category",
            "ticket": "Ticket",
            "status": "Status",
            "date": "Date"
        };

        // Determine which columns to include
        const columnsToInclude = selectedColumns || Object.keys(allColumns);
        const headers = columnsToInclude.map(col => allColumns[col as keyof typeof allColumns]);

        // Generate rows with selected columns only
        const rows = tasks.map(t => {
            const rowData: any = {
                "id": t.id,
                "userName": t.user?.name || "Unknown",
                "userEmail": t.user?.email || "Unknown",
                "description": `"${(t.description || "").replace(/"/g, '""')}"`,
                "category": t.category || "",
                "ticket": t.ticketNumber || "",
                "status": t.status,
                "date": format(new Date(t.date), 'yyyy-MM-dd HH:mm')
            };
            return columnsToInclude.map(col => rowData[col]);
        });

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="team-tasks-report-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
            },
        });
    } catch (error) {
        console.error("Report Export Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
