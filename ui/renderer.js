// Precompute an RGB lookup table for 256 trust levels.
// Hue sweeps 0° → 240° (red → green → blue) via HSL(hue, 85%, 45%).
const COLOR_TABLE = (() => {
  const table = new Uint8Array(256 * 3)
  for (let i = 0; i < 256; i++) {
    const h = (i / 255) * (240 / 360)   // 0 → 2/3 in [0,1] hue space
    const s = 0.85, l = 0.45
    const a = s * Math.min(l, 1 - l)
    const f = n => {
      const k = (n + h * 12) % 12
      return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
    }
    table[i * 3]     = f(0)
    table[i * 3 + 1] = f(8)
    table[i * 3 + 2] = f(4)
  }
  return table
})()

export class Renderer {
  constructor(canvas, grid) {
    this.canvas    = canvas
    this.grid      = grid
    this.ctx       = canvas.getContext('2d')
    canvas.width   = grid.width
    canvas.height  = grid.height
    this.imageData = this.ctx.createImageData(grid.width, grid.height)
    this.buf       = this.imageData.data
  }

  render() {
    const { trust } = this.grid
    const buf = this.buf
    for (let i = 0; i < trust.length; i++) {
      const ci = Math.round(trust[i] * 255) * 3
      const p  = i * 4
      buf[p]   = COLOR_TABLE[ci]
      buf[p+1] = COLOR_TABLE[ci+1]
      buf[p+2] = COLOR_TABLE[ci+2]
      buf[p+3] = 255
    }
    this.ctx.putImageData(this.imageData, 0, 0)
  }
}
