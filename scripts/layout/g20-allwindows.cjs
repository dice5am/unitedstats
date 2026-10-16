// App Lead review of 687feb2: EVERY window (and every view) on EVERY chart with all 20 selected, both themes, three sizes:
// no 'Application error', no page errors, no console errors. Plus the fix687 assertions (Russia #19 / #13 at 1Y, notes, count text).
// usage: PW=<playwright> BASE=http://localhost:3911 OUT=<dir> SIZES="390x844,1366x657,1440x900" node g20-allwindows.cjs
const {chromium}=require(process.env.PW);const B=process.env.BASE||'http://localhost:3911';const OUT=process.env.OUT||'/workspace/wave-g20-menu/fix687',OUT2=process.env.OUT2||'/workspace/wave-g20-menu/fixc2e';
const ALL='CAN,USA,JPN,GBR,DEU,FRA,ITA,ARG,AUS,BRA,CHN,IND,IDN,MEX,RUS,SAU,ZAF,KOR,TUR,EU',DEF='CAN,USA,JPN,GBR,DEU,CHN,IND,EU',G7='CAN,USA,JPN,GBR,DEU,FRA,ITA';
const TABS={economy:['gdp','1','3','25','15'],labour:['unemp','jobs','2','17','22','12','18','24'],finance:['13','7','10','6','20','19','21'],society:['4','11','23','8','16'],environment:['5','9','14']};
// buttons may be hidden behind a phone <select> at 390: click through the DOM so every option is still exercised
const pick=(p,gi,j)=>p.evaluate(([gi,j])=>{const b=document.querySelectorAll('.cardsec [role=radiogroup]')[gi].querySelectorAll('button')[j];b.click();return b.textContent;},[gi,j]);
const WINRE=/^(Timeframe|Year|Window|Period)/i;
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});let states=0,asserts=0;const bad=[];
const ok=(c,m)=>{asserts++;if(!c)bad.push(m);};
for(const sz of (process.env.SIZES||'390x844,1366x657,1440x900').split(','))for(const t of ['light','dark']){const [w,h]=sz.split('x').map(Number);
 const c=await b.newContext({viewport:{width:w,height:h},hasTouch:w<500});await c.addInitScript(t=>localStorage.setItem('us-theme',t),t);const p=await c.newPage();
 let errs=[];p.on('pageerror',e=>errs.push('pageerror '+e.message.slice(0,120)));p.on('console',m=>{if(m.type()==='error'&&!/\/favicon\.ico$/.test(m.location()?.url||''))/* the app ships no favicon: the browser's own favicon 404 is not an app error */errs.push('console '+m.text().slice(0,120)+' '+(m.location()?.url||''))});
 const k=`${w}x${h}-${t}`;
 const appErr=()=>p.evaluate(()=>/Application error/i.test(document.body.innerText));
 const check=async(lbl)=>{states++;await p.waitForTimeout(350);const ae=await appErr();if(ae||errs.length)bad.push(`${k} ${lbl}: ${ae?'Application error ':''}${errs.slice(0,2).join(' | ')}`);errs=[];};
 if(process.env.ONLY!=='c2e')for(const [tab,ids] of Object.entries(TABS))for(const id of ids){
  await p.goto(`${B}/${tab}?chart=${id}&c=${ALL}`);await p.waitForTimeout(1300);await check(`${id} default`);
  const groups=await p.$$eval('.cardsec [role=radiogroup]',g=>g.map((x,i)=>({i,l:x.getAttribute('aria-label')||'',n:x.querySelectorAll('button').length})));
  const views=groups.filter(g=>!WINRE.test(g.l)),wins=groups.filter(g=>WINRE.test(g.l));
  const combos=views.length?views.flatMap(v=>Array.from({length:v.n},(_,j)=>[v,j])):[[null,0]];
  for(const [v,j] of combos){
   if(v){await pick(p,v.i,j);await check(`${id} ${v.l}#${j}`);}
   for(const g of wins)for(let q=0;q<g.n;q++){const lb=await pick(p,g.i,q);await check(`${id} ${v?v.l+'#'+j+' ':''}${g.l} ${lb}`);}
  }}
 if(process.env.ONLY!=='c2e'){ // ---- fix687 assertions (ONLY=c2e skips the window loop and this block) ----
 // (1,5,b) #19 1Y with all 20: Russia panel draws its annual points as dots, header = latest point whatever source + muted 'IMF 2025' tag, stats box names IMF
 await p.goto(`${B}/finance?chart=19&ca_win=1&c=${ALL}`);await p.waitForTimeout(1500);
 const r19=await p.evaluate(()=>{const f=[...document.querySelectorAll('.cardsec figure.smp')].find(x=>/^Russia/.test(x.querySelector('figcaption')?.textContent||''));if(!f)return null;
  return {head:f.querySelector('figcaption b')?.textContent||'',tag:f.querySelector('[data-head-src]')?.textContent||'',tagCol:f.querySelector('[data-head-src]')?getComputedStyle(f.querySelector('[data-head-src]')).color:'',bCol:getComputedStyle(f.querySelector('figcaption b')).color,
   dots:f.querySelectorAll('.ext circle').length,na:/n\/a/.test(f.querySelector('figcaption').textContent)}});
 ok(r19&&r19.dots>=1&&!r19.na,`${k} #19 1Y Russia panel draws annual dots, never n/a (${JSON.stringify(r19)})`);
 ok(r19&&/^\+1\.5%/.test(r19.head)&&/IMF 2025/.test(r19.tag)&&r19.tagCol!==r19.bCol,`${k} #19 1Y Russia header '+1.5% · IMF 2025' with muted tag (${JSON.stringify(r19)})`);
 if(r19){const dot=p.locator('.cardsec figure.smp',{hasText:'Russia'}).locator('.ext circle').last();await dot.scrollIntoViewIfNeeded();const bb=await dot.boundingBox();
  if(w<500)await p.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2);else await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2);await p.waitForTimeout(400);
  const sb=await p.evaluate(()=>document.querySelector('.cardsec .statbox, .cardsec [class*=stat]')?.innerText||'');
  ok(/Russia/.test(sb)&&/2025/.test(sb)&&/IMF/.test(sb),`${k} #19 stats box names IMF for Russia 2025 (${sb.replace(/\n/g,' / ').slice(0,120)})`);
  await p.screenshot({path:`${OUT}/1-5-19-1Y-russia-${k}.png`});}
 // (6,c) #13 1Y: Russia's World Bank 2025 cells drawn; 'not yet published' not used while a source has a point in the window
 await p.goto(`${B}/finance?chart=13&in_win=1&c=${ALL}`);await p.waitForTimeout(1500);
 const r13=await p.evaluate(()=>{const r=document.querySelector('.cardsec .hrow[data-code=RUS]');if(!r)return null;const cs=[...r.querySelectorAll('[role=gridcell]')];return {drawn:cs.filter(x=>!x.classList.contains('hna')).length,naIdx:cs.findIndex(x=>x.classList.contains('hna'))}});
 ok(r13&&r13.drawn>=1,`${k} #13 1Y Russia World Bank 2025 cells drawn (${JSON.stringify(r13)})`);
 if(r13&&r13.naIdx>=0){const cell=p.locator('.cardsec .hrow[data-code=RUS] [role=gridcell]').nth(r13.naIdx);await cell.scrollIntoViewIfNeeded();const bb=await cell.boundingBox();
  if(w<500)await p.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2);else await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2);await p.waitForTimeout(400);
  const sb=await p.evaluate(()=>document.querySelector('.cardsec .heat')?.innerText||'');
  ok(!/not yet published/.test(sb)&&/World Bank 2025/.test(sb),`${k} #13 1Y Russia n/a cell says no data yet (latest World Bank 2025), not 'not yet published' (${sb.slice(0,140).replace(/\n/g,' / ')})`);}
 if(r13){const d=p.locator('.cardsec .hrow[data-code=RUS] [role=gridcell]').first();await d.scrollIntoViewIfNeeded();const bb=await d.boundingBox();if(w<500)await p.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2);else await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2);await p.waitForTimeout(400);
  await p.screenshot({path:`${OUT}/6-13-1Y-russia-${k}.png`});}
 // (2) #7 Euro area BIS note (same copy as #20); (3) notes on derived datasets
 const txt=async(u)=>{await p.goto(`${B}/${u}`);await p.waitForTimeout(1400);return p.evaluate(()=>document.querySelector('.cardsec')?.textContent||'');};
 const EA='Euro area: BIS publishes the euro area, not the EU27, for this series.',CN="China: OECD publishes China's real GDP as growth rates only. We chain them into an index, so compare growth, not levels.",SA='Saudi Arabia: population from World Bank throughout.';
 const t7=await txt(`finance?chart=7&c=${ALL}`),t20=await txt(`finance?chart=20&c=${ALL}`);ok(t7.includes(EA)&&t20.includes(EA),`${k} #7 and #20 both carry '${EA}'`);
 await p.goto(`${B}/finance?chart=7&c=${ALL}`);await p.waitForTimeout(1200);await p.evaluate(()=>{const n=[...document.querySelectorAll('.g20note')].find(e=>/Euro area: BIS/.test(e.textContent));n?.closest('details')&&(n.closest('details').open=true);n?.scrollIntoView({block:'center'})});await p.waitForTimeout(300);await p.screenshot({path:`${OUT}/2-7-euro-note-${k}.png`});
 for(const [u,lbl] of [['economy?chart=gdp&g_view=gdp','GDP'],['economy?chart=gdp&g_view=pc','GDP per capita'],['labour?chart=jobs&j_view=jpc','Jobs per capita']]){const tt=await txt(`${u}&c=${ALL}`);
  // jobs per capita uses jobs + population, not GDP: Saudi population note only (the China GDP note would be wrong there)
  ok(lbl==='Jobs per capita'?tt.includes(SA)&&!tt.includes(CN):tt.includes(CN)&&tt.includes(SA),`${k} ${lbl}: ${lbl==='Jobs per capita'?'Saudi population note (no China GDP note)':'China GDP and Saudi population notes'} in Sources by country`);
  await p.evaluate(()=>{const n=[...document.querySelectorAll('.g20note')].find(e=>/^China/.test(e.textContent));n?.closest('details')&&(n.closest('details').open=true);n?.scrollIntoView({block:'center'})});await p.waitForTimeout(300);await p.screenshot({path:`${OUT}/3-notes-${lbl.replace(/ /g,'')}-${k}.png`});}
 // (4) count text: #15 Default (India greyed) 'all 7 selected with data'; G7 preset 'all seven'
 const t15=await txt(`economy?chart=15&c=${DEF}`),g15=await txt(`economy?chart=15&c=${G7}`);
 ok(/all 7 selected with data/.test(t15),`${k} #15 Default reads 'all 7 selected with data'`);ok(/latest year all seven have/.test(g15),`${k} #15 G7 preset keeps 'all seven'`);
 await p.goto(`${B}/economy?chart=15&c=${DEF}`);await p.waitForTimeout(1200);await p.evaluate(()=>{const n=[...document.querySelectorAll('.cardsec dd')].find(e=>/selected with data/.test(e.textContent));n?.closest('details')&&(n.closest('details').open=true);n?.scrollIntoView({block:'center'})});await p.waitForTimeout(300);await p.screenshot({path:`${OUT}/4-15-with-data-${k}.png`});
 }
 // ---- fixc2e (Design pass on c2e3f34) ----
 // (1) #13 row labels never cut, label column = measured longest name, 8px to the first cell
 for(const win of ['1','5','10','20','50'])for(const view of ['headline','core']){await p.goto(`${B}/finance?chart=13&in_win=${win}&in_view=${view}&c=${ALL}`);await p.waitForTimeout(1100);
  const r=await p.evaluate(()=>{const hs=[...document.querySelectorAll('.cardsec .hrh')];const cut=hs.filter(h=>h.scrollWidth>h.clientWidth+0.5).map(h=>h.textContent);
   const gaps=[...document.querySelectorAll('.cardsec .hrow[data-code]')].map(r=>{const h=r.querySelector('.hrh'),c=r.querySelector('.hc');const hr=h.getBoundingClientRect(),cr=c.getBoundingClientRect();
    const rng=document.createRange();rng.selectNodeContents(h);return Math.round(cr.left-rng.getBoundingClientRect().right);});
   const sa=hs.find(h=>/^(Saudi Arabia|SA)$/.test(h.textContent));return {n:hs.length,cut,minGap:Math.min(...gaps),sa:sa?.textContent,saFull:sa?sa.scrollWidth<=sa.clientWidth:false}});
  ok(r.n===(view==='core'?14:20)&&!r.cut.length&&(view==='core'||r.saFull),/* core: 6 greyed (no core CPI), Saudi Arabia among them */`${k} #13 ${win}Y ${view}: no row label cut (${r.n} rows, cut [${r.cut}], ${r.sa})`);
  ok(r.minGap>=8,`${k} #13 ${win}Y ${view}: >=8px from the longest label to the first cell (min ${r.minGap}px)`);
  if(win==='5'&&view==='headline')await p.screenshot({path:`${OUT2}/1-13-labels-${k}.png`});}
 // (2) #19 headers: value on the header line, tag on its own line under it right-aligned, equal header heights, panel tops aligned per row
 for(const win of ['1','5','10','20','50']){await p.goto(`${B}/finance?chart=19&ca_win=${win}&c=${ALL}`);await p.waitForTimeout(1300);
  const r=await p.evaluate(()=>{const fs=[...document.querySelectorAll('.cardsec figure.smp')];const hs=fs.map(f=>Math.round(f.querySelector('figcaption').getBoundingClientRect().height));
   const rows={};fs.forEach(f=>{const b=f.getBoundingClientRect();const k=Math.round(b.top/20);(rows[k]=rows[k]||[]).push([Math.round(b.top),Math.round(f.querySelector('svg')?.getBoundingClientRect().top||0)]);});
   const mis=Object.values(rows).filter(rw=>new Set(rw.map(x=>x[0])).size>1||new Set(rw.map(x=>x[1])).size>1).length;
   const ru=fs.find(f=>/^Russia/.test(f.querySelector('figcaption').textContent));let tag=null;
   if(ru){const v=ru.querySelector('figcaption b').getBoundingClientRect(),t=ru.querySelector('[data-head-src]')?.getBoundingClientRect(),n=ru.querySelector('figcaption > span').getBoundingClientRect();
    tag=t?{below:t.top>=v.bottom-1,right:Math.abs(t.right-v.right)<=1,valueOnName:Math.abs(v.top-n.top)<=3,oneLine:t.height<18}:null;}
   return {hs:[...new Set(hs)],mis,tag}});
  ok(r.hs.length===1&&r.mis===0,`${k} #19 ${win}Y: all panel header heights equal (${r.hs}) and panel/plot tops aligned per row (${r.mis} misaligned rows)`);
  if(win==='1')ok(r.tag&&r.tag.below&&r.tag.right&&r.tag.valueOnName&&r.tag.oneLine,`${k} #19 1Y Russia: value on the header line, 'IMF 2025' on its own line under it, right-aligned (${JSON.stringify(r.tag)})`);
  if(win==='1'){await p.locator('.cardsec figure.smp',{hasText:'Russia'}).scrollIntoViewIfNeeded();await p.screenshot({path:`${OUT2}/2-19-header-${k}.png`});}}
 if(errs.length)bad.push(`${k} assertions: ${errs.slice(0,3).join(' | ')}`);errs=[];
 await c.close();}
console.log(`allwindows: ${states} states, ${asserts} fix687+fixc2e assertions, ${bad.length} bad`);bad.forEach(x=>console.log('  '+x));await b.close();process.exit(bad.length?1:0)})();
