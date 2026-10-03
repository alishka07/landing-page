(() => {
'use strict';
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const mobileQuery = matchMedia('(max-width:760px)');
const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)');
const menuToggle = $('#menuToggle');
const navigation = $('#navigation');
let manualMenu = false;
let menuState = null;
function setMenu(open) {
 if(menuState === open) return;
 menuState = open;
 document.body.classList.toggle('nav-open', open);
 menuToggle.setAttribute('aria-expanded', String(open));
 menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
 navigation.inert = !open;
 menuToggle.tabIndex = open && !mobileQuery.matches ? -1 : 0;
 $('#railPeek').tabIndex = open || mobileQuery.matches ? -1 : 0;
}
function closeMenu(restoreFocus = false) {manualMenu = false; setMenu(false); if(restoreFocus) menuToggle.focus();}
menuToggle.addEventListener('click', () => {manualMenu = !document.body.classList.contains('nav-open'); setMenu(manualMenu);});
$('#railPeek').addEventListener('click', () => {manualMenu = true;setMenu(true);$('.rail-link').focus();});
$$('.rail a').forEach(link => link.addEventListener('click', () => closeMenu()));
mobileQuery.addEventListener('change', () => {manualMenu = false;menuState=null;setMenu(false);});
document.addEventListener('keydown', event => {
 if(event.key==='Escape' && document.body.classList.contains('nav-open')) closeMenu(true);
 if(event.key==='Tab' && mobileQuery.matches && document.body.classList.contains('nav-open') && !document.querySelector('dialog[open]')) {
  const all=[menuToggle,...$$('button,a[href]',navigation)];const first=all[0],last=all.at(-1);
  if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
  if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
 }
});
const steps = [
 {title:'Пройти маршрут.',media:'assets/route-aerial-v1.png',label:'Иллюстрация маршрута',points:[['План до выхода на воду','Точку отбора и путь возвращения согласуем до запуска.'],['Данные с координатами','Пробу и измерения связываем с точкой и временем.'],['Повторяемый проход','Один маршрут для сопоставления наблюдений.'],['Возвращение к оператору','В пилоте проверим связь и возврат аппарата с пробой.']]},
 {title:'Измерить воду.',media:'assets/measurement-in-water.svg',label:'Планируемая схема',points:[]},
 {title:'Отобрать пробы.',media:'assets/subulaq-field-v3.png',label:'Концепция отбора проб',points:[['Точка и время','Каждую пробу связываем с координатами, временем и результатом анализа.'],['Требования лаборатории','Глубину, объём, хранение и передачу пробы согласуем до испытаний.']]}
];
let currentStep = -1;
let detailState = null;
let manualStep = null;
$$('a[href^="#"]').forEach(link=>link.addEventListener('click',()=>{manualStep=null;}));
const capabilityStage=$('.capability-stage'), capabilitySection=$('#how');
const capabilityThumbnails=$('.capability-thumbnails');
const capabilityLines=$('#capabilitiesTitle');
capabilityLines.replaceChildren(...['Пройти маршрут.','Измерить воду.','Отобрать пробы.'].map(text=>{const span=document.createElement('span');span.className='cap-line';span.textContent=text;return span;}));
const capabilityMedia=$('.capability-media');
capabilityMedia.insertAdjacentHTML('beforeend',`<div class="process-illustration" aria-hidden="true">
 <div class="survey-route">
  <svg viewBox="0 0 800 400" fill="none">
   <path class="route-return" d="M650 100 V254 Q650 270 630 279 L478 342 Q462 348 445 345 L140 280"/>
   <path class="route-outbound" d="M140 280 L285 180 Q295 172 310 172 H470 Q483 172 494 164 L650 100"/>
   <path class="route-arrow" d="m388 166 7 6-7 6"/>
   <path class="route-arrow route-arrow-return" d="m553 305-7 8 10 1"/>
   <circle class="route-halo" cx="650" cy="100" r="19"/>
   <circle class="route-stop" cx="650" cy="100" r="5"/>
   <circle class="route-start" cx="140" cy="280" r="5"/>
  </svg>
  <span class="route-label route-origin">Старт и возврат</span>
  <span class="route-label route-sample">Точка отбора</span>
  <span class="route-label route-return-label">Возвращение</span>
 </div>
 </div>`);
$('.capability-detail').insertAdjacentHTML('beforeend',`<div class="measurement-explainer" hidden>
 <div class="measurement-layout">
  <figure class="measurement-installation">
   <img src="assets/measurement-in-water.svg" width="560" height="340" alt="Условный разрез катамарана: датчики под корпусом погружены в воду и соединены с бортовым регистратором.">
   <figcaption><strong>Датчики соприкасаются с водой</strong><p>Рассматриваем погружной блок под корпусом. Место и глубину установки уточним для пилота.</p></figcaption>
  </figure>
  <div class="measurement-method">
   <p class="measurement-prompt" id="measurementTabsLabel">Выберите, что измеряем</p>
   <div class="measurement-tabs" role="tablist" aria-labelledby="measurementTabsLabel">
    <button id="sensor-turbidity" role="tab" data-measurement="turbidity" aria-selected="true" aria-controls="measurementPanel">Мутность</button>
    <button id="sensor-ph" role="tab" data-measurement="ph" aria-selected="false" aria-controls="measurementPanel" tabindex="-1">pH</button>
    <button id="sensor-temperature" role="tab" data-measurement="temperature" aria-selected="false" aria-controls="measurementPanel" tabindex="-1">Температура</button>
    <button id="sensor-conductivity" role="tab" data-measurement="conductivity" aria-selected="false" aria-controls="measurementPanel" tabindex="-1">Проводимость</button>
   </div>
   <div id="measurementPanel" class="measurement-panel" role="tabpanel" aria-labelledby="sensor-turbidity" tabindex="0" data-parameter="turbidity">
    <svg class="measurement-principle" viewBox="0 0 360 156" fill="none" aria-hidden="true">
     <rect y="5" width="360" height="146" rx="5" fill="#dbe9e2"/>
     <g data-principle="turbidity">
      <rect x="24" y="70" width="32" height="29" rx="3" fill="#3e5f4d"/><path d="M56 84H175" stroke="#8a9b43" stroke-width="3"/><path d="m164 80 10 4-10 4" stroke="#8a9b43" stroke-width="2"/>
      <path d="M175 84V35" stroke="#8a9b43" stroke-width="3"/><path d="m171 44 4-9 4 9" stroke="#8a9b43" stroke-width="2"/>
      <rect x="164" y="14" width="22" height="21" rx="3" fill="#3e5f4d"/>
      <g fill="#829c80"><circle cx="175" cy="84" r="5"/><circle cx="145" cy="62" r="2"/><circle cx="194" cy="118" r="3"/><circle cx="220" cy="74" r="2"/><circle cx="148" cy="115" r="2.5"/><circle cx="241" cy="107" r="2.5"/></g>
      <path d="m180 88 19 11h51" stroke="#779580"/>
      <text x="14" y="124">Источник света</text><text x="201" y="29">Приёмник</text><text x="201" y="58">Рассеянный свет</text><text x="257" y="103">Частицы</text>
     </g>
     <g data-principle="ph">
      <path d="M20 78H340" stroke="#9bbcaf"/><rect x="120" y="20" width="26" height="77" rx="5" fill="#eef5ed" stroke="#587b65" stroke-width="2"/><path d="M120 92h26v10a13 13 0 0 1-26 0Z" fill="#9bbcac" stroke="#587b65" stroke-width="2"/>
      <path d="M157 97H215m-8-5 8 5-8 5" stroke="#729180" stroke-width="2"/><text x="231" y="106" class="measurement-symbol">pH</text>
      <text x="31" y="41">Электрод</text><path d="M90 44h27" stroke="#779580"/><text x="87" y="138">Чувствительная мембрана в воде</text>
     </g>
     <g data-principle="temperature">
      <path d="M20 78H340" stroke="#9bbcaf"/><rect x="128" y="22" width="16" height="90" rx="8" fill="#eef5ed" stroke="#587b65" stroke-width="2"/><path d="M136 52v52" stroke="#819755" stroke-width="4" stroke-linecap="round"/>
      <path d="M159 97H215m-8-5 8 5-8 5" stroke="#729180" stroke-width="2"/><text x="232" y="106" class="measurement-symbol">°C</text><text x="37" y="138">Термодатчик измеряет температуру воды</text>
     </g>
     <g data-principle="conductivity">
      <path d="M20 65H340" stroke="#9bbcaf"/><rect x="105" y="23" width="17" height="82" rx="4" fill="#eef5ed" stroke="#587b65" stroke-width="2"/><rect x="238" y="23" width="17" height="82" rx="4" fill="#eef5ed" stroke="#587b65" stroke-width="2"/>
      <path d="M127 87Q148 72 170 87T233 87" stroke="#829748" stroke-width="2" stroke-dasharray="5 4"/><path d="m225 81 8 6-9 4" stroke="#829748" stroke-width="2"/>
      <text x="142" y="50">Слабый ток</text><text x="87" y="137">Измерение между электродами</text>
     </g>
    </svg>
    <h4 id="measurementTitle">Мутность — по рассеянию света</h4>
    <p id="measurementDescription">Датчик направляет свет в воду. Частицы рассеивают его, а приёмник измеряет этот свет — так получают показатель мутности.</p>
    <p class="measurement-meaning" id="measurementMeaning">Показывает, насколько вода мутная. Состав примесей по этому показателю не определить.</p>
   </div>
  </div>
 </div>
 <div class="measurement-notes"><p><strong>Показание + координаты + время</strong>В пилоте проверим калибровку и сравним с контрольными измерениями.</p><p><strong>Датчики ещё подбираем</strong>Это схема принципа. Бортовые измерения не заменяют анализ пробы в лаборатории.</p></div>
</div>`);
const measurements={
 turbidity:['Мутность — по рассеянию света','Датчик направляет свет в воду. Частицы рассеивают его, а приёмник измеряет этот свет — так получают показатель мутности.','Показывает, насколько вода мутная. Состав примесей по этому показателю не определить.'],
 ph:['pH — по сигналу электрода','Чувствительная мембрана электрода контактирует с водой. Прибор преобразует её электрический сигнал в значение pH.','Показывает, кислая вода, нейтральная или щелочная.'],
 temperature:['Температура — при контакте с водой','Термодатчик находится в воде. Его чувствительный элемент реагирует на нагрев и охлаждение, а прибор переводит сигнал в градусы Цельсия.','Температуру также учитывают при обработке других измерений.'],
 conductivity:['Проводимость — по электрическому отклику','Датчик пропускает слабый переменный ток между электродами в воде и измеряет, насколько легко он проходит.','Электропроводность зависит от растворённых ионов. Она не определяет каждое вещество отдельно.']
};
const measurementTabs=$$('[data-measurement]');
function selectMeasurement(button){
 const key=button.dataset.measurement,data=measurements[key];
 measurementTabs.forEach(tab=>{const active=tab===button;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
 $('#measurementPanel').dataset.parameter=key;
 $('#measurementPanel').setAttribute('aria-labelledby',button.id);
 $('#measurementTitle').textContent=data[0];$('#measurementDescription').textContent=data[1];$('#measurementMeaning').textContent=data[2];
}
measurementTabs.forEach((button,index)=>{
 button.addEventListener('click',()=>selectMeasurement(button));
 button.addEventListener('keydown',event=>{
  const offsets={ArrowRight:1,ArrowLeft:-1};let next;
  if(event.key in offsets)next=(index+offsets[event.key]+measurementTabs.length)%measurementTabs.length;
  else if(event.key==='Home')next=0;else if(event.key==='End')next=measurementTabs.length-1;else return;
  event.preventDefault();const target=measurementTabs[next];selectMeasurement(target);target.focus({preventScroll:true});
 });
});
$('.capability-detail').insertAdjacentHTML('beforeend',`<div class="sampling-layout" role="group" aria-label="Схема отбора и передачи пробы" tabindex="0" hidden>
 <figure class="sampling-scene"><img src="assets/subulaq-field-v3.png" alt="Концептуальная визуализация катамарана на воде" width="1536" height="1024" loading="lazy"></figure>
 <div class="sampling-explainer">
 <div class="sampling-heading"><strong>От воды до лаборатории</strong></div>
 <ol class="sampling-flow">
  <li><div class="sampling-drawing"><svg viewBox="0 0 120 140" aria-hidden="true">
   <path d="M8 94 Q20 88 32 94 T56 94 T80 94 T112 94 V140 H8Z" fill="#a8c8cd"/>
   <path d="M8 109 Q20 103 32 109 T56 109 T80 109 T112 109 M8 125 Q20 119 32 125 T56 125 T80 125 T112 125" fill="none" stroke="#f4f9f7" stroke-width="2"/>
   <path d="M10 50 H105 L98 63 H22Z" fill="#f7faf7" stroke="#677d78" stroke-width="2"/>
   <path d="M57 111 V43 Q57 33 68 33 H108" fill="none" stroke="#6b817e" stroke-width="10" stroke-linejoin="round"/>
   <path d="M57 111 V43 Q57 33 68 33 H108" class="sampling-water-flow" fill="none" stroke="#c4e4e3" stroke-width="3" stroke-dasharray="4 7"/>
   <rect x="49" y="101" width="16" height="19" rx="3" fill="#4c6564"/><path d="M52 107 H62 M52 113 H62" stroke="#c4e4e3" stroke-width="2"/>
  </svg></div><strong>Забор воды</strong><span>Из водоёма</span></li>
  <li><div class="sampling-drawing"><svg viewBox="0 0 120 140" aria-hidden="true">
   <defs><clipPath id="sampleFillClip"><path d="M39 32 H81 V43 L92 56 V119 Q92 128 83 128 H37 Q28 128 28 119 V56 L39 43Z"/></clipPath></defs>
   <path d="M39 32 H81 V43 L92 56 V119 Q92 128 83 128 H37 Q28 128 28 119 V56 L39 43Z" fill="#f5f9f6" stroke="#67827d" stroke-width="2"/>
   <g clip-path="url(#sampleFillClip)"><rect class="sampling-fill" x="27" y="61" width="66" height="68" fill="#91bdc4"/><path d="M28 70 Q44 63 60 70 T92 70" fill="none" stroke="#c5e3e3" stroke-width="2"/></g>
   <path d="M38 27 V19 Q38 15 42 15 H78 Q82 15 82 19 V27" fill="#3c5350"/>
   <rect x="35" y="26" width="50" height="10" rx="2" fill="#718d85"/><path d="M40 29 V33 M47 29 V33 M54 29 V33 M61 29 V33 M68 29 V33 M75 29 V33 M82 29 V33" stroke="#d3e4dd"/>
   <rect x="37" y="78" width="46" height="30" rx="2" fill="#f6f8f1"/><path d="M45 87 H70 M45 94 H75 M45 100 H63" stroke="#81968c" stroke-width="2"/>
  </svg></div><strong>Одна ёмкость</strong><span>За один рейс</span></li>
  <li><div class="sampling-drawing"><svg viewBox="0 0 120 140" aria-hidden="true">
   <path d="M26 25 H90 Q96 25 96 31 V118 Q96 124 90 124 H26 Q20 124 20 118 V31 Q20 25 26 25Z" fill="#f5f8f1" stroke="#83968b" stroke-width="2"/>
   <rect x="38" y="19" width="40" height="12" rx="4" fill="#547565"/>
   <path d="M35 44 H81" stroke="#547565" stroke-width="3"/>
   <path d="M38 61 C27 61 29 74 38 80 C47 74 49 61 38 61Z" fill="none" stroke="#567d73" stroke-width="2"/><circle cx="38" cy="67" r="2" fill="#567d73"/>
   <path d="M55 67 H82 M55 74 H72" stroke="#9aaba1" stroke-width="2"/>
   <circle cx="38" cy="97" r="8" fill="none" stroke="#567d73" stroke-width="2"/><path d="M38 92 V97 L42 99 M55 94 H82 M55 102 H71" fill="none" stroke="#567d73" stroke-width="2"/>
  </svg></div><strong>Метка пробы</strong><span>Координаты и время</span></li>
 </ol>
 <div class="sampling-next">Возвращение к оператору <span aria-hidden="true">→</span> передача в лабораторию</div>
 </div>
 <div class="sampling-notes"></div>
</div>`);
new IntersectionObserver(entries=>{
 entries.forEach(entry=>capabilityStage.classList.toggle('overview-entered',entry.isIntersecting));
},{rootMargin:'-15% 0px -15% 0px',threshold:0}).observe(capabilitySection);
function showStep(index, showDetail) {
 const entering=showDetail&&detailState!==true;
 const changing=showDetail&&currentStep!==index;
 const direction=index>=currentStep?1:-1;
 let outgoingImage=null;
 if(changing){
  $$('.capability-transition-image').forEach(image=>{image.getAnimations().forEach(animation=>animation.cancel());image.remove();});
 }
 if(changing&&!entering&&!reducedMotion.matches&&currentStep!==1&&index!==1){
  outgoingImage=$('#capabilityImage').cloneNode();outgoingImage.removeAttribute('id');outgoingImage.alt='';outgoingImage.setAttribute('aria-hidden','true');outgoingImage.className='capability-transition-image';
  capabilityMedia.append(outgoingImage);
 }
 const sourceRect=entering?capabilityThumbnails.getBoundingClientRect():null;
 if(detailState!==showDetail){
  detailState=showDetail;
  capabilityStage.classList.toggle('is-detail',showDetail);
  $('.capability-overview').inert=showDetail;
  $('.capability-detail').inert=!showDetail;
 }
 if(index===currentStep&&!entering) return;
 currentStep=index; const data=steps[index];
 capabilityMedia.dataset.stage=String(index);
 capabilityStage.dataset.stage=String(index);
 $('.measurement-explainer').hidden=index!==1;
 $('.sampling-layout').hidden=index!==2;
 $('#capabilityHeading').textContent=data.title;
 $('#capabilityImage').src=data.media;
 $('#capabilityImage').alt=data.label;
 $('#capabilityImageLabel').textContent=data.label;
 const items=data.points.map(([title,description])=>{const article=document.createElement('article');const h=document.createElement('h4');h.textContent=title;const p=document.createElement('p');p.textContent=description;article.append(h,p);return article;});
 $('#capabilityPoints').replaceChildren();
 $('.sampling-notes').replaceChildren();
 (index===2?$('.sampling-notes'):$('#capabilityPoints')).replaceChildren(...items);
 $('#capabilityPoints').style.setProperty('--point-count',String(items.length));
 $$('.step-selector button').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.step)===index)));
 if(showDetail&&!reducedMotion.matches){
  const media=$('.capability-media');
  [media,$('#capabilityImage'),$('#capabilityHeading'),...items].forEach(element=>element.getAnimations().forEach(animation=>animation.cancel()));
  if(entering&&sourceRect){
   const destination=media.getBoundingClientRect();
   media.animate([{transform:`translate(${sourceRect.left-destination.left}px,${sourceRect.top-destination.top}px) scale(${sourceRect.width/destination.width},${sourceRect.height/destination.height})`,borderRadius:'5px'},{transform:'none',borderRadius:'10px'}],{duration:900,easing:'cubic-bezier(.22,1,.36,1)'});
   media.style.transformOrigin='top left';
  }else if(changing){
   $('#capabilityImage').animate([{transform:`translateX(${direction*12}%) scale(1.08)`,opacity:.2},{transform:'none',opacity:1}],{duration:850,easing:'cubic-bezier(.22,1,.36,1)'});
   if(outgoingImage){
    const transition=outgoingImage.animate([{transform:'none',opacity:1},{transform:`translateX(${-direction*16}%) scale(.96)`,opacity:0}],{duration:750,fill:'forwards',easing:'cubic-bezier(.22,1,.36,1)'});
    transition.finished.then(()=>outgoingImage.remove(),()=>outgoingImage.remove());
   }
  }
  $('#capabilityHeading').animate([{clipPath:'inset(0 0 100%)',transform:'translateY(28px)'},{clipPath:'inset(0)',transform:'none'}],{duration:700,delay:entering?270:0,fill:'backwards',easing:'cubic-bezier(.22,1,.36,1)'});
  items.forEach((article,i)=>article.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'none'}],{duration:500,delay:(entering?360:140)+i*65,fill:'backwards',easing:'ease-out'}));
 }
}
$$('[data-step]').forEach(button=>button.addEventListener('click',()=>{
 const index=Number(button.dataset.step);
 manualStep=index;
 showStep(index,true);
 $(`.step-selector [data-step="${index}"]`).focus({preventScroll:true});
 if(!reducedMotion.matches){
  const top=capabilitySection.getBoundingClientRect().top+scrollY;
  const distance=capabilitySection.offsetHeight-capabilityStage.offsetHeight;
  window.scrollTo({top:top+distance*(.32+index*.26),behavior:'instant'});
 }else{
  window.scrollTo({top:capabilitySection.getBoundingClientRect().top+scrollY-8,behavior:'instant'});
 }
 updateScroll();
}));
// A selected step remains stable until the visitor resumes scrolling.
window.addEventListener('wheel',()=>{manualStep=null;},{passive:true});
window.addEventListener('touchmove',()=>{manualStep=null;},{passive:true});
document.addEventListener('keydown',event=>{
 if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)&&!event.target.closest('input,textarea,select,button')) manualStep=null;
});
const product=$('.product-intro');
const observed=$$('main>section[id]');
$$('details').forEach(details=>details.addEventListener('toggle',()=>window.dispatchEvent(new Event('resize'))));
function revealComparison(){if(location.hash==='#compare')$('.method-comparison').open=true;}
window.addEventListener('hashchange',revealComparison);
revealComparison();
let scrollPending=false;
function updateScroll(){
 if(!manualMenu) setMenu(false);
 if(!reducedMotion.matches){
  const sectionTop=capabilitySection.getBoundingClientRect().top;
  if(sectionTop<innerHeight && sectionTop+capabilitySection.offsetHeight>0){
   const cp=clamp(-sectionTop/(capabilitySection.offsetHeight-capabilityStage.offsetHeight));
   const merge=manualStep!==null?1:clamp((cp-.07)/.15);
   capabilityStage.style.setProperty('--cap-merge',merge.toFixed(3));
   capabilityThumbnails.classList.toggle('is-merged',merge>.55);
   showStep(manualStep??Math.min(2,Math.floor(clamp((cp-.22)/.78)*3)),manualStep!==null||cp>.22);
  } else manualStep=null;
  const productTop=product.getBoundingClientRect().top;
  if(productTop<innerHeight&&productTop+product.offsetHeight>0) product.style.setProperty('--product-y',`${clamp(productTop/innerHeight,-1,1)*60}px`);
 }
 const active=[...observed].reverse().find(section=>section.getBoundingClientRect().top<=innerHeight*.35)||observed[0];
 document.body.classList.toggle('on-dark',['who','pilot'].includes(active.id)||(active.id==='how'&&detailState===true&&currentStep===0));
 $$('.rail-link[href]').forEach(link=>{if(link.hash===`#${active.id}`)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
 $('#scrollDistance').textContent=(scrollY/innerHeight).toFixed(1);
 scrollPending=false;
}
window.addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(updateScroll);}},{passive:true});
window.addEventListener('resize',updateScroll);
window.addEventListener('load',updateScroll);
reducedMotion.addEventListener('change',updateScroll);
updateScroll();
const missions={research:['Исследовательские команды','Пробы в удалённых от берега точках и повторные проходы по одному маршруту. Проверяем, где катамаран поможет в полевой работе.'],lab:['Лаборатории','Согласуем глубину, объём, хранение и передачу пробы. В пилоте проверим пригодность доставленных проб и связь с результатами анализа.'],contractor:['Подрядчики мониторинга','Выезды по согласованному графику в точки, где постоянный пост не подходит под задачу. Сравним время и стоимость отбора с текущим способом.']};
$$('[data-mission]').forEach(button=>button.addEventListener('click',()=>{const data=missions[button.dataset.mission];$('#missionHeading').textContent=data[0];$('#missionDescription').textContent=data[1];$$('[data-mission]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
const contactDialog=$('#contactDialog');
function openContact(){closeMenu();if(!contactDialog.open)contactDialog.showModal();}
$$('[data-contact]').forEach(button=>button.addEventListener('click',openContact));
$('#closeContact').addEventListener('click',()=>contactDialog.close());
contactDialog.addEventListener('click',event=>{const r=contactDialog.getBoundingClientRect();if(event.target===contactDialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))contactDialog.close();});
$$('[data-service]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();openContact();}));

  const tabs = $$('.console-tabs [role="tab"]');
  function selectTab(tab, focus = false) {
    tabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectTab(tabs[next], true); }
    });
  });
  const demoRows = [
    {point:'Точка 1', time:'10:00', ph:7.2, turbidity:3.1, temperature:18.4, ec:615},
    {point:'Точка 2', time:'10:12', ph:7.4, turbidity:3.8, temperature:18.6, ec:642},
    {point:'Точка 3', time:'10:24', ph:7.3, turbidity:4.2, temperature:18.5, ec:668},
    {point:'Точка 4', time:'10:36', ph:7.2, turbidity:3.5, temperature:18.3, ec:628}
  ];
  const formatNumber = value => value.toLocaleString('ru-RU');
  demoRows.forEach(row => {
    const tr = document.createElement('tr');
    [row.point, formatNumber(row.ph), formatNumber(row.turbidity), formatNumber(row.temperature), row.ec].forEach((value, index) => {
      const cell = document.createElement(index === 0 ? 'th' : 'td');
      if (index === 0) cell.scope = 'row';
      cell.textContent = value;
      tr.appendChild(cell);
    });
    $('#demoMeasurements').appendChild(tr);
  });


  function singleDisclosure(selector) {
    const items = $$(selector);
    items.forEach(item => item.addEventListener('toggle', () => {
      if (item.open) items.forEach(other => { if (other !== item) other.open = false; });
    }));
  }
  singleDisclosure('.process-step');
  singleDisclosure('.faq-list details');

  const searchDialog = $('#searchDialog');
  const searchItems = [
    ['Катамаран SuBulaq', '#top', 'аппарат модель обзор usv'],
    ['Задачи и применение', '#who', 'исследования лаборатории подрядчики труднодоступные точки берег'],
    ['Когда подходит катамаран', '#compare', 'сравнение ручной отбор лодка стационарный пост'],
    ['Как работает', '#how', 'маршрут пробы лаборатория этапы электропроводность датчики'],
    ['Оснащение', '#specification', 'катамаран датчики навигация модули'],
    ['Управление и данные', '#platform', 'измерения отчёт csv приложение демо'],
    ['Команда', '#team', 'люди Амирали Арнур конструкция программное обеспечение'],
    ['Первый пилот', '#pricing', 'маршрут площадка пробы критерии стоимость условия'],
    ['Вопросы и ответы', '#faq', 'faq испытания сроки каспий донные отложения услуга покупка'],
    ['Обсудить пилот', '#pilot', 'контакты почта письмо заявка']
  ];
  function renderSearch() {
    const query = $('#searchInput').value.trim().toLocaleLowerCase('ru');
    const results = searchItems.filter(([name, , keywords]) => `${name} ${keywords}`.toLocaleLowerCase('ru').includes(query));
    $('#searchResults').replaceChildren();
    results.forEach(([name, href]) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = href; link.textContent = name;
      const arrow = document.createElement('span'); arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
      link.appendChild(arrow);
      link.addEventListener('click', () => { searchDialog.close(); closeMenu(); });
      li.appendChild(link); $('#searchResults').appendChild(li);
    });
    $('#searchEmpty').hidden = results.length > 0;
  }
  $$('.search-open').forEach(button => button.addEventListener('click', () => {
    $('#searchInput').value = ''; renderSearch(); searchDialog.showModal(); $('#searchInput').focus();
  }));
  $('#closeSearch').addEventListener('click', () => searchDialog.close());
  searchDialog.addEventListener('click', event => {
    const rect = searchDialog.getBoundingClientRect();
    if (event.target === searchDialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) searchDialog.close();
  });
  $('#searchInput').addEventListener('input', renderSearch);
  $('#searchInput').addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); $('#searchResults a')?.click(); }
  });

  $$('[data-service]').forEach(link => link.addEventListener('click', () => {
    $('#serviceSelect').value = link.dataset.service;
    $('#draftResult').hidden = true;
  }));
  const form = $('#pilotForm');
  const recipient = 'subulaqdynamics@gmail.com';
  form.addEventListener('input', () => { $('#draftResult').hidden = true; });
  form.addEventListener('change', () => { $('#draftResult').hidden = true; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const message = String(data.get('message') || '').trim();
    if (!name || !message) {
      const emptyField = !name ? form.elements.name : form.elements.message;
      emptyField.setCustomValidity('Заполните поле текстом.');
      emptyField.reportValidity();
      emptyField.addEventListener('input', () => emptyField.setCustomValidity(''), {once:true});
      return;
    }
    const service = String(data.get('service'));
    const subject = `SuBulaq: ${service}`;
    const body = `Здравствуйте, команда SuBulaq!\n\nХочу обсудить: ${service}.\n\nИмя: ${name}\nОрганизация: ${String(data.get('company') || '').trim() || 'Не указана'}\nEmail: ${email}\n\nВодоём и задача:\n${message}\n\nС уважением,\n${name}`;
    $('#draftText').value = `Кому: ${recipient}\nТема: ${subject}\n\n${body}`;
    $('#openMail').href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    $('#copyStatus').textContent = '';
    $('#draftResult').hidden = false;
    $('#draftResult').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'nearest'});
  });
  $('#copyDraft').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('#draftText').value);
      $('#copyStatus').textContent = 'Текст скопирован. Вставьте его в письмо.';
    } catch {
      $('#draftText').focus(); $('#draftText').select();
      $('#copyStatus').textContent = 'Текст выделен. Нажмите Ctrl+C или выберите «Копировать».';
    }
  });
  $('#year').textContent = new Date().getFullYear();
})();
