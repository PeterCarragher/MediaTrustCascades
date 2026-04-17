import { createSimulation }        from './sim/simulation.js'
import { Renderer }                 from './ui/renderer.js'
import { readParams, initControls } from './ui/controls.js'

const canvas = document.getElementById('sim-canvas')
let sim, renderer, playing = true

function gridSize() { return parseInt(document.getElementById('grid-size').value) }

function reset() {
  const s = gridSize()
  sim      = createSimulation(s, s)
  renderer = new Renderer(canvas, sim.grid)
}

reset()

let lastFrameTime = 0

function frame(now) {
  const minDelay = 1000 / parseInt(document.getElementById('target-fps').value)

  if (now - lastFrameTime >= minDelay) {
    lastFrameTime = now

    if (playing) {
      const params = readParams()
      const steps  = parseInt(document.getElementById('sim-speed').value)
      for (let i = 0; i < steps; i++) sim.step(params)
    }

    renderer.render()

    // Live stats
    const trust = sim.grid.trust
    let sum = 0, min = 1, max = 0
    for (let i = 0; i < trust.length; i++) {
      sum += trust[i]
      if (trust[i] < min) min = trust[i]
      if (trust[i] > max) max = trust[i]
    }
    document.getElementById('stat-avg').textContent   = (sum / trust.length).toFixed(3)
    document.getElementById('stat-min').textContent   = min.toFixed(3)
    document.getElementById('stat-max').textContent   = max.toFixed(3)
    let frontSize = 0
    for (const s of sim.grid.front.values()) frontSize += s.size
    document.getElementById('stat-front').textContent = frontSize
  }

  requestAnimationFrame(frame)
}

initControls({
  reset,
  togglePlay: () => { playing = !playing },
  isPlaying:  () => playing,
})

frame(0)
