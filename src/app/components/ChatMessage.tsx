import { User, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";

interface Source {
  document: string;
  page: number;
  snippet: string;
}

interface Message {
  type: "user" | "assistant";
  content: string;
  sources?: Source[];
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
      <div className="flex-1 space-y-4">
        <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm">
          <p className="text-gray-900 leading-relaxed">{message.content}</p>
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
              <span className="text-xs text-cyan-600 font-semibold uppercase tracking-wide">
                Fuentes Verificadas
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
            </div>

            <div className="grid gap-2">
              {message.sources.map((source, index) => (
                <button
                  key={index}
                  className="h-auto p-4 bg-white border border-gray-200 hover:bg-gray-50 hover:border-cyan-300 hover:shadow-md text-left rounded-xl transition-all group"
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex-shrink-0 shadow-sm">
                      <ExternalLink className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-cyan-600 transition-colors">
                          {source.document}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md font-medium">
                          Pág. {source.page}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 italic leading-relaxed">
                        "{source.snippet}"
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}