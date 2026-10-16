const {chromium}=require(process.env.PW);const B='http://localhost:3911',O='/workspace/wave-g20-menu/applead';const DEF='CAN,USA,JPN,GBR,DEU,CHN,IND,EU';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const R={};
const ctx=async(w,h)=>{const c=await b.newContext({viewport:{width:w,height:h},hasTouch:w<500});await c.addInitScript(()=>localStorage.setItem('us-theme','dark'));const p=await c.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));return p;};
let p=await ctx(1440,900);
// (a) #13 AUS only and with default
for(const c of ['AUS',DEF+',AUS']){await p.goto(`${B}/finance?chart=13&c=${c}`);await p.waitForTimeout(1500);R[`a ${c}`]={rows:await p.$$eval('.cardsec .hrow',x=>x.map(e=>e.dataset.code).join(',')),errs:p.errs.length};}
await p.screenshot({path:`${O}/a-13-AUS-1440.png`});
// (b) #13 grey per view
for(const v of ['headline','core']){await p.goto(`${B}/finance?chart=13&c=${DEF},ARG,BRA&in_view=${v}`);await p.waitForTimeout(1500);await p.click('.cardsec .pbtn');await p.waitForTimeout(250);
 R[`b ${v}`]={greyed:await p.$$eval('.plist .prow.na',x=>x.map(e=>e.dataset.code).join(',')),rows:await p.$$eval('.cardsec .hrow',x=>x.map(e=>e.dataset.code).join(','))};await p.screenshot({path:`${O}/b-13-${v}-menu.png`});await p.keyboard.press('Escape');await p.mouse.click(3,3);}
// (g) #13 explainer
await p.goto(`${B}/finance?chart=13&c=${DEF},AUS`);await p.waitForTimeout(1500);const det=await p.$('.cardsec details, .cardsec .calcbtn, .cardsec button.howbtn');
const how=await p.$('text=How it’s calculated');if(how){await how.click();await p.waitForTimeout(400);}R.g=await p.evaluate(()=>{const g=document.querySelector('.cardsec .g20src');return g?g.innerText.slice(0,300):'none'});await p.screenshot({path:`${O}/g-13-sources.png`,fullPage:true});
// (d) GDP and #7 sources
for(const [t,id] of [['economy','gdp'],['finance','7']]){await p.goto(`${B}/${t}?chart=${id}&c=${DEF},AUS`);await p.waitForTimeout(1500);const hw=await p.$('text=How it’s calculated');if(hw){await hw.click();await p.waitForTimeout(400);}R[`d ${id}`]=await p.evaluate(()=>{const g=document.querySelector('.g20src');return g?g.innerText.replace(/\n/g,' / ').slice(0,250):'none'});await p.screenshot({path:`${O}/d-${id}-sources.png`,fullPage:true});}
// (e) #22 headline
for(const c of [DEF,'CAN,USA,JPN,GBR,DEU,FRA,ITA,ARG,AUS,BRA,CHN,IND,IDN,MEX,RUS,SAU,ZAF,KOR,TUR,EU']){await p.goto(`${B}/labour?chart=22&c=${c}`);await p.waitForTimeout(1500);R[`e ${c.length}`]=await p.$eval('.cardsec .figs',e=>e.innerText.replace(/\n/g,' '));}
await p.screenshot({path:`${O}/e-22-headline.png`});
// (c) stats box at 1440x900: tap a line on gdp with default; measure tip bottom vs viewport
await p.goto(`${B}/economy?chart=gdp&c=${DEF}`);await p.waitForTimeout(1500);await p.$eval('.cardsec .chart',e=>e.scrollIntoView({block:'center'}));
const tapLine=async(pg,touch)=>{const pt=await pg.evaluate(()=>{const h=document.querySelector('.cardsec .chart .hit[data-code=CAN]');const L=h.getTotalLength(),q=h.getPointAtLength(L*0.6),m=h.getScreenCTM();return {x:q.x*m.a+m.e,y:q.y*m.d+m.f}});if(touch)await pg.touchscreen.tap(pt.x,pt.y);else await pg.mouse.click(pt.x,pt.y);await pg.waitForTimeout(400);
 return await pg.evaluate((pt)=>{const t=document.querySelector('.cardsec .tip');if(!t)return {box:false};const r=t.getBoundingClientRect();return {box:true,top:Math.round(r.top),bottom:Math.round(r.bottom),vh:innerHeight,covers:pt.x>=r.left&&pt.x<=r.right&&pt.y>=r.top&&pt.y<=r.bottom,pt:[Math.round(pt.x),Math.round(pt.y)]}},pt);};
