import { NextResponse } from "next/server";

export const revalidate = 86400; // Cache timezones for 24 hours (they rarely change)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat or lng parameters" }, { status: 400 });
  }

  const apiKey = process.env.TIMEZONE_DB_API_KEY;
  if (!apiKey) {
    console.error("TIMEZONE_DB_API_KEY is missing in environment variables.");
    return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
  }

  const url = `http://api.timezonedb.com/v2.1/get-time-zone?key=${apiKey}&format=json&by=position&lat=${lat}&lng=${lng}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      throw new Error(`TimeZoneDB API responded with status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching timezone data from TimeZoneDB:", error);
    return NextResponse.json({ error: "Failed to fetch timezone data" }, { status: 500 });
  }
}
