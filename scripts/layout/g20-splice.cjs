// Russia splice markers by chart type + annual extensions (#13, #19). Screenshots to OUT.
const {chromium}=require(process.env.PW);const B=process.env.BASE||'http://localhost:3911',O=process.env.OUT||'/workspace/wave-g20-menu/splice';
const C='CAN,USA,JPN,GBR,DEU,FRA,ITA,RUS';
const CH=[['3','economy','tick','lg_win=50','OECD to 2020 | World Bank from 2021'],['8','society','copy','','OECD to 2023 | World Bank from 2024'],['13','finance','divider','in_win=10','OECD to 2022-03 | World Bank from 2023'],
 ['15','economy','copy','','OECD to 2020 | World Bank from 2021'],['19','finance','rule','ca_win=10','OECD to 2021-Q3 | IMF from 2022'],['22','labour','copy','','OECD to 2021-Q4 | ILO from 2022-Q1'],['25','economy','copy','','OECD to 2017 | World Bank from 2018']];
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});let F=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)F++};
 const c=await b.newContext({viewport:{width:1440,height:900}});await c.addInitScript(()=>localStorage.setItem('us-theme','dark'));const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 for(const [id,tab,kind,q,lab] of CH){await p.goto(`${B}/${tab}?chart=${id}&c=${C}${q?'&'+q:''}`);await p.waitForTimeout(1800);
  const r=await p.evaluate(()=>{const s=document.querySelector('.cardsec');return {tick:s.querySelectorAll('.brk.spl[data-code=RUS]').length,divider:s.querySelectorAll('.hrow[data-code=RUS] .hc.hspl').length,rule:s.querySelectorAll('line.splr[data-code=RUS]').length,
   other:s.querySelectorAll('.brk.spl:not([data-code=RUS]),line.splr:not([data-code=RUS]),.hrow:not([data-code=RUS]) .hspl').length,ext:s.querySelectorAll('g.ext[data-freq=annual] circle').length,
   annCells:[...s.querySelectorAll('.hrow[data-code=RUS] .hc')].filter(e=>!e.classList.contains('hna')).length}});
  const any=r.tick+r.divider+r.rule;
  await p.evaluate(()=>{const b=[...document.querySelectorAll('.cardsec summary, .cardsec button')].find(e=>/How it/.test(e.textContent));b&&b.click()});await p.waitForTimeout(400);
  const src=await p.evaluate(()=>{const g=document.querySelector('.cardsec .g20src');return g?g.innerText:''});
  ok(kind==='copy'?any===0:r[kind]>0&&r.other===0,`#${id} marker=${kind}: tick ${r.tick} divider ${r.divider} rule ${r.rule} other ${r.other}`);
  ok(src.includes(lab),`#${id} Sources by country has "${lab}"`);
  if(id==='19')ok(r.ext===4,`#19 Russia annual IMF dots drawn: ${r.ext}`);
  await p.$eval('.cardsec',e=>e.scrollIntoView());await p.screenshot({path:`${O}/${id}-RUS-1440.png`,fullPage:false});
  await p.screenshot({path:`${O}/${id}-RUS-sources.png`,fullPage:true});}
 // stats box rows: #19 tap Russia's 2024 annual dot; #13 tap a 2024 RUS cell
 await p.goto(`${B}/finance?chart=19&c=${C}&ca_win=10`);await p.waitForTimeout(1500);const d=await p.$('g.ext circle:nth-of-type(3)');await d.scrollIntoViewIfNeeded();const bb=await d.boundingBox();await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2);await p.waitForTimeout(300);
 const t19=await p.$eval('.cardsec .statbox',e=>e.innerText.replace(/\n/g,' | '));ok(/2024/.test(t19)&&/annual · IMF/.test(t19)&&/OECD to 2021-Q3 \| IMF from 2022/.test(t19),'#19 stats box: '+t19);await p.screenshot({path:`${O}/19-RUS-statbox.png`});
 await p.goto(`${B}/finance?chart=13&c=${C}&in_win=10`);await p.waitForTimeout(1500);const cells=await p.$$('.hrow[data-code=RUS] .hc');await cells[cells.length-2].click();await p.waitForTimeout(300);
 const t13=await p.$eval('.cardsec .statbox',e=>e.innerText.replace(/\n/g,' | '));ok(/annual · World Bank/.test(t13)&&/OECD to 2022-03 \| World Bank from 2023/.test(t13),'#13 stats box: '+t13);await p.screenshot({path:`${O}/13-RUS-statbox.png`});
 // window: #13 1Y has no divider
 await p.goto(`${B}/finance?chart=13&c=${C}&in_win=1`);await p.waitForTimeout(1500);ok(await p.$$eval('.hspl',x=>x.length)===0,'#13 1Y: splice outside window, no divider');
 ok(!errs.length,'no page errors '+errs.slice(0,2));await b.close();process.exitCode=F?1:0;})();
