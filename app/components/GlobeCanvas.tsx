"use client";

import React, { useEffect, useRef, useState } from "react";
import { ACESFilmicToneMapping, AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, Clock, Mesh, MeshBasicMaterial, PerspectiveCamera, Points, PointsMaterial, Raycaster, Scene, ShaderMaterial, SphereGeometry, Vector2, Vector3, WebGLRenderer } from "three";
import gsap from "gsap";
import { formatCoords } from "../lib/globe-utils";

interface GlobeCanvasProps {
  onLocationSelect: (lat: number, lon: number) => void;
  className?: string;
}

export const GlobeCanvas: React.FC<GlobeCanvasProps> = ({ onLocationSelect, className = "" }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const globeRef = useRef<Mesh | null>(null);
  const atmosphereRef = useRef<Mesh | null>(null);
  const markerRef = useRef<Mesh | null>(null);
  const clockRef = useRef<Clock>(new Clock());
  
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const autoRotateRef = useRef(true);
  const autoRotateSpeedRef = useRef({ current: 0.0015 });
  const selectedCoordsRef = useRef<{ lat: number; lon: number } | null>(null);

  const [hoverCoords, setHoverCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [lockedCoords, setLockedCoords] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    let alive = true;
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // --- Renderer ---
    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Scene & Camera ---
    const scene = new Scene();
    scene.background = null;
    sceneRef.current = scene;

    const camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 2.8);
    cameraRef.current = camera;

    // --- Globe ---
    const globeGeometry = new SphereGeometry(1, 64, 64);
    
    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform vec3 uLightDir;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;

      // Procedural grid lines for lat/lon graticule
      float gridLine(float coord, float spacing, float thickness) {
        float line = abs(fract(coord / spacing) - 0.5);
        return smoothstep(thickness, 0.0, line);
      }

      void main() {
        // Base deep ocean color
        vec3 oceanColor = vec3(0.02, 0.06, 0.18);
        
        // Subtle continent shapes via noise (use vUv to create landmass feel)
        float nx = sin(vUv.x * 12.0 + 1.2) * cos(vUv.y * 8.0 + 0.5);
        float ny = cos(vUv.x * 7.0 - 0.8) * sin(vUv.y * 11.0 + uTime * 0.04);
        float landMask = smoothstep(0.15, 0.55, nx * 0.5 + ny * 0.3 + 0.3);
        vec3 landColor = vec3(0.04, 0.14, 0.28);
        vec3 baseColor = mix(oceanColor, landColor, landMask);

        // Lat/lon grid overlay
        float latGrid = gridLine(vUv.y, 0.0833, 0.004);   // every 30 degrees
        float lonGrid = gridLine(vUv.x, 0.0556, 0.004);   // every 20 degrees
        float grid = max(latGrid, lonGrid);
        vec3 gridColor = vec3(0.1, 0.35, 0.6);
        baseColor = mix(baseColor, gridColor, grid * 0.5);

        // Equator and prime meridian brighter
        float equator = gridLine(vUv.y, 0.5, 0.003);
        float meridian = gridLine(vUv.x, 1.0, 0.003);
        baseColor += vec3(0.05, 0.15, 0.3) * max(equator, meridian);

        // Diffuse lighting from a sun position
        float diffuse = max(dot(vNormal, normalize(uLightDir)), 0.0);
        float ambient = 0.15;
        float light = ambient + diffuse * 0.85;
        baseColor *= light;

        // Fresnel rim glow (cyan at edges)
        float fresnel = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.5);
        vec3 rimColor = vec3(0.1, 0.6, 0.9);
        baseColor += rimColor * fresnel * 0.4;

        gl_FragColor = vec4(baseColor, 1.0);
      }
    `;

    const globeMaterial = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uLightDir: { value: new Vector3(5, 3, 5).normalize() }
      }
    });

    const globe = new Mesh(globeGeometry, globeMaterial);
    scene.add(globe);
    globeRef.current = globe;

    // --- Atmosphere ---
    const atmosphereGeometry = new SphereGeometry(1.15, 64, 64);
    const atmosphereFragmentShader = `
      varying vec3 vNormal;

      void main() {
        float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
        vec3 atmosphereColor = vec3(0.1, 0.5, 1.0);
        gl_FragColor = vec4(atmosphereColor, intensity * 0.7);
      }
    `;
    const atmosphereMaterial = new ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: atmosphereFragmentShader,
      side: BackSide,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    
    const atmosphere = new Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);
    atmosphereRef.current = atmosphere;

    // --- Stars ---
    const starsGeometry = new BufferGeometry();
    const starPositions = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 80 + Math.random() * 20;
      starPositions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i*3+2] = r * Math.cos(phi);
    }
    starsGeometry.setAttribute('position', new BufferAttribute(starPositions, 3));
    const starsMaterial = new PointsMaterial({
      color: 0xffffff,
      size: 0.12,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8
    });
    const stars = new Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // --- Entry Animation ---
    globe.scale.set(0, 0, 0);
    globe.rotation.y = Math.PI; // rotated 180
    gsap.to(globe.scale, {
      x: 1, y: 1, z: 1,
      duration: 1.6,
      ease: 'back.out(1.2)',
      delay: 0.4
    });
    gsap.from(atmosphereMaterial, {
      opacity: 0,
      duration: 2.4,
      delay: 0.8,
      ease: 'power2.out'
    });

    // --- Functions ---
    const placeMarker = (lat: number, lon: number) => {
      if (markerRef.current) globe.remove(markerRef.current);

      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);

      const markerGeom = new SphereGeometry(0.022, 16, 16);
      const markerMat = new MeshBasicMaterial({ color: 0x00ffcc });
      const marker = new Mesh(markerGeom, markerMat);

      marker.position.set(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta)
      );

      const ringGeom = new SphereGeometry(0.035, 16, 16);
      const ringMat = new MeshBasicMaterial({
        color: 0x00ffcc,
        wireframe: true,
        transparent: true,
        opacity: 0.4
      });
      const ring = new Mesh(ringGeom, ringMat);
      ring.position.copy(marker.position);

      globe.add(marker);
      globe.add(ring);
      
      // Store reference to marker + ring by storing marker, and we'll remove both or just add ring to marker
      // Wait, ring is added to globe directly based on the snippet. Let's add ring to marker instead.
      globe.remove(ring);
      ring.position.set(0, 0, 0);
      marker.add(ring);
      
      markerRef.current = marker;

      gsap.to(ring.scale, {
        x: 2.5, y: 2.5, z: 2.5,
        duration: 1.2,
        repeat: -1,
        ease: 'power1.out'
      });
      gsap.to(ringMat, {
        opacity: 0,
        duration: 1.2,
        repeat: -1,
        ease: 'power1.out'
      });
    };

    const animateCameraFlyTo = (lat: number, lon: number) => {
      autoRotateRef.current = false;

      const targetRotY = -(lon * Math.PI / 180);
      const targetRotX = -(lat * Math.PI / 180) * 0.4;

      gsap.to(globe.rotation, {
        y: targetRotY,
        x: targetRotX,
        duration: 1.4,
        ease: 'power3.inOut'
      });

      gsap.to(camera.position, {
        z: 2.2,
        duration: 1.4,
        ease: 'power3.inOut'
      });

      setTimeout(() => {
        if (!alive) return;
        setLockedCoords({ lat, lon });
        onLocationSelect(
          Math.round(lat * 1000) / 1000,
          Math.round(lon * 1000) / 1000
        );
      }, 1600);
    };

    const onGlobeClick = (e: MouseEvent) => {
      if (!mountRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new Raycaster();
      raycaster.setFromCamera(new Vector2(x, y), camera);
      const hits = raycaster.intersectObject(globe);

      if (hits.length > 0) {
        const point = hits[0].point.clone();
        const invRotation = globe.quaternion.clone().invert();
        point.applyQuaternion(invRotation);
        point.normalize();

        const lat = Math.asin(point.y) * (180 / Math.PI);
        const lon = Math.atan2(point.x, point.z) * (180 / Math.PI);

        placeMarker(lat, lon);
        animateCameraFlyTo(lat, lon);
        selectedCoordsRef.current = { lat, lon };
      }
    };

    // --- Event Listeners ---
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      autoRotateRef.current = false;
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
      mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const deltaX = e.clientX - previousMouseRef.current.x;
        const deltaY = e.clientY - previousMouseRef.current.y;
        globe.rotation.y += deltaX * 0.005;
        globe.rotation.x += deltaY * 0.005;
        globe.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globe.rotation.x));
        previousMouseRef.current = { x: e.clientX, y: e.clientY };
      }

      // GSAP hover slow down
      gsap.to(autoRotateSpeedRef.current, { current: 0.0004, duration: 0.3 });

      // HUD Hover Coordinate logic
      if (!isDraggingRef.current && mountRef.current && !selectedCoordsRef.current) {
        const rect = mountRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new Raycaster();
        raycaster.setFromCamera(new Vector2(x, y), camera);
        const hits = raycaster.intersectObject(globe);

        if (hits.length > 0) {
          const point = hits[0].point.clone();
          const invRotation = globe.quaternion.clone().invert();
          point.applyQuaternion(invRotation);
          point.normalize();

          const lat = Math.asin(point.y) * (180 / Math.PI);
          const lon = Math.atan2(point.x, point.z) * (180 / Math.PI);
          setHoverCoords({ lat, lon });
        } else {
          setHoverCoords(null);
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      isDraggingRef.current = false;
      setTimeout(() => { 
        if(alive) autoRotateRef.current = true; 
      }, 2000);

      const deltaX = Math.abs(e.clientX - mouseDownPosRef.current.x);
      const deltaY = Math.abs(e.clientY - mouseDownPosRef.current.y);
      if (deltaX < 3 && deltaY < 3 && !selectedCoordsRef.current) {
        onGlobeClick(e);
      }
    };

    const onMouseLeave = () => {
      gsap.to(autoRotateSpeedRef.current, { current: 0.0015, duration: 1.2 });
      setHoverCoords(null);
      isDraggingRef.current = false;
    };

    const onResize = () => {
      if (!mountRef.current) return;
      const { width, height } = mountRef.current.getBoundingClientRect();
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const canvasEl = mountRef.current;
    window.addEventListener("resize", onResize);
    canvasEl.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvasEl.addEventListener("mouseleave", onMouseLeave);

    // --- Render Loop ---
    let rafId: number;
    const animate = () => {
      if (!alive) return;
      rafId = requestAnimationFrame(animate);

      if (autoRotateRef.current && !isDraggingRef.current) {
        globe.rotation.y += autoRotateSpeedRef.current.current;
      }

      globeMaterial.uniforms.uTime.value = clockRef.current.getElapsedTime();
      renderer.render(scene, camera);
    };
    animate();

    // --- Cleanup ---
    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
      gsap.killTweensOf([globe.rotation, globe.scale, camera.position, autoRotateSpeedRef.current]);
      
      renderer.dispose();
      globeGeometry.dispose();
      globeMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
      
      window.removeEventListener("resize", onResize);
      canvasEl.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvasEl.removeEventListener("mouseleave", onMouseLeave);
      
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [onLocationSelect]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mountRef} className="absolute inset-0 cursor-crosshair z-0" />

      {/* Coordinate Display Overlay HUD */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
        {lockedCoords ? (
          <div className="font-mono text-[11px] text-cyan-400/90 tracking-widest animate-in fade-in duration-300">
            <div className="flex flex-col gap-2">
              <span className="text-white font-bold">LOCKED TARGET</span>
              <span>{formatCoords(lockedCoords.lat, lockedCoords.lon)}</span>
              <button className="mt-2 pointer-events-auto px-4 py-1.5 border border-cyan-500/50 rounded-full hover:bg-cyan-500/20 transition-colors">
                Confirm location →
              </button>
            </div>
          </div>
        ) : hoverCoords ? (
          <div className="font-mono text-[11px] text-cyan-400/70 tracking-widest animate-in fade-in duration-300">
            <span>{formatCoords(hoverCoords.lat, hoverCoords.lon)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default GlobeCanvas;

