import { useState, useEffect } from 'react';
import { tracking } from '../utils/tracking';
import { storage } from '../utils/storage';
import { getHotmartUrl } from '../utils/animations';

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
        {revelation1 && (
          <div className="revelation fade-in">
            <div className="revelation-header">
              <div className="revelation-icon">💔</div>
              <h2>Por Qué Te Dejó</h2>
            </div>
            <p className="revelation-text">{getPersonalizedText()}</p>
          </div>
        )}

        {revelation2 && (
          <div className="revelation fade-in urgency-revelation">
            <div className="revelation-header">
              <div className="revelation-icon alert">⏰</div>
              <h2>Ventana de 72 Horas</h2>
            </div>
            <p className="revelation-text">
              Basado en neurociencia: 3 fases químicas en el cerebro de tu ex-pareja después del fin.
              <strong className="alert-text"> ¡Actúa ahora o pierde la atracción para siempre!</strong>
            </p>
          </div>
        )}

        {revelation3 && (
          <div className="revelation fade-in vsl-revelation">
            <div className="revelation-header">
              <div className="revelation-icon">🎥</div>
              <h2>Mira Tu Plan Personalizado</h2>
            </div>
            <div className="vsl-container">
              <div className="vsl-placeholder">
                <p className="vsl-text">
                  Ricardo Abreu revela el plan completo para tu situación específica
                </p>
                <p className="vsl-subtext">
                  Video personalizado basado en tus respuestas
                </p>
                <div className="play-icon">▶</div>
              </div>
            </div>
          </div>
        )}

        {revelation4 && (
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
