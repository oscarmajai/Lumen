import { useState } from "react";
import { FileText } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export interface Citation {
  document_name: string;
  file_type: string;
  content: string;
  score: number | null;
  dataset_name: string | null;
}

const FILE_ICON_COLORS: Record<string, string> = {
  pdf:  "text-red-400",
  docx: "text-blue-400",
  doc:  "text-blue-400",
  txt:  "text-gray-400",
  xlsx: "text-green-400",
  xls:  "text-green-400",
  csv:  "text-green-400",
};

function truncate(str: string, max: number) {
  return str.length <= max ? str : str.slice(0, max - 1) + "…";
}

interface CitationChipProps {
  citation: Citation;
  index: number;
}

export default function CitationChip({ citation, index }: CitationChipProps) {
  const [open, setOpen] = useState(false);
  const iconColor = FILE_ICON_COLORS[citation.file_type] ?? "text-gray-400";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-all text-xs text-gray-600 hover:text-blue-700 shadow-sm cursor-pointer"
        >
          <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${iconColor}`} />
          <span className="font-medium">{truncate(citation.document_name, 22)}</span>
          <span className="text-gray-400 font-semibold text-[10px]">{index + 1}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="w-80 p-0 border-0 shadow-2xl rounded-xl overflow-hidden bg-gray-900 text-white"
      >
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
          <FileText className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
          <span className="text-sm font-semibold truncate flex-1">{citation.document_name}</span>
          {citation.score != null && (
            <span className="text-[10px] text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full font-mono flex-shrink-0">
              {Math.round(citation.score * 100)}%
            </span>
          )}
        </div>
        <div className="px-4 py-3 max-h-48 overflow-y-auto">
          <p className="text-xs text-gray-300 leading-relaxed italic">
            "{citation.content}"
          </p>
        </div>
        {citation.dataset_name && (
          <div className="px-4 py-2 border-t border-gray-700 bg-gray-800/60">
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">
              {citation.dataset_name}
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
