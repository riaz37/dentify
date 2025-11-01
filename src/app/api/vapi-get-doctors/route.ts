import { NextRequest, NextResponse } from "next/server";
import { getAvailableDoctors } from "@/lib/actions/doctors";

// Handle VAPI tool call format
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is a VAPI tool call format
    if (body.message?.type === "tool-calls" && body.message?.toolCallList) {
      const toolCalls = body.message.toolCallList;
      const results = [];

      for (const toolCall of toolCalls) {
        const toolCallId = toolCall.id;
        const functionName = toolCall.function?.name;
        
        if (functionName === "get_available_doctors") {
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

    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 }
    );
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

