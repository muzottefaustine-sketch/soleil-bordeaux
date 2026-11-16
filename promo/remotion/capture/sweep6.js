// New-design captures. usage: node sweep6.js <out> ui|hero
const L=require('./lib'); const [OUT,MODE]=process.argv.slice(2); const fs=require('fs');
const shot=async(p,f)=>{ await p.screenshot({path:f, timeout:180000}); console.log(new Date().toISOString().slice(11,19), f.split('/').slice(-2).join('/')); };
(async()=>{
  if(MODE==='ui'){ const {b,p}=await L.open({width:393,height:852},2);
    for(const d of ['app','ui']) fs.mkdirSync(OUT+'/'+d,{recursive:true});
    await p.evaluate(()=>{ frameArea(-0.5725, 44.8410, {animate:false, range:700}); }); await L.time(p,8); await L.settle(p,5000);
    let i=0; for(const h of [8,10,12,14,16,18,19.5]){ await L.time(p,h); await L.settle(p,300); await shot(p,`${OUT}/app/${String(i++).padStart(3,'0')}.png`); }
    await L.cam(p,{lng:-0.5672,lat:44.8344,heading:250,pitch:-34,range:380}); await L.time(p,15.25); await L.settle(p,4000); await shot(p,`${OUT}/ui/meynard.png`);
    const star=await p.evaluate(()=>{ const t=terrasses.find(x=>/m[eè]re michel/i.test(x.nom)); const w=Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene,Cesium.Cartesian3.fromDegrees(t.lng,t.lat,(viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(t.lng,t.lat))||10))); return w?[w.x,w.y]:null; }); console.log('STAR',JSON.stringify(star));
    await p.evaluate(()=>{ const t=terrasses.find(x=>/m[eè]re michel/i.test(x.nom)); showPlaceSheet(t); }); await p.waitForTimeout(6000); await shot(p,`${OUT}/ui/sheet.png`);
    const boxes=await p.evaluate(()=>{ const r=s=>{const e=document.querySelector(s); if(!e) return null; const b=e.getBoundingClientRect(); return [b.x,b.y,b.width,b.height];};
      const out={}; for(const e of document.querySelectorAll('#placeSheet *')){ const tx=(e.childElementCount===0?e.textContent:'').trim(); if(/^Sélection Soleilenterrasse$|^Réserver$/.test(tx)){ const b=(e.closest('button,a,.ps-badge')||e.parentElement).getBoundingClientRect(); out[tx]=[b.x,b.y,b.width,b.height]; } }
      const im=document.querySelector('#placeSheet img, #placeSheet .ps-photo, #placeSheet [class*=photo], #placeSheet [class*=hero]'); if(im){const b=im.getBoundingClientRect(); out.photo=[b.x,b.y,b.width,b.height, im.className];} return out; }); console.log('BOXES',JSON.stringify(boxes));
    await b.close(); }
  else { const {b,p}=await L.open({width:393,height:852},2.75);
    await p.evaluate(()=>document.body.classList.add('clean'));
    const runs=[['fleche',{lng:-0.5655,lat:44.8344,heading:70,pitch:-34,range:250,dh:30},15.5,19.5,9],
      ['andre',{lng:-0.5776,lat:44.8378,heading:200,pitch:-32,range:260},7.25,11.75,12],
      ['andre2',{lng:-0.5776,lat:44.8378,heading:20,pitch:-34,range:200,dh:25},11.75,16.25,12],
      ['meynard',{lng:-0.5673,lat:44.83435,heading:250,pitch:-30,range:270},16.25,20.75,12]];
    for(const [name,cam,h0,h1,n] of runs){ fs.mkdirSync(OUT+'/'+name,{recursive:true}); await L.cam(p,cam); await L.time(p,h0); await L.settle(p,5000);
      await p.screenshot({path:`${OUT}/${name}/warmup.png`, timeout:180000}); await L.settle(p,1500);
      for(let i=0;i<n;i++){ await L.time(p,h0+i*(h1-h0)/(n-1)); await L.settle(p,150); await shot(p,`${OUT}/${name}/${String(i).padStart(3,'0')}.png`); } }
    await b.close(); }
  console.log('done',MODE); })().catch(e=>{console.error('Error',String(e).slice(0,400));process.exit(1)});
