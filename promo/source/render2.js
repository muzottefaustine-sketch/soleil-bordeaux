// usage: node render2.js <assets.json> <outdir> [fps] [onlyTimes]
const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs');
const [assetsFile,out,fpsArg,only]=process.argv.slice(2); const FPS=+(fpsArg||30), DUR=+(process.env.DUR||45);
const A=JSON.parse(fs.readFileSync(assetsFile,'utf8')); const base=path.dirname(path.resolve(assetsFile));
const u=f=>'file://'+path.resolve(base,f);
for(const k of Object.keys(A)) if(typeof A[k]==='string') A[k]=u(A[k]); else if(Array.isArray(A[k])&&typeof A[k][0]==='string') A[k]=A[k].map(u);
(async()=>{ fs.mkdirSync(out,{recursive:true});
  const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1080,height:1920}});
  await pg.addInitScript(a=>{window.ASSETS=a;}, A);
  await pg.goto('file://'+path.resolve(__dirname, A.composition ? A.composition.replace('file://','') : 'composition.html')); await pg.evaluate(()=>window.ready);
  const times = only ? only.split(',').map(Number) : [...Array(FPS*DUR).keys()].map(i=>i/FPS);
  for(let i=0;i<times.length;i++){ await pg.evaluate(t=>render(t), times[i]);
    await pg.screenshot({path:`${out}/${only?'t'+String(times[i]).padStart(5,'0'):String(i).padStart(5,'0')}.jpg`, type:'jpeg', quality:92}); }
  await b.close(); })();
