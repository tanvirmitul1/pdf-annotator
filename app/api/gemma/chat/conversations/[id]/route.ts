import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/require";
import { UnauthenticatedError } from "@/lib/errors";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const updateConversationSchema = z.object({
  title: z.string().optional(),
  model: z.enum([
    "GEMMA_LOCAL",
    "GEMMA_GATEWAY",
    "GPT_4",
    "GPT_4_TURBO",
    "GPT_3_5_TURBO",
    "CLAUDE_3_OPUS",
    "CLAUDE_3_SONNET",
    "CLAUDE_3_HAIKU",
    "GEMINI_PRO",
    "GEMINI_ULTRA",
    "DEEPSEEK_CHAT",
    "LLAMA_3_70B",
    "MISTRAL_LARGE",
  ]).optional(),
  pinned: z.boolean().optional(),
  archived: z.boolean().optional(),
  folderId: z.string().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            attachments: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error getting conversation:", error);
    
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to get conversation" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();
    const validated = updateConversationSchema.parse(body);

    const existing = await prisma.conversation.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const updateData: Prisma.ConversationUncheckedUpdateInput = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.model !== undefined) updateData.model = validated.model;
    if (validated.pinned !== undefined) updateData.pinned = validated.pinned;
    if (validated.archived !== undefined) {
      updateData.archived = validated.archived;
      updateData.archivedAt = validated.archived ? new Date() : null;
    }
    if (validated.folderId !== undefined) updateData.folderId = validated.folderId;

    const conversation = await prisma.conversation.update({
      where: { id },
      data: updateData,
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error updating conversation:", error);
    
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const existing = await prisma.conversation.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    await prisma.conversation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
