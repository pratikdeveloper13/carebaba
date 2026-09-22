// Generates simple, dependency-free PNG app icons (teal square + white medical cross)
// for the PWA manifest and Apple touch icon. Pure Node.js (zlib) PNG encoder — no
// image libraries required. Run with: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

/**
 * Draws a rounded teal square with a centered white "+" (medical cross).
 * @param {number} size
 * @param {boolean} opaque - if true, fills full bleed (no rounded corners) for iOS.
 */
function drawIcon(size, opaque) {
  const pixels = Buffer.alloc(size * size * 4)
  const bg = [15, 118, 110] // teal-700
  const fg = [255, 255, 255]
  const radius = opaque ? 0 : Math.round(size * 0.18)
  const armThickness = size * 0.16
  const armLength = size * 0.56
  const cx = size / 2
  const cy = size / 2

  const inRoundedSquare = (x, y) => {
    if (radius === 0) return true
    const nx = Math.max(radius - x, x - (size - radius), 0)
    const ny = Math.max(radius - y, y - (size - radius), 0)
    if (nx > 0 && ny > 0) return nx * nx + ny * ny <= radius * radius
    return true
  }

  const inCross = (x, y) => {
    const dx = Math.abs(x - cx)
    const dy = Math.abs(y - cy)
    const vertical = dx <= armThickness / 2 && dy <= armLength / 2
    const horizontal = dy <= armThickness / 2 && dx <= armLength / 2
    return vertical || horizontal
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      const insideSquare = inRoundedSquare(x + 0.5, y + 0.5)
      const color = inCross(x + 0.5, y + 0.5) ? fg : bg
      pixels[idx] = color[0]
      pixels[idx + 1] = color[1]
      pixels[idx + 2] = color[2]
      pixels[idx + 3] = insideSquare ? 255 : 0
    }
  }

  // Build raw scanlines with filter-type 0 (None) prefix per row.
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1)
    raw[rowStart] = 0
    pixels.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const idat = deflateSync(raw)

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon-192.png', drawIcon(192, false))
writeFileSync('public/icons/icon-512.png', drawIcon(512, false))
writeFileSync('public/icons/apple-touch-icon.png', drawIcon(180, true))

console.log('Generated public/icons/icon-192.png, icon-512.png, apple-touch-icon.png')
