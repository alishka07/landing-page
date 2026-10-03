import * as THREE from './assets/vendor/three.module.min.js';
import { RoomEnvironment } from './assets/vendor/RoomEnvironment.js';
import { createVessel } from './vessel-model.js';

const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,value));
const smooth=(a,b,value)=>{const p=clamp((value-a)/(b-a));return p*p*(3-2*p);};
const product=document.querySelector('.product-intro');
const productMount=document.querySelector('.product-scene');
const productCopy=document.querySelector('.product-intro-copy');
const assemblyLabelContainer=document.querySelector('.assembly-labels');
const mission=document.querySelector('.mission-scene');
const toggle=document.querySelector('#motionToggle');
const assemblyToggle=document.querySelector('#assemblyToggle');
let initialized=false;

function initMotion(){
 if(initialized||reduced.matches)return;
 initialized=true;
 let renderer;
 try {renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});}
 catch(error){console.warn('3D is unavailable. The illustrated version remains active.');return;}
 const small=()=>innerWidth<761;
 renderer.setPixelRatio(Math.min(devicePixelRatio,small()?1.3:1.6));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.03;
 renderer.setClearColor(0x000000,0);
 renderer.shadowMap.enabled=true;
 renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.domElement.setAttribute('aria-hidden','true');
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(36,1,.08,1500);
 const environment=new RoomEnvironment();
 const pmrem=new THREE.PMREMGenerator(renderer);
 const environmentMap=pmrem.fromScene(environment,.04);
 scene.environment=environmentMap.texture;
 scene.environmentIntensity=.95;
 environment.dispose();pmrem.dispose();
 const hemi=new THREE.HemisphereLight(0xd9e7ec,0x364751,1.4);scene.add(hemi);
 const sun=new THREE.DirectionalLight(0xfff1df,3);sun.position.set(-7,12,7);scene.add(sun);
 sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-4;sun.shadow.camera.right=4;sun.shadow.camera.top=4;sun.shadow.camera.bottom=-4;sun.shadow.camera.near=1;sun.shadow.camera.far=32;sun.shadow.bias=-.00025;sun.shadow.normalBias=.015;
 const rim=new THREE.DirectionalLight(0xb0ced9,1.15);rim.position.set(6,4,-7);scene.add(rim);
 const craft=createVessel();scene.add(craft);
 const assemblyParts=Object.fromEntries(['port','starboard','deck','modules'].map(name=>[name,craft.getObjectByName(name)]));
 const assemblyLabels=[...document.querySelectorAll('.assembly-label')];
 const labelAnchors={port:new THREE.Vector3(-1.1,.5,.9),deck:new THREE.Vector3(.65,.9,.95),modules:new THREE.Vector3(.2,2.6,-.3)};
 const projectedLabel=new THREE.Vector3();
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x536450,opacity:.16}));
 ground.rotation.x=-Math.PI/2;ground.position.y=-.42;ground.receiveShadow=true;scene.add(ground);
 productMount.appendChild(renderer.domElement);renderer.domElement.dataset.scene='product';
 document.querySelector('.orbit-controls').hidden=false;
 let paused=false,lost=false,frameId=0,last=0,elapsed=0;
 let inspectionUntil=-4,autoOrbit=0,assemblyTarget=0,assembly=0,spinVelocity=0,productEnteredAt=0;
 let orbitYaw=0,desiredYaw=0,orbitPitch=0,dragging=false,pointerStart=null;
 let productOffset=0,productHeight=1,missionOffset=0,missionHeight=1,viewportHeight=innerHeight,mountWidth=1,mountHeight=1;
 const activeSections=new Set();
 const intersection=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)activeSections.add(entry.target);else activeSections.delete(entry.target);}wake();},{rootMargin:'80px'});
 intersection.observe(product);intersection.observe(mission);
 const resize=new ResizeObserver(()=>{resizeRenderer();wake();});resize.observe(productMount);
 function resizeRenderer(){
  const width=productMount.clientWidth,height=productMount.clientHeight;if(!width||!height)return;
  mountWidth=width;mountHeight=height;
  renderer.setPixelRatio(Math.min(devicePixelRatio,small()?1.3:1.6));
  renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
 }
 function measure(){
  viewportHeight=innerHeight;productOffset=product.getBoundingClientRect().top+scrollY;productHeight=product.offsetHeight;
  missionOffset=mission.getBoundingClientRect().top+scrollY;missionHeight=mission.offsetHeight;
  resizeRenderer();wake();
 }
 function wake(){if(!frameId&&!document.hidden&&!lost&&!reduced.matches)frameId=requestAnimationFrame(render);}
 function render(timestamp){
  frameId=0;if(document.hidden||lost||reduced.matches)return;
  const frameInterval=1000/(small()?24:30);
  if(last&&timestamp-last<frameInterval-1){frameId=requestAnimationFrame(render);return;}
  const dt=Math.min((timestamp-(last||timestamp))/1000,.05);last=timestamp;if(!paused)elapsed+=dt;
  const easing=1-Math.exp(-dt*8);
  if(!dragging&&Math.abs(spinVelocity)>.003){desiredYaw+=spinVelocity*dt;spinVelocity*=Math.exp(-dt*5.5);}else if(!dragging)spinVelocity=0;
  assembly+=(assemblyTarget-assembly)*(1-Math.exp(-dt*5));orbitYaw+=(desiredYaw-orbitYaw)*easing;
  const idleTurn=Math.sin(elapsed*.19)*.38*smooth(inspectionUntil,inspectionUntil+3,elapsed);
  autoOrbit+=(idleTurn-autoOrbit)*easing;
  const productVisible=scrollY<productOffset+productHeight-80&&scrollY+viewportHeight>productOffset+80;
  toggle.hidden=!productVisible&&!activeSections.has(mission);
  if(productVisible){
   const angle=.62+orbitYaw+autoOrbit;
   const arrival=1-smooth(0,1.45,elapsed-productEnteredAt),spread=Math.max(assembly,arrival*.2);
   assemblyParts.port.position.set(-spread*1.15,-spread*.1,0);
   assemblyParts.starboard.position.set(spread*1.15,-spread*.1,0);
   assemblyParts.deck.position.set(0,spread*.65,0);
   assemblyParts.modules.position.set(0,spread*1.85,0);
   const distance=(small()?20.5:12.1)+spread*3.5;
   camera.position.set(Math.sin(angle)*distance,4.4+orbitPitch+spread*1.8,Math.cos(angle)*distance);
   camera.lookAt(0,THREE.MathUtils.lerp(2.2,2.35,spread),0);
   craft.position.y=.06+Math.sin(elapsed*.7)*.015;craft.rotation.set(0,0,0);
   const titleExit=smooth(.05,.6,assembly);
   productCopy.style.opacity=String(1-titleExit);productCopy.style.transform=`translateY(${-titleExit*80}px)`;
   assemblyLabelContainer.style.opacity=String(smooth(.4,.85,assembly));
   camera.updateMatrixWorld();craft.updateMatrixWorld(true);
   for(const label of assemblyLabels){
    const name=label.dataset.assemblyPart;
    projectedLabel.copy(labelAnchors[name]).add(assemblyParts[name].position).applyMatrix4(craft.matrixWorld).project(camera);
    const x=clamp((projectedLabel.x*.5+.5)*mountWidth,65,mountWidth-75);
    const y=clamp((-projectedLabel.y*.5+.5)*mountHeight-25,95,mountHeight-140);
    label.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%)`;
   }
   renderer.render(scene,camera);productMount.classList.add('is-live');
  }
  if(activeSections.has(mission)){
   const p=clamp((scrollY+viewportHeight-missionOffset)/(missionHeight+viewportHeight));
   mission.querySelector('.mission-landscape').style.transform=`translate3d(0,${(p-.5)*110}px,0) scale(1.04)`;
  }
  const unsettled=Math.abs(desiredYaw-orbitYaw)>.001||Math.abs(assemblyTarget-assembly)>.001||Math.abs(spinVelocity)>.003;
  if((!paused&&productVisible)||unsettled)frameId=requestAnimationFrame(render);
 }
 window.addEventListener('scroll',wake,{passive:true});
 window.addEventListener('resize',measure,{passive:true});
 window.addEventListener('load',measure);document.fonts.ready.then(measure);
 document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){cancelAnimationFrame(frameId);frameId=0;}else wake();});
 function holdInspection(){desiredYaw+=autoOrbit;orbitYaw+=autoOrbit;autoOrbit=0;inspectionUntil=elapsed+12;spinVelocity=0;}
 productMount.addEventListener('pointerdown',event=>{holdInspection();pointerStart={id:event.pointerId,x:event.clientX,y:event.clientY,yaw:desiredYaw,pitch:orbitPitch,lastX:event.clientX,lastTime:event.timeStamp};});
 productMount.addEventListener('pointermove',event=>{
  if(!pointerStart||event.pointerId!==pointerStart.id)return;
  const dx=event.clientX-pointerStart.x,dy=event.clientY-pointerStart.y;
  if(!dragging&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)){dragging=true;productMount.setPointerCapture(event.pointerId);productMount.classList.add('is-dragging');}
  if(dragging){
   const deltaSeconds=Math.max(.008,(event.timeStamp-pointerStart.lastTime)/1000);
   spinVelocity=clamp(-(event.clientX-pointerStart.lastX)*.008/deltaSeconds,-2.8,2.8);
   pointerStart.lastX=event.clientX;pointerStart.lastTime=event.timeStamp;
   desiredYaw=pointerStart.yaw-dx*.008;orbitPitch=clamp(pointerStart.pitch+dy*.014,-1.1,2.6);wake();
  }
 });
 function release(){dragging=false;pointerStart=null;productMount.classList.remove('is-dragging');}
 productMount.addEventListener('pointerup',event=>{if(pointerStart&&event.timeStamp-pointerStart.lastTime>90)spinVelocity=0;release();wake();});productMount.addEventListener('pointercancel',()=>{spinVelocity=0;release();});
 assemblyToggle.addEventListener('click',()=>{
  holdInspection();assemblyTarget=assemblyTarget?0:1;
  productEnteredAt=elapsed-2;
  assemblyToggle.setAttribute('aria-pressed',String(Boolean(assemblyTarget)));
  assemblyToggle.textContent=assemblyTarget?'Собрать аппарат':'Показать компоновку';
  document.querySelector('#assemblyStatus').textContent=assemblyTarget?'Показаны отдельно корпуса, палуба и бортовые модули.':'Аппарат собран.';
  wake();
 });
 document.querySelectorAll('[data-orbit]').forEach(button=>button.addEventListener('click',()=>{holdInspection();const direction=Number(button.dataset.orbit);if(direction)desiredYaw+=direction*.48;else desiredYaw=orbitPitch=0;wake();}));
 productMount.addEventListener('keydown',event=>{
  if(['ArrowLeft','ArrowRight','Home'].includes(event.key)){event.preventDefault();holdInspection();if(event.key==='Home')desiredYaw=orbitPitch=0;else desiredYaw+=event.key==='ArrowLeft'?-.25:.25;wake();}
 });
 toggle.hidden=false;
 toggle.addEventListener('click',()=>{
  paused=!paused;document.body.classList.toggle('motion-paused',paused);toggle.setAttribute('aria-pressed',String(paused));toggle.setAttribute('aria-label',paused?'Продолжить автоматическую анимацию':'Остановить автоматическую анимацию');toggle.firstElementChild.textContent=paused?'▷':'Ⅱ';toggle.lastElementChild.textContent=paused?'Продолжить':'Пауза';wake();
 });
 renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;cancelAnimationFrame(frameId);frameId=0;productMount.classList.remove('is-live');assemblyLabelContainer.style.opacity='0';productCopy.style.opacity='1';productCopy.style.transform='none';toggle.hidden=true;document.querySelector('.orbit-controls').hidden=true;});
 renderer.domElement.addEventListener('webglcontextrestored',()=>{lost=false;document.querySelector('.orbit-controls').hidden=false;measure();});
 reduced.addEventListener('change',()=>{if(reduced.matches){cancelAnimationFrame(frameId);frameId=0;productMount.classList.remove('is-live');}else{last=0;measure();}});
 document.body.classList.add('motion-ready');measure();
}
try{initMotion();}catch(error){console.warn('The animated scene could not start; the illustrated page is available.',error);}
reduced.addEventListener('change',()=>{if(!reduced.matches&&!initialized)initMotion();});
