function formatDateForBan(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

function buildBanScreenData({ username, reason = 'Porušenie pravidiel', hours = 24, startedAt = Date.now(), initiator = 'Moderátor' } = {}) {
  const safeHours = Number.isFinite(Number(hours)) && Number(hours) > 0 ? Number(hours) : 24;
  const started = new Date(startedAt);
  const endsAt = new Date(started.getTime() + safeHours * 60 * 60 * 1000);

  return {
    username: String(username || 'Používateľ').trim() || 'Používateľ',
    reason: String(reason || 'Porušenie pravidiel').trim() || 'Porušenie pravidiel',
    hours: safeHours,
    startedAt: started.toISOString(),
    endsAt: endsAt.toISOString(),
    startedAtLabel: formatDateForBan(started),
    endsAtLabel: formatDateForBan(endsAt),
    initiator: String(initiator || 'Moderátor').trim() || 'Moderátor',
    mode: 'ban'
  };
}

function buildKickScreenData({ username, room = 'Spoločná', reason = 'Vyhodenie z miestnosti', initiatedAt = Date.now(), initiator = 'Moderátor' } = {}) {
  const started = new Date(initiatedAt);

  return {
    username: String(username || 'Používateľ').trim() || 'Používateľ',
    reason: String(reason || 'Vyhodenie z miestnosti').trim() || 'Vyhodenie z miestnosti',
    room: String(room || 'Spoločná').trim() || 'Spoločná',
    hours: 0,
    startedAt: started.toISOString(),
    endsAt: started.toISOString(),
    startedAtLabel: formatDateForBan(started),
    endsAtLabel: formatDateForBan(started),
    durationLabel: 'Dočasne',
    initiator: String(initiator || 'Moderátor').trim() || 'Moderátor',
    mode: 'kick'
  };
}

module.exports = {
  buildBanScreenData,
  buildKickScreenData,
  formatDateForBan
};
