import * as THREE from './assets/vendor/three.module.min.js';
import { RoomEnvironment } from './assets/vendor/RoomEnvironment.js';
import { createVessel } from './vessel-model.js';

const section=document.querySelector('#specification');
const stage=section.querySelector('.equipment-stage');
const mount=section.querySelector('.equipment-scene');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const buttons=[...section.querySelectorAll('button[data-equipment]')];
const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
const smooth=(a,b,n)=>{const t=clamp((n-a)/(b-a));return t*t*(3-2*t);};
const descriptions={
 overview:['От корпуса до датчиков','Один аппарат.<br> Четыре задачи.','Навигация ведёт по маршруту, датчики измеряют воду, отдельный модуль отбирает пробу. Аккумулятор питает бортовые системы.','Выберите узел ниже, чтобы узнать, где он находится и как работает.'],
 navigation:['На мачте и верхней палубе','Навигация и связь','Позиционирование помогает идти по маршруту. Антенны связывают аппарат с оператором, камера помогает наблюдать за обстановкой.','Маршрут согласуем заранее; первый пилот — под наблюдением оператора.'],
 sensors:['Под корпусом, в контакте с водой','Датчики в воде','Погружной блок измеряет pH, температуру, мутность и электропроводность. Здесь чувствительные элементы соприкасаются с водой.','Рассматриваемый состав датчиков. Глубину установки уточним для пилота.'],
 sampling:['Между корпусами, под палубой','Отбор пробы','Водозаборная трубка подаёт воду через насос в отдельную ёмкость. После рейса пробу передают в лабораторию.','Планируем одну ёмкость за рейс. Объём, материалы и хранение согласуем с лабораторией.'],
 power:['В защищённом отсеке под палубой','Питание и запись','Аккумулятор питает бортовые узлы. Электроника сохраняет показания датчиков вместе с координатами и временем.','Компоновка, защита от воды и запас энергии ещё проектируются.']
};
// Each stop has an approach, a reading pause, and a return to the full assembly.
const shots=[
 {key:'navigation',start:.16,arrive:.205,leave:.30,end:.35,stop:.25},
 {key:'sensors',start:.37,arrive:.415,leave:.51,end:.56,stop:.46},
 {key:'sampling',start:.58,arrive:.625,leave:.72,end:.77,stop:.67},
 {key:'power',start:.79,arrive:.835,leave:.94,end:.99,stop:.88}
];
const positions={overview:0,...Object.fromEntries(shots.map(shot=>[shot.key,shot.stop]))};
const anchors={navigation:new THREE.Vector3(0,1.8,-.03),sensors:new THREE.Vector3(-.22,-.73,.98),sampling:new THREE.Vector3(.4,.6,.30),power:new THREE.Vector3(-.4,.69,.03)};
const groupNames={navigation:'modules',sensors:'sensors',sampling:'sampling',power:'power'};
const offsets={port:new THREE.Vector3(-1.08,-.12,0),starboard:new THREE.Vector3(.85,-.12,0),deck:new THREE.Vector3(0,.62,-.12),modules:new THREE.Vector3(0,1.35,-.28),sensors:new THREE.Vector3(-.2,-.85,1.00),sampling:new THREE.Vector3(1.9,.75,.5),power:new THREE.Vector3(-1.8,.88,.25)};
let selected='overview',manual=null,renderer=null,scene,camera,craft,groups,materials=[],tethers={};
let visible=false,lost=false,failed=false,frame=0,last=0,spread=0,focus=0,targetProgress=0,width=1,height=1;
let sectionTop=0,travel=1,hasRendered=false,wasViewing=false;
const pin=section.querySelector('#equipmentPin');
const leader=section.querySelector('#equipmentLeader');
const dot=section.querySelector('#equipmentAnchor');
const projected=new THREE.Vector3();
const overviewTarget=new THREE.Vector3(0,1.35,0);
const cameraOffset=new THREE.Vector3(8.2,5.05,11.5);
const cameraTarget=new THREE.Vector3(),focusTarget=new THREE.Vector3(),cameraUp=new THREE.Vector3();
const contextColor=new THREE.Color(0xc6d8cc);
const focusViews={};

