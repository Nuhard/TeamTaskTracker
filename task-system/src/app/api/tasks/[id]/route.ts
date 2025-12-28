import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const user = await authenticate(request as any);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { description, category, status, date, ticketNumber } = await request.json();

        const existingTask = await prisma.task.findUnique({ where: { id: params.id } });
        if (!existingTask) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        if (existingTask.userId !== user.id && user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        try {
            const task = await prisma.task.update({
                where: { id: params.id },
                data: {
                    description,
                    category,
                    ticketNumber: category === "Axios" ? ticketNumber : null,
                    status,
                    date: date ? new Date(date) : undefined
                }
            });

            // Propagate status change to other users' tasks with the same Ticket Number
            const cleanTicket = task.ticketNumber?.trim();
            if (task.category === "Axios" && cleanTicket) {
                console.log(`Attempting to sync status for Ticket ${cleanTicket} to ${task.status}`);
                const updateResult = await prisma.task.updateMany({
                    where: {
                        category: "Axios",
                        ticketNumber: cleanTicket,
                        id: { not: task.id }
                    },
                    data: {
                        status: task.status
                    }
                });
                console.log(`Synced status for ${updateResult.count} other tasks.`);
            }

            revalidatePath('/dashboard');
            revalidatePath('/analytics');

            return NextResponse.json(task);
        } catch (dbError: any) {
            console.error("Database Error on Update:", dbError);
            return NextResponse.json({ error: "Database Error: " + dbError.message }, { status: 500 });
        }
    } catch (error: any) {
        console.error("General API Error:", error);
        return NextResponse.json({ error: "Internal Server Error: " + error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const user = await authenticate(request as any);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const existingTask = await prisma.task.findUnique({ where: { id: params.id } });
        if (!existingTask) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        if (existingTask.userId !== user.id && user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.task.delete({ where: { id: params.id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
