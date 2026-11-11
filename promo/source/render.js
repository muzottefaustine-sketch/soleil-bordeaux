// usage: node render.js <capdir> <outdir> [fps] [onlyTimes,comma]
const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs');
const [cap,out,fpsArg,only]=process.argv.slice(2); const FPS=+(fpsArg||30), DUR=32;
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1080,height:1920}});
  const f=n=>'file://'+path.resolve(cap,n+'.jpg');
  const shots={ time:['02_time_8','02_time_10','02_time_12','02_time_14','02_time_16','02_time_18','02_time_19_5'].map(f),
    tooltip:f('04_tooltip'), sheet:f('07_sheet'), sheet2:f('08_sheet_scroll'), list:f('05_list'), bars:f('06_list_bars'), search:f('09_search') };
  await pg.addInitScript(s=>{window.SHOTS=s;}, shots);
  await pg.goto('file://'+path.resolve(__dirname,'composition.html')); await pg.evaluate(()=>window.ready);
  const times = only ? only.split(',').map(Number) : [...Array(FPS*DUR).keys()].map(i=>i/FPS);
  for(let i=0;i<times.length;i++){ await pg.evaluate(t=>render(t), times[i]);
    await pg.screenshot({path:`${out}/${only?'t'+times[i]:String(i).padStart(5,'0')}.jpg`, type:'jpeg', quality:92}); if(i%60===0) console.log('frame',i); }
  await b.close();
})();
