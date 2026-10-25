// Snapshot of the deployed CRM parser, commit 226bc51.
// Only the local Refusal dependency is replaced; parsing and timeline logic are unchanged.
class Refusal extends Error {
    constructor(message, status = 422){
        super(message);
        this.status = status;
    }
}
export class SiteIntakeRefusal extends Refusal {
    code;
    constructor(code, message, status = 422){
        super(message, status);
        this.name = 'SiteIntakeRefusal';
        this.code = code;
    }
}
const text = (v, max = 300)=>{
    if (typeof v !== 'string') return null;
    const s = v.trim().slice(0, max);
    return s ? s : null;
};
const obj = (v)=>v && typeof v === 'object' && !Array.isArray(v) ? v : {};
const count = (v)=>{
    const n = typeof v === 'number' ? v : typeof v === 'string' && /^\d{1,5}$/.test(v.trim()) ? Number(v.trim()) : NaN;
    return Number.isInteger(n) && n > 0 && n < 100000 ? n : null;
};
const UTM_KEYS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term'
];
function utmOf(v) {
    const o = obj(v);
    const out = {};
    for (const k of UTM_KEYS){
        const s = text(o[k], 150);
        if (s) out[k] = s;
    }
    return out;
}
function splitContact(v) {
    const s = text(v, 180);
    if (!s) return {
        email: null,
        phone: null
    };
    return s.includes('@') ? {
        email: s.toLowerCase(),
        phone: null
    } : {
        email: null,
        phone: s
    };
}
const OFFER_LABELS = {
    audit: 'Аудит процесів',
    research: 'Дослідницьке інтервʼю',
    trial: 'Пробний доступ',
    switch: 'Перехід з іншої PMS',
    'one-process': 'Один процес',
    'pms-check': 'Перевірка PMS',
    'founding-hotels': 'Готелі-засновники',
    'hotel-research': 'Опитування готелів'
};
const TOP5_FUNNELS = {
    staff: 'персонал',
    nights: 'нічні дзвінки',
    overbook: 'овербукінг',
    commission: 'комісії',
    blackout: 'відключення світла',
    tourist_tax: 'туристичний збір'
};
const ID = /^[A-Za-z0-9-]{8,64}$/;
export function parseSiteIntake(raw, headerKey) {
    const b = obj(raw);
    let externalId;
    let out;
    if (b.source === 'vdalo-website') {
        externalId = b.id;
        const kind = b.kind === 'trial' ? 'trial' : b.kind === 'audit' ? 'audit' : null;
        if (!kind) throw new SiteIntakeRefusal('unknown_kind', 'Невідомий вид форми сайту');
        const c = splitContact(b.contact);
        const mode = kind === 'trial' ? b.mode === 'implementation' ? 'implementation' : 'start' : null;
        out = {
            form: `website:${kind}`,
            label: kind === 'trial' ? mode === 'implementation' ? 'Пробний доступ із впровадженням' : 'Пробний доступ' : 'Аудит процесів',
            wantsTrial: kind === 'trial',
            name: text(b.name, 100),
            hotelName: text(b.property, 150),
            ...c,
            city: null,
            units: count(b.units),
            unitsRange: null,
            currentPms: text(b.pms, 150),
            lodgingKind: null,
            pain: text(b.pain, 1000),
            page: kind === 'trial' ? '/#trial' : '/#audit',
            utm: utmOf(b.utm),
            permissions: {
                respond_to_request: b.consent === true
            },
            details: {
                mode,
                estimate: text(b.estimate, 1200),
                first_touch: utmOf(obj(b.attribution).first_touch),
                last_touch: utmOf(obj(b.attribution).last_touch),
                first_touch_at: text(obj(b.attribution).first_touch_at, 40),
                latest_touch_at: text(obj(b.attribution).latest_touch_at, 40),
                submitted_at: text(b.submittedAt, 40)
            }
        };
    } else if (b.source === 'vdalo-microlandings') {
        externalId = b.lead_id;
        const offer = text(b.offer_id, 40);
        if (!offer) throw new SiteIntakeRefusal('unknown_offer', 'Заявка мікролендинга без оффера');
        const contact = obj(b.contact);
        const q = obj(b.qualification);
        const a = obj(b.attribution);
        const p = obj(b.permissions);
        const c = splitContact(contact.phone_or_email);
        const permissions = {};
        for (const k of [
            'respond_to_request',
            'research_interview',
            'product_information',
            'report_delivery'
        ])permissions[k] = p[k] === true;
        out = {
            form: `funnel:${offer}`,
            label: OFFER_LABELS[offer] ?? offer,
            wantsTrial: offer === 'trial',
            name: text(contact.name, 100),
            hotelName: text(contact.property_name, 150),
            ...c,
            city: text(q.city, 100),
            units: count(q.room_count),
            unitsRange: null,
            currentPms: text(q.current_PMS, 150),
            lodgingKind: text(q.property_type, 30),
            pain: text(q.main_problem, 1000),
            page: text(b.landing_route, 100) ?? `/${offer}`,
            utm: utmOf(obj(a.last_touch)),
            permissions,
            details: {
                offer_status: text(b.offer_status, 30),
                proposed_next_step: text(b.proposed_next_step, 80),
                decision_role: text(q.decision_role, 30),
                selected_process: text(q.selected_process, 30),
                pms_usage: text(q.pms_usage, 30),
                pms_satisfaction: text(q.pms_satisfaction, 30),
                pilot_interest: q.pilot_interest === true,
                feedback_interest: q.feedback_interest === true,
                quiz_answers: q.quiz_answers && typeof q.quiz_answers === 'object' ? q.quiz_answers : null,
                first_touch: utmOf(obj(a.first_touch)),
                last_touch: utmOf(obj(a.last_touch)),
                entry_offer: text(a.entry_offer, 40),
                first_touch_at: text(a.first_touch_at, 40),
                latest_touch_at: text(a.latest_touch_at, 40),
                submitted_at: text(b.submitted_at, 40)
            }
        };
    } else if (b.source_system === 'vdalo-top5-funnels') {
        externalId = b.lead_id;
        const kind = b.kind === 'trial_request' ? 'trial_request' : b.kind === 'tourist_tax_inquiry' ? 'tourist_tax_inquiry' : null;
        if (!kind) throw new SiteIntakeRefusal('unknown_kind', 'Невідомий вид заявки воронки');
        const contact = obj(b.contact);
        const a = obj(b.attribution);
        const funnel = text(a.funnel, 30);
        out = {
            form: `top5:${kind}`,
            label: kind === 'trial_request' ? `Тест 14 днів${funnel && TOP5_FUNNELS[funnel] ? ` (${TOP5_FUNNELS[funnel]})` : ''}` : 'Туристичний збір — запит',
            wantsTrial: kind === 'trial_request',
            name: null,
            hotelName: text(contact.hotel_name, 150),
            email: text(contact.email, 180)?.toLowerCase() ?? null,
            phone: text(contact.phone, 40),
            city: text(contact.location, 120),
            units: null,
            unitsRange: text(contact.room_range, 20),
            currentPms: null,
            lodgingKind: null,
            pain: null,
            page: funnel ? `top5/${funnel}` : 'top5',
            utm: utmOf(a.utm),
            permissions: {
                respond_to_request: obj(b.permissions).respond_to_request === true
            },
            details: {
                preferred_method: text(contact.preferred_method, 20),
                funnel,
                code: text(a.code, 10),
                video: text(a.video, 50),
                watched_percent: typeof a.watched_percent === 'number' ? a.watched_percent : null,
                calculator: text(a.calculator, 4000),
                traffic_source: text(a.source, 30),
                quiz_answers: obj(b.qualification).quiz_answers ?? null,
                last_touch: utmOf(obj(a.last_touch)),
                first_touch: utmOf(obj(a.first_touch)),
                first_touch_at: text(a.first_touch_at, 40),
                latest_touch_at: text(a.latest_touch_at, 40),
                submitted_at: text(b.submitted_at, 40)
            }
        };
    } else {
        throw new SiteIntakeRefusal('unknown_form', 'Невідома форма сайту');
    }
    if (typeof externalId !== 'string' || !ID.test(externalId)) throw new SiteIntakeRefusal('bad_id', 'Заявка без id', 400);
    if (headerKey && headerKey !== externalId) throw new SiteIntakeRefusal('id_mismatch', 'Idempotency-Key не збігається з id заявки', 400);
    return {
        externalId,
        ...out
    };
}
export const marketingConsent = (_i)=>false;
export const hasContact = (i)=>!!(i.email || i.phone);
export function sourceDetailOf(i) {
    const parts = [
        'utm_source',
        'utm_medium',
        'utm_campaign'
    ].map((k)=>i.utm[k] ?? '—');
    const utm = parts.some((p)=>p !== '—') ? parts.join('/') : null;
    return [
        'vdalo',
        i.form,
        i.page,
        utm
    ].filter(Boolean).join(' · ').slice(0, 300);
}
const PERMISSION_LABELS = {
    respond_to_request: 'на відповідь',
    research_interview: 'на інтервʼю',
    product_information: 'інформація про VDALO',
    report_delivery: 'звіт дослідження'
};
export function intakeEventText(i, repeat) {
    const allowed = Object.entries(i.permissions).filter(([, v])=>v).map(([k])=>PERMISSION_LABELS[k] ?? k);
    const lines = [
        `${repeat ? 'Повторна заявка' : 'Заявка'} з сайту VDALO: ${i.label}`,
        `Сторінка: ${i.page ?? '—'}${Object.keys(i.utm).length ? ` · ${Object.entries(i.utm).map(([k, v])=>`${k}=${v}`).join(' ')}` : ''}`,
        `Згода: ${allowed.length ? allowed.join(', ') : 'не надано'} (рекламної — ні)`,
        i.unitsRange ? `Розмір: ${i.unitsRange} номерів` : null,
        typeof i.details.preferred_method === 'string' ? `Зручний звʼязок: ${i.details.preferred_method}` : null,
        i.pain ? `Текст заявки: ${i.pain}` : null,
        typeof i.details.estimate === 'string' ? `Розрахунок сайту: ${i.details.estimate}` : null,
        i.wantsTrial ? 'Хоче спробувати 14 днів — провести онбординг вручну (самореєстрації ще немає).' : null
    ];
    return lines.filter(Boolean).join('\n');
}
export const TRIAL_NEXT_ACTION = 'Хоче спробувати 14 днів — провести онбординг вручну';
export function intakeAlertText(input) {
    const lines = [
        `🆕 ${input.repeat ? 'Повторна заявка' : 'Заявка'} з сайту VDALO — ${input.label}`,
        `Імʼя: ${input.name ?? '—'}`,
        `Обʼєкт: ${input.hotelName ?? '—'}`,
        `Місто: ${input.city ?? '—'}`,
        `Номерів: ${input.units ?? input.unitsRange ?? '—'}`,
        `Телефон: ${input.phone ?? '— (контакт у CRM)'}`,
        input.leadUrl
    ];
    return lines.filter(Boolean).join('\n');
}
