import { useState, useEffect, useRef } from 'react';
import { tracking } from '../utils/tracking';
import { storage } from '../utils/storage';
import { playKeySound, getHotmartUrl } from '../utils/animations';
import { QuizAnswer } from '../types/quiz';

interface ResultProps {
  onNavigate: (page: string) => void;
}

export default function Result({ onNavigate }: ResultProps) {
  const [revelation1, setRevelation1] = useState(false);
  const [revelation2, setRevelation2] = useState(false);
  const [revelation3, setRevelation3] = useState(false);
  const [revelation4, setRevelation4] = useState(false);
  const [timeLeft, setTimeLeft] = useState(47 * 60);
  const [spotsLeft, setSpotsLeft] = useState(storage.getSpotsLeft());
  const quizData = storage.getQuizData();
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tracking.pageView('resultado');

    const timer1 = setTimeout(() => {
      setRevelation1(true);
      tracking.revelationViewed('why_left');
    }, 0);

    const timer2 = setTimeout(() => {
      setRevelation2(true);
      tracking.revelationViewed('72h_window');
    }, 6000);

    const timer3 = setTimeout(() => {
      setRevelation3(true);
      tracking.revelationViewed('vsl');
      tracking.vslEvent('started');
    }, 9000);

    const timer4 = setTimeout(() => {
      setRevelation4(true);
      tracking.revelationViewed('offer');
    }, 12000);

    const countdownInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          tracking.countdownExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const spotsInterval = setInterval(() => {
      setSpotsLeft(prev => {
        if (prev > 15) {
          const newSpots = prev - 1;
          storage.setSpotsLeft(newSpots);
          return newSpots;
        }
        return prev;
      });
    }, 45000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearInterval(countdownInterval);
      clearInterval(spotsInterval);
    };
  }, []);

  // ✅ Integração do vídeo VTurb
  useEffect(() => {
    if (!revelation2 || !videoContainerRef.current) return;

    const timer = setTimeout(() => {
      if (videoContainerRef.current) {
        videoContainerRef.current.innerHTML = `
          <div style="position: relative; width: 100%; padding-bottom: 56.25%; background: #000; border-radius: 8px; overflow: hidden;">
            <vturb-smartplayer 
              id="vid-6938c3eeb96ec714286a4c2b" 
              style="display: block; margin: 0 auto; width: 100%; height: 100%; position: absolute; top: 0; left: 0;"
            ></vturb-smartplayer>
          </div>
        `;

        const existingScript = document.querySelector('script[src="https://scripts.converteai.net/ea3c2dc1-1976-40a2-b0fb-c5055f82bfaf/players/6938c3eeb96ec714286a4c2b/v4/player.js"]');
        
        if (!existingScript) {
          const s = document.createElement("script");
          s.src = "https://scripts.converteai.net/ea3c2dc1-1976-40a2-b0fb-c5055f82bfaf/players/6938c3eeb96ec714286a4c2b/v4/player.js";
          s.async = true;
          
          s.onload = () => {
            console.log("✅ Script VTurb carregado com sucesso!");
          };
          
          s.onerror = () => {
            console.error("❌ Erro ao carregar script VTurb");
            if (videoContainerRef.current) {
              videoContainerRef.current.innerHTML = `
                <div style="background: #333; color: white; padding: 20px; text-align: center; border-radius: 8px;">
                  <p>Erro ao carregar vídeo. Tente recarregar a página.</p>
                  <button onclick="location.reload()" style="background: #ffc107; color: black; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                    Recarregar
                  </button>
                </div>
              `;
            }
          };
          
          document.head.appendChild(s);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [revelation2]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCTAClick = () => {
    tracking.ctaClicked('result_buy');
    window.open(getHotmartUrl(), '_blank');
  };

  const getPersonalizedText = () => {
    const gender = quizData.gender === 'HOMBRE' ? 'conquistarla' : 'conquistarlo';
    const time = quizData.timeSeparation || 'hace poco';

    return `No fue por falta de amor, sino por haber dejado de ser quien ${gender}. Basado en tu tiempo de separación (${time}), evita errores comunes post-ruptura como suplicar o entrar mal en la friendzone.`;
  };

  return (
    <div className="result-container">
      <div className="result-header">
        <h1 className="result-title">Tu Plan Personalizado Está Listo</h1>
        <div className="urgency-bar">
          <span className="urgency-icon">⚠</span>
          <span className="urgency-text">Tiempo para acceder: {formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="revelations-container">
        {/* ========================================
            REVELACIÓN 1: VERSÃO MINIMALISTA
            ======================================== */}
        {revelation1 && (
          <div className="revelation fade-in">
            <div className="revelation-header">
              <div className="revelation-icon">💔</div>
              <h2>Por Qué Te Dejó</h2>
            </div>
            <p className="revelation-text">{getPersonalizedText()}</p>

            {/* ✅ VERSÃO MINIMALISTA - LIMPA E DIRETA */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
              border: '2px solid rgb(239, 68, 68)',
              borderRadius: '16px',
              padding: '32px 24px',
              marginTop: '32px',
              boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)'
            }}>
              
              {/* Título Principal */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '12px'
                }}>⚡</div>
                <h2 style={{ 
                  fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', 
                  fontWeight: '900',
                  color: 'white',
                  marginBottom: '12px',
                  lineHeight: '1.2'
                }}>
                  LA VENTANA DE 72 HORAS
                </h2>
                <p style={{
                  color: 'rgb(252, 165, 165)',
                  fontSize: 'clamp(1rem, 3vw, 1.25rem)',
                  fontWeight: '600'
                }}>
                  El secreto que los neurocientíficos descubrieron
                </p>
              </div>

              {/* Texto Principal Enxuto */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '28px',
                backdropFilter: 'blur(10px)'
              }}>
                <p style={{ 
                  color: 'white', 
                  fontSize: 'clamp(1.125rem, 3.5vw, 1.375rem)', 
                  lineHeight: '1.6',
                  textAlign: 'center',
                  margin: 0
                }}>
                  Después de una ruptura, el cerebro de tu ex pasa por <strong style={{ color: 'rgb(250, 204, 21)' }}>3 fases químicas</strong> en 72 horas.
                  <br /><br />
                  Si actúas <strong style={{ color: 'rgb(74, 222, 128)' }}>CORRECTO</strong>, ella te busca.
                  <br />
                  Si actúas <strong style={{ color: 'rgb(248, 113, 113)' }}>INCORRECTO</strong>, su cerebro borra la atracción.
                </p>
              </div>

              {/* 3 Fases - Cards Minimalistas */}
              <div style={{
                display: 'grid',
                gap: '16px',
                marginBottom: '28px'
              }}>
                {/* Fase 1 */}
                <div style={{
                  background: 'rgba(234, 179, 8, 0.15)',
                  border: '2px solid rgb(234, 179, 8)',
                  borderRadius: '12px',
                  padding: '20px',
                  transition: 'transform 0.2s'
                }}>
                  <div style={{ 
                    color: 'rgb(250, 204, 21)', 
                    fontWeight: '900',
                    fontSize: 'clamp(1rem, 3vw, 1.125rem)',
                    marginBottom: '8px'
                  }}>
                    FASE 1 (0-24h)
                  </div>
                  <div style={{ 
                    color: 'white',
                    fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                    lineHeight: '1.5'
                  }}>
                    Dopamina cae 67% → Ella siente "alivio"
                  </div>
                </div>

                {/* Fase 2 */}
                <div style={{
                  background: 'rgba(234, 179, 8, 0.15)',
                  border: '2px solid rgb(234, 179, 8)',
                  borderRadius: '12px',
                  padding: '20px',
                  transition: 'transform 0.2s'
                }}>
                  <div style={{ 
                    color: 'rgb(250, 204, 21)', 
                    fontWeight: '900',
                    fontSize: 'clamp(1rem, 3vw, 1.125rem)',
                    marginBottom: '8px'
                  }}>
                    FASE 2 (24-48h)
                  </div>
                  <div style={{ 
                    color: 'white',
                    fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                    lineHeight: '1.5'
                  }}>
                    Oxitocina se desconecta → Ella "olvida" los buenos momentos
                  </div>
                </div>

                {/* Fase 3 */}
                <div style={{
                  background: 'rgba(234, 179, 8, 0.15)',
                  border: '2px solid rgb(234, 179, 8)',
                  borderRadius: '12px',
                  padding: '20px',
                  transition: 'transform 0.2s'
                }}>
                  <div style={{ 
                    color: 'rgb(250, 204, 21)', 
                    fontWeight: '900',
                    fontSize: 'clamp(1rem, 3vw, 1.125rem)',
                    marginBottom: '8px'
                  }}>
                    FASE 3 (48-72h)
                  </div>
                  <div style={{ 
                    color: 'white',
                    fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                    lineHeight: '1.5'
                  }}>
                    Córtex prefrontal reescribe memorias → Ella te ve diferente
                  </div>
                </div>
              </div>

              {/* CTA da Seção */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '2px solid rgb(248, 113, 113)',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center'
              }}>
                <p style={{ 
                  color: 'white', 
                  fontSize: 'clamp(1.125rem, 3.5vw, 1.5rem)', 
                  fontWeight: '900',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  ¿Sabes qué hacer en cada fase?
                </p>
                <p style={{
                  color: 'rgb(252, 165, 165)',
                  fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                  marginTop: '12px',
                  marginBottom: 0
                }}>
                  El video abajo revela todo el protocolo paso a paso
                </p>
              </div>

            </div>
          </div>
        )}

        {/* ========================================
            REVELACIÓN 2: VSL COM VÍDEO VTURB
            ======================================== */}
        {revelation2 && (
          <div className="revelation fade-in vsl-revelation">
            <div className="revelation-header">
              <div className="revelation-icon">🎥</div>
              <h2>Mira Tu Plan Personalizado</h2>
            </div>
            <div className="vsl-container">
              <div 
                ref={videoContainerRef}
                style={{ 
                  width: '100%', 
                  minHeight: '300px',
                  background: '#000',
                  borderRadius: '8px'
                }}
              >
                {/* O vídeo será inserido aqui dinamicamente */}
              </div>
            </div>
          </div>
        )}

        {/* ========================================
            REVELACIÓN 3: OFERTA
            ======================================== */}
        {revelation3 && (
          <div className="revelation fade-in offer-revelation">
            <div className="offer-badge">OFERTA EXCLUSIVA</div>

            <div className="revelation-header">
              <div className="revelation-icon">🎯</div>
              <h2>Plan de Reconquista Personalizado</h2>
            </div>

            <div className="offer-features">
              <div className="feature">
                <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Módulos exclusivos paso a paso</span>
              </div>
              <div className="feature">
                <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Guía especial: Ventana de 72 Horas</span>
              </div>
              <div className="feature">
                <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Bonos de acción inmediata</span>
              </div>
              <div className="feature">
                <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Garantía de 7 días</span>
              </div>
            </div>

            <div className="urgency-indicators">
              <div className="indicator">
                <span className="indicator-label">Tiempo restante:</span>
                <span className="indicator-value countdown">{formatTime(timeLeft)}</span>
              </div>
              <div className="indicator">
                <span className="indicator-label">Spots disponibles hoy:</span>
                <span className="indicator-value spots">{spotsLeft}</span>
              </div>
            </div>

            <button className="cta-buy" onClick={handleCTAClick}>
              <span className="cta-glow"></span>
              COMPRAR AHORA
            </button>

            <p className="social-proof-count">
              ✓ +12.847 reconquistas exitosas
            </p>

            <p className="guarantee-text">
              Exclusivo para quien completó el análisis personalizado
            </p>
          </div>
        )}
      </div>

      {revelation4 && (
        <div className="sticky-cta">
          <div className="sticky-urgency">
            ⏰ {formatTime(timeLeft)} • {spotsLeft} spots restantes
          </div>
          <button className="cta-buy-sticky" onClick={handleCTAClick}>
            COMPRAR AHORA
          </button>
        </div>
      )}
    </div>
  );
}