import { NextResponse } from "next/server";

export const revalidate = 3600; // Cache for 1 hour

const FALLBACK_TLE = `ISS (ZARYA)
1 25544U 98067A   23272.53696759  .00015606  00000-0  28236-3 0  9997
2 25544  51.6416 313.1119 0004123 252.0515 220.2464 15.50021663418182
HST
1 20580U 90037B   23272.24722222  .00001000  00000-0  50000-4 0  9993
2 20580  28.4695 328.6180 0002821 289.4796  70.5204 15.00000000142385
NOAA 19
1 33591U 09005A   23272.51864157  .00000115  00000-0  85542-4 0  9992
2 33591  99.1912  85.2045 0013917 197.8000 162.2785 14.12644265753063`;

export async function GET() {
  try {
    const targetUrl = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle";
    
    let res;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      res = await fetch(targetUrl, {
        headers: {
          "User-Agent": "ZenithGlitch/1.0"
        },
        signal: controller.signal,
        next: { revalidate: 3600 },
      });
      
      clearTimeout(timeoutId);
    } catch(e) {
      // Ignore network or timeout errors here to fall back
    }

    if (!res || !res.ok) {
      console.warn("CelesTrak fetch failed, using fallback TLEs.");
      return new NextResponse(FALLBACK_TLE, {
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "public, s-maxage=3600",
        },
      });
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
