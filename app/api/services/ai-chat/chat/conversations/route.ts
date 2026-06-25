import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/require";
import { UnauthenticatedError } from "@/lib/errors";
import { z } from "zod";

const createConversationSchema = z.object({
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
  folderId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search");
    const pinned = searchParams.get("pinned");
    const archived = searchParams.get("archived");
    const folderId = searchParams.get("folderId");

    const where: {
      userId: string;
      OR?: Array<Record<string, unknown>>;
      pinned?: boolean;
      archived?: boolean;
      folderId?: string;
    } = {
      userId: user.id,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        {
          messages: {
            some: {
              content: { contains: search, mode: "insensitive" },
            },
          },
        },
      ];
    }

    if (pinned === "true") {
      where.pinned = true;
    }

    if (archived === "true") {
      where.archived = true;
    } else {
      where.archived = false;
    }

    if (folderId) {
      where.folderId = folderId;
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        orderBy: [
          { pinned: "desc" },
          { updatedAt: "desc" },
        ],
        take: limit,
        skip: page * limit,
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: {
              content: true,
              createdAt: true,
              role: true,
            },
          },
          _count: {
            select: { messages: true },
          },
          folder: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    return NextResponse.json({
      conversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Error listing conversations:", error);

    if (error instanceof UnauthenticatedError) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to list conversations", details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const validated = createConversationSchema.parse(body);

    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        title: validated.title || "New Chat",
        model: validated.model || "GEMMA_LOCAL",
        folderId: validated.folderId,
      },
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

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error("Error creating conversation:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
