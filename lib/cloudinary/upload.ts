import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadChatAttachment(
  base64Data: string,
  fileName: string,
  mimeType: string,
  conversationId: string
): Promise<{ publicId: string; secureUrl: string }> {
  const dataUri = `data:${mimeType};base64,${base64Data}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `clustar/chat/${conversationId}`,
    resource_type: "auto",
    public_id: `${Date.now()}-${fileName.replace(/\.[^/.]+$/, "")}`,
  });

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
  };
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
