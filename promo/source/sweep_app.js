const L=require('./lib'); const OUT=process.argv[2]; const fs=require('fs');
(async()=>{ const {b,p}=await L.open({width:393,height:852},3); fs.mkdirSync(OUT,{recursive:true});
  await L.cam(p,{lng:-0.5672,lat:44.8344,heading:250,pitch:-34,range:380});
  await L.time(p,8); await L.settle(p,3000);
  const M=24;
  for(let i=0;i<M;i++){ const t=Math.round((8+i*(20-8)/(M-1))*4)/4; await L.time(p,t); await L.settle(p,150);
    await p.screenshot({path:`${OUT}/${String(i).padStart(3,'0')}.png`, timeout:180000}); console.log('app',i); }
  console.log('done'); await b.close(); })().catch(e=>{console.error(e);process.exit(1)});
