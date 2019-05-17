
const glMatrix = require('gl-matrix')

/*

  Copyright Olafur Palsson
  Email:   olafur.palsson2@gmail.com
  GitHUb:  olafur-palsson
  License: MIT

*/

const vertexShaderTextures = `
  attribute vec3 vertexPosition;
  attribute vec3 vertexColor;
  attribute vec2 a_textcoord;

  // Object manipulation
  uniform mat4 orientation;
  uniform vec3 translation;
  uniform float scalar;
  uniform float wiggle;


  varying vec3 adjustedPosition;

  // World manipulation
  uniform mat4 mWorld;
  uniform mat4 mView;
  uniform mat4 mProjection;

  // Fragment shader variables
  varying vec2 v_textcoord;


  void main() {
    adjustedPosition = vec3(
      vertexPosition.x - (wiggle * 35.0) + vertexPosition.z * vertexPosition.z * wiggle * 0.001, 
      vertexPosition.y, 
      0.0 - vertexPosition.z
    );
    gl_Position = mProjection
    * mView
    * mWorld
    * (
        orientation 
        * vec4(scalar * 0.002 * adjustedPosition, 1.0) 
        + vec4(translation, 0.0)
      );

    v_textcoord = a_textcoord;
  }
`

const fragmentShaderTextures = `
  precision mediump float;
  varying vec2 v_textcoord;
  uniform sampler2D u_sampler;

  void main() {
    gl_FragColor = texture2D(u_sampler, v_textcoord); 

  }
`

const fragmentShaderSingleColor = `
  precision mediump float;
  
  void main() {
    gl_FragColor = vec4(0.8, 0.5, 0.8, 0.7);
  }
`


const vertexShaderTextFull3D = `
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
    gl_PointSize = 3.0;
  }
`

const fragmentShaderBasic = `
  precision mediump float;
  varying vec3 fragmentColor;

  void main() {
    gl_FragColor = vec4(fragmentColor, 1.0);
  }
`

const selectVertexShader = shaderType => {
  if (!shaderType) return
  switch (shaderType) {
    case "full3d":
      return vertexShaderTextFull3D
    case "textures":
      return vertexShaderTextures
    default:
      throw "Not a valid vertexShader type"
  }
}

const selectFragmentShader = shaderType => {
  if (!shaderType) return
  switch (shaderType) {
    case "one_color":
      return fragmentShaderSingleColor
    case "basic":
      return fragmentShaderBasic
    case "textures":
      return fragmentShaderTextures
    default:
      throw "Not a valid fragmentShader type"
  }
}

export default class EasyWebGL {

  constructor (webglContext, vertexShaderType, fragmentShaderType) {
    this.gl = webglContext
    this.vtxShaderText = selectVertexShader(vertexShaderType)
    this.frgShaderText = selectFragmentShader(fragmentShaderType)
   }
  // This is how you get the compile errors of a shader displayed in console
  verifyShaderCompilation (gl, shader) {
    const ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
    if ( !ok )
    throw "ShaderCompileError: \n" + gl.getShaderInfoLog(shader)
  }

  // This is how you get the linking errors of the program displayed in console
  verifyProgramLinking (gl, program) {
    const ok = gl.getProgramParameter(program, gl.LINK_STATUS)
    if ( !ok )
    throw "ProgramLinkingError: \n" + gl.getProgramInfoLog(program)
  }

  initProgram (vertexShaderText=this.vtxShaderText, fragmentShaderText=this.frgShaderText) {

    // Set the background or null color and clear
    this.gl.clearColor(0, 0, 0, 1)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

    // Create shader
    this.vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER)
    this.fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER)

    // Set the source code for the shader
    this.gl.shaderSource(this.vertexShader, vertexShaderText)
    this.gl.shaderSource(this.fragmentShader, fragmentShaderText)

    // Compile
    this.gl.compileShader(this.vertexShader)
    this.gl.compileShader(this.fragmentShader)

    // Get shader compile errors displayed in console
    this.verifyShaderCompilation(this.gl, this.vertexShader)
    this.verifyShaderCompilation(this.gl, this.fragmentShader)

    // Create and link the program
    this.program = this.gl.createProgram()
    this.gl.attachShader(this.program, this.vertexShader)
    this.gl.attachShader(this.program, this.fragmentShader)
    this.gl.linkProgram(this.program)

    // Get linking errors
    this.verifyProgramLinking(this.gl, this.program)
    return this.program
  }

  getUniformLocations () {
    const matWorldUniformLocation = this.gl.getUniformLocation(this.program, 'mWorld')
    const matViewUniformLocation = this.gl.getUniformLocation(this.program, 'mView')
    const matProjUniformLaction = this.gl.getUniformLocation(this.program, 'mProjection')
    return { matWorldUniformLocation, matViewUniformLocation, matProjUniformLaction }
  }

  getAttribLocations () {
    const positionAttribLocation = this.gl.getAttribLocation(this.program, 'vertexPosition')
    const colorAttribLocation    = this.gl.getAttribLocation(this.program, 'vertexColor')
    return { positionAttribLocation, colorAttribLocation }
  }

  setupUniformMatrices (aspectRatio, positionOfViewer, pointViewerIsLookingAt, vectorPointingUp) {
    const mWorld = new Float32Array(16);
    const mView = new Float32Array(16);
    const mProj = new Float32Array(16);

    const {
      matWorldUniformLocation,
      matViewUniformLocation,
      matProjUniformLaction
    } = this.getUniformLocations()


    glMatrix.mat4.identity(mWorld)
    glMatrix.mat4.lookAt(mView, positionOfViewer,  pointViewerIsLookingAt, vectorPointingUp)
    glMatrix.mat4.perspective(mProj, Math.PI * 0.25, aspectRatio, 0.1, 1000.0)

    this.gl.uniformMatrix4fv(matViewUniformLocation, this.gl.FALSE, mView)
    this.gl.uniformMatrix4fv(matWorldUniformLocation, this.gl.FALSE, mWorld)
    this.gl.uniformMatrix4fv(matProjUniformLaction, this.gl.FALSE, mProj)

    return { mWorld, mView, mProj }
  }
}
