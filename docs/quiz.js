(function(){
  // ---- Récupération des éléments du quiz ----
  const form  = document.getElementById('nb-quiz-form');
  const slides = Array.from(document.querySelectorAll('.nb-slide'));
  const nextBtn = document.getElementById('nbNext');
  const prevBtn = document.getElementById('nbPrev');
  const progress = document.getElementById('nbProgressBar');

  const POINTS = 10; 
  let step = 0;

  // ---- Mélange les options à l'affichage ----
  function shuffleNodes(container){
    const nodes = Array.from(container.children);
    for(let i = nodes.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      container.appendChild(nodes[j]);
    }
  }
  document.querySelectorAll('.nb-options').forEach(group => shuffleNodes(group));

  // ---- Sélection d'option par slide ----
  document.querySelectorAll('.nb-options').forEach(group=>{
    group.addEventListener('click', (e)=>{
      const card = e.target.closest('.nb-card');
      if(!card) return;
      group.querySelectorAll('.nb-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });

  // ---- Affiche la slide en cours + barre de progression ----
  function showStep(i){
    slides.forEach(s => s.classList.remove('active'));
    slides[i].classList.add('active');
    prevBtn.disabled = (i === 0);
    nextBtn.textContent = (i === slides.length - 1) ? 'Valider' : 'Suivant ▶';
    const pct = Math.round((i / (slides.length-1)) * 100);
    progress.style.width = pct + '%';
    step = i;
  }

  // ---- Validation légère à chaque étape ----
  function validateCurrent(){
    if(step === 0){
      const val = document.getElementById('business_description_input').value.trim();
      if(val.length < 5){ alert("Écris au moins quelques mots pour commencer."); return false; }
      return true;
    }
    if(step >= 1 && step <= 6){
      const currentGroup = slides[step].querySelector('.nb-options');
      if(!currentGroup) return true;
      const selected = currentGroup.querySelector('.nb-card.selected');
      if(!selected){ alert("Sélectionne une option pour continuer."); return false; }
      return true;
    }
    if(step === 7){
      const email = document.getElementById('email_input').value.trim();
      if(email.length < 5 || !email.includes('@')){ alert("Merci d’entrer un email valide."); return false; }
      return true;
    }
    return true;
  }

  // ---- Navigation ----
  nextBtn.addEventListener('click', ()=>{
    if(!validateCurrent()) return;
    if(step < slides.length - 1){
      showStep(step + 1);
    } else {
      computeAndSubmit();
    }
  });
  prevBtn.addEventListener('click', ()=> showStep(Math.max(0, step - 1)));

  // ---- Calculs + remplissage champs hidden + submit + redirection ----
  function computeAndSubmit(){
    // 1) description libre
    const bd = document.getElementById('business_description_input').value.trim();
    document.getElementById('business_description').value = bd;

    // 2) scores
    const scores = { curieux:0, debutant:0, intermediaire:0, confirme:0 };
    for(let i=1; i<=6; i++){
      const group = document.querySelector(`.nb-slide[data-step="${i}"] .nb-options`);
      const selected = group ? group.querySelector('.nb-card.selected') : null;
      if(selected){
        const prof = selected.getAttribute('data-profile');
        if(scores.hasOwnProperty(prof)) scores[prof] += POINTS;
      }
    }

    const maxPoints = POINTS * 6;
    const toPercent = (val)=> Math.round((val / maxPoints) * 100);
    const perc = {
      curieux:       toPercent(scores.curieux),
      debutant:      toPercent(scores.debutant),
      intermediaire: toPercent(scores.intermediaire),
      confirme:      toPercent(scores.confirme)
    };

    // 3) dominant
    const order = ['confirme','intermediaire','debutant','curieux'];
    let dominant = 'curieux', best = -1;
    for(const key of order){ if(scores[key] > best){ best = scores[key]; dominant = key; } }
    const labelMap = { curieux:'Thomas', debutant:'Claire', intermediaire:'Mehdi', confirme:'Nina' };

    // 4) push dans les inputs hidden (attention aux IDs et NAMES déjà en place dans ta page)
    document.getElementById('score_curieux').value = scores.curieux;
    document.getElementById('score_debutant').value = scores.debutant;
    document.getElementById('score_intermediaire').value = scores.intermediaire;
    document.getElementById('score_confirme').value = scores.confirme;
    document.getElementById('percent_curieux').value = perc.curieux;
    document.getElementById('percent_debutant').value = perc.debutant;
    document.getElementById('percent_intermediaire').value = perc.intermediaire;
    document.getElementById('percent_confirme').value = perc.confirme;
    document.getElementById('profil_dominant').value = labelMap[dominant];

    // 5) prénom + email de la slide Q7
    document.getElementById('first_name').value = document.getElementById('first_name_input').value.trim();
    document.getElementById('email').value = document.getElementById('email_input').value.trim();

    // Logs debug (tu verras ça dans F12 > Console sur la page du quiz)
    console.log("DEBUG hidden:", {
      business_description: document.getElementById('business_description').value,
      score_curieux: document.getElementById('score_curieux').value,
      score_debutant: document.getElementById('score_debutant').value,
      score_intermediaire: document.getElementById('score_intermediaire').value,
      score_confirme: document.getElementById('score_confirme').value,
      percent_curieux: document.getElementById('percent_curieux').value,
      percent_debutant: document.getElementById('percent_debutant').value,
      percent_intermediaire: document.getElementById('percent_intermediaire').value,
      percent_confirme: document.getElementById('percent_confirme').value,
      profil_dominant: document.getElementById('profil_dominant').value,
      first_name: document.getElementById('first_name').value,
      email: document.getElementById('email').value
    });

    // 6) submit vers ton Form GHL (action déjà dans ton <form>)
    form.submit();

    // 7) redirection vers la page Résultats
    setTimeout(()=>{
      window.location.href = "https://app.gohighlevel.com/v2/preview/ey5xGslIvGm87XF8dyXM";
    }, 900);
  }

  // Init
  showStep(0);
})();
