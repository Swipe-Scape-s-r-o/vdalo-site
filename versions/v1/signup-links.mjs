const signupBase = 'https://app.vdalo.tech/signup';

export function signupHref(content = 'site_cta') {
 const query = new URLSearchParams({
  utm_source: 'site',
  utm_medium: 'cta',
  utm_campaign: 'self_registration',
  utm_content: String(content).toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'site_cta'
 });
 return `${signupBase}?${query}`;
}

export const loginHref = 'https://app.vdalo.tech/app/login';
