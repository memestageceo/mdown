export function downloadText(fileName, text, mimeType = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type: `${mimeType};charset=utf-8` }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // Give the browser a tick to start the download before dropping the blob.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
