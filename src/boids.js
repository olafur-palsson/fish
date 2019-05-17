
const dist = (v1, v2) => {
  let d_squared = 0
  v1.forEach((_, i) => {
    d_squared += (v1[i] - v2[i]) * (v1[i] - v2[i])
  })
  return Math.sqrt(d_squared)
}

const normalize = (v1, min, max) => {
  let d = Math.sqrt(v1.reduce((acc, x) => acc + x * x, 0))
  let scalar = 1
  if (d < min) 
    scalar *= min / d
  else if (d > max)
    scalar *= max / d
  else 
    return v1
  return v1.map(a => a * scalar)
}

const boids_updateVelocity = async boids => {
  let n = boids.length
  let updated = []

  let filteredBoids = []

  const filter = boid => {
    filteredBoids = []
    boids.forEach(b => {
      if (dist(boid.location, b.location) < 1.5)
        filteredBoids.push(b)
    })
  }

  const centerOfMassRule = boid => {
    let x = 0, y = 0, z = 0
    let [x0, y0, z0] = boid.location
    filteredBoids.forEach(b => {
      if (b == boid) return
      x += b.location[0]
      y += b.location[1]
      z += b.location[2]    
    })
    x /= filteredBoids.length
    y /= filteredBoids.length
    z /= filteredBoids.length

    return [x, y, z].map((a, i) => (a - boid.location[i]))
  }

  const keepDistanceRule = boid => {
    let x = 0, y = 0, z = 0
    let [x0, y0, z0] = boid.location
    filteredBoids.forEach(b => {
      if (b == boid) return
      if (dist(boid.location, b.location) < 1.0) {
        let [bx, by, bz] = b.location
        x -= 1 / (bx - x0)  
        y -= 1 / (by - y0)
        z -= 1 / (bz - z0) 
      }
    })
    x /= filteredBoids.length
    y /= filteredBoids.length
    z /= filteredBoids.length
    return [x, y, z].map(a => a) 
  }

  const sameVelocityRule = boid => {
    let [vx, vy, vz] = [0, 0, 0]
    let [vx0, vy0, vz0] = boid.velocity
    filteredBoids.forEach(b => {
      if (b == boid) return
      let [bvx, bvy, bvz] = b.velocity
      vx += bvx
      vy += bvy
      vz += bvz
    })
    vx /= filteredBoids.length
    vy /= filteredBoids.length
    vz /= filteredBoids.length
    return [vx - vx0, vy - vy0, vz - vy0].map(a => a)
  }

  const preferCenterRule = boid => {
    let d = dist([0, 0, 0], boid.location) 
    return boid.location.map(x => 0 - x * d * d * 0.0001)
  }

  const velocities = []

  let bool = true
  const MAX_SPEED = 1.7
  const MIN_SPEED = 0.5

  const doBoids = i => {
    if (i >= boids.length) return
    let boid = boids[i]
    filter(boid)
    let v1 = centerOfMassRule(boid)
    let v2 = keepDistanceRule(boid)
    let v3 = sameVelocityRule(boid)
    let v4 = preferCenterRule(boid)
    // if (bool) { console.log(dist([0, 0, 0], v1), dist([0, 0, 0], v2), dist([0, 0, 0], v3), dist([0, 0, 0], v4)); bool = false }
    let newVelocity = []
    boid.velocity.forEach((v_0, i) => {
      newVelocity.push(0.5 * v_0 + 0.5 * (0.5 * v1[i] + v2[i] + v3[i] * 3 + v4[i]))
    })

    boid.velocity = normalize(newVelocity, MIN_SPEED, MAX_SPEED)
    setTimeout(() => {
      doBoids(i+1)
    }, 500 / boids.length)
  }

  doBoids(0)

  return 1
 return updated
}

export {
  boids_updateVelocity
}
