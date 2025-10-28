"use client";
import { useEffect, useState } from "react";

export default function ResultPage() {
  const [result, setResult] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackFinished, setFeedbackFinished] = useState(false);
  const [ctaText, setCtaText] = useState("");
  const [ctaFinished, setCtaFinished] = useState(false);

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch("/api/saveResults/last", { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          setResult(resolveDominant(data));
        } else {
          const localData = {
            profil_dominant: localStorage.getItem("profil_dominant"),
            percent_curieux: localStorage.getItem("percent_curieux"),
            percent_debutant: localStorage.getItem("percent_debutant"),
            percent_intermediaire: localStorage.getItem("percent_intermediaire"),
            percent_confirme: localStorage.getItem("percent_confirme"),
            ai_feedback: localStorage.getItem("ai_feedback"),
          };
          setResult(resolveDominant(localData));
        }
      } catch (err) {
        console.error("❌ Erreur côté front :", err);
      }
    }
    fetchResults();
  }, []);

  // 🔹 Fonction utilitaire pour gérer les égalités
  function resolveDominant(data) {
    const scores = {
      curieux: parseInt(data.percent_curieux) || 0,
      debutant: parseInt(data.percent_debutant) || 0,
      intermediaire: parseInt(data.percent_intermediaire) || 0,
      confirme: parseInt(data.percent_confirme) || 0,
    };

    const maxScore = Math.max(...Object.values(scores));
    const tied = Object.keys(scores).filter((k) => scores[k] === maxScore);

    let profil_display = "";
    let ctaTarget = "";
    let explanation = "";

    // Hiérarchie corrigée (du moins au plus avancé)
    const hierarchy = ["curieux", "debutant", "intermediaire", "confirme"];

    if (tied.length === 1) {
      // ✅ Cas 1 : un profil dominant
      profil_display = tied[0];
      ctaTarget = tied[0];
      explanation = `Ton énergie est claire : tu avances surtout comme un(e) ${tied[0]}. 
C’est ton terrain de jeu naturel. On va l’utiliser comme tremplin.`;
    } 
    else if (tied.length === 2) {
      // ✅ Cas 2 : égalité double
      profil_display = `Égalité entre ${tied.join(" et ")}`;
      const sorted = tied.sort(
        (a, b) => hierarchy.indexOf(a) - hierarchy.indexOf(b)
      );
      ctaTarget = sorted[0];
      explanation = `⚖️ Tu es à cheval entre deux énergies (${tied[0]} et ${tied[1]}). 
C’est riche mais piégeux. Pour t’ancrer et ne pas brûler d’étape, 
on commence par la capsule du niveau ${ctaTarget}. 
Tu poseras ainsi des fondations solides avant de libérer ton plein potentiel.`;
    } 
    else {
      // ✅ Cas 3 : égalité triple ou quadruple
      profil_display = "⚖️ Pas de profil dominant";
      ctaTarget = "curieux"; // capsule de base
      explanation = `⚖️ Ton profil est encore trop équilibré pour révéler une dominante. 
Pas grave : ça veut dire que tu es ouvert et adaptable. 
On te propose de commencer par la capsule ${ctaTarget} pour poser les fondations, 
et découvrir la suite avec plus de clarté.`;
    }

    return {
      ...data,
      profil_display,
      ctaTarget,
      explanation,
    };
  }

  // Typing effect feedback IA
  useEffect(() => {
    if (!result?.ai_feedback) return;
    setFeedbackText("");
    setFeedbackFinished(false);
    let i = 0;
    const interval = setInterval(() => {
      setFeedbackText(result.ai_feedback.slice(0, i + 1));
      i++;
      if (i >= result.ai_feedback.length) {
        clearInterval(interval);
        setFeedbackFinished(true);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [result]);

  // Typing effect CTA intro
  useEffect(() => {
    if (!result || !feedbackFinished) return;

    let text = "";

    if (result.profil_display.startsWith("Égalité entre")) {
      // ✅ Cas égalité double
      text = "⚖️ Tu es partagé entre deux énergies. Pour éviter de t’éparpiller, on commence par la capsule du niveau le moins avancé.";
    } else if (result.profil_display.includes("Pas de profil dominant") || result.profil_display.includes("⚖️")) {
      // ✅ Cas égalité triple/quadruple
      text = "⚖️ Aucun profil ne domine pour l’instant. On pose ensemble les fondations avec la capsule " + result.ctaTarget + ", afin de clarifier ta progression.";
    } else if (result.ctaTarget === "curieux") {
      text = "Tu observes, tu explores… il est temps de transformer ta curiosité en première action concrète.";
    } else if (result.ctaTarget === "debutant") {
      text = "Tu veux bâtir des bases solides. Cette capsule vidéo te donne les fondations essentielles pour ne plus avancer dans le brouillard.";
    } else if (result.ctaTarget === "intermediaire") {
      text = "Tu sais déjà naviguer, mais il te faut une méthode claire pour atteindre le cap confirmé.";
    } else if (result.ctaTarget === "confirme") {
      text = "Tu as l’expérience. Maintenant, il te faut la précision chirurgicale pour transformer tes efforts en résultats concrets.";
    }

    setCtaText("");
    setCtaFinished(false);
    let i = 0;
    const interval = setInterval(() => {
      setCtaText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setCtaFinished(true);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [feedbackFinished]);

  if (!result) {
    return <p style={{ color: "#fff", textAlign: "center" }}>⏳ Chargement de ton analyse...</p>;
  }

  // Bouton CTA selon profil
  let ctaButton = null;
  let ctaLink = "#";
  let ctaDisabled = false;

  if (result.ctaTarget === "curieux") {
    ctaButton = "🚀 Je lance ma Capsule Vidéo Déclic";
    ctaLink = "/capsules/declic";
  } else if (result.ctaTarget === "debutant") {
    ctaButton = "📘 Je démarre ma Capsule Vidéo Fondations";
    ctaLink = "/capsules/fondations";
  } else if (result.ctaTarget === "intermediaire") {
    ctaButton = "⚡ Je découvre ma Capsule Vidéo Stratégie";
    ctaLink = "/capsules/strategie";
  } else if (result.ctaTarget === "confirme") {
    ctaButton = "🎯 J’active ma Capsule Vidéo Chirurgicale";
    ctaLink = "/capsules/chirurgicale";
  } else if (result.ctaTarget === "none") {
    ctaButton = "🚫 Choisis ta Capsule Vidéo de départ";
    ctaLink = "#";
    ctaDisabled = true;
  }

  return (
    <>
      <style>{`
        .nb-result { font-family: Inter, system-ui, Arial, sans-serif; color:#fff; background:#0f1220; border-radius:20px; padding:24px; max-width:820px; margin:20px auto; box-shadow:0 10px 30px rgba(0,0,0,.35) }
        .nb-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px }
        .nb-title { font-size:24px; font-weight:800; color:#ec8128 }
        .nb-section { margin:20px 0 }
        .nb-label { font-size:18px; font-weight:700; margin-bottom:8px; color:#0cc0df }
        .nb-bar-wrap { background:#1f2439; border-radius:999px; overflow:hidden; margin:6px 0; height:16px }
        .nb-bar { height:100%; width:0; background: linear-gradient(90deg,#ec8128,#0cc0df); transition:width 1s ease }
        .nb-feedback, .nb-cta-intro, .nb-cta-extra { margin-left: 5px; margin-right: 5px; max-width: 100%; display: block; background:#161a2c; padding:16px; border-radius:12px; line-height:1.6; }
        .nb-feedback { font-size:15px; min-height:100px; white-space:pre-wrap }
        .nb-cta-intro { font-size: 16px; font-weight: 500; border-left: 3px solid #ec8128; }
        .nb-cta-extra { font-size: 15px; color: #cfd6ff; margin-top: 10px; }
        .nb-cta-extra .highlight { color: #ec8128; font-weight: 800; }
        .cursor { display:inline-block; width:14px; height:20px; background:#ec8128; margin-left:3px; animation: blink 1s infinite; vertical-align: bottom; }
        @keyframes blink { 0%, 50% { opacity:1 } 50.01%, 100% { opacity:0 } }
        .nb-cta-btn { display:block; margin:30px auto 0; padding:14px 22px; font-size:16px; font-weight:800; border:none; border-radius:12px; cursor:pointer; background: linear-gradient(90deg,#ec8128,#0cc0df); background-size:200% auto; color:#0f1220; transition: all .3s ease; animation: pulse 2s infinite; }
        .nb-cta-btn:disabled { opacity:.5; cursor:not-allowed; }
        .nb-cta-btn:hover:not(:disabled) { background-position:right center; }
        .nb-cta-btn:active:not(:disabled) { transform: scale(0.97); }
        @keyframes pulse { 0% { box-shadow: 0 0 8px rgba(236,129,40,.6); } 50% { box-shadow: 0 0 16px rgba(12,192,223,.9); } 100% { box-shadow: 0 0 8px rgba(236,129,40,.6); } }
      `}</style>

      <div className="nb-result">
        <div className="nb-header"><div className="nb-title">✨ Tes Résultats NeuroBreak™</div></div>

        {/* Profil dominant */}
        <div className="nb-section">
          <div className="nb-label">Profil dominant</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#ec8128" }}>
            {result.profil_display}
          </div>
        </div>

        {/* Répartition */}
        <div className="nb-section">
          <div className="nb-label">Répartition de ton profil</div>
          <div>👀 Curieux ({result.percent_curieux}%)</div>
          <div className="nb-bar-wrap"><div className="nb-bar" style={{ width: result.percent_curieux + "%" }}></div></div>
          <div>👶 Débutant ({result.percent_debutant}%)</div>
          <div className="nb-bar-wrap"><div className="nb-bar" style={{ width: result.percent_debutant + "%" }}></div></div>
          <div>📈 Intermédiaire ({result.percent_intermediaire}%)</div>
          <div className="nb-bar-wrap"><div className="nb-bar" style={{ width: result.percent_intermediaire + "%" }}></div></div>
          <div>🔥 Confirmé ({result.percent_confirme}%)</div>
          <div className="nb-bar-wrap"><div className="nb-bar" style={{ width: result.percent_confirme + "%" }}></div></div>
        </div>

        {/* Feedback IA */}
        <div className="nb-section">
          <div className="nb-label">🔥 Feedback personnalisé</div>
          <div className="nb-feedback">
            {feedbackText}
            {!feedbackFinished && <span className="cursor"></span>}
          </div>
        </div>

        {/* CTA */}
        {feedbackFinished && (
          <div className="nb-section">
            <div className="nb-label">🚀 Passe à l’action</div>
            <div className="nb-cta-intro">
              {ctaText}
              {!ctaFinished && <span className="cursor"></span>}
            </div>
            {ctaFinished && (
              <>
                {result.explanation && (
                  <p style={{ marginTop: "10px", fontSize: "14px", color: "#ffb347" }}>
                    {result.explanation}
                  </p>
                )}
                <p className="nb-cta-extra">
                  🎥 Tu as accès à une série de <span className="highlight">4 Capsules Vidéo 100% gratuites</span>,
                  conçues pour te faire monter en compétence pas à pas. Et en commençant par ta capsule personnalisée,
                  tu entres directement dans le chemin qui correspond à ton profil.
                </p>
                <a href={ctaLink}><button className="nb-cta-btn" disabled={ctaDisabled}>{ctaButton}</button></a>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}



