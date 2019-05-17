// Glosur, tolvugrafik

// ------------- VERTEX SHADER TEXT ---------------------

//    attribute vec3 vertexPosition;
//    attribute vec3 vertexColor;

// Don't know a lot about these things
// But I know that vertices have 'attribute's, thus
// the first two lines make sense

//    varying vec3 fragmentColor;

// The fragment color is varying because as we see in 'main'
// it is assigned a new value all the time.


//    uniform mat4 mWorld;
//    uniform mat4 mViewAngle;
//    uniform mat4 mProjection;
//    ... (rest)

// These rest is more straight forward (if you know a little math)
// gl_Position is basically where the pixel lands on the 'canvas'
// according to the camera
//    mWorld:
//      Changes the orientation of the world itself
//    mView:
//      This matrix turns the camera towards a point (libraries like)
//      gl-matrix.js make this easy by doing 'makeViewMatrix(1.0, 2.0, 2.0)'
//      type of commands
//    mProjection: Projection
//      Last matrix projects the point to the actual screen
// And ta-da! That's everything we need to render a point with respect to
// a camera in every case.

const vertexShaderText = `
  attribute vec3 vertexPosition;
  attribute vec3 vertexColor;
  varying vec3 fragmentColor;

  uniform mat4 mWorld;
  uniform mat4 mView;
  uniform mat4 mProjection;

  void main() {
    fragmentColor = vertexColor;
    gl_Position = mProjection
      * mView
      * mWorld
      * vec4(vertexPosition, 1.0);
  }
`

// This thing is still black magic to me
const fragmentShaderText = `
  precision mediump float;
  varying vec3 fragmentColor;

  void main() {
    gl_FragColor = vec4(fragmentColor, 1.0);
  }
`

// This is how you get the compile errors of a shader displayed in console
const verifyShaderCompilation = (gl, shader) => {
  const ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
  if ( !ok )
    throw "ShaderCompileError: \n" + gl.getShaderInfoLog(shader)
}

// This is how you get the linking errors of the program displayed in console
const verifyProgramLinking = (gl, program) => {
  const ok = gl.getProgramParameter(program, gl.LINK_STATUS)
  if ( !ok )
    throw "ProgramLinkingError: \n" + gl.getProgramInfoLog(program)
}


// Here the coding begins
const start = () => {
  // Get the graphics API from html
  const canvas = document.getElementById('canvas')
  const gl = canvas.getContext('webgl')

  // Set the background or null color and clear
  gl.clearColor(0.5, 0.5, 0.6, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // Create shader
  const vertexShader = gl.createShader(gl.VERTEX_SHADER)
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)

  // Set the source code for the shader
  gl.shaderSource(vertexShader, vertexShaderText)
  gl.shaderSource(fragmentShader, fragmentShaderText)

  // Compile
  gl.compileShader(vertexShader)
  gl.compileShader(fragmentShader)

  // Get shader compile errors displayed in console
  verifyShaderCompilation(gl, vertexShader)
  verifyShaderCompilation(gl, fragmentShader)

  // Create and link the program
  const program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  // Get linking errors
  verifyProgramLinking(gl, program)

  // Raw data, format of...
  // 'location, location, location, color, color, color'
  const triangleVertices = [
     0.0,  0.5 + 5,  0.0,  1.0, 1.0, 0.0,
    -0.5, -0.5 + 5,  0.0,  0.7, 0.0, 1.0,
     0.5, -0.5 + 5,  0.0,  0.1, 1.0, 0.2
  ]

  // Set buffer to be triangles
  const triangleBufferObject = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBufferObject)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW)

  // Get the location of the attributes from the shader
  const positionAttribLocation = gl.getAttribLocation(program, 'vertexPosition')
  const colorAttribLocation    = gl.getAttribLocation(program, 'vertexColor')

  // Tell WebGL how to read the data in triangleVertices
  // Format: location, nElements in a set, numberOfBytes, normalised (T/F),
  //         stride (with stride=6 and nElements=3 this means 'use 0,1,2, then 6,7,8' ...)
  //         starting offset (with this as 3 means 'use 3,4,5, then 9,10,11 ...')
  // gl.FLOAT == 4
  let N_BYTES = Float32Array.BYTES_PER_ELEMENT
  gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, gl.FALSE, 6 * N_BYTES, 0)
  gl.vertexAttribPointer(colorAttribLocation, 3, gl.FLOAT, gl.FALSE, 6 * N_BYTES, 3 * N_BYTES)

  // All vertex attributes are disabled by default, thus...
  gl.enableVertexAttribArray(positionAttribLocation)
  gl.enableVertexAttribArray(colorAttribLocation)

  // Tell WebGL what program to use
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
  const positionOfViewer       = [ 0, -20, 0]
  const pointViewerIsLookingAt = [ 0, 0, 0]
  const vectorPointingUp       = [ 0, 0, 5]
  glMatrix.mat4.lookAt(mView, positionOfViewer, pointViewerIsLookingAt, vectorPointingUp)

  // Black magic
  // Most likely f(output, cameraWidthAngle, aspectRatio, closestRenderedPoint, furthestRenderedPoint)
  glMatrix.mat4.perspective(mProjection, Math.PI * 0.25, canvas.width / canvas.height, 0.1, 1000.0)

  // Set the mView in the shader to be the matrix we made
  gl.uniformMatrix4fv(matViewUniformLocation,  gl.FALSE, mView)
  gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, mWorld)
  gl.uniformMatrix4fv(matProjUniformLocation,  gl.FALSE, mProjection)

  // ------------------ At this point rendering is finished ---------------------

  // So we only call this function once
  const identityMatrix = new Float32Array(16)
  glMatrix.mat4.identity(identityMatrix)

  let zRotationMatrix = new Float32Array(16)
  let angle = 0

  const renderingLoop = () => {
    // performance.now() gives elapsed time in ms
    angle = performance.now() / 1000 / 6 * 2 * Math.PI

    // This has the format f(output, blackMagic, angle, axisOfRotation)
    glMatrix.mat4.rotate(zRotationMatrix, identityMatrix, angle, [1, 0, 0])
    glMatrix.mat4.mul(mWorld, identityMatrix, zRotationMatrix)

    // Update the world
    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, mWorld)

    // Clear everything like in the beginning
    gl.clearColor(0.5, 0.5, 0.6, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // Draw out the triangle from the current set buffer
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    // Output the frame (loop is the callback function)
    requestAnimationFrame(renderingLoop)

  }

  requestAnimationFrame(renderingLoop)
}
