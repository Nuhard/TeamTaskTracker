import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";

// GET - Fetch comments for a task
export async function GET(request: Request, { params }: { params: { id: string } }) {
    const user = await authenticate(request as any);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const comments = await prisma.comment.findMany({
            where: { taskId: params.id },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { createdAt: "asc" }
        });

        return NextResponse.json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST - Add new comment
export async function POST(request: Request, { params }: { params: { id: string } }) {
    const user = await authenticate(request as any);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { content } = await request.json();

        if (!content || content.trim() === "") {
            return NextResponse.json({ error: "Comment content required" }, { status: 400 });
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                taskId: params.id,
                userId: user.id
            },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });

        return NextResponse.json(comment);
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
