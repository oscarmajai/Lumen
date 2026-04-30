import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Settings,
  Upload,
  FileText,
  Paperclip,
  Send,
  ExternalLink,
  FileCheck,
  AlertTriangle,
  FileDown,
  Plus,
  Sparkles,
  MessageSquare,
  User,
  Search,
  Clock,
} from "lucide-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../components/ui/resizable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

// Types for API integration
interface Document {
  id: string;
  name: string;
}

interface Citation {
  title: string;
  subtitle: string;
  documentId?: string;
  pageNumber?: number;
}

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  citation?: Citation;
}

interface KnowledgeGap {
  coverage: number;
  indexed: number;
  gaps: number;
}

interface ChatHistory {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

interface FrequentTopic {
  topic: string;
  queries: number;
  coverage: "high" | "medium" | "low";
}

const KNOWLEDGE_AREAS = [
  "RRHH",
  "Finanzas",
  "Técnico",
  "Calidad",
  "Seguridad",
  "Operaciones",
  "Legal",
  "Comercial",
] as const;

export default function MainDashboard() {
  const navigate = useNavigate();
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Panel visibility states
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsLoading(true);

      setIsLoading(false);
  };

  const handleGenerateDeliverable = async (type: string) => {
  };

    return (
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900">LUMEN</h1>
              </div>

              <div className="flex items-center gap-6">
                  <Button
                    variant="ghost"
                    className="text-gray-900 font-semibold border-b-2 border-blue-600 rounded-none px-4"
                  >
                    Dashboard
                  </Button>
                </nav>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    onClick={() => navigate("/settings")}
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - 3 Resizable Columns */}
                <>
                  </div>

                            Cargar Archivos
                          </p>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.docx,.xlsx,.doc,.xls"
                          className="hidden"
                        />
                      </label>

                        </h3>
                          <div className="text-center py-8">
                          </div>
                        ) : (
                              <div
                                key={doc.id}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {doc.name}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
              )}

                  {/* Chat Header */}
                  </div>

                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                      </div>
                        Bienvenido a LUMEN
                      </h3>
                      </p>
                        </p>
                        <p className="text-xs text-gray-600">
                        </p>
                        <p className="text-xs text-gray-600">
                          • Resume el manual de operaciones
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                    {messages.map((message) => (
                      <div key={message.id}>
                        {message.type === "assistant" ? (
                            </div>
                                  {message.content}
                                </p>
                              </div>
                              {message.citation && (
                                      {message.citation.title}
                                    </p>
                                      {message.citation.subtitle}
                                    </p>
                                  </div>
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                              <p className="text-sm text-gray-900">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                        </div>
                            <div
                              style={{ animationDelay: "0.2s" }}
                            />
                            <div
                              style={{ animationDelay: "0.4s" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Input */}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-gray-50 border-gray-200"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!chatInput.trim() || isLoading}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                  </form>
                    POWERED BY INNOVATEC RAG-ENGINE V2.4
                  </p>
                </div>
            </div>

                
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                      >
                      </Button>
                    </div>

                    <div className="space-y-4">
                        </h3>
                          </div>
                                    </div>
                                  </div>
                                    </div>
                                  </div>
                                    </div>
                                </div>
                          </div>
                      </div>
                    </div>
                </div>
                          </p>
                          <p className="text-xs text-gray-600">
                          </p>
                        </div>
                              </div>
                              <div className="flex-1">
                                  </p>
                                </div>
                                    <div className="flex-1">
                                      </p>
                                      <p className="text-xs text-gray-600">
                                      </p>
                                    </div>
                                  </button>
                              </div>
                            </div>
                                </p>
                              </div>
                            </div>
                      )}

                    <Button
                      size="icon"
                    >
                    </Button>
                      </div>
          </ResizablePanelGroup>
        </main>
      </div>
  );
}