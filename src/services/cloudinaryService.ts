const env = import.meta.env as Record<string, string | undefined>;

export const CLOUDINARY_CLOUD_NAME = env["VITE_CLOUDINARY_CLOUD_NAME"] ?? "dlvjvskje";
export const CLOUDINARY_UPLOAD_PRESET = env["VITE_CLOUDINARY_UPLOAD_PRESET"] ?? "THE POUNDS TRACKER";

const MAX_BYTES = 5 * 1024 * 1024;

export interface UploadResult {
  secureUrl: string;
  publicId: string;
}

/** Unsigned browser upload. No API secret is used or required. */
export async function uploadProfileImage(file: File): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPG, PNG or WebP).");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("That image is larger than 5MB. Please choose a smaller one.");
  }

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body },
  );

  if (!response.ok) {
    const text = await response.text();
    if (text.includes("preset")) {
      throw new Error(
        `The image service rejected the upload preset "${CLOUDINARY_UPLOAD_PRESET}". It must exist and be set to Unsigned in Cloudinary.`,
      );
    }
    throw new Error("The image couldn't be uploaded. Please try again.");
  }

  const data = (await response.json()) as { secure_url?: string; public_id?: string };
  if (!data.secure_url || !data.public_id) throw new Error("The image upload returned no image.");
  return { secureUrl: data.secure_url, publicId: data.public_id };
}
