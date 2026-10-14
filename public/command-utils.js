function formatDuration(milliseconds) {
  const totalMs = Math.max(0, Number(milliseconds) || 0);
  const totalSeconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

function getPrecMessage(username) {
  const name = String(username || '').trim() || 'Používateľ';
  return `${name} je na chvíľu preč.`;
}

function getActivityStatusText(millisecondsSinceLastActivity) {
  const totalSeconds = Math.max(0, Math.floor((Number(millisecondsSinceLastActivity) || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const duration = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  return `Tvoja aktivita: ${duration} od poslednej aktivity.`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatDuration,
    getPrecMessage,
    getActivityStatusText
  };
}

if (typeof window !== 'undefined') {
  window.commandUtils = {
    formatDuration,
    getPrecMessage,
    getActivityStatusText
  };
}
