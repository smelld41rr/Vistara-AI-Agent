import { Fragment, type ReactNode } from 'react';

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
    const link = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(part);
    if (link) return <a key={i} href={link[2]} target="_blank" rel="noreferrer noopener">{link[1]}</a>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** React text nodes only: model/page HTML is never inserted into the document. */
export function Markdown({ text }: { text: string }) {
  const sections = text.split(/(```[\s\S]*?(?:```|$))/g);
  return <div className="markdown">{sections.map((section, index) => {
    if (section.startsWith('```')) {
      const code = section.replace(/^```[^\n]*\n?/, '').replace(/```$/, '');
      return <pre key={index}><code>{code}</code></pre>;
    }
    return <Fragment key={index}>{section.split('\n').map((line, i) => {
      if (/^#{1,6} /.test(line)) return <h4 key={i}>{inline(line.replace(/^#{1,6} /, ''))}</h4>;
      if (/^[-*] /.test(line)) return <p className="markdown-bullet" key={i}><span aria-hidden="true">•</span>{inline(line.slice(2))}</p>;
      if (/^\d+\. /.test(line)) return <p key={i}>{inline(line)}</p>;
      return line ? <p key={i}>{inline(line)}</p> : <div className="paragraph-gap" key={i}/>;
    })}</Fragment>;
  })}</div>;
}
