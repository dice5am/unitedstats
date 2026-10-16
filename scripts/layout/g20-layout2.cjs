// App Lead re-review of 050cab7: (2) measure toggle vs country button at 390 on every chart with a toggle, both themes;
// (4) #22 labels never cut or overlapping the marker; (3) #13 Dataset names every drawn country. Screenshots to OUT.
const {chromium}=require(process.env.PW);const B=process.env.BASE||'http://localhost:3911',O=process.env.OUT||'/workspace/wave-g20-menu/applead2';
const ALL='CAN,USA,JPN,GBR,DEU,FRA,ITA,ARG,AUS,BRA,CHN,IND,IDN,MEX,RUS,SAU,ZAF,KOR,TUR,EU',DEF='CAN,USA,JPN,GBR,DEU,CHN,IND,EU';
const TOG=[['economy','gdp'],['labour','jobs'],['finance','13']];
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});let F=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)F++};
 for(const th of ['dark','light']){const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true});await c.addInitScript((t)=>localStorage.setItem('us-theme',t),th);const p=await c.newPage();
  for(const [t,id] of TOG)for(const sel of [DEF,ALL]){await p.goto(`${B}/${t}?chart=${id}&c=${sel}`);await p.waitForTimeout(1500);
   const r=await p.evaluate(()=>{const s=document.querySelector('.cardsec');const pb=s.querySelector('.pbtn');const vs=s.querySelector('.vseg, [role=radiogroup][aria-label=Measure], [role=radiogroup][aria-label=View]');if(!pb||!vs)return {none:true};
    const a=pb.getBoundingClientRect(),v=vs.getBoundingClientRect();const btns=[...vs.querySelectorAll('button')];
    return {ov:!(v.right<=a.left||v.left>=a.right||v.bottom<=a.top||v.top>=a.bottom),below:v.top>=a.bottom-0.5,cut:btns.filter(x=>x.scrollWidth>x.clientWidth+1).map(x=>x.textContent),labels:btns.map(x=>x.textContent),h:Math.round(btns[0].getBoundingClientRect().height),vw:Math.round(v.width),cw:Math.round(s.getBoundingClientRect().width)}});
   if(r.none){ok(id==='13',`${th} ${id}: no measure toggle in the controls row`);continue;}
   ok(!r.ov&&!r.cut.length&&(id==='13'||(r.below&&r.h===32&&r.vw>=r.cw-2)),`390 ${th} ${id} ${sel.split(',').length} sel: ${id==='13'?'view toggle (Headline/Core) clear of country button, not cut':'per-capita toggle own row'} under country button, ${r.vw}/${r.cw}px wide, ${r.h}px tall, labels ${r.labels.join('/')} cut:[${r.cut}]`);
   await p.$eval('.cardsec .pbtn',e=>e.scrollIntoView({block:'center'}));await p.screenshot({path:`${O}/390-${th}-toggle-${id}-${sel.split(',').length}.png`});}
  await c.close();}
 for(const [w,h] of [[390,844],[1440,900]])for(const th of ['dark','light']){const c=await b.newContext({viewport:{width:w,height:h}});await c.addInitScript((t)=>localStorage.setItem('us-theme',t),th);const p=await c.newPage();
  await p.goto(`${B}/labour?chart=22&c=${ALL}`);await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>[...document.querySelectorAll('.sc .scr')].map(b=>{const n=b.querySelector('.scnt'),t=b.querySelector('.sct'),v=b.querySelector('.scv');const nr=n.getBoundingClientRect(),tr=t.getBoundingClientRect();
   return {name:n.textContent,cut:n.scrollWidth>n.clientWidth+1,gap:Math.round(tr.left-nr.right),naTrack:!!t.querySelector('.na'),val:v.textContent,lines:Math.round(nr.height/parseFloat(getComputedStyle(n).lineHeight))}}));
  const bad=r.filter(x=>x.cut||x.gap<8||x.naTrack||x.lines>2);const lefts=await p.evaluate(()=>new Set([...document.querySelectorAll('.sc .sct')].map(t=>Math.round(t.getBoundingClientRect().left))).size);
  ok(!bad.length&&lefts===1,`#22 ${w} ${th}: ${r.length} rows, labels never cut/overlapping (min gap ${Math.min(...r.map(x=>x.gap))}px, wrapped ${r.filter(x=>x.lines>1).map(x=>x.name).join(',')||'none'}), one label column, n/a only in value column ${bad.map(x=>x.name)}`);
  await p.$eval('.sc',e=>e.scrollIntoView());await p.screenshot({path:`${O}/${w}-${th}-22-20.png`,fullPage:false});await c.close();}
 const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();await p.goto(`${B}/finance?chart=13&c=${ALL}`);await p.waitForTimeout(1500);
 await p.evaluate(()=>{const b=[...document.querySelectorAll('.cardsec summary, .cardsec button')].find(e=>/How it/.test(e.textContent));b&&b.click()});await p.waitForTimeout(400);
 const ds=await p.evaluate(()=>{const d=[...document.querySelectorAll('.cardsec dt')].find(e=>e.textContent==='Dataset');return d?d.nextElementSibling.textContent:''});
 ok(['Argentina','Australia','China','Russia','Türkiye','World Bank'].every(n=>ds.includes(n)||(n==='Türkiye'&&ds.includes('Turkey'))),'#13 Dataset: '+ds);await p.screenshot({path:`${O}/13-dataset.png`,fullPage:true});
 await b.close();process.exitCode=F?1:0;})();
