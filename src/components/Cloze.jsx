// A cloze deletion as it appears in the preview: the answer stays readable, with
// its card number in a superscript badge, so Adi can see the grouping at a glance.
export function Cloze({ number, hint, children }) {
  return (
    <span
      className="relative rounded-[4px] bg-cloze-bg px-[3px] pr-[5px] text-cloze-text decoration-cloze-rule decoration-dotted underline-offset-[3px] [text-decoration-line:underline]"
      title={hint ? `Cloze ${number} — hint: ${hint}` : `Cloze ${number}`}
    >
      {children}
      <sup className="ml-[2px] font-sans text-[0.62em] font-bold text-cloze-badge select-none">
        c{number}
      </sup>
    </span>
  )
}
