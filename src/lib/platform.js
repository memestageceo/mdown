const platform =
  (typeof navigator !== 'undefined' &&
    (navigator.userAgentData?.platform || navigator.platform || '')) ||
  ''

export const isMac = /mac|iphone|ipad|ipod/i.test(platform)

export const ALT = isMac ? '⌥' : 'Alt+'
export const MOD = isMac ? '⌘' : 'Ctrl+'

export const KEYS = {
  cloze: `${ALT}C`,
  clozeSame: `${ALT}${isMac ? '⇧' : 'Shift+'}C`,
  paste: `${MOD}V`,
}
