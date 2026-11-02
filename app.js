'use strict';
// Values from metrics_for_split_figures.csv; support fractions from thesis Table 4.1.
const cases = [
 {l:-1,rho:.990640850650999,nrmse:.136494340620641,phase:.267097127803419,eta:.918630742952904,eps:.285252970268665,support:.999140},
 {l:0,rho:.989329848907853,nrmse:.145692999351261,phase:.284841259503097,eta:.918587934880228,eps:.285327995681763,support:.993496},
 {l:1,rho:.99063364804961,nrmse:.136546605054539,phase:.266096230042305,eta:.919015468191641,eps:.284577813274961,support:.999134},
 {l:2,rho:.990635518603345,nrmse:.136533033663955,phase:.269701726167772,eta:.917277159427887,eps:.287615786375008,support:.999137},
 {l:3,rho:.990634323960277,nrmse:.13654170129219,phase:.275694621815698,eta:.914226229797267,eps:.292871593369402,support:.999135},
 {l:4,rho:.990635160013946,nrmse:.136535635436846,phase:.284237260506943,eta:.909896430627233,eps:.300172565989578,support:.999140}
];
let charge = 1, view = 'amplitude', language = 'en', zoom = true;
const $ = id => document.getElementById(id);
const bilingual = [...document.querySelectorAll('[data-zh]')];
bilingual.forEach(el => { el.dataset.en = el.innerHTML; });
const words = (en,zh) => language === 'en' ? en : zh;

