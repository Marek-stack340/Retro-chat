const socket = io();
const messagesDiv = document.getElementById('messages');
const sendBtn = document.getElementById('send-btn');
const quickQuizBtn = document.getElementById('quick-quiz-btn');
const messageInput = document.getElementById('message-input');
const activeUsersCount = document.getElementById('active-users-count');
const usersList = document.getElementById('users-list');
const currentUsernameDisplay = document.getElementById('current-username-display');
const navLogout = document.getElementById('nav-logout');
const navHelp = document.getElementById('nav-help');
const navProfile = document.getElementById('nav-profile');
const navFriends = document.getElementById('nav-friends');
const navIgnore = document.getElementById('nav-ignore');
const navSettings = document.getElementById('nav-settings');
const navQuicklink = document.getElementById('nav-quicklink');
const navMessenger = document.getElementById('nav-messenger');
const chatApp = document.querySelector('.chat-app');
const newsHistoryToggle = document.getElementById('news-history-toggle');
const newsHistoryPanel = document.getElementById('news-history-panel');
const newsHistoryClose = document.getElementById('news-history-close');
const newsHistoryBackdrop = document.getElementById('news-history-backdrop');
const newsHistoryList = document.getElementById('news-history-list');
const quicklinkOverlay = document.getElementById('quicklink-overlay');
const quicklinkClose = document.getElementById('quicklink-close');
const quicklinkTargetInput = document.getElementById('quicklink-target-input');
const quicklinkContinue = document.getElementById('quicklink-continue');
const privateThreadHeader = document.getElementById('private-thread-header');
const privateThreadName = document.getElementById('private-thread-name');
const privateThreadAvatar = document.getElementById('private-thread-avatar');

const privateStatus = document.getElementById('private-status');
const privateTargetNameDisplay = document.getElementById('private-target-name');

// Nastavenia odosielania
const sendSettingsModal = document.getElementById('send-settings-modal');
const sendSettingsPrivateToggle = document.getElementById('send-settings-private-toggle');
const sendSettingsTarget = document.getElementById('send-settings-target');
const sendSettingsSave = document.getElementById('send-settings-save');
const sendSettingsCancel = document.getElementById('send-settings-cancel');

const countdownOverlay = document.getElementById('countdown-overlay');
const countdownValueEl = document.getElementById('countdown-value');
const countdownLabelEl = document.getElementById('countdown-label');
const profileModal = document.getElementById('profile-modal');
const profileCloseBtn = document.getElementById('profile-close');
const profileCancelBtn = document.getElementById('profile-cancel');
const profileSaveBtn = document.getElementById('profile-save');
const profileAvatarInput = document.getElementById('profile-avatar-input');
const profileAvatarPreview = document.getElementById('profile-avatar-preview');
const profileAvatarEmpty = document.getElementById('profile-avatar-empty');
const profileBioInput = document.getElementById('profile-bio');
const profileAgeInput = document.getElementById('profile-age');
const profileBirthdateInput = document.getElementById('profile-birthdate');
const profileCityInput = document.getElementById('profile-city');
const profileStatusInput = document.getElementById('profile-status');
const profileHobbiesInput = document.getElementById('profile-hobbies');
const snakeGameButton = document.getElementById('snake-game-button');
const snakeGameModal = document.getElementById('snake-game-modal');
const snakeGameBoard = document.getElementById('snake-game-board');
const snakeGameScore = document.getElementById('snake-game-score');
const snakeGameOverlay = document.getElementById('snake-game-overlay');
const snakeGameClose = document.getElementById('snake-game-close');
const snakeGameRetry = document.getElementById('snake-game-retry');
const snakeGameBack = document.getElementById('snake-game-back');
const quizGameButton = document.getElementById('quiz-game-button');
const diceGameButton = document.getElementById('dice-game-button');
const wordGameButton = document.getElementById('word-game-button');
const sudokuGameButton = document.getElementById('sudoku-game-button');
const gameLauncherButton = document.getElementById('game-launch-button');
const gameModal = document.getElementById('game-modal');
const gameTitle = document.getElementById('game-title');
const gameBody = document.getElementById('game-body');
const gameClose = document.getElementById('game-close');
const topicNameInput = document.getElementById('topic-name-input');
const createTopicBtn = document.getElementById('create-topic-btn');
const securityBadge = document.getElementById('security-badge');
const securityMessage = document.getElementById('security-message');
const securityCheckBtn = document.getElementById('security-check-btn');
const commandsToggle = document.getElementById('commands-toggle');
const commandsBlock = document.getElementById('commands-block');
const moderationCenterBtn = document.getElementById('moderation-center-btn');
const moderationBellBtn = document.getElementById('moderation-bell-btn');
const moderationNotificationBadge = document.getElementById('moderation-notification-badge');
const moderationCenterModal = document.getElementById('moderation-center-modal');
const moderationCenterClose = document.getElementById('moderation-center-close');
const moderationDiscardReportBtn = document.getElementById('moderation-discard-report-btn');
const moderationBellOpen = document.getElementById('moderation-bell-open');
const moderationStats = document.getElementById('moderation-stats');
const moderationContent = document.getElementById('moderation-content');
const moderationRolePill = document.getElementById('moderation-pill-role');
const moderationRoleSubtitle = document.getElementById('moderation-role-subtitle');
const moderationTabs = document.querySelectorAll('.moderation-tab');
const moderationActionModal = document.getElementById('moderation-action-modal');
const moderationActionClose = document.getElementById('moderation-action-close');
const moderationActionCancel = document.getElementById('moderation-action-cancel');
const moderationActionConfirm = document.getElementById('moderation-action-confirm');
const moderationActionTarget = document.getElementById('moderation-action-target');
const moderationActionRoom = document.getElementById('moderation-action-room');
const moderationActionReason = document.getElementById('moderation-action-reason');
const moderationActionDuration = document.getElementById('moderation-action-duration');
const moderationActionNote = document.getElementById('moderation-action-note');
const appealModal = document.getElementById('appeal-modal');
const appealUsernameInput = document.getElementById('appeal-username');
const appealTypeInput = document.getElementById('appeal-type');
const appealReasonInput = document.getElementById('appeal-reason');
const appealTextInput = document.getElementById('appeal-text');
const appealSubmitBtn = document.getElementById('appeal-submit-btn');
const appealModalClose = document.getElementById('appeal-modal-close');
const banOverlay = document.getElementById('ban-overlay');
const banTitleEl = document.getElementById('ban-title');
const banSubtitleEl = document.getElementById('ban-subtitle');
const banWarningEl = document.getElementById('ban-warning');
const banReasonEl = document.getElementById('ban-reason');
const banHoursEl = document.getElementById('ban-hours');
const banStartEl = document.getElementById('ban-start');
const banEndEl = document.getElementById('ban-end');
const banRetryBtn = document.getElementById('ban-retry-btn');
const banLogoutBtn = document.getElementById('ban-logout-btn');
const banCloseBtn = document.getElementById('ban-close-btn');
const banAppealBtn = document.getElementById('ban-appeal-btn');

if (chatApp) {
  chatApp.setAttribute('data-theme', 'light');
}

function openModerationActionModal({ type = 'ban', target = '', room = currentRoom || 'Spoločná', reason = 'Porušenie pravidiel', durationHours = 24, note = '' } = {}) {
  if (!moderationActionModal || !moderationActionTarget || !moderationActionRoom || !moderationActionReason || !moderationActionDuration || !moderationActionNote) return;
  pendingModerationAction = { type, target, room, reason, durationHours, note };
  moderationActionTarget.value = target;
  moderationActionRoom.value = room;
  moderationActionReason.value = reason;
  moderationActionDuration.value = String(durationHours || 0);
  moderationActionNote.value = note;
  moderationActionModal.style.display = 'flex';
}

function closeModerationActionModal() {
  if (moderationActionModal) moderationActionModal.style.display = 'none';
  pendingModerationAction = null;
}