for(const sel of [DEF,'CAN,USA,JPN,GBR,DEU,FRA,ITA,ARG,AUS,BRA,CHN,IND,IDN,MEX,RUS,SAU,ZAF,KOR,TUR,EU']){await p.goto(`${B}/economy?chart=gdp&c=${sel}`);await p.waitForTimeout(1500);await p.$eval('.cardsec .chart',e=>e.scrollIntoView({block:'center'}));R[`c 1440 ${sel.length}`]=await tapLine(p,false);await p.mouse.click(3,3);await p.evaluate(()=>scrollBy(0,-220));await p.waitForTimeout(200);R[`c 1440 fold ${sel.length}`]=await tapLine(p,false);}
await p.screenshot({path:`${O}/c-tip-1440x900.png`});
let q=await ctx(390,844);for(const sel of [DEF,'CAN,USA,JPN,GBR,DEU,FRA,ITA,ARG,AUS,BRA,CHN,IND,IDN,MEX,RUS,SAU,ZAF,KOR,TUR,EU']){await q.goto(`${B}/economy?chart=gdp&c=${sel}`);await q.waitForTimeout(1500);await q.$eval('.cardsec .chart',e=>e.scrollIntoView({block:'center'}));R[`c 390 ${sel.length}`]=await tapLine(q,true);}
await q.screenshot({path:`${O}/c-tip-390.png`});
// (f) 390 toggle vs country button
await q.goto(`${B}/economy?chart=gdp&c=${DEF}`);await q.waitForTimeout(1500);R.f=await q.evaluate(()=>{const a=document.querySelector('.cardsec .pbtn').getBoundingClientRect();const segs=[...document.querySelectorAll('.cardsec .seg, .cardsec [role=radiogroup]')].map(e=>e.getBoundingClientRect());const ov=segs.filter(r=>!(r.right<=a.left||r.left>=a.right||r.bottom<=a.top||r.top>=a.bottom)).length;return {pbtn:[a.left,a.top,a.right,a.bottom].map(Math.round),overlaps:ov,segs:segs.map(r=>[r.left,r.top,r.right,r.bottom].map(Math.round))}});
await q.$eval('.cardsec .pbtn',e=>e.scrollIntoView({block:'center'}));await q.screenshot({path:`${O}/f-390-controls.png`});
// (h) 1366: open menu, check end labels under popover are covered (popover on top)
let r=await ctx(1366,657);await r.goto(`${B}/economy?chart=gdp&c=${DEF}`);await r.waitForTimeout(1500);await r.click('.cardsec .pbtn');await r.waitForTimeout(400);
R.h=await r.evaluate(()=>{const pp=document.querySelector('.ppanel').getBoundingClientRect();const out=[];document.querySelectorAll('.cardsec .endl text').forEach(t=>{const b=t.getBoundingClientRect();if(b.right>pp.left&&b.left<pp.right&&b.bottom>pp.top&&b.top<pp.bottom){const x=Math.min(b.right-2,pp.right-2),y=(b.top+b.bottom)/2;const top=document.elementFromPoint(x,y);out.push({label:t.textContent,onTop:top&&top.closest('.ppanel')?'menu':'label'});}});return out});
await r.screenshot({path:`${O}/h-1366-menu-labels.png`});
R.errs=[p.errs,q.errs,r.errs].flat().slice(0,3);console.log(JSON.stringify(R,null,1));
const ALL=20,F=[];const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)F.push(m)};
ok(R['a AUS'].rows.split(',').filter(Boolean).join()==='AUS'&&R['a AUS'].errs===0,'(a) #13 AUS only renders, no page error');
ok(R['b headline'].greyed===''&&R['b core'].greyed.includes('ARG')&&R['b core'].greyed.includes('BRA'),'(b) #13 grey per view');
ok(R.g!=='none','(g) #13 Sources by country present');ok(R['d gdp']!=='none'&&R['d 7']!=='none','(d) GDP and #7 Sources by country');
const e20=Object.keys(R).find(k=>k.startsWith('e ')&&+k.slice(2)>40);ok(/South Africa\s*[−-]2\.47/.test(R[e20])&&!/0\.00\s*pts/.test(R[e20]),'(e) #22 all 20: Still below South Africa −2.47');
const cs=Object.keys(R).filter(k=>k.startsWith('c '));ok(cs.every(k=>R[k].box&&!R[k].covers&&R[k].bottom<=R[k].vh&&R[k].top>=0),'(c) stats box never covers tapped point, inside viewport: '+cs.map(k=>k+'='+R[k].top+'-'+R[k].bottom+(R[k].covers?'!':'')).join(' '));
ok(R.f.overlaps===0,'(f) 390 toggle clear of country button');ok(R.h.every(x=>x.onTop==='menu'),'(h) 1366 menu on top of '+R.h.length+' labels');
ok(R.errs.length===0,'no page errors');process.exitCode=F.length?1:0;await b.close();})();
