import type { Metadata } from "next";
import { Orbitron, Inter } from "next/font/google";
import "./globals.css";
import { SpaceTrackerProvider } from "./components/SpaceTrackerContext";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Zenith GLITCH | Orbital Tracking & Space Telemetry Command",
  description: "Futuristic real-time space tracking console. Locate and monitor the ISS, Hubble Telescope, and planets above your horizon with deep space telemetry alignment.",
  keywords: ["space tracker", "ISS tracking", "celestial coordinates", "planets visibility", "NASA", "SpaceX", "astronomy", "orbital tracking"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#020205] text-[#ededed] font-sans selection:bg-[#00f3ff]/30 selection:text-[#00f3ff]">
        <SpaceTrackerProvider>
          {children}
        </SpaceTrackerProvider>
      </body>
    </html>
  );
}
