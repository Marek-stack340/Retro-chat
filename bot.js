const ROBOT_NAME = 'Robot';
const ROBOT_API_KEY = process.env.ROBOT_API_KEY || process.env.OPENAI_API_KEY || 'key_tylu72F18zm4t4ee';
const ROBOT_API_BASE = (process.env.ROBOT_API_BASE || 'https://api.openai.com/v1').replace(/\/$/, '');
const ROBOT_MODEL = process.env.ROBOT_MODEL || 'gpt-4o-mini';

function normalizeRobotText(text) {
  return (text || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function generateRobotReply(input) {
  const text = normalizeRobotText(input);

  if (!text) {
    return 'Ahoj! Som Robot a som pripravený sa s tebou rozprávať. O čom chceš hovoriť?';
  }

  if (/(ahoj|hello|hi|zdravo|nazdar|servus|ciao|dobry den|dobrý deň)/.test(text)) {
    return 'Ahoj! Som Robot a rád sa s tebou rozprávam. O čom chceš dnes diskutovať?';
  }

  if (/(ako sa mas|ako sa máš|how are you|kako sa mas|je to v poriadku)/.test(text)) {
    return 'Dobre, ďakujem. Som pripravený pokračovať v rozhovore, tak mi povedz, o čom chceš hovoriť.';
  }

  if (/(co robis|čo robíš|co delas|čím sa zaoberáš|cim sa zaoberas|kde si)/.test(text)) {
    return 'Som Robot a pomáham s jednoduchou komunikáciou. Môžeme si pokecať, rozprávať alebo riešiť otázky.';
  }

  if (/(dovidenia|zbohom|na skore|nashledanou|uz|bye)/.test(text)) {
    return 'Dovidenia! Kedykoľvek ma môžeš znova osloviť a my sa budeme rozprávať ďalej.';
  }

  if (/(\?|máš|mas|chceš|chces|povieš|povies|rozpravaj|porozpravaj|pomôžeš|pomozes|potrebujem)/.test(text)) {
    return 'Rozumiem. Môžeme pokračovať v rozhovore a poďme na to krok po kroku. Povedz mi viac.';
  }

  return 'To znie zaujímavo. Som tu a rád s tebou ďalej komunikujem – povi mi viac o tom, o čom chceš hovoriť.';
}

async function generateRobotReplyFromApi(input, options = {}) {
  const userMessage = String(input || '').trim();
  if (!userMessage) {
    return generateRobotReply(userMessage);
  }

  const apiKey = options.apiKey || process.env.ROBOT_API_KEY || process.env.OPENAI_API_KEY || ROBOT_API_KEY;
  const apiBase = (options.apiBase || process.env.ROBOT_API_BASE || ROBOT_API_BASE).replace(/\/$/, '');
  const model = options.model || process.env.ROBOT_MODEL || ROBOT_MODEL;

  if (!apiKey) {
    return generateRobotReply(userMessage);
  }

  try {
    const response = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'Si Robot v Slovenskom chate. Odpovedaj krátko, priateľsky a prirodzene v slovenčine.' },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 160
      })
    });

    if (!response.ok) {
      return generateRobotReply(userMessage);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return generateRobotReply(userMessage);
    }

    return content;
  } catch (error) {
    return generateRobotReply(userMessage);
  }
}

module.exports = {
  ROBOT_NAME,
  generateRobotReply,
  generateRobotReplyFromApi,
  ROBOT_API_KEY,
  ROBOT_API_BASE,
  ROBOT_MODEL
};
