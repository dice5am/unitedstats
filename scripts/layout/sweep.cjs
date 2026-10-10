const {chromium}=require(process.env.PW);const B='http://localhost:3907';
const ALL=[['economy','gdp','g',[1,50],['gdp','pc'],'g_view'],['economy','1'],['labour','unemp','u',[1,50]],['labour','jobs','j',[1,50],['jobs','jpc'],'j_view'],['labour','2','uh',[1,50]],['labour','22'],
 ['finance','13','in',[1,50],['headline','core'],'in_view'],['finance','7','pr',[1,50]],['finance','10'],['finance','6'],['finance','20','hd',[1,50]],['finance','19','ca',[1,10,50]],['finance','21']];
const CHECK=()=>{const o=[];const figs=[...document.querySelectorAll('.figs .fig')];
 figs.forEach((f,i)=>{const v=f.querySelector('.figv');if(v){const r=v.getBoundingClientRect();if(r.width<60)o.push(`fig${i} ${Math.round(r.width)}`)}
  const p=f.querySelector('.figp');if(p){const r=p.getBoundingClientRect(),fr=f.getBoundingClientRect(),lh=parseFloat(getComputedStyle(p).lineHeight)||16;if(Math.round(r.height/lh)>2||(r.width<0.4*fr.width&&p.textContent.length>14))o.push(`date${i} narrow`)}});
 document.querySelectorAll('.cardsec *').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&r.right>innerWidth+1&&!e.closest('svg'))o.push('offscreen '+e.tagName+'.'+e.className)});
 const vis=[...document.querySelectorAll('.srctag,.tagin')].filter(e=>e.getClientRects().length&&getComputedStyle(e).display!=='none');
 if(!vis.length)o.push('no visible tag');if(vis.length>1)o.push('tag twice');
 if(/Sept/.test(document.body.innerText))o.push('Sept');
 const h=document.querySelector('.cardsec h2'),lh=parseFloat(getComputedStyle(h).lineHeight);
 return {o:[...new Set(o)].slice(0,6),sw:document.documentElement.scrollWidth,tag:vis.map(e=>e.closest('.figp')?'[date] '+e.closest('.figp').textContent:e.textContent).join('|'),title:h.textContent,tl:Math.round(h.getBoundingClientRect().height/lh)}};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const [w,h] of [[390,844],[1366,768],[1440,900]])for(const t of ['dark','light']){const c=await b.newContext({viewport:{width:w,height:h}});await c.addInitScript(t=>localStorage.setItem('us-theme',t),t);const p=await c.newPage();const bad=[];let n=0;const notes=[];
 for(const [tab,id,px,wins,views,vp] of ALL)for(const v of views||[null])for(const win of wins||[null]){const u=`${B}/${tab}?chart=${id}`+(win?`&${px}_win=${win}`:'')+(v?`&${vp}=${v}`:'');await p.goto(u);await p.waitForTimeout(900);n++;
  const r=await p.evaluate(CHECK);if(r.o.length||r.sw>w)bad.push(`${u.slice(22)} ${JSON.stringify(r)}`);
  if(['13','10','19','7'].includes(id)||(w===390&&!win)||win===1)await p.screenshot({path:`/workspace/fix2-${w}-${t}-${id}${v?'-'+v:''}${win?'-'+win:''}.png`});
  if(w===390&&t==='dark'&&(id==='13'||(id==='gdp'&&win===1&&v==='gdp')))notes.push(`${id} ${v||''}: title "${r.title}" ${r.tl} line(s); tag ${r.tag}`);
  if(t==='dark'&&(id==='13'||id==='19')&&(win===1||!win)){const g=await p.evaluate(()=>{const s=document.querySelector('.cardsec .sub').getBoundingClientRect(),c=document.querySelector('.cardsec .ctrls2')?.getBoundingClientRect(),tg=document.querySelector('.toprow .srctag')?.getBoundingClientRect();return `sub→controls gap ${Math.round(c.top-s.bottom)}px; tag ${tg?Math.round(tg.left)+','+Math.round(tg.top):'-'} controls ${Math.round(c.left)},${Math.round(c.top)}`});notes.push(`${id} ${v||''} ${w}: ${g}`);}
 }
 console.log(`${w}x${h} ${t}: ${n} states, ${bad.length} bad${bad.length?'\n  '+bad.join('\n  '):''}${notes.length?'\n  '+notes.join('\n  '):''}`);await c.close();}
await b.close()})();