function shotAt(amount){
 const shot=shots.findLast(item=>amount>=item.start);
 return {key:shot?.key||'overview',spread:smooth(.025,.15,amount),focus:shot?smooth(shot.start,shot.arrive,amount)*(1-smooth(shot.leave,shot.end,amount)):0};
}
function approach(value,target,dt){
 const next=value+(target-value)*(1-Math.exp(-dt*8));
 return Math.abs(next-target)<.001?target:next;
}

function prepareCloseups(){
 camera.position.copy(overviewTarget).add(cameraOffset);camera.lookAt(overviewTarget);camera.updateMatrixWorld();
 cameraUp.set(0,1,0).applyQuaternion(camera.quaternion);
 const inverse=camera.quaternion.clone().invert();
 for(const [key,name] of Object.entries(groupNames)){
  const bounds=new THREE.Box3().setFromObject(groups[name]);
  const center=bounds.getCenter(new THREE.Vector3()),corners=[];
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])corners.push(new THREE.Vector3(x,y,z));
  const viewBounds=new THREE.Box3().setFromPoints(corners.map(point=>point.clone().sub(center).applyQuaternion(inverse)));
  focusViews[key]={center,corners,width:viewBounds.max.x-viewBounds.min.x,height:viewBounds.max.y-viewBounds.min.y};
 }
}

function select(key){
 if(selected===key&&stage.dataset.equipment)return;
 selected=key;stage.dataset.equipment=key;
 const text=descriptions[key];
 section.querySelector('#equipmentPosition').textContent=text[0];
 // The only markup here is our static two-line introduction.
 section.querySelector('#equipmentTitle').innerHTML=text[1];
 section.querySelector('#equipmentDescription').textContent=text[2];
 section.querySelector('#equipmentDetail').textContent=text[3];
 section.querySelector('.equipment-method-link').hidden=key!=='sensors';
 buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.equipment===key)));
 pin.textContent={navigation:'Навигация и связь',sensors:'Чувствительные элементы',sampling:'Ёмкость для пробы',power:'Аккумулятор'}[key]||'';
 stage.classList.toggle('has-focus',key!=='overview');
}
select('overview');

