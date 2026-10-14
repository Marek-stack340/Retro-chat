const ROBOT_NAME = 'Robot';

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

module.exports = {
  ROBOT_NAME,
  generateRobotReply
};
