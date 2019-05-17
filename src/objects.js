const cube = [
  // Front face
  -1.0, -1.0,  1.0,
   1.0, -1.0,  1.0,
   1.0,  1.0,  1.0,
  -1.0,  1.0,  1.0,

  // Back face
  -1.0, -1.0, -1.0,
  -1.0,  1.0, -1.0,
   1.0,  1.0, -1.0,
   1.0, -1.0, -1.0,

  // Top face
  -1.0,  1.0, -1.0,
  -1.0,  1.0,  1.0,
   1.0,  1.0,  1.0,
   1.0,  1.0, -1.0,

  // Bottom face
  -1.0, -1.0, -1.0,
   1.0, -1.0, -1.0,
   1.0, -1.0,  1.0,
  -1.0, -1.0,  1.0,

  // Right face
   1.0, -1.0, -1.0,
   1.0,  1.0, -1.0,
   1.0,  1.0,  1.0,
   1.0, -1.0,  1.0,

  // Left face
  -1.0, -1.0, -1.0,
  -1.0, -1.0,  1.0,
  -1.0,  1.0,  1.0,
  -1.0,  1.0, -1.0,
]

const cubeGenerator = (height, width, depth, offsetHeight=0, offsetWidth=0, offsetDepth=0) => {
  let cube2 = cube.slice()
  const dim = [height / 2, width / 2, depth / 2]
  const offsets = [offsetHeight, offsetWidth, offsetDepth]
  return cube2.map((point, i) => point * dim[i % 3] + offsets[i % 3])
}

const cubeIndices = [
  0,  1,  2,      0,  2,  3,    // front
  4,  5,  6,      4,  6,  7,    // back
  8,  9,  10,     8,  10, 11,   // top
  12, 13, 14,     12, 14, 15,   // bottom
  16, 17, 18,     16, 18, 19,   // right
  20, 21, 22,     20, 22, 23,   // left
]

const addIndices = (indexArray, newIndices, increment) => {
  newIndices.forEach(index => {
    indexArray.push(index + increment)
  })
}

const addColorsToCube = (cube, colors) => {
  let array = []
  let counter = 0
  for (let i = 0; i < 6 * 4; i++) {
    array.push(cube.pop(0))
    array.push(cube.pop(0))
    array.push(cube.pop(0))
    array.push(...colors[parseInt(i / 4)])
  }
  return array
}

const pyramidColors = [
  [0.7, 0.3, 0.3],
  [0.3, 0.7, 0.3],
  [0.7, 0.7, 0.3],
  [0.7, 0.3, 0.8]
]


const triangle = (a, b, c, colorNumber) => {
  const array = []
  array.push(...a, ...pyramidColors[colorNumber])
  array.push(...b, ...pyramidColors[colorNumber])
  array.push(...c, ...pyramidColors[colorNumber])
  return array
}

const tetraHedron = ( a, b, c, d ) => {
  // tetrahedron with each side using
  // a different color
  const array = []
  array.push(...triangle( a, c, b, 0 ))
  array.push(...triangle( a, c, d, 1 ))
  array.push(...triangle( a, b, d, 2 ))
  array.push(...triangle( b, c, d, 3 ))
  return array
}

// Black magic
const mix = ( u, v, s ) => {
  var result = []
  for ( var i = 0; i < u.length; ++i ) {
    result.push( (1.0 - s) * u[i] + s * v[i] )
  }
  return result
}

const divideTetrahedron = ( a, b, c, d, count ) => {
  // check for end of recursion
  if ( count-- === 0 )
    return tetraHedron( a, b, c, d)

  // find midpoints of sides
  // divide four smaller tetrahedra
  else {
    const array = []
    var ab = mix( a, b, 0.5 )
    var ac = mix( a, c, 0.5 )
    var ad = mix( a, d, 0.5 )
    var bc = mix( b, c, 0.5 )
    var bd = mix( b, d, 0.5 )
    var cd = mix( c, d, 0.5 )
    array.push(...divideTetrahedron(  a, ab, ac, ad, count ))
    array.push(...divideTetrahedron( ab,  b, bc, bd, count ))
    array.push(...divideTetrahedron( ac, bc,  c, cd, count ))
    array.push(...divideTetrahedron( ad, bd, cd,  d, count ))
    return array
  }
}
const vs = [
  [  0.0000,  0.0000, -1.0000 ],
  [  0.0000,  0.9428,  0.3333 ],
  [ -0.8165, -0.4714,  0.3333 ],
  [  0.8165, -0.4714,  0.3333 ]
]

const pyramid = divideTetrahedron(vs[0], vs[1], vs[2], vs[3], 2)

export {
  pyramid,
  cube,
  cubeIndices,
  addColorsToCube,
  cubeGenerator,
  addIndices
}
