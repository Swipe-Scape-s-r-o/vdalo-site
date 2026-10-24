import {assetVersion} from './assets.mjs';
import {renderAuditDialog} from './render.mjs';

export function renderTrialOffer() {
 return `<dialog id="home-trial-offer" class="home-trial-offer" data-site-trial-offer aria-labelledby="home-trial-offer-title" aria-describedby="home-trial-offer-copy"><button type="button" class="home-offer-close" data-home-offer-dismiss aria-label="Закрити пропозицію" autofocus><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.65" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button><h2 id="home-trial-offer-title">Спробуйте VDALO 14 днів</h2><p id="home-trial-offer-copy">Перевірте бронювання, заїзди й роботу команди на задачах свого готелю.</p><button type="button" class="home-button" data-home-offer-start data-open="audit" data-location="site-timed-trial" data-interest="14 днів тестування VDALO для мого готелю">Залишити заявку на тест <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.65" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></button><p class="home-offer-note">Без банківської картки. Команда зв’яжеться з вами та погодить початок тестування.</p><button type="button" class="home-offer-later" data-home-offer-dismiss>Продовжити перегляд</button></dialog>`;
}

// Enable only on registered ordinary site routes, independently of index policy.
// Campaign renderers never opt in, including /tourist-tax/start.
export function withSiteTrialOffer(html,enabled=false) {
 if(!enabled||!/<\/body>/i.test(html)||/\bdata-site-trial-offer\b/.test(html))return html;
 const hasApp=/<script\b[^>]*\bsrc=["']\/(?:v1\/)?app\.js(?:[?"'])/i.test(html);
 const hasAudit=/\bid=["']audit-dialog["']/i.test(html);
 const request=hasAudit?'':renderAuditDialog().replace('class="lead-dialog"','class="lead-dialog site-trial-request"');
 // Reuse the established form controller and delivery endpoint. Do not mount a
 // second app.js on pages that already contain it or replace their own forms.
 const app=hasApp?'':`<script src="/v1/app.js?v=${assetVersion('app.js')}" defer></script>`;
 const assets=`<link rel="stylesheet" href="/v1/trial-offer.css?v=${assetVersion('trial-offer.css')}">${app}<script src="/v1/trial-offer.js?v=${assetVersion('trial-offer.js')}" defer></script>`;
 return html.replace(/<\/head>/i,`${assets}</head>`).replace(/<\/body>/i,`${request}${renderTrialOffer()}</body>`);
}
