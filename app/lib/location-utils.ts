export async function reverseGeocode(lat: number, lon: number): Promise<{ city: string; country: string } | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
      },
      // Cache the request to avoid hitting rate limits
      cache: 'force-cache',
    });
    
    if (!res.ok) throw new Error('Geocoding failed');
    
    const data = await res.json();
    
    const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown Location';
    const country = data.address?.country || 'Unknown Country';
    
    // For ocean locations, nominatim might not return a country/city easily.
    if (data.error || (!data.address?.country && !data.address?.city)) {
      return { city: 'Oceanic Coordinate', country: 'International Waters' };
    }
    
    return { city, country };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return { city: 'Unknown Location', country: 'Unknown' };
  }
}

export function getLocalTime(lon: number): string {
  // Rough estimate of time zone offset based on longitude
  const offsetHours = Math.round(lon / 15);
  
  const date = new Date();
  // Get UTC time in ms
  const utcMs = date.getTime() + (date.getTimezoneOffset() * 60000);
  
  // Create a new date object for the target location
  const localDate = new Date(utcMs + (3600000 * offsetHours));
  
  return localDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'shortOffset'
  });
}
