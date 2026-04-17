export const EMPTY   = 0
export const ARTICLE = 1
export const ERROR   = 2
export const COOLING = 3

export class Grid {
  constructor(width, height) {
    this.width    = width
    this.height   = height
    this.cells    = new Uint8Array(width * height)
    this.articles = new Map()  // idx → { outletId, lifespan, copiedFrom }
    this.cooling  = new Map()  // idx → timerRemaining
    this.copiedBy = new Map()  // idx → Set<idx>  (reverse copy index for cascades)
  }

  idx(x, y)      { return y * this.width + x }
  inBounds(x, y) { return x >= 0 && x < this.width && y >= 0 && y < this.height }
  isEmpty(x, y)  { return this.inBounds(x, y) && this.cells[this.idx(x, y)] === EMPTY }

  placeArticle(x, y, outletId, lifespan, copiedFrom) {
    const i = this.idx(x, y)
    this.cells[i] = ARTICLE
    this.articles.set(i, { outletId, lifespan, copiedFrom })
    if (copiedFrom !== null) {
      if (!this.copiedBy.has(copiedFrom)) this.copiedBy.set(copiedFrom, new Set())
      this.copiedBy.get(copiedFrom).add(i)
    }
  }

  // BFS: mark startIdx as ERROR, then propagate to each downstream copy with
  // probability `propagationLikelihood`. Cascade size is emergent from the
  // copy-network topology and this per-edge propagation probability.
  cascade(startIdx, propagationLikelihood) {
    const queue = [startIdx]
    while (queue.length) {
      const idx = queue.pop()
      if (this.cells[idx] !== ARTICLE) continue
      this.cells[idx] = ERROR
      const children = this.copiedBy.get(idx)
      if (children) for (const child of children)
        if (Math.random() < propagationLikelihood) queue.push(child)
    }
  }

  tickArticles(coolingDuration) {
    const expired = []
    for (const [idx, art] of this.articles) {
      if (--art.lifespan <= 0) expired.push([idx, art])
    }
    for (const [idx, art] of expired) {
      this.cells[idx] = this.cells[idx] === ERROR ? COOLING : EMPTY
      if (this.cells[idx] === COOLING) this.cooling.set(idx, coolingDuration)
      if (art.copiedFrom !== null) {
        const siblings = this.copiedBy.get(art.copiedFrom)
        if (siblings) siblings.delete(idx)
      }
      this.copiedBy.delete(idx)
      this.articles.delete(idx)
    }
  }

  tickCooling() {
    for (const [idx, timer] of this.cooling) {
      if (timer <= 1) { this.cells[idx] = EMPTY; this.cooling.delete(idx) }
      else this.cooling.set(idx, timer - 1)
    }
  }
}
