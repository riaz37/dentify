import { NextResponse } from "next/server";
import { getAvailableDoctors } from "@/lib/actions/doctors";

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

