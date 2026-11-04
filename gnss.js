'use strict';
const $=id=>document.getElementById(id);
const translations=[...document.querySelectorAll('[data-zh]')].map(el=>({el,en:el.innerHTML,zh:el.dataset.zh}));
let lang='en',task=0,panel=0,data=null,filtered=[],selected=0;
const say=(en,zh)=>lang==='zh'?zh:en;
const tasks=[
 {en:['01 / DATA & PHYSICS','Make the observations physically comparable.','Parse radiosonde profiles and integrate humidity and temperature to derive wet delay, weighted mean temperature and PWV. Convert geopotential, geometric and ellipsoidal heights with an EGM2008 geoid correction, retaining intermediate fields for inspection.','OUTPUT / Annual feature tables, physical targets and traceable height conversions.'],zh:['01 / 数据与物理','先让不同来源的数据在物理上可比。','解析探空垂直廓线，积分水汽压与温度，得到湿延迟、加权平均温度和 PWV。结合 EGM2008 大地水准面改正，在位势高、几何高和椭球高之间转换，并保留中间字段供核查。','产物 / 按年组织的特征表、物理标签与可追溯的高度转换。']},
 {en:['02 / MODEL ENGINEERING','Turn learners into a common training workflow.','Use configuration-driven training for tree models, neural networks and ensembles. Save model artifacts, preprocessing state, parameters and metrics. Holdout stacking trains its meta-learner on a separate subset of base-model predictions.','OUTPUT / Eight model families integrated, including FLAML learners, TabM and xRFM.'],zh:['02 / 模型工程','把不同模型组织进统一的训练流程。','通过配置驱动树模型、神经网络与集成模型训练，保存模型、预处理状态、参数与指标。Holdout stacking 在独立子集上生成基模型预测，再训练元学习器。','产物 / 接入八类模型，包括 FLAML 学习器、TabM 与 xRFM。']},
 {en:['03 / EVALUATION DESIGN','Match each score to a scientific question.','Separate internal radiosonde tests from external GNSS evaluation. Process annual GNSS files in chunks and accumulate regression statistics. Inspect geography, elevation and time instead of relying only on a global average.','OUTPUT / Global, annual and station-level error summaries with explicit data-domain context.'],zh:['03 / 评价设计','让每个指标回答一个明确的问题。','区分内部探空测试与外部 GNSS 验证，分块处理年度 GNSS 文件并累计回归统计。沿地理、高度和时间维度检查表现，而不只看一个全局平均数。','产物 / 带数据域背景的全局、年度和站点级误差汇总。']},
 {en:['04 / DIAGNOSTICS','Connect statistical behavior to physical context.','Map residuals across the station network and use TreeSHAP to inspect the roles of delay, elevation, latitude and season. Treat the explanations as evidence about model behavior, then connect them to physical hypotheses.','OUTPUT / Spatial error atlas and feature-contribution analysis.'],zh:['04 / 诊断与解释','把统计表现放回物理背景。','将残差映射到全球站网，使用 TreeSHAP 检查延迟、高度、纬度与季节的作用。先用解释结果观察模型行为，再联系物理机制提出判断。','产物 / 空间误差图谱与特征贡献分析。']},
 {en:['05 / ENGINEERING EVALUATION','Measure the cost of a prediction.','Profile a saved model under single-thread CPU inference. Warm up before timing, report tail latency as well as the mean, and measure both model-file size and process memory.','OUTPUT / A latency and memory profile that makes deployment trade-offs concrete.'],zh:['05 / 工程评估','量化一次预测的运行成本。','在 CPU 单线程条件下测试已保存模型。预热后计时，同时记录平均延迟、尾延迟、模型文件大小与进程内存。','产物 / 可用于分析部署取舍的延迟和内存画像。']}
];
function renderTask(){const t=tasks[task][lang];['kicker','title','body','output'].forEach((s,i)=>$('task-'+s).textContent=t[i]);document.querySelectorAll('[data-task]').forEach(b=>{const on=+b.dataset.task===task;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on)})}
function setPanel(n){panel=n;document.querySelectorAll('[data-panel]').forEach(b=>{const on=+b.dataset.panel===n;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on)});document.querySelectorAll('.bench-panel').forEach(p=>p.hidden=+p.dataset.view!==n)}
function setLanguage(value){lang=value;document.documentElement.lang=value==='zh'?'zh-CN':'en';translations.forEach(x=>x.el.innerHTML=x[value]);$('gnss-language').textContent=value==='zh'?'EN ↗':'中文 ↗';$('gnss-language').setAttribute('aria-label',value==='zh'?'Switch to English':'Switch to Chinese');try{localStorage.setItem('optics-portfolio-language',value)}catch{}renderTask();if(data)renderData()}
function color(v){const t=Math.max(0,Math.min(1,v/5));const a=[76,142,194],b=[247,210,141];return `rgb(${a.map((x,i)=>Math.round(x+(b[i]-x)*t)).join(',')})`}
function stationText(s){return `${s.lat.toFixed(2)}°, ${s.lon.toFixed(2)}° · h ${s.h.toFixed(0)} m · n=${s.n.toLocaleString()} · RMSE ${s.rmse.toFixed(2)} mm · Bias ${s.bias.toFixed(2)} mm`}
function selectStation(i){selected=(i+filtered.length)%filtered.length;const s=filtered[selected];if(!s)return;$('station-detail').textContent=say('SELECTED STATION GROUP / ','所选站点组 / ')+stationText(s);const svg=$('station-map');svg.querySelectorAll('.selected-point').forEach(n=>n.classList.remove('selected-point'));const point=svg.querySelector(`[data-point="${selected}"]`);if(point)point.classList.add('selected-point')}
function renderMap(){
 const region=$('region').value;
 filtered=data.stations.filter(s=>region==='all'||region==='tropics'&&Math.abs(s.lat)<23.5||region==='north'&&s.lat>=23.5&&s.lat<66.5||region==='south'&&s.lat<=-23.5&&s.lat>-66.5||region==='polar'&&Math.abs(s.lat)>=66.5);
 let out='<rect x="0" y="0" width="960" height="480" fill="#0b1722"/>';
 for(let lon=-180;lon<=180;lon+=60){const x=(lon+180)/360*900+30;out+=`<path d="M${x} 25V445" stroke="#8acbff" opacity=".12"/><text x="${x}" y="469" fill="#8099ae" font-size="10" text-anchor="middle">${lon}°</text>`}
 for(let lat=-60;lat<=60;lat+=30){const y=(90-lat)/180*420+25;out+=`<path d="M30 ${y}H930" stroke="#8acbff" opacity="${lat===0?'.3':'.12'}"/><text x="28" y="${y-5}" fill="#8099ae" font-size="10">${lat}°</text>`}
 filtered.forEach((s,i)=>{const x=(s.lon+180)/360*900+30,y=(90-s.lat)/180*420+25;out+=`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="2.7" fill="${color(s.rmse)}" fill-opacity="1" data-point="${i}"><title>${stationText(s)}</title></circle>`});
 $('station-map').innerHTML=out;
 const n=filtered.reduce((n,s)=>n+s.n,0),rmse=Math.sqrt(filtered.reduce((v,s)=>v+s.n*s.rmse*s.rmse,0)/n),bias=filtered.reduce((v,s)=>v+s.n*s.bias,0)/n;
 $('map-stats').innerHTML=`<div><strong>${filtered.length.toLocaleString()}</strong><span>${say('station groups','站点组')}</span></div><div><strong>${rmse.toFixed(2)} <small>mm</small></strong><span>${say('observation-weighted RMSE','按观测加权 RMSE')}</span></div><div><strong>${bias>=0?'+':''}${bias.toFixed(2)} <small>mm</small></strong><span>${say('bias · ','偏差 · ')}n=${n.toLocaleString()}</span></div>`;
 selectStation(Math.min(selected,filtered.length-1));
}
function renderData(){renderMap();$('shap-chart').innerHTML=[...data.shap].sort((a,b)=>b.value-a.value).map(s=>`<div class="shap-row"><strong>${s.feature}</strong><div class="shap-track"><i style="width:${s.value/9*100}%"></i></div><span>${s.value.toFixed(3)}</span></div>`).join('');const r=data.runtime;
 $('runtime-metrics').innerHTML=[[r.mean.toFixed(2),'ms',say('mean latency','平均延迟')],[r.p99.toFixed(2),'ms',say('P99 latency','P99 延迟')],[r.peakMiB.toFixed(1),'MiB',say('peak process RSS','进程峰值 RSS')]].map(([v,u,l])=>`<div class="runtime-stat"><strong>${v}<small>${u}</small></strong><span>${l}</span></div>`).join('');
 $('runtime-bars').innerHTML=[[say('Model artifact','模型文件'),r.artifactMiB],[say('Peak process memory','进程峰值内存'),r.peakMiB]].map(([name,v])=>`<div class="bar-row"><div><strong>${name}</strong><span>${v.toFixed(1)} MiB</span></div><div class="bar-track"><i style="width:${v/512*100}%"></i></div></div>`).join('');
}
$('gnss-language').addEventListener('click',()=>setLanguage(lang==='en'?'zh':'en'));
document.querySelectorAll('[data-task]').forEach(b=>b.addEventListener('click',()=>{task=+b.dataset.task;renderTask()}));
document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>setPanel(+b.dataset.panel)));
$('region').addEventListener('change',()=>{selected=0;renderMap()});
$('station-map').setAttribute('tabindex','0');$('station-map').setAttribute('aria-label','Station RMSE map. Select a latitude band above. Use left and right arrow keys to inspect individual station groups.');
$('station-map').addEventListener('click',e=>{const point=e.target.closest('[data-point]');if(point)selectStation(+point.dataset.point)});
$('station-map').addEventListener('keydown',e=>{if(data&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();selectStation(selected+(e.key==='ArrowRight'?1:-1))}});
let stored='en';try{stored=localStorage.getItem('optics-portfolio-language')||'en'}catch{}setLanguage(stored==='zh'?'zh':'en');
fetch('gnss-data.json').then(r=>{if(!r.ok)throw Error('Data unavailable');return r.json()}).then(d=>{data=d;$('gnss-loading').hidden=true;renderData()}).catch(()=>{$('gnss-loading').hidden=true;$('gnss-error').hidden=false});
