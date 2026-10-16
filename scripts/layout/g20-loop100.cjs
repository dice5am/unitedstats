// React #185 loop hunt: loads #19 1Y with Russia + Canada N times under CDP CPU throttling, taps Russia's panel ~2s after
// load, asserts no 'Application error', no pageerror, no React #185. usage: PW=.. VP=1440x900 N=100 RATE=4 node g20-loop100.cjs
const {chromium}=require(process.env.PW);const B=process.env.BASE||'http://localhost:3911';
const [w,h]=(process.env.VP||'1440x900').split('x').map(Number),N=+(process.env.N||100),RATE=+(process.env.RATE||4);
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox'],...(process.env.FORCE?{ignoreDefaultArgs:['--hide-scrollbars']}:{})}); /* FORCE: real classic 15px scrollbars (headless hides them by default) */const bad=[];let e185=0,appErr=0,pe=0;
 const c=await b.newContext({viewport:{width:w,height:h},hasTouch:w<500});if(process.env.FORCE)await c.addInitScript(()=>{ // FORCE=1: class forced on (kept on by the observer)
  const on=()=>{const h=document.documentElement;if(!h)return;if(!h.classList.contains('has-classic-scrollbar'))h.classList.add('has-classic-scrollbar'); /* add() re-sets the attribute even when present: guard, or the observer loops */};
  on();document.addEventListener('DOMContentLoaded',on);new MutationObserver(on).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});});
 const p=await c.newPage();const cdp=await c.newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:RATE});
 let errs=[];p.on('pageerror',e=>errs.push(e.message));
 for(let i=0;i<N;i++){errs=[];try{await p.goto(`${B}/finance?chart=19&ca_win=1&c=RUS,CAN`,{waitUntil:'load'});}catch(e){bad.push(`run ${i+1}: load timeout`);continue;}await p.waitForTimeout(2000);
  const f=p.locator('.cardsec figure.smp',{hasText:'Russia'}).locator('svg');
  if(await f.count()){const bb=await f.boundingBox();if(bb){const x=bb.x+bb.width*0.8,y=bb.y+bb.height/2;if(w<500)await p.touchscreen.tap(x,y);else await p.mouse.click(x,y);}}
  await p.waitForTimeout(500);
  const ae=await p.evaluate(()=>/Application error/i.test(document.body.innerText));const r185=errs.some(m=>/#185|Maximum update depth/.test(m));
  if(ae)appErr++;if(errs.length)pe++;if(r185)e185++;
  if(ae||errs.length)bad.push(`run ${i+1}: ${ae?'Application error; ':''}${errs.slice(0,2).map(m=>m.slice(0,90)).join(' | ')}`);}
 console.log(`loop100 ${w}x${h} cpu x${RATE}${process.env.FORCE?' FORCED classic scrollbar':''}: ${N} loads, ${bad.length} bad (Application error ${appErr}, pageerror ${pe}, React #185 ${e185})`);bad.slice(0,10).forEach(x=>console.log('  '+x));
 await b.close();process.exit(bad.length?1:0)})();
