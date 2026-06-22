export interface RadarObject {
  id: string
  type: 'iss' | 'satellite' | 'planet' | 'star'
  label: string
  azimuth: number      // 0–360 degrees, 0 = North
  elevation: number    // 0–90 degrees, 90 = zenith
  color: string        // hex color string
  size?: number        // dot radius override
  trail?: Array<{ azimuth: number; elevation: number }>
}

export function polarToCartesian(azimuth: number, elevation: number, radius: number) {
  // Center is elevation 90, edge is elevation 0
  const r = ((90 - elevation) / 90) * radius;
  // Azimuth 0 is North (-y), 90 is East (+x)
  const theta = (azimuth - 90) * (Math.PI / 180);
  return {
    x: r * Math.cos(theta),
    y: r * Math.sin(theta)
  };
}
