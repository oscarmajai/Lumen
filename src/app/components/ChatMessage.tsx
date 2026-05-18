import { User, Sparkles } from "lucide-react";
import CitationChip, { Citation } from "./CitationChip";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function parseThink(content: string): { think: string; answer: string; thinking: boolean } {
  const closed = content.match(/^<think>([\s\S]*?)<\/think>\s*/);
  if (closed) return { think: closed[1].trim(), answer: content.slice(closed[0].length), thinking: false };
  const open = content.match(/^<think>([\s\S]*)/);
  if (open) return { think: open[1], answer: '', thinking: true };
  return { think: '', answer: content, thinking: false };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MD: Record<string, React.ComponentType<any>> = {
  p:          ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong:     ({ children }) => <strong className="font-semibold">{children}</strong>,
  ul:         ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
  ol:         ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
  li:         ({ children }) => <li>{children}</li>,
  pre:        ({ children }) => <pre className="bg-slate-100 rounded-lg p-3 text-xs font-mono mb-2 overflow-x-auto whitespace-pre-wrap">{children}</pre>,
  code:       ({ children }) => <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-gray-300 pl-3 italic text-gray-500 mb-2">{children}</blockquote>,
  a:          ({ children, href }) => <a href={href} className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">{children}</a>,
};

interface Message {
  type: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  if (message.type === "user") {
    return (
      <div className="flex items-start gap-4 justify-end">
        <div className="max-w-2xl bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl px-6 py-4 shadow-md">
          <p className="text-white">{message.content}</p>
        </div>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-200 border-2 border-gray-300 flex-shrink-0">
          <User className="w-5 h-5 text-gray-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex-shrink-0 shadow-md">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm text-sm text-gray-900 leading-relaxed">
          {(() => {
            const { think, answer, thinking } = parseThink(message.content);
            return (
              <>
                {(think || thinking) && (
                  <details open={thinking} className="mb-3">
                    <summary className="text-xs font-semibold text-gray-400 cursor-pointer select-none hover:text-gray-500">
                      Razonamiento de Lumen
                    </summary>
                    <p className="text-xs text-gray-400 italic border-l-2 border-gray-100 pl-3 mt-2 leading-relaxed">
                      {think}
                    </p>
                  </details>
                )}
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>
                  {answer}
                </ReactMarkdown>
              </>
            );
          })()}
        </div>

        {message.citations && message.citations.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1">
            {message.citations
              .filter((cit, idx, arr) => arr.findIndex(c => c.document_name === cit.document_name) === idx)
              .map((citation, index) => (
              <CitationChip key={index} citation={citation} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}