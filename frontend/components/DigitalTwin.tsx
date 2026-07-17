'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

interface DigitalTwinProps {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  type: 'SERVER' | 'LAPTOP' | 'MONITOR' | 'PHONE' | 'ROUTER' | 'PRINTER' | 'KEYBOARD';
  showHeatmap?: boolean;
  showPathfinding?: boolean;
}

/**
 * VaultIQ Digital Twin Engine (V2)
 * Renders a high-fidelity 3D representation with tech-grid, bloom, and optional heatmaps.
 */
export default function DigitalTwin({ status, type, showHeatmap = false, showPathfinding = false }: DigitalTwinProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Setup Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;

    // 2. Add Tech Grid
    const gridHelper = new THREE.GridHelper(10, 20, 0x00E5FF, 0x111936);
    gridHelper.position.y = -1.2;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.2;
    scene.add(gridHelper);

    const animators: (() => void)[] = [];

    // 2.5 Optional Heatmap Overlay (Phase 1)
    if (showHeatmap) {
      // Create a glowing circular plane to simulate heat spreading
      const heatGeom = new THREE.PlaneGeometry(3, 3);
      
      // Creating a radial gradient texture procedurally using Canvas
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 256;
      const context = canvas.getContext('2d');
      if (context) {
        const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0, 'rgba(255, 0, 68, 0.8)'); // Hot center
        gradient.addColorStop(0.4, 'rgba(255, 171, 0, 0.5)'); // Warm mid
        gradient.addColorStop(1, 'rgba(0, 229, 255, 0)'); // Cool edge
        context.fillStyle = gradient;
        context.fillRect(0, 0, 256, 256);
      }
      const heatTexture = new THREE.CanvasTexture(canvas);
      
      const heatMat = new THREE.MeshBasicMaterial({
        map: heatTexture,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const heatmapMesh = new THREE.Mesh(heatGeom, heatMat);
      heatmapMesh.rotation.x = -Math.PI / 2;
      heatmapMesh.position.y = -1.15; // Just above grid
      scene.add(heatmapMesh);

      // Pulse heatmap slightly
      animators.push(() => {
        const scale = 1.0 + Math.sin(Date.now() * 0.002) * 0.1;
        heatmapMesh.scale.set(scale, scale, 1);
        heatMat.opacity = 0.6 + Math.sin(Date.now() * 0.005) * 0.2;
      });
    }

    // 3. Add Asset Geometry
    const group = new THREE.Group();

    const statusColors = {
      HEALTHY: 0x00E5FF,
      WARNING: 0xFFAB00,
      CRITICAL: 0xFF1744,
    };
    const mainColor = statusColors[status];

    const material = new THREE.MeshPhysicalMaterial({ 
      color: mainColor,
      metalness: 0.9,
      roughness: 0.1,
      emissive: mainColor,
      emissiveIntensity: 0.4,
      transmission: 0.5,
      thickness: 0.5,
    });

    const wireframeMat = new THREE.LineBasicMaterial({ 
      color: mainColor, 
      transparent: true, 
      opacity: 0.5 
    });

    const addMesh = (geom: THREE.BufferGeometry, position: [number, number, number], rotation: [number, number, number] = [0,0,0]) => {
      const mesh = new THREE.Mesh(geom, material);
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      const wire = new THREE.LineSegments(new THREE.EdgesGeometry(geom), wireframeMat);
      mesh.add(wire);
      group.add(mesh);
      return mesh; // return so we can animate it
    };

    if (type === 'SERVER') {
      // Server Rack
      const rack = new THREE.BoxGeometry(1, 2, 1);
      addMesh(rack, [0, 0, 0]);
      // Servers inside
      const servers: THREE.Mesh[] = [];
      for(let i=0; i<4; i++) {
         const srv = new THREE.BoxGeometry(0.9, 0.2, 0.9);
         const mesh = addMesh(srv, [0, -0.6 + (i * 0.4), 0]);
         servers.push(mesh);
         
         // If warning/critical, highlight the second server to simulate a faulty component
         if ((status === 'WARNING' || status === 'CRITICAL') && i === 1) {
            const faultyMaterial = new THREE.MeshPhysicalMaterial({ 
              color: statusColors[status],
              metalness: 0.9, roughness: 0.1,
              emissive: statusColors[status],
              transmission: 0.5, thickness: 0.5,
            });
            mesh.material = faultyMaterial;
            animators.push(() => {
              faultyMaterial.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.01) * 0.5;
            });
         }
      }
      // Animation: slightly pulse the servers forward/back
      animators.push(() => {
        servers.forEach((s, i) => {
           s.position.z = Math.sin(Date.now() * 0.003 + i) * 0.03;
        });
      });
    } else if (type === 'LAPTOP') {
      const base = new THREE.BoxGeometry(1.6, 0.08, 1.1);
      addMesh(base, [0, -0.04, 0]);
      const screen = new THREE.BoxGeometry(1.6, 1.1, 0.05);
      const screenMesh = addMesh(screen, [0, 0.55, -0.55], [-0.2, 0, 0]);
      // Animation: gently open/close screen slightly
      animators.push(() => {
        screenMesh.rotation.x = -0.2 + Math.sin(Date.now() * 0.001) * 0.05;
      });
    } else if (type === 'MONITOR') {
      const standBase = new THREE.BoxGeometry(0.6, 0.05, 0.4);
      addMesh(standBase, [0, -0.5, 0]);
      const neck = new THREE.CylinderGeometry(0.05, 0.05, 0.6);
      addMesh(neck, [0, -0.2, 0]);
      const display = new THREE.BoxGeometry(1.8, 1.1, 0.1);
      const dispMesh = addMesh(display, [0, 0.2, 0.05], [-0.1, 0, 0]);
      animators.push(() => {
         dispMesh.rotation.y = Math.sin(Date.now() * 0.001) * 0.1;
      });
    } else if (type === 'PHONE') {
      const body = new THREE.BoxGeometry(0.7, 1.4, 0.08);
      addMesh(body, [0, 0, 0]);
      const screen = new THREE.BoxGeometry(0.65, 1.35, 0.02);
      addMesh(screen, [0, 0, 0.045]);
    } else if (type === 'ROUTER') {
      // Router body
      const body = new THREE.BoxGeometry(1.5, 0.2, 1.0);
      addMesh(body, [0, 0, 0]);
      // Antennas
      const antGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.6);
      const ant1 = addMesh(antGeom, [-0.6, 0.3, -0.4]);
      const ant2 = addMesh(antGeom, [0.6, 0.3, -0.4]);
      
      animators.push(() => {
        const time = Date.now() * 0.002;
        ant1.rotation.z = Math.sin(time) * 0.2;
        ant1.rotation.x = Math.cos(time) * 0.2;
        ant2.rotation.z = Math.sin(time + 1) * 0.2;
        ant2.rotation.x = Math.cos(time + 1) * 0.2;
      });
    } else if (type === 'PRINTER') {
      // Printer Base
      const base = new THREE.BoxGeometry(1.2, 0.6, 1.0);
      addMesh(base, [0, 0, 0]);
      // Top Scanner Bed
      const top = new THREE.BoxGeometry(1.3, 0.1, 1.1);
      addMesh(top, [0, 0.35, 0]);
      // Paper Tray
      const tray = new THREE.BoxGeometry(0.8, 0.05, 0.6);
      addMesh(tray, [0, -0.1, 0.6], [0.1, 0, 0]);
      // Animated Paper
      const paper = new THREE.BoxGeometry(0.7, 0.02, 0.8);
      const paperMesh = addMesh(paper, [0, -0.05, 0.6]);
      animators.push(() => {
        // Slide paper out and snap back
        const time = (Date.now() % 4000) / 4000; // 0 to 1 over 4 seconds
        paperMesh.position.z = 0.2 + time * 0.8;
      });
    } else if (type === 'KEYBOARD') {
      // Keyboard base
      const base = new THREE.BoxGeometry(2.2, 0.08, 0.8);
      addMesh(base, [0, 0, 0], [0.1, 0, 0]);
      // Keys using InstancedMesh for Performance Optimization (Phase 6)
      const cols = 12;
      const rows = 4;
      const count = cols * rows;
      
      const keyGeom = new THREE.BoxGeometry(0.12, 0.08, 0.12);
      const instancedMesh = new THREE.InstancedMesh(keyGeom, material, count);
      instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      
      // We don't add wireframes to each instance for performance, but we could add one big wireframe if needed.
      group.add(instancedMesh);

      const dummy = new THREE.Object3D();
      
      animators.push(() => {
        const time = Date.now() * 0.005;
        let index = 0;
        for (let r=0; r<rows; r++) {
          for (let c=0; c<cols; c++) {
             const dist = Math.sqrt(Math.pow(c - cols/2, 2) + Math.pow(r - rows/2, 2));
             const offset = Math.sin(dist * 0.8 - time) * 0.04;
             
             dummy.position.set(-1.0 + c * 0.18, 0.05 + offset, -0.25 + r * 0.18);
             dummy.rotation.set(0.1, 0, 0);
             dummy.updateMatrix();
             
             instancedMesh.setMatrixAt(index++, dummy.matrix);
          }
        }
        instancedMesh.instanceMatrix.needsUpdate = true;
      });
    }

    scene.add(group);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const mainLight = new THREE.PointLight(0xffffff, 1.5);
    mainLight.position.set(5, 5, 5);
    scene.add(mainLight);

    const secondaryLight = new THREE.PointLight(mainColor, 2);
    secondaryLight.position.set(-5, -2, 2);
    scene.add(secondaryLight);

    // 3.5 Optional Pathfinding/Wayfinding
    if (showPathfinding) {
      // Create a path of points
      const pathPoints = [
        new THREE.Vector3(-3, -1, 3),
        new THREE.Vector3(-1, -1, 2),
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(1, -1, -2),
        new THREE.Vector3(3, -1, -3)
      ];
      
      const pathGeom = new THREE.BufferGeometry().setFromPoints(pathPoints);
      const pathMat = new THREE.LineDashedMaterial({
        color: 0x00E5FF,
        dashSize: 0.2,
        gapSize: 0.1,
        transparent: true,
        opacity: 0.7
      });
      const pathLine = new THREE.Line(pathGeom, pathMat);
      pathLine.computeLineDistances();
      scene.add(pathLine);

      // Create an animated blip moving along the path
      const blipGeom = new THREE.SphereGeometry(0.1, 16, 16);
      const blipMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const blip = new THREE.Mesh(blipGeom, blipMat);
      scene.add(blip);
      
      // Calculate total path length for animation
      const pathCurve = new THREE.CatmullRomCurve3(pathPoints);
      
      animators.push(() => {
        // Animate dashes
        (pathMat as any).dashOffset -= 0.01;
        
        // Animate blip along curve
        const time = (Date.now() % 4000) / 4000;
        const pos = pathCurve.getPointAt(time);
        blip.position.copy(pos);
        
        // Make blip pulse
        const scale = 1.0 + Math.sin(Date.now() * 0.01) * 0.5;
        blip.scale.set(scale, scale, scale);
      });
    }

    camera.position.set(2, 2, 3.5);
    camera.lookAt(0, 0, 0);

    // 4.5 Post-Processing (Bloom) Phase 1
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.2;
    bloomPass.strength = 1.2; // Glowing neon intensity
    bloomPass.radius = 0.5;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // 5. Animation Loop
    const animate = () => {
      const frameId = requestAnimationFrame(animate);
      
      controls.update(); // Required for autoRotate and damping
      
      // Floating animation
      group.position.y = Math.sin(Date.now() * 0.002) * 0.05;
      
      // Execute local animators
      animators.forEach(a => a());
      
      // Status Pulse
      const pulseSpeed = status === 'HEALTHY' ? 0.002 : 0.008;
      material.emissiveIntensity = 0.3 + Math.sin(Date.now() * pulseSpeed) * 0.3;
      wireframeMat.opacity = 0.2 + Math.sin(Date.now() * pulseSpeed) * 0.4;
      
      composer.render(); // Render using composer for bloom effect
      return frameId;
    };

    const frameId = animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      renderer.setSize(w, h);
      composer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);
    const observer = new ResizeObserver(handleResize);
    observer.observe(mountRef.current);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      cancelAnimationFrame(frameId);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      controls.dispose();
      material.dispose();
      wireframeMat.dispose();
    };
  }, [status, type]);

  return (
    <div className="digital-twin-container">
      <div ref={mountRef} className="canvas-mount" />
      <div className="twin-overlay">
        <div className="status-indicator">
          <span className="pulse-dot" data-status={status}></span>
          <span className="status-text">{status}</span>
        </div>
      </div>

      <style jsx>{`
        .digital-twin-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: radial-gradient(circle at 50% 50%, rgba(88, 166, 255, 0.05) 0%, transparent 80%);
        }
        .canvas-mount {
          width: 100%;
          height: 100%;
          cursor: grab;
        }
        .canvas-mount:active {
          cursor: grabbing;
        }
        .twin-overlay {
          position: absolute;
          top: 12px;
          left: 12px;
          pointer-events: none;
        }
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.6);
          padding: 4px 10px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
        }
        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .pulse-dot[data-status="HEALTHY"] { background: #00E676; box-shadow: 0 0 10px #00E676; }
        .pulse-dot[data-status="WARNING"] { background: #FFAB00; box-shadow: 0 0 10px #FFAB00; }
        .pulse-dot[data-status="CRITICAL"] { background: #FF1744; box-shadow: 0 0 10px #FF1744; }
        
        .status-text {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: white;
        }
      `}</style>
    </div>
  );
}
