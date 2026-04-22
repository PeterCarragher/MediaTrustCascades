export class Grid {
  constructor(width, height) {
    this.width       = width
    this.height      = height
    this.trust       = new Float32Array(width * height).fill(1.0)
    this.lastEventId       = new Uint32Array(width * height)  // 0 = never hit
    this.propagatingErrorId = new Uint32Array(width * height)  // 0 = not propagating
    this.front             = new Map()  // eventId → Set<idx>
  }

  idx(x, y)      { return y * this.width + x }
  inBounds(x, y) { return x >= 0 && x < this.width && y >= 0 && y < this.height }

  // 4-connected neighbors; 8-connected when diagonal is true
  neighbors(idx, diagonal = false) {
    const x = idx % this.width, y = Math.floor(idx / this.width)
    const result = []
    const dirs = diagonal
      ? [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]]
      : [[-1,0],[1,0],[0,-1],[0,1]]
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy
      if (this.inBounds(nx, ny)) result.push(this.idx(nx, ny))
    }
    return result
  }
}
