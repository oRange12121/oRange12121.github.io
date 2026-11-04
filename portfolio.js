'use strict';
// Preserve direct links shared before the project index was introduced.
if(document.body.classList.contains('overview')&&['#main','#work','#lab','#method','#evidence'].includes(location.hash))location.replace('optics.html'+location.hash);
const translated=[...document.querySelectorAll('[data-zh]')].map(el=>({el,en:el.innerHTML,zh:el.dataset.zh}));
let language='en',stage=3,evidence='osd';
const stages=[
 {en:['01 / ACQUIRE','Start with the sensor.','I²C register configuration brings up the camera. MIPI CSI reception turns the incoming RAW/Bayer data into a usable video stream. The project integrates the supporting interface IP.','I²C CONFIGURATION|MIPI CSI|RAW / BAYER'],zh:['01 / 采集','从传感器开始。','通过 I²C 寄存器配置初始化摄像头，MIPI CSI 接收模块把 RAW/Bayer 输入转换为可处理的视频数据流。工程集成相应的底层接口 IP。','I²C 配置|MIPI CSI|RAW / BAYER']},
 {en:['02 / BUFFER','Decouple capture and display.','A DDR frame buffer and FIFO-based buffering connect the acquisition and output paths. Clock, reset, and valid-data sequencing are part of making the video chain work as a system.','DDR FRAME BUFFER|CLOCK DOMAINS|RESET SEQUENCING'],zh:['02 / 缓存','协调采集端与显示端。','DDR 帧缓存与 FIFO 缓冲衔接图像采集和输出通路。时钟、复位和数据有效时序共同保证视频链路稳定运行。','DDR 帧缓存|时钟域|复位时序']},
 {en:['03 / RECONSTRUCT','Recover color, two pixels at a time.','Debayer processing converts the raw mosaic into RGB888. The 48-bit output carries two 24-bit pixels per valid clock cycle, matching the downstream parallel vision modules.','2 PIXELS / CLOCK|48-BIT RGB|1920 × 1080 CONFIGURATION'],zh:['03 / 重建色彩','每拍恢复两个彩色像素。','Debayer 将原始 Bayer 数据转换成 RGB888。48 位输出每个有效周期承载两个 24 位像素，与后续并行视觉模块匹配。','2 像素 / 时钟|48 位 RGB|1920 × 1080 配置']},
 {en:['04 / SEGMENT','Match the representation to the color.','HSV hue intervals separate red, yellow, and blue. A fixed-point YCbCr branch handles black and white. Exclusion logic reduces overlap between the masks.','FIXED POINT|PARALLEL MASKS|THRESHOLD CALIBRATION'],zh:['04 / 颜色分割','为不同颜色选择合适的表示。','HSV 色相区间用于红、黄、蓝；定点 YCbCr 分支用于黑、白。通过排除逻辑减少不同掩膜之间的混淆。','定点运算|并行掩膜|阈值标定']},
 {en:['05 / DESCRIBE','Reduce pixels to region features.','Each color has its own area, coordinate-sum, and bounding-box accumulator. Frame-level features feed compact fill-ratio and aspect-ratio rules, followed by dominant valid color-region selection.','FRAME STATISTICS|GEOMETRIC RULES|DOMINANT REGION'],zh:['05 / 特征与分类','把像素归纳为区域特征。','每种颜色分别累积面积、坐标和与外接框。帧级特征用于填充率和宽高比规则，再选出有效面积最大的颜色区域。','帧级统计|几何规则|主区域选择']},
 {en:['06 / OBSERVE','Close the debugging loop.','The original video can carry a target-box overlay or switch to a color-mask preview. LED codes expose the selected class; captured internal signals help refine thresholds on the actual board.','OSD OVERLAY|MASK PREVIEW|LOGIC ANALYZER'],zh:['06 / 输出与调试','形成可观察的调试过程。','在原图上叠加目标框，或切换到颜色掩膜预览。LED 编码输出所选类别，内部信号抓取帮助在实板上调整阈值。','OSD 叠加|掩膜预览|逻辑分析']}
];
const captures={
 osd:{file:'fpga-osd.jpg',alt:'Physical display showing a blue bounding box over a target',en:['OBSERVE / LOCALIZE','See where the system thinks the target is.','A bounding box is drawn over the original camera image. This makes region coordinates and display alignment directly inspectable on the physical screen.','Actual display photograph from the competition presentation.'],zh:['观察 / 定位','直观看到系统判断的目标位置。','目标框叠加在相机原图上，可以直接在实物屏幕检查区域坐标和显示对齐情况。','来自项目汇报的真实屏幕照片。']},
 mask:{file:'fpga-mask.jpg',alt:'Physical screen showing a false-color segmentation mask',en:['INSPECT / SEGMENT','Expose the segmentation before the decision.','A false-color mask preview separates the classification stage from the original video. It reveals stray pixels, reflected highlights, and background leakage while tuning thresholds.','Archived photograph of the segmentation preview.'],zh:['检查 / 分割','在分类之前，先看清分割结果。','伪彩色掩膜预览将分割结果单独显示，帮助调整阈值时定位杂散像素、高光反射和背景干扰。','项目存档中的掩膜预览照片。']},
 waveform:{file:'fpga-waveform.jpg',alt:'Captured FPGA logic-analyzer signals from the project report',en:['TRACE / CALIBRATE','Follow the signals inside the FPGA.','Captured intermediate values support threshold calibration on real input. Logic traces complement the screen: they show signal behavior that a final bounding box alone cannot explain.','Original logic-analyzer capture embedded in the project report.'],zh:['追踪 / 标定','观察 FPGA 内部的信号。','通过抓取中间值，在真实输入下标定阈值。逻辑波形补充屏幕显示，帮助解释仅靠最终目标框无法定位的问题。','作品说明文档中的原始逻辑分析截图。']},
 bench:{file:'fpga-bench.jpg',alt:'Camera, FPGA board, target object and display in the physical test setup',en:['INTEGRATE / DEMONSTRATE','Bring the complete chain onto the bench.','A physical target, camera, FPGA board, and display run together. The recorded setup shows the link from the object in front of the camera to the processed output on the screen.','Original bench photograph from the project presentation.'],zh:['集成 / 演示','让整条链路在实物台架上运行。','物体、相机、FPGA 开发板与屏幕共同运行。存档照片呈现从相机前的实际目标到屏幕处理结果的完整链路。','来自项目汇报的原始台架照片。']}
};
function showStage(){
 const code=document.getElementById('stage-code');if(!code)return;
 const s=stages[stage][language];code.textContent=s[0];document.getElementById('stage-title').textContent=s[1];document.getElementById('stage-text').textContent=s[2];
 document.getElementById('stage-tags').replaceChildren(...s[3].split('|').map(t=>{const el=document.createElement('span');el.textContent=t;return el}));
 document.querySelectorAll('[data-stage]').forEach(b=>{const on=Number(b.dataset.stage)===stage;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on))});
}
function showEvidence(){
 const img=document.getElementById('evidence-image');if(!img)return;
 const c=captures[evidence],text=c[language];img.src=c.file;img.alt=c.alt;
 ['label','title','text','caption'].forEach((key,i)=>document.getElementById('evidence-'+key).textContent=text[i]);document.getElementById('evidence-original').href=c.file;
 document.querySelectorAll('[data-evidence]').forEach(b=>{const on=b.dataset.evidence===evidence;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on))});
}
function setLanguage(value){
 language=value;document.documentElement.lang=value==='zh'?'zh-CN':'en';translated.forEach(x=>x.el.innerHTML=x[value]);
 const button=document.getElementById('site-language');button.textContent=value==='zh'?'EN ↗':'中文 ↗';button.setAttribute('aria-label',value==='zh'?'Switch to English':'Switch to Chinese');
 try{localStorage.setItem('optics-portfolio-language',value)}catch{}
 showStage();showEvidence();
}
document.getElementById('site-language').addEventListener('click',()=>setLanguage(language==='en'?'zh':'en'));
document.querySelectorAll('[data-stage]').forEach(b=>b.addEventListener('click',()=>{stage=Number(b.dataset.stage);showStage()}));
document.querySelectorAll('[data-evidence]').forEach(b=>b.addEventListener('click',()=>{evidence=b.dataset.evidence;showEvidence()}));
let stored='en';try{stored=localStorage.getItem('optics-portfolio-language')||'en'}catch{}
setLanguage(stored==='zh'?'zh':'en');
