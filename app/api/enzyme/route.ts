import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  const filePath = path.join(process.cwd(), "public", "link_proto.xml");
  try {
    const enzymeData = await fs.readFile(filePath, "utf8");
    return NextResponse.json({ enzymeData });
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json({ error: "Error reading file" }, { status: 500 });
  }
}
