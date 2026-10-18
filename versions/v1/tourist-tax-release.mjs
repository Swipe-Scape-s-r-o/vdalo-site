// Publication is an explicit editorial action. Candidate pages stay unavailable
// until their place record, legal rule, calculator and unique copy pass QA.
export const touristTaxReleasePlan = Object.freeze({
  activeWave: 3,
  waves: Object.freeze([
    Object.freeze({
      number: 1,
      label: 'Перша хвиля, 30 локацій',
      candidateSlugs: Object.freeze([
        'kyyiv','lviv','odesa','ivano-frankivsk','vinnytsya','chernivtsi','uzhhorod','lutsk','sumy','dnipro',
        'kharkiv','zaporizhzhya','rivne','ternopil','poltava','cherkasy','zhytomyr','chernihiv','bukovel','truskavets',
        'yaremche','skhidnytsya','slavsko','mukachevo','berehove','kamyanets-podilskyy','kolomyya','pylypets','solotvyno','pivdenne'
      ]),
      // Add each destination only after its rule model, geography, calculator and copy gates pass.
      // Add a slug here only after its source record and page QA are complete.
      publishedSlugs: Object.freeze(['lutsk','sumy','vinnytsya','pivdenne','ternopil','zaporizhzhya','rivne','chernihiv','kolomyya','ivano-frankivsk','chernivtsi','lviv','cherkasy','berehove','uzhhorod','slavsko','kyyiv','odesa','dnipro','zhytomyr','yaremche'])
    }),
    Object.freeze({number:2,label:'Друга хвиля',candidateSlugs:Object.freeze(['polyana','khust']),publishedSlugs:Object.freeze(['polyana','khust'])}),
    Object.freeze({number:3,label:'Третя хвиля',candidateSlugs:Object.freeze(['vynohradiv','yasinya','tyachiv','irpin','skole']),publishedSlugs:Object.freeze(['vynohradiv','yasinya','tyachiv','irpin','skole'])})
  ])
});

export function isTouristTaxPlacePublished(slug, plan=touristTaxReleasePlan) {
  if (!slug || !plan || !Array.isArray(plan.waves)) return false;
  return plan.waves.some(wave => wave.number <= plan.activeWave
    && wave.candidateSlugs?.includes(slug)
    && wave.publishedSlugs?.includes(slug));
}

export function validateTouristTaxReleasePlan(knownSlugs, plan=touristTaxReleasePlan) {
  const errors=[];
  const seen=new Set();
  for (const wave of plan.waves ?? []) {
    if (!Number.isInteger(wave.number) || wave.number < 1) errors.push('release wave number must be a positive integer');
    for (const slug of wave.candidateSlugs ?? []) {
      if (!knownSlugs.has(slug)) errors.push(`release candidate does not exist: ${slug}`);
      if (seen.has(slug)) errors.push(`release candidate is assigned more than once: ${slug}`);
      seen.add(slug);
    }
    for (const slug of wave.publishedSlugs ?? []) {
      if (!wave.candidateSlugs?.includes(slug)) errors.push(`published slug is not a candidate in wave ${wave.number}: ${slug}`);
    }
  }
  if (!plan.waves?.some(wave => wave.number === plan.activeWave)) errors.push('active release wave does not exist');
  return {ok:errors.length===0,errors};
}
