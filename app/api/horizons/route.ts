import { NextResponse } from "next/server";

export const revalidate = 86400; // Cache for 24 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetId = searchParams.get("target_id");

  if (!targetId) {
    return NextResponse.json({ error: "Missing target_id parameter" }, { status: 400 });
  }

  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  
  const startTime = today.toISOString().split("T")[0];
  const stopTime = tomorrow.toISOString().split("T")[0];

  const params = new URLSearchParams({
    format: "json",
    COMMAND: `'${targetId}'`,
    OBJ_DATA: "'NO'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'OBSERVER'",
    CENTER: `'500@399'`, // Geocentric (Earth Center) so it works globally
    START_TIME: `'${startTime}'`,
    STOP_TIME: `'${stopTime}'`,
    STEP_SIZE: "'1 d'",
    QUANTITIES: "'1'", // 1: Astrometric RA & DEC
    CSV_FORMAT: "'YES'",
  });

  const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${params.toString()}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      throw new Error(`NASA Horizons API responded with status: ${res.status}`);
    }

    const data = await res.json();
    
    // Parse the ugly JPL Horizons text format
    const resultText = data.result;
    
    if (!resultText) throw new Error("No result in JPL payload");

    const soeIndex = resultText.indexOf("$$SOE");
    const eoeIndex = resultText.indexOf("$$EOE");
    
    if (soeIndex === -1 || eoeIndex === -1) {
      throw new Error("Could not find ephemeris data markers");
    }

    const ephemData = resultText.substring(soeIndex + 5, eoeIndex).trim();
    const lines = ephemData.split("\n");
    if (lines.length === 0) throw new Error("No ephemeris lines found");

    // Grab the first line of data
    const firstLine = lines[0];
    const columns = firstLine.split(",").map((s: string) => s.trim());
    
    // columns[0] = JDTDB
    // columns[1] = Calendar Date
    // columns[2] = R.A._(ICRF) "05 53 08.57"
    // columns[3] = DEC_(ICRF) "+24 16 00.3"

    const raString = columns[2];
    const decString = columns[3];

    // Convert "hh mm ss.f" to decimal hours
    const raParts = raString.split(" ").map(parseFloat);
    const raHours = raParts[0] + (raParts[1] || 0) / 60 + (raParts[2] || 0) / 3600;

    // Convert "dd mm ss.f" to decimal degrees
    const decParts = decString.split(" ").map(parseFloat);
    const decSign = decString.startsWith("-") ? -1 : 1;
    // Note: if dec is negative, the first part is negative, but minutes and seconds are positive
    const decDegrees = decParts[0] + decSign * ((decParts[1] || 0) / 60) + decSign * ((decParts[2] || 0) / 3600); 

    return NextResponse.json({
      target_id: targetId,
      ra: raHours,
      dec: decDegrees,
      timestamp: startTime,
    });

  } catch (error) {
    console.error("Error fetching planet telemetry from NASA JPL:", error);
    return NextResponse.json({ error: "Failed to fetch planet telemetry" }, { status: 500 });
  }
}
