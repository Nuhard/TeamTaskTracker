import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";

// GET - Fetch user's templates
export async function GET(request: Request) {
    const user = await authenticate(request as any);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const templates = await prisma.template.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(templates);
    } catch (error) {
        console.error("Error fetching templates:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST - Create new template
export async function POST(request: Request) {
    const user = await authenticate(request as any);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { name, description, category } = await request.json();

        if (!name || !description) {
            return NextResponse.json({ error: "Name and description required" }, { status: 400 });
        }

        const template = await prisma.template.create({
            data: {
                name,
                description,
                category,
                userId: user.id
            }
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("Error creating template:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE - Remove template
export async function DELETE(request: Request) {
    const user = await authenticate(request as any);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Template ID required" }, { status: 400 });
        }

        // Verify ownership
        const template = await prisma.template.findFirst({
            where: { id, userId: user.id }
        });

        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        await prisma.template.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting template:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
