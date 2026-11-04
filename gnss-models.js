/* Mechanism illustrations; schematic nodes and stages, not fitted model parameters. */
(()=>{
'use strict';
const root=document.getElementById('model-demo');if(!root)return;
const names=['LightGBM','XGBoost','Random Forest','HistGB','MLP','TabM','xRFM','Stacking'];
const content=[
 [['Leaf-wise growth','A boosted tree expands the leaf with the largest loss reduction. The unbalanced shape is intentional.'],['按叶子生长','优先分裂损失下降最大的叶子，树可以呈不对称形状。']],
 [['Additive correction','Each new tree follows the loss gradients; its scaled prediction is added to the existing ensemble.'],['逐棵修正误差','新树沿损失梯度学习，再按学习率把预测加入已有模型。']],
 [['Parallel trees, averaged predictions','Trees learn from bootstrap samples and random feature subsets. Regression combines their predictions by averaging.'],['并行建树，平均预测','各棵树利用自助抽样与随机特征子集学习，回归时对预测取平均。']],
 [['Bin first, then boost','Continuous feature values become bins. Histogram statistics support split search within gradient boosting.'],['先分箱，再提升','连续特征先变成离散分箱，再用直方图统计搜索分裂点，构建提升树。']],
 [['Layer-by-layer transformation','Weighted connections and nonlinear activations turn the six inputs into a PWV estimate.'],['逐层非线性变换','通过加权连接与非线性激活，把六个输入逐层映射成 PWV 估计。']],
 [['An ensemble inside the network','Shared weights and member-specific adapters produce multiple predictions efficiently, then average them.'],['网络内部的高效集成','共享权重配合成员特定的适配参数，高效产生多路预测，再取平均。']],
 [['Learn a feature metric','RFM alternates kernel fitting and feature-metric updates. xRFM adds recursive data partitioning for scale.'],['学习特征度量','RFM 交替进行核拟合与特征度量更新；xRFM 再通过递归数据划分处理更大数据。']],
 [['Learn how to combine learners','Five base predictions from a separate holdout subset become features for an MLP meta-learner.'],['学习如何组合模型','五个基模型在独立留出子集上产生预测，作为 MLP 元学习器的输入特征。']]
];
const steps=[
 [['Start from one leaf','Split the root','Choose the best leaf','Expand that leaf'],['从一个叶子开始','分裂根节点','选择收益最大的叶子','继续扩展该叶子']],
 [['Initial prediction','Fit the first correction','Fit another correction','Sum scaled tree outputs'],['初始预测','拟合第一轮修正','继续拟合修正','累加各树的缩放输出']],
 [['Resample data and features','Grow independent trees','Produce tree predictions','Average predictions'],['抽样数据与特征','分别生长多棵树','得到各树预测','对预测取平均']],
 [['Continuous feature values','Aggregate values into bins','Search a histogram split','Add the tree correction'],['连续特征值','聚合为离散分箱','搜索直方图分裂点','加入新树的修正']],
 [['Six input features','First hidden layer','Next hidden layer','PWV regression output'],['六个输入特征','第一层隐层变换','下一层隐层变换','输出 PWV 回归值']],
 [['Shared input features','Shared network weights','Member-specific predictions','Average the ensemble'],['共同输入特征','共享网络权重','成员特定的预测','集成平均']],
 [['Partition the data','Fit local kernel models','Update feature metrics','Repeat fit and update'],['递归划分数据','拟合局部核模型','更新特征度量','迭代拟合与更新']],
 [['Five base learners','Holdout predictions','MLP meta-learner','Combined PWV prediction'],['五个基学习器','留出集上的预测','MLP 元学习器','组合后的 PWV 预测']]
];
let model=0,step=0,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,visible=false;
const zh=()=>document.documentElement.lang==='zh-CN',say=(a,b)=>zh()?b:a;
root.innerHTML=`<div class="demo-selector" role="group" aria-label="Model mechanism">${names.map((n,i)=>`<button data-mechanism="${i}">${n}</button>`).join('')}</div><div class="demo-body"><div class="demo-art"><svg viewBox="0 0 720 320" role="img"></svg><div class="demo-progress">${[0,1,2,3].map(i=>`<button data-step="${i}">${i+1}</button>`).join('')}</div></div><div class="demo-copy" aria-live="polite"><span class="model-family">ALGORITHM / SCHEMATIC</span><h3></h3><p class="demo-explanation"></p><p class="demo-step"></p><div class="demo-controls"><button data-play></button><button data-next></button><button data-reset></button></div></div></div>`;
const q=s=>root.querySelector(s);
const line=(x1,y1,x2,y2,active=false)=>`<path class="demo-edge ${active?'lit':''}" d="M${x1} ${y1}L${x2} ${y2}"/>`;
const dot=(x,y,active=false,label='')=>`<g class="demo-node ${active?'lit':''}"><circle cx="${x}" cy="${y}" r="12"/>${label?`<text x="${x}" y="${y+37}">${label}</text>`:''}</g>`;
const text=(x,y,s)=>`<text class="demo-label" x="${x}" y="${y}">${s}</text>`;
const box=(x,y,w,h,s,active=false)=>`<g class="demo-box ${active?'lit':''}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/><text x="${x+w/2}" y="${y+h/2+7}">${s}</text></g>`;
function tree(cx,cy,s=1,active=3){let out=`<g transform="translate(${cx},${cy}) scale(${s})">`;const p=[[0,0],[-45,55],[45,55],[-70,110],[-20,110],[20,110],[70,110]];p.slice(1).forEach((v,i)=>{let parent=p[Math.floor(i/2)];out+=line(...parent,...v,active>(i<2?0:1))});p.forEach((v,i)=>out+=dot(...v,active>(i===0?-1:i<3?0:1)));return out+'</g>'}
function diagram(){let s='';
 if(model===0){const pts=[[350,45],[220,120],[470,120],[405,195],[535,195],[495,265],[580,265]];const parents=[0,0,2,2,4,4];pts.slice(1).forEach((p,i)=>{const k=i<2?1:i<4?2:3;s+=`<g opacity="${step>=k?1:.12}">`+line(...pts[parents[i]],...p,true)+dot(...p,true)+'</g>'});s+=dot(350,45,true)+text(150,268,say('leaf-wise','按叶生长'));if(step===2)s+=`<circle class="demo-halo" cx="470" cy="120" r="24"/>`;if(step===3)s+=`<circle class="demo-halo" cx="535" cy="195" r="24"/>`;}
 if(model===1){s+=box(30,125,95,60,'ŷ₀',true);[230,400,570].forEach((x,i)=>{s+=line(x-90,155,x-35,155,step>i)+tree(x,80,.65,step>i?3:0)+text(x,235,['η·T₁','η·T₂','η·T₃'][i]);});s+=text(360,292,'ŷ = ŷ₀ + ηT₁ + ηT₂ + ηT₃');}
 if(model===2){s+=box(20,125,105,60,'DATA',step===0);[90,165,240].forEach((y,i)=>{s+=line(125,155,220,y,step>0)+tree(280,y-40,.42,step>0?3:0)+line(310,y,490,155,step>1)});s+=box(490,125,170,60,'MEAN → PWV',step===3);}
 if(model===3){for(let i=0;i<18;i++)s+=dot(30+i%6*27,80+Math.floor(i/6)*50,step===0);s+=line(200,155,260,155,step>0);[60,105,85,140,100].forEach((h,i)=>s+=`<rect class="demo-bin ${step>0?'lit':''}" x="${280+i*28}" y="${245-h}" width="20" height="${h}"/>`);s+=text(345,278,'BINS');if(step>=2)s+=`<path class="demo-split" d="M348 55V250"/>`;s+=line(440,155,510,155,step>2)+tree(580,85,.8,step>2?3:0);}
 if(model===4){const layers=[[80,6],[265,4],[455,4],[640,1]],pos=layers.map(([x,n])=>Array.from({length:n},(_,i)=>[x,160+(i-(n-1)/2)*40]));pos.slice(0,-1).forEach((a,k)=>a.forEach(p=>pos[k+1].forEach(v=>s+=line(...p,...v,step===k+1))));pos.forEach((a,k)=>a.forEach(p=>s+=dot(...p,step===k)));s+=text(80,307,'6 INPUTS')+text(360,307,'HIDDEN LAYERS')+text(640,230,'PWV');}
 if(model===5){s+=box(20,130,100,55,'INPUT',step===0)+line(120,155,180,155,step>0)+box(180,115,160,85,'SHARED W',step===1);[70,160,250].forEach((y,i)=>{s+=line(340,155,410,y,step>1)+box(410,y-25,100,50,'r'+(i+1)+' / s'+(i+1),step===2)+line(510,y,610,155,step>2)});s+=dot(630,155,step===3)+text(630,215,'MEAN');}
 if(model===6){s+=tree(100,60,.65,step>0?3:1)+text(100,240,'SUBSETS')+line(155,150,230,150,step>0)+box(230,110,170,80,'KERNEL FIT',step===1)+line(400,150,480,150,step>1);for(let r=0;r<4;r++)for(let c=0;c<4;c++)s+=`<rect class="demo-matrix ${step>=2?'lit':''}" x="${490+c*25}" y="${100+r*25}" width="19" height="19" opacity="${r===c?1:.35}"/>`;s+=text(540,240,'METRIC M');s+=`<path class="demo-edge ${step===3?'lit':''}" d="M540 255Q380 340 285 220"/>`+text(405,292,'↶ UPDATE');}
 if(model===7){['RF','HistGB','XGB','LGBM','MLP'].forEach((name,i)=>{s+=box(30,20+i*58,100,43,name,step===0)+line(130,42+i*58,255,42+i*58,step>0)+dot(270,42+i*58,step===1)+line(285,42+i*58,435,155,step>1)});s+=box(435,115,120,80,'MLP',step===2)+line(555,155,630,155,step>2)+dot(650,155,step===3)+text(650,215,'PWV')+text(290,317,'HOLDOUT');}
 return s;
}
function render(){const l=zh()?1:0;root.querySelectorAll('[data-mechanism]').forEach((b,i)=>{b.classList.toggle('active',i===model);b.setAttribute('aria-pressed',i===model)});root.querySelectorAll('[data-step]').forEach((b,i)=>{b.classList.toggle('active',i===step);b.setAttribute('aria-pressed',i===step);b.setAttribute('aria-label',say('Step ','步骤 ')+(i+1))});q('h3').textContent=content[model][l][0];q('.demo-explanation').textContent=content[model][l][1];q('.demo-step').textContent=`0${step+1} / ${steps[model][l][step]}`;q('svg').innerHTML=diagram();q('svg').setAttribute('aria-label',names[model]+' · '+steps[model][l][step]);q('[data-play]').textContent=playing?say('Ⅱ Pause','Ⅱ 暂停'):say('▶ Play','▶ 播放');q('[data-next]').textContent=say('Step →','单步 →');q('[data-reset]').textContent=say('↺ Reset','↺ 重播');}
root.querySelectorAll('[data-mechanism]').forEach(b=>b.addEventListener('click',()=>{model=+b.dataset.mechanism;step=0;render()}));root.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{step=+b.dataset.step;playing=false;render()}));q('[data-play]').addEventListener('click',()=>{playing=!playing;render()});q('[data-next]').addEventListener('click',()=>{playing=false;step=(step+1)%4;render()});q('[data-reset]').addEventListener('click',()=>{step=0;render()});new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});new IntersectionObserver(e=>{visible=e[0].isIntersecting}).observe(root);setInterval(()=>{if(playing&&visible&&!document.hidden){step=(step+1)%4;render()}},2100);render();
})();
