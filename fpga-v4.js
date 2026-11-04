'use strict';
(() => {
  let selectedCapture = 'osd';
  let selectedStage = 3;
  const isChinese = () => document.documentElement.lang === 'zh-CN';
  const say = (en,zh) => isChinese() ? zh : en;
  const heroCaptures = {
    osd: { file:'fpga-osd.jpg', alt:'Actual physical display with the recognized target bounded in blue', en:'Target localization · actual display photograph', zh:'目标定位 · 真实上板画面' },
    mask: { file:'fpga-mask.jpg', alt:'Actual display showing a false-color segmentation preview', en:'Color segmentation · actual display photograph', zh:'颜色分割 · 真实上板画面' },
    bench: { file:'fpga-bench.jpg', alt:'The physical object, camera, FPGA board and display on the test bench', en:'Camera → FPGA → display · physical test bench', zh:'相机 → FPGA → 屏幕 · 实物测试台架' }
  };
  function renderHero(){
    const item=heroCaptures[selectedCapture];
    const img=document.getElementById('fpga-hero-image');
    if(!img)return;
    img.src=item.file;img.alt=item.alt;
    document.getElementById('fpga-hero-caption').textContent=isChinese()?item.zh:item.en;
    document.getElementById('fpga-hero-original').href=item.file;
    document.querySelectorAll('[data-capture]').forEach(button=>{const selected=button.dataset.capture===selectedCapture;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));});
  }
  const photo=(file,alt,note)=>`<div class="stage-photo"><img src="${file}" alt="${alt}"></div><p class="stage-image-note">${note}</p>`;
  function renderStage(){
    const host=document.getElementById('fpga-stage-visual');
    if(!host)return;
    const views=[
      ()=>photo('fpga-bench.jpg','Physical camera, FPGA board and display',say('Camera input → hardware processing → display','相机输入 → 硬件处理 → 屏幕输出')),
      ()=>`<div class="buffer-diagram"><div class="buffer-end">MIPI CSI<br>${say('CAPTURE','采集时序')}</div><span class="memory-arrow">→</span><div class="memory-stack"><div>DDR / FIFO</div><div>${say('FRAME BUFFER','帧缓存')}</div><div>${say('CLOCK DOMAINS','跨时钟域')}</div></div><span class="memory-arrow">→</span><div class="buffer-end">MIPI DSI<br>${say('DISPLAY','显示时序')}</div></div><p class="stage-image-note">${say('Buffered data connects the two timing domains.','通过缓冲协调采集与显示的时序。')}</p>`,
      ()=>`<div class="pixel-bus"><span class="bus-label">RGB888 × 2 / 48-BIT BUS</span><div class="pixel-pair"><div><strong>PIXEL 0</strong><div class="rgb-values"><i>R₀</i><i>G₀</i><i>B₀</i></div></div><div><strong>PIXEL 1</strong><div class="rgb-values"><i>R₁</i><i>G₁</i><i>B₁</i></div></div></div><div class="bus-end">${say('2 pixels / valid clock cycle','每个有效时钟周期 · 2 个像素')}</div></div>`,
      ()=>photo('fpga-mask.jpg','Actual display with the segmentation mask',say('HSV + YCbCr → five color masks','HSV + YCbCr → 五路颜色掩膜')),
      ()=>`<div class="geometry-diagram"><div class="geometry-cell"><div class="geometry-box"><i></i></div><span>${say('FILL RATIO','填充率')}</span></div><div class="geometry-cell"><div class="geometry-box"><i></i></div><span>${say('ASPECT RATIO','宽高比')}</span></div><div class="geometry-cell"><div class="geometry-box"><i></i></div><span>${say('VALID AREA','有效面积')}</span></div></div><p class="stage-image-note">${say('Projected geometry → compact classification rules','二维投影几何 → 紧凑的分类规则')}</p>`,
      ()=>photo('fpga-osd.jpg','Target bounding box drawn over the original camera image',say('A visible target box exposes the region coordinates.','通过目标框，直接检查区域坐标。'))
    ];
    host.innerHTML=views[selectedStage]();
  }
  document.querySelectorAll('[data-capture]').forEach(button=>button.addEventListener('click',()=>{selectedCapture=button.dataset.capture;renderHero();}));
  document.querySelectorAll('[data-stage]').forEach(button=>button.addEventListener('click',()=>{selectedStage=Number(button.dataset.stage);renderStage();}));
  new MutationObserver(()=>{renderHero();renderStage();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  renderHero();renderStage();
})();
