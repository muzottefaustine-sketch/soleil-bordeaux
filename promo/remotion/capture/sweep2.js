const L=require('./lib'); const OUT=process.argv[2]; const fs=require('fs');
const shot=async(p,f)=>{ await p.screenshot({path:f, timeout:180000}); console.log(new Date().toISOString().slice(11,19), f.split('/').slice(-2).join('/')); };
(async()=>{ const {b,p}=await L.open({width:393,height:852},3);
  for(const d of ['hero','app','misc']) fs.mkdirSync(OUT+'/'+d,{recursive:true});
  await p.evaluate(()=>document.body.classList.add('clean'));
  await L.cam(p,{lng:-0.5673,lat:44.83435,heading:250,pitch:-30,range:270});
  await L.time(p,7.25); await L.settle(p,3000);
  const N=40;
  for(let i=0;i<N;i++){ const t=7.25+i*(20.75-7.25)/(N-1); await L.time(p,t); await L.settle(p,150); await shot(p,`${OUT}/hero/${String(i).padStart(3,'0')}.png`); }
  await p.evaluate(()=>document.body.classList.remove('clean'));
  await L.cam(p,{lng:-0.5672,lat:44.8344,heading:250,pitch:-34,range:380});
  await L.time(p,8); await L.settle(p,3000);
  const M=24;
  for(let i=0;i<M;i++){ const t=Math.round((8+i*(20-8)/(M-1))*4)/4; await L.time(p,t); await L.settle(p,150); await shot(p,`${OUT}/app/${String(i).padStart(3,'0')}.png`); }
  // list with La Mère Michel
  await L.time(p,15); await L.settle(p,500);
  await p.click('#btnListe'); await p.waitForTimeout(3000); await shot(p,`${OUT}/misc/list.png`);
  await p.click('.filter-chip[data-filter="bar"]'); await p.waitForTimeout(2500); await shot(p,`${OUT}/misc/bars.png`);
  await p.click('.filter-chip[data-filter="all"]'); await p.waitForTimeout(1000);
  await p.fill('#drawerSearch','Mère Michel'); await p.waitForTimeout(2500); await shot(p,`${OUT}/misc/search_mm.png`);
  await p.click('#btnClose'); await p.waitForTimeout(1500);
  console.log('done'); await b.close(); })().catch(e=>{console.error(e);process.exit(1)});
