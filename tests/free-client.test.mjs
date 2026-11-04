import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {renderFreeLanding} from '../microlandings/free.mjs';

const source = readFileSync(new URL('../microlandings/public/free.js', import.meta.url), 'utf8');

function element(value = '') {
  return {
    value, textContent: '', checked: false, hidden: false, disabled: false, dataset: {},
    listeners: {}, attributes: {}, focused: false,
    addEventListener(type, handler) { this.listeners[type] = handler; },
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
    getAttribute(name) { return this.attributes[name] ?? null; },
    focus() { this.focused = true; }
  };
}

function makeClient(response = {ok:true, json:async () => ({ok:true})}) {
  const fields = {
    name: element(), property: element(), property_type: element(), rooms: element(),
    contact: element(), callback_time: element('any'), consent: element(), website: element()
  };
  const nodes = {
    'free-config': {textContent:JSON.stringify({variant:'d',offerId:'free',endpoint:'/api/funnel/leads'})},
    'free-error': element(), 'free-success': element(), 'free-status': element(),
    'free-big-note': element(), 'free-intent': element()
  };
  nodes['free-success'].hidden = true;
  nodes['free-big-note'].hidden = true;
  nodes['free-intent'].hidden = true;
  for (const key of ['name','property','type','rooms','phone','consent']) nodes['free-' + key + '-error'] = element();
  const submitLabel = element();
  const button = element();
  button.querySelector = () => submitLabel;
  const form = element();
  form.elements = fields;
  form.querySelector = () => button;
  nodes['free-lead-form'] = form;
  const primary = element(); primary.dataset.freeCta = 'hero';
  const callback = element();
  const sticky = element(); sticky.hidden = true;
  const hero = {bottom:500, getBoundingClientRect() { return {bottom:this.bottom}; }};
  const formSection = {top:4000, getBoundingClientRect() { return {top:this.top}; }};
  nodes['free-form'] = formSection;
  const window = {dataLayer:[], innerWidth:390, innerHeight:844, listeners:{},
    addEventListener(type, handler) { this.listeners[type] = handler; }};
  const requests = [];
  const context = {
    document: {
      getElementById: id => nodes[id],
      querySelector: selector => selector === '.free-sticky-cta' ? sticky : selector === '.free-hero' ? hero : null,
      querySelectorAll: selector => selector === '[data-free-cta]' ? [primary] :
        selector === '[data-free-callback]' ? [callback] : []
    },
    window,
    location: {search:'?v=d&utm_source=sms&utm_medium=callo&utm_campaign=test&utm_content=abc'},
    URLSearchParams,
    localStorage: {getItem:() => null, setItem() {}},
    fetch: async (url, options) => { requests.push({url, body:JSON.parse(options.body)}); return response; }
  };
  vm.runInNewContext(source, context);
  return {fields, nodes, form, button, submitLabel, primary, callback, sticky, hero, formSection, window, requests,
    submit: () => form.listeners.submit({preventDefault() {}})};
}

function fillValid(client) {
  client.fields.name.value = 'Тест';
  client.fields.property.value = 'Тестова садиба';
  client.fields.property_type.value = 'guesthouse';
  client.fields.rooms.value = '11';
  client.fields.contact.value = '+380990000000';
  client.fields.callback_time.value = 'tomorrow';
  client.fields.consent.checked = true;
}

test('empty form identifies fields and does not send a request', async () => {
  const c = makeClient();
  await c.submit();
  assert.equal(c.requests.length, 0);
  assert.equal(c.fields.name.focused, true);
  assert.equal(c.fields.name.getAttribute('aria-invalid'), 'true');
  assert.match(c.nodes['free-phone-error'].textContent, /телефон/);
  assert.equal(c.nodes['free-success'].hidden, true);
});

test('help request retains attribution and shows success after acknowledgement', async () => {
  const c = makeClient();
  fillValid(c);
  c.callback.listeners.click();
  c.fields.rooms.listeners.input();
  assert.equal(c.nodes['free-intent'].hidden, false);
  assert.equal(c.nodes['free-big-note'].hidden, false);
  await c.submit();
  assert.equal(c.requests.length, 1);
  const body = c.requests[0].body;
  assert.equal(body.offer_id, 'free');
  assert.equal(body.rooms, '11');
  assert.equal(body.attribution.last_touch.utm_source, 'sms');
  assert.equal(body.attribution.last_touch.utm_medium, 'callo');
  assert.equal(body.attribution.last_touch.utm_campaign, 'test');
  assert.equal(body.attribution.last_touch.utm_content, 'abc');
  assert.equal(body.attribution.last_touch.message_variant, 'd');
  assert.match(body.note, /Потрібна допомога з налаштуванням/);
  assert.match(body.note, /завтра зранку/);
  assert.equal(c.form.hidden, true);
  assert.equal(c.nodes['free-success'].hidden, false);
  assert.equal(c.nodes['free-success'].focused, true);
  assert.match(c.nodes['free-status'].textContent, /Тест/);
  assert.ok(c.window.dataLayer.some(event => event.event === 'free_step1'));
  assert.ok(c.window.dataLayer.some(event => event.event === 'free_lead_success'));
  assert.ok(!c.window.dataLayer.some(event => event.event === 'free_registered'));
  assert.ok(c.window.dataLayer.every(event => !('contact' in event) && !('name' in event)));
});

test('delivery failure keeps the form available to retry', async () => {
  const c = makeClient({ok:false,json:async () => ({ok:false,message:'Тестова помилка доставки.'})});
  fillValid(c);
  await c.submit();
  assert.equal(c.form.hidden, false);
  assert.equal(c.nodes['free-success'].hidden, true);
  assert.equal(c.button.disabled, false);
  assert.equal(c.submitLabel.textContent, 'Надіслати заявку');
  assert.equal(c.nodes['free-error'].textContent, 'Тестова помилка доставки.');
  assert.ok(c.window.dataLayer.some(event => event.event === 'free_submit_attempt'));
  assert.ok(!c.window.dataLayer.some(event => event.event === 'free_step1' || event.event === 'free_lead_success'));
});

test('mobile sticky action stays away from the hero and form', () => {
  const c = makeClient();
  assert.equal(c.sticky.hidden, true);
  c.hero.bottom = -1;
  c.window.listeners.scroll();
  assert.equal(c.sticky.hidden, false);
  c.formSection.top = 600;
  c.window.listeners.scroll();
  assert.equal(c.sticky.hidden, true);
  c.formSection.top = 4000;
  c.window.innerWidth = 1024;
  c.window.listeners.resize();
  assert.equal(c.sticky.hidden, true);
});

test('success message is outside the form and hidden elements stay hidden', () => {
  const html = renderFreeLanding(new URLSearchParams('v=a'));
  const css = readFileSync(new URL('../microlandings/public/free.css', import.meta.url), 'utf8');
  assert.ok(html.indexOf('</form>') < html.indexOf('id="free-success"'));
  assert.match(html, /id="free-success"[^>]*hidden/);
  assert.match(css, /\.free-page\s+\[hidden\]\s*\{\s*display:\s*none\s*!important/);
  assert.match(html, /class="free-sticky-cta"[^>]*hidden/);
  assert.match(css, /body\.has-cookie-banner \.free-sticky-cta/);
});
