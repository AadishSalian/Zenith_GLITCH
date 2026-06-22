import { NextResponse } from "next/server";

// Cache for just 2 seconds to allow real-time updates without spamming the source too hard if multiple users hit the proxy
export const revalidate = 2; 

export async function GET() {
  try {
    const res = await fetch("http://api.open-notify.org/iss-now.json", {
      next: { revalidate: 2 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch ISS data`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return new NextResponse("Error fetching ISS data", { status: 500 });
  }
}
