
const glMatrix = require('gl-matrix')

import easyWebGL from './easyWebGL'
import { loadTexture } from './textures'
import GLObject from './GLObject'
import addDragRotation from './dragRotatePlugin'

const fish1obj = '../fish/TropicalFish_obj/TropicalFish01.obj'
const fish2obj = '../fish/TropicalFish_obj/TropicalFish02.obj'
const fish3obj = '../fish/TropicalFish_obj/TropicalFish03.obj'
const fish4obj = '../fish/TropicalFish_obj/TropicalFish04.obj'
const fish5obj = '../fish/TropicalFish_obj/TropicalFish15.obj'

let fishObjArray = []
let fishJpgArray = []

let prefix = '../fish/TropicalFish_obj/TropicalFish'

for(let i = 0; i < 40; i++) {
  let a = (1 + Math.random() * 14 | 0)
  if (a < 10) a = '0' + a
  fishObjArray.push(prefix + a + '.obj')
  fishJpgArray.push(prefix + a + '.jpg')
}

const fish1png = '../fish/TropicalFish_obj/TropicalFish01.jpg'
const fish2png = '../fish/TropicalFish_obj/TropicalFish02.jpg'
const fish3png = '../fish/TropicalFish_obj/TropicalFish03.jpg'
const fish4png = '../fish/TropicalFish_obj/TropicalFish04.jpg'
const fish5png = '../fish/TropicalFish_obj/TropicalFish05.jpg'

let canvas, gl, program
const N_BYTES = Float32Array.BYTES_PER_ELEMENT

const start = async () => {
  canvas = document.getElementById('canvas')
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true })
  const EasyGL = new easyWebGL(gl, 'textures', 'textures')
  program = EasyGL.initProgram()

  const { positionAttribLocation, colorAttribLocation } = EasyGL.getAttribLocations()

  gl.enable(gl.DEPTH_TEST)

  gl.useProgram(program)

  // Get the location of the matrices from the shader
  const matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld')
  const matViewUniformLocation = gl.getUniformLocation(program, 'mView')
  const matProjUniformLocation = gl.getUniformLocation(program, 'mProjection')

  // Create arrays containing the actual matrices
  const mWorld      = new Float32Array(16)
  const mView       = new Float32Array(16)
  const mProjection = new Float32Array(16)

  // Identity matrix since we want it to be at center
  glMatrix.mat4.identity(mWorld)

  // Setup the camera matrix
  let positionOfViewer         = [ 0,  0, -5]
  const pointViewerIsLookingAt = [ 0,  0,  0]
  const vectorPointingUp       = [ 0,  5,  0]
  glMatrix.mat4.lookAt(mView, positionOfViewer, pointViewerIsLookingAt, vectorPointingUp)

  // Black magic
  // Most likely f(output, cameraWidthAngle, aspectRatio, closestRenderedPoint, furthestRenderedPoint)
  glMatrix.mat4.perspective(mProjection, Math.PI * 0.25, canvas.width / canvas.height, 0.1, 1000.0)

  // Set the mView in the shader to be the matrix we made
  gl.uniformMatrix4fv(matViewUniformLocation,  gl.FALSE, mView)
  gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, mWorld)
  gl.uniformMatrix4fv(matProjUniformLocation,  gl.FALSE, mProjection)
  let lastTime = performance.now()

  const textcoordAttribLocation = gl.getAttribLocation(program, 'a_textcoord')
  const u_samplerUniformLocation = gl.getUniformLocation(program, 'u_sampler')

  const fish1 = await GLObject.create(gl, fish1obj, fish1png, positionAttribLocation, textcoordAttribLocation, u_samplerUniformLocation)
  const fish2 = await GLObject.create(gl, fish2obj, fish2png, positionAttribLocation, textcoordAttribLocation, u_samplerUniformLocation)
  const fish3 = await GLObject.create(gl, fish3obj, fish3png, positionAttribLocation, textcoordAttribLocation, u_samplerUniformLocation)
  const fish4 = await GLObject.create(gl, fish4obj, fish4png, positionAttribLocation, textcoordAttribLocation, u_samplerUniformLocation)
  const fish5 = await GLObject.create(gl, fish5obj, fish5png, positionAttribLocation, textcoordAttribLocation, u_samplerUniformLocation)

  const promises = fishObjArray.map(async (_, i) => {
    return await GLObject.create(
      gl, 
      fishObjArray[i],
      fishJpgArray[i],
      positionAttribLocation,
      textcoordAttribLocation,
      u_samplerUniformLocation
    )
  })

  const fishies = await Promise.all(promises)
  const rotate_wrt_time = addDragRotation(mWorld)

  const fishStates = []

  for (let i = 0; i < 40; i++) {
    fishStates.push({
      fishId: i,
      location: [Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 4 - 2],
      velocity: [Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 4 - 2],
      swimSeed: Math.random() * 2000,
      swimState: 0
    })
  }

  const translateUniformLocation = gl.getUniformLocation(program, 'translation')
  const scalarUniformLocation = gl.getUniformLocation(program, 'scalar')
  const orientationUniformLocation = gl.getUniformLocation(program, 'orientation')
  const wiggleUniformLocation = gl.getUniformLocation(program, 'wiggle')

  const identity = glMatrix.mat4.identity(new Float32Array(9))

  const vectorAdd = (v1, v2, scalar=1) => {
    let returnArray = []
    console.log(scalar)
    v1.forEach((_, i) => {
      returnArray.push(v1[i] + v2[i] * scalar)
    })
    return returnArray
  }

  const renderFish = ({ fishId, location, velocity, swimStatus, size }) => {
    const fish = fishies[fishId]
    const orientation = new Float32Array(16)
    glMatrix.mat4.targetTo(orientation, location, vectorAdd(location, velocity), vectorPointingUp)
    gl.uniformMatrix4fv(orientationUniformLocation, gl.FALSE, orientation)
    gl.uniform1f(scalarUniformLocation, size)
    gl.uniform1f(wiggleUniformLocation, swimStatus)
    gl.uniform3fv(translateUniformLocation, location)
    fish.draw()
  }

  const initialTime = performance.now()
  const updateFishState = () => {
    const d_time = performance.now() - initialTime
    fishStates.forEach(state => {
      state.location = vectorAdd(state.location, state.velocity, 0.1)
      state.swimStatus = Math.sin((state.swimSeed + d_time) / 1000)
    })
  }

  const render = () => {
    let currentTime = performance.now()
    let timePassed = currentTime - lastTime
    lastTime = currentTime
    rotate_wrt_time(timePassed)
    gl.uniformMatrix4fv(matViewUniformLocation,  gl.FALSE, mView)
    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, mWorld)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    fishStates.forEach(state => {
      renderFish(state)
    })

    // gl.drawElements(gl.TRIANGLES, sunmesh.indices.length, gl.UNSIGNED_SHORT, 0)
    // gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0)
    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
}

start()