function measure(){
 sectionTop=section.getBoundingClientRect().top+scrollY;
 travel=Math.max(1,section.offsetHeight-stage.offsetHeight);
 if(innerWidth<761){
  const copyTop=section.querySelector('.equipment-copy').offsetTop;
  stage.style.setProperty('--equipment-visual-bottom',`${Math.max(innerHeight<741?250:315,stage.clientHeight-copyTop+14)}px`);
 }else stage.style.removeProperty('--equipment-visual-bottom');
 width=mount.clientWidth;height=mount.clientHeight;
 if(renderer&&width&&height){
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<761?1.25:1.6));
  renderer.setSize(width,height,false);
  const viewHeight=Math.max(7.3,8.4/(width/height));
  camera.left=-viewHeight*width/height/2;camera.right=-camera.left;
  camera.top=viewHeight/2;camera.bottom=-camera.top;camera.updateProjectionMatrix();
 }
 sync();
}
function sync(){
 if(!renderer||lost||failed||reduced.matches)return;
 wasViewing=scrollY+innerHeight>sectionTop&&scrollY<sectionTop+section.offsetHeight;
 if(manual!==null&&Math.abs(scrollY-sectionTop-manual*travel)>3)manual=null;
 targetProgress=manual??clamp((scrollY-sectionTop)/travel);
 stage.style.setProperty('--equipment-progress',String(targetProgress));
 wake();
}
function wake(){if(!frame&&renderer&&visible&&!lost&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(render);}
function pose(){
 for(const [name,offset] of Object.entries(offsets))groups[name].position.copy(offset).multiplyScalar(spread);
 const view=focusViews[selected];
 const zoom=view?Math.min((camera.right-camera.left)*.62/view.width,(camera.top-camera.bottom)*.64/view.height,6):1;
 camera.zoom=1+(zoom-1)*focus;
 cameraTarget.copy(overviewTarget);
 if(view){
  focusTarget.copy(view.center).add(groups[groupNames[selected]].position);
  // Leave room above the close-up for the heading on wide screens.
  if(innerWidth>760)focusTarget.addScaledVector(cameraUp,(camera.top-camera.bottom)/zoom*.055);
  cameraTarget.lerp(focusTarget,focus);
 }
 camera.position.copy(cameraTarget).add(cameraOffset);camera.lookAt(cameraTarget);camera.updateProjectionMatrix();
 craft.updateMatrixWorld(true);camera.updateMatrixWorld();
 stage.dataset.explode=spread.toFixed(3);
 stage.dataset.zoom=camera.zoom.toFixed(3);
 stage.dataset.focus=focus.toFixed(3);
 for(const [key,line] of Object.entries(tethers)){
  const start=anchors[key],end=start.clone().add(groups[groupNames[key]].position);
  const data=line.geometry.attributes.position;data.setXYZ(0,start.x,start.y,start.z);data.setXYZ(1,end.x,end.y,end.z);data.needsUpdate=true;
  line.visible=spread>.05&&focus<.8;line.material.opacity=(selected===key?.5:.13)*(1-smooth(0,.8,focus));
 }
 for(const {mesh,material,base,part} of materials){
  const active=selected==='overview'||part===groupNames[selected];
  const opacity=active?1:1-smooth(.05,.72,focus);
  material.color.copy(base).lerp(contextColor,active?0:.24);
  if(material.transparent!==(opacity<1)){material.transparent=opacity<1;material.needsUpdate=true;}
  material.opacity=opacity;material.depthWrite=opacity>.98;mesh.visible=opacity>.005;
 }
 if(selected!=='overview'){
  projected.copy(anchors[selected]).add(groups[groupNames[selected]].position).project(camera);
  const x=(projected.x*.5+.5)*width,y=(-projected.y*.5+.5)*height;
  const labelWidth=pin.offsetWidth||120;
  let right=x;
  for(const corner of view.corners){projected.copy(corner).add(groups[groupNames[selected]].position).project(camera);right=Math.max(right,(projected.x*.5+.5)*width);}
  const lx=clamp(x+38+(right-x-14)*focus,12,width-labelWidth-12),ly=clamp(y-45,12,height-35);
  pin.style.transform=`translate(${lx}px,${ly}px)`;
  leader.setAttribute('d',`M${x} ${y} L${lx-10} ${y} L${lx-2} ${ly+12}`);
  dot.setAttribute('cx',x);dot.setAttribute('cy',y);
 }
}
function render(time){
 frame=0;if(!visible||document.hidden||lost||reduced.matches)return;
 const dt=Math.min((time-(last||time))/1000,.05);last=time;
 const destination=shotAt(targetProgress);
 // Even a direct button jump goes out to the assembly before approaching another part.
 // The description changes at that wide shot, never ahead of the camera.
 if(selected!==destination.key&&focus<.012){focus=0;select(destination.key);}
 const targetFocus=selected===destination.key?destination.focus:0;
 focus=approach(focus,targetFocus,dt);spread=approach(spread,destination.spread,dt);
 pose();renderer.render(scene,camera);
 if(!hasRendered){hasRendered=true;stage.classList.add('equipment-live');}
 if(focus!==targetFocus||spread!==destination.spread||selected!==destination.key)wake();
}
function fallback(){
 const keepPosition=section.classList.contains('equipment-scroll')&&wasViewing;
 cancelAnimationFrame(frame);frame=0;hasRendered=false;section.classList.remove('equipment-scroll');stage.classList.remove('equipment-live');
 stage.style.setProperty('--equipment-progress','0');
 buttons[0].textContent='Все узлы';
 section.querySelector('.equipment-heading p').textContent='Выберите узел, чтобы узнать, где он находится и какую задачу выполняет.';
 if(keepPosition){
  const retain=()=>window.scrollTo({top:section.getBoundingClientRect().top+scrollY-8,behavior:'instant'});
  retain();requestAnimationFrame(retain);
 }
}
function init(){
 if(renderer||failed||reduced.matches)return;
 try{
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;renderer.setClearColor(0x000000,0);
  scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-6,6,4,-4,.1,100);
  const environment=new RoomEnvironment(),generator=new THREE.PMREMGenerator(renderer),environmentMap=generator.fromScene(environment,.05);
  scene.environment=environmentMap.texture;scene.environmentIntensity=.8;environment.dispose();generator.dispose();
  scene.add(new THREE.HemisphereLight(0xf4f8f3,0x546c60,2.1));
  const key=new THREE.DirectionalLight(0xfff7e7,3.1);key.position.set(-4,9,7);scene.add(key);
  const fill=new THREE.DirectionalLight(0xc6e0db,1.7);fill.position.set(7,3,-6);scene.add(fill);
  craft=createVessel({equipment:true});scene.add(craft);
  groups=Object.fromEntries(Object.keys(offsets).map(name=>[name,craft.getObjectByName(name)]));
  craft.traverse(object=>{if(!object.isMesh)return;object.material=object.material.clone();materials.push({mesh:object,material:object.material,base:object.material.color.clone(),part:object.parent.name});});
  prepareCloseups();
  for(const key of Object.keys(anchors)){
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,0,0,0],3));
   const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:0x759782,transparent:true,opacity:.3}));line.frustumCulled=false;scene.add(line);tethers[key]=line;
  }
  renderer.domElement.setAttribute('aria-hidden','true');renderer.domElement.dataset.scene='equipment';mount.appendChild(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;fallback();});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{lost=false;hasRendered=false;activate();});
  activate();
 }catch(error){failed=true;renderer?.dispose();renderer=null;fallback();console.warn('Equipment illustration is available; the 3D view could not start.',error);}
}
function activate(){
 if(reduced.matches){fallback();return;}
 section.classList.add('equipment-scroll');
 buttons[0].textContent='В сборе';
 section.querySelector('.equipment-heading p').innerHTML='Прокрутите: от общей компоновки<br> к каждому узлу крупным планом.';
 measure();spread=shotAt(targetProgress).spread;focus=0;wake();
 // Recalculate the downstream scroll scenes after enabling the longer section.
 window.dispatchEvent(new Event('resize'));
}
buttons.forEach(button=>button.addEventListener('click',()=>{
 const key=button.dataset.equipment;
 if(renderer&&!lost&&!reduced.matches&&!failed){
  manual=positions[key];targetProgress=manual;
  window.scrollTo({top:sectionTop+manual*travel,behavior:'instant'});sync();
 }else select(key);
}));
function resumeScroll(){manual=null;}
window.addEventListener('wheel',resumeScroll,{passive:true});window.addEventListener('touchmove',resumeScroll,{passive:true});
window.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)&&!event.target.closest('button,input,textarea,select'))resumeScroll();});
window.addEventListener('scroll',sync,{passive:true});window.addEventListener('resize',measure,{passive:true});
window.addEventListener('load',measure);document.fonts.ready.then(measure);
document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();});
const sizing=new ResizeObserver(measure);sizing.observe(mount);sizing.observe(section.querySelector('.equipment-copy'));
new IntersectionObserver(entries=>{
 visible=entries[0].isIntersecting;
 if(visible){init();last=0;wake();}else{cancelAnimationFrame(frame);frame=0;}
},{rootMargin:'250px'}).observe(section);
reduced.addEventListener('change',()=>{manual=null;if(reduced.matches){fallback();window.dispatchEvent(new Event('resize'));}else if(renderer&&!lost)activate();else if(visible)init();});
if(reduced.matches)fallback();
