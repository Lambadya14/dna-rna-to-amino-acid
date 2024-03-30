import { unlink } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { join, extname } from "path"; // Import extname dari path

export async function DELETE(request: NextRequest) {
  try {
    // Parse JSON data from the request body
    const body = await request.json();
    let { nama } = body; // Ubah menjadi let agar dapat diubah nanti

    if (!nama) {
      return NextResponse.json({ success: false, message: 'Nama file tidak diberikan.' });
    }

    const fileExtension = extname(nama); // Dapatkan ekstensi file
    nama = nama + fileExtension; // Tambahkan ekstensi file ke nama

    const filePath = join(process.cwd(), "public", "images", `${nama}.jpg`);

    try {
      await unlink(filePath);
      console.log(`File ${nama} berhasil dihapus.`);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error(`Gagal menghapus file ${nama}:`, error);
      return NextResponse.json({ success: false, message: 'Gagal menghapus file.' });
    }
  } catch (error) {
    console.error('Gagal mendapatkan data dari permintaan:', error);
    return NextResponse.json({ success: false, message: 'Gagal mendapatkan data dari permintaan.' });
  }
}
