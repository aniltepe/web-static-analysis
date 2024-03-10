"use client"

import { useEffect, useState, useRef } from 'react'
import { Canvas, useLoader } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Point, Points } from '@react-three/drei'
import { Line, TextureLoader } from 'three'

export default function SplitCanvas(props: any) {
    const [lights, setLights] = useState({light1: true, light2: false, light3: false, light4: false})
    const [planeSize, setPlaneSize] = useState({x: 2.0, z: 3.0})
    const [planeGrid, setPlaneGrid] = useState({x: 5, z: 4})
    const [gridPoints, setGridPoints] = useState<number[]>([])
    const [gridLines, setGridLines] = useState<number[][]>([])
    const sprite = useLoader(TextureLoader, 'disc.png')
    return (
        <>
            <div></div>
            <Canvas shadows className="canvas-custom" style={{top:"70px", backgroundColor: "#333333", height: "50dvh", width: "50dvw"}}>
                <fog attach="fog" args={['#333333', 1, 30]} />
                <PerspectiveCamera makeDefault position={[0, 1.75, 3]} fov={40} near={0.01} />
                <Lights lights={lights} />
                <mesh castShadow position={[0, 0.5, 0]}>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshBasicMaterial color="#ff0000" />
                </mesh>
                <points>
                  <pointsMaterial color="white" sizeAttenuation={true} size={0.08} map={sprite} transparent={true} alphaTest={0.5} />
                  <bufferGeometry >
                    <bufferAttribute attach="attributes-position" count={gridPoints.length / 3} array={new Float32Array(gridPoints)} itemSize={3} />
                  </bufferGeometry>
                </points>
                <line>
                  <lineBasicMaterial color="#ff0000" />
                  <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={2} array={new Float32Array([-200, 0, 0, 200, 0, 0])} itemSize={3} />
                  </bufferGeometry>
                </line>
                <line>
                  <lineBasicMaterial color="#0000ff" />
                  <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={2} array={new Float32Array([0, 0, -200, 0, 0, 200])} itemSize={3} />
                  </bufferGeometry>
                </line>
                { gridLines.map((lines) => (
                  <line>
                    <lineBasicMaterial color="#666666" />
                    <bufferGeometry>
                      <bufferAttribute attach="attributes-position" count={lines.length / 3} array={new Float32Array(lines)} itemSize={3} />
                    </bufferGeometry>
                  </line>
                )) }
                <mesh rotation={[-0.5 * Math.PI, 0, 0]} position={[0, 0, 0]} receiveShadow >
                  <planeGeometry args={[30, 30, 1, 1]} />
                  <shadowMaterial transparent opacity={0.2} />
                </mesh>
                <mesh rotation={[-0.5 * Math.PI, 0, 0]} position={[0, -0.01, 0]} receiveShadow >
                  <planeGeometry args={[400, 400, 1, 1]} />
                  <meshBasicMaterial color="#888888" />
                </mesh>
                <OrbitControls makeDefault target={[0, 0, 0]} />
            </Canvas>
        </>
        
    )
}

function Lights(props: any) {
    return (
      <>
        <ambientLight intensity={0.05} />
        <directionalLight intensity={props.lights.light1 ? 0.3 : 0.0} position={[-5, 7, 5]} castShadow={props.lights.light1} shadow-mapSize-width={2048} shadow-mapSize-height={2048}
          shadow-camera-far={50} shadow-camera-left={-2} shadow-camera-right={2} shadow-camera-bottom={-2} shadow-camera-top={2} />
        <directionalLight intensity={props.lights.light2 ? 0.3 : 0.0} position={[5, 7, 5]} castShadow={props.lights.light2} shadow-mapSize-width={2048} shadow-mapSize-height={2048}
          shadow-camera-far={50} shadow-camera-left={-2} shadow-camera-right={2} shadow-camera-bottom={-2} shadow-camera-top={2} />
        <directionalLight intensity={props.lights.light3 ? 0.3 : 0.0} position={[-5, 7, -5]} castShadow={props.lights.light3} shadow-mapSize-width={2048} shadow-mapSize-height={2048}
          shadow-camera-far={50} shadow-camera-left={-2} shadow-camera-right={2} shadow-camera-bottom={-2} shadow-camera-top={2} />
        <directionalLight intensity={props.lights.light4 ? 0.3 : 0.0} position={[5, 7, -5]} castShadow={props.lights.light4} shadow-mapSize-width={2048} shadow-mapSize-height={2048}
          shadow-camera-far={50} shadow-camera-left={-2} shadow-camera-right={2} shadow-camera-bottom={-2} shadow-camera-top={2} />
      </>
    )
  }