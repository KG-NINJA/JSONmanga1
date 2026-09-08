'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { TEMPLATES, SAMPLES, buildDocument, compilePrompt } = require('../app.js');
const fresh = () => JSON.parse(JSON.stringify(SAMPLES.empathy));

test('all three stories produce four ordered panels, matching roles and named characters', () => {
  for (const [key, sample] of Object.entries(SAMPLES)) {
    const data = buildDocument(sample);
    assert.equal(data.template, key);
    assert.deepEqual(data.panels.map(p => p.id), [1, 2, 3, 4]);
    assert.deepEqual(data.panels.map(p => p.role), TEMPLATES[key]);
    assert.equal(data.characters[1].name, sample.characters[1].name);
    const prompt = compilePrompt(data);
    const embedded = prompt.split('【企画データ（JSON）】\n')[1].split('\n【仕上げの確認】')[0];
    assert.deepEqual(JSON.parse(embedded), data);
  }
});

test('rejects missing, extra, blank and overlong panels without dropping content', () => {
  for (const scenes of [[], new Array(4), ['1','2','3'], ['1','2','3','4','5'], ['1','2',' \n ','4'], ['1','2','3','x'.repeat(1001)]]) {
    assert.throws(() => buildDocument({ ...fresh(), scenes }));
  }
});

test('validates characters, title and template including prototype names', () => {
  for (const input of [null, { ...fresh(), template: '__proto__' }, { ...fresh(), template: 'toString' }, { ...fresh(), title: ' ' }, { ...fresh(), title: 'x'.repeat(101) }, { ...fresh(), characters: [] }]) {
    assert.throws(() => buildDocument(input));
  }
  for (const change of [{ name: '' }, { name: 'x'.repeat(41) }, { description: '' }, { description: 'x'.repeat(401) }]) {
    const input = fresh();
    Object.assign(input.characters[0], change);
    assert.throws(() => buildDocument(input));
  }
});

test('preserves Japanese, quotes, line breaks and HTML-like input as round-trippable text', () => {
  const input = fresh();
  input.title = '<img src=x onerror="alert(1)"> & "物語"';
  input.characters[0].name = 'A "名" \\';
  input.scenes[2] = '一行目\n二行目 </textarea><script>alert(1)</script> 🐈';
  const data = buildDocument(input);
  const restored = JSON.parse(JSON.stringify(data));
  assert.equal(restored.title, input.title);
  assert.equal(restored.characters[0].name, input.characters[0].name);
  assert.equal(restored.panels[2].scene, input.scenes[2]);
  assert.ok(compilePrompt(data).includes(JSON.stringify(data, null, 2)));
});

test('normalizes surrounding whitespace and creates independent data', () => {
  const input = fresh();
  input.title = '  題名  ';
  const before = JSON.stringify(input);
  const data = buildDocument(input);
  assert.equal(data.title, '題名');
  assert.equal(JSON.stringify(input), before);
  data.characters[0].name = 'changed';
  data.panels[0].scene = 'changed';
  assert.equal(JSON.stringify(input), before);
});
