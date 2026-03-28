import { FileText, Clock, Sparkles, BookOpen, Settings, Shield } from "lucide-react";
import { Button } from "./ui/button";

interface WelcomeScreenProps {
  onExampleClick: (query: string) => void;
}

const exampleQueries = [
  {
    icon: Settings,
    text: "¿Cuál es la tolerancia máxima de presión de la válvula modelo T-500?",
    category: "Técnico",
    color: "blue",
  },
  {
    icon: Clock,
    text: "¿Cuántos días de vacaciones me corresponden con 5 años de antigüedad?",
    category: "RRHH",
    color: "emerald",
  },
  {
    icon: FileText,
    text: "¿Qué documentos necesito para solicitar un reembolso de gastos?",
    category: "Finanzas",
    color: "violet",
  },
  {
    icon: Shield,
    text: "¿Cuál es el protocolo de seguridad para manejo de materiales peligrosos?",
    category: "Seguridad",
    color: "amber",
  },
];

export default function WelcomeScreen({ onExampleClick }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-4xl w-full space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4 shadow-lg">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900">
            ¿Qué necesitas saber hoy?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Pregunta cualquier cosa sobre los documentos corporativos. Lumen
            encontrará la respuesta exacta en segundos.
          </p>
        </div>

        {/* Example Queries */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 text-center">
            Prueba con estas preguntas de ejemplo:
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {exampleQueries.map((example, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => onExampleClick(example.text)}
                className="h-auto p-5 bg-white border-gray-200 hover:bg-gray-50 hover:border-cyan-300 hover:shadow-md text-left justify-start group transition-all"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-${example.color}-500 to-${example.color}-600 flex-shrink-0 shadow-sm`}>
                    <example.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-xs text-cyan-600 mb-1.5 font-semibold uppercase tracking-wide">
                      {example.category}
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {example.text}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}