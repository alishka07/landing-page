import * as THREE from './assets/vendor/three.module.min.js';
import { Water } from './assets/vendor/Water.js';
import { RoomEnvironment } from './assets/vendor/RoomEnvironment.js';
import { createVessel } from './vessel-model.js';

const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,value));
const smooth=(a,b,value)=>{const p=clamp((value-a)/(b-a));return p*p*(3-2*p);};
const hero=document.querySelector('.hero-story');
const heroMount=document.querySelector('.hero-scene');
const heroFrame=document.querySelector('.hero-viewport');
const product=document.querySelector('.product-intro');
const productMount=document.querySelector('.product-scene');
const productStage=document.querySelector('.product-stage');
const productCopy=document.querySelector('.product-intro-copy');
const assemblyLabelContainer=document.querySelector('.assembly-labels');
const mission=document.querySelector('.mission-scene');
const oceanCards=[...document.querySelectorAll('.ocean-card')];
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
 renderer.toneMappingExposure=1.08;
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
 scene.environmentIntensity=.82;
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
 const fleet=new THREE.Group();scene.add(fleet);
 for(const x of [-10,10]){
  const partner=craft.clone();partner.position.set(x,-.015,-4.5);partner.rotation.y=x<0?.23:-.25;partner.traverse(part=>{if(part.isMesh)part.castShadow=false;});fleet.add(partner);
 }
 const sky=new THREE.Mesh(new THREE.SphereGeometry(700,32,20),new THREE.ShaderMaterial({
  side:THREE.BackSide,depthWrite:false,
  uniforms:{topColor:{value:new THREE.Color(0x47708c)},horizonColor:{value:new THREE.Color(0x95a8b4)},bottomColor:{value:new THREE.Color(0x294855)}},
  vertexShader:'varying vec3 vDirection; void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'varying vec3 vDirection;uniform vec3 topColor;uniform vec3 horizonColor;uniform vec3 bottomColor;void main(){float h=normalize(vDirection).y;vec3 col=mix(horizonColor,topColor,smoothstep(0.0,0.28,h));col=mix(col,bottomColor,smoothstep(0.0,0.4,-h));gl_FragColor=vec4(col,1.0);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'
 }));
 // Shader chunk directives must start on their own line.
 sky.material.fragmentShader=sky.material.fragmentShader.replace(';#include',';\n#include');
 scene.add(sky);
 const resolution=128,normalData=new Uint8Array(resolution*resolution*4);
 for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
  const u=x/resolution*Math.PI*2,v=y/resolution*Math.PI*2;
  const nx=.10*Math.sin(u*3+v*2)+.045*Math.cos(v*7-u*2);
  const ny=.12*Math.cos(u*2-v*4)+.035*Math.sin(u*9+v*3);
  const length=Math.sqrt(1+nx*nx+ny*ny),i=(y*resolution+x)*4;
  normalData[i]=(nx/length*.5+.5)*255;normalData[i+1]=(ny/length*.5+.5)*255;normalData[i+2]=(1/length*.5+.5)*255;normalData[i+3]=255;
 }
 const normals=new THREE.DataTexture(normalData,resolution,resolution,THREE.RGBAFormat);
 normals.wrapS=normals.wrapT=THREE.RepeatWrapping;normals.minFilter=normals.magFilter=THREE.LinearFilter;normals.needsUpdate=true;
 const water=new Water(new THREE.PlaneGeometry(1500,1500),{textureWidth:small()?384:768,textureHeight:small()?384:768,waterNormals:normals,sunDirection:new THREE.Vector3(-.4,.75,.3).normalize(),sunColor:0xd7e2e7,waterColor:0x081f2d,distortionScale:1.7,alpha:1});
 water.material.uniforms.hazeColor={value:new THREE.Color(0x95a8b4)};
 water.material.uniforms.pointerRipple={value:new THREE.Vector3(0,0,-100)};
 water.material.fragmentShader=water.material.fragmentShader.replace('uniform vec3 waterColor;','uniform vec3 waterColor; uniform vec3 hazeColor;').replace('vec3 outgoingLight = albedo;','albedo *= mix(vec3(0.25,0.42,0.55),vec3(1.0),smoothstep(8.0,140.0,distance)); vec3 outgoingLight = mix(albedo,hazeColor,smoothstep(55.0,230.0,distance));');
 // Local ripples distort the vessel's reflection as they travel away from the hull.
 water.material.fragmentShader=water.material.fragmentShader.replace(
  'vec3 diffuseLight = vec3(0.0);',
  `vec2 ripplePosition=worldPosition.xz*vec2(1.0,0.68);
   float rippleRadius=length(ripplePosition);
   float rippleEnvelope=smoothstep(1.3,2.1,rippleRadius)*exp(-rippleRadius*0.23);
   float ripple=sin(rippleRadius*8.0-time*9.0)*rippleEnvelope;
   surfaceNormal.xz+=normalize(ripplePosition+vec2(0.0001))*ripple*0.11;
   surfaceNormal=normalize(surfaceNormal);
   vec3 diffuseLight=vec3(0.0);`
 );
 water.material.fragmentShader=water.material.fragmentShader.replace('uniform vec3 hazeColor;','uniform vec3 hazeColor; uniform vec3 pointerRipple;').replace(
  'surfaceNormal=normalize(surfaceNormal);',
  `vec2 pointerDelta=worldPosition.xz-pointerRipple.xy;
   float pointerRadius=length(pointerDelta);
   float pulseAge=max(0.0,time-pointerRipple.z);
   float pulse=sin(pointerRadius*11.0-pulseAge*17.0)*exp(-abs(pointerRadius-pulseAge*3.0)*2.0)*exp(-pulseAge*.9);
   surfaceNormal.xz+=normalize(pointerDelta+vec2(.0001))*pulse*.13;
   surfaceNormal=normalize(surfaceNormal);`
 );
 water.rotation.x=-Math.PI/2;water.material.uniforms.size.value=2.4;scene.add(water);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x536450,opacity:.16}));
 ground.rotation.x=-Math.PI/2;ground.position.y=-.42;ground.receiveShadow=true;ground.visible=false;scene.add(ground);

 const curve=new THREE.CatmullRomCurve3([
  new THREE.Vector3(8.5,4.2,14.8),new THREE.Vector3(1.5,3.5,12.3),
  new THREE.Vector3(-5.8,3.2,9),new THREE.Vector3(-1.8,2.9,6.4),
  new THREE.Vector3(.2,2.65,3.1),new THREE.Vector3(.15,3.5,1.6)
 ]);
 const lookCurve=new THREE.CatmullRomCurve3([
  new THREE.Vector3(0,2.5,0),new THREE.Vector3(0,1.7,0),
  new THREE.Vector3(0,1.4,0),new THREE.Vector3(0,1.1,-.4),
  new THREE.Vector3(0,1.2,-1.25),new THREE.Vector3(0,1,-1.8)
 ]);
 const cameraTarget=new THREE.Vector3(),lookTarget=new THREE.Vector3(),upAxis=new THREE.Vector3(0,1,0);
 let mode='',mount=null,paused=false,lost=false,frameId=0,last=0,elapsed=0,heroProgress=0,productProgress=0;
 let inspectionUntil=-4,autoOrbit=0;
 let assemblyTarget=0,assembly=0,spinVelocity=0,productEnteredAt=0;
 let desiredHero=0,desiredProduct=0,pointerX=0,pointerY=0,smoothedX=0,smoothedY=0,orbitYaw=0,desiredYaw=0,orbitPitch=0,dragging=false,pointerStart=null;
 let heroOffset=0,heroDistance=1,heroHeight=1,productOffset=0,productDistance=1,productHeight=1,missionOffset=0,missionHeight=1,viewportHeight=innerHeight,mountWidth=1,mountHeight=1;
 const activeSections=new Set();
 const intersection=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)activeSections.add(entry.target);else activeSections.delete(entry.target);}wake();},{rootMargin:'80px'});
 intersection.observe(hero);intersection.observe(product);intersection.observe(mission);
 const resize=new ResizeObserver(()=>{if(mount)resizeRenderer();});resize.observe(heroMount);resize.observe(productMount);
 function resizeRenderer(){
  const width=mount.clientWidth,height=mount.clientHeight;if(!width||!height)return;
  mountWidth=width;mountHeight=height;
  renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
 }
 function measure(){
  viewportHeight=innerHeight;heroOffset=hero.getBoundingClientRect().top+scrollY;heroHeight=hero.offsetHeight;heroDistance=Math.max(1,heroHeight-heroFrame.offsetHeight);
  productOffset=product.getBoundingClientRect().top+scrollY;productHeight=product.offsetHeight;productDistance=Math.max(1,productHeight-productStage.offsetHeight);
  missionOffset=mission.getBoundingClientRect().top+scrollY;missionHeight=mission.offsetHeight;
  if(mount)resizeRenderer();syncScroll();
 }
 function syncScroll(){
  desiredHero=clamp((scrollY-heroOffset)/heroDistance);desiredProduct=clamp((scrollY-productOffset)/productDistance);wake();
 }
 function setMode(next){
  if(mode===next)return;
  if(mount)mount.classList.remove('is-live');mode=next;
  mount=mode==='hero'?heroMount:productMount;mount.appendChild(renderer.domElement);resizeRenderer();
  const ocean=mode==='hero';water.visible=sky.visible=fleet.visible=ocean;ground.visible=!ocean;
  sun.castShadow=true;scene.environmentIntensity=ocean?.7:.95;hemi.intensity=ocean?1.25:1.4;
  renderer.toneMappingExposure=ocean?1:1.03;craft.position.set(0,0,0);craft.rotation.set(0,0,0);
  if(!ocean)document.querySelector('.orbit-controls').hidden=false;
  if(!ocean)productEnteredAt=elapsed;
  for(const part of Object.values(assemblyParts))part.position.set(0,0,0);
  renderer.domElement.dataset.scene=mode;
 }
 function wake(){if(!frameId&&!document.hidden&&!lost&&!reduced.matches)frameId=requestAnimationFrame(render);}
 function render(timestamp){
  frameId=0;if(document.hidden||lost||reduced.matches)return;
  const frameInterval=1000/(small()?24:30);
  if(last&&timestamp-last<frameInterval-1){frameId=requestAnimationFrame(render);return;}
  const dt=Math.min((timestamp-(last||timestamp))/1000,.05);last=timestamp;if(!paused)elapsed+=dt;
  const easing=1-Math.exp(-dt*8);
  if(!dragging&&Math.abs(spinVelocity)>.003){desiredYaw+=spinVelocity*dt;spinVelocity*=Math.exp(-dt*5.5);}else if(!dragging)spinVelocity=0;
  heroProgress+=(desiredHero-heroProgress)*easing;productProgress+=(desiredProduct-productProgress)*easing;
  assembly+=(assemblyTarget-assembly)*(1-Math.exp(-dt*5));
  smoothedX+=(pointerX-smoothedX)*easing;smoothedY+=(pointerY-smoothedY)*easing;
  orbitYaw+=(desiredYaw-orbitYaw)*easing;
  const idleTurn=Math.sin(elapsed*.19)*.38*smooth(inspectionUntil,inspectionUntil+3,elapsed);
  autoOrbit+=(idleTurn-autoOrbit)*easing;
  const heroVisible=scrollY<heroOffset+heroHeight-80&&scrollY+viewportHeight>heroOffset+80;
  const productVisible=scrollY<productOffset+productHeight-80&&scrollY+viewportHeight>productOffset+80;
  toggle.hidden=!heroVisible&&!productVisible&&!activeSections.has(mission);
  if(heroVisible||productVisible){
   setMode(heroVisible?'hero':'product');
   if(mode==='hero'){
    fleet.visible=!small();
    const p=heroProgress,entrance=1-smooth(0,2.2,elapsed);
    curve.getPointAt(p,cameraTarget);lookCurve.getPoint(p,lookTarget);
    const mobileDistance=small()?1.44:1;
    cameraTarget.x*=mobileDistance;cameraTarget.z*=mobileDistance;
    const idleAngle=Math.sin(elapsed*.24)*.21*(1-smooth(.05,.35,p));
    cameraTarget.applyAxisAngle(upAxis,idleAngle);
    cameraTarget.x+=smoothedX*.45*(1-p);cameraTarget.y+=smoothedY*.16+entrance*.4;cameraTarget.z+=entrance*2;
    camera.position.copy(cameraTarget);camera.lookAt(lookTarget);
    craft.position.y=Math.sin(elapsed*.82)*.045;craft.rotation.z=Math.sin(elapsed*.63)*.014;craft.rotation.x=Math.sin(elapsed*.7+.5)*.011;
    fleet.children.forEach((boat,i)=>{boat.position.y=Math.sin(elapsed*.75+i)*.035;boat.rotation.z=Math.sin(elapsed*.6+i)*.008;});
    water.material.uniforms.time.value=elapsed*.45;
    oceanCards.forEach((card,i)=>{
     const enter=.29+i*.13,leave=enter+.21,appear=smooth(enter,enter+.09,p),disappear=smooth(leave,leave+.12,p);
     card.style.opacity=String(appear*(1-disappear));
     card.style.transform=`translate3d(${(1-appear)*(i%2?-90:90)}px,${(1-appear)*100-disappear*160}px,${appear*20-disappear*250}px) rotateY(${(1-appear)*(i%2?-16:16)}deg)`;
    });
   }else{
    const p=productProgress,angle=.62-p*2.65+orbitYaw+autoOrbit;
    const arrival=1-smooth(0,1.45,elapsed-productEnteredAt);
    const spread=Math.max(assembly,arrival*.2);
    assemblyParts.port.position.set(-spread*1.15,-spread*.1,0);
    assemblyParts.starboard.position.set(spread*1.15,-spread*.1,0);
    assemblyParts.deck.position.set(0,spread*.65,0);
    assemblyParts.modules.position.set(0,spread*1.85,0);
    const distance=(small()?20.5:12.1)+spread*3.5;
    camera.position.set(Math.sin(angle)*distance,4.4+orbitPitch+spread*1.8,Math.cos(angle)*distance);
    camera.lookAt(0,THREE.MathUtils.lerp(2.2-smooth(.22,.65,p)*1.05,2.35,spread),0);
    craft.position.y=.06+Math.sin(elapsed*.7)*.015;craft.rotation.set(0,0,0);
    productStage.style.setProperty('--orbit-progress',String(p));
    const titleExit=Math.max(smooth(.18,.55,p),smooth(.05,.6,assembly));
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
   }
   renderer.render(scene,camera);mount.classList.add('is-live');
  }
  if(activeSections.has(mission)){
   const p=clamp((scrollY+viewportHeight-missionOffset)/(missionHeight+viewportHeight));
   mission.querySelector('.mission-landscape').style.transform=`translate3d(0,${(p-.5)*110}px,0) scale(1.04)`;
  }
  const unsettled=Math.abs(desiredHero-heroProgress)>.0001||Math.abs(desiredProduct-productProgress)>.0001||Math.abs(desiredYaw-orbitYaw)>.001||Math.abs(assemblyTarget-assembly)>.001||Math.abs(spinVelocity)>.003;
  if((!paused&&(heroVisible||productVisible))||unsettled)frameId=requestAnimationFrame(render);
 }

 window.addEventListener('scroll',syncScroll,{passive:true});
 window.addEventListener('resize',measure,{passive:true});
 window.addEventListener('load',measure);
 document.fonts.ready.then(measure);
 document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){cancelAnimationFrame(frameId);frameId=0;}else wake();});
 heroFrame.addEventListener('pointermove',event=>{const r=heroFrame.getBoundingClientRect();pointerX=(event.clientX-r.left)/r.width-.5;pointerY=(event.clientY-r.top)/r.height-.5;wake();},{passive:true});
 heroFrame.addEventListener('pointerleave',()=>{pointerX=pointerY=0;},{passive:true});
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),waterPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),waterHit=new THREE.Vector3();
 heroFrame.addEventListener('pointerdown',event=>{
  if(mode!=='hero'||event.target.closest('a,button')||paused)return;
  const rect=heroFrame.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  if(raycaster.ray.intersectPlane(waterPlane,waterHit)&&waterHit.length()<100){water.material.uniforms.pointerRipple.value.set(waterHit.x,waterHit.z,elapsed*.45);wake();}
 });
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
 renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;cancelAnimationFrame(frameId);frameId=0;heroMount.classList.remove('is-live');productMount.classList.remove('is-live');assemblyLabelContainer.style.opacity='0';productCopy.style.opacity='1';productCopy.style.transform='none';toggle.hidden=true;document.querySelector('.orbit-controls').hidden=true;});
 renderer.domElement.addEventListener('webglcontextrestored',()=>{lost=false;toggle.hidden=false;if(mode==='product')document.querySelector('.orbit-controls').hidden=false;wake();});
 reduced.addEventListener('change',()=>{if(reduced.matches){cancelAnimationFrame(frameId);frameId=0;heroMount.classList.remove('is-live');productMount.classList.remove('is-live');}else{last=0;measure();wake();}});
 document.body.classList.add('motion-ready');measure();heroProgress=desiredHero;productProgress=desiredProduct;wake();
}
try{initMotion();}catch(error){console.warn('The animated scene could not start; the illustrated page is available.',error);}
reduced.addEventListener('change',()=>{if(!reduced.matches&&!initialized)initMotion();});
