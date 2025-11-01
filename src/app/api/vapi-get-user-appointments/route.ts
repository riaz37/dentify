import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserAppointments } from "@/lib/actions/appointments";

// Helper function to get user appointments and format for VAPI
async function handleGetUserAppointments(clerkId?: string): Promise<string> {
  try {
    if (!clerkId) {
      return "I need to verify your account to view your appointments. Please make sure you're logged in.";
    }

    // Find user by clerkId to get the database userId
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return "I couldn't find your account. Please make sure you're logged in.";
    }

    // Use the server action to get appointments
    const appointments = await getUserAppointments(user.id);

    if (appointments.length === 0) {
      return "You don't have any upcoming appointments scheduled. Would you like to book one?";
    }

    // Filter to only upcoming appointments (date >= today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingAppointments = appointments.filter((appt) => {
      const apptDate = new Date(appt.date);
      apptDate.setHours(0, 0, 0, 0);
      return apptDate >= today && appt.status === "CONFIRMED";
    });

    const pastAppointments = appointments.filter((appt) => {
      const apptDate = new Date(appt.date);
      apptDate.setHours(0, 0, 0, 0);
      return apptDate < today || appt.status === "COMPLETED";
    });

    if (upcomingAppointments.length === 0) {
      return `You don't have any upcoming appointments. You have ${pastAppointments.length} past appointment${pastAppointments.length === 1 ? "" : "s"}. Would you like to book a new appointment?`;
    }

    // Format upcoming appointments
    const formattedAppointments = upcomingAppointments.map((appt) => {
      const apptDate = new Date(appt.date);
      const formattedDate = apptDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });

      // Format time (e.g., "14:30" -> "2:30 PM")
      const timeDate = new Date(`2000-01-01T${appt.time}`);
      const formattedTime = timeDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      return `- ${appt.doctorName} on ${formattedDate} at ${formattedTime} for ${appt.reason || "General consultation"}`;
    });

    let response = `You have ${upcomingAppointments.length} upcoming appointment${upcomingAppointments.length === 1 ? "" : "s"}: ${formattedAppointments.join(". ")}.`;

    if (pastAppointments.length > 0) {
      response += ` You also have ${pastAppointments.length} past appointment${pastAppointments.length === 1 ? "" : "s"}.`;
    }

    return response;
  } catch (error: any) {
    console.error("Error in handleGetUserAppointments:", error);
    return `I encountered an error while fetching your appointments: ${error.message}. Please try again.`;
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
        const toolCallId = toolCall.id;
        const functionName = toolCall.function?.name;
        const args = toolCall.function?.arguments || {};
        
        if (functionName === "get_user_appointments") {
          // Extract clerkId from multiple possible sources:
          // 1. Direct argument from tool call
          // 2. Call variables (if set in VAPI)
          // 3. Request headers (for web calls)
          const clerkId = args.clerkId ||
                         body.call?.variables?.clerkId ||
                         body.assistant?.variables?.clerkId ||
                         request.headers.get("x-clerk-id") ||
                         request.headers.get("x-user-id");

          const result = await handleGetUserAppointments(clerkId);
          results.push({
            toolCallId,
            result: result,
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
    console.error("Error in VAPI get user appointments:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to get user appointments",
      },
      { status: 500 }
    );
  }
}

