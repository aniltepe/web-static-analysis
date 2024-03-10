'use client'

import { useEffect, useState, useRef, useCallback, SetStateAction, useImperativeHandle, forwardRef } from 'react'
import { Canvas, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls, OrthographicCamera, PerspectiveCamera, useHelper } from '@react-three/drei'
import { TextureLoader, Vector3, CameraHelper, Vector2 } from 'three'
import { LineGeometry, LineMaterial, Line2 } from 'three/examples/jsm/Addons.js'

export default function App() {
  const [lights, setLights] = useState({light1: true, light2: false, light3: false, light4: false})
  const [camMode, setCamMode] = useState('3dp')
  const [drawMode, setDrawMode] = useState(false)
  const [assignLoadMode, setAssignLoadMode] = useState(false)
  const [planeSize, setPlaneSize] = useState({x: 2.0, y: 1.0, z: 3.0})
  const [planeGrid, setPlaneGrid] = useState({x: 4, y: 2, z: 4})
  const [gridPoints, setGridPoints] = useState<number[]>([])
  const [gridLines, setGridLines] = useState<number[][]>([]) 
  const [gridPtVisib, setGridPtVisib] = useState<boolean[]>([])
  const [gridLnVisib, setGridLnVisib] = useState<boolean[]>([])

  const [modelLines, setModelLines] = useState<number[][]>([])
  const [selectedPnt, setSelectedPnt] = useState<any>()
  const [snackbars, setSnackbars] = useState<any>([])
  const [ctxMenu, setCtxMenu] = useState<any>()
  const [lineHover, setLineHover] = useState<boolean>(false)
  const [gridPtHover, setGridPtHover] = useState<boolean>(false)

  const gridRef = useRef<any>()

  useEffect(() => {
    console.log(planeGrid.x, planeGrid.y, planeGrid.z)
    console.log(planeSize.x, planeSize.y, planeSize.z)
    const xStep = planeSize.x / planeGrid.x
    const yStep = planeSize.y / planeGrid.y
    const zStep = planeSize.z / planeGrid.z
    const initX = -1.0 * planeSize.x / 2
    const initY = 0.0
    const initZ = -1.0 * planeSize.z / 2
    const points: number[] = []
    const linesList: number[][] = []
    let lines: number[] = []
    console.log(xStep, yStep, zStep)
    console.log(initX, initY, initZ)
    for (let i = 0; i <= planeGrid.x; i++) {
      for (let j = 0; j <= planeGrid.y; j++) {
        for (let k = 0; k <= planeGrid.z; k++) {
          if (k != 0) {
            lines = []
            lines.push(initX + i * xStep, initY + j * yStep, initZ + (k - 1) * zStep, initX + i * xStep, initY + j * yStep, initZ + k * zStep)
            linesList.push(lines)
          }
          if (j != 0) {
            lines = []
            lines.push(initX + i * xStep, initY + (j - 1) * yStep, initZ + k * zStep, initX + i * xStep, initY + j * yStep, initZ + k * zStep)
            linesList.push(lines)
          }
          if (i != 0) {
            lines = []
            lines.push(initX + (i - 1) * xStep, initY + j * yStep, initZ + k * zStep, initX + i * xStep, initY + j * yStep, initZ + k * zStep)
            linesList.push(lines)
          }
          points.push(initX + i * xStep, initY + j * yStep, initZ + k * zStep)
        }
      }
    }
    setGridPoints(points)
    setGridLines(linesList)
  }, [planeSize, planeGrid])

  useEffect(() => {
    const ptVisib: boolean[] = []
    const lnVisib: boolean[] = []
    for (let i = 0; i <= planeGrid.x; i++) {
      for (let j = 0; j <= planeGrid.y; j++) {
        for (let k = 0; k <= planeGrid.z; k++) {
          if (k != 0) {
            if (j == 0 || (camMode == 'xy' || camMode == 'yz') || drawMode)
              lnVisib.push(true)
            else
              lnVisib.push(false)
          }
          if (j != 0) {
            if (camMode == 'xy' || camMode == 'yz' || drawMode)
              lnVisib.push(true)
            else
              lnVisib.push(false)
          }
          if (i != 0) {
            if (j == 0 || (camMode == 'xy' || camMode == 'yz') || drawMode)
              lnVisib.push(true)
            else
              lnVisib.push(false)
          }
          if (drawMode)
            ptVisib.push(true)
          else
            ptVisib.push(false)
        }
      }
    }
    setGridPtVisib(ptVisib)
    setGridLnVisib(lnVisib)
  }, [camMode, drawMode, planeGrid])

  const onPointerMove = (evt: any) => {
    let objected = false
    evt.intersections.forEach((i: any) => {
      if (i.distanceToRay < 0.03) {
        if (camMode == '3dp') {
          i.object.material.size = 0.16
        }
        else {
          i.object.material.size = 8
        }
        objected = true
        setGridPtHover(true)
      }
      else {
        if (camMode == '3dp') {
          i.object.material.size = 0.08
        }
        else {
          i.object.material.size = 4
        }
      }
    })
    if (objected) {
      evt.srcElement.style.cursor = 'pointer'
    }
    else {
      setGridPtHover(false)
      if (!lineHover) {
        evt.srcElement.style.cursor = 'auto'
      }
    }
  }

  const captureEsc = useCallback((evt: any) => {
    if (evt.key == 'Escape') {
      setSelectedPnt(undefined)
      setSnackbars(snackbars.slice(0, -1))
      window.removeEventListener('keydown', captureEsc)
    }
  }, [])

  const closeCtxMenuClick = useCallback((evt: any) => {
    console.log('clicked')
    setCtxMenu(undefined)
    removeEventListener('click', closeCtxMenuClick)
  }, [])

  const onGridPtClick = (evt: any) => {
    if (evt.distanceToRay < 0.03) {
      console.log('pt clicked')
      evt.stopPropagation()
      const pntPos = evt.object.geometry.attributes.position.array
      const newSelected: [number, number, number] = [pntPos[0], pntPos[1], pntPos[2]] 
      if (selectedPnt) {
        if (!selectedPnt.every((v: any, i: any) => v === newSelected[i])) {
          const lines = []
          lines.push(selectedPnt[0], selectedPnt[1], selectedPnt[2], newSelected[0], newSelected[1], newSelected[2])
          setModelLines([...modelLines, lines])
        }
        setSelectedPnt(undefined)
        setSnackbars(snackbars.slice(0, -1))
        window.removeEventListener('keydown', captureEsc)
      }
      else {
        setSelectedPnt(newSelected)
        setSnackbars([...snackbars, 'Press Esc to cancel'])
        window.addEventListener('keydown', captureEsc)
      }
    }
  }

  const onDrawButtonClick = (evt: any) => {
    setDrawMode(!drawMode)
  }

  const onAssignButtonClick = (evt: any) => {
    setAssignLoadMode(!assignLoadMode)
  }

  const onModelLineClick = (evt: any, idx: number) => {
    if (gridPtHover)
      return
    console.log(evt)
    // console.log(evt.srcElement.clientWidth, evt.srcElement.clientHeight)
    // console.log(window.innerWidth, window.innerHeight)
    const canvXOffset = window.innerWidth - evt.srcElement.clientWidth
    const canvYOffset = window.innerHeight - evt.srcElement.clientHeight
    // console.log(canvXOffset, canvYOffset)
    const anchorX = (evt.clientX - canvXOffset) > evt.srcElement.clientWidth / 2 ? true : false
    const anchorY = (evt.clientY - canvYOffset) > evt.srcElement.clientHeight / 2 ? true : false
    // console.log(evt.clientX, evt.clientY)
    const delete_line = (e: any) => {
      setModelLines(modelLines.filter((_, i) => i !== idx))
      setCtxMenu(undefined)
      removeEventListener('click', closeCtxMenuClick)
    }
    setCtxMenu({
      text: '', 
      action1: {text: 'Frame Section'}, 
      action2: {text: 'Delete', action: delete_line}, 
      pos: {x: parseInt(evt.clientX).toString(), y: parseInt(evt.clientY).toString()},
      anc: {x: anchorX, y: anchorY}
    })
    window.addEventListener('click', closeCtxMenuClick)
    evt.nativeEvent.stopPropagation()
  }

  const modelLnOnEnter = (evt: any) => {
    if (!gridPtHover) {
      evt.object.material.linewidth = 5
      evt.srcElement.style.cursor = 'pointer'
      setLineHover(true)
    }
  }

  const modelLnOnLeave = (evt: any) => {
    console.log('leaved')
    evt.object.material.linewidth = 3
    evt.srcElement.style.cursor = 'auto'
    setLineHover(false)
  }

  const onIntValChange = (evt: any) => {
    console.log("int changed")
    let gridValChanged = false
    let newGrid: SetStateAction<{x: number, y: number, z: number}> = {x:0, y:0, z:0}
    if (!isNaN(parseInt(evt.nativeEvent.target.value))) {
      gridValChanged = true
      if (evt.nativeEvent.target.id == 'griddvx')
        newGrid = {x: parseInt(evt.nativeEvent.target.value), y: planeGrid.y, z: planeGrid.z}
      else if (evt.nativeEvent.target.id == 'griddvy')
        newGrid = {y: parseInt(evt.nativeEvent.target.value), x: planeGrid.x, z: planeGrid.z}
      else if (evt.nativeEvent.target.id == 'griddvz')
        newGrid = {z: parseInt(evt.nativeEvent.target.value), y: planeGrid.y, x: planeGrid.x}
    }
    if (gridValChanged) {
      if (gridRef && gridRef.current)
        gridRef.current.clearGrid()
      setPlaneGrid(newGrid)
    }
  }

  const onFloatValChange = (evt: any) => {
    if (evt.nativeEvent.target.id == 'gridszx') {
      setPlaneSize({...planeSize, x: parseFloat(parseFloat(evt.nativeEvent.data).toFixed(1))})
    }
    else if (evt.nativeEvent.target.id == 'gridszy') {
      setPlaneSize({...planeSize, y: parseFloat(parseFloat(evt.nativeEvent.data).toFixed(1))})
    }
    else if (evt.nativeEvent.target.id == 'gridszz') {
      setPlaneSize({...planeSize, z: parseFloat(parseFloat(evt.nativeEvent.data).toFixed(1))})
    }
  }
   
  return (
    <>
      <div className='w-full bg-slate-100 fixed top-0 h-[20px] leading-[20px] text-xs text-black pl-[5px] font-extralight'>
        File&emsp;Edit&emsp;View&emsp;Draw&emsp;Define&emsp;Draw&emsp;Select&emsp;Assign&emsp;Analyze&emsp;Display&emsp;Design&emsp;Options&emsp;Tools&emsp;Help
      </div>
      <div className='w-full bg-slate-100 fixed top-[20px] h-[50px] px-[10px] py-[10px] flex justify-between'>
        <div className='flex'>
          <button type='button' onClick={onDrawButtonClick} className={`${drawMode ? 'bg-gray-300' : 'bg-white hover:bg-gray-200'} text-black text-xs px-2 py-[3px] rounded-lg border border-black h-[30px] leading-[24px] flex`}>
            <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='w-6 h-6'>
              <path strokeLinecap='round' strokeLinejoin='round' d='m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125' />
            </svg>
            &ensp;
            Draw Objects
          </button>
          &ensp;
          <button type='button' onClick={onAssignButtonClick} className={`${assignLoadMode ? 'bg-gray-300' : 'bg-white hover:bg-gray-200'} text-black text-xs px-2 py-[3px] rounded-lg border border-black h-[30px] leading-[24px] flex`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 4.5-15 15m0 0h11.25m-11.25 0V8.25" />
            </svg>
            &ensp;
            Assign Load
          </button>
          &ensp;
          <button type='button' className={`bg-white hover:bg-gray-200 text-black text-xs px-2 py-[3px] rounded-lg border border-black h-[30px] leading-[24px] flex`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
            </svg>
            &ensp;
            Analysis
          </button>
          &ensp;
          <div className='flex rounded-md shadow-sm align-top' role='group'>
            <button type='button' onClick={() => setCamMode('3dp')} className={`h-[30px] px-2 text-xs text-black border border-black rounded-s-lg ${camMode == '3dp' ? 'bg-gray-300' : 'bg-white hover:bg-gray-200'}`}>
              3D Perspective
            </button>
            <button type='button' onClick={() => setCamMode('3do')} className={`h-[30px] px-2 text-xs text-black border-t border-b border-r border-black ${camMode == '3do' ? 'bg-gray-300' : 'bg-white hover:bg-gray-200'}`}>
              3D Orthographic
            </button>
            <button type='button' onClick={() => setCamMode('xy')} className={`h-[30px] px-2 text-xs text-black border-t border-b border-black ${camMode == 'xy' ? 'bg-gray-300' : 'bg-white hover:bg-gray-200'}`}>
              X-Y
            </button>
            <button type='button' onClick={() => setCamMode('yz')} className={`h-[30px] px-2 text-xs text-black border-t border-b border-l border-black ${camMode == 'yz' ? 'bg-gray-300' : 'bg-white hover:bg-gray-200'}`}>
              Y-Z
            </button>
            <button type='button' onClick={() => setCamMode('xz')} className={`h-[30px] px-2 text-xs text-black border border-black rounded-e-lg ${camMode == 'xz' ? 'bg-gray-300' : 'bg-white hover:bg-gray-200'}`}>
              X-Z
            </button>
          </div>
        </div>
        <div className='flex text-black text-xs mt-[-28px]'>
          <table>
            <tr>
              <td className='text-right'>Grid</td>
              <td className='text-center text-red'>X</td>
              <td className='text-center text-green'>Y</td>
              <td className='text-center text-blue'>Z</td>
            </tr>
            <tr>
              <td className='text-right'>Division</td>
              <td><input type='text' id='griddvx' value={planeGrid.x} onChange={onIntValChange} className='block w-[40px] ml-1 rounded-md border border-black text-gray-900 text-xs pl-1 h-[21px]' /></td>
              <td><input type='text' id='griddvy' value={planeGrid.y} onChange={onIntValChange} className='block w-[40px] ml-1 rounded-md border border-black text-gray-900 text-xs pl-1 h-[21px]' /></td>
              <td><input type='text' id='griddvz' value={planeGrid.z} onChange={onIntValChange} className='block w-[40px] ml-1 rounded-md border border-black text-gray-900 text-xs pl-1 h-[21px]' /></td>
            </tr>
            <tr>
              <td className='text-right'>Size</td>
              <td><input type='text' id='gridszx' value={planeSize.x.toFixed(1)} onChange={onFloatValChange} className='block w-[40px] ml-1 rounded-md border border-black text-gray-900 text-xs pl-1 h-[21px]' /></td>
              <td><input type='text' id='gridszy' value={planeSize.y.toFixed(1)} onChange={onFloatValChange} className='block w-[40px] ml-1 rounded-md border border-black text-gray-900 text-xs pl-1 h-[21px]' /></td>
              <td><input type='text' id='gridszz' value={planeSize.z.toFixed(1)} onChange={onFloatValChange} className='block w-[40px] ml-1 rounded-md border border-black text-gray-900 text-xs pl-1 h-[21px]' /></td>
            </tr>
          </table>
        </div>
      </div>
      { snackbars.length > 0 && 
        <div className='absolute top-[70px] left-[50%] translate-x-[-50%] z-10 flex flex-col'>
          { snackbars.map((val: any, idx: any) => {
            return (
              <div key={idx} className='h-[30px] leading-[30px] px-3 mt-3 text-sm text-black border-t border-b border-black bg-white rounded-lg'>
                {val}
              </div>
            )
          })}
        </div>
      }
      { ctxMenu &&
        <div className='absolute z-20 bg-slate-100 flex flex-col' onClick={(e) => e.stopPropagation()}
          style={{top: ctxMenu.pos.y + 'px', left: ctxMenu.pos.x + 'px', translate: (ctxMenu.anc.x ? '-100%' : '0') + ' ' + (ctxMenu.anc.y ? '-100%' : '0') }}>
          <p>{ctxMenu.text}</p>
          { ctxMenu.action1 && <button type='button' onClick={ctxMenu.action1.action} className='h-[30px] px-3 m-1 text-xs text-black border border-black rounded-md bg-white hover:bg-gray-200'>{ctxMenu.action1.text}</button>}
          { ctxMenu.action2 && <button type='button' onClick={ctxMenu.action2.action} className='h-[30px] px-3 m-1 text-xs text-black border border-black rounded-md bg-white hover:bg-gray-200'>{ctxMenu.action2.text}</button>}
        </div>
      }
      <Canvas shadows style={{top:'70px', backgroundColor: '#888888', height: 'calc(100dvh - 70px)', width: '100dvw'}}>
        <CustomCamera camMode={camMode} />
        <Lights lights={lights} />

        <Grid ref={gridRef} gridPoints={gridPoints} gridLines={gridLines}
          ptVisib={gridPtVisib} lnVisib={gridLnVisib} camMode={camMode} 
          onPointerMove={onPointerMove} onGridPtClick={onGridPtClick} /> 
        
        { modelLines.map((lines, idx) => {
          return (
            <primitive object={new Line2()} onPointerEnter={modelLnOnEnter} onPointerLeave={modelLnOnLeave} onClick={(e: any) => onModelLineClick(e, idx)} key={idx} frustrumCulled={false} >
              <primitive object={new LineGeometry().setPositions(new Float32Array(lines))} attach='geometry' />
              <primitive object={new LineMaterial()} color='black' attach='material' linewidth={3} resolution={new Vector2(512, 512)} />
            </primitive>
          )})
        }
        <line>
          <lineBasicMaterial depthTest={false} depthWrite={false} color='#ff0000' />
          <bufferGeometry>
            <bufferAttribute attach='attributes-position' count={2} array={new Float32Array([0, 0, 0, 400, 0, 0])} itemSize={3} />
          </bufferGeometry>
        </line>
        <line>
          <lineBasicMaterial depthTest={false} depthWrite={false} color='#00ff00' />
          <bufferGeometry>
            <bufferAttribute attach='attributes-position' count={2} array={new Float32Array([0, 0, 0, 0, 400, 0])} itemSize={3} />
          </bufferGeometry>
        </line>
        <line>
          <lineBasicMaterial depthTest={false} depthWrite={false} color='#0000ff' />
          <bufferGeometry>
            <bufferAttribute attach='attributes-position' count={2} array={new Float32Array([0, 0, 0, 0, 0, 400])} itemSize={3} />
          </bufferGeometry>
        </line>
        <mesh rotation={[-0.5 * Math.PI, 0, 0]} position={[0, 0, 0]} receiveShadow >
          <planeGeometry args={[30, 30, 1, 1]} />
          <shadowMaterial transparent opacity={0.2} />
        </mesh>
      </Canvas>
    </>
  )
}

const Grid = forwardRef((props: any, ref: any) => {
  const {scene} = useThree()
  const [point, setPoint] = useState<number[]>([])
  const [lines, setLines] = useState<number[][]>([]) 
  const gridLineRef = useRef<any>([])
  const gridPointRef = useRef<any>([])
  const sprite = useLoader(TextureLoader, 'disc.png')

  useEffect(() => {
    setPoint(props.gridPoints)
  }, [props.gridPoints])

  useEffect(() => {
    setLines(props.gridLines)
  }, [props.gridLines]) 

  useImperativeHandle(ref, () => ({
    clearGrid() {
      console.log('lines:', gridLineRef.current.length, 'points:', gridPointRef.current.length)
      for (let i = 0; i < lines.length; i++) {
        gridLineRef.current[i].geometry.dispose()
        gridLineRef.current[i].material.dispose()
        scene.remove(gridLineRef.current[i])
      }
      for (let i = 0; i < point.length / 3; i++) {
        gridPointRef.current[i].geometry.dispose()
        gridPointRef.current[i].material.dispose()
        scene.remove(gridPointRef.current[i])
      }
      setPoint([])
      setLines([])
    }
  }));

  return (
    <>
      { point.map((val: number, idx: number) => {
        if (idx % 3 != 0)
          return
        return (
          <points onPointerMove={props.onPointerMove} onClick={props.onGridPtClick} 
            key={idx} ref={p => gridPointRef.current[idx / 3] = p} visible={props.ptVisib[idx / 3]}> 
            <pointsMaterial depthTest={false} color='white' sizeAttenuation={true} size={props.camMode == '3dp' ? 0.08 : 4} map={sprite} transparent={true} alphaTest={0.5} />
            <bufferGeometry >
              <bufferAttribute attach='attributes-position' count={1} array={new Float32Array([point[idx], point[idx + 1], point[idx + 2]])} itemSize={3} />
            </bufferGeometry>
          </points>
        )})
      }
      { lines.map((ll: number[], idx: number) => {
        return (
          <line key={idx} ref={l => gridLineRef.current[idx] = l} >
            <lineBasicMaterial color='#666666' visible={props.lnVisib[idx]}/>
            <bufferGeometry>
              <bufferAttribute attach='attributes-position' count={ll.length / 3} array={new Float32Array(ll)} itemSize={3} />
            </bufferGeometry>
          </line>
        
        )})
      }
    </>
  )
})

const Lights = (props: any) => {
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

const CustomCamera = (props: any) => {
  const {size} = useThree()
  const perspCam = useRef<any>()
  const orthoCam = useRef<any>()
  // useHelper(perspCam, CameraHelper)
  const [prevMode, setPrevMode] = useState<any>()
  const [camPos, setCamPos] = useState<[number, number, number]>([1, 3, 6])

  const onWheel = useCallback((evt: any) => { 
    if (evt.srcElement.tagName.toLowerCase() == 'canvas') {
      if (evt.deltaY > 0.5)
        perspCam.current.zoom *= 0.98
      else if (evt.deltaY < -0.5)
        perspCam.current.zoom /= 0.98
      perspCam.current.updateProjectionMatrix()
    }
  }, [])

  useEffect(() => {
    if (props.camMode == '3dp') {
      document.addEventListener('wheel', onWheel)
    }
    else {
      document.removeEventListener('wheel', onWheel)
    }
    if (props.camMode == '3dp' && prevMode == '3do') {
      perspCam.current.position.set(orthoCam.current.position.x, orthoCam.current.position.y, orthoCam.current.position.z)
      perspCam.current.zoom = orthoCam.current.zoom
      perspCam.current.updateProjectionMatrix()
    }
    else if (props.camMode == '3do' && prevMode == '3dp') {
      orthoCam.current.position.set(perspCam.current.position.x, perspCam.current.position.y, perspCam.current.position.z)
      orthoCam.current.zoom = perspCam.current.zoom
      orthoCam.current.updateProjectionMatrix()
    }
    setPrevMode(props.camMode)
  }, [props.camMode])

  return (
    <>
      <PerspectiveCamera ref={perspCam} makeDefault={props.camMode == '3dp'} position={camPos} near={0.01} zoom={0.5} fov={20} />
      <OrthographicCamera ref={orthoCam} makeDefault={props.camMode == '3do'} position={camPos} near={0.01} zoom={0.5} left={-1 * size.width / size.height} right={size.width / size.height} top={1} bottom={-1} />
      <OrthographicCamera makeDefault={props.camMode == 'xy'} position={[0, 0, 10]} near={0.01} zoom={0.4} left={-1 * size.width / size.height} right={size.width / size.height} top={1} bottom={-1} />
      <OrthographicCamera makeDefault={props.camMode == 'yz'} position={[-10, 0, 0]} near={0.01} zoom={0.4} left={-1 * size.width / size.height} right={size.width / size.height} top={1} bottom={-1} />
      <OrthographicCamera makeDefault={props.camMode == 'xz'} position={[0, 10, 0]} near={0.01} zoom={0.4} left={-1 * size.width / size.height} right={size.width / size.height} top={1} bottom={-1} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={props.camMode != '3dp'}
        enableRotate={props.camMode == '3dp' || props.camMode == '3do'}
        target={[0, 0, 0]} />
    </>
  )
}