function updateExplorer(){
 const d = cases.find(c=>c.l===charge), key = charge<0?'m1':String(charge), base='';
 document.querySelectorAll('[data-charge]').forEach(button=>{
  const active=Number(button.dataset.charge)===charge; button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
 });
 document.querySelectorAll('[data-view]').forEach(button=>{
  const active=button.dataset.view===view;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
 });
 $('charge-value').textContent=charge;
 $('metric-rho').textContent=d.rho.toFixed(6);$('metric-eta').textContent=d.eta.toFixed(6);
 $('metric-phase').textContent=d.phase.toFixed(6);$('metric-charge').textContent=charge;
 let target,result,targetLabel,resultLabel,note;
 if(view==='amplitude'){
  target='target_amplitude_eval_grid.png';result=`recon_amplitude_l${key}.png`;
  targetLabel=words('Target amplitude','目标振幅');resultLabel=words('Reconstructed amplitude','重建振幅');
  note=words('Full evaluation window. The ring occupies a small, physically defined region; images retain their original field of view and display normalization.','完整评价窗口。光环只占据其中一小块物理区域；图像保留原始视场与显示归一化方式。');
 }else if(view==='phase'){
  target=`target_phase_l${key}.png`;result=`recon_phase_l${key}.png`;
  targetLabel=words('Target phase','目标相位');resultLabel=words('Reconstructed phase','重建相位');
  note=words('Full-window wrapped phase (−π to +π), original HSV color scale. Phase in the dim background is unstable; numerical phase metrics are evaluated only in the target support (amplitude ≥5% of its peak).','全窗口包裹相位（−π 至 +π），使用原始 HSV 色标。暗背景中的相位不稳定；相位指标仅在目标有效区域（振幅 ≥ 峰值的 5%）计算。');
 }else{
  target=`hologram_phase_8bit_l${key}.png`;result=`recon_amplitude_l${key}.png`;
  targetLabel=words('Exported phase hologram','导出的相位全息图');resultLabel=words('Reconstructed amplitude','重建振幅');
  note=words('Left: exported 2500×2500, 8-bit hologram preview. Right: numerical reconstruction from the unquantized phase array. These metrics do not validate the cropped, quantized export or a physical SLM.','左：2500×2500、8 位全息图导出预览。右：未量化相位阵列的数值重建。这里的指标不代表裁切、量化后的导出图或真实 SLM 的效果。');
 }
 $('target-image').src=base+target;$('result-image').src=base+result;
 $('target-image').alt=`${targetLabel}, ℓ=${charge}`;$('result-image').alt=`${resultLabel}, ℓ=${charge}`;
 $('target-label').textContent=targetLabel;$('result-label').textContent=resultLabel;
 $('target-sub').textContent=view==='hologram'?'8-BIT EXPORT':'REFERENCE';
 $('result-sub').textContent='BERD → FRESNEL';
 $('view-scale').textContent=view==='hologram'?words('EXPORT + NUMERICAL RECONSTRUCTION','导出图 + 数值重建'):words('FULL EVALUATION WINDOW · 501 × 501','完整评价窗口 · 501 × 501');
 $('target-image').style.transform=zoom&&view!=='hologram'?'scale(3)':'none';
 $('result-image').style.transform=zoom?'scale(3)':'none';
 $('zoom').textContent=zoom?words('Ring detail ×3','光环细节 ×3'):words('Full window','完整视场');
 $('zoom').setAttribute('aria-pressed',String(zoom));
 if(zoom){
  $('view-scale').textContent=view==='hologram'?words('FULL HOLOGRAM + RECONSTRUCTION CROP','完整全息图 + 重建区域放大'):words('CENTRAL CROP · 167 × 167 OF 501 × 501','中心裁切 · 167 × 167 / 501 × 501');
  note=words('Display zoom: the central third of each reconstruction-plane image; metrics still use the original evaluation support. Toggle “Ring detail ×3” to see the full window. ','显示放大：重建平面图像的中心三分之一区域；指标仍采用原始评价区域。点击「光环细节 ×3」可还原完整视场。')+(view==='amplitude'?'':note);
 }
 $('view-note').textContent=note;$('raw-image').href=base+result;
 drawChart();
}
function setLanguage(next){
 language=next;document.documentElement.lang=next==='en'?'en':'zh-CN';
 bilingual.forEach(el=>{el.innerHTML=el.dataset[next]});
 $('language').innerHTML=next==='en'?'中文 <span>↗</span>':'EN <span>↗</span>';
 $('language').setAttribute('aria-label',next==='en'?'Switch to Chinese':'切换为英文');
 updateExplorer();
 try{localStorage.setItem('optics-portfolio-language',next)}catch{}
}
$('language').addEventListener('click',()=>setLanguage(language==='en'?'zh':'en'));
$('zoom').addEventListener('click',()=>{zoom=!zoom;updateExplorer()});
document.querySelectorAll('[data-charge]').forEach(b=>b.addEventListener('click',()=>{charge=Number(b.dataset.charge);updateExplorer()}));
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;updateExplorer()}));
$('metrics-table').innerHTML=cases.map(d=>`<tr><td>${d.l}</td><td>${d.rho.toFixed(6)}</td><td>${d.nrmse.toFixed(6)}</td><td>${d.phase.toFixed(6)}</td><td>${d.eta.toFixed(6)}</td><td>${d.eps.toFixed(6)}</td><td>${d.support.toFixed(6)}</td><td>${d.l}</td></tr>`).join('');

function drawChart(){
 const svg=$('correlation-chart'), x=i=>60+i*96, y=v=>235-(v-.88)/.12*205;
 let content='';
 [.88,.92,.96,1].forEach(v=>{content+=`<line x1="50" y1="${y(v)}" x2="555" y2="${y(v)}" stroke="#2a3640" stroke-dasharray="3 5"/><text x="4" y="${y(v)+4}" fill="#a0b1be" font-family="Consolas,monospace" font-size="11">${v.toFixed(2)}</text>`});
 cases.forEach((d,i)=>{content+=`<text x="${x(i)}" y="266" text-anchor="middle" fill="${d.l===charge?'#a2f4e3':'#a0b1be'}" font-family="Consolas,monospace" font-size="12">${d.l}</text>`});
 for(const [key,color] of [['rho','#a2f4e3'],['eta','#b8a1ef']]){
  content+=`<polyline points="${cases.map((d,i)=>`${x(i)},${y(d[key])}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2"/>`;
  cases.forEach((d,i)=>{content+=`<circle cx="${x(i)}" cy="${y(d[key])}" r="${d.l===charge?6:4}" fill="${d.l===charge?color:'#10171e'}" stroke="${color}" stroke-width="2"><title>ℓ=${d.l}, ${key}=${d[key].toFixed(6)}</title></circle>`});
 }
 content+='<text x="574" y="266" fill="#a0b1be" font-family="Georgia,serif" font-size="15">ℓ</text>';svg.innerHTML=content;
}

