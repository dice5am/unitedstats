// Layout checks (run against next start on :3907): PW=<path to playwright> node scripts/layout/round4c.cjs
// Covers: #20 round ticks, US January note at every window, Jobs pc 50Y summary dates, Jobs 50Y own-latest employed in stats box,
// 1366x657 cut-off description opens/closes on click, 390 touch tap inside COVID band shows its label.
const {chromium}=require(process.env.PW);const B='http://localhost:3907';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const out=[];
let c=await b.newContext({viewport:{width:1440,height:900}});let p=await c.newPage();
await p.goto(B+'/finance?chart=20');await p.waitForTimeout(1200);out.push('#20 legend: '+await p.evaluate(()=>[...document.querySelectorAll('.notes li')].map(l=>l.textContent).find(t=>/Same scale/.test(t)))+' | ticks: '+await p.evaluate(()=>[...document.querySelectorAll('.fm text.fmt')].slice(0,3).map(t=>t.textContent).join(',')));
await p.screenshot({path:'/workspace/fix3-1440-20.png'});
for(const w of [1,50]){await p.goto(B+`/labour?chart=jobs&j_win=${w}`);await p.waitForTimeout(1200);out.push(`jobs ${w}Y US Jan note: `+await p.evaluate(()=>!!document.querySelector('.notes')?.textContent.includes('US January jump')));}
await p.goto(B+'/labour?chart=jobs&j_view=pc&j_win=50');await p.waitForTimeout(1200);out.push('jpc 50Y summary: '+await p.evaluate(()=>[...document.querySelectorAll('.sr-only,[role=img]')].map(e=>e.getAttribute('aria-label')||e.textContent).find(t=>/1976/.test(t||''))?.slice(0,80)));
await p.goto(B+'/labour?chart=jobs&j_win=50');await p.waitForTimeout(1200);
const plot=await p.$('.plot svg, .lc svg, svg[role=img]');const bb=await plot.boundingBox();await p.mouse.move(bb.x+bb.width-60,bb.y+bb.height/2);await p.waitForTimeout(400);
out.push('jobs 50Y stats box at end: '+await p.evaluate(()=>document.querySelector('.tip')?.innerText.replace(/\n/g,' | ')));await p.screenshot({path:'/workspace/fix3-1440-jobs50-statbox.png'});
await c.close();
c=await b.newContext({viewport:{width:1366,height:657}});p=await c.newPage();
for(const u of ['/finance?chart=6','/labour?chart=17']){await p.goto(B+u);await p.waitForTimeout(1200);const s='.hero .cardsec .sub, .hero section .sub';
 const before=await p.evaluate(s=>{const e=[...document.querySelectorAll(s)].find(x=>x.offsetParent);return e&&{h:e.offsetHeight,cut:e.scrollWidth>e.clientWidth}},s);
 await p.click(s);await p.waitForTimeout(200);const after=await p.evaluate(s=>{const e=[...document.querySelectorAll(s)].find(x=>x.offsetParent);return {h:e.offsetHeight,open:e.classList.contains('open'),cut:e.scrollWidth>e.clientWidth}},s);
 await p.click(s);await p.waitForTimeout(200);const again=await p.evaluate(s=>[...document.querySelectorAll(s)].find(x=>x.offsetParent).classList.contains('open'),s);
 out.push(`1366x657 ${u} description: before ${JSON.stringify(before)} after click ${JSON.stringify(after)} second click open=${again}`);if(u.includes('=6'))await p.screenshot({path:'/workspace/fix3-1366x657-desc-open.png'});}
await c.close();
c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});p=await c.newPage();
await p.goto(B+'/economy?chart=gdp&g_win=10');await p.waitForTimeout(1500);
await p.evaluate(()=>document.querySelector('.covid').scrollIntoView({block:'center'}));await p.waitForTimeout(300);const cv=await p.evaluate(()=>{const r=document.querySelector('rect.covid, .covid')?.getBoundingClientRect();return r&&{x:r.x+r.width/2,y:r.y+r.height/2}});
if(cv){await p.touchscreen.tap(cv.x,cv.y);await p.waitForTimeout(400);out.push('390 touch tap in COVID band: '+await p.evaluate(()=>document.querySelector('.covtip')?.textContent||'NO LABEL'));await p.screenshot({path:'/workspace/fix3-390-covid-tap.png'});}else out.push('no covid rect found');
await b.close();console.log(out.join('\n'))})();
