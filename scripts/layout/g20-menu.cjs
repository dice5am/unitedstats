// G20 country menu checks + screenshots (menu closed / open / filtered / >8 selected), URL round-trip, tap rule.
const {chromium}=require(process.env.PW);const B=process.env.BASE||'http://localhost:3907';const OUT=process.env.OUT||'/workspace/wave-g20-menu';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const res=[];
for(const [w,h] of [[390,844],[1366,657],[1440,900]])for(const t of ['dark','light']){
 const c=await b.newContext({viewport:{width:w,height:h},hasTouch:w<500});await c.addInitScript(t=>localStorage.setItem('us-theme',t),t);const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message.slice(0,80)));
 const k=`${w}x${h}-${t}`,bad=[];const tap=async(sel)=>{const e=await p.$(sel);await e.scrollIntoViewIfNeeded();const bb=await e.boundingBox();if(w<500)await p.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2);else await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2);await p.waitForTimeout(300)};
 await p.goto(`${B}/economy?chart=gdp`);await p.waitForTimeout(1200);
 const url0=await p.evaluate(()=>location.search);if(!/[?&]c=CAN,USA,JPN,GBR,DEU,CHN,IND,EU(&|$)/.test(url0))bad.push('default c= '+url0);
 const lab=await p.textContent('.pbtn .plabel');if(lab!=='Default (8)')bad.push('label '+lab);
 const dots=await p.$$eval('.pbtn .pdots i',x=>x.length);if(dots!==8)bad.push('dots '+dots);
 await p.$eval('.picker',e=>e.scrollIntoView({block:'center'}));await p.screenshot({path:`${OUT}/menu-closed-${k}.png`});
 await tap('.pbtn');const panel=await p.evaluate(()=>{const l=document.querySelector('.plist'),pp=document.querySelector('.ppanel'),r=pp.getBoundingClientRect();return {rows:l.querySelectorAll('.prow').length,scroll:l.scrollHeight>l.clientHeight+1,greyed:[...l.querySelectorAll('.prow.na')].filter(x=>/no data from any source/.test(x.textContent)).map(x=>x.dataset.code),presets:[...document.querySelectorAll('.quick button')].map(x=>x.textContent),on:[...document.querySelectorAll('.quick button.on')].map(x=>x.textContent),inView:r.top>=-1&&r.bottom<=innerHeight+1&&r.left>=-1&&r.right<=innerWidth+1}});
 if(panel.rows!==20)bad.push('rows '+panel.rows);if(!panel.scroll)bad.push('list does not scroll');if(panel.presets.join()!=='Default,G7')bad.push('presets '+panel.presets);if(panel.on.join()!=='Default')bad.push('preset on '+panel.on);if(panel.greyed.length!==0)bad.push('gdp greyed '+panel.greyed.join());if(!panel.inView)bad.push('panel off screen');
 await p.screenshot({path:`${OUT}/menu-open-${k}.png`});
 // type-to-filter
 await p.click('.psearch');await p.keyboard.type('sou');await p.waitForTimeout(200);const f=await p.$$eval('.prow',x=>x.map(e=>e.dataset.code).join());if(f!=='ZAF,KOR')bad.push('filter sou -> '+f);
 await p.screenshot({path:`${OUT}/menu-search-${k}.png`});
 await p.fill('.psearch','');
 // G7 preset -> label G7, URL c= G7
 await p.click('.quick button:has-text("G7")');await p.waitForTimeout(250);
 if((await p.textContent('.pbtn .plabel'))!=='G7')bad.push('G7 label');if(!/c=CAN,USA,JPN,GBR,DEU,FRA,ITA/.test(await p.evaluate(()=>location.search)))bad.push('G7 url');
 // add three more -> 10 selected -> 8 dots + "+2"
 for(const cd of ['ARG','AUS','BRA']) await p.click(`.prow[data-code=${cd}]`);await p.waitForTimeout(200);
 const more=await p.$eval('.pbtn',e=>({d:e.querySelectorAll('.pdots i').length,m:e.querySelector('.pmore')?.textContent,l:e.querySelector('.plabel').textContent}));if(more.d!==8||more.m!=='+2'||more.l!=='10 countries')bad.push('dots/+N '+JSON.stringify(more));
 await p.screenshot({path:`${OUT}/menu-open-10sel-${k}.png`});
 if(w<500)await p.click('.ppanel .done');else await p.keyboard.press('Escape');await p.waitForTimeout(250);
 await p.$eval('.picker',e=>e.scrollIntoView({block:'center'}));await p.screenshot({path:`${OUT}/menu-closed-10sel-${k}.png`});
 const sel10=await p.evaluate(()=>new URLSearchParams(location.search).get('c'));
 // every selected country with data in the window is drawn (G20 data wired)
 const nlines=await p.$$eval('.cardsec .chart .hit',x=>x.map(e=>e.dataset.code).join());if(nlines!==sel10)bad.push('lines '+nlines+' vs '+sel10);
 // refresh keeps it; tab switch keeps it
 await p.reload();await p.waitForTimeout(1200);if((await p.evaluate(()=>new URLSearchParams(location.search).get('c')))!==sel10)bad.push('refresh lost c');
 await tap('.tabs5 a[href^="/labour"]');await p.waitForTimeout(1500);const lc=await p.evaluate(()=>({c:new URLSearchParams(location.search).get('c'),l:document.querySelector('.pbtn .plabel')?.textContent}));if(lc.c!==sel10||lc.l!=='10 countries')bad.push('tab switch '+JSON.stringify(lc));
 // old G7 link
 await p.goto(`${B}/labour?view=jobs&win=5&on=CAN,FRA`);await p.waitForTimeout(1200);const ol=await p.evaluate(()=>location.search);if(!/c=CAN,FRA/.test(ol)||/[?&]on=/.test(ol))bad.push('old link '+ol);
 await p.goto(`${B}/economy?chart=gdp&g_on=JPN,ITA`);await p.waitForTimeout(1200);const ol2=await p.evaluate(()=>location.search);if(!/c=JPN,ITA/.test(ol2)||/g_on=/.test(ol2))bad.push('old g_on '+ol2);
 // only new peers selected: chart shows a message, no crash
 await p.goto(`${B}/labour?chart=12&c=ARG,EU`);await p.waitForTimeout(1500);const em=await p.$eval('.cardsec',e=>e.querySelector('.emptycard')?.textContent||'none');if(!/No data from any source for Argentina, European Union/.test(em))bad.push('empty '+em);
 // grey list on #12 + China rule: CHN greyed on #12 but kept in ?c=, drawn again on GDP without re-selecting
 await p.goto(`${B}/labour?chart=12&c=CAN,USA,CHN`);await p.waitForTimeout(1500);await tap('.cardsec .pbtn');await p.waitForTimeout(300);
 const g12=await p.evaluate(()=>({g:[...document.querySelectorAll('.plist .prow.na')].map(x=>x.dataset.code).join(' '),note:document.querySelector('.plist .prow.na')?.textContent||''}));
 if(g12.g!=='ARG BRA CHN IND IDN RUS SAU ZAF EU'||!/no data from any source/.test(g12.note))bad.push('#12 grey '+JSON.stringify(g12));
 await p.keyboard.press('Escape');const c12=await p.evaluate(()=>new URLSearchParams(location.search).get('c'));if(c12!=='CAN,USA,CHN')bad.push('china rule c on #12 '+c12);
 await p.goto(`${B}/economy?chart=gdp&c=${c12}`);await p.waitForTimeout(1500);const cl2=await p.$$eval('.cardsec .chart .hit',x=>x.map(e=>e.dataset.code).join());if(!/CHN/.test(cl2))bad.push('china rule gdp lines '+cl2);
 // tap rule on the line chart (G7)
 await p.goto(`${B}/economy?chart=gdp&c=CAN,USA,JPN,GBR,DEU,FRA,ITA`);await p.waitForTimeout(1300);
 const pt=await p.evaluate(()=>{const h=document.querySelector('.cardsec .chart .hit[data-code=USA]');h.scrollIntoView({block:'center'});const L=h.getTotalLength(),q=h.getPointAtLength(L*0.5),m=h.getScreenCTM();return {x:q.x*m.a+m.e,y:q.y*m.d+m.f}});
 if(w<500)await p.touchscreen.tap(pt.x,pt.y);else await p.mouse.click(pt.x,pt.y);await p.waitForTimeout(350);
 const st=await p.evaluate(()=>{const s=[...document.querySelectorAll('.cardsec .series')].map(g=>[g.querySelector('.hit')?.dataset.code,getComputedStyle(g).opacity]);return {box:!!document.querySelector('.cardsec .tip'),dim:s.filter(([c,o])=>c&&c!=='USA'&&+o<=0.31).length,us:s.find(([c])=>c==='USA')?.[1],rows:document.querySelectorAll('.cardsec .tip .tipr').length}});
 if(!st.box||st.dim!==6||+st.us!==1||st.rows!==7)bad.push('line tap '+JSON.stringify(st));
 await p.screenshot({path:`${OUT}/tap-line-${k}.png`});
 // empty space clears both: tap top-left plot corner (above all lines)
 const em2=await p.evaluate(()=>{const s=document.querySelector('.cardsec .chart svg').getBoundingClientRect();return {x:s.left+60,y:s.top+40}});
 if(w<500)await p.touchscreen.tap(em2.x,em2.y);else{await p.mouse.click(em2.x,em2.y);}await p.waitForTimeout(300);
 const cl=await p.evaluate(()=>({box:!!document.querySelector('.cardsec .tip'),dim:!!document.querySelector('.cardsec .chart.dimmed')}));
 if(w<500&&(cl.box||cl.dim))bad.push('empty tap did not clear '+JSON.stringify(cl));if(w>=500&&cl.dim)bad.push('empty click left dim');
 // end-label (legend) tap
 const el=await p.$('.cardsec .endl[data-code=JPN] text');if(el){const bb=await el.boundingBox();if(w<500)await p.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2);else await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2);await p.waitForTimeout(300);
  const lt=await p.evaluate(()=>({box:!!document.querySelector('.cardsec .tip'),f:document.querySelector('.cardsec .series.focus .hit')?.dataset.code}));if(!lt.box||lt.f!=='JPN')bad.push('label tap '+JSON.stringify(lt));}
 // desktop hover on a line dims
 if(w>=500){await p.mouse.move(5,5);await p.waitForTimeout(200);const pt2=await p.evaluate(()=>{const h=document.querySelector('.cardsec .chart .hit[data-code=CAN]');const L=h.getTotalLength(),q=h.getPointAtLength(L*0.8),m=h.getScreenCTM();return {x:q.x*m.a+m.e,y:q.y*m.d+m.f}});await p.mouse.move(pt2.x,pt2.y,{steps:4});await p.waitForTimeout(300);
  // with 10 lines another line can sit on top at that point: the focused line must be the one under the pointer
  const hv=await p.evaluate(({x,y})=>({box:!!document.querySelector('.cardsec .tip'),f:document.querySelector('.cardsec .series.focus .hit')?.dataset.code,top:document.elementFromPoint(x,y)?.dataset?.code}),pt2);if(!hv.box||!hv.f||hv.f!==hv.top)bad.push('hover '+JSON.stringify(hv));}
 // stats box internal scroll with >8 rows: N/A until new peers have data (only G7 can be drawn); check the CSS cap is applied
 const cap=await p.evaluate(()=>{const r=document.querySelector('.cardsec .tip .tiprows');return r?getComputedStyle(r).overflowY+' '+getComputedStyle(r).maxHeight:'no box'});
 if(errs.length)bad.push('page errors '+errs.join('|'));
 res.push(`${k}: ${bad.length?'FAIL '+bad.join('; '):'ok'} (rows scroll cap: ${cap})`);await c.close();}
console.log(res.join('\n'));await b.close();})().catch(e=>{console.log('ERR',e.message);process.exit(1)});
