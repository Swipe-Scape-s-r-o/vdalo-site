/* Values that require confirmation stay empty until the team supplies them. */
window.VDALO_CONFIG = {
  trialDays: 14,
  trialRequiresCard: false,
  accessTimeText: null, // TODO(Oleg): confirm access setup time
  responseTimeText: null, // TODO(Oleg): confirm response time
  implementationDaysText: null, // TODO(Oleg): confirm implementation timeline
  phone: null, // TODO(Oleg): add verified phone
  email: null, // TODO(Oleg): add verified email
  telegramUrl: null, // TODO(Oleg): add verified Telegram contact
  viberUrl: null, // TODO(Oleg): add verified Viber contact
  firstTutorialUrl: null, // TODO(Oleg): add first setup tutorial
  legalName: null, // TODO(Oleg): confirm legal entity
  legalCode: null, // TODO(Oleg): confirm registration code
  legalAddress: null, // TODO(Oleg): confirm legal address
  trademarkRegistered: false,
  channelManagerAddonTiersVisible: false,
  periodDiscountAppliesToAddons: false,
  faqExtra: [],
  heroVideo: null, // TODO(Oleg): provide approved 15-second video loop
  integrations: [
    { name: 'Booking.com', logo: '/v1/assets/booking-logo.svg', type: null },
    { name: 'Airbnb', logo: '/v1/assets/airbnb-logo.svg', type: null },
    { name: 'Expedia', logo: '/v1/assets/expedia-logo.svg', type: null },
    { name: 'Agoda', logo: '/v1/assets/agoda-logo.svg', type: null },
    { name: 'Google Hotels & Vacation Rentals', logo: null, type: null },
    { name: 'Trip.com', logo: null, type: null }
  ],
  author: {
    name: 'Олег',
    photo: '/v1/assets/oleg-stepeniev.jpg',
    linkedinUrl: 'https://www.linkedin.com/in/olegalisio/',
    instagramUrl: null, // TODO(Oleg): add verified Instagram
    facebookUrl: null, // TODO(Oleg): add verified Facebook
    telegramChannelUrl: null // TODO(Oleg): add verified Telegram channel
  }
};