// A code-drawn analytic target illustration, intentionally distinct from archived results.
function drawHero(){
 const canvas=$('vortex'),ctx=canvas.getContext('2d'),W=900,H=900,cx=455,cy=410;
 ctx.clearRect(0,0,W,H);
 ctx.strokeStyle='#59748124';ctx.lineWidth=1;
 for(let r=145;r<=365;r+=55){ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke()}
 ctx.setLineDash([3,7]);ctx.beginPath();ctx.moveTo(cx,40);ctx.lineTo(cx,775);ctx.moveTo(60,cy);ctx.lineTo(850,cy);ctx.stroke();ctx.setLineDash([]);
 const pixels=ctx.createImageData(W,H);
 for(let y=45;y<790;y++)for(let x=50;x<865;x++){
  const dx=x-cx,dy=y-cy,r=Math.hypot(dx,dy),theta=Math.atan2(dy,dx);
  const envelope=Math.exp(-Math.pow((r-226)/38,2)/2);
  const texture=.78+.13*Math.sin(r*1.45+Math.sin(theta*3)*2)+.09*Math.cos(theta*85+r*.5);
  const alpha=envelope*texture*.95+Math.exp(-Math.pow((r-226)/75,2)/2)*.09;
  if(alpha<.002)continue;
  const t=(theta+Math.PI)/(2*Math.PI),stops=[[223,154,221],[154,188,242],[146,241,220],[222,223,151],[223,154,221]],k=t*4,j=Math.min(3,Math.floor(k)),f=k-j;
  const idx=(y*W+x)*4;
  for(let c=0;c<3;c++)pixels.data[idx+c]=stops[j][c]*(1-f)+stops[j+1][c]*f;
  pixels.data[idx+3]=Math.min(255,alpha*255);
 }
 const temp=document.createElement('canvas');temp.width=W;temp.height=H;temp.getContext('2d').putImageData(pixels,0,0);ctx.drawImage(temp,0,0);
 ctx.strokeStyle='#a2f4e38a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+225,cy);ctx.stroke();
 ctx.fillStyle='#afc7cf';ctx.font='15px Consolas, monospace';ctx.fillText('r₀ = 260 μm',cx+53,cy-15);
 ctx.fillStyle='#a2f4e3';ctx.beginPath();ctx.arc(cx,cy,3,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#a2f4e3';ctx.beginPath();ctx.moveTo(cx+225,cy-7);ctx.lineTo(cx+225,cy+7);ctx.stroke();
 ctx.fillStyle='#8ba4af';ctx.font='12px Consolas, monospace';ctx.fillText('ℓ = +1',cx-21,cy+27);
 for(let i=0;i<64;i++){const a=i/64*Math.PI*2,outer=355,inner=i%8===0?343:350;ctx.strokeStyle=i%8===0?'#78929d':'#3a4d58';ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*inner,cy+Math.sin(a)*inner);ctx.lineTo(cx+Math.cos(a)*outer,cy+Math.sin(a)*outer);ctx.stroke()}
}
drawHero();
let stored='en';try{stored=localStorage.getItem('optics-portfolio-language')||'en'}catch{}
setLanguage(stored==='zh'?'zh':'en');
