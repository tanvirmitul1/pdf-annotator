import { NextRequest, NextResponse } from "next/server";

const OCR_API_URL = "https://kagoj.ai/api/ocr/process/v3/";
const OCR_BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzgyMzczOTc5LCJpYXQiOjE3ODIxMTQ3NzksImp0aSI6IjdmZmU5MDM2NDhiODRlMDNhMTg2Njc5ZWZjMzQ0NjczIiwidXNlcl9pZCI6IjZmYTRlNzM1LWVmOTgtNGUxOC1iMmIzLTNiZWFmZTM2MGQzZSJ9.hT7lqeZjDODSwNXE1uiI7wgmv-jB_U_SBQmthd3yNsc";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const response = await fetch(OCR_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OCR_BEARER_TOKEN}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: { error?: string; message?: string } = {};
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }

      return NextResponse.json(
        {
          error: errorData.error || "OCR processing failed",
          message: errorData.message || `HTTP ${response.status}`,
          status: response.status,
        },
        { status: response.status }
      );
    }

    const traceId = response.headers.get("X-Trace-Id");
    const projectId = response.headers.get("X-Project-Id");
    const cacheHit = response.headers.get("X-Cache-Hit");
    const text = await response.text();

    const result = NextResponse.json({
      text,
      traceId,
      projectId,
      cacheHit,
    });

    if (traceId) result.headers.set("X-Trace-Id", traceId);
    if (projectId) result.headers.set("X-Project-Id", projectId);
    if (cacheHit) result.headers.set("X-Cache-Hit", cacheHit);

    return result;
  } catch (error) {
    console.error("OCR proxy error:", error);
    return NextResponse.json(
      {
        error: "Network error",
        message: error instanceof Error ? error.message : "Failed to connect to OCR service",
      },
      { status: 500 }
    );
  }
}
