// DOM check (Cavin 2026-10-16 rule): with all 20 selected, on every chart each country is either drawn (its name, short
// code or data-code is in the plot/legend/aria of the card) or greyed in that chart's menu with a note. Never silent.
const {chromium}=require(process.env.PW);const B=process.env.BASE||'http://localhost:3911';
const CH=process.env.CHARTS.split(';').map(s=>s.split(':'));
const ALL='CAN,USA,JPN,GBR,DEU,FRA,ITA,ARG,AUS,BRA,CHN,IND,IDN,MEX,RUS,SAU,ZAF,KOR,TUR,EU';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));const bad=[];let n=0;
for(const [tab,id] of CH){await p.goto(`${B}/${tab}?chart=${id}&c=${ALL}`);await p.waitForTimeout(1400);
  const btn=await p.$('.cardsec .pbtn');let rows=[];
  if(btn){await btn.click();await p.waitForTimeout(250);rows=await p.$$eval('.plist .prow',x=>x.map(e=>({c:e.dataset.code,name:e.querySelector('span')?.textContent?.trim(),na:e.classList.contains('na'),note:e.querySelector('.nanote')?.textContent||''})));await p.keyboard.press('Escape');await p.mouse.click(5,5);await p.waitForTimeout(150);}
  const txt=await p.evaluate(()=>{const c=document.querySelector('.cardsec');if(!c)return '';const parts=[c.innerText];c.querySelectorAll('[aria-label]').forEach(e=>parts.push(e.getAttribute('aria-label')));c.querySelectorAll('[data-code]').forEach(e=>parts.push('#'+e.dataset.code+'#'));c.querySelectorAll('svg text').forEach(e=>parts.push(e.textContent));return parts.join('\n');});
  if(!rows.length){ // single-select (#9): its own country list
    const opts=await p.$$eval('.cardsec select option, .cardsec [role=option]',x=>x.length);if(!opts&&id!=='9')bad.push(`${id}: no menu`);n++;continue;}
  const SH={CAN:'CA',USA:'US',JPN:'JP',GBR:'UK',DEU:'DE',FRA:'FR',ITA:'IT',ARG:'AR',AUS:'AU',BRA:'BR',CHN:'CN',IND:'IN',IDN:'ID',MEX:'MX',RUS:'RU',SAU:'SA',ZAF:'ZA',KOR:'KR',TUR:'TR',EU:'EU'};
  for(const r of rows){if(r.na&&/no data from any source|n\/a for|data ends/.test(r.note))continue;
    const ok=txt.includes(r.name)||txt.includes('#'+r.c+'#')||new RegExp(`(^|[^A-Za-z])${SH[r.c]}([^A-Za-z]|$)`).test(txt)||(r.c==='EU'&&/Euro area/.test(txt));
    if(!ok)bad.push(`${id}:${r.c} (${r.name}) neither drawn nor greyed`);}
  n++;}
if(errs.length)bad.push('page errors '+errs.slice(0,3).join(' | '));
console.log(`alldrawn: ${n} charts, ${bad.length?bad.length+' bad':'0 bad'}`);bad.forEach(x=>console.log('  '+x));await b.close();process.exit(bad.length?1:0)})();
