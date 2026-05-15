import { insforge } from "./insforge";

const CLUE_IMAGES_BUCKET = "clue-images";

export async function uploadClueImage(file: File, clueText: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const slug = clueText
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const path = `${Date.now()}-${slug}.${ext}`;

  const { error } = await insforge.storage
    .from(CLUE_IMAGES_BUCKET)
    .upload(path, file);

  if (error) throw new Error(error.message || "Storage upload failed");

  return insforge.storage.from(CLUE_IMAGES_BUCKET).getPublicUrl(path);
}
