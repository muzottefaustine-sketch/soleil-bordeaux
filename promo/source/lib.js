const { chromium, devices } = require('playwright');
exports.open = async (vp={width:393,height:852}, dsf=3) => {
  const b = await chromium.launch({ proxy:{server:process.env.HTTPS_PROXY, bypass:'localhost,127.0.0.1'}, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ ...devices['iPhone 14 Pro'], viewport:vp, screen:vp, deviceScaleFactor:dsf, locale:'fr-FR', timezoneId:'Europe/Paris', geolocation:{latitude:44.8412,longitude:-0.5700}, permissions:['geolocation'] });
  await ctx.route(/^http:\/\/ecn\.t\d\.tiles\.virtualearth\.net\//, async route => {
    try { const r = await route.fetch({ url: route.request().url().replace('http://','https://') });
      await route.fulfill({ response: r, headers: { ...r.headers(), 'access-control-allow-origin':'*' } }); } catch(e){ await route.abort().catch(()=>{}); } });
  const p = await ctx.newPage();
  await p.addInitScript(() => { const O=Date, on=O.now.bind(O), OFF=new O('2026-06-21T14:00:00+02:00').getTime()-on();
    class D extends O { constructor(...a){ if(a.length===0) super(on()+OFF); else super(...a); } static now(){ return on()+OFF; } }
    window.Date = D; });
  await p.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(()=>getComputedStyle(document.getElementById('splash')).display==='none', null, {timeout:240000});
  await p.waitForTimeout(8000);
  await p.addStyleTag({content:'body.clean #topBar, body.clean .panel-map, body.clean #btnGeo, body.clean #locationPill, body.clean #mode3dPill, body.clean #tooltip {display:none !important}'});
  return {b,p};
};
exports.cam = (p, o) => p.evaluate(o => {
  const C=Cesium; const carto=C.Cartographic.fromDegrees(o.lng,o.lat); const h=viewer.scene.globe.getHeight(carto)||10;
  viewer.camera.lookAt(C.Cartesian3.fromDegrees(o.lng,o.lat,h+(o.dh||0)), new C.HeadingPitchRange(C.Math.toRadians(o.heading), C.Math.toRadians(o.pitch), o.range));
  viewer.camera.lookAtTransform(C.Matrix4.IDENTITY); viewer.scene.requestRender();
}, o);
exports.time = (p, v) => p.evaluate(v => { const s=document.getElementById('timeSlider'); s.value=v; updateSliderLabel(v); updateSliderClock(v); currentHeure=v; }, v);
exports.settle = async (p, min=600) => { await p.waitForTimeout(min);
  await p.waitForFunction(()=>viewer.scene.globe.tilesLoaded && osmBuildings.tilesLoaded, null, {timeout:60000, polling:250}).catch(()=>console.log('settle timeout'));
  await p.waitForTimeout(400); };
