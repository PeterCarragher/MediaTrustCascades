export class Grid {
  constructor(width, height) {
    this.width       = width
    this.height      = height
    this.trust       = new Float32Array(width * height).fill(1.0)
    this.lastEventId = new Uint32Array(width * height)  // 0 = never hit
    this.front       = new Map()  // eventId → Set<idx>
  }

  idx(x, y)      { return y * this.width + x }
  inBounds(x, y) { return x >= 0 && x < this.width && y >= 0 && y < this.height }

  // 4-connected neighbors (up / down / left / right)
  neighbors(idx) {
    const x = idx % this.width, y = Math.floor(idx / this.width)
    const result = []
    for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nx = x + dx, ny = y + dy
      if (this.inBounds(nx, ny)) result.push(this.idx(nx, ny))
    }
    return result
  }
}
