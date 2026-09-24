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
mobileQuery.addEventListener('change', () => {manualMenu = false;menuState=null;setMenu(!mobileQuery.matches && scrollY < 30);});
document.addEventListener('keydown', event => {
 if(event.key==='Escape' && document.body.classList.contains('nav-open')) closeMenu(true);
 if(event.key==='Tab' && mobileQuery.matches && document.body.classList.contains('nav-open') && !document.querySelector('dialog[open]')) {
  const all=[menuToggle,...$$('button,a[href]',navigation)];const first=all[0],last=all.at(-1);
  if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
  if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
 }
});
const steps = [
 {title:'Пройти маршрут.',image:'assets/reservoir.webp',label:'Иллюстрация маршрута',points:[['План до выхода на воду','Точки и порядок обхода задаются оператором.'],['Данные с координатами','Каждое измерение связано с местом и временем.'],['Повторяемый проход','Один маршрут для сопоставления наблюдений.'],['Проверка на прототипе','Испытания на воде запланированы на октябрь 2026 года.']]},
 {title:'Измерить воду.',image:'assets/usv-on-water.webp',label:'Концепция бортового скрининга',points:[['Четыре показателя','pH, мутность, температура и TDS в базовой конфигурации.'],['Наблюдения по маршруту','Картина изменений на всём обследованном участке.'],['Сигнал для проверки','Измерения помогают выбрать точку для дополнительного отбора.'],['Отдельно от лаборатории','Бортовой скрининг не является лабораторным протоколом.']]},
 {title:'Отобрать пробы.',image:'assets/sample-cartridge.svg',label:'Планируемый принцип отбора проб',points:[['Картриджи на борту','Проектируем модуль для отбора и хранения проб.'],['Точка и время','Идентификатор пробы связывается с маршрутом обследования.'],['Партнёрская лаборатория','Официальный анализ выполняет аккредитованная лаборатория.'],['Понятный результат','Полевые наблюдения и лабораторные данные для эколога.']]}
];
let currentStep = -1;
let detailState = null;
let manualStep = null;
$$('a[href^="#"]').forEach(link=>link.addEventListener('click',()=>{manualStep=null;}));
const capabilityStage=$('.capability-stage'), capabilitySection=$('#how');
const capabilityLines=$('#capabilitiesTitle');
capabilityLines.replaceChildren(...['Пройти маршрут.','Измерить воду.','Отобрать пробы.'].map(text=>{const span=document.createElement('span');span.className='cap-line';span.textContent=text;return span;}));
const capabilityMedia=$('.capability-media');
capabilityMedia.insertAdjacentHTML('beforeend',`<div class="process-illustration" aria-hidden="true">
 <svg class="survey-route" viewBox="0 0 180 100" preserveAspectRatio="none"><path pathLength="1" d="M22 78 C45 73 38 45 65 48 S104 79 116 52 S142 25 160 18"/><circle cx="22" cy="78" r="2.3"/><circle cx="65" cy="48" r="2.3"/><circle cx="116" cy="52" r="2.3"/><circle cx="160" cy="18" r="2.3"/></svg>
 <div class="measurement-sweep"><i></i><div><span>pH</span><span>TDS</span><span>°C</span><span>Мутность</span></div></div>
 </div>`);
