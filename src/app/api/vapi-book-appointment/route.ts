import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableDoctors } from "@/lib/actions/doctors";
import { getBookedTimeSlots, bookAppointment } from "@/lib/actions/appointments";
import { APPOINTMENT_TYPES, getAvailableTimeSlots } from "@/lib/utils";

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

// VAPI tool call format handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is a VAPI tool call format
    if (body.message?.type === "tool-calls" && body.message?.toolCallList) {
      // Handle VAPI tool call format
      const toolCalls = body.message.toolCallList;
      const results = [];

      for (const toolCall of toolCalls) {
        const { id: toolCallId, name, arguments: args } = toolCall;
        
        if (name === "book_appointment") {
          // Extract clerkId from multiple possible sources:
          // 1. Direct argument from tool call
          // 2. Call variables (if set in VAPI)
          // 3. Request headers (for web calls)
          const clerkId = args.clerkId ||
                         body.call?.variables?.clerkId ||
                         body.assistant?.variables?.clerkId ||
                         request.headers.get("x-clerk-id") ||
                         request.headers.get("x-user-id");

          const result = await handleBooking({
            doctorId: args.doctorId,
            doctorName: args.doctorName,
            date: args.date,
            time: args.time,
            appointmentType: args.appointmentType,
            reason: args.reason,
            clerkId,
          }, request);

          results.push({
            toolCallId,
            result: result,
          });
        } else if (name === "get_available_doctors") {
          // Handle getting available doctors
          const doctors = await getAvailableDoctors();
          const doctorList = doctors.map((d) => `${d.name} (${d.speciality})`).join(", ");
          results.push({
            toolCallId,
            result: `Available doctors: ${doctorList}`,
          });
        }
      }

      const origin = request.headers.get("origin");
      return NextResponse.json({ results }, { headers: getCorsHeaders(origin) });
    }

    // Fallback: Handle direct API call format (for testing)
    const { doctorId, doctorName, date, time, appointmentType, reason, clerkId } = body;
    const origin = request.headers.get("origin");

    const result = await handleBooking({
      doctorId,
      doctorName,
      date,
      time,
      appointmentType,
      reason,
      clerkId,
    }, request);

    return NextResponse.json({ message: result }, { headers: getCorsHeaders(origin) });
  } catch (error: any) {
    console.error("Error in VAPI book appointment:", error);
    const origin = request.headers.get("origin");
    return NextResponse.json(
      {
        error: error.message || "Failed to book appointment",
      },
      { status: 500, headers: getCorsHeaders(origin) }
    );
  }
}

// Helper function to handle booking logic - returns string for VAPI
async function handleBooking(
  {
    doctorId,
    doctorName,
    date,
    time,
    appointmentType,
    reason,
    clerkId,
  }: {
    doctorId?: string;
    doctorName?: string;
    date?: string;
    time?: string;
    appointmentType?: string;
    reason?: string;
    clerkId?: string;
  },
  request: NextRequest
): Promise<string> {
  try {
    // Validate required fields
    if (!date || !time) {
      return "I need both a date and time to book your appointment. Could you please provide both?";
    }

    // If clerkId is provided, use it to find the user
    let userId = null;
    if (clerkId) {
      const user = await prisma.user.findUnique({
        where: { clerkId },
      });
      if (!user) {
        return "I couldn't find your account. Please make sure you're logged in to book an appointment.";
      }
      userId = user.id;
    } else {
      return "I need to verify your account to book an appointment. Please make sure you're logged in.";
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
        return `I couldn't find a doctor named "${doctorName}". Available doctors are: ${doctorList}. Which doctor would you like to book with?`;
      }
      resolvedDoctorId = doctor.id;
    }

    if (!resolvedDoctorId) {
      // Return available doctors if no doctor specified
      const doctors = await getAvailableDoctors();
      const doctorList = doctors.map((d) => `${d.name} (${d.speciality})`).join(", ");
      return `Which doctor would you like to book with? Available doctors are: ${doctorList}`;
    }

    // Validate date format (should be YYYY-MM-DD)
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return "Invalid date format. Please provide the date in YYYY-MM-DD format, for example 2025-01-15.";
    }

    // Check if the date is in the future (at least tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);
    if (appointmentDate < tomorrow) {
      const next5Days = getNext5Days().map(d => new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })).join(", ");
      return `Appointments must be booked at least one day in advance. Available dates are: ${next5Days}. Which date would you prefer?`;
    }

    // Validate time slot
    const availableTimeSlots = getAvailableTimeSlots();
    if (!availableTimeSlots.includes(time)) {
      const timeList = availableTimeSlots.join(", ");
      return `Invalid time slot. Available times are: ${timeList}. Which time would you prefer?`;
    }

    // Check if the time slot is already booked
    const bookedSlots = await getBookedTimeSlots(resolvedDoctorId, date);
    if (bookedSlots.includes(time)) {
      const availableTimes = availableTimeSlots.filter((t) => !bookedSlots.includes(t));
      const timeList = availableTimes.length > 0 ? availableTimes.join(", ") : "none available";
      return `I'm sorry, but the time slot ${time} is already booked for this doctor on ${new Date(date).toLocaleDateString()}. Available times on that date are: ${timeList}. Would you like to choose a different time?`;
    }

    // Actually book the appointment
    const appointmentTypeObj = APPOINTMENT_TYPES.find((t) => t.id === appointmentType);
    const bookedAppointment = await bookAppointment({
      doctorId: resolvedDoctorId,
      date,
      time,
      reason: appointmentTypeObj?.name || reason || "General consultation",
    });

    // Send confirmation email
    try {
      await fetch(`${request.nextUrl.origin}/api/send-appointment-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: bookedAppointment.patientEmail,
          doctorName: bookedAppointment.doctorName,
          appointmentDate: appointmentDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          appointmentTime: time,
          appointmentType: appointmentTypeObj?.name || reason || "General consultation",
          duration: appointmentTypeObj?.duration || "30 min",
          price: appointmentTypeObj?.price || "$120",
        }),
      });
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the booking if email fails
    }

    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const formattedTime = new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return `Great! I've successfully booked your appointment with ${bookedAppointment.doctorName} on ${formattedDate} at ${formattedTime} for ${appointmentTypeObj?.name || reason || "General consultation"}. You'll receive a confirmation email shortly with all the details. Is there anything else I can help you with?`;
  } catch (error: any) {
    console.error("Error in handleBooking:", error);
    return `I encountered an error while booking your appointment: ${error.message}. Please try again or contact support if the issue persists.`;
  }
}

// Helper function for available dates
function getNext5Days(): string[] {
  const dates = [];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (let i = 0; i < 5; i++) {
    const date = new Date(tomorrow);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates;
}
