import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkCloze from '../remark/remarkCloze.js'
import { CodeBlock } from './CodeBlock.jsx'
import { InlineCode } from './InlineCode.jsx'
import { Cloze } from './Cloze.jsx'

const plugins = [remarkGfm, remarkCloze]

const components = {
  h1: (props) => <h1 className="mb-6.5 text-[clamp(36px,5vw,54px)] leading-[1.18] tracking-[-0.035em] text-ink-2" {...props} />,
  h2: (props) => <h2 className="mt-13 mb-3.25 text-[29px] leading-[1.18] text-ink-2" {...props} />,
  h3: (props) => <h3 className="mt-8.75 mb-2 text-[22px] leading-[1.18] text-ink-2" {...props} />,
  p: (props) => <p className="mb-5.5" {...props} />,
  ul: (props) => <ul className="mb-5.5 list-disc pl-5 marker:text-accent" {...props} />,
  ol: (props) => <ol className="mb-5.5 list-decimal pl-5 marker:text-accent" {...props} />,
  li: (props) => <li className="pl-[3px]" {...props} />,
  blockquote: (props) => <blockquote className="my-7.5 border-l-[3px] border-accent py-1.25 pl-5.5 text-muted-3" {...props} />,
  table: (props) => <table className="my-7 w-full border-collapse font-sans text-sm" {...props} />,
  th: (props) => <th className="border-b border-border bg-border-2 px-3 py-2.5 text-left" {...props} />,
  td: (props) => <td className="border-b border-border px-3 py-2.5 text-left" {...props} />,
  img: (props) => <img className="max-w-full rounded-[7px]" {...props} />,
  input: (props) => <input className="accent-accent" {...props} />,
  pre({ children }) {
    return <>{children}</>
  },
  span({ className, children, ...props }) {
    if (className?.includes('cloze')) {
      return (
        <Cloze number={props['data-cloze']} hint={props['data-hint']}>
          {children}
        </Cloze>
      )
    }
    return <span className={className} {...props}>{children}</span>
  },
  code({ className, children, node, ...props }) {
    const text = String(children).replace(/\n$/, '')
    const isBlock = node?.position?.start.line !== node?.position?.end.line
    if (isBlock) {
      const match = /language-(\w+)/.exec(className || '')
      return <CodeBlock code={text} lang={match?.[1]} />
    }
    return <InlineCode text={text} {...props}>{children}</InlineCode>
  },
  a({ href, children, ...props }) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="text-link underline decoration-1 underline-offset-[3px]" {...props}>
        {children}
      </a>
    )
  },
}

export function Preview({ markdown }) {
  return (
    <article className="mx-auto max-w-[720px] font-sans text-lg leading-[1.72] max-sm:text-[17px]">
      <ReactMarkdown remarkPlugins={plugins} components={components}>{markdown}</ReactMarkdown>
    </article>
  )
}
