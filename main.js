import { createSimulation } from './sim/simulation.js'
import { Renderer }         from './ui/renderer.js'
import { readParams, initControls } from './ui/controls.js'

const N_OUTLETS = 8

const canvas = document.getElementById('sim-canvas')
let sim, renderer, playing = true

function gridSize() { return parseInt(document.getElementById('grid-size').value) }

function reset() {
  const s = gridSize()
  sim      = createSimulation(s, s, N_OUTLETS)
  renderer = new Renderer(canvas, sim.grid)
}

reset()  // initialise with whatever the slider default is

let lastFrameTime = 0

function frame(now) {
  const fps      = parseInt(document.getElementById('target-fps').value)
  const minDelay = 1000 / fps

  if (now - lastFrameTime >= minDelay) {
    lastFrameTime = now

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
  }

  requestAnimationFrame(frame)
}

initControls({
  reset,
  togglePlay: () => { playing = !playing },
  isPlaying:  () => playing,
})

frame()
