import { writeFile } from 'fs/promises'
import { join, extname } from 'path'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const data = await request.formData()
  const file: File | null = data.get('file') as unknown as File
  const nama = data.get('nama') as string

  if (!file) {
    return NextResponse.json({ success: false })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Dapatkan ekstensi file yang diunggah
  const ext = extname(file.name)

  // Gabungkan ekstensi file dengan nama file
  const targetPath = join(process.cwd(), 'public', 'images', `${nama}${ext}`)

  try {
    // Tulis file ke path target
    await writeFile(targetPath, buffer)
    console.log(`File disimpan di ${targetPath}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Gagal menyimpan file:', error)
    return NextResponse.json({ success: false })
  }
}
