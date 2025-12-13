import { useState, useEffect, useRef } from 'react';
import { tracking } from '../utils/tracking';
import { storage } from '../utils/storage';
import { playKeySound } from '../utils/animations';
import { QuizAnswer } from '../types/quiz';

interface ChatProps {
  onNavigate: (page: string) => void;
}

interface Message {
  type: 'bot' | 'user';
  text: string;
  isTyping?: boolean;
}

// ✅ MUDANÇA #1: Interface atualizada com responseByGender opcional
interface Question {
  id: number;
  text: string;
  options: string[];
  response: string;
  responseByGender?: {
    HOMBRE: string;
    MUJER: string;
  };
  dataKey: 'gender' | 'timeSeparation' | 'whoEnded' | 'relationshipDuration' | 'currentSituation' | 'exSituation' | 'commitmentLevel';
}

// ✅ MUDANÇA #2: Array de perguntas com respostas personalizadas por gênero
const QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'Para calibrar el análisis, necesito saber: ¿cuál es tu género?',
    options: ['HOMBRE', 'MUJER'],
    response: 'Entendido.',
    responseByGender: {
      HOMBRE: 'Entendido. Los hombres tienen un patrón específico después de una ruptura: buscan recuperar el control y la seguridad que perdieron. Eso es exactamente lo que vamos a explorar en tu caso.',
      MUJER: 'Entendido. Las mujeres tienen un patrón específico después de una ruptura: buscan entender qué salió mal y si hay esperanza de arreglarlo. Eso es exactamente lo que vamos a explorar en tu caso.'
    },
    dataKey: 'gender',
  },
  {
    id: 2,
    text: 'Entendido. Ahora, ¿cuánto tiempo ha pasado desde que se separaron?',
    options: ['MENOS DE 1 SEMANA', '1-4 SEMANAS', '1-6 MESES', 'MÁS DE 6 MESES'],
    response: 'Registrado.',
    responseByGender: {
      HOMBRE: 'Eso es crucial. Cuando la separación es reciente, hay una ventana donde ella aún piensa en ti constantemente. Después, los patrones cambian. Vamos a aprovechar eso.',
      MUJER: 'Eso es crucial. Cuando la separación es reciente, hay una ventana donde él aún siente la conexión contigo. Después, los patrones cambian. Vamos a aprovechar eso.'
    },
    dataKey: 'timeSeparation',
  },
  {
    id: 3,
    text: 'Bien. ¿Y cómo fue la separación? ¿Quién tomó la iniciativa?',
    options: ['ÉL/ELLA TERMINÓ', 'YO TERMINÉ', 'DECISIÓN MUTUA'],
    response: 'Correcto.',
    responseByGender: {
      HOMBRE: 'Aquí está lo importante: cuando ella termina, significa que algo específico la hizo sentir que no eras suficiente. Pero aquí está la verdad: eso puede cambiar. Vamos a descubrir exactamente qué fue y cómo revertirlo.',
      MUJER: 'Aquí está lo importante: cuando él termina, significa que algo específico lo hizo sentir que no eras lo que buscaba. Pero aquí está la verdad: eso puede cambiar. Vamos a descubrir exactamente qué fue y cómo revertirlo.'
    },
    dataKey: 'whoEnded',
  },
  {
    id: 4,
    text: 'Registrado. ¿Por cuánto tiempo estuvieron juntos?',
    options: ['MENOS DE 6 MESES', '6 MESES-1 AÑO', '1-3 AÑOS', 'MÁS DE 3 AÑOS'],
    response: 'Ok.',
    responseByGender: {
      HOMBRE: 'Entiendo. El tiempo que estuvieron juntos define el nivel de conexión emocional. Cuanto más tiempo, más profunda la huella. Y eso es exactamente lo que vamos a usar a tu favor.',
      MUJER: 'Entiendo. El tiempo que estuvieron juntos define el nivel de conexión emocional. Cuanto más tiempo, más profunda la huella. Y eso es exactamente lo que vamos a usar a tu favor.'
    },
    dataKey: 'relationshipDuration',
  },
  {
    id: 5,
    text: '¿Cuál es tu situación actual con tu ex-pareja?',
    options: ['CONTACTO CERO', 'ME IGNORA', 'BLOQUEADO', 'SÓLO TEMAS NECESARIOS', 'HABLAMOS A VECES', 'SOMOS AMIGOS', 'ENCUENTROS ÍNTIMOS'],
    response: 'Analizando...',
    responseByGender: {
      HOMBRE: 'Eso es información crucial. Tu situación actual define exactamente qué protocolo usar. No es lo mismo si ella te ignora que si aún hay contacto. Vamos a descubrir el paso a paso específico para tu caso.',
      MUJER: 'Eso es información crucial. Tu situación actual define exactamente qué protocolo usar. No es lo mismo si él te ignora que si aún hay contacto. Vamos a descubrir el paso a paso específico para tu caso.'
    },
    dataKey: 'currentSituation',
  },
  {
    id: 6,
    text: 'Analizando... Ahora, una información crucial: ¿tu ex-pareja ya está con otra persona?',
    options: ['ESTÁ SOLTERO/A', 'NO ESTOY SEGURO/A', 'SALIENDO CASUAL', 'RELACIÓN SERIA', 'VARIAS PERSONAS'],
    response: 'Crucial.',
    responseByGender: {
      HOMBRE: 'Entiendo. Eso cambia la estrategia, pero no imposibilita nada. Incluso si ella está con alguien, hay patrones psicológicos que funcionan. Vamos a descubrir cuáles aplican a tu situación.',
      MUJER: 'Entiendo. Eso cambia la estrategia, pero no imposibilita nada. Incluso si él está con alguien, hay patrones psicológicos que funcionan. Vamos a descubrir cuáles aplican a tu situación.'
    },
    dataKey: 'exSituation',
  },
  {
    id: 7,
    text: 'Última pregunta para finalizar el análisis: en una escala de 1 a 4, ¿cuánto quieres recuperar esta relación?',
    options: ['1 - NO ESTOY SEGURO/A', '2 - LO ESTOY CONSIDERANDO', '3 - LO QUIERO MUCHO', '4 - LO QUIERO CON TODA MI ALMA'],
    response: '¡Análisis completo!',
    responseByGender: {
      HOMBRE: 'Perfecto. Tu nivel de compromiso define la intensidad del plan. Cuanto más quieras, más profundo será el protocolo. Y eso es exactamente lo que necesitas para reconquistarla.',
      MUJER: 'Perfecto. Tu nivel de compromiso define la intensidad del plan. Cuanto más quieras, más profundo será el protocolo. Y eso es exactamente lo que necesitas para reconquistarlo.'
    },
    dataKey: 'commitmentLevel',
  },
];

