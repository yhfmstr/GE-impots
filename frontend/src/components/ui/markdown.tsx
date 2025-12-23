import * as React from "react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import DOMPurify from 'dompurify'

interface MarkdownProps {
  children: string | null | undefined
  className?: string
}

interface ChatMarkdownProps {
  children: string | null | undefined
  variant?: 'assistant' | 'user'
}

/**
 * Markdown renderer component with security sanitization
 * Renders markdown content safely with proper styling
 */
export function Markdown({ children, className = '' }: MarkdownProps) {
  if (!children) return null

  // Sanitize input before rendering (remove any script tags, etc.)
  const sanitized = DOMPurify.sanitize(children, {
    ALLOWED_TAGS: [], // Strip HTML, keep only text (markdown will handle formatting)
    ALLOWED_ATTR: []
  })

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mt-3 mb-2 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mt-3 mb-2 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold mt-2 mb-1 first:mt-0">{children}</h3>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          // Strong/Bold
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          // Emphasis/Italic
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          // Code
          code: ({ className, children, ...props }) => {
            const isInline = !className
            return isInline ? (
              <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                {children}
              </code>
            ) : (
              <code className="block bg-gray-200 dark:bg-gray-700 p-2 rounded text-xs font-mono overflow-x-auto" {...props}>
                {children}
              </code>
            )
          },
          // Pre (code blocks)
          pre: ({ children }) => (
            <pre className="bg-gray-200 dark:bg-gray-700 p-2 rounded text-xs overflow-x-auto mb-2">
              {children}
            </pre>
          ),
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {children}
            </a>
          ),
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-3 italic text-gray-600 my-2">
              {children}
            </blockquote>
          ),
          // Horizontal rule
          hr: () => <hr className="my-3 border-gray-300" />,
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 px-2 py-1 bg-gray-100 font-semibold text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-2 py-1">{children}</td>
          ),
        }}
      >
        {sanitized}
      </ReactMarkdown>
    </div>
  )
}

/**
 * Inline markdown renderer for chat bubbles
 * Has lighter styling to fit within chat messages
 */
export function ChatMarkdown({ children, variant = 'assistant' }: ChatMarkdownProps) {
  const isUser = variant === 'user'

  return (
    <Markdown
      className={`
        text-sm
        ${isUser ? 'prose-invert' : ''}
        prose-p:mb-1.5 prose-p:last:mb-0
        prose-headings:mt-2 prose-headings:first:mt-0
        prose-ul:mb-1.5 prose-ol:mb-1.5
        prose-li:my-0
        ${isUser ? 'prose-strong:text-white prose-em:text-white/90' : 'prose-strong:text-gray-900'}
        ${isUser ? '[&_code]:bg-white/20' : ''}
      `}
    >
      {children}
    </Markdown>
  )
}
