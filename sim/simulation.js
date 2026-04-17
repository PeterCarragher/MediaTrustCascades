import { Grid, ARTICLE } from './grid.js'

const rand  = ()    => Math.random()
const randI = (max) => Math.floor(Math.random() * max)

// Place outlets in a jittered grid so territories are distinct
function createOutlets(count, width, height) {
  const cols = Math.ceil(Math.sqrt(count))
  const rows = Math.ceil(count / cols)
  return Array.from({ length: count }, (_, i) => {
    const col = i % cols, row = Math.floor(i / cols)
    const jx  = (rand() - 0.5) * (width  / cols  / 2)
    const jy  = (rand() - 0.5) * (height / rows / 2)
    return {
      id:             i,
      cx:             Math.round(Math.max(10, Math.min(width  - 10, (col + 0.5) / cols * width  + jx))),
      cy:             Math.round(Math.max(10, Math.min(height - 10, (row + 0.5) / rows * height + jy))),
      pubRate:        4,   // article placement attempts per tick
      copyLikelihood: 0.4, // probability a new article copies a nearby one
      owner:          i,
    }
  })
}

// Return idx of a random ARTICLE cell within copyRadius of (x, y), or null
function findNearbyArticle(grid, x, y, radius) {
  const candidates = []
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      if (dx === 0 && dy === 0) continue
      const nx = x + dx, ny = y + dy
      if (!grid.inBounds(nx, ny)) continue
      const idx = grid.idx(nx, ny)
      if (grid.cells[idx] === ARTICLE) candidates.push(idx)
    }
  }
  return candidates.length ? candidates[randI(candidates.length)] : null
}

function spawnArticles(grid, outlets, params) {
  for (const outlet of outlets) {
    const attempts = Math.floor(outlet.pubRate) + (rand() < outlet.pubRate % 1 ? 1 : 0)
    for (let a = 0; a < attempts; a++) {
      let x, y
      if (params.outletInfluenceEnabled) {
        const s = params.outletSpread
        x = Math.max(0, Math.min(grid.width  - 1, outlet.cx + Math.round((rand() * 2 - 1) * s)))
        y = Math.max(0, Math.min(grid.height - 1, outlet.cy + Math.round((rand() * 2 - 1) * s)))
      } else {
        x = randI(grid.width)
        y = randI(grid.height)
      }
      if (!grid.isEmpty(x, y)) continue

      const nearby     = findNearbyArticle(grid, x, y, params.copyRadius)
      const copiedFrom = nearby !== null && rand() < outlet.copyLikelihood ? nearby : null
      grid.placeArticle(x, y, outlet.id, params.articleLifespan, copiedFrom)
    }
  }
}

function fireFactChecks(grid, params) {
  for (const [idx] of grid.articles) {
    if (grid.cells[idx] !== ARTICLE) continue
    if (rand() < params.factCheckRate) grid.cascade(idx, params.errorPropagationLikelihood)
  }
}

function fireLayoffs(outlets, params) {
  for (const outlet of outlets) {
    if (rand() < params.layoffRate) {
      outlet.pubRate        = Math.max(0.5, outlet.pubRate        * (1 - params.layoffEffect))
      outlet.copyLikelihood = Math.min(0.9, outlet.copyLikelihood +      params.layoffCopyBoost)
    }
  }
}

function fireAcquisitions(outlets, params) {
  if (outlets.length < 2 || rand() >= params.acquisitionRate) return
  const i = randI(outlets.length)
  let   j = randI(outlets.length - 1); if (j >= i) j++
  const [a, b] = [outlets[i], outlets[j]]
  a.pubRate = (a.pubRate + b.pubRate) * params.acquisitionBoost
  a.cx      = Math.round((a.cx + b.cx) / 2)
  a.cy      = Math.round((a.cy + b.cy) / 2)
  outlets.splice(j, 1)
}

export function createSimulation(width, height, numOutlets) {
  const grid    = new Grid(width, height)
  const outlets = createOutlets(numOutlets, width, height)

  function step(params) {
    spawnArticles(grid, outlets, params)
    if (params.factChecksEnabled)   fireFactChecks(grid, params)
    if (params.layoffsEnabled)      fireLayoffs(outlets, params)
    if (params.acquisitionsEnabled) fireAcquisitions(outlets, params)
    grid.tickArticles(params.coolingDuration)
    grid.tickCooling()
  }

  return { grid, outlets, step }
}
