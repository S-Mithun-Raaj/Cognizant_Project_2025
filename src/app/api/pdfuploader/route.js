import { NextResponse } from "next/server";

export const POST = async (req) => {
  const formData = await req.formData();
  const files = formData.getAll("files");
  const hasImages = formData.get("hasImages") === "true";
  const profileId = formData.get("profileId");

  console.log("Uploading PDFs for profile:", profileId);
  console.log("Has Images:", hasImages);
  console.log("Files:", files.map(f => f.name));

  // TODO: Process PDFs (chunk, embed, save to Pinecone)
  return NextResponse.json({ status: "success" });
};
