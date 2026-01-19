import OpenAI from "openai";

export async function POST(req) {
  try {
    // 1) Lecture body JSON
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: "❌ Aucun body JSON reçu dans la requête." }),
        { status: 400 }
      );
    }

    // Debug : afficher si la clé est présente
    console.log("🔑 API KEY présente ?", !!process.env.OPENAI_API_KEY);

    // 2) Validation des champs requis
    if (!body || !body.profil_dominant) {
      console.error("❌ Requête incomplète :", body);
      return new Response(
        JSON.stringify({
          ok: false,
          error: "❌ Champs manquants : profil_dominant requis.",
          received: body,
        }),
        { status: 400 }
      );
    }

    console.log("📝 Données reçues du quiz :", body);

    // 3) Prompt IA

const prompt = `

Tu es Christophe, mentor NeuroBreak™, formateur et stratégiste spécialisé trading/crypto.

Tu rédiges exactement comme moi : direct, franc, pédagogique, style NeuroBreak™ (prise à contre-pied, recadrage mental, méthode > hype).

 

Analyse le profil suivant :

- Prénom : ${body.first_name || "Invité"}

- Profil dominant : ${body.profil_dominant}

- Répartition :

  Curieux : ${body.percent_curieux || 0}%

  Débutant : ${body.percent_debutant || 0}%

  Intermédiaire : ${body.percent_intermediaire || 0}%

  Confirmé : ${body.percent_confirme || 0}%

 

Ta mission :

Produis un feedback personnalisé en 8 à 10 lignes MAX, en français, en tutoyant ${body.first_name || "toi"}.

 

Contraintes de style :

- Tu interpelles ${body.first_name || "toi"} dès les 2 premières lignes

- Direct, sans langue de bois

- Zéro flatterie vide

- Tu donnes un avis d’expert (mentor / formateur / stratégiste)

- Tu mets en avant 1 FORCE du profil + 1 ANGLE MORT (danger principal)

- Tu fais une mini-claque NeuroBreak™ (prise à contre-pied / recadrage du mindset)

- Tu termines par un appel à l’action clair

 

Contenu obligatoire :

1) Donne une STRATÉGIE "3 PANIERS" adaptée au profil, avec des pourcentages.

   - Panier 1 = Base Conecta (socle)

   - Panier 2 = Accélération contrôlée

   - Panier 3 = Risque asymétrique

2) Conecta doit TOUJOURS être le Panier 1, mais son % varie selon le profil dominant :

   - Curieux : Conecta 90–95%

   - Débutant : Conecta 80–90%

   - Intermédiaire : Conecta 60–75%

   - Confirmé : Conecta 40–60%

 

Règle NeuroBreak™ à marteler en une phrase :

"On ne commence jamais par accélérer : Base → Accélération → Asymétrique."

 

Format attendu :

- 1 bloc texte (pas de liste à puces)

- Pas d’émojis

- Pas de jargon complexe

- 8 à 10 lignes max

`;

    // 4) Appel OpenAI
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("❌ OPENAI_API_KEY est manquante dans l'environnement !");
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Tu es un mentor NeuroBreak™ en trading : direct, motivant, percutant.",
        },
        { role: "user", content: prompt },
      ],
    });

    const ai_feedback = completion.choices?.[0]?.message?.content || "⚠️ Feedback indisponible.";

    // 5) Réponse au front
    return new Response(
      JSON.stringify({
        ok: true,
        message: "✅ Analyse IA générée",
        data: { ...body, ai_feedback },
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Erreur API interne :", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500 }
    );
  }
}

