import { writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const directory = formData.get("directory") as string;
    const id = formData.get("id") as string;
    const file = formData.get("file") as Blob;

    if (!directory || !id || !file) {
      return NextResponse.json({
        success: false,
        message: "Directory, id, atau file tidak diberikan.",
      });
    }

    // Lokasi file
    const filePath = join(directory, `${id}.jpg`);

    // Menulis file yang diterima ke lokasi yang ditentukan
    await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

    console.log(`File berhasil diperbarui di ${filePath}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gagal memperbarui file:", error);
    return NextResponse.json({
      success: false,
      message: "Gagal memperbarui file.",
    });
  }
}
