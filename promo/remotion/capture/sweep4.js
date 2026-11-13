const L=require('./lib'); const OUT=process.argv[2]; const fs=require('fs');
const shot=async(p,f)=>{ await p.screenshot({path:f, timeout:180000}); console.log(new Date().toISOString().slice(11,19), f.split('/').slice(-2).join('/')); };
(async()=>{ const {b,p}=await L.open({width:393,height:852},3);
  for(const d of ['grand','andre','parlement']) fs.mkdirSync(OUT+'/'+d,{recursive:true});
  await p.evaluate(()=>document.body.classList.add('clean'));
  // Grand soleil: quais + place de la Bourse, wide
  await L.cam(p,{lng:-0.5697,lat:44.8414,heading:250,pitch:-30,range:420}); await L.time(p,17.5); await L.settle(p,4000);
  await shot(p,`${OUT}/grand/000.png`);
  const runs=[['andre',{lng:-0.5776,lat:44.8378,heading:200,pitch:-32,range:260},7.25],['parlement',{lng:-0.5713,lat:44.8405,heading:30,pitch:-38,range:240},11.75]];
  for(const [name,cam,h0] of runs){ await L.cam(p,cam); await L.time(p,h0); await L.settle(p,4000);
    for(let i=0;i<14;i++){ const t=h0+i*(4.5/13); await L.time(p,t); await L.settle(p,150); await shot(p,`${OUT}/${name}/${String(i).padStart(3,'0')}.png`); } }
  console.log('done'); await b.close(); })().catch(e=>{console.error('Error',e);process.exit(1)});
