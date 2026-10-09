const { test } = require('node:test');
const assert = require('node:assert/strict');
const { districts, fresh, restore, available, reward } = require('../rules.js');
test('cash and preceding district are both required', () => {
    const progress = fresh();
    assert.equal(available(districts[0], progress), true);
    progress.money = 5000;
    assert.equal(available(districts[1], progress), false);
    progress.completed.push(districts[0].id);
    assert.equal(available(districts[1], progress), true);
    progress.money = 49;
    assert.equal(available(districts[1], progress), false);
});
test('completed districts stay open after losing cash', () => {
    assert.equal(available(districts[1], { ...fresh(), completed: ['budget-hub', 'market'] }), true);
});
test('corrupt saves cannot inject invalid progress', () => {
    assert.deepEqual(restore(null), fresh());
    assert.deepEqual(restore({ version: 2, money: 999 }), fresh());
    assert.deepEqual(restore({ version: 1, money: -50, rep: '100', lives: 0, completed: ['bad', 'market', 'market'] }), { money: 0, rep: 0, lives: 3, completed: ['market'] });
});
test('saved progress survives validation', () => {
    const progress = { money: 350, rep: 70, lives: 2, completed: ['budget-hub', 'market'] };
    assert.deepEqual(restore({ version: 1, ...progress }), progress);
});
test('rewards are bounded and scale with district', () => {
    assert.equal(reward(1, 150), 160);
    assert.equal(reward(10, 99999), 600);
    assert.equal(reward(3, -100), 30);
});
test('all ten challenges have usable content and rising thresholds', () => {
    assert.equal(districts.length, 10);
    assert.equal(new Set(districts.map(d => d.id)).size, 10);
    districts.forEach((d, i) => {
        if (i) assert.ok(d.unlock > districts[i - 1].unlock);
        if (!d.sprint) d.questions.forEach(q => { assert.ok(q[1][q[2]]); assert.ok(q[3].length > 10); });
    });
});
