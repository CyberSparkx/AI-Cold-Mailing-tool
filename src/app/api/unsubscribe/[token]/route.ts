import { NextRequest, NextResponse } from "next/server";
import { unsubscribeService } from "@/server/modules/campaigns/unsubscribe.service";
import { toResponse } from "@/server/platform/errors/to-response";

// GET or POST /api/unsubscribe/[token] - Process one-click unsubscribe
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const result = await unsubscribeService.processToken(params.token);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return toResponse(error);
  }
}

export async function POST(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const result = await unsubscribeService.processToken(params.token);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return toResponse(error);
  }
}
