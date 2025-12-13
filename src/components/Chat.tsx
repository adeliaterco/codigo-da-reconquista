import { useState, useEffect, useRef } from 'react';
import { tracking } from '../utils/tracking';
import { storage } from '../utils/storage';
import { playKeySound } from '../utils/animations';
import { QuizAnswer } from '../types/quiz';
import { getCompletionBadge } from '../utils/contentByGender';
import { ga4Tracking } from '../utils/ga4Tracking';

interface ChatProps {
  onNavigate: (page: string) => void;
}

interface Message {
  type: 'bot' | 'user';
  text: string;
  isTyping?: boolean;
}

interface Question {
  id: number;
  text: string;
  options: string[];
  response: string;
  dataKey: 'gender' | 'timeSeparation' | 'whoEnded' | 'relationshipDuration' | 'currentSituation' | 'exSituation' | 'commitmentLevel';
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'Para calibrar el análisis, necesito saber: ¿cuál es tu género?',
    options: ['HOMBRE', 'MUJER'],
    response: 'Entendido. Cada situación tiene patrones específicos que necesitamos identificar. Eso es exactamente lo que vamos a explorar en tu caso.',
    dataKey: 'gender',
  },
  {
    id: 2,
    text: 'Entendido. Ahora, ¿cuánto tiempo ha pasado desde que se separaron?',
    options: ['MENOS DE 1 SEMANA', '1-4 SEMANAS', '1-6 MESES', 'MÁS DE 6 MESES'],
    response: 'Registrado. Eso es crucial. Cuando la separación es reciente, hay una ventana donde tu ex aún piensa en ti constantemente. Después, los patrones cerebrales cambian. Vamos a aprovechar eso.',
    dataKey: 'timeSeparation',
  },
  {
    id: 3,
    text: 'Bien. ¿Y cómo fue la separación? ¿Quién tomó la iniciativa?',
    options: ['ÉL/ELLA TERMINÓ', 'YO TERMINÉ', 'DECISIÓN MUTUA'],
    response: 'Correcto. Aquí está lo importante: cuando la otra persona termina, significa que algo específico la hizo sentir que no eras suficiente. Pero aquí está la verdad: eso puede cambiar. Vamos a descubrir exactamente qué fue y cómo revertirlo.',
    dataKey: 'whoEnded',
  },
  {
    id: 4,
    text: 'Registrado. ¿Por cuánto tiempo estuvieron juntos?',
    options: ['MENOS DE 6 MESES', '6 MESES-1 AÑO', '1-3 AÑOS', 'MÁS DE 3 AÑOS'],
    response: 'Ok. Entiendo. El tiempo que estuvieron juntos define el nivel de conexión emocional. Cuanto más tiempo, más profunda la huella emocional. Y eso es exactamente lo que vamos a usar a tu favor.',
    dataKey: 'relationshipDuration',
  },
  {
    id: 5,
    text: '¿Cuál es tu situación actual con tu ex-pareja?',
    options: ['CONTACTO CERO', 'ME IGNORA', 'BLOQUEADO', 'SÓLO TEMAS NECESARIOS', 'HABLAMOS A VECES', 'SOMOS AMIGOS', 'ENCUENTROS ÍNTIMOS'],
    response: 'Analizando... Eso es información crucial. Tu situación actual define exactamente qué protocolo usar. No es lo mismo si hay contacto cero que si aún hay comunicación. Vamos a descubrir el paso a paso específico para tu caso.',
    dataKey: 'currentSituation',
  },
  {
    id: 6,
    text: 'Analizando... Ahora, una información crucial: ¿tu ex-pareja ya está con otra persona?',
    options: ['ESTÁ SOLTERO/A', 'NO ESTOY SEGURO/A', 'SALIENDO CASUAL', 'RELACIÓN SERIA', 'VARIAS PERSONAS'],
    response: 'Crucial. Entiendo. Eso cambia la estrategia, pero no imposibilita nada. Incluso si tu ex está con alguien, hay patrones psicológicos que funcionan. Vamos a descubrir cuáles aplican a tu situación.',
    dataKey: 'exSituation',
  },
  {
    id: 7,
    text: 'Última pregunta para finalizar el análisis: en una escala de 1 a 4, ¿cuánto quieres recuperar esta relación?',
    options: ['1 - NO ESTOY SEGURO/A', '2 - LO ESTOY CONSIDERANDO', '3 - LO QUIERO MUCHO', '4 - LO QUIERO CON TODA MI ALMA'],
    response: '¡Análisis completo! Perfecto. Tu nivel de compromiso define la intensidad del plan. Cuanto más quieras, más profundo será el protocolo. Y eso es exactamente lo que necesitas para la reconquista.',
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
    
    ga4Tracking.chatPageView();
    ga4Tracking.chatStarted();

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
    ga4Tracking.questionAnswered(question.id, question.text, option);

    const newProgress = ((currentQuestion + 1) / QUESTIONS.length) * 100;
    setProgress(newProgress);

    setTimeout(() => {
      setIsProcessing(false);

      const responseText = question.response;

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
          ga4Tracking.chatCompleted();
          
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
      }, responseText.length * 50);
    }, 1500);
  };

  const handleViewPlan = () => {
    tracking.ctaClicked('chat_complete');
    ga4Tracking.chatCTAClick();
    onNavigate('resultado');
  };

  const isComplete = progress === 100;
  const quizData = storage.getQuizData();

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
            <div 
              className="completion-badge" 
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '24px',
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(74, 222, 128, 0.1))',
                borderRadius: '16px',
                marginBottom: '16px',
                border: '2px solid rgba(234, 179, 8, 0.5)',
                boxShadow: '0 8px 24px rgba(234, 179, 8, 0.3)'
              }}
            >
              <div style={{
                fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                fontWeight: '900',
                color: 'rgb(250, 204, 21)',
                textAlign: 'center',
                lineHeight: '1.3'
              }}>
                {getCompletionBadge(quizData.gender || 'HOMBRE').title}
              </div>
              <div style={{
                fontSize: 'clamp(1rem, 4vw, 1.25rem)',
                color: 'white',
                lineHeight: '1.6',
                textAlign: 'center'
              }}>
                {getCompletionBadge(quizData.gender || 'HOMBRE').subtitle}
              </div>
            </div>
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