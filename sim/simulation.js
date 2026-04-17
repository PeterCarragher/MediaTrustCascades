import { Grid } from './grid.js'

const rand = () => Math.random()

// Box-Muller normal sample
function randNormal(mean, std) {
  let u, v
  do { u = Math.random() } while (u === 0)
  do { v = Math.random() } while (v === 0)
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

const clamp01 = v => Math.max(0, Math.min(1, v))

// Apply an error hit to outlet idx for a given eventId.
// Returns true if the error had effect.
// Skips if: trust < threshold (outlet is immune), or this event already hit here.
function applyError(grid, idx, eventId, params) {
  if (grid.lastEventId[idx] === eventId) return false
  if (grid.trust[idx] < params.trustThreshold) return false
  grid.lastEventId[idx] = eventId
  grid.trust[idx] = clamp01(grid.trust[idx] - clamp01(randNormal(params.errorMean, params.errorStd)))
  return true
}

function buildTrust(grid, params) {
  const t = grid.trust
  for (let i = 0; i < t.length; i++) t[i] = Math.min(1, t[i] + params.trustBuildRate)
}

// Advance every active event wavefront by one hop.
// Each event propagates independently; outlets already hit by the same event are skipped.
function tickPropagation(grid, params) {
  if (!grid.front.size) return
  const nextFront = new Map()
  for (const [eventId, front] of grid.front) {
    const next = new Set()
    for (const idx of front) {
      for (const nb of grid.neighbors(idx, params.diagonal)) {
        if (rand() < params.copyLikelihood && applyError(grid, nb, eventId, params))
          next.add(nb)
      }
    }
    if (next.size) nextFront.set(eventId, next)
  }
  grid.front = nextFront
}

// Every factcheckInterval ticks, sample one outlet and fire an error event.
// Each event gets a unique ID so it can only hit any outlet once.
function maybeSpawnError(grid, params, tick, nextEventId) {
  if (tick % params.factcheckInterval !== 0) return nextEventId
  if (rand() >= params.errorRate) return nextEventId
  const eventId = nextEventId + 1
  const idx = Math.floor(rand() * grid.trust.length)
  if (applyError(grid, idx, eventId, params)) {
    grid.front.set(eventId, new Set([idx]))
  }
  return eventId
}

// Diffuse trust toward the local neighborhood average.
// Each outlet moves a fraction `proximity` of the way toward its neighbors' mean.
// Uses a snapshot of current trust so updates don't cascade within one tick.
function applyProximity(grid, snapshot, params) {
  if (params.proximity === 0) return
  const { trust, width, height } = grid
  snapshot.set(trust)
  for (let idx = 0; idx < trust.length; idx++) {
    const nbs = grid.neighbors(idx, params.diagonal)
    let sum = 0
    for (const nb of nbs) sum += snapshot[nb]
    const avg = sum / nbs.length
    trust[idx] = clamp01(trust[idx] + params.proximity * (avg - trust[idx]))
  }
}

export function createSimulation(width, height) {
  const grid     = new Grid(width, height)
  const snapshot = new Float32Array(width * height)  // reused buffer for proximity
  let tick = 0, nextEventId = 0

  function step(params) {
    buildTrust(grid, params)
    tickPropagation(grid, params)
    nextEventId = maybeSpawnError(grid, params, tick++, nextEventId)
    applyProximity(grid, snapshot, params)
  }

  return { grid, step }
}
