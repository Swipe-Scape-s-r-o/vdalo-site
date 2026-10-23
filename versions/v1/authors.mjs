export const authors = [
  {
    slug: 'oleh-stepeniev',
    name: 'Олег Степенєв',
    role: 'Підприємець і автор матеріалів про готельні процеси',
    profilePath: '/authors/oleh-stepeniev',
    image: '/v1/assets/oleg-stepeniev-profile.jpg',
    expertise: ['готельна нерухомість', 'модульні будинки', 'операційні процеси готелю'],
  },
  {
    slug: 'kostiantyn-tripailo',
    name: 'Костянтин Тріпайло',
    role: 'Співвласник VDALO, співзасновник і CMO Міністерства з Продажів',
    profilePath: '/authors/kostiantyn-tripailo',
    image: '/v1/assets/kostiantyn-tripailo-profile.jpg',
    expertise: ['маркетинг', 'SEO та GEO', 'контент', 'AI у продажах'],
  },
];

export function getAuthor(slug = 'oleh-stepeniev') {
  return authors.find(author => author.slug === slug) || authors[0];
}
