import { QuizData } from '../types/quiz';

// ========================================
// FUNÇÕES DE PERSONALIZAÇÃO POR GÊNERO
// ========================================

export function getTitle(gender: string): string {
  return 'Por Qué Tu Ex Se Fue';
}

export function getLoadingMessage(gender: string): string {
  return 'Generando tu protocolo específico para reconquistar a tu ex...';
}

export function getCopy(quizData: QuizData): string {
  return `No fue por falta de amor.

Fue porque en algún momento dejaste de ser la persona que tu ex necesitaba.

Pero aquí está la verdad: eso puede cambiar.

Y en el siguiente paso, voy a revelar EXACTAMENTE qué fue lo que cambió y el paso a paso para que tu ex sienta que SÍ eres suficiente.`;
}

export function getVentana72Copy(gender: string): string {
  return `Aquí está lo crucial:

En cada una de estas 3 fases, hay acciones CORRECTAS e INCORRECTAS.

Si actúas correcto en cada fase, tu ex te busca.
Si actúas incorrecto, su cerebro borra la atracción.

Tu plan personalizado revela EXACTAMENTE qué hacer en cada fase.`;
}

export function getOfferTitle(gender: string): string {
  return 'Tu Plan de 21 Días para Reconquistar a Tu Ex';
}

export function getFeatures(gender: string): string[] {
  return [
    '📱 MÓDULO 1: Cómo Hablar Con Tu Ex (Días 1-7)',
    '👥 MÓDULO 2: Cómo Encontrarte Con Tu Ex (Días 8-14)',
    '❤️ MÓDULO 3: Cómo Reconquistar (Días 15-21)',
    '🚨 MÓDULO 4: Protocolo de Emergencia (Si tu ex está con otra persona)',
    '⚡ Guía especial: Las 3 Fases de 72 Horas',
    '🎯 Bonos: Scripts de conversación + Planes de acción',
    '✅ Garantía: 30 días o tu dinero de vuelta'
  ];
}

export function getCTA(gender: string): string {
  return 'SÍ, QUIERO MI PLAN PARA RECONQUISTAR A MI EX';
}

export function getCompletionBadge(gender: string): { title: string; subtitle: string } {
  return {
    title: '¡TU ANÁLISIS ESTÁ LISTO!',
    subtitle: 'Descubre exactamente por qué tu ex se fue y el paso a paso para que QUIERA volver'
  };
}

export function getFaseText(gender: string, fase: number): string {
  const fases: Record<number, string> = {
    1: 'Dopamina cae 67% → Tu ex siente "alivio"',
    2: 'Oxitocina se desconecta → Tu ex "olvida" los buenos momentos',
    3: 'Córtex prefrontal reescribe memorias → Tu ex te ve diferente'
  };
  
  return fases[fase] || '';
}