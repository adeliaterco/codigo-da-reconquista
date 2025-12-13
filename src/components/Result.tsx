import { useState, useEffect, useRef, useCallback } from 'react';
import { tracking } from '../utils/tracking';
import { storage } from '../utils/storage';
import { playKeySound } from '../utils/animations';
import { QuizAnswer } from '../types/quiz';

interface ResultProps {
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

// ========================================
// SISTEMA DE TRACKING COMPLETO
// ========================================

// ✅ LISTA COMPLETA de parâmetros de tracking
const ALL_TRACKING_PARAMS_LIST = [
  // UTMs tradicionais
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  // Facebook
  'fbclid', 'fb_action_ids', 'fb_action_types', 'fb_source',
  // Google
  'gclid', 'gclsrc', 'dclid', 'gbraid', 'wbraid',
  // Microsoft/Bing
  'msclkid',
  // Twitter
  'twclid',
  // LinkedIn
  'li_fat_id',
  // TikTok
  'ttclid',
  // Instagram
  'igshid',
  // Snapchat
  'sclid',
  // Outros parâmetros comuns
  'ref', 'source', 'medium', 'campaign', 'term', 'content',
  'adgroup', 'keyword', 'placement', 'network', 'device', 'creative',
  'matchtype', 'adposition', 'feeditemid', 'targetid'
];

// ✅ Função para verificar se um parâmetro é de tracking
function isTrackingParam(key: string): boolean {
  return ALL_TRACKING_PARAMS_LIST.some(param => key.toLowerCase().startsWith(param.toLowerCase()));
}

// ✅ Função segura para localStorage - GET
function safeLocalStorageGet(key: string): any | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      return parsed;
    }
  } catch (error) {
    console.error(`❌ [RESULT - ERROR] localStorage[${key}] corrompido, removendo:`, error);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.error('❌ [RESULT - ERROR] Erro ao remover item corrompido:', e);
    }
  }
  return null;
}

// ✅ Função segura para localStorage - SET
function safeLocalStorageSet(key: string, value: any) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (value === undefined || value === null) {
        localStorage.removeItem(key);
        return;
      }
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error(`❌ [RESULT - ERROR] Erro ao salvar localStorage[${key}]:`, error);
  }
}

// ✅ Função para capturar e salvar TODOS os parâmetros de tracking
function captureAndSaveTrackingParams() {
  if (typeof window === 'undefined') return {};
  
  try {
    const currentUrl = new URL(window.location.href);
    const capturedParams: { [key: string]: string } = {};
    
    for (const [key, value] of currentUrl.searchParams.entries()) {
      if (isTrackingParam(key)) {
        capturedParams[key] = decodeURIComponent(value);
        console.log(`✅ [RESULT - CAPTURE] Capturado da URL: ${key} = ${value}`);
      }
    }
    
    if (Object.keys(capturedParams).length > 0) {
      safeLocalStorageSet('capturedTrackingParams', capturedParams);
      console.log('✅ [RESULT - BACKUP] Parâmetros salvos no localStorage:', capturedParams);
    }
    
    return capturedParams;
    
  } catch (error) {
    console.error('❌ [RESULT - ERROR] Erro ao capturar parâmetros:', error);
    return {};
  }
}

// ✅ Função para recuperar parâmetros do backup
function getTrackingParamsFromLocalStorage(): { [key: string]: string } {
  if (typeof window === 'undefined') return {};
  
  try {
    const backup = safeLocalStorageGet('capturedTrackingParams');
    if (backup && typeof backup === 'object') {
      console.log('📦 [RESULT - FALLBACK] Parâmetros recuperados do localStorage:', backup);
      return backup;
    }
  } catch (error) {
    console.error('❌ [RESULT - ERROR] Erro ao recuperar backup:', error);
  }
  
  return {};
}

