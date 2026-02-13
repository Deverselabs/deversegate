'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Line } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

function DigitalGrid() {
  const gridRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.position.z = ((state.clock.elapsedTime * 0.5) % 4) - 2;
    }
  });

  const lines = useMemo(() => {
    const lineData = [];
    const size = 20;
    const divisions = 20;
    const step = size / divisions;

    for (let i = -size / 2; i <= size / 2; i += step) {
      lineData.push({
        points: [
          [i, -size / 2, 0],
          [i, size / 2, 0],
        ],
      });
      lineData.push({
        points: [
          [-size / 2, i, 0],
          [size / 2, i, 0],
        ],
      });
    }
    return lineData;
  }, []);

  return (
    <group ref={gridRef} rotation={[Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
      {lines.map((line, i) => (
        <Line
          key={i}
          points={line.points as [number, number, number][]}
          color="#06b6d4"
          lineWidth={0.5}
          transparent
          opacity={0.2}
        />
      ))}
    </group>
  );
}

function BlockchainBlock({
  position,
  index
}: {
  position: [number, number, number];
  index: number;
}) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + index) * 0.2;
    }
  });

  return (
    <group ref={meshRef} position={position}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#06b6d4"
          metalness={0.7}
          roughness={0.3}
          emissive="#06b6d4"
          emissiveIntensity={0.3}
          wireframe={false}
        />
      </mesh>
      <mesh>
        <boxGeometry args={[1.05, 1.05, 1.05]} />
        <meshBasicMaterial
          color="#06b6d4"
          wireframe={true}
          transparent
          opacity={0.3}
        />
      </mesh>
      <mesh position={[0, 0, 0.51]}>
        <planeGeometry args={[0.6, 0.6]} />
        <meshBasicMaterial
          color="#0891b2"
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

function BlockchainChain() {
  const blocks: [number, number, number][] = useMemo(() => [
    [-6, 2, 0],
    [-3, 1, -1],
    [0, 2, 0],
    [3, 1, 1],
    [6, 2, -1],
  ], []);

  const chains = useMemo(() => {
    const chainLinks = [];
    for (let i = 0; i < blocks.length - 1; i++) {
      chainLinks.push([i, i + 1]);
    }
    return chainLinks;
  }, []);

  return (
    <group>
      {blocks.map((pos, i) => (
        <BlockchainBlock key={i} position={pos} index={i} />
      ))}
      {chains.map(([start, end], i) => (
        <group key={i}>
          <Line
            points={[blocks[start], blocks[end]] as [number, number, number][]}
            color="#22d3ee"
            lineWidth={3}
            transparent
            opacity={0.6}
          />
          <Line
            points={[
              [blocks[start][0], blocks[start][1] + 0.5, blocks[start][2]],
              [blocks[end][0], blocks[end][1] + 0.5, blocks[end][2]],
            ] as [number, number, number][]}
            color="#22d3ee"
            lineWidth={2}
            transparent
            opacity={0.4}
          />
          <Line
            points={[
              [blocks[start][0], blocks[start][1] - 0.5, blocks[start][2]],
              [blocks[end][0], blocks[end][1] - 0.5, blocks[end][2]],
            ] as [number, number, number][]}
            color="#22d3ee"
            lineWidth={2}
            transparent
            opacity={0.4}
          />
        </group>
      ))}
    </group>
  );
}

function DataStream({
  start,
  end
}: {
  start: [number, number, number];
  end: [number, number, number];
}) {
  const particleRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (particleRef.current) {
      const t = (Math.sin(state.clock.elapsedTime * 2) + 1) / 2;
      particleRef.current.position.x = start[0] + (end[0] - start[0]) * t;
      particleRef.current.position.y = start[1] + (end[1] - start[1]) * t;
      particleRef.current.position.z = start[2] + (end[2] - start[2]) * t;
    }
  });

  return (
    <mesh ref={particleRef}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial color="#fbbf24" />
    </mesh>
  );
}

function HexagonalNode({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position}>
        <cylinderGeometry args={[0.6, 0.6, 0.1, 6]} />
        <meshStandardMaterial
          color="#10b981"
          metalness={0.6}
          roughness={0.4}
          emissive="#10b981"
          emissiveIntensity={0.4}
          wireframe={true}
        />
      </mesh>
    </Float>
  );
}

function FloatingData() {
  const particlesRef = useRef<THREE.Points>(null);

  const particleGeometry = useMemo(() => {
    const particleCount = 150;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });

  return (
    <points ref={particlesRef} geometry={particleGeometry}>
      <pointsMaterial
        size={0.05}
        color="#22d3ee"
        sizeAttenuation
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function CryptoScene() {
  return (
    <div className="fixed inset-0 pointer-events-none opacity-30">
      <Canvas camera={{ position: [0, 3, 15], fov: 60 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#06b6d4" />
        <pointLight position={[-10, -5, -10]} intensity={1.5} color="#10b981" />
        <pointLight position={[0, 10, 5]} intensity={1} color="#fbbf24" />

        <DigitalGrid />

        <BlockchainChain />

        <HexagonalNode position={[-4, -2, 2]} />
        <HexagonalNode position={[4, -2, 2]} />
        <HexagonalNode position={[0, 4, -2]} />

        <DataStream start={[-6, 2, 0]} end={[-3, 1, -1]} />
        <DataStream start={[0, 2, 0]} end={[3, 1, 1]} />
        <DataStream start={[-3, 1, -1]} end={[0, 2, 0]} />

        <FloatingData />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.4}
          maxPolarAngle={Math.PI / 1.6}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
}
