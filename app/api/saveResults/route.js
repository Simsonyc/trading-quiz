import OpenAI from "openai";

export async function POST(req) {
  try {
    // 1) Données envoyées depuis le quiz
    const body = await req.json();
    console.log("📝 Données reçues du quiz :", body);

    // 2) Prompt IA NeuroBreak™
    const prompt = `
    Tu es un mentor NeuroBreak™, expert en pédagogie trading.
    Analyse le profil suivant :
	- Prénom de la personne : ${body.first_name}
    - Profil dominant : ${body.profil_dominant}
    - Répartition :
      Curieux : ${body.percent_curieux}%
      Débutant : ${body.percent_debutant}%
      Intermédiaire : ${body.percent_intermediaire}%
      Confirmé : ${body.percent_confirme}%

    Donne un feedback personnalisé en 8-10 lignes :
    - en interpellant directement ${body.first_name} dans les premières ligne du texte
	- Direct, franc, sans langue de bois
    - Avec des métaphores impactantes (combat, navigation, stratégie…)
    - Met en évidence la **force** du profil mais aussi ses **angles morts**
    - Termine par un appel à l’action clair en interpellant directement ${body.first_name}(ex: oser, structurer, passer à l’étape suivante)
    - Pas de flatterie vide. Ton ferme mais motivant.
    `;

    // 3) Appel OpenAI
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Tu es un mentor NeuroBreak™ en trading : direct, motivant, percutant." },
        { role: "user", content: prompt },
      ],
    });

    const ai_feedback = completion.choices[0].message.content;

    // 4) Réponse au front
    return new Response(
      JSON.stringify({
        ok: true,
        message: "Analyse IA générée",
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
