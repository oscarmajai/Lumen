import { User, Sparkles } from "lucide-react";
import CitationChip, { Citation } from "./CitationChip";

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
        <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm">
          <p className="text-gray-900 leading-relaxed">{message.content}</p>
        </div>

        {message.citations && message.citations.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1">
            {message.citations.map((citation, index) => (
              <CitationChip key={index} citation={citation} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}