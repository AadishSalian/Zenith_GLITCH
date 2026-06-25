import { NextResponse } from "next/server";

export const revalidate = 600; // Cache for 10 minutes (600 seconds)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  // Alt defaults to 0 if not provided
  const alt = searchParams.get("alt") || "0";
  // Search for the next 2 days to ensure we get a few passes
  const days = "2"; 

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat or lng parameters" }, { status: 400 });
  }

  const apiKey = process.env.N2YO_API_KEY || "PJ3Y4D-Y5B4L3-GXP52Y-5S83";
  if (!apiKey) {
    console.error("N2YO API Key is missing in environment variables.");
    return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
  }

  // 25544 is the NORAD ID for the International Space Station
  // Added 15 as the minimum elevation parameter (required by N2YO API)
  const url = `https://api.n2yo.com/rest/v1/satellite/radiopasses/25544/${lat}/${lng}/${alt}/${days}/15?apiKey=${apiKey}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      throw new Error(`N2YO API responded with status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching pass predictions from N2YO:", error);
    return NextResponse.json({ error: "Failed to fetch pass predictions" }, { status: 500 });
  }
}
