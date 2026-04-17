export const EMPTY   = 0
export const ARTICLE = 1
export const ERROR   = 2
export const COOLING = 3

export class Grid {
  constructor(width, height) {
    this.width          = width
    this.height         = height
    this.cells          = new Uint8Array(width * height)
    this.articles       = new Map()  // idx → { outletId, lifespan, copiedFrom }
    this.cooling        = new Map()  // idx → timerRemaining
    this.copiedBy       = new Map()  // idx → Set<idx>  (reverse copy index)
    this.cascadeFront   = new Set()  // current error wavefront, advanced one hop per tick
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

  // Mark startIdx as ERROR, reset its lifespan to factcheckLifetime, and
  // add it to the wavefront. The error spreads one hop per tick via tickCascade().
  cascade(startIdx, factcheckLifetime) {
    if (this.cells[startIdx] !== ARTICLE) return
    this.cells[startIdx] = ERROR
    this.articles.get(startIdx).lifespan = factcheckLifetime
    this.cascadeFront.add(startIdx)
  }

  // Advance the error wavefront by exactly one hop.
  // Each copy edge (upstream and downstream) fires independently
  // with probability `propagationLikelihood`. Newly errored articles
  // have their lifespan reset to `factcheckLifetime`.
  tickCascade(propagationLikelihood, factcheckLifetime) {
    if (!this.cascadeFront.size) return
    const next = new Set()

    const markError = (idx) => {
      this.cells[idx] = ERROR
      this.articles.get(idx).lifespan = factcheckLifetime
      next.add(idx)
    }

    for (const idx of this.cascadeFront) {
      // Downstream: articles that copied this one
      const children = this.copiedBy.get(idx)
      if (children) for (const child of children)
        if (this.cells[child] === ARTICLE && Math.random() < propagationLikelihood)
          markError(child)

      // Upstream: the article this one was copied from
      const src = this.articles.get(idx)?.copiedFrom
      if (src != null && this.cells[src] === ARTICLE && Math.random() < propagationLikelihood)
        markError(src)
    }

    this.cascadeFront = next
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
