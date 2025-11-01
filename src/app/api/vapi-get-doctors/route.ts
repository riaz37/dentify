import { NextRequest, NextResponse } from "next/server";
import { getAvailableDoctors } from "@/lib/actions/doctors";

// CORS headers helper
function getCorsHeaders(origin?: string | null) {
  // Allowed origins
  const allowedOrigins = [
    "https://dentify37.vercel.app",
    "https://www.dentify37.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
  ];

  // Determine the origin to allow
  const allowedOrigin =
    origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

// Handle OPTIONS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return NextResponse.json({}, { headers: getCorsHeaders(origin) });
}

// Handle both VAPI tool calls (POST) and direct API calls (GET)
export async function GET(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const doctors = await getAvailableDoctors();
    
    return NextResponse.json(
      {
        success: true,
        doctors: doctors.map((doctor) => ({
          id: doctor.id,
          name: doctor.name,
          speciality: doctor.speciality,
          email: doctor.email,
          phone: doctor.phone,
          bio: doctor.bio,
        })),
      },
      { headers: getCorsHeaders(origin) }
    );
  } catch (error: any) {
    console.error("Error fetching doctors for VAPI:", error);
    const origin = request.headers.get("origin");
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch available doctors",
      },
      { status: 500, headers: getCorsHeaders(origin) }
    );
  }
}

// Handle VAPI tool call format
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is a VAPI tool call format
    if (body.message?.type === "tool-calls" && body.message?.toolCallList) {
      const toolCalls = body.message.toolCallList;
      const results = [];

      for (const toolCall of toolCalls) {
        const { id: toolCallId, name } = toolCall;
        
        if (name === "get_available_doctors") {
          const doctors = await getAvailableDoctors();
          const doctorList = doctors
            .map((d) => `${d.name} (${d.speciality})`)
            .join(", ");
          
          results.push({
            toolCallId,
            result: `Available doctors: ${doctorList}. Which doctor would you like to book with?`,
          });
        }
      }

      const origin = request.headers.get("origin");
      return NextResponse.json({ results }, { headers: getCorsHeaders(origin) });
    }

    // Fallback: Direct API call format
    const origin = request.headers.get("origin");
    const doctors = await getAvailableDoctors();
    
    return NextResponse.json(
      {
        success: true,
        doctors: doctors.map((doctor) => ({
          id: doctor.id,
          name: doctor.name,
          speciality: doctor.speciality,
          email: doctor.email,
          phone: doctor.phone,
          bio: doctor.bio,
        })),
      },
      { headers: getCorsHeaders(origin) }
    );
  } catch (error: any) {
    console.error("Error fetching doctors for VAPI:", error);
    const origin = request.headers.get("origin");
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch available doctors",
      },
      { status: 500, headers: getCorsHeaders(origin) }
    );
  }
}

