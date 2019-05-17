
import { loadTexture } from './textures.js'

const ObjectLoader = require('webgl-obj-loader')

const getFileFromURL = async url => {
  return new Promise((resolve, reject) => {
    var req = new XMLHttpRequest();
    req.onload = () =>  {
      resolve(req.responseText)
    }
    req.open("GET", url);
    req.onerror = () => {
      reject(url + " did not load bro")
    }
    req.send();
  })
}

const getObject = async (gl, url) => {
  const objectData = await getFileFromURL(url)  
  const object = new ObjectLoader.Mesh(objectData)
  return object
}

const createBuffers = (gl, object) => {
  const vertexBuffer  = gl.createBuffer()
  const indexBuffer   = gl.createBuffer()
  const textureBuffer = gl.createBuffer()
  const normalBuffer  = gl.createBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.vertices), gl.STATIC_DRAW)

  gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.textures), gl.STATIC_DRAW)

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.vertexNormals), gl.STATIC_DRAW)

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(object.indices), gl.STATIC_DRAW)
  
  return {
    textureBuffer,
    normalBuffer,
    vertexBuffer,
    indexBuffer
  }
}

const N_BYTES = Float32Array.BYTES_PER_ELEMENT

export default class GLObject {
  async init(gl, objectUrl, textureUrl, posAttrLoc, textcoordAttrLoc, u_samplerUnifLoc) {
    this.mesh = await getObject(gl, objectUrl)
    this.buffers = createBuffers(gl, this.mesh)
    this.texture = loadTexture(gl, textureUrl)
    this.gl = gl
    this.draw = this.draw.bind(this)
    this.numItems = this.mesh.indices.length
    this.posAttrLoc = posAttrLoc
    this.textcoordAttrLoc = textcoordAttrLoc
    this.u_samplerUnifLoc = u_samplerUnifLoc
  }

  static async create(gl, objectUrl, textureUrl, posAttrLoc, textcoordAttrLoc, u_samplerUnifLoc) {
    const object = new GLObject()
    await object.init(gl, objectUrl, textureUrl, posAttrLoc, textcoordAttrLoc, u_samplerUnifLoc)
    return object
  }

  // Draws out the object on the center of the world
  // Use translation in shader to draw in a different place
  draw () {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.vertexBuffer)
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indexBuffer)
    this.gl.vertexAttribPointer(this.posAttrLoc, 3, this.gl.FLOAT, this.gl.FALSE, 3 * N_BYTES, 0)
    this.gl.enableVertexAttribArray(this.posAttrLoc)

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.textureBuffer)
    this.gl.vertexAttribPointer(this.textcoordAttrLoc, 2, this.gl.FLOAT, this.gl.FALSE, 0, 0)
    this.gl.enableVertexAttribArray(this.textcoordAttrLoc)

    this.gl.activeTexture(this.gl.TEXTURE0)
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture)
    this.gl.uniform1i(this.u_samplerUniformLocation, 0)

    this.gl.drawElements(this.gl.TRIANGLES, this.numItems, this.gl.UNSIGNED_SHORT, 0)
  }
}


