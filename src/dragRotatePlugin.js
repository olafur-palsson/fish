const glMatrix = require('gl-matrix')

let state = {
  clickX: 0.1,
  clickY: 0.1,
  x0: 0.1,
  y0: 0,
  x: 0,
  y: 0,
  axis: [0, 1, 0],
  radPerSec: 0,
  nextSpeed: 0,
  lastTime: performance.now(),
  staticMWorld: false,
  slowFactor: 1
}

let wait = false
setInterval(() => {
  wait = false
}, 20)

const updateRotationInfo = e => {
  let {x0, y0, x, y} = state
  let axis = [(y - y0) / (0.001 + (x - x0)), 0, 1] 
  if (x < x0) {
    axis[2] *= -1
    axis[0] *= -1
  }
  state.axis = axis
  let length2 = Math.pow(y - y0, 2) + Math.pow(x - x0, 2)
  const currentTime = performance.now()
  const timeDifference = currentTime - state.lastTime
  state.nextSpeed = Math.sqrt(length2) / timeDifference / 5
  state.lastTime = currentTime
}


// TODO
const solarSystem = {
  sun_pos: [0, 0, 0],
  sun_scale: 2,
  moon_pos: [3.5, 0, 0],
  moon_scale: 0.05,
  earth_pos: [3, 0, 0],
  earth_scale: 0.1
}

const addDragRotation = mWorld => {

  const oldMWorld = new Float32Array(16)
  const rotationMatrix = new Float32Array(16)
  const identityMatrix = glMatrix.mat4.identity(new Float32Array(16))

  canvas.onmousedown = e => {
    state.staticMWorld = true
    glMatrix.mat4.mul(oldMWorld, identityMatrix, mWorld)
    canvas.onmousemove = e => {
      state.x0 = state.x
      state.y0 = state.y
      state.x = e.offsetX
      state.y = e.offsetY
      if (!wait) updateRotationInfo(e)
    }
  }

  document.onmouseup = e => {
    canvas.onmousemove = null
    state.slowFactor = 1
    state.radPerSec = state.nextSpeed
    state.staticMWorld = false
  }

  const rotate = timePassed => {
    let angle = timePassed / 20 * Math.PI
    if (state.staticMWorld) {
      let length2 = Math.pow(state.x - state.x0, 2) + Math.pow(state.y - state.y0, 2)
      let offset = Math.sqrt(length2) / 300
      glMatrix.mat4.rotate(rotationMatrix, identityMatrix, offset, state.axis)
      glMatrix.mat4.mul(mWorld, rotationMatrix, mWorld)
    } else {
      state.slowFactor = Math.min(state.slowFactor / 1.002, state.slowFactor - 0.001 < 0 ? 0 : state.slowFactor - 0.001)
      const angularSpeed = angle / 17 * state.radPerSec * state.slowFactor
      glMatrix.mat4.rotate(rotationMatrix, identityMatrix, angularSpeed, state.axis)
      glMatrix.mat4.mul(mWorld, rotationMatrix, mWorld)
    }
  }

  return rotate
}

export default addDragRotation
