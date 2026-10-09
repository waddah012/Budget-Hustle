'use strict';
const { districts, fresh, restore, available, reward } = HustleRules;
const $ = id => document.getElementById(id);
const SAVE_KEY = 'budget-hustle-v1';
let progress = fresh();
let storageOK = true;
try {
    const saved = localStorage.getItem(SAVE_KEY);
    try { progress = restore(JSON.parse(saved)); } catch { progress = fresh(); }
} catch { storageOK = false; }
const state = { started: false, paused: false, busy: false, x: 50, y: 50, target: null, keys: new Set(), enemies: [], nearest: null, round: null, last: 0, invincible: 0 };
let popupTimer;
let returnFocus = null;
function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, ...progress })); storageOK = true; }
    catch { storageOK = false; }
}
function announce(message) {
    clearTimeout(popupTimer);
    $('popup').textContent = message;
    $('popup').classList.add('show');
    popupTimer = setTimeout(() => $('popup').classList.remove('show'), 3000);
}
function stopMovement() { state.keys.clear(); state.target = null; }
function isPlaying() { return state.started && !state.paused && !state.busy && !document.hidden; }
function setModal(element, open) {
    element.style.display = open ? 'flex' : 'none';
    $('world').inert = open;
    $('hud').inert = open;
    $('menuBtn').inert = open;
    if (open) {
        returnFocus = document.activeElement;
        element.querySelector('button')?.focus();
    } else if (returnFocus?.isConnected) returnFocus.focus();
}
function updateHUD() {
    $('money').textContent = '$' + progress.money.toLocaleString();
    $('rep').textContent = progress.rep;
    $('lives').textContent = progress.lives;
    const next = districts.find(d => !progress.completed.includes(d.id));
    $('currentLevel').textContent = `${progress.completed.length}/10 districts completed`;
    $('nextUnlock').textContent = next ? `Goal: ${next.name} · $${next.unlock}` : 'City champion · All districts complete';
    districts.forEach((d, i) => {
        const button = $(d.id);
        const done = progress.completed.includes(d.id);
        const locked = !available(d, progress);
        button.classList.toggle('locked', locked);
        button.classList.toggle('completed', done);
        button.setAttribute('aria-label', `${d.name}, level ${i + 1}, ${done ? 'completed' : locked ? 'locked' : 'open'}`);
        button.querySelector('.building-label').innerHTML = `${d.name}<br><span>${done ? '✓ Complete' : locked ? '$' + d.unlock + ' · Locked' : 'Play · Level ' + (i + 1)}</span>`;
    });
    $('saveNote').textContent = storageOK ? 'Progress saves on this device. Reset below for a fresh run.' : 'Saving is unavailable. You can still play this session.';
    $('startGameBtn').textContent = state.started || progress.money || progress.completed.length ? 'Continue city run' : 'Start a city run';
}
function spawnEnemies() {
    $('enemies').replaceChildren();
    state.enemies = Array.from({ length: 3 + Math.floor(progress.completed.length / 3) }, (_, i) => {
        const el = document.createElement('div');
        el.className = 'enemy ' + (i === 3 ? 'fomo' : 'glitch');
        el.setAttribute('aria-hidden', 'true');
        $('enemies').append(el);
        const x = i % 2 ? 92 : 8, y = 12 + i * 22;
        el.style.left = x + '%'; el.style.top = y + '%';
        return { el, x, y, damage: i === 3 };
    });
}
function positionPlayer() {
    $('player').style.left = state.x + '%';
    $('player').style.top = state.y + '%';
}
function frame(now) {
    const dt = Math.min((now - (state.last || now)) / 1000, 0.05);
    state.last = now;
    if (isPlaying()) {
        let dx = Number(state.keys.has('d') || state.keys.has('arrowright')) - Number(state.keys.has('a') || state.keys.has('arrowleft'));
        let dy = Number(state.keys.has('s') || state.keys.has('arrowdown')) - Number(state.keys.has('w') || state.keys.has('arrowup'));
        if (dx || dy) state.target = null;
        else if (state.target) {
            dx = state.target.x - state.x; dy = state.target.y - state.y;
            if (Math.hypot(dx, dy) < 0.8) { state.target = null; dx = dy = 0; }
        }
        const length = Math.hypot(dx, dy) || 1;
        state.x = Math.max(3, Math.min(97, state.x + dx / length * 25 * dt));
        state.y = Math.max(3, Math.min(97, state.y + dy / length * 25 * dt));
        positionPlayer();
        state.invincible = Math.max(0, state.invincible - dt);
        for (const enemy of [...state.enemies]) {
            enemy.x += (state.x - enemy.x) * dt * 0.22;
            enemy.y += (state.y - enemy.y) * dt * 0.22;
            enemy.el.style.left = enemy.x + '%'; enemy.el.style.top = enemy.y + '%';
            if (!state.invincible && Math.hypot(state.x - enemy.x, state.y - enemy.y) < 4) {
                progress.money = Math.max(0, progress.money - 12);
                if (enemy.damage) progress.lives--;
                enemy.el.remove(); state.enemies = state.enemies.filter(e => e !== enemy);
                state.invincible = 2;
                announce(enemy.damage ? 'FOMO caught you. Lost a heart and $12.' : 'A gremlin took $12. Keep moving!');
                if (progress.lives <= 0) {
                    progress.lives = 3; state.x = state.y = 50;
                    state.paused = true; stopMovement();
                    $('startScreen').style.display = 'flex';
                    $('startGameBtn').focus(); spawnEnemies();
                    announce('Out of hearts. Your completed districts are safe. Continue for another run.');
                }
                save(); updateHUD();
            }
        }
        let distance = Infinity;
        state.nearest = null;
        for (const d of districts) {
            const el = $(d.id), rect = el.getBoundingClientRect();
            const dist = Math.hypot(state.x / 100 * innerWidth - rect.left - rect.width / 2, state.y / 100 * innerHeight - rect.top - rect.height / 2);
            el.classList.toggle('nearby', dist < 100);
            if (dist < distance) { distance = dist; state.nearest = d; }
        }
        if (distance > 150) state.nearest = null;
        $('enterBtn').style.display = state.nearest ? 'flex' : 'none';
    }
    requestAnimationFrame(frame);
}
function enter(district) {
    if (!isPlaying()) return;
    if (!available(district, progress)) {
        const previous = districts[districts.indexOf(district) - 1];
        announce(`Complete ${previous.name} and reach $${district.unlock} to enter.`);
        return;
    }
    stopMovement(); state.busy = true;
    state.round = { district, points: 0, question: 0, answered: false, timer: null, deadline: null, finished: false };
    $('enterBtn').style.display = 'none';
    if (district.sprint) renderSprint(); else renderQuestion();
    setModal($('overlay'), true);
}
function button(text, action, extra = '') {
    const el = document.createElement('button'); el.className = 'mg-btn ' + extra;
    el.textContent = text; el.addEventListener('click', action); return el;
}
function shell(title, subtitle) {
    const content = $('minigameContent'); content.replaceChildren();
    const h = document.createElement('h2'); h.textContent = title;
    const p = document.createElement('p'); p.textContent = subtitle;
    content.append(h, p); return content;
}
function renderQuestion() {
    const round = state.round;
    const q = round.district.questions[round.question];
    round.answered = false;
    const content = shell(round.district.topic, `Question ${round.question + 1} of ${round.district.questions.length}`);
    const prompt = document.createElement('h3'); prompt.textContent = q[0]; content.append(prompt);
    q[1].forEach((answer, index) => content.append(button(answer, () => {
        if (round !== state.round || round.answered || round.finished) return;
        round.answered = true;
        const correct = index === q[2]; round.points += correct ? 50 : 10;
        content.querySelectorAll('button').forEach(b => { b.disabled = true; });
        const feedback = document.createElement('p'); feedback.className = 'feedback';
        feedback.setAttribute('role', 'status'); feedback.textContent = `${correct ? 'Correct · +$50' : 'Keep learning · +$10'}. ${q[3]}`;
        content.append(feedback, button(round.question + 1 === round.district.questions.length ? 'Finish round' : 'Next question', () => {
            round.question++;
            if (round.question === round.district.questions.length) finish(); else { renderQuestion(); $('minigameContent').querySelector('button').focus(); }
        }, 'alt'));
        content.lastChild.focus();
    })));
    content.append(button('Leave challenge', cancelRound, 'text-btn'));
}
function renderSprint() {
    const round = state.round;
    const content = shell(round.district.topic, 'Five seconds. Each tap earns $5, up to $500. Separate Space presses work too.');
    content.append(button('Start five-second round', () => {
        if (round.deadline) return;
        round.deadline = performance.now() + 5000;
        content.replaceChildren();
        const title = document.createElement('h2'); title.textContent = round.district.topic;
        const time = document.createElement('p'); time.id = 'savingsTime'; time.textContent = '5.0 seconds';
        const score = document.createElement('p'); score.id = 'sprintScore'; score.textContent = '$0 earned';
        const tap = button('Save +$5', tapSprint); tap.id = 'tapBtn';
        content.append(title, time, score, tap, button('Leave challenge', cancelRound, 'text-btn')); tap.focus();
        round.timer = setInterval(() => {
            if (round !== state.round) return;
            const remaining = Math.max(0, round.deadline - performance.now());
            time.textContent = (remaining / 1000).toFixed(1) + ' seconds';
            if (remaining === 0) finish();
        }, 50);
    }), button('Leave challenge', cancelRound, 'text-btn'));
}
function tapSprint() {
    const round = state.round;
    if (!round?.deadline || round.finished) return;
    if (performance.now() >= round.deadline) { finish(); return; }
    round.points = Math.min(500, round.points + 5);
    $('sprintScore').textContent = `$${round.points} earned`;
}
function cancelRound() {
    if (!state.round) return;
    clearInterval(state.round.timer); state.round.finished = true; state.round = null;
    state.busy = false; state.invincible = 2; setModal($('overlay'), false);
    announce('Challenge left. No reward this round.');
}
function finish() {
    const round = state.round;
    if (!round || round.finished) return;
    round.finished = true; clearInterval(round.timer);
    const earned = reward(districts.indexOf(round.district) + 1, round.points);
    progress.money += earned; progress.rep += Math.floor(earned / 5);
    if (!progress.completed.includes(round.district.id)) progress.completed.push(round.district.id);
    save(); updateHUD();
    setModal($('overlay'), false);
    $('resultTitle').textContent = progress.completed.length === 10 ? 'City champion!' : 'District complete';
    $('levelReward').textContent = `${round.district.name} · Earned $${earned}`;
    const next = districts[districts.indexOf(round.district) + 1];
    $('nextLevelBtn').hidden = !next;
    $('nextLevelBtn').textContent = next && available(next, progress) ? `Play ${next.name}` : 'Keep earning in the city';
    $('nextLevelBtn').onclick = () => { closeResult(); if (next && available(next, progress)) enter(next); };
    setModal($('levelComplete'), true);
}
function closeResult() {
    state.round = null; state.busy = false; state.invincible = 2;
    spawnEnemies();
    setModal($('levelComplete'), false);
}
$('stayBtn').onclick = closeResult;
districts.forEach(d => $(d.id).addEventListener('click', () => enter(d)));
$('enterBtn').onclick = () => { if (state.nearest) enter(state.nearest); };
$('world').addEventListener('pointerdown', e => {
    if (!isPlaying() || e.target.closest('.building')) return;
    state.target = { x: e.clientX / innerWidth * 100, y: e.clientY / innerHeight * 100 };
});
$('startGameBtn').onclick = () => {
    state.started = true; state.paused = false;
    $('startScreen').style.display = 'none';
    $('world').inert = $('hud').inert = false;
    $('budget-hub').focus();
    announce('Start at Budget Hub. Red gremlins steal cash; pink ones also take a heart.');
};
$('menuBtn').onclick = () => {
    state.paused = true; stopMovement(); updateHUD();
    $('startScreen').style.display = 'flex'; $('world').inert = $('hud').inert = true;
    $('startGameBtn').focus();
};
$('resetBtn').onclick = () => {
    if ($('resetBtn').dataset.confirm !== 'yes') {
        $('resetBtn').dataset.confirm = 'yes'; $('resetBtn').textContent = 'Click again to erase progress'; return;
    }
    progress = fresh(); state.x = state.y = 50; stopMovement(); save(); updateHUD(); spawnEnemies(); positionPlayer();
    $('resetBtn').dataset.confirm = ''; $('resetBtn').textContent = 'Reset saved progress'; announce('Fresh start.');
};
document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if (e.key === 'Tab') {
        const modal = [$('startScreen'), $('overlay'), $('levelComplete')].find(el => getComputedStyle(el).display !== 'none');
        if (modal) {
            const buttons = [...modal.querySelectorAll('button')].filter(b => !b.disabled && !b.hidden);
            const first = buttons[0], last = buttons.at(-1);
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    }
    if (e.key === 'Escape') {
        if (state.round && !state.round.finished) cancelRound();
        else if (state.busy) closeResult();
        else if (state.started && !state.paused) $('menuBtn').click();
    }
    if (key === ' ' && state.round?.deadline && !state.round.finished) {
        e.preventDefault(); if (!e.repeat) tapSprint(); return;
    }
    if (!isPlaying()) return;
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault(); state.keys.add(key);
    }
    if (key === 'e' && !e.repeat && state.nearest) { e.preventDefault(); enter(state.nearest); }
});
document.addEventListener('keyup', e => state.keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', stopMovement);
document.addEventListener('visibilitychange', () => {
    stopMovement();
    if (document.hidden && state.round && !state.round.finished) cancelRound();
});
$('world').inert = $('hud').inert = true;
updateHUD(); spawnEnemies(); positionPlayer(); $('startGameBtn').focus(); requestAnimationFrame(frame);
