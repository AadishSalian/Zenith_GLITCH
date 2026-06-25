import { NextResponse } from "next/server";

export const revalidate = 604800; // Cache Wikipedia summaries for 7 days

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 604800 },
      headers: {
        "User-Agent": "Zenith_GLITCH_Tracker/1.0",
      }
    });

    if (!res.ok) {
      // If a page isn't found, just return a graceful fallback rather than a 500 error
      if (res.status === 404) {
        return NextResponse.json({
          title: query,
          extract: "No detailed encyclopedic summary is currently available for this target in the databanks.",
        });
      }
      throw new Error(`Wikipedia API responded with status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json({
      title: data.title,
      extract: data.extract,
    });
  } catch (error) {
    console.error("Error fetching data from Wikipedia:", error);
    return NextResponse.json({ error: "Failed to fetch encyclopedic data" }, { status: 500 });
  }
}
