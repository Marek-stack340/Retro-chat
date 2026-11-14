const ownerUsernames = new Set(['owner', 'správca', 'spravca', 'administrator']);
const adminUsernames = new Set(['admin', 'administrator', 'spravca', 'správca']);
const moderatorUsernames = new Set(['moderator', 'moderator1', 'moderator2', 'mod', 'chatmod', 'moderatorchat', 'moderator-sk', 'marek', 'marekc']);

function normalizeModerationName(value) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function isOwnerName(value) {
  return ownerUsernames.has(normalizeModerationName(value));
}

function isAdminName(value) {
  return adminUsernames.has(normalizeModerationName(value));
}

function isModeratorName(value) {
  const normalized = normalizeModerationName(value);
  return moderatorUsernames.has(normalized) || normalized.includes('moderator') || normalized.includes('mod');
}

function getModeratorRole(name) {
  if (isOwnerName(name)) return 'owner';
  if (isAdminName(name)) return 'admin';
  if (isModeratorName(name)) return 'moderator';
  return null;
}

function getEffectiveModeratorRole(name, storedRole) {
  if (storedRole && ['owner', 'admin', 'moderator', 'tester', 'user'].includes(storedRole)) {
    return storedRole;
  }
  return getModeratorRole(name);
}

function canModerateAction(actorRole, targetRole) {
  if (!actorRole) return false;
  if (actorRole === 'owner') return targetRole !== 'owner';
  if (actorRole === 'admin') return targetRole !== 'owner' && targetRole !== 'admin';
  if (actorRole === 'moderator') return targetRole !== 'owner' && targetRole !== 'admin' && targetRole !== 'moderator';
  return false;
}

module.exports = {
  ownerUsernames,
  adminUsernames,
  moderatorUsernames,
  isOwnerName,
  isAdminName,
  isModeratorName,
  getModeratorRole,
  getEffectiveModeratorRole,
  canModerateAction
};
