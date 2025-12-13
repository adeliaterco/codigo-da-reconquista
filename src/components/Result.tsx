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
  const [showOfferButton, setShowOfferButton] = useState(false);
  const [revelation3, setRevelation3] = useState(false);
  const [revelation4, setRevelation4] = useState(false);
  const [timeLeft, setTimeLeft] = useState(47 * 60);
  const [spotsLeft, setSpotsLeft] = useState(storage.getSpotsLeft());
  const quizData = storage.getQuizData();
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const offerSectionRef = useRef<HTMLDivElement>(null);

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

    // ✅ NOVO: Mostra botão da oferta após VSL
    const timer3 = setTimeout(() => {
      setShowOfferButton(true);
      tracking.revelationViewed('vsl');
      tracking.vslEvent('started');
    }, 9000);

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

  // ✅ NOVA FUNÇÃO: Revelar oferta com scroll suave
  const handleRevealOffer = () => {
    playKeySound();
    setRevelation3(true);
    tracking.revelationViewed('offer');
    tracking.ctaClicked('reveal_offer_button');
    
    // Scroll suave até a oferta após 300ms (tempo da animação)
    setTimeout(() => {
      if (offerSectionRef.current) {
        offerSectionRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 300);

    // Mostra sticky CTA após 3 segundos
    setTimeout(() => {
      setRevelation4(true);
    }, 3000);
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
            REVELACIÓN 1: VENTANA 72H
            ======================================== */}
        {revelation1 && (
          <div className="revelation fade-in">
            <div className="revelation-header">
              <div className="revelation-icon">💔</div>
              <h2>Por Qué Te Dejó</h2>
            </div>
            <p className="revelation-text">{getPersonalizedText()}</p>

            <div style={{
              background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
              border: '2px solid rgb(239, 68, 68)',
              borderRadius: '16px',
              padding: 'clamp(24px, 6vw, 48px) clamp(16px, 5vw, 32px)',
              marginTop: 'clamp(24px, 6vw, 32px)',
              boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)'
            }}>
              
              <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 6vw, 40px)' }}>
                <div style={{
                  fontSize: 'clamp(2.5rem, 8vw, 3.5rem)',
                  marginBottom: 'clamp(12px, 3vw, 16px)'
                }}>⚡</div>
                <h2 style={{ 
                  fontSize: 'clamp(1.5rem, 6vw, 2.5rem)', 
                  fontWeight: '900',
                  color: 'white',
                  marginBottom: 'clamp(12px, 3vw, 16px)',
                  lineHeight: '1.3',
                  padding: '0 8px'
                }}>
                  LA VENTANA DE 72 HORAS
                </h2>
                <p style={{
                  color: 'rgb(252, 165, 165)',
                  fontSize: 'clamp(1rem, 4vw, 1.25rem)',
                  fontWeight: '600',
                  padding: '0 8px',
                  lineHeight: '1.4'
                }}>
                  El secreto que los neurocientíficos descubrieron
                </p>
              </div>

              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '12px',
                padding: 'clamp(20px, 5vw, 28px)',
                marginBottom: 'clamp(24px, 5vw, 32px)',
                backdropFilter: 'blur(10px)'
              }}>
                <p style={{ 
                  color: 'white', 
                  fontSize: 'clamp(1rem, 4vw, 1.375rem)', 
                  lineHeight: '1.7',
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

              <div style={{
                display: 'grid',
                gap: 'clamp(16px, 4vw, 20px)',
                marginBottom: 'clamp(24px, 5vw, 32px)'
              }}>
                <div style={{
                  background: 'rgba(234, 179, 8, 0.15)',
                  border: '2px solid rgb(234, 179, 8)',
                  borderRadius: '12px',
                  padding: 'clamp(16px, 4vw, 24px)',
                  transition: 'transform 0.2s'
                }}>
                  <div style={{ 
                    color: 'rgb(250, 204, 21)', 
                    fontWeight: '900',
                    fontSize: 'clamp(1rem, 4vw, 1.25rem)',
                    marginBottom: 'clamp(8px, 2vw, 12px)',
                    lineHeight: '1.3'
                  }}>
                    FASE 1 (0-24h)
                  </div>
                  <div style={{ 
                    color: 'white',
                    fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)',
                    lineHeight: '1.6'
                  }}>
                    Dopamina cae 67% → Ella siente "alivio"
                  </div>
                </div>

                <div style={{
                  background: 'rgba(234, 179, 8, 0.15)',
                  border: '2px solid rgb(234, 179, 8)',
                  borderRadius: '12px',
                  padding: 'clamp(16px, 4vw, 24px)',
                  transition: 'transform 0.2s'
                }}>
                  <div style={{ 
                    color: 'rgb(250, 204, 21)', 
                    fontWeight: '900',
                    fontSize: 'clamp(1rem, 4vw, 1.25rem)',
                    marginBottom: 'clamp(8px, 2vw, 12px)',
                    lineHeight: '1.3'
                  }}>
                    FASE 2 (24-48h)
                  </div>
                  <div style={{ 
                    color: 'white',
                    fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)',
                    lineHeight: '1.6'
                  }}>
                    Oxitocina se desconecta → Ella "olvida" los buenos momentos
                  </div>
                </div>

                <div style={{
                  background: 'rgba(234, 179, 8, 0.15)',
                  border: '2px solid rgb(234, 179, 8)',
                  borderRadius: '12px',
                  padding: 'clamp(16px, 4vw, 24px)',
                  transition: 'transform 0.2s'
                }}>
                  <div style={{ 
                    color: 'rgb(250, 204, 21)', 
                    fontWeight: '900',
                    fontSize: 'clamp(1rem, 4vw, 1.25rem)',
                    marginBottom: 'clamp(8px, 2vw, 12px)',
                    lineHeight: '1.3'
                  }}>
                    FASE 3 (48-72h)
                  </div>
                  <div style={{ 
                    color: 'white',
                    fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)',
                    lineHeight: '1.6'
                  }}>
                    Córtex prefrontal reescribe memorias → Ella te ve diferente
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: 'clamp(28px, 6vw, 40px)',
                marginBottom: 'clamp(28px, 6vw, 40px)',
                textAlign: 'center'
              }}>
                <img 
                  src="https://comprarplanseguro.shop/wp-content/uploads/2025/10/imagem3-nova.webp"
                  alt="Ventana de 72 Horas - Proceso Cerebral"
                  loading="lazy"
                  style={{
                    width: '100%',
                    maxWidth: '600px',
                    height: 'auto',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                    border: '2px solid rgba(234, 179, 8, 0.3)',
                    display: 'block',
                    margin: '0 auto'
                  }}
                  onError={(e) => {
                    console.error('❌ Erro ao carregar imagem');
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              <div style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '2px solid rgb(248, 113, 113)',
                borderRadius: '12px',
                padding: 'clamp(20px, 5vw, 28px)',
                textAlign: 'center'
              }}>
                <p style={{ 
                  color: 'white', 
                  fontSize: 'clamp(1.125rem, 4.5vw, 1.5rem)', 
                  fontWeight: '900',
                  margin: 0,
                  lineHeight: '1.5',
                  marginBottom: 'clamp(12px, 3vw, 16px)'
                }}>
                  ¿Sabes qué hacer en cada fase?
                </p>
                <p style={{
                  color: 'rgb(252, 165, 165)',
                  fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  El video abajo revela todo el protocolo paso a paso
                </p>
              </div>

            </div>
          </div>
        )}

        {/* ========================================
            REVELACIÓN 2: VSL
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
            BOTÃO REVELAR OFERTA (NOVO)
            ======================================== */}
        {showOfferButton && !revelation3 && (
          <div className="revelation fade-in" style={{
            textAlign: 'center',
            padding: 'clamp(32px, 8vw, 64px) clamp(16px, 4vw, 24px)',
            marginTop: 'clamp(24px, 6vw, 32px)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(202, 138, 4, 0.1) 100%)',
              border: '3px solid rgb(234, 179, 8)',
              borderRadius: '16px',
              padding: 'clamp(32px, 7vw, 48px) clamp(20px, 5vw, 32px)',
              boxShadow: '0 12px 48px rgba(234, 179, 8, 0.4)',
              animation: 'pulse 2s infinite'
            }}>
              <div style={{
                fontSize: 'clamp(2.5rem, 8vw, 3.5rem)',
                marginBottom: 'clamp(16px, 4vw, 24px)'
              }}>🎁</div>
              
              <h2 style={{
                fontSize: 'clamp(1.5rem, 6vw, 2.25rem)',
                fontWeight: '900',
                color: 'white',
                marginBottom: 'clamp(16px, 4vw, 24px)',
                lineHeight: '1.3'
              }}>
                Tu Oferta Exclusiva Está Lista
              </h2>
              
              <p style={{
                fontSize: 'clamp(1rem, 4vw, 1.25rem)',
                color: 'rgb(253, 224, 71)',
                marginBottom: 'clamp(24px, 6vw, 32px)',
                lineHeight: '1.5',
                fontWeight: '600'
              }}>
                Acceso inmediato al Plan Completo de 21 Días
              </p>

              <button
                onClick={handleRevealOffer}
                style={{
                  width: '100%',
                  maxWidth: '500px',
                  background: 'rgb(234, 179, 8)',
                  color: 'black',
                  fontWeight: '900',
                  padding: 'clamp(20px, 5vw, 28px) clamp(24px, 6vw, 32px)',
                  borderRadius: '16px',
                  fontSize: 'clamp(1.25rem, 5vw, 1.75rem)',
                  border: '4px solid white',
                  cursor: 'pointer',
                  boxShadow: '0 8px 32px rgba(234, 179, 8, 0.5)',
                  transition: 'all 0.3s ease',
                  minHeight: 'clamp(64px, 16vw, 80px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  lineHeight: '1.3',
                  animation: 'scaleUp 1.5s ease-in-out infinite'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 12px 48px rgba(234, 179, 8, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(234, 179, 8, 0.5)';
                }}
              >
                🔓 VER MI OFERTA EXCLUSIVA
              </button>

              <p style={{
                fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                color: 'rgb(252, 165, 165)',
                marginTop: 'clamp(16px, 4vw, 20px)',
                fontWeight: '600',
                lineHeight: '1.5'
              }}>
                ⏰ Precio especial válido solo por {formatTime(timeLeft)}
              </p>
            </div>
          </div>
        )}

        {/* ========================================
            REVELACIÓN 3: OFERTA (Só aparece após clicar)
            ======================================== */}
        {revelation3 && (
          <div 
            ref={offerSectionRef}
            className="revelation fade-in offer-revelation" 
            style={{
              position: 'relative',
              padding: 'clamp(20px, 5vw, 32px)',
              scrollMarginTop: '80px'
            }}
          >
            
            <div style={{
              background: 'rgb(234, 179, 8)',
              color: 'black',
              fontWeight: 'bold',
              fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
              padding: 'clamp(6px, 2vw, 8px) clamp(12px, 3vw, 16px)',
              borderRadius: '9999px',
              display: 'inline-block',
              marginBottom: 'clamp(16px, 4vw, 20px)',
              textAlign: 'center',
              width: 'auto',
              maxWidth: '100%'
            }}>
              OFERTA EXCLUSIVA
            </div>

            <div className="revelation-header" style={{ marginTop: 0 }}>
              <div className="revelation-icon">🎯</div>
              <h2 style={{ 
                fontSize: 'clamp(1.5rem, 6vw, 2rem)',
                lineHeight: '1.3',
                marginBottom: 'clamp(20px, 5vw, 24px)',
                padding: '0 8px'
              }}>
                Plan de Reconquista Personalizado
              </h2>
            </div>

            <div className="offer-features" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(12px, 3vw, 16px)',
              marginBottom: 'clamp(24px, 5vw, 32px)'
            }}>
              <div className="feature" style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'clamp(10px, 3vw, 12px)',
                padding: 'clamp(8px, 2vw, 12px) 0'
              }}>
                <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{
                  minWidth: 'clamp(20px, 5vw, 24px)',
                  width: 'clamp(20px, 5vw, 24px)',
                  height: 'clamp(20px, 5vw, 24px)',
                  marginTop: '2px'
                }}>
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span style={{
                  fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)',
                  lineHeight: '1.5',
                  flex: 1
                }}>📱 MÓDULO 1: Conversaciones (Días 1-7)</span>
              </div>
              <div className="feature" style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'clamp(10px, 3vw, 12px)',
                padding: 'clamp(8px, 2vw, 12px) 0'
              }}>
                <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{
                  minWidth: 'clamp(20px, 5vw, 24px)',
                  width: 'clamp(20px, 5vw, 24px)',
                  height: 'clamp(20px, 5vw, 24px)',
                  marginTop: '2px'
                }}>
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span style={{
                  fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)',
                  lineHeight: '1.5',
                  flex: 1
                }}>👥 MÓDULO 2: Encuentros (Días 8-14)</span>
              </div>
              <div className="feature" style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'clamp(10px, 3vw, 12px)',
                padding: 'clamp(8px, 2vw, 12px) 0'
              }}>
                <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{
                  minWidth: 'clamp(20px, 5vw, 24px)',
                  width: 'clamp(20px, 5vw, 24px)',
                  height: 'clamp(20px, 5vw, 24px)',
                  marginTop: '2px'
                }}>
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span style={{
                  fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)',
                  lineHeight: '1.5',
                  flex: 1
                }}>❤️ MÓDULO 3: Reconquista (Días 15-21)</span>
              </div>
              <div className="feature" style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'clamp(10px, 3vw, 12px)',
                padding: 'clamp(8px, 2vw, 12px) 0'
              }}>
                <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{
                  minWidth: 'clamp(20px, 5vw, 24px)',
                  width: 'clamp(20px, 5vw, 24px)',
                  height: 'clamp(20px, 5vw, 24px)',
                  marginTop: '2px'
                }}>
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span style={{
                  fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)',
                  lineHeight: '1.5',
                  flex: 1
                }}>🚨 MÓDULO 4: Protocolo de Emergencia</span>
              </div>
              <div className="feature" style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'clamp(10px, 3vw, 12px)',
                padding: 'clamp(8px, 2vw, 12px) 0'
              }}>
                <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{
                  minWidth: 'clamp(20px, 5vw, 24px)',
                  width: 'clamp(20px, 5vw, 24px)',
                  height: 'clamp(20px, 5vw, 24px)',
                  marginTop: '2px'
                }}>
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span style={{
                  fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)',
                  lineHeight: '1.5',
                  flex: 1
                }}>Guía especial: Ventana de 72 Horas</span>
              </div>
              <div className="feature" style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'clamp(10px, 3vw, 12px)',
                padding: 'clamp(8px, 2vw, 12px) 0'
              }}>
                <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{
                  minWidth: 'clamp(20px, 5vw, 24px)',
                  width: 'clamp(20px, 5vw, 24px)',
                  height: 'clamp(20px, 5vw, 24px)',
                  marginTop: '2px'
                }}>
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span style={{
                  fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)',
                  lineHeight: '1.5',
                  flex: 1
                }}>Bonos de acción inmediata</span>
              </div>
              <div className="feature" style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'clamp(10px, 3vw, 12px)',
                padding: 'clamp(8px, 2vw, 12px) 0'
              }}>
                <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{
                  minWidth: 'clamp(20px, 5vw, 24px)',
                  width: 'clamp(20px, 5vw, 24px)',
                  height: 'clamp(20px, 5vw, 24px)',
                  marginTop: '2px'
                }}>
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span style={{
                  fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)',
                  lineHeight: '1.5',
                  flex: 1
                }}>Garantía de 30 días</span>
              </div>
            </div>

            <div className="urgency-indicators" style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 'clamp(12px, 3vw, 16px)',
              marginBottom: 'clamp(24px, 5vw, 32px)'
            }}>
              <div className="indicator" style={{
                textAlign: 'center',
                padding: 'clamp(12px, 3vw, 16px)',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px'
              }}>
                <span className="indicator-label" style={{
                  display: 'block',
                  fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                  marginBottom: '8px'
                }}>Tiempo restante:</span>
                <span className="indicator-value countdown" style={{
                  fontSize: 'clamp(1.5rem, 6vw, 2rem)',
                  fontWeight: 'bold'
                }}>{formatTime(timeLeft)}</span>
              </div>
              <div className="indicator" style={{
                textAlign: 'center',
                padding: 'clamp(12px, 3vw, 16px)',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px'
              }}>
                <span className="indicator-label" style={{
                  display: 'block',
                  fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                  marginBottom: '8px'
                }}>Spots disponibles hoy:</span>
                <span className="indicator-value spots" style={{
                  fontSize: 'clamp(1.5rem, 6vw, 2rem)',
                  fontWeight: 'bold'
                }}>{spotsLeft}</span>
              </div>
            </div>

            <button 
              className="cta-buy" 
              onClick={handleCTAClick}
              style={{
                width: '100%',
                background: 'rgb(234, 179, 8)',
                color: 'black',
                fontWeight: '900',
                padding: 'clamp(16px, 4vw, 20px)',
                borderRadius: '12px',
                fontSize: 'clamp(1.125rem, 4.5vw, 1.5rem)',
                border: '3px solid white',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: 'clamp(16px, 4vw, 20px)',
                minHeight: 'clamp(56px, 14vw, 64px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1.3'
              }}
            >
              <span className="cta-glow"></span>
              COMPRAR AHORA
            </button>

            <p className="social-proof-count" style={{
              textAlign: 'center',
              color: 'rgb(74, 222, 128)',
              fontSize: 'clamp(0.875rem, 3.5vw, 1.125rem)',
              marginBottom: 'clamp(12px, 3vw, 16px)',
              lineHeight: '1.5',
              fontWeight: '600'
            }}>
              ✓ +12.847 reconquistas exitosas
            </p>

            <p className="guarantee-text" style={{
              textAlign: 'center',
              fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.9)',
              padding: '0 8px'
            }}>
              Exclusivo para quien completó el análisis personalizado
            </p>
          </div>
        )}
      </div>

      {revelation4 && (
        <div className="sticky-cta" style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          padding: 'clamp(12px, 3vw, 16px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(8px, 2vw, 12px)',
          zIndex: 1000,
          borderTop: '2px solid rgb(234, 179, 8)'
        }}>
          <div className="sticky-urgency" style={{
            textAlign: 'center',
            fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
            color: 'rgb(253, 224, 71)',
            fontWeight: 'bold'
          }}>
            ⏰ {formatTime(timeLeft)} • {spotsLeft} spots restantes
          </div>
          <button 
            className="cta-buy-sticky" 
            onClick={handleCTAClick}
            style={{
              width: '100%',
              background: 'rgb(234, 179, 8)',
              color: 'black',
              fontWeight: '900',
              padding: 'clamp(12px, 3vw, 16px)',
              borderRadius: '8px',
              fontSize: 'clamp(1rem, 4vw, 1.25rem)',
              border: '2px solid white',
              cursor: 'pointer',
              minHeight: 'clamp(48px, 12vw, 56px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            COMPRAR AHORA
          </button>
        </div>
      )}

      {/* ✅ ANIMAÇÕES CSS */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 12px 48px rgba(234, 179, 8, 0.4);
          }
          50% {
            box-shadow: 0 12px 64px rgba(234, 179, 8, 0.6);
          }
        }

        @keyframes scaleUp {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }

        .fade-in {
          animation: fadeIn 0.6s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}