export default function Chat({ onNavigate }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    tracking.pageView('chat');
    tracking.chatStarted();

    const initialMessage: Message = {
      type: 'bot',
      text: 'Hola. Soy Ricardo Abreu, especialista en reconquista mediante psicología conductual. Mi sistema detectó tu búsqueda de respuestas. Estoy aquí para analizar tu caso.',
      isTyping: true,
    };

    setMessages([initialMessage]);

    typewriterTimeoutRef.current = setTimeout(() => {
      setMessages([{ ...initialMessage, isTyping: false }]);
      setTimeout(() => setShowOptions(true), 300);
    }, initialMessage.text.length * 50);

    return () => {
      if (typewriterTimeoutRef.current) clearTimeout(typewriterTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartAnalysis = () => {
    playKeySound();
    setShowOptions(false);
    setCurrentQuestion(0);
    askQuestion(0);
  };

  const askQuestion = (questionIndex: number) => {
    const question = QUESTIONS[questionIndex];
    const newMessage: Message = {
      type: 'bot',
      text: question.text,
      isTyping: true,
    };

    setMessages(prev => [...prev, newMessage]);

    typewriterTimeoutRef.current = setTimeout(() => {
      setMessages(prev => prev.map((msg, idx) => idx === prev.length - 1 ? { ...msg, isTyping: false } : msg));
      setTimeout(() => setShowOptions(true), 300);
    }, question.text.length * 50);
  };

  // ✅ MUDANÇA #3: Função handleAnswer com lógica de personalização por gênero
  const handleAnswer = (option: string) => {
    playKeySound();
    const question = QUESTIONS[currentQuestion];

    setMessages(prev => [...prev, { type: 'user', text: option }]);
    setShowOptions(false);
    setIsProcessing(true);

    const answer: QuizAnswer = {
      questionId: question.id,
      question: question.text,
      answer: option,
    };

    const quizData = storage.getQuizData();
    quizData.answers.push(answer);
    quizData[question.dataKey] = option;
    storage.saveQuizData(quizData);

    tracking.questionAnswered(question.id, option);

    const newProgress = ((currentQuestion + 1) / QUESTIONS.length) * 100;
    setProgress(newProgress);

    setTimeout(() => {
      setIsProcessing(false);

      // ✅ NOVA LÓGICA: Seleciona resposta personalizada por gênero ou usa resposta padrão
      let responseText = question.response; // Fallback padrão
      
      if (question.responseByGender && quizData.gender) {
        // Se existe resposta por gênero E o gênero já foi definido
        const gender = quizData.gender as 'HOMBRE' | 'MUJER';
        responseText = question.responseByGender[gender] || question.response;
      }

      const responseMessage: Message = {
        type: 'bot',
        text: responseText,
        isTyping: true,
      };

      setMessages(prev => [...prev, responseMessage]);

      typewriterTimeoutRef.current = setTimeout(() => {
        setMessages(prev => prev.map((msg, idx) => idx === prev.length - 1 ? { ...msg, isTyping: false } : msg));

        if (currentQuestion < QUESTIONS.length - 1) {
          setTimeout(() => {
            setCurrentQuestion(currentQuestion + 1);
            askQuestion(currentQuestion + 1);
          }, 800);
        } else {
          tracking.chatCompleted();
          setTimeout(() => {
            const finalMessage: Message = {
              type: 'bot',
              text: 'Análisis concluido. Tu plan personalizado está listo para ser revelado. Haz clic abajo para accederlo.',
              isTyping: true,
            };
            setMessages(prev => [...prev, finalMessage]);

            typewriterTimeoutRef.current = setTimeout(() => {
              setMessages(prev => prev.map((msg, idx) => idx === prev.length - 1 ? { ...msg, isTyping: false } : msg));
              setTimeout(() => setShowOptions(true), 300);
            }, finalMessage.text.length * 50);
          }, 1000);
        }
      }, responseText.length * 50); // ✅ Usa responseText (que pode ser mais longo agora)
    }, 1500);
  };

  const handleViewPlan = () => {
    tracking.ctaClicked('chat_complete');
    onNavigate('resultado');
  };

  const isComplete = progress === 100;

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="progress-text">ANÁLISIS: {Math.round(progress)}%</p>
        {isProcessing && <p className="processing-text">ANALIZANDO DATOS...</p>}
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.type}`}>
            {msg.type === 'bot' && (
              <div className="avatar-small">RA</div>
            )}
            <div className="message-bubble">
              {msg.isTyping ? (
                <TypewriterText text={msg.text} />
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="processing-indicator">
            <div className="spinner"></div>
          </div>
        )}

        {showOptions && currentQuestion === -1 && (
          <div className="options-container">
            <button className="option-button" onClick={handleStartAnalysis}>
              EMPEZAR ANÁLISIS
            </button>
          </div>
        )}

        {showOptions && currentQuestion >= 0 && currentQuestion < QUESTIONS.length && !isComplete && (
          <div className="options-container">
            {QUESTIONS[currentQuestion].options.map((option, idx) => (
              <button key={idx} className="option-button" onClick={() => handleAnswer(option)}>
                {option}
              </button>
            ))}
          </div>
        )}

        {showOptions && isComplete && (
          <div className="options-container">
            <div className="completion-badge">¡PLAN DESBLOQUEADO!</div>
            <button className="option-button cta-final" onClick={handleViewPlan}>
              VER MI PLAN PERSONALIZADO
            </button>
            <p className="completion-count">+12.847 planes revelados</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

function TypewriterText({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 50);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  return <span>{displayText}<span className="cursor">▋</span></span>;
}