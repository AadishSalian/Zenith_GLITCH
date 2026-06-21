# Zenith Glitch

**A futuristic, real-time geodetic coordinate tracking cockpit and cosmic telemetry dashboard.**

Zenith Glitch represents the next generation of space exploration interfaces. Designed to simulate a premium aerospace mission control center, it empowers users to explore and track celestial objects, satellites, and planetary bodies from a highly interactive, cinematic dashboard.

## My Enhancements & Implementations

### Interactive Geospatial Grid
- **Module Integration:** Integrated and configured an interactive Leaflet.js mapping module for real-time tracking.
- **Fluid Navigation:** Enabled highly responsive user panning across the global grid.
- **Precision Targeting:** Implemented click-to-select targeting coordinates for pinpoint geographic accuracy.
- **Zoom Tracking:** Integrated functional zoom tracking control events (`+` / `-`) for detailed geospatial analysis.

### Dynamic Canvas Background Asset
- **Rendering Engine:** Built a fully responsive, full-viewport HTML5 `<canvas>` rendering engine.
- **Hardware Acceleration:** Handles high-performance, interactive particle effects without compromising the primary layout's frame rates.
- **Event-Driven Visuals:** Dynamically spawns glowing shooting stars and trailing cosmic effects triggered directly by user mouse movements (`onMouseMove`).

### Typography, Style, & Contrast Optimization
- **Readability:** Upgraded all visual interface components to maximize text legibility across complex data modules.
- **Modern Typefaces:** Swapped legacy compressed font layers with clean, high-contrast modern sans-serif typefaces (Inter and Roboto).
- **Responsive Scaling:** Refined and scaled layout font properties to maintain strict visual hierarchy and a premium aesthetic on all viewport sizes.

## Shared Infrastructure & Core Stack

The architecture relies on modern web technologies engineered for high performance, reliability, and maintainability.

| Technology | Implementation Scope |
| :--- | :--- |
| **Next.js 14** | Core framework driving the React application, application routing, and rendering optimizations. |
| **TypeScript** | Strict static typing ensuring reliability for all telemetry data streams and component states. |
| **Tailwind CSS** | Utility-first framework powering the cyberpunk, high-contrast visual design system and UI components. |
| **Zustand** | Centralized global state tracking architecture and reactive data bank management. |

## API Architecture & Data Sources

- **OpenNotify API (`/api/iss`):** Used as a real-time proxy data stream to fetch the exact, live coordinate path (latitude and longitude) of the International Space Station as it orbits Earth every couple of seconds.
- **NASA JPL Horizons API (`/api/horizons`):** Used to retrieve highly precise celestial coordinates, tracking vectors, and position metrics for planets within our solar system.
- **Leaflet & OpenStreetMap Tile API:** Used to pull down the dark, high-contrast geographical map tiles that form the underlying visual grid of our location targeting map dashboard.

## Geospatial Data Verifications

The underlying data pipeline is rigorously validated to ensure accurate cosmic and terrestrial tracking:

- **Telemetry Sources:** Core coordinate telemetry is fetched reliably through public aerospace mapping coordinates and external orbital calculation frameworks.
- **Pipeline Integrity:** Data points are continuously synchronized with the central Zustand data bank, verifying that all geodetic readouts, orbital passes, and celestial tracking paths remain accurate to real-world geospatial events.
