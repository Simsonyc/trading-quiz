"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const form = document.getElementById("nb-quiz-form");
    const slides = Array.from(document.querySelectorAll(".nb-slide"));
    const nextBtn = document.getElementById("nbNext");
    const prevBtn = document.getElementById("nbPrev");
    const progress = document.getElementById("nbProgressBar");

    if (!form || !nextBtn || !prevBtn || !progress || slides.length === 0) {
      console.warn("⛔ DOM incomplet au montage, vérifie le markup du formulaire.");
      return;
    }

    const POINTS = 10;
    let step = 0;

    function shuffleNodes(container) {
      const nodes = Array.from(container.children);
      for (let i = nodes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        container.insertBefore(nodes[j], nodes[i]);
        [nodes[i], nodes[j]] = [nodes[j], nodes[i]];
      }
    }

    function onOptionClickFactory(group) {
      return (e) => {
        const card = e.target.closest(".nb-card");
        if (!card) return;
        group.querySelectorAll(".nb-card").forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
      };
    }

    function showStep(i) {
      // gestion animation slide
      slides.forEach((s, idx) => {
        s.classList.remove("active", "slide-in-left", "slide-in-right", "slide-out-left", "slide-out-right");
        if (idx === step && idx !== i) {
          s.classList.add(i > step ? "slide-out-left" : "slide-out-right");
        }
        if (idx === i) {
          s.classList.add("active", i > step ? "slide-in-right" : "slide-in-left");
        }
      });
      prevBtn.disabled = i === 0;
      nextBtn.textContent = i === slides.length - 1 ? "Valider" : "Suivant ▶";
      const pct = Math.round((i / (slides.length - 1)) * 100);
      progress.style.width = pct + "%";
      step = i;
    }

    function validateCurrent() {
      if (step === 0) {
        const val = document.getElementById("business_description_input").value.trim();
        if (val.length < 5) {
          alert("Écris au moins quelques mots pour commencer.");
          return false;
        }
        return true;
      }
      if (step >= 1 && step <= 6) {
        const currentGroup = slides[step].querySelector(".nb-options");
        const selected = currentGroup ? currentGroup.querySelector(".nb-card.selected") : null;
        if (!selected) {
          alert("Sélectionne une option pour continuer.");
          return false;
        }
        return true;
      }
      if (step === 7) {
        const email = document.getElementById("email_input").value.trim();
        if (email.length < 5 || !email.includes("@")) {
          alert("Merci d’entrer un email valide.");
          return false;
        }
        return true;
      }
      return true;
    }

    function computeAndSubmit() {
      const bd = document.getElementById("business_description_input").value.trim();
      document.getElementById("business_description").value = bd;

      const scores = { curieux: 0, debutant: 0, intermediaire: 0, confirme: 0 };
      for (let i = 1; i <= 6; i++) {
        const group = document.querySelector(`.nb-slide[data-step="${i}"] .nb-options`);
        const selected = group ? group.querySelector(".nb-card.selected") : null;
        if (selected) {
          const prof = selected.getAttribute("data-profile");
          if (scores.hasOwnProperty(prof)) scores[prof] += POINTS;
        }
      }

      const maxPoints = POINTS * 6;
      const toPercent = (val) => Math.round((val / maxPoints) * 100);
      const perc = {
        curieux: toPercent(scores.curieux),
        debutant: toPercent(scores.debutant),
        intermediaire: toPercent(scores.intermediaire),
        confirme: toPercent(scores.confirme),
      };

      const order = ["confirme", "intermediaire", "debutant", "curieux"];
      let dominant = "curieux", best = -1;
      for (const key of order) {
        if (scores[key] > best) {
          best = scores[key];
          dominant = key;
        }
      }

      document.getElementById("score_curieux").value = scores.curieux;
      document.getElementById("score_debutant").value = scores.debutant;
      document.getElementById("score_intermediaire").value = scores.intermediaire;
      document.getElementById("score_confirme").value = scores.confirme;
      document.getElementById("percent_curieux").value = perc.curieux;
      document.getElementById("percent_debutant").value = perc.debutant;
      document.getElementById("percent_intermediaire").value = perc.intermediaire;
      document.getElementById("percent_confirme").value = perc.confirme;

      document.getElementById("profil_dominant").value = dominant;

      document.getElementById("first_name").value = document.getElementById("first_name_input").value.trim();
      document.getElementById("email").value = document.getElementById("email_input").value.trim();

      fetch("/api/saveResults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: document.getElementById("first_name").value,
          email: document.getElementById("email").value,
          business_description: document.getElementById("business_description").value,
          score_curieux: document.getElementById("score_curieux").value,
          score_debutant: document.getElementById("score_debutant").value,
          score_intermediaire: document.getElementById("score_intermediaire").value,
          score_confirme: document.getElementById("score_confirme").value,
          percent_curieux: document.getElementById("percent_curieux").value,
          percent_debutant: document.getElementById("percent_debutant").value,
          percent_intermediaire: document.getElementById("percent_intermediaire").value,
          percent_confirme: document.getElementById("percent_confirme").value,
          profil_dominant: document.getElementById("profil_dominant").value,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("✅ Réponse API :", data);
          // ✅ Stocker la réponse IA côté navigateur
          // Stocker toutes les infos nécessaires
  localStorage.setItem("profil_dominant", data.data.profil_dominant);
  localStorage.setItem("percent_curieux", data.data.percent_curieux);
  localStorage.setItem("percent_debutant", data.data.percent_debutant);
  localStorage.setItem("percent_intermediaire", data.data.percent_intermediaire);
  localStorage.setItem("percent_confirme", data.data.percent_confirme);

  if (data.data.ai_feedback) {
  localStorage.setItem("ai_feedback", data.data.ai_feedback);
}

  // Redirection
  window.location.href = "/result";
})
        .catch((err) => console.error("❌ Erreur API", err));
    }

    const optionGroups = Array.from(document.querySelectorAll(".nb-options"));
    const optionHandlers = new Map();

    optionGroups.forEach((group) => {
      shuffleNodes(group);
      const handler = onOptionClickFactory(group);
      group.addEventListener("click", handler);
      optionHandlers.set(group, handler);
    });

    const onNext = () => {
      if (!validateCurrent()) return;
      if (step < slides.length - 1) showStep(step + 1);
      else computeAndSubmit();
    };
    const onPrev = () => showStep(Math.max(0, step - 1));

    nextBtn.addEventListener("click", onNext);
    prevBtn.addEventListener("click", onPrev);

    showStep(0);

    return () => {
      nextBtn.removeEventListener("click", onNext);
      prevBtn.removeEventListener("click", onPrev);
      optionGroups.forEach((group) => {
        const h = optionHandlers.get(group);
        if (h) group.removeEventListener("click", h);
      });
    };
  }, []);

  return (
    <>
      <style>{`
        /* --- Mobile First --- */
        .nb-quiz {
          font-family: Inter, system-ui, Arial, sans-serif;
          color:#fff; background:#0f1220;
          border-radius:20px; padding:16px;
          max-width:100%; margin:10px auto;
          box-shadow:0 6px 20px rgba(0,0,0,.35);
          overflow:hidden;
        }
        .nb-header { display:flex; flex-direction:column; align-items:flex-start; gap:6px; margin-bottom:16px }
        .nb-title { font-size:18px; font-weight:800; color:#ec8128 }
        .nb-progress { height:6px; background:#1f2439; border-radius:999px; overflow:hidden; width:100% }
        .nb-progress > div { height:100%; width:0; background:linear-gradient(90deg,#0cc0df,#58e5f3); transition:width .35s ease }

        .nb-slide { display:none; opacity:0; transform:translateX(100%); position:relative }
        .nb-slide.active { display:block; opacity:1; transform:none }

        /* animations */
        .slide-in-right { animation: slideInRight .4s ease forwards }
        .slide-out-left { animation: slideOutLeft .4s ease forwards }
        .slide-in-left { animation: slideInLeft .4s ease forwards }
        .slide-out-right { animation: slideOutRight .4s ease forwards }

        @keyframes slideInRight { from{opacity:0; transform:translateX(100%)} to{opacity:1; transform:translateX(0)} }
        @keyframes slideOutLeft { from{opacity:1; transform:translateX(0)} to{opacity:0; transform:translateX(-100%)} }
        @keyframes slideInLeft { from{opacity:0; transform:translateX(-100%)} to{opacity:1; transform:translateX(0)} }
        @keyframes slideOutRight { from{opacity:1; transform:translateX(0)} to{opacity:0; transform:translateX(100%)} }

        .nb-q { font-size:18px; font-weight:700; margin-bottom:12px }
        .nb-desc { opacity:.8; margin:-4px 0 12px; font-size:13px }

        .nb-options { display:grid; grid-template-columns:1fr; gap:10px }
        .nb-card { background:#161a2c; border:2px solid transparent; border-radius:14px; padding:12px; font-size:14px; cursor:pointer; transition:all .25s ease }
        .nb-card:hover { border-color:#0cc0df; transform:translateY(-1px) }
        .nb-card.selected { border-color:#ec8128; background:#1b2036 }

        .nb-textarea, .nb-input {
          width:100%; border-radius:12px; border:2px solid #1f2439; background:#0b0e1a; color:#fff; padding:12px; font-size:14px; outline:none; margin-bottom:12px
        }
        .nb-textarea:focus, .nb-input:focus { border-color:#0cc0df }
        .nb-input { min-height:48px }

        .nb-nav {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 18px;
          align-items: center;
        }
        .nb-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: transform .15s ease, box-shadow .15s ease;
        }
        .nb-btn:disabled { opacity:.4; cursor:not-allowed }
        .nb-prev { background:#1b2036; color:#cfd6ff }
        .nb-next { background:linear-gradient(90deg,#ec8128,#0cc0df); color:#0f1220; box-shadow:0 6px 18px rgba(12,192,223,.25) }
        .nb-btn:active { transform: translateY(1px) }

        @media (min-width:640px){
          .nb-quiz { max-width:820px; padding:24px; margin:20px auto }
          .nb-header { flex-direction:row; align-items:center; justify-content:space-between }
          .nb-title { font-size:22px }
          .nb-q { font-size:22px }
          .nb-desc { font-size:14px }
          .nb-options { grid-template-columns: 1fr 1fr }
          .nb-nav { flex-direction:row; justify-content:center; gap:20px }
          .nb-btn { width:auto; min-width:140px; max-width:200px }
        }
      `}</style>

      <form id="nb-quiz-form">
        <div className="nb-quiz" id="nbQuiz">
          <div className="nb-header">
            <div className="nb-title">NeuroBreak™ — Quiz Trading</div>
            <div style={{ width: "100%" }}>
              <div className="nb-progress"><div id="nbProgressBar"></div></div>
            </div>
          </div>

          {/* Q0 → Q7 */}
          <div className="nb-slide active" data-step="0">
            <div className="nb-q">Q0 · En quelques mots, ton rapport au trading ?</div>
            <div className="nb-desc">Pas de masque. Pas de blabla. Juste brut.</div>
            <textarea className="nb-textarea" id="business_description_input" placeholder="Ex : J’observe depuis des mois… / J’ai déjà testé sans méthode…"></textarea>
            <div className="nb-footnote">Tu peux écrire 1–2 phrases rapides.</div>
          </div>

          <div className="nb-slide" data-step="1">
            <div className="nb-q">Q1 · Ton expérience en trading ?</div>
            <div className="nb-options" data-question="q1">
              <div className="nb-card" data-profile="curieux">👀 Je suis juste curieux</div>
              <div className="nb-card" data-profile="debutant">👶 Je débute totalement</div>
              <div className="nb-card" data-profile="intermediaire">📈 J’ai déjà essayé sans méthode</div>
              <div className="nb-card" data-profile="confirme">💻 J’ai de l’expérience mais peu de résultats</div>
            </div>
          </div>

          <div className="nb-slide" data-step="2">
            <div className="nb-q">Q2 · Combien tu es prêt à mettre sur la table, sans te mentir ?</div>
            <div className="nb-options" data-question="q2">
              <div className="nb-card" data-profile="curieux">💸 Moins de 20 €</div>
              <div className="nb-card" data-profile="debutant">⚡ Entre 20 et 200 €</div>
              <div className="nb-card" data-profile="intermediaire">💼 Entre 200 et 3 000 €</div>
              <div className="nb-card" data-profile="confirme">🚀 Plus de 3 000 €</div>
            </div>
          </div>

          <div className="nb-slide" data-step="3">
            <div className="nb-q">Q3 · Tu veux danser à quel rythme ?</div>
            <div className="nb-options" data-question="q3">
              <div className="nb-card" data-profile="curieux">👀 Une fois pour tester</div>
              <div className="nb-card" data-profile="debutant">🕰️ Long terme (HODL)</div>
              <div className="nb-card" data-profile="intermediaire">📅 Moyen terme (swing)</div>
              <div className="nb-card" data-profile="confirme">⚡ Court terme (scalping / day)</div>
            </div>
          </div>

          <div className="nb-slide" data-step="4">
            <div className="nb-q">Q4 · Qu’est-ce qui t’attire le plus ?</div>
            <div className="nb-options" data-question="q4">
              <div className="nb-card" data-profile="curieux">💸 D’abord voir si ça marche</div>
              <div className="nb-card" data-profile="debutant">⚖️ Faire croître mon capital pas à pas</div>
              <div className="nb-card" data-profile="intermediaire">🛡️ Sécuriser mes placements</div>
              <div className="nb-card" data-profile="confirme">📊 Maximiser mes gains vite</div>
            </div>
          </div>

          <div className="nb-slide" data-step="5">
            <div className="nb-q">Q5 · Comment tu veux piloter ton trading ?</div>
            <div className="nb-options" data-question="q5">
              <div className="nb-card" data-profile="curieux">👀 Qu’on me montre</div>
              <div className="nb-card" data-profile="debutant">🖐️ En manuel, tout contrôler</div>
              <div className="nb-card" data-profile="intermediaire">🤖 Automatisé (robots, tech)</div>
              <div className="nb-card" data-profile="confirme">🔄 Copier les pros</div>
            </div>
          </div>

          <div className="nb-slide" data-step="6">
            <div className="nb-q">Q6 · Et quand ça secoue, ta tolérance au risque est ?</div>
            <div className="nb-options" data-question="q6">
              <div className="nb-card" data-profile="curieux">👀 Je ne sais pas</div>
              <div className="nb-card" data-profile="debutant">🔍 Faible</div>
              <div className="nb-card" data-profile="intermediaire">⚡ Moyenne</div>
              <div className="nb-card" data-profile="confirme">🔥 Élevée</div>
            </div>
          </div>

          <div className="nb-slide" data-step="7">
            <div className="nb-q">Q7 · Pour recevoir ton profil complet et ta feuille de route</div>
            <div className="nb-desc">👉 Entre ton prénom et ton email. Pas de spam, juste ton résultat NeuroBreak™ personnalisé.</div>
            <input type="text" className="nb-input" id="first_name_input" placeholder="Ton prénom" />
            <input type="email" className="nb-input" id="email_input" placeholder="Ton email" required />
            <div className="nb-footnote">Ton accès est envoyé directement à cette adresse.</div>
          </div>
        </div>

        <div className="nb-nav">
          <button type="button" className="nb-btn nb-prev" id="nbPrev" disabled>◀ Précédent</button>
          <button type="button" className="nb-btn nb-next" id="nbNext">Suivant ▶</button>
        </div>

        <input type="hidden" id="business_description" name="business_description" />
        <input type="hidden" id="score_curieux" name="score_curieux" />
        <input type="hidden" id="score_debutant" name="score_debutant" />
        <input type="hidden" id="score_intermediaire" name="score_intermediaire" />
        <input type="hidden" id="score_confirme" name="score_confirme" />
        <input type="hidden" id="percent_curieux" name="percent_curieux" />
        <input type="hidden" id="percent_debutant" name="percent_debutant" />
        <input type="hidden" id="percent_intermediaire" name="percent_intermediaire" />
        <input type="hidden" id="percent_confirme" name="percent_confirme" />
        <input type="hidden" id="profil_dominant" name="profil_dominant" />
        <input type="hidden" id="first_name" name="first_name" />
        <input type="hidden" id="email" name="email" />
      </form>
    </>
  );
}



