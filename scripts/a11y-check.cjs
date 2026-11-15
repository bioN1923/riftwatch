/** WCAG 2 A/AA check (axe-core) of the main pages, dark and light, against a local demo server: node scripts/a11y-check.cjs */
const { chromium } = require('playwright');
const fs=require('fs'); const src=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
(async()=>{
  const b=await chromium.launch();
  const out={};
  for (const scheme of ['dark','light']) {
  const ctx=await b.newContext({viewport:{width:1280,height:900}, colorScheme:scheme}); const page=await ctx.newPage();
  for (const url of ['/','/champions','/champions/ahri','/lol/euw1/Caps-EUW','/lol/euw1/Caps-EUW/stats','/draft?role=MIDDLE&enemy=zed&pool=ahri&team=zed,draven,leesin,syndra','/champions?queue=arena','/champions/ahri/vs/zed','/multisearch?region=euw1&players=Caps-EUW,Rekkles-EUW','/duo?region=euw1&player=Caps-EUW','/lol/euw1/Caps-EUW/live','/changelog','/api-usage','/?shortcuts','/compare?a=euw1/Caps-EUW&b=euw1/Rekkles-EUW','/leaderboard','/privacy']) {
    await page.goto('http://localhost:3001'+url.replace('?shortcuts',''),{waitUntil:'networkidle'}); await page.waitForTimeout(1200);
    if (url.endsWith('?shortcuts')) { await page.evaluate(()=>window.dispatchEvent(new Event('rw:shortcuts'))); await page.waitForTimeout(300); }
    await page.addScriptTag({content:src});
    const r=await page.evaluate(async()=>{const res=await axe.run(document,{runOnly:['wcag2a','wcag2aa']}); return res.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,ex:v.nodes.slice(0,2).map(n=>n.target.join(' ')+' | '+(n.failureSummary||'').split('\n')[1]?.slice(0,140))}));});
    for (const v of r){ const k=v.id; out[k]=out[k]||{impact:v.impact,pages:[],ex:v.ex}; out[k].pages.push(scheme+':'+url+'('+v.n+')'); }
  }
  await ctx.close(); }
  console.log(JSON.stringify(out,null,1)); await b.close();
})();
