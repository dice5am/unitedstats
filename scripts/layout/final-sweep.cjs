// fold rule: the short source TAG next to the headline (.srctag/.tagin) must end within 40px of the fold at >=1366 wide.
// usage: CHARTS="tab:id[:param=v,..];..." SIZES="390x844,1440x900" THEMES="dark,light" PFX=name node sw.js
const {chromium}=require(process.env.PW);const B='http://localhost:3907';
const CH=process.env.CHARTS.split(';').map(s=>{const [tab,id,q]=s.split(':');return {tab,id,q:q?'&'+q.replace(/,/g,'&'):''}});
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const sz of (process.env.SIZES||'390x844,1440x900').split(','))for(const t of (process.env.THEMES||'dark,light').split(',')){const [w,h]=sz.split('x').map(Number);
 const c=await b.newContext({viewport:{width:w,height:h},hasTouch:w<500});await c.addInitScript(t=>localStorage.setItem('us-theme',t),t);const p=await c.newPage();const bad=[],notes=[];p.on('pageerror',e=>bad.push('PAGE ERROR '+e.message.slice(0,80)));
 for(const ch of CH){const u=`${B}/${ch.tab}?chart=${ch.id}${ch.q}`;await p.goto(u);await p.waitForTimeout(1000);
  const r=await p.evaluate(()=>{const o=[];document.querySelectorAll('.cardsec *').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&r.right>innerWidth+1&&!e.closest('svg')&&!e.closest('.sr-only'))o.push('offscreen '+e.tagName+'.'+e.className)});
   const s=document.querySelector('.cardsec .source');if(s&&s.scrollWidth>s.clientWidth+1)o.push('source truncated');
   const vis=[...document.querySelectorAll('.srctag,.tagin')].filter(e=>e.getClientRects().length&&getComputedStyle(e).display!=='none');if(vis.length!==1)o.push('tags '+vis.length);
   if(/Sept/.test(document.body.innerText))o.push('Sept');if(document.documentElement.scrollWidth>innerWidth)o.push('page wider');
   const W=innerWidth,H=innerHeight,h1=document.querySelector('.hero .h1'),figs=[...document.querySelectorAll('.hero .figv')].filter(e=>e.getClientRects().length);
   const fs=e=>parseFloat(getComputedStyle(e).fontSize);
   if(!h1)o.push('no title');else{if(W>=1024&&fs(h1)!==(H<800?24:40))o.push('title '+fs(h1));const sb=document.querySelector('.hero .sub');if(sb&&W>=1024&&sb.getBoundingClientRect().top-h1.getBoundingClientRect().bottom>12)o.push('sub gap');}
   figs.forEach(f=>{const want=W>=1024?(H<800?30:48):W<768?40:null;if(want&&fs(f)!==want)o.push('headline '+fs(f));const r=f.getBoundingClientRect();if(r.right>W+1)o.push('headline overflow')});
   let fold=null;const tg=vis[0];if(W>=1366&&tg){fold=Math.round(tg.getBoundingClientRect().bottom+scrollY-H);if(fold>40)o.push('source tag '+fold+'px below fold');}
   window.__fold=fold;
   return {fold,o:[...new Set(o)].slice(0,5),title:document.querySelector('.cardsec h2')?.textContent}});
  if(r.o.length)bad.push(`${ch.id}${ch.q} ${r.o.join('; ')}`);
  await p.screenshot({path:`${process.env.OUT||"/workspace"}/${process.env.PFX}-${w}x${h}-${t}-${ch.id}${ch.q.replace(/[&=]/g,'_')}.png`});
  // tap the first tappable item, check the stats box opens and does not cover it
  if(r.fold!==null)notes.push(`${ch.id}${ch.q} fold ${r.fold}`);
  const it=(await p.$('.cardsec .scr:not(.dbax), .cardsec .slr line[stroke=transparent], .cardsec .wf, .cardsec .tile, .cardsec .scp'))||(await p.$('.cardsec .chart svg, .cardsec .hs svg, .cardsec .mult svg'));const lastDot=await p.$('.cardsec .scp circle:last-of-type');const it2=(await p.$('.cardsec .scp path'))?lastDot:null;
  if(it&&(t==='dark'||process.env.TAPALL)){const IT=it2||it;if(process.env.TAPALL||t==='dark')0;const bb=await IT.boundingBox();if(bb){await IT.scrollIntoViewIfNeeded();const bb2=await IT.boundingBox();await (w<500?p.touchscreen.tap(bb2.x+bb2.width/2,bb2.y+bb2.height/2):p.mouse.click(bb2.x+bb2.width/2,bb2.y+bb2.height/2));await p.waitForTimeout(350);
    const res=await p.evaluate(([x,y])=>{const pill=document.querySelector('.covpill');const sb=document.querySelector('.statbox,.tip,.tex');if(!sb)return pill?'COVID label opened (tap landed on COVID band)':'NO BOX';const line=sb.classList.contains('tip');const r=sb.getBoundingClientRect();const cov=x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;return (cov&&!line?'COVERS TAPPED ITEM | ':'')+sb.innerText.replace(/\n/g,' | ').slice(0,160)},[bb2.x+bb2.width/2,bb2.y+bb2.height/2]);
    notes.push(`${ch.id} tap: ${res}`);if(/NO BOX|COVERS/.test(res))bad.push(`${ch.id} tap ${res.slice(0,40)}`);await p.screenshot({path:`${process.env.OUT||"/workspace"}/${process.env.PFX}-${w}x${h}-${t}-${ch.id}${ch.q.replace(/[&=]/g,'_')}-popover.png`});}}
  notes.push(`${ch.id}: "${r.title}"`);}
 console.log(`${sz} ${t}: ${CH.length} states, ${bad.length} bad${bad.length?'\n  '+bad.join('\n  '):''}\n  `+notes.join('\n  '));await c.close();}
await b.close()})();
