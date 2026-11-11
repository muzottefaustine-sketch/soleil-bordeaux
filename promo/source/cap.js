const { chromium, devices } = require('playwright');
const OUT = process.argv[2];
(async () => {
  const b = await chromium.launch({ proxy:{server:process.env.HTTPS_PROXY, bypass:'localhost,127.0.0.1'}, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ ...devices['iPhone 14 Pro'], viewport:{width:393,height:852}, screen:{width:393,height:852}, locale:'fr-FR', timezoneId:'Europe/Paris', geolocation:{latitude:44.8412,longitude:-0.5700}, permissions:['geolocation'] });
  // Bing tiles are requested over http; fetch them over https and add CORS.
  await ctx.route(/^http:\/\/ecn\.t\d\.tiles\.virtualearth\.net\//, async route => {
    try { const r = await route.fetch({ url: route.request().url().replace('http://','https://') });
      await route.fulfill({ response: r, headers: { ...r.headers(), 'access-control-allow-origin':'*' } });
    } catch(e){ await route.abort(); }
  });
  const p = await ctx.newPage();
  await p.addInitScript(() => { const O=Date, on=O.now.bind(O), OFF=new O('2026-06-21T14:00:00+02:00').getTime()-on();
    class D extends O { constructor(...a){ if(a.length===0) super(on()+OFF); else super(...a); } static now(){ return on()+OFF; } }
    window.Date = D; });
  const shot = async n => { await p.screenshot({path:`${OUT}/${n}.png`}); console.log('shot', n); };
  await p.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1200); await shot('01_splash');
  await p.waitForFunction(()=>getComputedStyle(document.getElementById('splash')).display==='none', null, {timeout:180000});
  await p.waitForTimeout(20000);
  await p.evaluate(()=>{ frameArea(-0.5725, 44.8410, {animate:false, range:700}); });
  await p.waitForFunction(()=>viewer.scene.globe.tilesLoaded, null, {timeout:120000}).catch(()=>{});
  await p.waitForTimeout(12000);
  const setT = async v => { await p.evaluate(v=>{ const s=document.getElementById('timeSlider'); s.value=v; s.dispatchEvent(new Event('input',{bubbles:true})); s.dispatchEvent(new Event('change',{bubbles:true})); }, v); await p.waitForTimeout(5000); };
  for (const v of [8,10,12,14,16,18,19.5]) { await setT(v); await shot('02_time_'+String(v).replace('.','_')); }
  await setT(15);
  await shot('03_map');
  // tooltip on a regular terrace near center
  await p.evaluate(()=>{ const t=terrasses.find(x=>!findReferenced(x) && x.nom && x.nom.length<22) || terrasses[0]; showTooltip(t, innerWidth/2, innerHeight*0.45, true); });
  await p.waitForTimeout(1500); await shot('04_tooltip');
  await p.evaluate(()=>hideTooltip&&hideTooltip());
  // List drawer
  await p.click('#btnListe'); await p.waitForTimeout(3500); await shot('05_list');
  await p.click('.filter-chip[data-filter="bar"]'); await p.waitForTimeout(2500); await shot('06_list_bars');
  await p.click('.filter-chip[data-filter="all"]'); await p.waitForTimeout(1500);
  await p.click('#btnClose'); await p.waitForTimeout(1500);
  // Place sheet for curated place
  await p.evaluate(()=>{ const t=terrasses.find(x=>findReferenced(x) && /Pointe/.test(x.nom)) || terrasses.find(x=>findReferenced(x)); selectTerrasse(t,null); });
  await p.waitForTimeout(7000); await shot('07_sheet');
  await p.evaluate(()=>document.getElementById('psScroll').scrollBy(0,600)); await p.waitForTimeout(2000); await shot('08_sheet_scroll');
  await p.evaluate(()=>hidePlaceSheet()); await p.waitForTimeout(1500);
  // Search
  await p.click('#searchInput'); await p.keyboard.type('Ly', {delay:150}); await p.waitForTimeout(3000); await shot('09_search');
  await b.close();
})().catch(e=>{console.error(e); process.exit(1);});
