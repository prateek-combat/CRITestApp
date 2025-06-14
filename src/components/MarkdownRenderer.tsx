import React from 'react';
import DOMPurify from 'isomorphic-dompurify';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  // Check if content looks like HTML (contains HTML tags)
  const isHTML = /<[^>]*>/g.test(content);

  if (isHTML) {
    // Sanitize HTML content for security
    const sanitizedHTML = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'br',
        'div',
        'span',
        'strong',
        'b',
        'em',
        'i',
        'u',
        'ul',
        'ol',
        'li',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'pre',
        'code',
        'blockquote',
        'a',
      ],
      ALLOWED_ATTR: ['class', 'href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
    });

    return (
      <div
        className={`html-content ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
      />
    );
  }

  // Fallback: Simple markdown-like rendering for plain text
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentCodeBlock = '';
    let inCodeBlock = false;
    let codeLanguage = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre
              key={i}
              className="mb-4 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              <code className={`language-${codeLanguage}`}>
                {currentCodeBlock}
              </code>
            </pre>
          );
          currentCodeBlock = '';
          inCodeBlock = false;
          codeLanguage = '';
        } else {
          codeLanguage = line.substring(3).trim();
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        currentCodeBlock += line + '\n';
        continue;
      }

      // Handle headers
      if (line.startsWith('# ')) {
        elements.push(
          <h1
            key={i}
            className="mb-4 border-b border-gray-200 pb-2 text-2xl font-bold text-gray-900"
          >
            {line.substring(2)}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2
            key={i}
            className="mb-3 border-b border-gray-200 pb-1 text-xl font-semibold text-gray-900"
          >
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="mb-2 text-lg font-medium text-gray-900">
            {line.substring(4)}
          </h3>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <div key={i} className="mb-1 pl-4">
            <span className="text-gray-600">•</span> {line.substring(2)}
          </div>
        );
      } else if (line.trim() === '') {
        elements.push(<br key={i} />);
      } else {
        let processedLine = line;
        processedLine = processedLine.replace(
          /\*\*(.*?)\*\*/g,
          '<strong>$1</strong>'
        );
        processedLine = processedLine.replace(
          /`([^`]+)`/g,
          '<code class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-gray-800">$1</code>'
        );

        elements.push(
          <p
            key={i}
            className="mb-3 leading-relaxed text-gray-800"
            dangerouslySetInnerHTML={{ __html: processedLine }}
          />
        );
      }
    }

    return elements;
  };

  return (
    <div className={`content-renderer ${className}`}>
      {renderMarkdown(content)}
    </div>
  );
};

export default MarkdownRenderer;
