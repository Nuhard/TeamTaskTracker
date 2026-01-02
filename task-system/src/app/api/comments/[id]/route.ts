import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const token = cookies().get("token")?.value;
        const decoded = token ? verifyToken(token) : null;

        if (!decoded) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        const { content } = await request.json();

        if (!content || !content.trim()) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        const comment = await prisma.comment.findUnique({
            where: { id }
        });

        if (!comment) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        if (comment.userId !== decoded.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updatedComment = await prisma.comment.update({
            where: { id },
            data: { content },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        return NextResponse.json(updatedComment);
    } catch (error) {
        console.error("PUT Comment Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const token = cookies().get("token")?.value;
        const decoded = token ? verifyToken(token) : null;

        if (!decoded) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;

        const comment = await prisma.comment.findUnique({
            where: { id }
        });

        if (!comment) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        if (comment.userId !== decoded.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.comment.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE Comment Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