// ✅ Função para construir a query string completa com todos os parâmetros de tracking
function buildTrackingQueryString(): string {
  if (typeof window === 'undefined') return '';
  
  try {
    let trackingParams: { [key: string]: string } = {};

    // 1. Tenta pegar da URL atual
    const currentUrl = new URL(window.location.href);
    for (const [key, value] of currentUrl.searchParams.entries()) {
      if (isTrackingParam(key)) {
        trackingParams[key] = decodeURIComponent(value);
      }
    }

    // 2. Se não encontrou nada na URL, usa o backup do localStorage
    if (Object.keys(trackingParams).length === 0) {
      trackingParams = getTrackingParamsFromLocalStorage();
    }

    const queryParts: string[] = [];
    Object.entries(trackingParams).forEach(([key, value]) => {
      if (value && value.trim() !== '' && value.length < 200) {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    });

    // ✅ Geração de xcod, sck e bid (baseado no formato do Hotmart)
    const utmSource = trackingParams['utm_source'] || trackingParams['fbclid'] || 'direct';
    const utmCampaign = trackingParams['utm_campaign'] || 'no_campaign';
    const utmMedium = trackingParams['utm_medium'] || 'no_medium';
    const utmContent = trackingParams['utm_content'] || 'no_content';
    const utmTerm = trackingParams['utm_term'] || 'no_term';

    const xcodValue = `${utmSource}hQwK21wXxR${utmCampaign}hQwK21wXxR${utmMedium}hQwK21wXxR${utmContent}hQwK21wXxR${utmTerm}`;
    const sckValue = xcodValue;
    const bidValue = Date.now().toString();

    queryParts.push(`xcod=${encodeURIComponent(xcodValue)}`);
    queryParts.push(`sck=${encodeURIComponent(sckValue)}`);
    queryParts.push(`bid=${encodeURIComponent(bidValue)}`);

    const queryString = queryParts.join('&');
    
    console.log('🔗 [RESULT - QUERY] Query string gerada:', queryString);
    return queryString;

  } catch (error) {
    console.error('❌ [RESULT - ERROR] Erro ao construir query string de tracking:', error);
    return '';
  }
}

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

export default function Result({ onNavigate }: ResultProps) {
  const [revelation1, setRevelation1] = useState(false);
  const [revelation2, setRevelation2] = useState(false);
  const [revelation3, setRevelation3] = useState(false);
  const [revelation4, setRevelation4] = useState(false);
  const [timeLeft, setTimeLeft] = useState(47 * 60);
  const [spotsLeft, setSpotsLeft] = useState(storage.getSpotsLeft());
  const [scrollTracked, setScrollTracked] = useState<Set<number>>(new Set());
  
  const quizData = storage.getQuizData();
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(Date.now());

  // ✅ CAPTURA INICIAL DE PARÂMETROS
  useEffect(() => {
    captureAndSaveTrackingParams();
    tracking.pageView('resultado');

    console.log('🔍 [RESULT - DEBUG] UTMs atuais na URL:', window.location.search);
    console.log('🔗 [RESULT - DEBUG] Query string para checkout:', buildTrackingQueryString());

    // Tracking de visualização
    tracking.vslEvent('resultado_loaded');

    const timer1 = setTimeout(() => {
      setRevelation1(true);
      tracking.revelationViewed('why_left');
      console.log('✅ [RESULT - TRACKING] Revelação 1 vista');
    }, 0);

    const timer2 = setTimeout(() => {
      setRevelation2(true);
      tracking.revelationViewed('72h_window');
      console.log('✅ [RESULT - TRACKING] Revelação 2 vista (VSL)');
    }, 6000);

    const timer3 = setTimeout(() => {
      setRevelation3(true);
      tracking.revelationViewed('vsl');
      tracking.vslEvent('started');
      console.log('✅ [RESULT - TRACKING] Revelação 3 vista (Oferta)');
    }, 9000);

    const timer4 = setTimeout(() => {
      setRevelation4(true);
      tracking.revelationViewed('offer');
      console.log('✅ [RESULT - TRACKING] Revelação 4 vista (CTA Final)');
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

      // Tracking de tempo na página
      const timeSpent = (Date.now() - startTimeRef.current) / 1000;
      console.log(`⏱️ [RESULT - TRACKING] Tempo na página: ${timeSpent}s`);
    };
  }, []);

  // ✅ SCROLL TRACKING
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);
      
      if (scrollPercent % 25 === 0 && scrollPercent > 0 && !scrollTracked.has(scrollPercent)) {
        setScrollTracked(prev => new Set(prev).add(scrollPercent));
        console.log(`📊 [RESULT - TRACKING] Scroll: ${scrollPercent}%`);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollTracked]);

  // ✅ INTEGRAÇÃO VÍDEO VTURB
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
            console.log("✅ [RESULT - VSL] Script VTurb carregado com sucesso!");
            tracking.vslEvent('video_loaded');
          };
          
          s.onerror = () => {
            console.error("❌ [RESULT - VSL] Erro ao carregar script VTurb");
            
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

  // ✅ FUNÇÃO DE COMPRA COM TRACKING COMPLETO
  const handleCTAClick = useCallback((position: string = 'principal') => {
    const timeToAction = (Date.now() - startTimeRef.current) / 1000;
    
    // Construir URL com TODOS os parâmetros de tracking
    const trackingQueryString = buildTrackingQueryString();
    const baseCheckoutUrl = "https://pay.hotmart.com/F100142422S?off=efckjoa7&checkoutMode=10";
    const fullCheckoutUrl = `${baseCheckoutUrl}&${trackingQueryString}`;
    
    console.log('🔗 [RESULT - CHECKOUT] URL final do checkout:', fullCheckoutUrl);
    
    tracking.ctaClicked(`result_buy_${position}`);
    console.log(`✅ [RESULT - TRACKING] CTA clicado: ${position} (${timeToAction}s)`);
    
    // Tenta abrir popup
    const paymentWindow = window.open(fullCheckoutUrl, "_blank");
    
    // Verificação assíncrona para detectar bloqueio
    setTimeout(() => {
      if (!paymentWindow || paymentWindow.closed || typeof paymentWindow.closed == 'undefined') {
        console.error("❌ [RESULT - CHECKOUT] Popup bloqueado - redirecionamento direto");
        window.location.href = fullCheckoutUrl;
      }
    }, 100);
  }, []);

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
            REVELACIÓN 1: POR QUÉ TE DEJÓ + VENTANA 72H
            ======================================== */}
        {revelation1 && (
          <div className="revelation fade-in">
            <div className="revelation-header">
              <div className="revelation-icon">💔</div>
              <h2>Por Qué Te Dejó</h2>
            </div>
            <p className="revelation-text">{getPersonalizedText()}</p>

            {/* NUEVA SECCIÓN: VENTANA DE 72 HORAS */}
            <div className="ventana-72h-section" style={{
              background: 'rgba(220, 38, 38, 0.2)',
              border: '2px solid rgb(239, 68, 68)',
              borderRadius: '12px',
              padding: '24px',
              marginTop: '24px'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ 
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)', 
                  fontWeight: '900',
                  color: 'white',
                  marginBottom: '16px'
                }}>
                  POR QUÉ TE DEJÓ
                  <br />
                  <span style={{ color: 'rgb(248, 113, 113)' }}>(Y no es lo que piensas)</span>
                </h2>
              </div>

              <div style={{
                background: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                <p style={{ color: 'white', fontSize: '1.125rem', lineHeight: '1.75' }}>
                  Ella no te dejó porque dejaste de amarla.
                  <br /><br />
                  Te dejó porque <strong style={{ color: 'rgb(252, 165, 165)' }}>dejaste de ser el hombre que la conquistó</strong>.
                  <br /><br />
                  Y aquí está el problema:
                  <br /><br />
                  El 97% de los hombres hacen lo mismo después de la ruptura:
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  background: 'rgba(127, 29, 29, 0.3)',
                  borderRadius: '8px',
                  padding: '16px',
                  borderLeft: '4px solid rgb(239, 68, 68)',
                  marginBottom: '16px'
                }}>
                  <p style={{ color: 'white', fontWeight: 'bold', marginBottom: '4px' }}>
                    ❌ Mandan mensajes rogando
                  </p>
                  <p style={{ color: 'rgb(209, 213, 219)', fontSize: '0.875rem' }}>
                    Resultado: Ella te ve como débil y desesperado
                  </p>
                </div>
                
                <div style={{
                  background: 'rgba(127, 29, 29, 0.3)',
                  borderRadius: '8px',
                  padding: '16px',
                  borderLeft: '4px solid rgb(239, 68, 68)',
                  marginBottom: '16px'
                }}>
                  <p style={{ color: 'white', fontWeight: 'bold', marginBottom: '4px' }}>
                    ❌ Intentan "ser amigos"
                  </p>
                  <p style={{ color: 'rgb(209, 213, 219)', fontSize: '0.875rem' }}>
                    Resultado: Friendzone permanente
                  </p>
                </div>
                
                <div style={{
                  background: 'rgba(127, 29, 29, 0.3)',
                  borderRadius: '8px',
                  padding: '16px',
                  borderLeft: '4px solid rgb(239, 68, 68)'
                }}>
                  <p style={{ color: 'white', fontWeight: 'bold', marginBottom: '4px' }}>
                    ❌ Desaparecen completamente (contacto cero mal hecho)
                  </p>
                  <p style={{ color: 'rgb(209, 213, 219)', fontSize: '0.875rem' }}>
                    Resultado: Ella sigue adelante y conoce a otro
                  </p>
                </div>
              </div>

              <div style={{
                background: 'rgba(133, 77, 14, 0.3)',
                borderRadius: '8px',
                padding: '24px',
                border: '2px solid rgb(234, 179, 8)'
              }}>
                <p style={{
                  color: 'rgb(253, 224, 71)',
                  fontWeight: 'bold',
                  fontSize: '1.25rem',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  ⚡ LA VENTANA DE 72 HORAS
                </p>
                <p style={{ color: 'white', fontSize: '1.125rem', lineHeight: '1.75' }}>
                  Neurocientíficos de la Universidad de Stanford descubrieron algo:
                  <br /><br />
                  Después de una ruptura, el cerebro de tu ex pasa por 3 fases químicas en las primeras 72 horas:
                  <br /><br />
                  <strong style={{ color: 'rgb(250, 204, 21)' }}>FASE 1 (0-24h):</strong> Dopamina cae 67% → Ella siente "alivio"
                  <br />
                  <strong style={{ color: 'rgb(250, 204, 21)' }}>FASE 2 (24-48h):</strong> Oxitocina se desconecta → Ella "olvida" los buenos momentos
                  <br />
                  <strong style={{ color: 'rgb(250, 204, 21)' }}>FASE 3 (48-72h):</strong> Córtex prefrontal reescribe las memorias → Ella te ve diferente
                  <br /><br />
                  Si haces lo CORRECTO en cada fase...
                  <br />
                  <strong style={{ color: 'rgb(74, 222, 128)' }}>Puedes revertir el proceso y hacer que ella TE BUSQUE.</strong>
                  <br /><br />
                  Si haces lo INCORRECTO...
                  <br />
                  <strong style={{ color: 'rgb(248, 113, 113)' }}>Su cerebro literalmente "borra" la atracción por ti.</strong>
                </p>
              </div>

              <div style={{ marginTop: '32px', textAlign: 'center' }}>
                <p style={{ color: 'white', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px' }}>
                  La pregunta es:
                </p>
                <p style={{ 
                  color: 'rgb(252, 165, 165)', 
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)', 
                  fontWeight: '900' 
                }}>
                  ¿Sabes qué hacer en cada una de esas fases?
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
              <div ref={videoContainerRef} style={{ 
                width: '100%', 
                minHeight: '300px',
                background: '#000',
                borderRadius: '8px'
              }}>
                {/* O vídeo será inserido aqui */}
              </div>
            </div>
          </div>
        )}

        {/* ========================================
            REVELACIÓN 3: OFERTA COMPLETA
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

            <button className="cta-buy" onClick={() => handleCTAClick('oferta_principal')}>
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

        {/* ========================================
            REVELACIÓN 4: CTA FINAL
            ======================================== */}
        {revelation4 && (
          <div className="revelation fade-in final-cta-revelation">
            <div className="final-cta-content">
              <h2 className="final-cta-title">¿Listo Para Recuperar a Tu Ex?</h2>
              <p className="final-cta-text">
                No dejes pasar esta oportunidad. El tiempo corre y cada segundo cuenta.
              </p>
              <button className="cta-buy" onClick={() => handleCTAClick('cta_final')}>
                <span className="cta-glow"></span>
                SÍ, QUIERO MI PLAN AHORA
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================
          STICKY CTA
          ======================================== */}
      {revelation4 && (
        <div className="sticky-cta">
          <div className="sticky-urgency">
            ⏰ {formatTime(timeLeft)} • {spotsLeft} spots restantes
          </div>
          <button className="cta-buy-sticky" onClick={() => handleCTAClick('sticky')}>
            COMPRAR AHORA
          </button>
        </div>
      )}
    </div>
  );
}