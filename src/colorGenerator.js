

const randomColor = () => {
  return [Math.random(), Math.random(), Math.random()]
}

const createRandomColors = (n) => {
  let array = []
  for (let i = 0; i++ < n;)
    array.push(randomColor())
  return array
}

export {
  randomColor,
  createRandomColors
}
