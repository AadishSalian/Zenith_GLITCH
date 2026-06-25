<div align="center">

# 🛰️ ZENITH // GLITCH 
**Orbital Tracking & Space Telemetry Command**

![Status](https://img.shields.io/badge/System_Status-ONLINE-00f3ff?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

*A cinematic, high-performance web application designed to track the International Space Station, Hubble Space Telescope, and planetary bodies in real-time using rigorous astronomical mathematics.*

</div>

---

## 🔭 Functionality

Unlike traditional tracking websites, **Zenith GLITCH** immerses the user in a "mission control" experience while running complex orbital mechanics under the hood. 

*   **Real-Time SGP4 Telemetry:** Decodes Two-Line Element (TLE) datasets to propagate the exact position of orbital satellites down to the millisecond.
*   **Planetary Tracking Algorithms:** Synchronizes with JPL Horizons and utilizes dynamic Local Sidereal Time (LST) calculations to plot the real-time ascension and declination of Mars, Venus, Jupiter, and Saturn against your exact local horizon.
*   **Dynamic 2D Sky Chart & Radar:** Features an interactive celestial dome projection (powered by `d3-geo`) that maps objects against the night sky, alongside an animated 360-degree sweeping radar system.
*   **Upcoming Flyover Predictions:** Interfaces with the N2YO API to calculate and schedule upcoming visible ISS passes based on selected global geodetic arrays (e.g., Kennedy Space Center, Baikonur).
*   **Immersive HUD Interface:** Features a stunning dark mode UI with interactive data readouts, simulated CRT scanline overlays, live UTC/Local clocks, and ambient space background animations.
*   **Cross-Platform Responsiveness:** The complex dashboard gracefully degrades to a highly usable, swipeable mobile experience with a dedicated bottom navigation bar.

---

## 🛠️ Technology Stack

| Category | Technologies Used |
| :--- | :--- |
| **Core Framework** | Next.js (App Router), React 19, TypeScript |
| **State Management**| Zustand (Lightweight, rapid real-time state) |
| **Styling & UI** | Tailwind CSS v4, Framer Motion, Lucide React Icons |
| **Physics & Math** | `satellite.js` (SGP4 Propagator) |
| **Data Visualization**| `d3`, `d3-geo` (Stereographic Projections) |
| **External APIs** | N2YO (Radio Passes), NASA/CelesTrak (TLE Data), JPL Horizons |

---

## 🏗️ Architecture Overview

Zenith GLITCH utilizes a **Hybrid Client-Server Architecture** to balance performance with massive data throughput:

1. **Server-Side API Layer (`/api/*`):** 
   Next.js API routes act as secure proxies to external astronomical databases (N2YO, CelesTrak). This prevents CORS issues, protects API keys, and allows us to cache heavy orbital datasets (like TLE text files) using Next.js route caching (`revalidate`).
2. **Global Telemetry Context (`SpaceTrackerContext`):** 
   A centralized React Context paired with a **Zustand** store. It orchestrates the core simulation clock and distributes telemetry data globally without triggering unnecessary cascading re-renders across the dashboard.
3. **Client-Side Physics Engine:** 
   To maintain 60 FPS, the actual orbital math (SGP4 propagation, Azimuth/Elevation calculation) happens purely on the client side. The physics loop operates independently of React's render cycle using `setInterval` and `useRef` to compute positional updates, only flushing to React state when necessary for UI updates.
4. **Declarative SVG/D3 Rendering:**
   The `SkyChart` and `SkyRadar` components leverage D3.js not for DOM manipulation, but purely as a mathematical projector (`d3.geoStereographic`). The resulting SVG paths are passed back to React for declarative, highly performant rendering.

---

## 🧠 Implementation Approach

Building a real-time space tracker presented significant performance and mathematical challenges. Our implementation strategy focused on two pillars: **Mathematical Accuracy** and **Browser Performance**.

*   **Handling the Math:** Plotting a planet against a local sky requires converting Equatorial Coordinates (Right Ascension/Declination) to Horizontal Coordinates (Azimuth/Elevation). We implemented custom math to calculate precise *Greenwich Mean Sidereal Time* to account for the Earth's true rotation (~23h 56m 4s), ensuring planets plot perfectly against the stars regardless of the time of year.
*   **React Performance Optimization:** We aggressively decoupled the simulation tick from the UI render. The `SpaceBackground` (starfield) runs highly optimized CSS/SVG animations, while the heavy `PlanetTracker` and `ISSTracker` components only subscribe to the specific slices of the Zustand state they care about. 
*   **Fallback Mechanisms:** Space APIs are notoriously unreliable. The backend is built with hardcoded fallback TLE strings and fallback API keys to ensure the dashboard remains 100% operational even if external space agencies experience server outages.

---

## 🚀 Project Setup

Follow these steps to deploy the command center locally.

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/zenith-glitch.git
cd zenith-glitch
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory. *(Note: The codebase has a built-in fallback for N2YO in case this is omitted).*
```env
N2YO_API_KEY=your_n2yo_api_key_here
```

### 4. Boot the Telemetry Server
Launch the Next.js development environment:
```bash
npm run dev
```

### 5. Access the HUD
Open your browser and navigate to: [http://localhost:3000](http://localhost:3000)

---

## 🔮 Future Enhancements

While Zenith GLITCH is fully operational, the following upgrades are planned for future iterations:
1. **WebGL 3D Globe Integration:** Replacing the 2D tracking map with a fully interactive WebGL/Three.js Earth model for true 3D spatial tracking.
2. **Expanded Satellite Constellations:** Adding support for tracking Starlink arrays, weather satellites, and active orbital debris.
3. **WebSockets for Live Telemetry:** Transitioning from 2-second HTTP polling to a WebSocket stream for true millisecond-accurate visual tracking.
4. **Push Notifications:** Implementing PWA features to send users browser notifications 5 minutes before the ISS flies over their exact location.

---
