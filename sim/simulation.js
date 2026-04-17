import { Grid, EMPTY, ARTICLE } from './grid.js'

const rand  = ()          => Math.random()
const randI = (max)       => Math.floor(Math.random() * max)

// Place outlets in a jittered grid so territories are distinct
function createOutlets(count, width, height) {
  const cols = Math.ceil(Math.sqrt(count))
  const rows = Math.ceil(count / cols)
  return Array.from({ length: count }, (_, i) => {
    const col = i % cols, row = Math.floor(i / cols)
    const jx  = (rand() - 0.5) * (width  / cols  / 2)
    const jy  = (rand() - 0.5) * (height / rows / 2)
    return {
      id:          i,
      cx:          Math.round(Math.max(10, Math.min(width  - 10, (col + 0.5) / cols * width  + jx))),
      cy:          Math.round(Math.max(10, Math.min(height - 10, (row + 0.5) / rows * height + jy))),
      pubModifier: 1.0,  // scaled by layoffs/acquisitions
      copyBoost:   0.0,  // additive boost to baseCopyRate from layoffs
      owner:       i,
    }
  })
}

// Count ARTICLE cells in the 8-neighborhood of (x, y)
function countAdjArticles(grid, x, y) {
  let n = 0
  for (let dx = -1; dx <= 1; dx++)
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue
      if (!grid.inBounds(x + dx, y + dy)) continue
      if (grid.cells[grid.idx(x + dx, y + dy)] === ARTICLE) n++
    }
  return n
}

// Indices of ARTICLE cells in the 8-neighborhood of (x, y)
function adjacentArticleIdxs(grid, x, y) {
  const result = []
  for (let dx = -1; dx <= 1; dx++)
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue
      if (!grid.inBounds(x + dx, y + dy)) continue
      const idx = grid.idx(x + dx, y + dy)
      if (grid.cells[idx] === ARTICLE) result.push(idx)
    }
  return result
}

// Nearest outlet whose zone covers (x, y); null if none
function nearestOutletInZone(outlets, x, y, spread) {
  let best = null, bestDist = Infinity
  for (const o of outlets) {
    if (Math.abs(x - o.cx) > spread || Math.abs(y - o.cy) > spread) continue
    const d = (x - o.cx) ** 2 + (y - o.cy) ** 2
    if (d < bestDist) { bestDist = d; best = o }
  }
  return best
}

// Nearest outlet regardless of zone (used when outlet influence is disabled)
function nearestOutlet(outlets, x, y) {
  let best = outlets[0], bestDist = Infinity
  for (const o of outlets) {
    const d = (x - o.cx) ** 2 + (y - o.cy) ** 2
    if (d < bestDist) { bestDist = d; best = o }
  }
  return best
}

// Per-pixel spawn loop.
// P(spawn at pixel) = baseLikelihood × adjacencyMultiplier × (adjacentArticles + 1) × outlet.pubModifier
function spawnArticles(grid, outlets, params) {
  const { width: W, height: H, cells } = grid
  const s = params.outletSpread

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (cells[grid.idx(x, y)] !== EMPTY) continue

      const outlet = params.outletInfluenceEnabled
        ? nearestOutletInZone(outlets, x, y, s)
        : nearestOutlet(outlets, x, y)
      if (!outlet) continue

      const adj = countAdjArticles(grid, x, y)
      const p   = Math.min(1, params.baseLikelihood * params.adjacencyMultiplier * (adj + 1) * outlet.pubModifier)
      if (rand() >= p) continue

      const adjIdxs    = adjacentArticleIdxs(grid, x, y)
      const copyP      = Math.min(1, params.baseCopyRate + outlet.copyBoost)
      const copiedFrom = adjIdxs.length && rand() < copyP ? adjIdxs[randI(adjIdxs.length)] : null
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
      outlet.pubModifier = Math.max(0.1, outlet.pubModifier * (1 - params.layoffEffect))
      outlet.copyBoost   = Math.min(0.5, outlet.copyBoost   + params.layoffCopyBoost)
    }
  }
}

function fireAcquisitions(outlets, params) {
  if (outlets.length < 2 || rand() >= params.acquisitionRate) return
  const i = randI(outlets.length)
  let   j = randI(outlets.length - 1); if (j >= i) j++
  const [a, b] = [outlets[i], outlets[j]]
  a.pubModifier = Math.min(2.0, (a.pubModifier + b.pubModifier) * params.acquisitionBoost)
  a.cx          = Math.round((a.cx + b.cx) / 2)
  a.cy          = Math.round((a.cy + b.cy) / 2)
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
