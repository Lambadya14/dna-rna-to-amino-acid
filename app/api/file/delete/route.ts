import { unlink } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { join, extname } from "path"; // Import extname dari path

export async function DELETE(request: NextRequest) {
  try {
    // Parse JSON data from the request body
    const body = await request.json();
    let { id } = body; // Ubah menjadi let agar dapat diubah nanti

    if (!id) {
      return NextResponse.json({ success: false, message: 'id file tidak diberikan.' });
    }

    const fileExtension = extname(id); // Dapatkan ekstensi file
    id = id + fileExtension; // Tambahkan ekstensi file ke id

    const filePath = join(process.cwd(), "public", "images", `${id}.jpg`);

    try {
      await unlink(filePath);
      console.log(`File ${id} berhasil dihapus.`);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error(`Gagal menghapus file ${id}:`, error);
      return NextResponse.json({ success: false, message: 'Gagal menghapus file.' });
    }
  } catch (error) {
    console.error('Gagal mendapatkan data dari permintaan:', error);
    return NextResponse.json({ success: false, message: 'Gagal mendapatkan data dari permintaan.' });
  }
}
