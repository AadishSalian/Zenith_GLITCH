import { NextResponse } from "next/server";

// Cache for just 2 seconds to allow real-time updates without spamming the source too hard if multiple users hit the proxy
export const revalidate = 2; 

export async function GET() {
  try {
    let data = null;

    // Try primary API (open-notify)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const res = await fetch("http://api.open-notify.org/iss-now.json", {
        signal: controller.signal,
        next: { revalidate: 2 },
      });
      
      clearTimeout(timeoutId);

      if (res.ok) {
        data = await res.json();
      }
    } catch (e) {
      // Ignore timeout or fetch error, fallback to secondary API
      console.warn("Primary ISS API failed, falling back...");
    }

    // Try secondary API (wheretheiss.at) if primary failed
    if (!data) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const res = await fetch("https://api.wheretheiss.at/v1/satellites/25544", {
        signal: controller.signal,
        next: { revalidate: 2 },
      });
      
      clearTimeout(timeoutId);

      if (res.ok) {
        const fallbackData = await res.json();
        // Normalize response to match what the frontend expects
        data = {
          iss_position: {
            latitude: fallbackData.latitude.toString(),
            longitude: fallbackData.longitude.toString(),
          },
          message: "success",
          timestamp: fallbackData.timestamp,
        };
      } else {
        throw new Error("Both ISS APIs failed");
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching ISS data:", error);
    // Return a 500 error, the client will catch it and ignore the update
    return new NextResponse("Error fetching ISS data", { status: 500 });
  }
}
