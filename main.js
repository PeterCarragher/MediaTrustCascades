import { createSimulation } from './sim/simulation.js'
import { Renderer }         from './ui/renderer.js'
import { readParams, initControls } from './ui/controls.js'

const W = 200, H = 200, N_OUTLETS = 8

let sim      = createSimulation(W, H, N_OUTLETS)
const canvas = document.getElementById('sim-canvas')
let renderer = new Renderer(canvas, sim.grid)
let playing  = true

function reset() {
  sim      = createSimulation(W, H, N_OUTLETS)
  renderer = new Renderer(canvas, sim.grid)
}

function frame() {
  if (playing) {
    const params = readParams()
    const steps  = parseInt(document.getElementById('sim-speed').value)
    for (let i = 0; i < steps; i++) sim.step(params)
  }

  const stats = renderer.render(sim.outlets)
  document.getElementById('stat-articles').textContent = stats.articles
  document.getElementById('stat-errors').textContent   = stats.errors
  document.getElementById('stat-cooling').textContent  = stats.cooling
  document.getElementById('stat-outlets').textContent  = sim.outlets.length

  requestAnimationFrame(frame)
}

initControls({
  reset,
  togglePlay: () => { playing = !playing },
  isPlaying:  () => playing,
})

frame()
