import { NextRequest, NextResponse } from "next/server";
import { getAvailableDoctors } from "@/lib/actions/doctors";

// Handle both VAPI tool calls (POST) and direct API calls (GET)
export async function GET() {
  try {
    const doctors = await getAvailableDoctors();
    
    return NextResponse.json({
      success: true,
      doctors: doctors.map((doctor) => ({
        id: doctor.id,
        name: doctor.name,
        speciality: doctor.speciality,
        email: doctor.email,
        phone: doctor.phone,
        bio: doctor.bio,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching doctors for VAPI:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch available doctors",
      },
      { status: 500 }
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

      return NextResponse.json({ results });
    }

    // Fallback: Direct API call format
    const doctors = await getAvailableDoctors();
    
    return NextResponse.json({
      success: true,
      doctors: doctors.map((doctor) => ({
        id: doctor.id,
        name: doctor.name,
        speciality: doctor.speciality,
        email: doctor.email,
        phone: doctor.phone,
        bio: doctor.bio,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching doctors for VAPI:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch available doctors",
      },
      { status: 500 }
    );
  }
}

