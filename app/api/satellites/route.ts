import { NextResponse } from "next/server";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const res = await fetch("https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle", {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch TLE data: ${res.statusText}`);
    }

    const text = await res.text();
    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("Error fetching satellites TLE:", error);
    return new NextResponse("Error fetching satellite data", { status: 500 });
  }
}
