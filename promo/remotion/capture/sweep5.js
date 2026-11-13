const L=require('./lib'); const OUT=process.argv[2]; const fs=require('fs');
const shot=async(p,f)=>{ await p.screenshot({path:f, timeout:180000}); console.log(new Date().toISOString().slice(11,19), f.split('/').slice(-2).join('/')); };
(async()=>{ const {b,p}=await L.open({width:393,height:852},3);
  await p.evaluate(()=>document.body.classList.add('clean'));
  // [name, camera, first hour, last hour, frames]
  const runs=[['fleche',{lng:-0.5655,lat:44.8344,heading:70,pitch:-34,range:250,dh:30},15,19.5,10],
              ['andre2',{lng:-0.5776,lat:44.8378,heading:20,pitch:-34,range:200,dh:25},11.75,16.25,12]];
  for(const [name,cam,h0,h1,n] of runs){ fs.mkdirSync(OUT+'/'+name,{recursive:true}); await L.cam(p,cam); await L.time(p,h0); await L.settle(p,4000);
    for(let i=0;i<n;i++){ await L.time(p,h0+i*(h1-h0)/(n-1)); await L.settle(p,150); await shot(p,`${OUT}/${name}/${String(i).padStart(3,'0')}.png`); } }
  console.log('done'); await b.close(); })().catch(e=>{console.error('Error',e);process.exit(1)});
