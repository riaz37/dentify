import { NextRequest, NextResponse } from "next/server";
import { getAvailableDoctors } from "@/lib/actions/doctors";
import { getBookedTimeSlots } from "@/lib/actions/appointments";
import { getAvailableTimeSlots } from "@/lib/utils";

// Helper function to get available appointment times
async function handleGetAvailableTimes({
  doctorId,
  doctorName,
  date,
}: {
  doctorId?: string;
  doctorName?: string;
  date?: string;
}): Promise<string> {
  try {
    // Validate date is provided
    if (!date) {
      return "I need a date to check available appointment times. Please provide a date in YYYY-MM-DD format.";
    }

    // Validate date format
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return "Invalid date format. Please provide the date in YYYY-MM-DD format, for example 2025-01-15.";
    }

    // Resolve doctor ID if only doctor name is provided
    let resolvedDoctorId = doctorId;
    if (!doctorId && doctorName) {
      const doctors = await getAvailableDoctors();
      const doctor = doctors.find(
        (d) => d.name.toLowerCase() === doctorName.toLowerCase()
      );
      if (!doctor) {
        const doctorList = doctors.map((d) => `${d.name} (${d.speciality})`).join(", ");
        return `I couldn't find a doctor named "${doctorName}". Available doctors are: ${doctorList}.`;
      }
      resolvedDoctorId = doctor.id;
    }

    if (!resolvedDoctorId) {
      const doctors = await getAvailableDoctors();
      const doctorList = doctors.map((d) => `${d.name} (${d.speciality})`).join(", ");
      return `Please specify which doctor you'd like to check availability for. Available doctors are: ${doctorList}`;
    }

    // Get all available time slots and booked time slots
    const allTimeSlots = getAvailableTimeSlots();
    const bookedSlots = await getBookedTimeSlots(resolvedDoctorId, date);

    // Filter out booked slots
    const availableSlots = allTimeSlots.filter((slot) => !bookedSlots.includes(slot));

    if (availableSlots.length === 0) {
      return `Unfortunately, there are no available appointment times for ${new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}. Would you like to check a different date?`;
    }

    // Format times for display (e.g., "9:00 AM", "2:30 PM")
    const formattedTimes = availableSlots.map((time) => {
      const timeDate = new Date(`2000-01-01T${time}`);
      return timeDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    });

    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    return `Available appointment times on ${formattedDate} are: ${formattedTimes.join(", ")}. Which time would you prefer?`;
  } catch (error: any) {
    console.error("Error in handleGetAvailableTimes:", error);
    return `I encountered an error while checking available times: ${error.message}. Please try again.`;
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
        
        if (functionName === "get_available_times") {
          const result = await handleGetAvailableTimes({
            doctorId: args.doctorId,
            doctorName: args.doctorName,
            date: args.date,
          });
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
    console.error("Error in VAPI get available times:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to get available times",
      },
      { status: 500 }
    );
  }
}

