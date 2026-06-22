import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return new NextResponse("Missing lat/lon", { status: 400 });
  }

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=cloud_cover`);
    
    if (!res.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return new NextResponse("Error fetching weather", { status: 500 });
  }
}
