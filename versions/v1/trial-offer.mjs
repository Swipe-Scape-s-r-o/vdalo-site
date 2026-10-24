import {assetVersion} from './assets.mjs';

export function renderTrialOffer() {
 return `<dialog id="home-trial-offer" class="home-trial-offer" data-site-trial-offer aria-labelledby="home-trial-offer-title" aria-describedby="home-trial-offer-copy">
 <button type="button" class="home-offer-close" data-home-offer-dismiss aria-label="Закрити пропозицію" autofocus><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.65" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
 <div class="home-offer-scroll">
 <h2 id="home-trial-offer-title">Спробуйте VDALO 14 днів</h2>
 <p id="home-trial-offer-copy">Залиште контакти. Команда допоможе розпочати тестування у вашому готелі.</p>
 <div class="home-offer-content">
 <form data-kind="contact" data-form-variant="timed-trial" data-location="site-timed-trial" method="post" action="/api/leads/audit" data-clarity-mask="true" novalidate>
 <input type="hidden" name="pain" value="Заявка на 14-денний тест VDALO з попапу">
 <div class="home-offer-fields">
 <div class="field"><label for="home-offer-name">Ім’я</label><input id="home-offer-name" name="name" autocomplete="name" required minlength="2" maxlength="100" aria-describedby="home-offer-name-error" data-clarity-mask="true"><span class="field-error" id="home-offer-name-error"></span></div>
 <div class="field"><label for="home-offer-phone">Телефон</label><input id="home-offer-phone" name="contact" type="tel" autocomplete="tel" inputmode="tel" required maxlength="40" placeholder="+380 00 000 00 00" aria-describedby="home-offer-contact-error" data-clarity-mask="true"><span class="field-error" id="home-offer-contact-error"></span></div>
 </div>
 <div class="honey" aria-hidden="true"><label for="home-offer-website">Вебсайт</label><input id="home-offer-website" name="website" tabindex="-1" autocomplete="off"></div>
 <div class="consent-field"><label><input type="checkbox" name="consent" required aria-describedby="home-offer-consent-error"><span>Погоджуюся на обробку контактів для відповіді на заявку. <a href="/privacy" target="_blank" rel="noopener">Політика конфіденційності</a>.</span></label><span class="field-error" id="home-offer-consent-error"></span></div>
 <p class="form-status" role="status" aria-live="polite"></p>
 <button type="submit" class="home-button form-submit" data-label="Залишити заявку на тест">Залишити заявку на тест</button>
 <p class="home-offer-note">Без банківської картки. Команда погодить початок тесту.</p>
 </form>
 <div class="form-success" hidden tabindex="-1"><p id="home-offer-success-copy">Команда VDALO зв’яжеться з вами та допоможе розпочати 14-денний тест.</p><button type="button" class="home-button" data-home-offer-dismiss>Повернутися до сайту</button></div>
 </div>
 <button type="button" class="home-offer-later" data-home-offer-dismiss>Продовжити перегляд</button>
 </div>
 </dialog>`;
}

// Enable only on registered ordinary site routes, independently of index policy.
// Campaign renderers never opt in, including /tourist-tax/start.
export function withSiteTrialOffer(html,enabled=false) {
 if(!enabled||!/<\/body>/i.test(html)||/\bdata-site-trial-offer\b/.test(html))return html;
 const hasApp=/<script\b[^>]*\bsrc=["']\/(?:v1\/)?app\.js(?:[?"'])/i.test(html);
 // Reuse the established form controller and delivery endpoint. Do not mount a
 // second app.js on pages that already contain it or replace their own forms.
 const app=hasApp?'':`<script src="/v1/app.js?v=${assetVersion('app.js')}" defer></script>`;
 const assets=`<link rel="stylesheet" href="/v1/trial-offer.css?v=${assetVersion('trial-offer.css')}">${app}<script src="/v1/trial-offer.js?v=${assetVersion('trial-offer.js')}" defer></script>`;
 return html.replace(/<\/head>/i,`${assets}</head>`).replace(/<\/body>/i,`${renderTrialOffer()}</body>`);
}