capabilityMedia.insertAdjacentHTML('beforeend',`<div class="sampling-explainer" hidden>
 <div class="sampling-heading"><strong>Как планируем отбирать пробы</strong><span>Схема концепции</span></div>
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
  </svg></div><strong>Картридж</strong><span>Хранение на борту</span></li>
  <li><div class="sampling-drawing"><svg viewBox="0 0 120 140" aria-hidden="true">
   <path d="M26 25 H90 Q96 25 96 31 V118 Q96 124 90 124 H26 Q20 124 20 118 V31 Q20 25 26 25Z" fill="#f5f8f1" stroke="#83968b" stroke-width="2"/>
   <rect x="38" y="19" width="40" height="12" rx="4" fill="#547565"/>
   <path d="M35 44 H81" stroke="#547565" stroke-width="3"/>
   <path d="M38 61 C27 61 29 74 38 80 C47 74 49 61 38 61Z" fill="none" stroke="#567d73" stroke-width="2"/><circle cx="38" cy="67" r="2" fill="#567d73"/>
   <path d="M55 67 H82 M55 74 H72" stroke="#9aaba1" stroke-width="2"/>
   <circle cx="38" cy="97" r="8" fill="none" stroke="#567d73" stroke-width="2"/><path d="M38 92 V97 L42 99 M55 94 H82 M55 102 H71" fill="none" stroke="#567d73" stroke-width="2"/>
  </svg></div><strong>Метка пробы</strong><span>Координаты и время</span></li>
 </ol>
 <div class="sampling-next"><span aria-hidden="true">↗</span> Далее — передача пробы в лабораторию</div>
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
 if(changing&&!entering&&!reducedMotion.matches&&index!==2&&currentStep!==2){
  outgoingImage=$('#capabilityImage').cloneNode();outgoingImage.removeAttribute('id');outgoingImage.alt='';outgoingImage.setAttribute('aria-hidden','true');outgoingImage.className='capability-transition-image';
  capabilityMedia.append(outgoingImage);
 }
 const sourceRect=entering?$(`.capability-thumbnails [data-step="${index}"]`).getBoundingClientRect():null;
 if(detailState!==showDetail){
  detailState=showDetail;
  capabilityStage.classList.toggle('is-detail',showDetail);
  $('.capability-overview').inert=showDetail;
  $('.capability-detail').inert=!showDetail;
 }
 if(index===currentStep&&!entering) return;
 currentStep=index; const data=steps[index];
 capabilityMedia.dataset.stage=String(index);
 $('.sampling-explainer').hidden=index!==2;
 $('#capabilityImage').hidden=index===2;
 $('#capabilityImageLabel').hidden=index===2;
 $('#capabilityHeading').textContent=data.title;
 $('#capabilityImage').src=data.image;
 $('#capabilityImage').alt=data.label;
 $('#capabilityImageLabel').textContent=data.label;
 const items=data.points.map(([title,description])=>{const article=document.createElement('article');const h=document.createElement('h4');h.textContent=title;const p=document.createElement('p');p.textContent=description;article.append(h,p);return article;});
 $('#capabilityPoints').replaceChildren(...items);
 $$('.step-selector button').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.step)===index)));
 if(showDetail&&!reducedMotion.matches){
  const media=$('.capability-media');
  [media,$('#capabilityImage'),$('#capabilityHeading'),...$$('#capabilityPoints article')].forEach(element=>element.getAnimations().forEach(animation=>animation.cancel()));
  if(entering&&sourceRect){
   const destination=media.getBoundingClientRect();
   media.animate([{transform:`translate(${sourceRect.left-destination.left}px,${sourceRect.top-destination.top}px) scale(${sourceRect.width/destination.width},${sourceRect.height/destination.height})`,borderRadius:'5px'},{transform:'none',borderRadius:'8px'}],{duration:900,easing:'cubic-bezier(.22,1,.36,1)'});
   media.style.transformOrigin='top left';
  }else if(changing&&index!==2){
   $('#capabilityImage').animate([{transform:`translateX(${direction*12}%) scale(1.08)`,opacity:.2},{transform:'none',opacity:1}],{duration:850,easing:'cubic-bezier(.22,1,.36,1)'});
   if(outgoingImage){
    const transition=outgoingImage.animate([{transform:'none',opacity:1},{transform:`translateX(${-direction*16}%) scale(.96)`,opacity:0}],{duration:750,fill:'forwards',easing:'cubic-bezier(.22,1,.36,1)'});
    transition.finished.then(()=>outgoingImage.remove(),()=>outgoingImage.remove());
   }
  }
  $('#capabilityHeading').animate([{clipPath:'inset(0 0 100%)',transform:'translateY(28px)'},{clipPath:'inset(0)',transform:'none'}],{duration:700,delay:entering?270:0,fill:'backwards',easing:'cubic-bezier(.22,1,.36,1)'});
  $$('#capabilityPoints article').forEach((article,i)=>article.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'none'}],{duration:500,delay:(entering?360:140)+i*65,fill:'backwards',easing:'ease-out'}));
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
  window.scrollTo({top:top+distance*(.25+index*.29),behavior:'instant'});
  updateScroll();
 }
}));
// A selected step remains stable until the visitor resumes scrolling.
window.addEventListener('wheel',()=>{manualStep=null;},{passive:true});
window.addEventListener('touchmove',()=>{manualStep=null;},{passive:true});
document.addEventListener('keydown',event=>{
 if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)&&!event.target.closest('input,textarea,select,button')) manualStep=null;
});
const heroStory=$('.hero-story'), heroViewport=$('.hero-viewport');
const product=$('.product-intro');
const observed=$$('main>section[id]');
let scrollPending=false;
function updateScroll(){
 if(!manualMenu) setMenu(!mobileQuery.matches&&scrollY<45);
 if(!reducedMotion.matches){
  const p=clamp(-heroStory.getBoundingClientRect().top/(heroStory.offsetHeight-heroViewport.offsetHeight));
  heroViewport.style.setProperty('--hero-scale',String(1+p*.53));
  heroViewport.style.setProperty('--hero-y',`${p*35}px`);
  heroViewport.style.setProperty('--hero-copy',String(clamp(1-p*3.8)));
  heroViewport.style.setProperty('--title-y',`${-p*80}px`);
  const story=clamp((p-.7)*5);
  heroViewport.style.setProperty('--story-opacity',String(story));
  heroViewport.style.setProperty('--story-y',`${(1-story)*35}px`);
  $('.hero-cta').inert=p>.26;
  $('#waterStory').setAttribute('aria-hidden',String(story<.1));
  const sectionTop=capabilitySection.getBoundingClientRect().top;
  if(sectionTop<innerHeight && sectionTop+capabilitySection.offsetHeight>0){
   const cp=clamp(-sectionTop/(capabilitySection.offsetHeight-capabilityStage.offsetHeight));
   showStep(manualStep??Math.min(2,Math.floor(clamp((cp-.13)/.87)*3)),manualStep!==null||cp>.13);
  } else manualStep=null;
  const productTop=product.getBoundingClientRect().top;
  if(productTop<innerHeight&&productTop+product.offsetHeight>0) product.style.setProperty('--product-y',`${clamp(productTop/innerHeight,-1,1)*60}px`);
 }
 const active=[...observed].reverse().find(section=>section.getBoundingClientRect().top<=innerHeight*.35)||observed[0];
 document.body.classList.toggle('on-dark',['top','who','pilot'].includes(active.id));
 $$('.rail-link[href]').forEach(link=>{if(link.hash===`#${active.id}`)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
 $('#scrollDistance').textContent=(scrollY/innerHeight).toFixed(1);
 scrollPending=false;
}
window.addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(updateScroll);}},{passive:true});
window.addEventListener('resize',updateScroll);
window.addEventListener('load',updateScroll);
reducedMotion.addEventListener('change',updateScroll);
updateScroll();
const missions={industry:['Экологические службы предприятий','Водоёмы-накопители, пруды-отстойники, водохранилища-охладители и выпуски сточных вод предприятий I категории.'],lab:['Лаборатории и подрядчики','Аккредитованные лаборатории и специалисты по отбору проб. SuBulaq разрабатывается как платформа для полевой части обследования.']};
$$('[data-mission]').forEach(button=>button.addEventListener('click',()=>{const data=missions[button.dataset.mission];$('#missionHeading').textContent=data[0];$('#missionDescription').textContent=data[1];$$('[data-mission]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
const contactDialog=$('#contactDialog');
function openContact(){closeMenu();if(!contactDialog.open)contactDialog.showModal();}
$$('[data-contact]').forEach(button=>button.addEventListener('click',openContact));
$('#closeContact').addEventListener('click',()=>contactDialog.close());
contactDialog.addEventListener('click',event=>{const r=contactDialog.getBoundingClientRect();if(event.target===contactDialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))contactDialog.close();});
$$('[data-service]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();openContact();}));

  const features = {
    navigation: ['Навигация', 'Заданный маршрут и привязка каждого наблюдения к координатам и времени.'],
    sensors: ['Измерение параметров воды', 'В базовой концепции: pH, мутность, температура и TDS. Состав датчиков уточняется на прототипе.'],
    sampling: ['Отбор проб', 'Съёмные опечатанные картриджи для последующей доставки проб в аккредитованную лабораторию.']
  };
  $$('.hotspot').forEach(button => button.addEventListener('click', () => {
    $$('.hotspot').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    const [label, description] = features[button.dataset.feature];
    $('#featureLabel').textContent = label;
    $('#featureDescription').textContent = description;
  }));

  const tabs = $$('[role="tab"]');
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
    {point:'Точка 1', time:'10:00', ph:7.2, turbidity:3.1, temperature:18.4, tds:310},
    {point:'Точка 2', time:'10:12', ph:7.4, turbidity:3.8, temperature:18.6, tds:325},
    {point:'Точка 3', time:'10:24', ph:7.3, turbidity:4.2, temperature:18.5, tds:340},
    {point:'Точка 4', time:'10:36', ph:7.2, turbidity:3.5, temperature:18.3, tds:318}
  ];
  const formatNumber = value => value.toLocaleString('ru-RU');
  demoRows.forEach(row => {
    const tr = document.createElement('tr');
    [row.point, formatNumber(row.ph), formatNumber(row.turbidity), formatNumber(row.temperature), row.tds].forEach((value, index) => {
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
    ['Зачем SuBulaq', '#problem', 'проблема скрининг вода наблюдения'],
    ['Как это работает', '#how', 'маршрут пробы лаборатория этапы'],
    ['Аппарат', '#specification', 'катамаран датчики навигация usv'],
    ['Платформа', '#platform', 'данные измерения отчёт csv приложение демо'],
    ['Для кого', '#who', 'предприятия пэк лаборатории партнёрство'],
    ['Сравнение методов', '#compare', 'ручной отбор стационарный пост'],
    ['Форматы работы', '#pricing', 'цены стоимость тарифы услуга'],
    ['Команда', '#team', 'люди Амирали Арнур Айкын'],
    ['Вопросы и ответы', '#faq', 'faq испытания сроки'],
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
  const recipient = 'amiralialtai1998@gmail.com';
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
