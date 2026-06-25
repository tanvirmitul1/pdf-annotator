import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require";
import { UnauthenticatedError } from "@/lib/errors";
import { prisma } from "@/lib/db/prisma";
import { uploadChatAttachment } from "@/lib/cloudinary/upload";
import { z } from "zod";

const attachmentSchema = z.object({
  conversationId: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  base64: z.string(),
  ocrText: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const validated = attachmentSchema.parse(body);

    // Upload to Cloudinary
    const { publicId, secureUrl } = await uploadChatAttachment(
      validated.base64,
      validated.fileName,
      validated.mimeType,
      validated.conversationId
    );

    // Save to database
    const attachment = await prisma.chatAttachment.create({
      data: {
        userId: user.id,
        conversationId: validated.conversationId,
        fileName: validated.fileName,
        mimeType: validated.mimeType,
        fileSize: Math.ceil(validated.base64.length * 0.75),
        cloudinaryPublicId: publicId,
        cloudinaryUrl: secureUrl,
        ocrText: validated.ocrText,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error("Error saving attachment:", error);

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
      { error: "Failed to save attachment" },
      { status: 500 }
    );
  }
}
