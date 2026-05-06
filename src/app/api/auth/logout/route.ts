import { clearSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  await clearSession();
  return NextResponse.json({ success: true });
}
