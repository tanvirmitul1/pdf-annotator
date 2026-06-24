import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/require";
import { UnauthenticatedError } from "@/lib/errors";
import { z } from "zod";
import { type Prisma, ChatModel, MessageRole } from "@prisma/client";

const sendMessageSchema = z.object({
  role: z.nativeEnum(MessageRole),
  content: z.string(),
  attachments: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  tokenCount: z.number().optional(),
  model: z.nativeEnum(ChatModel).optional(),
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
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "100");

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          conversationId: id,
          userId: user.id,
        },
        orderBy: { createdAt: "asc" },
        take: limit,
        skip: page * limit,
        include: {
          attachments: true,
        },
      }),
      prisma.message.count({
        where: {
          conversationId: id,
          userId: user.id,
        },
      }),
    ]);

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error listing messages:", error);
    
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to list messages" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validated = sendMessageSchema.parse(body);

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        userId: user.id,
        role: validated.role,
        content: validated.content,
        metadata: (validated.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        tokenCount: validated.tokenCount || 0,
        model: validated.model || conversation.model,
        attachments: validated.attachments
          ? {
              connect: validated.attachments.map((attachmentId) => ({
                id: attachmentId,
              })),
            }
          : undefined,
      },
      include: {
        attachments: true,
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    
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
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}
