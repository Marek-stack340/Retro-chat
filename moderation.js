function getEffectiveModeratorRole(_username, storedRole) {
  return ['owner', 'admin', 'moderator', 'tester', 'user'].includes(storedRole) ? storedRole : null;
}

function canModerateAction(actorRole, targetRole) {
  if (!actorRole) return false;
  if (actorRole === 'owner') return targetRole !== 'owner';
  if (actorRole === 'admin') return targetRole !== 'owner' && targetRole !== 'admin';
  if (actorRole === 'moderator') return targetRole !== 'owner' && targetRole !== 'admin' && targetRole !== 'moderator';
  return false;
}

module.exports = {
  getEffectiveModeratorRole,
  canModerateAction
};
