// One-off script to rasterize public/favicon.svg into the PWA icon sizes.
// Re-run with `node scripts/generate-icons.mjs` whenever favicon.svg changes.
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const svgBuffer = readFileSync(resolve('public/favicon.svg'))
const INK = { r: 0x20, g: 0x21, b: 0x1e, alpha: 1 }

async function renderIcon(size, outPath) {
  await sharp(svgBuffer, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outPath)
}

async function renderMaskable(size, outPath) {
  const artSize = Math.round(size * 0.6)
  const art = await sharp(svgBuffer, { density: 384 })
    .resize(artSize, artSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: INK } })
    .composite([{ input: art, gravity: 'center' }])
    .png()
    .toFile(outPath)
}

await renderIcon(192, 'public/pwa-192x192.png')
await renderIcon(512, 'public/pwa-512x512.png')
await renderMaskable(512, 'public/maskable-icon-512x512.png')

console.log('Generated public/pwa-192x192.png, public/pwa-512x512.png, public/maskable-icon-512x512.png')