function showBanOverlay(data = {}) {
  if (!banOverlay) return;

  const isTest = Boolean(data.isTest || data.testMode);
  const isKick = data.mode === 'kick' || /vyhoden|kick/i.test(String(data.reason || ''));
  const reason = data.reason || (isKick ? 'Vyhodenie z miestnosti' : 'Porušenie pravidiel');
  const hours = Number(data.hours || 0);
  const startDate = data.startedAt ? new Date(data.startedAt) : new Date();
  const endDate = data.endsAt ? new Date(data.endsAt) : new Date(startDate.getTime() + Math.max(hours, 0) * 60 * 60 * 1000);
  const hoursLabel = data.durationLabel || (isKick ? 'Dočasne' : `${hours || 24} hodín`);

  if (banTitleEl) {
    banTitleEl.textContent = isKick ? 'Bol si kicknutý z chatu' : 'Účet zablokovaný';
  }
  if (banSubtitleEl) {
    banSubtitleEl.textContent = isKick
      ? 'Prístup do Oddych Chatu je dočasne obmedzený.'
      : 'Prístup do Oddych Chatu je dočasne odobraný';
  }
  if (banWarningEl) {
    if (isTest) {
      banWarningEl.innerHTML = 'TESTOVACÍ REŽIM – NEJDE O SKUTOČNÝ TREST<br><br><strong>Toto je iba ukážka moderátorskej stránky. Tvoj účet nie je zablokovaný a tvoj prístup do chatu zostáva aktívny.</strong>';
    } else {
      banWarningEl.textContent = isKick
        ? 'Moderátorský tím rozhodol o tvojom vykopnutí z chatu.'
        : 'Moderátorským rozhodnutím došlo k pozastaveniu tvojho účtu.';
    }
  }
  if (banReasonEl) banReasonEl.textContent = reason;
  if (banHoursEl) banHoursEl.textContent = hoursLabel;
  if (banStartEl) banStartEl.textContent = new Intl.DateTimeFormat('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(startDate);
  if (banEndEl) banEndEl.textContent = new Intl.DateTimeFormat('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(endDate);

  banOverlay.style.display = 'flex';
  if (isTest) {
    if (chatApp) chatApp.style.display = 'block';
    banOverlay.dataset.testMode = 'true';
    banOverlay.classList.add('test-mode');
  } else {
    if (chatApp) chatApp.style.display = 'none';
    banOverlay.classList.remove('test-mode');
    delete banOverlay.dataset.testMode;
  }
  document.body.classList.add('ban-screen-active');
}

function hideBanOverlay() {
  if (banOverlay) banOverlay.style.display = 'none';
  if (chatApp) chatApp.style.display = 'block';
  document.body.classList.remove('ban-screen-active');
  banOverlay && banOverlay.classList.remove('test-mode');
  delete banOverlay?.dataset.testMode;
}

if (banRetryBtn) {
  banRetryBtn.addEventListener('click', () => {
    if (banOverlay && banOverlay.dataset.testMode === 'true') {
      hideBanOverlay();
      return;
    }
    window.location.reload();
  });
}

if (banLogoutBtn) {
  banLogoutBtn.addEventListener('click', () => {
    if (banOverlay && banOverlay.dataset.testMode === 'true') {
      hideBanOverlay();
      return;
    }
    localStorage.clear();
    window.location.href = '/';
  });
}

if (banCloseBtn) {
  banCloseBtn.addEventListener('click', () => {
    if (banOverlay && banOverlay.dataset.testMode === 'true') {
      hideBanOverlay();
      return;
    }
    hideBanOverlay();
    window.location.href = '/';
  });
}

if (banAppealBtn) {
  banAppealBtn.addEventListener('click', () => {
    showAppealForm({
      type: 'BAN',
      reason: (banReasonEl && banReasonEl.textContent) || 'Porušenie pravidiel',
      user: currentUsername || localStorage.getItem('chatUsername') || 'Používateľ'
    });
  });
}

const moderationState = {
  summary: { totalReports: 0, totalAppeals: 0, openAppeals: 0, totalActions: 0, activeUsers: 0 },
  reports: [],
  appeals: [],
  notifications: [],
  history: []
};
let unreadNotificationCount = 0;
let activeModerationTab = 'overview';
let pendingModerationAction = null;
let selectedNotificationIds = new Set();
let robotConversationEnabled = false;

function getCurrentRoleName() {
  const name = normalizeModerationName(currentUsername || localStorage.getItem('chatUsername') || '');
  if (!name) return 'user';
  if (['owner', 'administrator', 'spravca', 'správca'].includes(name)) return 'owner';
  if (name === 'marek' || name === 'marekc' || name.includes('moderator') || name.includes('mod')) return 'moderator';
  return 'user';
}

function updateModerationAccess() {
  const allowed = ['owner', 'moderator'].includes(getCurrentRoleName());
  if (moderationCenterBtn) moderationCenterBtn.style.display = allowed ? 'inline-flex' : 'none';
  if (moderationBellBtn) moderationBellBtn.style.display = allowed ? 'inline-flex' : 'none';
  if (moderationRolePill) {
    const role = getCurrentRoleName();
    moderationRolePill.textContent = role === 'owner' ? 'Správca' : (role === 'moderator' ? 'Moderátor' : 'Používateľ');
  }
  if (moderationRoleSubtitle) {
    const role = getCurrentRoleName();
    moderationRoleSubtitle.textContent = role === 'owner' ? '[Admin chatu]' : (role === 'moderator' ? '[Moderátor chatu]' : '[Používateľ]');
  }
}

function formatModerationDate(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  } catch (error) {
    return '—';
  }
}

function getRoleBadgeMarkup(role) {
  const normalizedRole = String(role || '').toLowerCase();
  if (normalizedRole === 'moderator') {
    return '<span class="moderation-role-badge moderator" title="Moderátor">🛡 Moderátor</span>';
  }
  if (normalizedRole === 'owner') {
    return '<span class="moderation-role-badge owner" title="Správca">👑 Správca</span>';
  }
  return '<span class="moderation-role-badge user" title="Používateľ">Užívateľ</span>';
}

function renderModerationStats() {
  if (!moderationStats) return;
  const stats = moderationState.summary || {};
  moderationStats.innerHTML = `
    <div class="metric-card"><span>Hlášeni</span><strong>${stats.totalReports || 0}</strong></div>
    <div class="metric-card"><span>Odvolania</span><strong>${stats.totalAppeals || 0}</strong></div>
    <div class="metric-card"><span>Otvorené</span><strong>${stats.openAppeals || 0}</strong></div>
    <div class="metric-card"><span>Akcie</span><strong>${stats.totalActions || 0}</strong></div>
  `;
}

function dismissModerationNotification(notificationId) {
  if (!notificationId) return;

  moderationState.notifications = (moderationState.notifications || []).filter((notification) => {
    const currentId = notification && (notification.id || notification._id || `${notification.title || 'notification'}-${notification.timestamp || Date.now()}`);
    return String(currentId) !== String(notificationId);
  });

  selectedNotificationIds.delete(String(notificationId));
  unreadNotificationCount = Math.max(0, unreadNotificationCount - 1);
  renderModerationPanel();
}

function dismissSelectedNotifications() {
  const ids = Array.from(selectedNotificationIds);
  if (!ids.length) return;

  const confirmMessage = ids.length > 1
    ? 'Naozaj chceš zmazať tieto notifikácie? Po potvrdení sa odstránia.'
    : 'Naozaj chceš zmazať túto notifikáciu? Po potvrdení sa odstráni.';

  const confirmed = window.confirm(confirmMessage);
  if (!confirmed) return;

  ids.forEach((notificationId) => dismissModerationNotification(notificationId));
  selectedNotificationIds.clear();
  renderModerationPanel();
}

function parseReportSelection(input, reports) {
  if (!Array.isArray(reports) || !reports.length) return [];
  const normalized = String(input || '').trim();
  if (!normalized) return [];
  if (normalized.toLowerCase() === 'všetky') return reports.map((item) => String(item.id));

  const asNumber = Number(normalized);
  if (Number.isInteger(asNumber) && asNumber > 0) {
    const entry = reports[asNumber - 1];
    return entry ? [String(entry.id)] : [];
  }

  const exact = reports.find((entry) => String(entry.id).toLowerCase() === normalized.toLowerCase());
  return exact ? [String(exact.id)] : [];
}

function showDiscardReportConfirm(reportIds) {
  const ids = Array.isArray(reportIds) ? reportIds.filter(Boolean) : [];
  if (!ids.length) return;

  const existing = document.getElementById('moderation-discard-report-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'moderation-discard-report-modal';
  modal.className = 'moderation-custom-confirm';
  modal.innerHTML = `
    <div class="moderation-custom-confirm-box">
      <div class="moderation-custom-confirm-title">Naozaj chceš aby report bol zmazaný?</div>
      <div class="moderation-custom-confirm-actions">
        <button type="button" class="moderation-action approve moderation-confirm-yes">Áno</button>
        <button type="button" class="moderation-action reject moderation-confirm-no">Nie</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.moderation-confirm-yes')?.addEventListener('click', () => {
    socket.emit('moderation:discard-report', { ids });
    modal.remove();
  });

  modal.querySelector('.moderation-confirm-no')?.addEventListener('click', () => {
    modal.remove();
  });
}

function discardSelectedReports() {
  const reports = moderationState.reports || [];
  if (!reports.length) {
    if (moderationContent) {
      moderationContent.innerHTML = '<div class="moderation-empty">Žiadne reporty na zmazanie.</div>';
    }
    return;
  }

  const optionsText = reports.map((item, index) => `${index + 1}. ${item.reportedUser || 'Používateľ'} · ${String(item.reason || '—').slice(0, 50)}`).join('\n');
  const answer = window.prompt(`Ktorý report chceš zahodiť?\n\n${optionsText}\n\nNapíš číslo reportu alebo "všetky":`, '');
  if (answer === null) return;

  const selectedIds = parseReportSelection(answer, reports);
  if (!selectedIds.length) {
    showToast('Neplatný výber reportu.');
    return;
  }

  showDiscardReportConfirm(selectedIds);
}

function renderModerationContent() {
  if (!moderationContent) return;
  const reports = moderationState.reports || [];
  const appeals = moderationState.appeals || [];
  const history = moderationState.history || [];
  const notifications = moderationState.notifications || [];

  if (activeModerationTab === 'notifications') {
    if (!notifications.length) {
      moderationContent.innerHTML = '<div class="moderation-empty">Žiadne notifikácie na zobrazenie.</div>';
      return;
    }

    moderationContent.innerHTML = `
      <div class="moderation-actions-row moderation-notification-toolbar">
        <button class="moderation-action reject moderation-discard-selected" type="button">${selectedNotificationIds.size ? `Zahodiť notifikácie (${selectedNotificationIds.size})` : 'Zahodiť notifikácie'}</button>
        ${selectedNotificationIds.size ? '<button class="moderation-action request moderation-clear-selection" type="button">Vymazať výber</button>' : ''}
      </div>
      ${notifications.map((notification) => {
        const id = notification && (notification.id || notification._id || `${notification.title || 'notification'}-${notification.timestamp || Date.now()}`);
        const selected = selectedNotificationIds.has(String(id));
        return `
          <div class="moderation-item moderation-notification-item ${selected ? 'selected' : ''}">
            <label class="moderation-notification-select">
              <input class="moderation-notification-checkbox" type="checkbox" data-notification-id="${String(id)}" ${selected ? 'checked' : ''}>
              <span>Vybrať</span>
            </label>
            <div class="moderation-item-head"><strong>${notification.title || 'Notifikácia'}</strong><span>${notification.type || 'info'}</span></div>
            <div class="moderation-item-row"><span>Správa:</span><strong>${notification.message || notification.body || '—'}</strong></div>
            <div class="moderation-item-row"><span>Zdroj:</span><strong>${notification.source || notification.actor || 'Systém'}</strong></div>
            <div class="moderation-item-row"><span>Čas:</span><strong>${formatModerationDate(notification.timestamp || notification.createdAt)}</strong></div>
            <div class="moderation-actions-row">
              <button class="moderation-action reject moderation-dismiss-notification" data-notification-id="${String(id)}" type="button">Zahodiť túto notifikáciu</button>
            </div>
          </div>
        `;
      }).join('')}
    `;

    moderationContent.querySelectorAll('.moderation-dismiss-notification').forEach((button) => {
      button.addEventListener('click', () => {
        dismissModerationNotification(button.dataset.notificationId);
      });
    });

    moderationContent.querySelectorAll('.moderation-notification-checkbox').forEach((checkbox) => {
      checkbox.addEventListener('change', (event) => {
        const id = event.target.dataset.notificationId;
        if (!id) return;
        if (event.target.checked) {
          selectedNotificationIds.add(String(id));
        } else {
          selectedNotificationIds.delete(String(id));
        }
        renderModerationPanel();
      });
    });

    const discardSelectedBtn = moderationContent.querySelector('.moderation-discard-selected');
    if (discardSelectedBtn) {
      discardSelectedBtn.addEventListener('click', () => {
        if (!selectedNotificationIds.size) {
          moderationContent.querySelectorAll('.moderation-notification-checkbox').forEach((checkbox) => {
            checkbox.checked = true;
            selectedNotificationIds.add(String(checkbox.dataset.notificationId));
          });
          if (!selectedNotificationIds.size) return;
        }
        dismissSelectedNotifications();
      });
    }

    const clearSelectionBtn = moderationContent.querySelector('.moderation-clear-selection');
    if (clearSelectionBtn) {
      clearSelectionBtn.addEventListener('click', () => {
        selectedNotificationIds.clear();
        moderationContent.querySelectorAll('.moderation-notification-checkbox').forEach((checkbox) => {
          checkbox.checked = false;
        });
        renderModerationPanel();
      });
    }
    return;
  }

  if (activeModerationTab === 'users') {
    const userQuery = (document.getElementById('moderation-user-search') || {}).value || '';
    const targetName = String(userQuery || '').trim().toLowerCase();
    const usersToShow = Array.isArray(activeUsers)
      ? activeUsers.filter((user) => !targetName || user.username.toLowerCase().includes(targetName))
      : [];

    moderationContent.innerHTML = `
      <div class="moderation-user-controls">
        <input id="moderation-user-search" class="moderation-user-search" type="text" value="${String(userQuery || '').replace(/"/g, '&quot;')}" placeholder="Vyhľadaj používateľa podľa prezývky...">
        <div class="moderation-actions-row">
          <input id="moderation-role-target" class="moderation-user-search" type="text" placeholder="Napíš meno používateľa a priraď moderátora" value="">
          <button class="moderation-action approve moderation-role-assign-manual" type="button">Priradiť moderátora</button>
        </div>
      </div>
      ${!usersToShow.length ? '<div class="moderation-empty">Nenašli sa žiadni používatelia.</div>' : ''}
      ${usersToShow.map((user) => {
        const punishments = history.filter((entry) => (entry.target || '').toLowerCase() === user.username.toLowerCase());
        const recent = punishments.slice(0, 3).map((entry) => `<li>${entry.type || 'Akcia'} · ${entry.reason || '—'} · ${formatModerationDate(entry.timestamp)}</li>`).join('');
        const roleBadge = getRoleBadgeMarkup(user.role);
        const canManageModeratorRole = ['owner', 'moderator'].includes(getCurrentRoleName()) && user.role !== 'owner';
        return `
          <div class="moderation-item moderation-user-card">
            <div class="moderation-item-head">
              <strong>${user.username}</strong>
              ${roleBadge}
            </div>
            <div class="moderation-item-row"><span>Stav:</span><strong>${user.role === 'owner' ? 'Správca' : (user.role === 'moderator' ? 'Moderátor' : (user.role === 'tester' ? 'Tester' : 'Aktívny'))}</strong></div>
            <div class="moderation-item-row"><span>Miesto:</span><strong>${currentRoom || 'Spoločná'}</strong></div>
            <div class="moderation-item-row"><span>História trestov:</span><strong>${punishments.length ? 'Nie' : 'Žiadne'}</strong></div>
            <ul class="moderation-user-history">${recent || '<li>Žiadne záznamy.</li>'}</ul>
            <div class="moderation-actions-row">
              <button class="moderation-action request moderation-user-action" data-action="kick" data-target="${user.username}" type="button">Kick</button>
              <button class="moderation-action reject moderation-user-action" data-action="ban" data-target="${user.username}" type="button">Ban</button>
              ${canManageModeratorRole ? `<button class="moderation-action ${user.role === 'moderator' ? 'approve' : 'request'} moderation-role-toggle" data-target="${user.username}" data-role="${user.role === 'moderator' ? 'user' : 'moderator'}" type="button">${user.role === 'moderator' ? 'Odobrať rolu' : 'Priradiť rolu: Moderátor'}</button>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    `;

    moderationContent.querySelectorAll('.moderation-user-action').forEach((button) => {
      button.addEventListener('click', () => {
        const { action, target } = button.dataset;
        openModerationActionModal({
          type: action === 'ban' ? 'ban' : 'kick',
          target,
          room: currentRoom || 'Spoločná',
          reason: action === 'ban' ? 'Porušenie pravidiel' : 'Vyhodenie z miestnosti',
          durationHours: action === 'ban' ? 24 : 0
        });
      });
    });

    moderationContent.querySelectorAll('.moderation-role-toggle').forEach((button) => {
      button.addEventListener('click', () => {
        const target = button.dataset.target;
        const nextRole = button.dataset.role === 'moderator' ? 'moderator' : 'user';
        if (!target) return;
        socket.emit('moderation:assign-role', { target, role: nextRole });
      });
    });

    const manualAssignBtn = moderationContent.querySelector('.moderation-role-assign-manual');
    if (manualAssignBtn) {
      manualAssignBtn.addEventListener('click', () => {
        const input = document.getElementById('moderation-role-target');
        const target = String(input && input.value ? input.value : '').trim();
        if (!target) {
          showToast('Napíš meno používateľa, ktorému chceš priradiť rolu Moderátor.');
          return;
        }
        socket.emit('moderation:assign-role', { target, role: 'moderator' });
      });
    }

    const userSearchInput = document.getElementById('moderation-user-search');
    if (userSearchInput) {
      userSearchInput.addEventListener('input', (event) => {
        const value = String(event.target.value || '');
        const searchField = document.getElementById('moderation-user-search');
        if (searchField) searchField.value = value;
        renderModerationContent();
      });
    }
    return;
  }

  if (activeModerationTab === 'reports') {
    if (!reports.length) {
      moderationContent.innerHTML = '<div class="moderation-empty">Žiadne nové nahlásenia.</div>';
      return;
    }
    moderationContent.innerHTML = reports.map((item) => `
      <div class="moderation-item">
        <div class="moderation-item-head"><strong>${item.reportedUser || 'Používateľ'}</strong><span>${item.status || 'pending'}</span></div>
        <div class="moderation-item-row"><span>Reportér:</span><strong>${item.reporter || '—'}</strong></div>
        <div class="moderation-item-row"><span>Miesto:</span><strong>${item.room || 'Spoločná'}</strong></div>
        <div class="moderation-item-row"><span>Dôvod:</span><strong>${item.reason || '—'}</strong></div>
        <div class="moderation-item-row"><span>Čas:</span><strong>${formatModerationDate(item.createdAt)}</strong></div>
      </div>
    `).join('');
    return;
  }

  if (activeModerationTab === 'appeals') {
    if (!appeals.length) {
      moderationContent.innerHTML = '<div class="moderation-empty">Žiadne odvolania čakajúce na spracovanie.</div>';
      return;
    }
    moderationContent.innerHTML = appeals.map((item) => `
      <div class="moderation-item">
        <div class="moderation-item-head"><strong>${item.id}</strong><span>${item.status || 'pending'}</span></div>
        <div class="moderation-item-row"><span>Používateľ:</span><strong>${item.username || '—'}</strong></div>
        <div class="moderation-item-row"><span>Typ:</span><strong>${item.type || 'BAN'}</strong></div>
        <div class="moderation-item-row"><span>Dôvod:</span><strong>${item.reason || '—'}</strong></div>
        <div class="moderation-item-row"><span>Text:</span><strong>${item.text || '—'}</strong></div>
        <div class="moderation-item-row"><span>Čas:</span><strong>${formatModerationDate(item.createdAt)}</strong></div>
        <div class="moderation-actions-row">
          <button class="moderation-action approve" data-appeal-id="${item.id}" data-action="approved">Schváliť</button>
          <button class="moderation-action reject" data-appeal-id="${item.id}" data-action="rejected">Zamietnuť</button>
          <button class="moderation-action request" data-appeal-id="${item.id}" data-action="review">Ďalšie info</button>
        </div>
      </div>
    `).join('');
    moderationContent.querySelectorAll('.moderation-action').forEach((button) => {
      button.addEventListener('click', () => {
        const { appealId, action } = button.dataset;
        socket.emit('appeal:decide', { id: appealId, decision: action });
      });
    });
    return;
  }

  if (activeModerationTab === 'history') {
    if (!history.length) {
      moderationContent.innerHTML = '<div class="moderation-empty">História moderátorských akcií je prázdna.</div>';
      return;
    }
    moderationContent.innerHTML = history.slice(0, 12).map((item) => `
      <div class="moderation-item">
        <div class="moderation-item-head"><strong>${item.type || 'Akcia'}</strong><span>${item.isTest ? 'TEST' : 'SKUTOČNÉ'}</span></div>
        <div class="moderation-item-row"><span>Actor:</span><strong>${item.actor || '—'}</strong></div>
        <div class="moderation-item-row"><span>Target:</span><strong>${item.target || '—'}</strong></div>
        <div class="moderation-item-row"><span>Dôvod:</span><strong>${item.reason || '—'}</strong></div>
        <div class="moderation-item-row"><span>Dĺžka:</span><strong>${item.durationHours ? `${item.durationHours} h` : '—'}</strong></div>
        <div class="moderation-item-row"><span>Čas:</span><strong>${formatModerationDate(item.timestamp || item.createdAt)}</strong></div>
      </div>
    `).join('');
    return;
  }

  moderationContent.innerHTML = `
    <div class="moderation-overview-box">
      <h3>Prehľad</h3>
      <p>Aktívne nahlásenia: <strong>${reports.length}</strong></p>
      <p>Odvolania: <strong>${appeals.length}</strong></p>
      <p>Upozornenia: <strong>${notifications.length}</strong></p>
      <p>Aktívni používatelia: <strong>${moderationState.summary.activeUsers || 0}</strong></p>
    </div>
  `;
}

function renderModerationPanel() {
  renderModerationStats();
  renderModerationContent();
  if (moderationNotificationBadge) {
    moderationNotificationBadge.textContent = String(unreadNotificationCount || 0);
    moderationNotificationBadge.style.display = unreadNotificationCount > 0 ? 'inline-flex' : 'none';
  }
  if (moderationBellOpen) {
    moderationBellOpen.textContent = `🔔 Notifikácie (${unreadNotificationCount || 0})`;
  }
}

function openModerationCenter() {
  if (!moderationCenterModal) return;
  moderationCenterModal.style.display = 'flex';
  socket.emit('moderation-center:request');
}

function closeModerationCenter() {
  if (moderationCenterModal) moderationCenterModal.style.display = 'none';
}

function showAppealForm({ type = 'BAN', reason = 'Porušenie pravidiel', user = currentUsername || localStorage.getItem('chatUsername') || 'Používateľ' } = {}) {
  if (!appealModal || !appealUsernameInput || !appealTypeInput || !appealReasonInput) return;
  appealUsernameInput.value = user;
  appealTypeInput.value = type;
  appealReasonInput.value = reason;
  appealTextInput.value = '';
  appealModal.style.display = 'flex';
}

function closeAppealForm() {
  if (appealModal) appealModal.style.display = 'none';
}

function playCinkTone() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const audioContext = new AudioCtx();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 1200;
    gainNode.gain.value = 0.09;
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    setTimeout(() => { oscillator.stop(); audioContext.close(); }, 130);
  } catch (error) {
    // browser sound fallback
  }
}

if (moderationCenterBtn) {
  moderationCenterBtn.addEventListener('click', openModerationCenter);
}
if (moderationDiscardReportBtn) {
  moderationDiscardReportBtn.addEventListener('click', discardSelectedReports);
}
if (moderationCenterClose) moderationCenterClose.addEventListener('click', closeModerationCenter);
if (moderationBellBtn) moderationBellBtn.addEventListener('click', () => {
  activeModerationTab = 'notifications';
  moderationTabs.forEach((item) => item.classList.toggle('active', item.dataset.tab === 'notifications'));
  renderModerationContent();
  openModerationCenter();
});
if (moderationBellOpen) moderationBellOpen.addEventListener('click', () => {
  activeModerationTab = 'notifications';
  moderationTabs.forEach((item) => item.classList.toggle('active', item.dataset.tab === 'notifications'));
  renderModerationContent();
  openModerationCenter();
});
if (moderationActionClose) moderationActionClose.addEventListener('click', closeModerationActionModal);
if (moderationActionCancel) moderationActionCancel.addEventListener('click', closeModerationActionModal);
if (moderationActionConfirm) moderationActionConfirm.addEventListener('click', () => {
  if (!pendingModerationAction) return;
  const selectedMode = document.querySelector('input[name="moderation-mode"]:checked')?.value || 'test';
  const payload = {
    ...pendingModerationAction,
    mode: selectedMode,
    reason: moderationActionReason && moderationActionReason.value ? moderationActionReason.value : pendingModerationAction.reason,
    room: moderationActionRoom && moderationActionRoom.value ? moderationActionRoom.value : pendingModerationAction.room,
    durationHours: Number(moderationActionDuration && moderationActionDuration.value ? moderationActionDuration.value : pendingModerationAction.durationHours || 0),
    note: moderationActionNote && moderationActionNote.value ? moderationActionNote.value : pendingModerationAction.note || '',
    actor: currentUsername || localStorage.getItem('chatUsername') || 'Správca'
  };
  socket.emit('moderation:execute', payload);
  closeModerationActionModal();
});
if (appealModalClose) appealModalClose.addEventListener('click', closeAppealForm);
if (appealSubmitBtn) {
  appealSubmitBtn.addEventListener('click', () => {
    const text = (appealTextInput && appealTextInput.value || '').trim();
    if (!text) {
      showToast('Napíš dôvod, prečo si myslíš, že ide o omyl.');
      return;
    }
    socket.emit('submit-appeal', {
      type: appealTypeInput ? appealTypeInput.value : 'BAN',
      reason: appealReasonInput ? appealReasonInput.value : 'Porušenie pravidiel',
      text,
      room: currentRoom || 'Spoločná',
      user: currentUsername || localStorage.getItem('chatUsername') || 'Používateľ'
    });
    closeAppealForm();
  });
}
moderationTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    activeModerationTab = tab.dataset.tab;
    moderationTabs.forEach((item) => item.classList.toggle('active', item === tab));
    renderModerationContent();
  });
});

let publicMessageHistory = [];
let currentRoom = normalizeRoomName(localStorage.getItem('chatCurrentRoom') || 'Spoločná');
const newsHistoryStorageKey = 'chatNewsHistoryV1';
function loadNewsHistoryEntries() {
  try {
    const stored = localStorage.getItem(newsHistoryStorageKey);
    if (!stored) {
      return [
        {
          title: 'Otázka dňa',
          body: 'V chate sa teraz každý deň zobrazuje nová otázka dňa, aby bol priestor pre zábavné a príjemné rozhovory.',
          createdAt: '2026-11-13T00:00:00.000Z'
        },
        {
          title: 'Modernizácia chatu',
          body: 'Chat bol upravený tak, aby bol čistejší, jednoduchší a lepšie prispôsobený každodenným rozhovorom.',
          createdAt: '2026-11-13T00:00:00.000Z'
        },
        {
          title: 'Filter nadávok',
          body: 'Filter nadávok bol upravený. Namiesto dvojitých hashtagov sa nadávky maskujú na znaky #.',
          createdAt: '2026-07-19T00:00:00.000Z'
        }
      ];
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}
function loadProfileData() {
  try {
    const raw = localStorage.getItem('chatProfileV1');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) {
    return {};
  }
}
function saveProfileData(data) {
  localStorage.setItem('chatProfileV1', JSON.stringify(data));
}
function renderProfileForm() {
  const data = loadProfileData();
  if (profileBioInput) profileBioInput.value = data.bio || '';
  if (profileAgeInput) profileAgeInput.value = data.age || '';
  if (profileBirthdateInput) profileBirthdateInput.value = data.birthdate || '';
  if (profileCityInput) profileCityInput.value = data.city || '';
  if (profileStatusInput) profileStatusInput.value = data.status || '';
  if (profileHobbiesInput) profileHobbiesInput.value = data.hobbies || '';

  if (profileAvatarPreview && profileAvatarEmpty) {
    if (data.avatarDataUrl) {
      profileAvatarPreview.src = data.avatarDataUrl;
      profileAvatarPreview.style.display = 'block';
      profileAvatarEmpty.style.display = 'none';
    } else {
      profileAvatarPreview.removeAttribute('src');
      profileAvatarPreview.style.display = 'none';
      profileAvatarEmpty.style.display = 'flex';
    }
  }
}
function openProfileModal() {
  renderProfileForm();
  if (profileModal) profileModal.style.display = 'flex';
}
function closeProfileModal() {
  if (profileModal) profileModal.style.display = 'none';
}
let newsHistoryEntries = loadNewsHistoryEntries();
let lastClearTime = Number(localStorage.getItem('chatClearAt') || 0) || 0;
let countdownState = null;
let quizLobbyPlayers = new Set();
let activeWordGame = null;
let quizRoundState = null;
const chatLoadingOverlay = document.getElementById('chat-loading-overlay');
const quizQuestions = [
  { category: 'Geografia', question: 'Ktoré mesto je hlavné mesto Slovenska?', answer: 'Bratislava' },
  { category: 'Veda', question: 'Ktorá planéta je známa ako Červená planéta?', answer: 'Mars' },
  { category: 'História', question: 'Kto bol prvým človekom na Mesiaci?', answer: 'Neil Armstrong' },
  { category: 'Kultúra', question: 'Aký je slovenský názov pre jablko?', answer: 'Jablko' },
  { category: 'Matematika', question: 'Koľko je 7 × 8?', answer: '56' },
  { category: 'Zvieratá', question: 'Aké zviera je najväčšie na svete?', answer: 'Modrý veľryb' },
  { category: 'Technológia', question: 'Čo znamená skratka CPU?', answer: 'Central Processing Unit' },
  { category: 'Sport', question: 'V ktorom športovom odvetví sa hrajú sety a body?', answer: 'Tenis' },
  { category: 'Astronómia', question: 'Aký je názov najbližšej planéty k Slnku?', answer: 'Merkúr' },
  { category: 'Literatúra', question: 'Kto napísal román Hamlet?', answer: 'William Shakespeare' },
  { category: 'Geografia', question: 'Ako sa volá hlavné mesto Turecka?', answer: 'Ankara' },
  { category: 'Veda', question: 'Aký chemický prvok má značku O?', answer: 'Kyslík' },
  { category: 'História', question: 'Ktorý český kráľ bol známy ako svätý?', answer: 'Václav IV' },
  { category: 'Sport', question: 'V akom športe sa hrá na ihrisku s 11 hráčmi?', answer: 'Futbal' },
  { category: 'Astronómia', question: 'Ktorá planéta má najviac prstencov?', answer: 'Saturn' },
  { category: 'Technológia', question: 'Čo znamená skratka Wi‑Fi?', answer: 'Wireless Fidelity' },
  { category: 'Zvieratá', question: 'Ako sa volá najrýchlejšie zviera na svete?', answer: 'Gepard' },
  { category: 'Matematika', question: 'Koľko je 9 × 9?', answer: '81' },
  { category: 'Kultúra', question: 'Ako sa volá najvyšší vrch Slovenska?', answer: 'Gerlachovský štít' },
  { category: 'Literatúra', question: 'Kto napísal román Malý princ?', answer: 'Antoine de Saint-Exupéry' }
];
const DAILY_QUIZ_CALENDAR_KEY = 'chatDailyQuizCalendarV1';
const DAILY_QUIZ_SCHEDULE_KEY = 'chatDailyQuizScheduleV1';

function loadCalendarEntries() {
  try {
    const raw = localStorage.getItem(DAILY_QUIZ_CALENDAR_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function formatGoogleCalendarDate(dateValue) {
  const date = new Date(`${dateValue}T20:00:00`);
  const end = new Date(date.getTime() + 60 * 60 * 1000);
  const format = (value) => value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return { start: format(date), end: format(end) };
}

function openGoogleCalendarQuiz(dateValue = new Date().toISOString().slice(0, 10)) {
  const { start, end } = formatGoogleCalendarDate(dateValue);
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', 'Večerný kvíz');
  url.searchParams.set('dates', `${start}/${end}`);
  url.searchParams.set('details', 'Večerný kvíz dňa v komunitnom chate.');
  url.searchParams.set('location', 'Chat');
  const finalUrl = url.toString();
  window.open(finalUrl, '_blank', 'noopener,noreferrer');
  return finalUrl;
}

function saveCalendarEntries(entries) {
  localStorage.setItem(DAILY_QUIZ_CALENDAR_KEY, JSON.stringify(entries));
}

function addCalendarEntryForUser(username, event) {
  const safeName = String(username || '').trim();
  if (!safeName) return;
  const entries = loadCalendarEntries();
  const next = entries.filter((item) => !(String(item.username || '').toLowerCase() === safeName.toLowerCase() && item.type === 'daily-quiz'));
  next.push({
    id: `${safeName.toLowerCase()}-daily-quiz-${Date.now()}`,
    username: safeName,
    type: 'daily-quiz',
    title: 'Večerný kvíz',
    time: '20:00',
    date: event && event.date ? event.date : new Date().toISOString().slice(0, 10),
    status: 'confirmed',
    createdAt: new Date().toISOString()
  });
  saveCalendarEntries(next);
  renderDailyQuizCalendar();
}

function removeCalendarEntryForUser(username) {
  const safeName = String(username || '').trim();
  if (!safeName) return;
  const entries = loadCalendarEntries().filter((item) => !(String(item.username || '').toLowerCase() === safeName.toLowerCase() && item.type === 'daily-quiz'));
  saveCalendarEntries(entries);
  renderDailyQuizCalendar();
}

function renderDailyQuizCalendar() {
  const target = document.getElementById('daily-quiz-calendar');
  if (!target) return;
  const entries = loadCalendarEntries().filter((item) => String(item.username || '').toLowerCase() === String(currentUsername || '').toLowerCase() && item.type === 'daily-quiz');
  target.innerHTML = entries.length
    ? entries.map((entry) => `
        <div class="calendar-item">
          <div class="calendar-title">${entry.title || 'Večerný kvíz'}</div>
          <div class="calendar-meta">${entry.date || new Date().toISOString().slice(0, 10)} • ${entry.time || '20:00'}</div>
        </div>
      `).join('')
    : '<div class="calendar-empty">Žiadny plánovaný kvíz.</div>';
}

function createDailyQuizCalendarBlock() {
  return;
}

function handleDailyQuizReply(username, text) {
  const normalized = String(text || '').trim().toLowerCase();
  const safeName = String(username || currentUsername || '').trim();
  if (!safeName || !normalized) return;
  if (normalized === 'ano' || normalized === 'áno') {
    const dateKey = new Date().toISOString().slice(0, 10);
    addCalendarEntryForUser(safeName, { date: dateKey });
    openGoogleCalendarQuiz(dateKey);
    addMessage({
      username: 'Chat',
      text: 'Zapísal som ťa do Google Kalendára na večerný kvíz o 20:00. Keď napíšeš NIE, zruším to.',
      private: true,
      timestamp: new Date().toISOString(),
      self: false
    });
    return;
  }
  if (normalized === 'nie') {
    removeCalendarEntryForUser(safeName);
    addMessage({
      username: 'Chat',
      text: 'Zrušil som ti pripomienku na večerný kvíz. Keď budeš chcieť, môžeš sa pripojiť znova.',
      private: true,
      timestamp: new Date().toISOString(),
      self: false
    });
  }
}

function runDailyQuizScheduler() {
  if (window.__dailyQuizSchedulerActive) return;
  window.__dailyQuizSchedulerActive = true;
  setInterval(() => {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const scheduled = localStorage.getItem(DAILY_QUIZ_SCHEDULE_KEY);
    const beforeQuizTime = now.getHours() < 20 || (now.getHours() === 20 && now.getMinutes() < 0);

    if ((now.getHours() === 19 && now.getMinutes() === 55 && now.getSeconds() < 10 || now.getHours() === 19 && now.getMinutes() === 56 && now.getSeconds() < 10 || now.getHours() === 19 && now.getMinutes() === 57 && now.getSeconds() < 10 || now.getHours() === 19 && now.getMinutes() === 58 && now.getSeconds() < 10 || now.getHours() === 19 && now.getMinutes() === 59 && now.getSeconds() < 10) && scheduled !== todayKey) {
      localStorage.setItem(DAILY_QUIZ_SCHEDULE_KEY, todayKey);
      addQuizJoinInviteMessage();
      addMessage({
        username: 'Chat',
        text: 'Dneska o 20:00 kvíz dňa.',
        room: currentRoom || 'Spoločná',
        timestamp: new Date().toISOString()
      });
      addMessage({
        system: true,
        text: '🔔 Dneska o 20:00 kvíz dňa.',
        timestamp: new Date().toISOString()
      });
    }

    if (now.getHours() === 20 && now.getMinutes() === 0 && now.getSeconds() < 5 && !scheduled) {
      localStorage.setItem(DAILY_QUIZ_SCHEDULE_KEY, todayKey);
    }
  }, 3000);
}

function hideChatLoadingOverlay() {
  if (chatLoadingOverlay) {
    chatLoadingOverlay.classList.add('hidden');
  }
}

window.addEventListener('load', () => {
  setTimeout(hideChatLoadingOverlay, 450);
});

const createRoomInput = document.getElementById('create-room');
const createRoomBtn = document.getElementById('create-room-btn');
const roomsList = document.querySelector('.rooms-list');
const emojiLine = document.getElementById('emoji-line');
const emojiSet = ['🙂', '😃', '😍', '😎', '😏', '😡', '😂', '🙃', '😮'];
const reactionSet = ['👍', '❤️', '😂', '😮', '😡'];
const diceRiddles = [
  { value: 1, text: 'Hádanka: Čo je to, čo máš v rukách, ale nikdy nevidíš?' },
  { value: 2, text: 'Hádanka: Čo má dvere, ale neotvára ich nikto?' },
  { value: 3, text: 'Hádanka: Čo môže bežať, aj keď nemá nohy?' },
  { value: 4, text: 'Hádanka: Čo má steny, ale nie je dom?' },
  { value: 5, text: 'Hádanka: Čo môžeš držať v prstoch, ale nikdy nedržíš?' },
  { value: 6, text: 'Hádanka: Čo máš vždy pred sebou, ale nikdy nevidíš?' }
];
const savedUsername = localStorage.getItem('chatUsername');
let currentUsername = savedUsername ? savedUsername.trim() : 'Správca';
let autoPrivateEnabled = localStorage.getItem('autoPrivateEnabled') === 'true';
let autoPrivateTargetName = localStorage.getItem('autoPrivateTargetName') || '';
let privateTargetId = null;
let privateTargetName = null;
let activeUsers = [];
const ignoreList = new Set(JSON.parse(localStorage.getItem('chatIgnoreList') || '[]'));
const friendList = new Set(JSON.parse(localStorage.getItem('chatFriendList') || '[]'));
const onlineFriends = new Set();
let messengerMode = localStorage.getItem('chatMessengerMode') === 'true';
let lastSpokenAt = Date.now();
let joinHistoryPromptState = 'pending';

const CHAT_INACTIVITY_MS = 60 * 60 * 1000;
const MESSENGER_INACTIVITY_MS = 60 * 60 * 1000;

function loadChatStats() {
  try {
    const raw = localStorage.getItem('chatStatsV1');
    if (!raw) return { users: {}, popularity: {}, edges: {} };
    const parsed = JSON.parse(raw);
    return {
      users: parsed.users || {},
      popularity: parsed.popularity || {},
      edges: parsed.edges || {}
    };
  } catch (_) {
    return { users: {}, popularity: {}, edges: {} };
  }
}

function saveChatStats(stats) {
  localStorage.setItem('chatStatsV1', JSON.stringify(stats));
}

function updateActivityStats(username, delta) {
  const key = normalizeName(username);
  if (!key) return;
  const stats = loadChatStats();
  if (!stats.users[key]) {
    stats.users[key] = { displayName: username, messages: 0, voiceNotes: 0, lastActive: 0 };
  }
  const user = stats.users[key];
  user.displayName = username;
  user.messages += Number(delta.messages || 0);
  user.voiceNotes += Number(delta.voiceNotes || 0);
  user.lastActive = Date.now();
  saveChatStats(stats);
}

function updatePopularity(targetUsername, isAdded) {
  const actor = normalizeName(currentUsername);
  const target = normalizeName(targetUsername);
  if (!actor || !target || actor === target) return;

  const stats = loadChatStats();
  const edgeKey = `${actor}->${target}`;
  const edgeExists = !!stats.edges[edgeKey];

  if (isAdded && !edgeExists) {
    stats.edges[edgeKey] = 1;
    stats.popularity[target] = Number(stats.popularity[target] || 0) + 1;
  }

  if (!isAdded && edgeExists) {
    delete stats.edges[edgeKey];
    stats.popularity[target] = Math.max(0, Number(stats.popularity[target] || 0) - 1);
  }

  if (!stats.users[target]) {
    stats.users[target] = { displayName: targetUsername, messages: 0, voiceNotes: 0, lastActive: 0 };
  }
  stats.users[target].displayName = targetUsername;
  saveChatStats(stats);
}

function markSpokenActivity() {
  lastSpokenAt = Date.now();
}

function currentInactivityLimit() {
  return messengerMode ? MESSENGER_INACTIVITY_MS : CHAT_INACTIVITY_MS;
}

function performAutoLogout(reason) {
  alert(reason);
  localStorage.removeItem('chatUsername');
  localStorage.removeItem('chatRegistered');
  window.location.href = '/';
}

function checkInactivityLogout() {
  if (!localStorage.getItem('chatUsername')) return;
  const inactiveMs = Date.now() - lastSpokenAt;
  if (inactiveMs >= currentInactivityLimit()) {
    performAutoLogout(messengerMode
      ? 'Bol si 60 min neaktívny v Messengeri. Bol si automaticky odhlásený.'
      : 'Bol si 60 min neaktívny v chate. Bol si automaticky odhlásený.');
  }
}

function applyMessengerMode() {
  if (!chatApp || !navMessenger) return;
  chatApp.classList.toggle('messenger-mode', messengerMode);
  navMessenger.textContent = messengerMode ? 'Messenger ON' : 'Messenger';
  navMessenger.style.background = messengerMode ? '#2563eb' : '';
}

function isAwayFromChat() {
  const hidden = document.visibilityState !== 'visible';
  const notFocused = typeof document.hasFocus === 'function' ? !document.hasFocus() : false;
  return hidden || notFocused;
}

function containsSuspiciousClientText(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return false;
  return /(?:https?:\/\/|www\.|mailto:|javascript:|data:|<script|on\w+\s*=)/i.test(trimmed) || trimmed.length > 280;
}

function updateSecurityPanel(payload) {
  const safeMessage = payload && payload.message ? String(payload.message).replace(/\n/g, ' • ') : 'Chat je chránený pred podvodmi, škodlivým obsahom a útokmi.';
  if (securityBadge) {
    securityBadge.textContent = payload && payload.active === false ? '⚠ Ochrana neaktívna' : '🛡 Ochrana aktívna';
  }
  if (securityMessage) {
    securityMessage.textContent = safeMessage;
  }
}

function getActivityStatusText() {
  const totalMs = Math.max(0, Date.now() - lastSpokenAt);
  if (window.commandUtils && typeof window.commandUtils.getActivityStatusText === 'function') {
    return window.commandUtils.getActivityStatusText(totalMs);
  }
  const totalSeconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const duration = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  return `Tvoja aktivita: ${duration} od poslednej aktivity.`;
}

function toggleCommandsPanel() {
  if (!commandsBlock) return;
  const isHidden = commandsBlock.style.display === 'none';
  commandsBlock.style.display = isHidden ? 'block' : 'none';
  if (commandsToggle) {
    commandsToggle.textContent = isHidden ? 'Zavrieť príkazy' : 'Príkazy';
  }
}

function openNewsHistory() {
  if (!newsHistoryPanel || !newsHistoryBackdrop) return;
  newsHistoryPanel.classList.add('open');
  newsHistoryBackdrop.classList.add('open');
  newsHistoryPanel.setAttribute('aria-hidden', 'false');
  newsHistoryBackdrop.setAttribute('aria-hidden', 'false');
}

function closeNewsHistory() {
  if (!newsHistoryPanel || !newsHistoryBackdrop) return;
  newsHistoryPanel.classList.remove('open');
  newsHistoryBackdrop.classList.remove('open');
  newsHistoryPanel.setAttribute('aria-hidden', 'true');
  newsHistoryBackdrop.setAttribute('aria-hidden', 'true');
}

async function enterCountdownFullscreen() {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
  } catch (_) {
    // Fullscreen can fail in some browsers; keep the overlay visible anyway.
  }
}

async function exitCountdownFullscreen() {
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen();
    }
  } catch (_) {
    // Ignore fullscreen exit errors.
  }
}

function speakCountdownMessage(text) {
  try {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'sk-SK';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (_) {
    // Ignore speech errors and keep the countdown working.
  }
}

function renderCountdownOverlay(value, total, headlineText) {
  if (!countdownOverlay || !countdownValueEl || !countdownLabelEl) return;
  countdownValueEl.textContent = String(value);
  countdownLabelEl.textContent = headlineText || (total ? `Odpočítavam od ${total}` : 'Odpočítavanie');
  countdownOverlay.classList.add('visible');
  countdownOverlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('countdown-active');
}

function hideCountdownOverlay() {
  if (countdownOverlay) {
    countdownOverlay.classList.remove('visible');
    countdownOverlay.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('countdown-active');
}

function stopCountdown() {
  if (!countdownState) {
    hideCountdownOverlay();
    return;
  }
  if (countdownState.timer) {
    clearInterval(countdownState.timer);
  }
  if (countdownState.finishTimeout) {
    clearTimeout(countdownState.finishTimeout);
  }
  countdownState = null;
  hideCountdownOverlay();
  exitCountdownFullscreen();
}

function startCountdown(rawValue, options = {}) {
  const total = Math.floor(Number(rawValue));
  if (!Number.isFinite(total) || total < 1) {
    showToast('Použi .countdown číslo väčšie ako 0, napríklad .countdown 10');
    return;
  }
  if (total > 9999) {
    showToast('Skús číslo od 1 do 9999.');
    return;
  }

  stopCountdown();
  countdownState = {
    total,
    current: total,
    timer: null,
    finishTimeout: null,
    headline: options.headline || `Odpočítavam od ${total}`,
    finishText: options.finishText || 'Štart!',
    onFinish: typeof options.onFinish === 'function' ? options.onFinish : null
  };

  renderCountdownOverlay(total, total, countdownState.headline);
  enterCountdownFullscreen();

  countdownState.timer = setInterval(() => {
    if (!countdownState) return;
    countdownState.current -= 1;

    if (countdownState.current <= 0) {
      if (countdownState.timer) {
        clearInterval(countdownState.timer);
        countdownState.timer = null;
      }
      if (countdownValueEl) countdownValueEl.textContent = countdownState.finishText;
      if (countdownLabelEl) countdownLabelEl.textContent = countdownState.headline;
      countdownState.finishTimeout = setTimeout(() => {
        if (countdownState && countdownState.onFinish) {
          const onFinish = countdownState.onFinish;
          countdownState = null;
          onFinish();
        }
        stopCountdown();
      }, 1000);
      return;
    }

    renderCountdownOverlay(countdownState.current, countdownState.total, countdownState.headline);
  }, 1000);
}

function normalizeQuizAnswer(value) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '');
}

function openGameModal(title) {
  if (!gameModal || !gameTitle || !gameBody) return;
  gameTitle.textContent = title;
  gameModal.style.display = 'flex';
  gameModal.setAttribute('aria-hidden', 'false');
}

function closeGameModal() {
  if (!gameModal) return;
  gameModal.style.display = 'none';
  gameModal.setAttribute('aria-hidden', 'true');
}

function renderGameLauncher() {
  openGameModal('Hry/kvízy');
  gameBody.innerHTML = `
    <div class="game-card">
      <h3>Vyber hru</h3>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button class="game-action-btn" type="button" data-game-choice="quiz">Spustiť kvíz</button>
        <button class="game-button quiz-game-button" type="button" data-game-choice="quiz-lobby">🎯 Kvíz</button>
        <button class="game-button dice-game-button" type="button" data-game-choice="dice">🎲 Kocky</button>
        <button class="game-button word-game-button" type="button" data-game-choice="word">🔠 Hádanie slov</button>
        <button class="game-button sudoku-game-button" type="button" data-game-choice="sudoku">🧩 Sudoku</button>
        <button class="snake-game-button" type="button" data-game-choice="snake">🎮 Hadík</button>
      </div>
    </div>
  `;

  gameBody.querySelectorAll('[data-game-choice]').forEach((button) => {
    button.addEventListener('click', () => {
      const choice = button.getAttribute('data-game-choice');
      if (choice === 'quiz' || choice === 'quiz-lobby') {
        quizLobbyPlayers = new Set([currentUsername]);
        renderQuizLobby();
      }
      if (choice === 'dice') {
        showDiceGame();
      }
      if (choice === 'word') {
        showWordGame();
      }
      if (choice === 'sudoku') {
        showSudokuGame();
      }
      if (choice === 'snake') {
        openSnakeGame();
      }
    });
  });
}

function addQuizJoinInviteMessage() {
  if (!messagesDiv) return;
  if (messagesDiv.querySelector('.system-quiz-invite')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'system-msg system-quiz-invite';

  const label = document.createElement('span');
  label.className = 'system-quiz-invite-label';
  label.textContent = 'Pripojiť sa ku kvízu';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'system-quiz-join-btn';
  button.textContent = 'Pripojiť sa ku kvízu';
  button.addEventListener('click', () => {
    renderQuizLobby();
  });

  wrapper.appendChild(label);
  wrapper.appendChild(button);
  messagesDiv.appendChild(wrapper);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function renderQuizLobby() {
  const users = Array.from(new Set([
    currentUsername,
    ...activeUsers.map((user) => user.username || user.name || user)
  ])).filter(Boolean);
  const joined = [...quizLobbyPlayers.size ? quizLobbyPlayers : [currentUsername]];
  const joinable = users.filter((name) => !joined.includes(name));

  addQuizJoinInviteMessage();
  openGameModal('Kvíz');
  gameBody.innerHTML = `
    <div class="game-card">
      <h3>Lobby kvízu</h3>
      <p>Pripravuje sa nová hra. Ostatní hráči sa môžu pridať počas 30 sekúnd. Ak sa nepripojí nikto, hra začne len s tebou.</p>
      <div class="game-lobby-grid">
        ${joined.map((name) => `<span class="game-player-pill">${name}</span>`).join('')}
      </div>
    </div>
    ${joinable.length ? `
      <div class="game-card">
        <h3>Pridať hráča</h3>
        <div class="game-answer-row">
          ${joinable.map((name) => `<button class="game-join-btn" type="button" data-join-player="${name}">+ ${name}</button>`).join('')}
        </div>
      </div>
    ` : ''}
    <div class="game-lobby-actions">
      <button class="game-secondary-btn" type="button" id="close-quiz-lobby">Zavrieť</button>
      <button class="game-action-btn" type="button" id="start-quiz-lobby">Spustiť kvíz</button>
    </div>
  `;

  gameBody.querySelectorAll('[data-join-player]').forEach((button) => {
    button.addEventListener('click', () => {
      const name = button.getAttribute('data-join-player');
      if (!name) return;
      quizLobbyPlayers.add(name);
      renderQuizLobby();
    });
  });

  const closeQuizLobby = document.getElementById('close-quiz-lobby');
  if (closeQuizLobby) {
    closeQuizLobby.addEventListener('click', () => {
      closeGameModal();
    });
  }

  const startQuizLobby = document.getElementById('start-quiz-lobby');
  if (startQuizLobby) {
    startQuizLobby.addEventListener('click', () => {
      quizLobbyPlayers = new Set(joined);
      startCountdown(30, {
        headline: 'Kvíz sa spúšťa',
        finishText: 'Kvíz začal!',
        onFinish: () => {
          showQuizRound();
        }
      });
    });
  }
}

function showQuizRound() {
  const quizSequence = [...quizQuestions].sort(() => Math.random() - 0.5).slice(0, 10);
  quizRoundState = {
    questions: quizSequence,
    index: 0,
    correct: 0,
    remaining: 10,
    timer: null,
    finished: false
  };

  const renderCurrentQuestion = () => {
    const question = quizRoundState?.questions[quizRoundState.index];
    if (!question) {
      return;
    }

    openGameModal('Kvíz');
    gameBody.innerHTML = `
      <div class="game-card">
        <h3>${question.category}</h3>
        <p class="game-question">${question.question}</p>
        <div id="quiz-timer" class="quiz-timer">10s</div>
      </div>
      <div class="game-card">
        <div class="game-answer-row">
          <input id="quiz-answer-input" class="game-text-input" type="text" placeholder="Zadaj odpoveď" aria-label="Odpoveď na otázku" />
          <button id="submit-quiz-answer" class="game-action-btn" type="button">Odpovedať</button>
        </div>
      </div>
      <div id="quiz-result" class="game-status">Máš 10 sekúnd na odpoveď.</div>
    `;

    const timerEl = document.getElementById('quiz-timer');
    const resultElNode = document.getElementById('quiz-result');
    const answerInput = document.getElementById('quiz-answer-input');
    const submitBtn = document.getElementById('submit-quiz-answer');

    function stopQuizTimer() {
      if (quizRoundState && quizRoundState.timer) {
        clearInterval(quizRoundState.timer);
        quizRoundState.timer = null;
      }
    }

    function advanceToNextQuestion(isCorrect, finalText) {
      if (!quizRoundState || quizRoundState.finished) return;
      if (isCorrect) {
        quizRoundState.correct += 1;
      }

      const currentIndex = quizRoundState.index;
      const nextIndex = currentIndex + 1;
      const nextQuestion = quizRoundState.questions[nextIndex];
      resultElNode.className = isCorrect ? 'game-result' : 'game-result fail';
      resultElNode.textContent = finalText;
      stopQuizTimer();

      if (!nextQuestion) {
        quizRoundState.finished = true;
        const scoreText = `Kvíz skončil. Máš ${quizRoundState.correct} z ${quizRoundState.questions.length} správnych odpovedí.`;
        setTimeout(() => {
          resultElNode.className = 'game-result';
          resultElNode.textContent = scoreText;
          showToast(`Kvíz sa skončil: ${quizRoundState.correct}/${quizRoundState.questions.length}`);
          setTimeout(() => closeGameModal(), 1600);
        }, 900);
        return;
      }

      setTimeout(() => {
        if (!quizRoundState || quizRoundState.finished) return;
        quizRoundState.index = nextIndex;
        renderCurrentQuestion();
      }, 1200);
    }

    const submitAnswer = () => {
      const currentQuestion = quizRoundState?.questions[quizRoundState.index];
      if (!currentQuestion) {
        return;
      }

      const submission = normalizeQuizAnswer(answerInput?.value || '');
      const expected = normalizeQuizAnswer(currentQuestion.answer);

      if (!submission) {
        resultElNode.className = 'game-result fail';
        resultElNode.textContent = 'Najprv zadaj odpoveď.';
        return;
      }

      if (submission === expected) {
        advanceToNextQuestion(true, `Správne! Odpoveď bola ${currentQuestion.answer}.`);
        return;
      }

      advanceToNextQuestion(false, `Nesprávne. Správna odpoveď bola ${currentQuestion.answer}.`);
    };

    submitBtn?.addEventListener('click', submitAnswer);
    answerInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitAnswer();
      }
    });

    quizRoundState.remaining = 10;
    if (timerEl) {
      timerEl.textContent = '10s';
    }
    quizRoundState.timer = setInterval(() => {
      if (!quizRoundState || quizRoundState.finished) return;
      quizRoundState.remaining -= 1;
      if (timerEl) {
        timerEl.textContent = `${Math.max(quizRoundState.remaining, 0)}s`;
      }
      if (quizRoundState.remaining <= 0) {
        stopQuizTimer();
        const currentQuestion = quizRoundState.questions[quizRoundState.index];
        if (currentQuestion) {
          advanceToNextQuestion(false, `Čas vypršal. Správna odpoveď bola ${currentQuestion.answer}.`);
        }
      }
    }, 1000);
  };

  renderCurrentQuestion();
}

function showDiceGame() {
  openGameModal('Kocky');
  gameBody.innerHTML = `
    <div class="game-card">
      <h3>Hodenie kockou</h3>
      <div id="dice-display" class="game-dice-display">🎲</div>
    </div>
    <div class="game-lobby-actions">
      <button id="roll-dice-btn" class="game-action-btn" type="button">Hodiť kockou</button>
    </div>
  `;

  document.getElementById('roll-dice-btn')?.addEventListener('click', () => {
    const result = Math.floor(Math.random() * 6) + 1;
    const displayEl = document.getElementById('dice-display');
    if (displayEl) {
      displayEl.textContent = String(result);
    }
    showToast(`Hodil si ${result}.`);
  });
}

function showSudokuGame() {
  const initialBoard = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
  ];

  const startBoard = initialBoard.map((row) => [...row]);
  const fixedCells = new Set();
  startBoard.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell !== 0) fixedCells.add(`${rowIndex}:${colIndex}`);
    });
  });

  const activeGame = {
    board: startBoard.map((row) => [...row]),
    fixedCells,
    selectedCell: null
  };

  const isValidPlacement = (board, row, col, value) => {
    for (let i = 0; i < 9; i += 1) {
      if (i !== col && board[row][i] === value) return false;
      if (i !== row && board[i][col] === value) return false;
    }

    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = startRow; r < startRow + 3; r += 1) {
      for (let c = startCol; c < startCol + 3; c += 1) {
        if ((r !== row || c !== col) && board[r][c] === value) return false;
      }
    }

    return true;
  };

  const renderSudokuBoard = () => {
    const boardEl = document.getElementById('sudoku-board');
    if (!boardEl) return;

    boardEl.innerHTML = '';
    activeGame.board.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'sudoku-cell';
        button.dataset.row = String(rowIndex);
        button.dataset.col = String(colIndex);
        if (activeGame.fixedCells.has(`${rowIndex}:${colIndex}`)) {
          button.classList.add('fixed');
        }
        if (activeGame.selectedCell && activeGame.selectedCell.row === rowIndex && activeGame.selectedCell.col === colIndex) {
          button.classList.add('selected');
        }
        if (cell !== 0) {
          button.textContent = String(cell);
        } else {
          button.textContent = '';
        }
        if (cell !== 0 && !isValidPlacement(activeGame.board, rowIndex, colIndex, cell)) {
          button.classList.add('invalid');
        }
        button.addEventListener('click', () => {
          activeGame.selectedCell = { row: rowIndex, col: colIndex };
          renderSudokuBoard();
        });
        boardEl.appendChild(button);
      });
    });
  };

  const setSelectedCellValue = (value) => {
    if (!activeGame.selectedCell) {
      showToast('Vyber najprv bunku v sudoku.');
      return;
    }

    const { row, col } = activeGame.selectedCell;
    const key = `${row}:${col}`;
    if (activeGame.fixedCells.has(key)) {
      showToast('Túto bunku nemôžeš upravovať.');
      return;
    }

    activeGame.board[row][col] = value;
    renderSudokuBoard();
  };

  const checkSudokuBoard = () => {
    const isSolved = activeGame.board.every((row, rowIndex) => row.every((cell, colIndex) => {
      if (!cell) return false;
      return cell === initialBoard[rowIndex][colIndex] || isValidPlacement(activeGame.board, rowIndex, colIndex, cell);
    }));

    if (isSolved) {
      showToast('Vyhral si! Sudoku je hotové.');
      setTimeout(() => closeGameModal(), 1200);
      return;
    }

    const allFilled = activeGame.board.every((row) => row.every((cell) => cell !== 0));
    if (allFilled) {
      showToast('Nie je to správne. Skús to ešte raz.');
      return;
    }

    showToast('Ešte nie je hotové, skús pokračovať.');
  };

  openGameModal('Sudoku');
  gameBody.innerHTML = `
    <div class="game-card">
      <h3>Vyplň mriežku</h3>
      <div id="sudoku-board" class="sudoku-board" aria-label="Sudoku hracia doska"></div>
    </div>
    <div class="game-card">
      <h3>Čísla</h3>
      <div class="sudoku-keypad">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((value) => `
          <button class="sudoku-key" type="button" data-sudoku-value="${value}">${value}</button>
        `).join('')}
        <button class="sudoku-key empty" type="button" data-sudoku-clear="true">Vymazať</button>
      </div>
    </div>
    <div class="game-lobby-actions">
      <button class="game-secondary-btn" type="button" id="reset-sudoku-btn">Reset</button>
      <button class="game-action-btn" type="button" id="check-sudoku-btn">Skontrolovať</button>
    </div>
  `;

  renderSudokuBoard();

  document.querySelectorAll('[data-sudoku-value]').forEach((button) => {
    button.addEventListener('click', () => {
      const value = Number(button.getAttribute('data-sudoku-value'));
      setSelectedCellValue(value);
    });
  });

  document.querySelectorAll('[data-sudoku-clear]').forEach((button) => {
    button.addEventListener('click', () => {
      setSelectedCellValue(0);
    });
  });

  document.getElementById('reset-sudoku-btn')?.addEventListener('click', () => {
    activeGame.board = initialBoard.map((row) => [...row]);
    activeGame.selectedCell = null;
    renderSudokuBoard();
    showToast('Sudoku bol resetovaný.');
  });

  document.getElementById('check-sudoku-btn')?.addEventListener('click', checkSudokuBoard);
}

function showWordGame() {
  const choices = {
    'Bratislavské mestá': ['Bratislava', 'Pezinok', 'Senec', 'Malacky'],
    'Slovenské mestá': ['Košice', 'Nitra', 'Žilina', 'Banská Bystrica'],
    'Zvieratá': ['Leopard', 'Vlk', 'Slon', 'Žirafa'],
    'Príroda': ['Dub', 'Jeseň', 'Potok', 'Sneh'],
    'Abeceda': ['Abeceda', 'Zebra', 'Lietadlo', 'Mesto']
  };
  const themeNames = Object.keys(choices);
  const theme = themeNames[Math.floor(Math.random() * themeNames.length)];
  const wordPool = choices[theme];
  const word = wordPool[Math.floor(Math.random() * wordPool.length)];
  const normalizedWord = word.toUpperCase();
  const alphabet = 'A Á B C Č D Ď E É F G H CH I Í J K L Ĺ Ľ M N Ň O Ó P Q R Ŕ S Š T Ť U Ú V W X Y Z Ž'.split(' ').filter(Boolean);

  activeWordGame = {
    theme,
    word: normalizedWord,
    guessedLetters: new Set(),
    finished: false
  };

  openGameModal('Hádanie slov');
  gameBody.innerHTML = `
    <div class="game-card">
      <h3>${theme}</h3>
      <p class="game-question">Vyber písmeno z abecedy alebo uhádni celé slovo.</p>
      <div id="word-display" class="game-word-display" style="font-size:1.7rem;font-weight:800;letter-spacing:0.28rem;text-align:center;word-break:break-word;min-height:48px;display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:0.35rem;padding:8px 0;">
        ${Array.from(normalizedWord).map((char) => (char === ' ' ? '&nbsp;' : '_')).join(' ')}
      </div>
    </div>
    <div class="game-card">
      <div id="word-result" class="game-status">Vyber písmeno z abecedy.</div>
    </div>
    <div class="game-card">
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">
        ${alphabet.map((letter) => `<button type="button" class="word-letter-btn" data-letter="${letter}" style="min-width:38px;height:38px;border-radius:10px;border:1px solid #dfe6f3;background:#f8fbff;color:#1f2a44;font-weight:700;cursor:pointer;">${letter}</button>`).join('')}
      </div>
    </div>
    <div class="game-card">
      <div class="game-answer-row">
        <input id="word-guess-input" class="game-text-input" type="text" placeholder="Zadaj celé slovo" aria-label="Celé slovo" />
        <button id="guess-word-btn" class="game-action-btn" type="button">Skontrolovať</button>
      </div>
    </div>
  `;

  const resultEl = document.getElementById('word-result');
  const displayEl = document.getElementById('word-display');
  const guessInput = document.getElementById('word-guess-input');

  function refreshWordDisplay() {
    const visibleParts = Array.from(normalizedWord).map((char) => {
      if (char === ' ') return ' ';
      return activeWordGame.guessedLetters.has(char) ? char : '_';
    });
    displayEl.textContent = visibleParts.join(' ');
  }

  function finishWordGame(isSuccess) {
    if (activeWordGame.finished) return;
    activeWordGame.finished = true;
    const buttons = document.querySelectorAll('.word-letter-btn');
    buttons.forEach((button) => {
      button.disabled = true;
      button.style.opacity = '0.7';
    });

    if (isSuccess) {
      resultEl.className = 'game-result';
      resultEl.textContent = `Správne! Slovo bolo ${word}.`;
      showToast(`Hádanie slov vyriešil ${currentUsername}!`);
      setTimeout(() => closeGameModal(), 1200);
      return;
    }

    resultEl.className = 'game-result fail';
    resultEl.textContent = `Nesprávne. Správna odpoveď bola ${word}.`;
    setTimeout(() => closeGameModal(), 1400);
  }

  document.querySelectorAll('.word-letter-btn').forEach((button) => {
    button.addEventListener('click', () => {
      if (activeWordGame.finished) return;
      const letter = button.dataset.letter;
      if (!letter || activeWordGame.guessedLetters.has(letter)) return;
      const normalizedLetter = letter.toUpperCase();
      activeWordGame.guessedLetters.add(normalizedLetter);
      button.disabled = true;
      button.style.background = normalizedWord.includes(normalizedLetter) ? '#d8f7df' : '#ffe3e3';
      button.style.borderColor = normalizedWord.includes(normalizedLetter) ? '#67b47a' : '#e6a9a9';
      button.style.color = '#1f2a44';

      if (normalizedWord.includes(normalizedLetter)) {
        resultEl.className = 'game-result';
        resultEl.textContent = `Písmeno ${normalizedLetter} je v slove.`;
      } else {
        resultEl.className = 'game-result fail';
        resultEl.textContent = `Písmeno ${normalizedLetter} nie je v slove.`;
      }

      refreshWordDisplay();

      const solved = Array.from(normalizedWord).every((char) => char === ' ' || activeWordGame.guessedLetters.has(char));
      if (solved) {
        finishWordGame(true);
      }
    });
  });

  document.getElementById('guess-word-btn')?.addEventListener('click', () => {
    const guess = normalizeQuizAnswer(guessInput?.value || '');
    const expected = normalizeQuizAnswer(word);

    if (!guess) {
      resultEl.className = 'game-result fail';
      resultEl.textContent = 'Najprv zadaj celé slovo.';
      return;
    }

    if (guess === expected) {
      finishWordGame(true);
      return;
    }

    resultEl.className = 'game-result fail';
    resultEl.textContent = 'To nie je správne. Skús znova alebo vyber písmená.';
  });

  refreshWordDisplay();
}

function notifyIncomingMessage(fromName, previewText) {
  if (!('Notification' in window)) return;
  const title = 'Oddych chat';
  const body = fromName ? `${fromName}: ${previewText || 'nova sprava'}` : (previewText || 'Nova sprava');

  if (Notification.permission === 'granted') {
    new Notification(title, { body });
    return;
  }
  if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') {
        new Notification(title, { body });
      }
    }).catch(() => {});
  }
}

function playPrivateMessageSound() {
  try {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;

    const context = window.__oddychPrivateMessageAudioContext || new AudioCtor();
    window.__oddychPrivateMessageAudioContext = context;

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const now = context.currentTime;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, now);
    oscillator.frequency.exponentialRampToValueAtTime(920, now + 0.14);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.28);
  } catch (error) {
    console.warn('Private message sound unavailable:', error);
  }
}

function playBanAlarm() {
  try {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;

    const context = window.__oddychBanAlarmAudioContext || new AudioCtor();
    window.__oddychBanAlarmAudioContext = context;

    const base = [880, 660, 540, 420];
    const now = context.currentTime;

    base.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      const start = now + index * 0.18;

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(frequency * 0.7, 180), start + 0.16);

      gainNode.gain.setValueAtTime(0.0001, start);
      gainNode.gain.exponentialRampToValueAtTime(0.11, start + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.18);
    });
  } catch (error) {
    console.warn('Ban alarm unavailable:', error);
  }
}

// Global error handlers to surface runtime errors (helps debug why buttons stop working)
window.addEventListener('error', (e) => {
  try {
    alert(`Script error: ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`);
  } catch (err) {
    console.error('Error handler failed', err);
  }
});
window.addEventListener('unhandledrejection', (e) => {
  try {
    alert(`Unhandled promise rejection: ${e.reason}`);
  } catch (err) {
    console.error('Rejection handler failed', err);
  }
});

function saveIgnoreList() {
  localStorage.setItem('chatIgnoreList', JSON.stringify(Array.from(ignoreList)));
}

function saveFriendList() {
  localStorage.setItem('chatFriendList', JSON.stringify(Array.from(friendList)));
}

function normalizeName(value) {
  return (value || '').toString().trim().toLowerCase();
}

function refreshIgnoreStatus() {
  const pill = document.getElementById('ignore-status-pill');
  if (!pill) return;
  const count = ignoreList.size;
  pill.textContent = `Ignorovaní: ${count}`;
  pill.classList.toggle('muted', count === 0);
}

function isFriend(username) {
  return friendList.has(normalizeName(username));
}

function toggleFriend(username) {
  const key = normalizeName(username);
  if (!key) return false;
  if (friendList.has(key)) {
    friendList.delete(key);
    updatePopularity(username, false);
    saveFriendList();
    return false;
  }
  friendList.add(key);
  updatePopularity(username, true);
  saveFriendList();
  return true;
}

function toggleIgnoreUser(username) {
  if (!username) return;
  const lower = normalizeName(username);
  if (!lower) return;
  if (ignoreList.has(lower)) {
    ignoreList.delete(lower);
    saveIgnoreList();
    refreshIgnoreStatus();
    showToast(`Už neignoruješ ${username}.`);
    return;
  }
  ignoreList.add(lower);
  saveIgnoreList();
  refreshIgnoreStatus();
  showToast(`Ignoruješ ${username}.`);
}

function removeIgnoredUser(username) {
  if (!username) return false;
  const lower = normalizeName(username);
  if (!ignoreList.has(lower)) {
    return false;
  }
  ignoreList.delete(lower);
  saveIgnoreList();
  refreshIgnoreStatus();
  return true;
}

function isIgnored(username) {
  return ignoreList.has(normalizeName(username));
}

function escapeHtml(s) {
  return (s || '').toString().replace(/[&<>\"]/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[c]));
}

function normalizeRoomName(value) {
  return (value || '').toString().trim().replace(/\s+/g, ' ').slice(0, 40) || 'Spoločná';
}

function saveRoomList() {
  if (!roomsList) return;
  const roomNames = Array.from(roomsList.querySelectorAll('.room-item'))
    .map((roomEl) => normalizeRoomName(roomEl.dataset.roomName || roomEl.textContent.replace('✕', '')))
    .filter((name) => name && name !== 'Spoločná');
  localStorage.setItem('chatRoomNamesV1', JSON.stringify(Array.from(new Set(roomNames))));
}

function updateRoomHighlight() {
  if (!roomsList) return;
  roomsList.querySelectorAll('.room-item').forEach((roomEl) => {
    const roomName = normalizeRoomName(roomEl.dataset.roomName || roomEl.textContent.replace('✕', ''));
    roomEl.classList.toggle('active', roomName === currentRoom);
  });
}

function formatNewsDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function saveNewsHistoryEntries() {
  localStorage.setItem(newsHistoryStorageKey, JSON.stringify(newsHistoryEntries));
}

function renderNewsHistory() {
  if (!newsHistoryList) return;
  const sortedEntries = [...newsHistoryEntries].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  newsHistoryList.innerHTML = '';
  if (!sortedEntries.length) {
    const emptyItem = document.createElement('li');
    emptyItem.textContent = 'Zatiaľ žiadne novinky.';
    newsHistoryList.appendChild(emptyItem);
    return;
  }
  sortedEntries.forEach((entry) => {
    const item = document.createElement('li');
    const title = entry.title ? `<strong>${escapeHtml(entry.title)}</strong>` : '';
    const dateText = entry.createdAt ? `<strong>${escapeHtml(formatNewsDate(entry.createdAt))}</strong>` : '';
    item.innerHTML = `${dateText ? `${dateText} – ` : ''}${title ? `${title}: ` : ''}${escapeHtml(entry.body || '')}`;
    newsHistoryList.appendChild(item);
  });
}

function addNewsHistoryEntry(title, body, createdAt = new Date().toISOString()) {
  newsHistoryEntries.push({ title, body, createdAt });
  saveNewsHistoryEntries();
  renderNewsHistory();
}

function renderVisibleMessages() {
  messagesDiv.innerHTML = '';
  publicMessageHistory.forEach((message) => {
    addMessage(message);
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function storePublicMessage(message) {
  if (!message || message.system || message.private) return;
  const incomingId = message.id != null ? String(message.id) : null;
  if (!incomingId) {
    publicMessageHistory.push(message);
    return;
  }
  const existingIndex = publicMessageHistory.findIndex((item) => String(item.id) === incomingId);
  if (existingIndex >= 0) {
    publicMessageHistory[existingIndex] = message;
    return;
  }
  publicMessageHistory.push(message);
}

function setActiveRoom(roomName, options = {}) {
  const nextRoom = normalizeRoomName(roomName);
  currentRoom = nextRoom;
  localStorage.setItem('chatCurrentRoom', currentRoom);
  updateRoomHighlight();
  renderVisibleMessages();
  if (!options.silent) {
    showToast(`Vstúpil si do miestnosti ${currentRoom}.`);
  }
}

function reportMessageToAdmin(message) {
  if (!message || message.private || !message.username || !socket) {
    return;
  }

  socket.emit('report-message', {
    username: message.username,
    text: message.text,
    room: message.room || currentRoom || 'Spoločná',
    reporter: currentUsername || 'Anon',
    messageId: message.id || null,
    timestamp: message.timestamp || new Date().toISOString()
  });
}

function reportUserToAdmin(username) {
  const target = String(username || '').trim();
  if (!target || target === currentUsername || !socket) {
    return;
  }

  socket.emit('report-message', {
    username: target,
    text: `Používateľ ${currentUsername} nahlásil používateľa ${target} z užívateľského zoznamu.`,
    room: currentRoom || 'Spoločná',
    reporter: currentUsername || 'Anon',
    messageId: null,
    timestamp: new Date().toISOString()
  });
  showToast(`Nahlásenie pre ${target} bolo odoslané správcovi.`);
}

function addMessage(m) {
  if (!m.system) {
    try {
      const msgTime = new Date(m.timestamp || Date.now()).getTime();
      if (lastClearTime && msgTime <= lastClearTime) {
        return;
      }
    } catch (e) {
      // if timestamp parsing fails, don't block the message
    }
  }
  if (m.system) {
    const d = document.createElement('div');
    d.className = 'system-msg';
    d.textContent = m.text;
    messagesDiv.appendChild(d);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return;
  }

  if (m.username && isIgnored(m.username) && !m.private) {
    return;
  }

  if (!m.private) {
    const messageRoom = normalizeRoomName(m.room || 'Spoločná');
    if (messageRoom !== currentRoom) {
      return;
    }
  }

  const d = document.createElement('div');
  d.className = 'msg' + (m.username === currentUsername ? ' me' : '') + (m.private ? ' private' : '');
  const bubble = document.createElement('div');
  bubble.className = 'bubble' + (m.private ? ' private' : '');
  const privateLabel = m.private
    ? `<div class="private-label">${m.self ? `Súkromné → ${escapeHtml(m.toUsername || '')}` : 'Súkromné'}</div>`
    : '';
  bubble.innerHTML = `
    <div class="from"><strong>${escapeHtml(m.username)}</strong></div>
    ${privateLabel}
    <div class="text">${escapeHtml(m.text)}</div>
    <div class="meta">${new Date(m.timestamp || Date.now()).toLocaleString()}</div>
  `;

  if (!m.private) {
    const reactionRow = buildReactionRow(m.id, m.reactions || {});
    bubble.appendChild(reactionRow);
  }

  d.appendChild(bubble);
  if (m.id) {
    d.dataset.messageId = String(m.id);
  }
  messagesDiv.appendChild(d);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function buildReactionRow(messageId, reactions) {
  const row = document.createElement('div');
  row.className = 'reaction-row';
  row.dataset.messageId = String(messageId);

  reactionSet.forEach((emoji) => {
    const usersForEmoji = Array.isArray(reactions[emoji]) ? reactions[emoji] : [];
    const count = usersForEmoji.length;
    const active = usersForEmoji.includes(currentUsername);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `reaction-btn${active ? ' active' : ''}`;
    button.dataset.emoji = emoji;
    button.dataset.messageId = String(messageId);
    button.textContent = count > 0 ? `${emoji} ${count}` : emoji;
    row.appendChild(button);
  });

  return row;
}

function updateReactionRow(messageId, reactions) {
  const container = messagesDiv.querySelector(`.msg[data-message-id="${messageId}"] .reaction-row`);
  if (!container) return;

  const newRow = buildReactionRow(messageId, reactions || {});
  container.replaceWith(newRow);
}

function normalizeModerationName(value) {
  return (value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function refreshMyPoints() {
  const pointsEl = document.getElementById('my-points');
  if (pointsEl) {
    pointsEl.textContent = '0';
  }
  return 0;
}

function isCurrentUserAdmin() {
  const name = normalizeModerationName(currentUsername);
  return ['admin', 'administrator', 'spravca', 'spravca', 'marek', 'marekc'].includes(name);
}

function isCurrentUserModerator() {
  const name = normalizeModerationName(currentUsername);
  return ['moderator', 'moderator1', 'moderator2', 'mod', 'chatmod', 'moderatorchat', 'moderator-sk'].includes(name)
    || name.includes('moderator')
    || name.includes('mod');
}

function updateAdminPanel(users) {
  const panel = document.getElementById('admin-portal');
  const list = document.getElementById('admin-portal-list');
  const count = document.getElementById('admin-portal-count');
  const title = document.getElementById('admin-portal-title');
  const badge = document.getElementById('admin-portal-role');
  if (!panel || !list || !count || !title || !badge) return;

  const currentIsAdmin = isCurrentUserAdmin();
  const currentIsModerator = isCurrentUserModerator();
  const canModerate = currentIsAdmin || currentIsModerator;
  panel.style.display = canModerate ? 'block' : 'none';
  if (!canModerate) return;

  title.textContent = 'Moderácia';
  badge.textContent = currentIsAdmin ? 'správca' : 'moderátor';
  count.textContent = String(Array.isArray(users) ? users.length : 0);
  list.innerHTML = '';

  users.forEach((user) => {
    const row = document.createElement('div');
    row.className = 'admin-portal-user';

    const name = document.createElement('span');
    name.className = 'admin-portal-user-name';
    name.textContent = user.username;

    const badgeItem = document.createElement('span');
    badgeItem.className = 'admin-user-badge';
    badgeItem.textContent = user.role === 'admin' ? 'správca' : (user.role === 'moderator' ? 'moderátor' : 'user');

    const actions = document.createElement('div');
    actions.className = 'admin-portal-actions';

    const kickBtn = document.createElement('button');
    kickBtn.type = 'button';
    kickBtn.className = 'admin-action-btn kick';
    kickBtn.textContent = 'Kick';
    kickBtn.disabled = user.username === currentUsername || user.role === 'admin' || (currentIsModerator && user.role === 'moderator');
    kickBtn.addEventListener('click', () => {
      socket.emit('command', { type: 'kick', target: user.username, from: currentUsername });
    });

    const banBtn = document.createElement('button');
    banBtn.type = 'button';
    banBtn.className = 'admin-action-btn ban';
    banBtn.textContent = 'Ban 24h';
    banBtn.disabled = user.username === currentUsername || user.role === 'admin' || (currentIsModerator && user.role === 'moderator');
    banBtn.addEventListener('click', () => {
      socket.emit('command', { type: 'ban', target: user.username, hours: 24, from: currentUsername });
    });

    actions.appendChild(kickBtn);
    actions.appendChild(banBtn);
    row.appendChild(name);
    row.appendChild(badgeItem);
    row.appendChild(actions);
    list.appendChild(row);
  });
}

function updateUserList(users) {
  if (activeUsersCount) {
    activeUsersCount.textContent = users.length;
  }
  if (currentUsernameDisplay) {
    currentUsernameDisplay.textContent = currentUsername;
  }
  if (typeof refreshMyPoints === 'function') {
    refreshMyPoints();
  }
  refreshIgnoreStatus();
  updateAdminPanel(users);
  if (!usersList) return;
  usersList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    const name = user.username;
    const roleSuffix = user.role === 'owner'
      ? ' [správca]'
      : (user.role === 'moderator' ? ' [moderator 🛡]' : (user.role === 'tester' ? ' [tester]' : ''));
    const nameSpan = document.createElement('span');
    nameSpan.textContent = `${name}${roleSuffix}`;
    li.appendChild(nameSpan);

    if (user.username === currentUsername) {
      li.style.fontWeight = '700';
      li.style.opacity = '0.7';
      li.style.cursor = 'default';
    } else {
      const friendBtn = document.createElement('button');
      friendBtn.type = 'button';
      friendBtn.className = `friend-envelope${isFriend(name) ? ' active' : ''}`;
      friendBtn.title = isFriend(name) ? 'Odobrať z priateľov' : 'Pridať do priateľov';
      friendBtn.textContent = '✉';
      friendBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const added = toggleFriend(name);
        friendBtn.classList.toggle('active', added);
        friendBtn.title = added ? 'Odobrať z priateľov' : 'Pridať do priateľov';
        addMessage({
          system: true,
          text: added
            ? `✉ Pridal si ${name} medzi priateľov.`
            : `✉ Odobral si ${name} z priateľov.`,
          timestamp: new Date().toISOString()
        });
      });

      li.appendChild(friendBtn);

      const reportUserBtn = document.createElement('button');
      reportUserBtn.type = 'button';
      reportUserBtn.className = 'report-user-btn';
      reportUserBtn.title = `Nahlásiť správcovi ${name}`;
      reportUserBtn.textContent = 'Nahlásiť správcovi';
      reportUserBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        reportUserToAdmin(name);
      });
      li.appendChild(reportUserBtn);

      if (name === 'Chat') {
        const robotBtn = document.createElement('button');
        robotBtn.type = 'button';
        robotBtn.className = 'friend-envelope robot-call-btn';
        robotBtn.title = 'Osloviť Chat';
        robotBtn.textContent = 'Osloviť';
        robotBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          activateRobotConversation(user);
        });
        li.appendChild(robotBtn);
      }

      li.dataset.id = user.id;
      li.dataset.name = user.username;
      li.addEventListener('click', () => {
        if (name === 'Chat') return;
        messageInput.value = `@${user.username} `;
        messageInput.focus();
        showToast(`Adresuješ: ${user.username}`);
      });
      li.addEventListener('dblclick', () => {
        if (name === 'Chat') {
          activateRobotConversation(user);
          return;
        }
        setPrivateTarget(user.id, user.username);
      });
    }
    usersList.appendChild(li);
  });

  // Aktualizuj call zoznam
  const callUsersList = document.getElementById('call-users-list');
  const callHint = document.getElementById('call-hint');
  if (callUsersList) {
    const others = users.filter(u => u.username !== currentUsername);
    callUsersList.innerHTML = '';
    if (others.length === 0) {
      if (callHint) callHint.style.display = '';
    } else {
      if (callHint) callHint.style.display = 'none';
      others.forEach(u => {
        const li = document.createElement('li');
        li.className = 'call-user-item';
        const nameSpan = document.createElement('span');
        nameSpan.textContent = u.username;
        li.appendChild(nameSpan);
        callUsersList.appendChild(li);
      });
    }
  }
}

function notifyFriendOnlineStatus(users) {
  const currentlyOnlineFriends = new Set();

  users.forEach((user) => {
    if (user.username === currentUsername) return;
    if (isFriend(user.username)) {
      const key = normalizeName(user.username);
      currentlyOnlineFriends.add(key);
      if (!onlineFriends.has(key)) {
        const now = new Date();
        addMessage({
          system: true,
          text: `✉ Tvoj priateľ ${user.username} je na chate. ${now.toLocaleString()} | Tvoj oddych chat`,
          timestamp: now.toISOString()
        });
      }
    }
  });

  onlineFriends.clear();
  currentlyOnlineFriends.forEach((key) => onlineFriends.add(key));
}

function initiateCall(targetId, targetUsername) {
  if (!targetId || !targetUsername) return;
  const username = String(targetUsername).trim();
  setPrivateTarget(targetId, username);
}

function setPrivateTarget(id, username, allowRobotActivation = false) {
  const isRobotTarget = String(username || '').trim() === 'Chat';
  if (isRobotTarget) {
    robotConversationEnabled = allowRobotActivation;
    if (!allowRobotActivation) {
      showToast('Klikni na tlačidlo Osloviť pri Chate a potom môžeš začať rozhovor.');
      return;
    }
  } else {
    robotConversationEnabled = false;
  }

  privateTargetId = id;
  privateTargetName = username;
  if (privateStatus && privateTargetNameDisplay) {
    privateTargetNameDisplay.textContent = privateTargetName;
    privateStatus.style.display = 'block';
  }
  if (privateThreadHeader && privateThreadName && privateThreadAvatar) {
    privateThreadName.textContent = privateTargetName;
    privateThreadAvatar.textContent = (privateTargetName || 'U').charAt(0).toUpperCase();
    privateThreadHeader.style.display = 'flex';
  }
  const message = privateTargetName && privateTargetName.toLowerCase() === 'chat'
    ? 'Chat je pripravený na rozhovor. Napíš mu správu.'
    : `Odkazovač aktivovaný: súkromná správa pre ${privateTargetName}`;
  showToast(message);
  messageInput.focus();
}

function activateRobotConversation(user) {
  if (!user || !user.id || user.username !== 'Chat') return;
  setPrivateTarget(user.id, user.username, true);
}

function clearPrivateTarget() {
  privateTargetId = null;
  privateTargetName = null;
  robotConversationEnabled = false;
  refreshPrivateStatus();
}

function refreshPrivateStatus() {
  if (!privateStatus || !privateTargetNameDisplay) return;
  if (privateTargetName) {
    privateTargetNameDisplay.textContent = privateTargetName;
    privateStatus.style.display = 'block';
    if (privateThreadHeader && privateThreadName && privateThreadAvatar) {
      privateThreadName.textContent = privateTargetName;
      privateThreadAvatar.textContent = privateTargetName.charAt(0).toUpperCase();
      privateThreadHeader.style.display = 'flex';
    }
    return;
  }
  if (autoPrivateEnabled && autoPrivateTargetName) {
    privateTargetNameDisplay.textContent = `${autoPrivateTargetName} (AUTO)`;
    privateStatus.style.display = 'block';
    if (privateThreadHeader && privateThreadName && privateThreadAvatar) {
      privateThreadName.textContent = autoPrivateTargetName;
      privateThreadAvatar.textContent = autoPrivateTargetName.charAt(0).toUpperCase();
      privateThreadHeader.style.display = 'flex';
    }
    return;
  }
  privateStatus.style.display = 'none';
  if (privateThreadHeader) {
    privateThreadHeader.style.display = 'none';
  }
}

function openSendSettings() {
  if (!sendSettingsModal || !sendSettingsTarget || !sendSettingsPrivateToggle) return;
  sendSettingsTarget.innerHTML = '';
  const others = activeUsers.filter((u) => u.username !== currentUsername);
  if (!others.length) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Nikto iný nie je online';
    sendSettingsTarget.appendChild(opt);
    sendSettingsTarget.disabled = true;
  } else {
    sendSettingsTarget.disabled = false;
    others.forEach((u) => {
      const opt = document.createElement('option');
      opt.value = u.username;
      opt.textContent = u.username;
      sendSettingsTarget.appendChild(opt);
    });
    const exists = others.some((u) => u.username.toLowerCase() === autoPrivateTargetName.toLowerCase());
    sendSettingsTarget.value = exists ? autoPrivateTargetName : others[0].username;
  }
  sendSettingsPrivateToggle.checked = autoPrivateEnabled;
  sendSettingsModal.style.display = 'flex';
}

function saveSendSettings() {
  if (!sendSettingsPrivateToggle || !sendSettingsTarget) return;
  autoPrivateEnabled = !!sendSettingsPrivateToggle.checked;
  autoPrivateTargetName = sendSettingsTarget.value || '';
  localStorage.setItem('autoPrivateEnabled', autoPrivateEnabled ? 'true' : 'false');
  localStorage.setItem('autoPrivateTargetName', autoPrivateTargetName);
  refreshPrivateStatus();
  showToast(autoPrivateEnabled && autoPrivateTargetName
    ? `Súkromné odosielanie je zapnuté pre ${autoPrivateTargetName}.`
    : 'Súkromné odosielanie je vypnuté.');
  if (sendSettingsModal) sendSettingsModal.style.display = 'none';
}

function canCreateRoom() {
  const storedUser = localStorage.getItem('chatUsername')?.trim();
  const registered = localStorage.getItem('chatRegistered') === 'true';
  const isAdmin = ['admin', 'administrator', 'spravca', 'správca'].includes((storedUser || '').toLowerCase());
  return !!storedUser || registered || isAdmin;
}

function canManageRooms() {
  const storedUser = localStorage.getItem('chatUsername')?.trim();
  const normalized = (storedUser || currentUsername || '').toLowerCase();
  return ['admin', 'administrator', 'spravca', 'správca'].includes(normalized);
}

function updateCreateRoomControl() {
  const allowed = canCreateRoom();
  if (createRoomInput) {
    createRoomInput.disabled = !allowed;
    createRoomInput.placeholder = allowed
      ? 'Napíš názov novej miestnosti...' 
      : 'Iba registrovaný a admin môže vytvoriť';
  }
  if (createRoomBtn) {
    createRoomBtn.disabled = !allowed;
  }
}

function addRoomToList(name, options = {}) {
  if (!roomsList || !name) return;
  const roomName = normalizeRoomName(name);
  const existing = Array.from(roomsList.querySelectorAll('.room-item')).find(
    (roomEl) => normalizeRoomName(roomEl.dataset.roomName || roomEl.textContent.replace('✕', '')) === roomName
  );
  if (existing) {
    existing.dataset.roomName = roomName;
    return existing;
  }
  const roomItem = document.createElement('div');
  roomItem.className = 'room-item';
  roomItem.dataset.roomName = roomName;
  roomItem.textContent = `${roomName} (0)`;
  const del = document.createElement('button');
  del.className = 'room-delete';
  del.setAttribute('title', 'Zmazať miestnosť');
  del.textContent = '✕';
  roomItem.appendChild(del);
  roomsList.appendChild(roomItem);
  if (options.activate) {
    setActiveRoom(roomName, { silent: true });
  } else {
    updateRoomHighlight();
  }
  if (options.persist !== false) {
    saveRoomList();
  }
  return roomItem;
}

// Handle delete clicks (delegation)
roomsList?.addEventListener('click', (e) => {
  const btn = e.target.closest('.room-delete');
  const roomEl = e.target.closest('.room-item');
  if (!roomEl) return;
  if (btn) {
    const isPermanent = roomEl.getAttribute('data-permanent') === 'true';
    if (isPermanent) {
      showToast('Neblbni, stálu miestnosť neni možné zrušiť');
      return;
    }
    const removedRoom = normalizeRoomName(roomEl.dataset.roomName || roomEl.textContent.replace('✕', ''));
    roomEl.remove();
    saveRoomList();
    if (removedRoom === currentRoom) {
      setActiveRoom('Spoločná', { silent: true });
    }
    showToast('Miestnosť zmazaná.');
    return;
  }

  const selectedRoom = normalizeRoomName(roomEl.dataset.roomName || roomEl.textContent.replace('✕', ''));
  if (selectedRoom) {
    setActiveRoom(selectedRoom);
  }
});

function insertEmoji(emoji) {
  if (!messageInput) return;
  const start = messageInput.selectionStart ?? messageInput.value.length;
  const end = messageInput.selectionEnd ?? messageInput.value.length;
  const value = messageInput.value;
  messageInput.value = `${value.slice(0, start)}${emoji}${value.slice(end)}`;
  const pos = start + emoji.length;
  messageInput.focus();
  messageInput.setSelectionRange(pos, pos);
}

function initEmojiLine() {
  if (!emojiLine) return;
  emojiLine.innerHTML = '';
  emojiSet.forEach((emoji) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'emoji-btn';
    btn.textContent = emoji;
    btn.addEventListener('click', () => insertEmoji(emoji));
    emojiLine.appendChild(btn);
  });
}


function sendJoin() {
  currentUsername = localStorage.getItem('chatUsername')?.trim() || 'Správca';
  if (!currentUsername) currentUsername = 'Správca';
  if (currentUsernameDisplay) {
    currentUsernameDisplay.textContent = currentUsername;
  }
  updateCreateRoomControl();
  updateModerationAccess();
  socket.emit('join', { username: currentUsername, room: currentRoom });
  socket.emit('moderation-center:request');
}

function showRandomConversationTopic() {
  const topics = [
    '💬 Téma na rozhovor: Aký film by si si dnes pozrel znova?',
    '💬 Téma na rozhovor: Čo by si vymenil za lepšie v tejto komunite?',
    '💬 Téma na rozhovor: Aký je tvoj najlepší tip na relax po dni?',
    '💬 Téma na rozhovor: Čo ťa v poslednom čase najviac zaujalo?',
    '💬 Téma na rozhovor: Ktorý zvyk máš a nikto iný nepochopí?',
    '💬 Téma na rozhovor: Aký je tvoj najlepší spôsob, ako si oddýchnuť?',
    '💬 Téma na rozhovor: Ktoré miesto by si chcel navštíviť raz v živote?',
    '💬 Téma na rozhovor: Čo by si dal na večeru s kamarátmi?' 
  ];
  const pick = topics[Math.floor(Math.random() * topics.length)];
  addMessage({ system: true, text: pick, timestamp: new Date().toISOString() });
}

socket.on('connect', () => {
  initEmojiLine();
  const savedRooms = JSON.parse(localStorage.getItem('chatRoomNamesV1') || '[]');
  savedRooms.forEach((roomName) => addRoomToList(roomName, { persist: false }));
  if (currentRoom !== 'Spoločná' && !Array.from(roomsList?.querySelectorAll('.room-item') || []).some((roomEl) => normalizeRoomName(roomEl.dataset.roomName || roomEl.textContent.replace('✕', '')) === currentRoom)) {
    addRoomToList(currentRoom, { persist: false });
  }
  runDailyQuizScheduler();
  updateRoomHighlight();
  const joinPrompt = 'Ak chceš vedieť, kto tu kedy prišiel, napíš do okna ANO. Ak nechceš, napíš NIE.';
  addMessage({ system: true, text: joinPrompt, timestamp: new Date().toISOString() });
  showRandomConversationTopic();
  joinHistoryPromptState = 'pending';
  sendJoin();
  applyMessengerMode();
  lastSpokenAt = Date.now();
});

setInterval(checkInactivityLogout, 60 * 1000);

socket.on('load-messages', (msgs) => {
  publicMessageHistory = Array.isArray(msgs) ? msgs.filter((msg) => !msg.private && !msg.system) : [];
  renderVisibleMessages();
});

socket.on('receive-message', (m) => {
  storePublicMessage(m);
  const visibleRoom = normalizeRoomName(m && m.room ? m.room : 'Spoločná');
  const isVisible = !m || m.private || m.system || visibleRoom === currentRoom;
  if (isVisible) {
    addMessage(m);
  }
});

socket.on('clear-chat', (payload) => {
  lastClearTime = Date.now();
  localStorage.setItem('chatClearAt', String(lastClearTime));
  publicMessageHistory = [];
  messagesDiv.innerHTML = '';
  if (payload && payload.byUsername) {
    showToast(`Chat bol vymazaný pre všetkých používateľov ${payload.byUsername}.`);
  } else {
    showToast('Chat bol vymazaný pre všetkých.');
  }
});

socket.on('system-message', (msg) => {
  const rawText = String(msg || '').trim();
  const nowLabel = new Date().toLocaleTimeString('sk-SK', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const cleanedText = rawText
    .replace(/\s*\(.*?\)\s*$/, '')
    .replace(/\s*\d{1,2}:\d{2}\s*$/, '')
    .trim();
  const displayText = cleanedText ? `${cleanedText} ${nowLabel}`.trim() : `Systém ${nowLabel}`;
  const isBanWarning = /zabanovan|banovan|bol si zabanovan|si zabanovan|vyhodený na 24 hodín|vyhodil/i.test(rawText);
  if (isBanWarning) {
    playBanAlarm();
    showToast(cleanedText || 'Bol si zabanovaný.');
  }
  addMessage({ system: true, text: displayText, timestamp: new Date().toISOString() });
});

socket.on('ban-screen', (data) => {
  showBanOverlay({ ...(data || {}), mode: 'ban' });
});

socket.on('kick-screen', (data) => {
  showBanOverlay({ ...(data || {}), mode: 'kick' });
});

socket.on('moderation-center-state', (payload) => {
  Object.assign(moderationState, payload || {});
  renderModerationPanel();
});

socket.on('moderation-unread-count', (count) => {
  unreadNotificationCount = Number(count) || 0;
  renderModerationPanel();
});

socket.on('moderation-notification', (notification) => {
  if (!notification) return;
  unreadNotificationCount += 1;
  moderationState.notifications = Array.isArray(moderationState.notifications)
    ? [notification, ...moderationState.notifications]
    : [notification];
  renderModerationPanel();
  playCinkTone();
  showToast(notification.title || 'Nové upozornenie');
});

socket.on('moderation-sound', () => {
  playCinkTone();
});

socket.on('appeal-submitted', (payload) => {
  if (payload && payload.appeal) {
    showToast(`Odvolanie bolo odoslané. ID: ${payload.appeal.id}`);
  }
});

socket.on('join-denied', (message) => {
  addMessage({ system: true, text: `⚠ ${message || 'Toto meno je už obsadené. Zvoľ si iné.'}`, timestamp: new Date().toISOString() });
});

socket.on('user-list', (users) => {
  activeUsers = users;
  updateUserList(users);
  updateAdminPanel(users);
  notifyFriendOnlineStatus(users);
  refreshPrivateStatus();
  updateModerationAccess();
});

socket.on('security-banner', updateSecurityPanel);
socket.on('antivirus-status', (payload) => updateSecurityPanel(payload));

socket.on('message-reaction-updated', ({ messageId, reactions }) => {
  updateReactionRow(messageId, reactions);
});

socket.on('countdown:start', ({ value, byUsername, rewardText }) => {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return;
  const who = (byUsername || 'Správca').toString();
  const bonusText = rewardText || `Dostávaš ${n} bodov!`;
  startCountdown(n, {
    headline: `${who} spustil odpočítanie`,
    finishText: bonusText
  });
});

function sendMessage() {
  let text = messageInput.value.trim();
  if (!text) return;

  if (joinHistoryPromptState === 'pending' && /^(ano|nie)$/i.test(text)) {
    const choice = text.toLowerCase();
    joinHistoryPromptState = choice === 'ano' ? 'accepted' : 'declined';
    localStorage.setItem('joinHistoryConsent', choice === 'ano' ? 'accept' : 'decline');
    addMessage({
      system: true,
      text: choice === 'ano'
        ? 'Emailové upozornenie o návštevách je zapnuté. Ak chceš zmeniť rozhodnutie, napíš NIE.'
        : 'Emailové upozornenie o návštevách je vypnuté. Ak chceš zmeniť rozhodnutie, napíš ANO.',
      timestamp: new Date().toISOString()
    });
    messageInput.value = '';
    return;
  }

  if (containsSuspiciousClientText(text)) {
    showToast('Správa obsahuje podozrivý obsah a nebola odoslaná.');
    messageInput.value = '';
    return;
  }

  if (text.startsWith('.zmaz')) {
    socket.emit('clear-chat');
    messageInput.value = '';
    return;
  }

  const adminMessageMatch = text.match(/^:m(?:\s+(.+))?$/i);
  if (adminMessageMatch) {
    const valueText = (adminMessageMatch[1] || '').trim();
    if (!valueText) {
      showToast('Použi :m správu, napríklad :m Vítam vás všetkých.');
      messageInput.value = '';
      return;
    }
    if (!canManageRooms()) {
      showToast('Príkaz :m môže spustiť iba Správca/admin.');
      messageInput.value = '';
      return;
    }
    socket.emit('admin-broadcast', { text: valueText });
    messageInput.value = '';
    return;
  }

  const countdownMatch = text.match(/^\.countdown(?:\s+(.+))?$/i);
  if (countdownMatch) {
    const valueText = (countdownMatch[1] || '').trim();
    if (!valueText) {
      showToast('Použi .countdown číslo, napríklad .countdown 10');
      messageInput.value = '';
      return;
    }
    if (!canManageRooms()) {
      showToast('Príkaz .countdown môže spustiť iba Správca/admin.');
      messageInput.value = '';
      return;
    }
    socket.emit('countdown:start', { value: valueText });
    messageInput.value = '';
    return;
  }

  if (text.startsWith('.ignoruj')) {
    const parts = text.split(' ');
    const target = parts.slice(1).join(' ').trim();
    if (!target) {
      showToast('Použi .ignoruj meno');
      return;
    }
    const lowerTarget = normalizeName(target);
    const wasAdded = !ignoreList.has(lowerTarget);
    toggleIgnoreUser(target);
    if (wasAdded) {
      socket.emit('notify-ignored', { targetName: target, byName: currentUsername });
    }
    messageInput.value = '';
    return;
  }

  if (text.startsWith('.neignoruj')) {
    const parts = text.split(' ');
    const target = parts.slice(1).join(' ').trim();
    if (!target) {
      showToast('Použi .neignoruj meno');
      return;
    }
    const removed = removeIgnoredUser(target);
    if (removed) {
      showToast(`Už neignoruješ ${target}.`);
    } else {
      showToast(`Používateľ ${target} nie je v ignorovaných.`);
    }
    messageInput.value = '';
    return;
  }

  if (text.toLowerCase().startsWith('.prec')) {
    const awayMessage = window.commandUtils && typeof window.commandUtils.getPrecMessage === 'function'
      ? window.commandUtils.getPrecMessage(currentUsername)
      : `${currentUsername} je na chvíľu preč.`;
    socket.emit('send-message', {
      text: awayMessage,
      username: currentUsername,
      timestamp: new Date().toISOString()
    });
    showToast('Správa o tom, že si na chvíľu preč, bola odoslaná.');
    messageInput.value = '';
    return;
  }

  if (text.toLowerCase().startsWith('.aktivita')) {
    showToast(getActivityStatusText());
    messageInput.value = '';
    return;
  }

  if (text.startsWith('.ban')) {
    const parts = text.split(/\s+/);
    const target = parts[1] ? parts[1].trim() : '';
    const hoursText = parts[2] ? parts[2].trim() : '29';
    if (!target) {
      showToast('Použi .ban meno 29');
      return;
    }
    if (!canManageRooms()) {
      showToast('Príkaz .ban môže spustiť iba Správca/admin.');
      messageInput.value = '';
      return;
    }
    const hours = Number(hoursText);
    if (!Number.isFinite(hours) || hours <= 0) {
      showToast('Počet hodín musí byť kladné číslo.');
      messageInput.value = '';
      return;
    }
    socket.emit('command', { type: 'ban', target, hours, from: currentUsername });
    messageInput.value = '';
    return;
  }

  if (text.startsWith('.zrusitmiestnost')) {
    if (!canManageRooms()) {
      addMessage({
        system: true,
        text: 'Neblbni, stálu miestnosť neni možné zrušiť',
        timestamp: new Date().toISOString()
      });
      messageInput.value = '';
      return;
    }

    addMessage({
      system: true,
      text: 'Príkaz pre správcu je prijatý, zrušenie miestnosti ešte nie je implementované.',
      timestamp: new Date().toISOString()
    });
    messageInput.value = '';
    return;
  }

  if (privateTargetId) {
    if (privateTargetName === 'Chat') {
      const normalized = text.trim().toLowerCase();
      if (normalized === 'ano' || normalized === 'áno') {
        const dateKey = new Date().toISOString().slice(0, 10);
        addCalendarEntryForUser(currentUsername, { date: dateKey });
        openGoogleCalendarQuiz(dateKey);
        addMessage({
          username: 'Chat',
          text: 'Zapísal som ťa do Google Kalendára na večerný kvíz o 20:00. Keď napíšeš NIE, zruším to.',
          private: true,
          timestamp: new Date().toISOString(),
          self: false
        });
        messageInput.value = '';
        clearPrivateTarget();
        return;
      }
      if (normalized === 'nie') {
        removeCalendarEntryForUser(currentUsername);
        addMessage({
          username: 'Chat',
          text: 'Zrušil som ti pripomienku na večerný kvíz. Keď budeš chcieť, môžeš sa pripojiť znova.',
          private: true,
          timestamp: new Date().toISOString(),
          self: false
        });
        messageInput.value = '';
        clearPrivateTarget();
        return;
      }
    }
    if (privateTargetName === 'Chat' && !robotConversationEnabled) {
      showToast('Najprv klikni na tlačidlo Osloviť pri Chate.');
      messageInput.value = '';
      return;
    }
    markSpokenActivity();
    updateActivityStats(currentUsername, { messages: 1 });
    socket.emit('send-private-message', {
      to: privateTargetId,
      text,
      robotActivated: privateTargetName === 'Chat' ? robotConversationEnabled : undefined
    });
    messageInput.value = '';
    clearPrivateTarget();
    return;
  }

  if (autoPrivateEnabled && autoPrivateTargetName) {
    const targetUser = activeUsers.find((u) => u.username.toLowerCase() === autoPrivateTargetName.toLowerCase());
    if (!targetUser) {
      showToast(`Používateľ ${autoPrivateTargetName} nie je online. Správa nebola odoslaná.`);
      return;
    }
    markSpokenActivity();
    updateActivityStats(currentUsername, { messages: 1 });
    socket.emit('send-private-message', {
      to: targetUser.id,
      text
    });
    messageInput.value = '';
    return;
  }

  markSpokenActivity();
  updateActivityStats(currentUsername, { messages: 1 });
  socket.emit('send-message', {
    username: currentUsername,
    text,
    timestamp: new Date().toISOString(),
    room: currentRoom
  });
  messageInput.value = '';
}

socket.on('receive-private-message', (m) => {
  if (!m.self) {
    playPrivateMessageSound();
    notifyIncomingMessage(m.from, m.text);
  }

  if (m && m.from === 'Chat' && typeof m.text === 'string') {
    const replyText = m.text.toLowerCase();
    if (replyText.includes('napíš ano')) {
      // Kalendár sa otvára až po potvrdení ANO používateľom.
    }
  }

  addMessage({
    username: m.self ? currentUsername : m.from,
    text: m.text,
    timestamp: m.timestamp,
    private: true,
    self: m.self,
    toUsername: m.toUsername
  });
});

function createTopicMessage(topicName) {
  const label = (topicName || '').toString().trim();
  if (!label) {
    showToast('Napíš názov témy.');
    return;
  }
  addMessage({
    system: true,
    text: `📝 Téma: ${label}`,
    timestamp: new Date().toISOString()
  });
  addNewsHistoryEntry('Vytvorená téma', `Bola vytvorená téma „${label}“.`);
  if (topicNameInput) {
    topicNameInput.value = '';
  }
}

function showToast(message) {
  addMessage({
    system: true,
    text: message,
    timestamp: new Date().toISOString()
  });
}

function openQuicklinkModal() {
  if (!quicklinkOverlay) return;
  if (quicklinkTargetInput) {
    const otherUser = activeUsers.find((user) => user.username !== currentUsername);
    quicklinkTargetInput.value = otherUser ? otherUser.username : '';
    quicklinkTargetInput.focus();
  }
  quicklinkOverlay.style.display = 'flex';
}

function closeQuicklinkModal() {
  if (quicklinkOverlay) {
    quicklinkOverlay.style.display = 'none';
  }
}

renderNewsHistory();

navLogout?.addEventListener('click', (event) => {
  event.preventDefault();
  localStorage.removeItem('chatUsername');
  window.location.href = '/';
});
navHelp?.addEventListener('click', (event) => {
  event.preventDefault();
  const overlay = document.getElementById('help-overlay');
  if (!overlay) return;
  const isOpen = overlay.style.display !== 'none';
  overlay.style.display = isOpen ? 'none' : 'flex';
});
document.getElementById('help-close')?.addEventListener('click', () => {
  const overlay = document.getElementById('help-overlay');
  if (overlay) overlay.style.display = 'none';
});
document.getElementById('help-suggestions-btn')?.addEventListener('click', () => {
  const panel = document.getElementById('help-suggestions');
  if (!panel) return;
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
});
document.getElementById('suggestion-submit')?.addEventListener('click', () => {
  const input = document.getElementById('suggestion-input');
  const checkedType = document.querySelector('input[name="feedback-type"]:checked');
  const category = checkedType ? checkedType.value : 'Návrh čo pridať';
  const text = input?.value.trim();
  if (!text) {
    showToast('Napíš najprv svoju pripomienku.');
    return;
  }
  socket.emit('send-message', {
    text: `💬 ${category} od ${currentUsername}: ${text}`,
    username: currentUsername,
    timestamp: new Date().toISOString()
  });
  if (input) input.value = '';
  showToast('Pripomienka odoslaná do chatu.');
});
document.getElementById('help-overlay')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
});
quicklinkOverlay?.addEventListener('click', (event) => {
  if (event.target === quicklinkOverlay) closeQuicklinkModal();
});
quicklinkClose?.addEventListener('click', closeQuicklinkModal);
quicklinkContinue?.addEventListener('click', () => {
  const targetName = (quicklinkTargetInput?.value || '').trim();
  if (!targetName) {
    showToast('Napíš nick príjemcu.');
    return;
  }
  const matchedUser = activeUsers.find((user) => user.username.toLowerCase() === targetName.toLowerCase());
  if (!matchedUser) {
    showToast('Tento používateľ nie je online.');
    return;
  }
  closeQuicklinkModal();
  setPrivateTarget(matchedUser.id, matchedUser.username);
});
profileModal?.addEventListener('click', (event) => {
  if (event.target === profileModal) closeProfileModal();
});
profileCloseBtn?.addEventListener('click', closeProfileModal);
profileCancelBtn?.addEventListener('click', closeProfileModal);
profileAvatarInput?.addEventListener('change', (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('Nahraj obrázok vo formáte JPG, PNG alebo WEBP.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = String(reader.result || '');
    if (profileAvatarPreview) {
      profileAvatarPreview.src = dataUrl;
      profileAvatarPreview.style.display = 'block';
    }
    if (profileAvatarEmpty) {
      profileAvatarEmpty.style.display = 'none';
    }
  };
  reader.readAsDataURL(file);
});
profileSaveBtn?.addEventListener('click', () => {
  const avatarUrl = profileAvatarPreview && profileAvatarPreview.getAttribute('src') ? profileAvatarPreview.getAttribute('src') : '';
  const profileData = {
    bio: profileBioInput?.value || '',
    age: profileAgeInput?.value || '',
    birthdate: profileBirthdateInput?.value || '',
    city: profileCityInput?.value || '',
    status: profileStatusInput?.value || '',
    hobbies: profileHobbiesInput?.value || '',
    avatarDataUrl: avatarUrl
  };
  saveProfileData(profileData);
  closeProfileModal();
  showToast('Profil bol uložený.');
});
navProfile?.addEventListener('click', (event) => {
  event.preventDefault();
  openProfileModal();
});

const snakeGameState = {
  boardSize: 10,
  snake: [],
  apple: { x: 0, y: 0 },
  direction: { x: 1, y: 0 },
  nextDirection: { x: 1, y: 0 },
  score: 0,
  timer: null,
  over: false,
  tickMs: 180
};
const snakeGameCells = [];

function initializeSnakeBoard() {
  if (!snakeGameBoard) return;
  if (snakeGameCells.length) return;

  for (let y = 0; y < snakeGameState.boardSize; y += 1) {
    for (let x = 0; x < snakeGameState.boardSize; x += 1) {
      const cell = document.createElement('div');
      cell.className = 'snake-game-cell';
      cell.dataset.x = String(x);
      cell.dataset.y = String(y);
      snakeGameBoard.appendChild(cell);
      snakeGameCells.push(cell);
    }
  }
}

function resetSnakeGame() {
  initializeSnakeBoard();
  snakeGameState.snake = [
    { x: 2, y: 5 },
    { x: 1, y: 5 },
    { x: 0, y: 5 }
  ];
  snakeGameState.direction = { x: 1, y: 0 };
  snakeGameState.nextDirection = { x: 1, y: 0 };
  snakeGameState.score = 0;
  snakeGameState.over = false;
  if (snakeGameState.timer) {
    clearInterval(snakeGameState.timer);
    snakeGameState.timer = null;
  }
  placeAppleInSnakeGame();
  renderSnakeGame();
}

function placeAppleInSnakeGame() {
  const cells = [];
  for (let y = 0; y < snakeGameState.boardSize; y += 1) {
    for (let x = 0; x < snakeGameState.boardSize; x += 1) {
      const occupied = snakeGameState.snake.some((part) => part.x === x && part.y === y);
      if (!occupied) {
        cells.push({ x, y });
      }
    }
  }
  if (!cells.length) {
    snakeGameState.apple = { x: -1, y: -1 };
    return;
  }
  const pick = cells[Math.floor(Math.random() * cells.length)];
  snakeGameState.apple = pick;
}

function renderSnakeGame() {
  if (!snakeGameBoard || !snakeGameCells.length) {
    initializeSnakeBoard();
  }

  for (const cell of snakeGameCells) {
    const x = Number(cell.dataset.x);
    const y = Number(cell.dataset.y);
    const isApple = snakeGameState.apple.x === x && snakeGameState.apple.y === y;
    const snakeHead = snakeGameState.snake[0];
    const isSnake = snakeGameState.snake.some((part) => part.x === x && part.y === y);

    cell.className = 'snake-game-cell';
    if (isSnake) {
      cell.classList.add('snake');
    }
    if (snakeHead && snakeHead.x === x && snakeHead.y === y) {
      cell.classList.add('snake-head');
      if (snakeGameState.over) {
        cell.classList.add('crashed');
      }
    }
    if (isApple) {
      cell.classList.add('apple');
    }
  }

  if (snakeGameScore) {
    snakeGameScore.textContent = String(snakeGameState.score);
  }
}

function setSnakeDirection(next) {
  if (!snakeGameState || snakeGameState.over) return;
  const current = snakeGameState.direction;
  if (current.x + next.x === 0 && current.y + next.y === 0) {
    return;
  }
  snakeGameState.nextDirection = next;
}

function finishSnakeGame() {
  snakeGameState.over = true;
  if (snakeGameState.timer) {
    clearInterval(snakeGameState.timer);
    snakeGameState.timer = null;
  }
  if (snakeGameOverlay) {
    snakeGameOverlay.style.display = 'flex';
  }
}

function stepSnakeGame() {
  if (!snakeGameState || snakeGameState.over) return;
  snakeGameState.direction = { ...snakeGameState.nextDirection };
  const head = snakeGameState.snake[0];
  const nextHead = {
    x: head.x + snakeGameState.direction.x,
    y: head.y + snakeGameState.direction.y
  };

  const hitsWall = nextHead.x < 0 || nextHead.y < 0 || nextHead.x >= snakeGameState.boardSize || nextHead.y >= snakeGameState.boardSize;
  if (hitsWall) {
    finishSnakeGame();
    return;
  }

  const hitsSelf = snakeGameState.snake.some((part) => part.x === nextHead.x && part.y === nextHead.y);
  if (hitsSelf) {
    finishSnakeGame();
    return;
  }

  const nextSnake = [nextHead, ...snakeGameState.snake];
  const ateApple = nextHead.x === snakeGameState.apple.x && nextHead.y === snakeGameState.apple.y;

  if (ateApple) {
    snakeGameState.score += 1;
    placeAppleInSnakeGame();
  } else {
    nextSnake.pop();
  }

  snakeGameState.snake = nextSnake;
  renderSnakeGame();
}

function openSnakeGame() {
  if (!snakeGameModal) return;
  resetSnakeGame();
  snakeGameModal.style.display = 'flex';
  if (snakeGameOverlay) {
    snakeGameOverlay.style.display = 'none';
  }
  if (snakeGameState.timer) {
    clearInterval(snakeGameState.timer);
  }
  snakeGameState.timer = setInterval(stepSnakeGame, snakeGameState.tickMs);
}

function closeSnakeGame() {
  if (snakeGameModal) {
    snakeGameModal.style.display = 'none';
  }
  if (snakeGameOverlay) {
    snakeGameOverlay.style.display = 'none';
  }
  if (snakeGameState.timer) {
    clearInterval(snakeGameState.timer);
    snakeGameState.timer = null;
  }
}

snakeGameButton?.addEventListener('click', () => {
  openSnakeGame();
});
snakeGameClose?.addEventListener('click', closeSnakeGame);
snakeGameBack?.addEventListener('click', closeSnakeGame);
snakeGameRetry?.addEventListener('click', () => {
  if (snakeGameOverlay) {
    snakeGameOverlay.style.display = 'none';
  }
  openSnakeGame();
});
snakeGameModal?.addEventListener('click', (event) => {
  if (event.target === snakeGameModal) closeSnakeGame();
});
gameLauncherButton?.addEventListener('click', () => {
  renderGameLauncher();
});
quizGameButton?.addEventListener('click', () => {
  quizLobbyPlayers = new Set([currentUsername]);
  renderQuizLobby();
});
diceGameButton?.addEventListener('click', () => {
  showDiceGame();
});
wordGameButton?.addEventListener('click', () => {
  showWordGame();
});
sudokuGameButton?.addEventListener('click', () => {
  showSudokuGame();
});
gameClose?.addEventListener('click', () => closeGameModal());
gameModal?.addEventListener('click', (event) => {
  if (event.target === gameModal) closeGameModal();
});
window.addEventListener('keydown', (event) => {
  if (snakeGameModal && snakeGameModal.style.display === 'flex') {
    const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
    if (!isArrowKey) {
      return;
    }
    event.preventDefault();
    if (event.key === 'ArrowUp') setSnakeDirection({ x: 0, y: -1 });
    if (event.key === 'ArrowDown') setSnakeDirection({ x: 0, y: 1 });
    if (event.key === 'ArrowLeft') setSnakeDirection({ x: -1, y: 0 });
    if (event.key === 'ArrowRight') setSnakeDirection({ x: 1, y: 0 });
  }
});
navFriends?.addEventListener('click', (event) => {
  event.preventDefault();
  usersList?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
navIgnore?.addEventListener('click', (event) => {
  event.preventDefault();
  const names = Array.from(ignoreList).join(', ') || 'žiadni';
  showToast(`Ignorovaní: ${names}`);
});
navSettings?.addEventListener('click', (event) => {
  event.preventDefault();
  openSendSettings();
});
commandsToggle?.addEventListener('click', (event) => {
  event.preventDefault();
  toggleCommandsPanel();
});
navQuicklink?.addEventListener('click', (event) => {
  event.preventDefault();
  openQuicklinkModal();
});
document.querySelectorAll('.topic-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const topicName = chip.dataset.topic || chip.textContent.trim();
    if (topicNameInput) {
      topicNameInput.value = topicName;
    }
    createTopicMessage(topicName);
  });
});

createTopicBtn?.addEventListener('click', () => {
  createTopicMessage(topicNameInput?.value || '');
});

newsHistoryToggle?.addEventListener('click', (event) => {
  event.preventDefault();
  openNewsHistory();
});
newsHistoryClose?.addEventListener('click', () => {
  closeNewsHistory();
});
newsHistoryBackdrop?.addEventListener('click', () => {
  closeNewsHistory();
});
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeNewsHistory();
  }
});
navMessenger?.addEventListener('click', (event) => {
  event.preventDefault();
  window.location.href = '/messenger';
});

document.getElementById('nav-call-open')?.addEventListener('click', (event) => {
  event.preventDefault();
  const modal = document.getElementById('call-modal');
  const list = document.getElementById('call-modal-list');
  if (!modal || !list) return;
  const others = activeUsers.filter(u => u.username !== currentUsername);
  list.innerHTML = '';
  if (others.length === 0) {
    list.innerHTML = '<li style="color:#888;text-align:center;padding:10px;">Nikto iný nie je online.</li>';
  } else {
    others.forEach(u => {
      const li = document.createElement('li');
      li.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#f9f9f9;border-radius:12px;border:1px solid #eee;';
      const name = document.createElement('span');
      name.style.cssText = 'font-weight:700;color:#3e2513;font-size:0.95rem;';
      name.textContent = u.username;
      li.appendChild(name);
      list.appendChild(li);
    });
  }
  modal.style.display = 'flex';
});

document.getElementById('call-modal-close')?.addEventListener('click', () => {
  const modal = document.getElementById('call-modal');
  if (modal) modal.style.display = 'none';
});

sendSettingsSave?.addEventListener('click', saveSendSettings);
sendSettingsCancel?.addEventListener('click', () => {
  if (sendSettingsModal) sendSettingsModal.style.display = 'none';
});
createRoomBtn?.addEventListener('click', () => {
  if (!canCreateRoom()) {
    showToast('Na vytvorenie miestnosti musíš byť registrovaný alebo admin.');
    return;
  }
  const roomName = createRoomInput?.value.trim() || `Miestnosť ${Date.now()}`;
  if (!roomName || roomName === 'Miestnosť') {
    showToast('Zadaj názov miestnosti.');
    return;
  }
  const roomItem = addRoomToList(roomName, { activate: true });
  if (roomItem) {
    setActiveRoom(roomName, { silent: true });
  }
  if (createRoomInput) {
    createRoomInput.value = '';
  }
  showToast('Miestnosť vytvorená a otvorená.');
});

quickQuizBtn?.addEventListener('click', () => {
  quizLobbyPlayers = new Set([currentUsername]);
  renderQuizLobby();
});

sendBtn?.addEventListener('click', sendMessage);
messageInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

messagesDiv?.addEventListener('click', (event) => {
  const button = event.target.closest('.reaction-btn');
  if (!button) return;

  const messageId = Number(button.dataset.messageId);
  const emoji = button.dataset.emoji;
  if (!messageId || !emoji) return;

  socket.emit('toggle-reaction', { messageId, emoji });
});
