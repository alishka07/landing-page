import * as THREE from './assets/vendor/three.module.min.js';

// Artistic concept, not a dimensioned engineering model of the prototype.
export function createVessel() {
 const source=new THREE.Group(),cache=new Map();let assemblyPart='deck';
 const coat=new THREE.MeshPhysicalMaterial({color:0xdfe5e3,metalness:.12,roughness:.36,clearcoat:.24,clearcoatRoughness:.3});
 const rubber=new THREE.MeshStandardMaterial({color:0x121a1e,metalness:.04,roughness:.77});
 const graphite=new THREE.MeshStandardMaterial({color:0x29353b,metalness:.52,roughness:.38});
 const metal=new THREE.MeshStandardMaterial({color:0xa2b2b8,metalness:.9,roughness:.24});
 const solar=new THREE.MeshPhysicalMaterial({color:0x102434,metalness:.45,roughness:.23,clearcoat:.8});
 const glass=new THREE.MeshPhysicalMaterial({color:0x142f38,metalness:.65,roughness:.055,clearcoat:1});
 const indicator=new THREE.MeshStandardMaterial({color:0x9cc6b0,emissive:0x4a9777,emissiveIntensity:.45,roughness:.35});
 // Stable, subtle satin-paint grain; no texture download or screen-space noise.
 coat.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vPaintPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nvPaintPosition=position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vPaintPosition;').replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   float grain=fract(sin(dot(floor(vPaintPosition*720.0),vec3(12.9898,78.233,37.719)))*43758.5453);
   roughnessFactor=clamp(roughnessFactor+(grain-.5)*.045,.18,.8);`);
 };
 coat.customProgramCacheKey=()=>'subulaq-satin-v4';
 function mesh(geometry,material,x=0,y=0,z=0){const part=new THREE.Mesh(geometry,material);part.position.set(x,y,z);part.userData.assemblyPart=assemblyPart;source.add(part);return part;}
 function cached(key,make){if(!cache.has(key))cache.set(key,make());return cache.get(key);}
 function cylinder(r,h,material,x,y,z,segments=24){return mesh(cached(`c:${r}:${h}:${segments}`,()=>new THREE.CylinderGeometry(r,r,h,segments)),material,x,y,z);}
 function torus(r,t,material,x,y,z){return mesh(cached(`t:${r}:${t}`,()=>new THREE.TorusGeometry(r,t,8,32)),material,x,y,z);}
 function beam(a,b,r,material){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const part=cylinder(r,delta.length(),material,0,0,0,12);part.position.copy(start.add(end).multiplyScalar(.5));part.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return part;}
 function roundedOutline(width,length,radius){
  const w=width/2,l=length/2,r=Math.min(radius,w,l),s=new THREE.Shape();
  s.moveTo(-w+r,-l);s.lineTo(w-r,-l);s.quadraticCurveTo(w,-l,w,-l+r);s.lineTo(w,l-r);
  s.quadraticCurveTo(w,l,w-r,l);s.lineTo(-w+r,l);s.quadraticCurveTo(-w,l,-w,l-r);s.lineTo(-w,-l+r);s.quadraticCurveTo(-w,-l,-w+r,-l);return s;
 }
 function hullOutline(width,length){
  const w=width/2,l=length/2,s=new THREE.Shape();s.moveTo(-w*.78,-l);s.lineTo(w*.78,-l);
  s.quadraticCurveTo(w,-l,w,-l*.88);s.lineTo(w,l*.53);s.quadraticCurveTo(w,l*.79,w*.71,l*.96);
  s.quadraticCurveTo(w*.56,l*1.02,w*.36,l*1.02);s.lineTo(-w*.36,l*1.02);
  s.quadraticCurveTo(-w*.56,l*1.02,-w*.71,l*.96);s.quadraticCurveTo(-w,l*.79,-w,l*.53);
  s.lineTo(-w,-l*.88);s.quadraticCurveTo(-w,-l,-w*.78,-l);return s;
 }
 // Narrow shoulder chamfers and separate flat caps prevent inflated highlights.
 function loft(shape,rings){
  const contour=shape.getPoints(8);if(contour[0].distanceTo(contour.at(-1))<.00001)contour.pop();
  const n=contour.length,vertices=[],indices=[];
  for(const [y,sx,sz] of rings)for(const p of contour)vertices.push(p.x*sx,y,p.y*sz);
  for(let k=0;k<rings.length-1;k++)for(let j=0;j<n;j++){const next=(j+1)%n,a=k*n+j,b=a+n,a1=k*n+next,b1=a1+n;indices.push(a,b,a1,a1,b,b1);}
  const triangles=THREE.ShapeUtils.triangulateShape(contour,[]);
  for(const ring of [0,rings.length-1]){
   const base=vertices.length/3,[y,sx,sz]=rings[ring];contour.forEach(p=>vertices.push(p.x*sx,y,p.y*sz));
   for(const face of triangles){let [a,b,c]=face;const p=contour[a],q=contour[b],r=contour[c];const normalY=(q.y-p.y)*(r.x-p.x)-(q.x-p.x)*(r.y-p.y);if((normalY>0)!==(ring>0))[b,c]=[c,b];indices.push(base+a,base+b,base+c);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
 }
 function panel(w,h,d,material,x,y,z,r=.035,bevel=.009){
  const e=Math.min(bevel,h*.3),key=`p:${w}:${h}:${d}:${r}:${e}`;
  const g=cached(key,()=>loft(roundedOutline(w,d,r),[[-h/2,.98,.99],[-h/2+e,1,1],[h/2-e,1,1],[h/2,.98,.99]]));return mesh(g,material,x,y,z);
 }
 function bolt(x,y,z,r=.016){cylinder(r*1.5,.005,graphite,x,y,z,16);cylinder(r,.011,metal,x,y+.006,z,6);panel(r*.9,.002,.003,rubber,x,y+.012,z,.001,.0003);}
 function handle(x,y,z,w=.21){for(const side of [-1,1]){panel(.075,.015,.06,graphite,x+side*w/2,y,z,.014,.002);beam([x+side*w/2,y,z],[x+side*w/2,y+.045,z],.013,metal);}beam([x-w/2,y+.045,z],[x+w/2,y+.045,z],.016,metal);}

 const contour=hullOutline(.91,4.38);
 const lower=loft(contour,[[-.32,.58,.88],[-.25,.78,.94],[-.10,.98,.995],[.13,1,1]]);
 const upper=loft(contour,[[.13,1,1],[.17,1.015,1],[.43,1,.997],[.48,.98,.993],[.58,.79,.95],[.60,.76,.94]]);
 const seam=loft(contour,[[.117,1.006,1.003],[.14,1.006,1.003]]);
 const shoulder=loft(contour,[[.435,1.006,.999],[.446,1.006,.999]]);
 for(const x of [-1.04,1.04]){
  assemblyPart=x<0?'port':'starboard';mesh(lower,rubber,x);mesh(upper,coat,x);mesh(seam,graphite,x);mesh(shoulder,metal,x);
  // Screw-fixed hatches, visible rubber seals and raised stainless handles.
  for(const z of [-.95,.62]){
   panel(.53,.016,1.12,rubber,x,.602,z,.08);panel(.49,.025,1.07,coat,x,.618,z,.07);handle(x,.644,z);
   for(const dx of [-.2,.2])for(const dz of [-.43,.43])bolt(x+dx,.634,z+dz,.013);
   for(const dz of [-.37,.37])panel(.045,.028,.09,metal,x+.25,.632,z+dz,.006);
  }
  const side=Math.sign(x);panel(.023,.13,.37,graphite,x+side*.46,.32,-.94,.03);
  panel(.027,.088,.30,metal,x+side*.474,.32,-.94,.02);
  for(let z=-1.055;z<-.82;z+=.038)panel(.032,.045,.011,rubber,x+side*.49,.32,z,.004);
  handle(x,.57,1.65,.16);torus(.055,.012,metal,x,.34,2.17).rotation.x=Math.PI/2;
  for(const z of [-1.6,-.2,1.26])bolt(x+side*.29,.575,z,.013);
  cylinder(.125,.34,graphite,x,-.105,-2.12).rotation.x=Math.PI/2;
  torus(.145,.027,graphite,x,-.105,-2.31);cylinder(.036,.08,metal,x,-.105,-2.30).rotation.x=Math.PI/2;
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;const blade=panel(.042,.012,.105,metal,x+Math.sin(a)*.066,-.105+Math.cos(a)*.066,-2.315,.015);blade.rotation.set(Math.PI/2,0,-a);}
 }

 assemblyPart='deck';
 for(const z of [-1.17,.91]){
  panel(2.47,.14,.27,graphite,0,.35,z,.035);
  for(const x of [-.67,.67]){panel(.26,.035,.37,metal,x,.44,z,.02);for(const dx of [-.07,.07])bolt(x+dx,.465,z,.019);}
 }
 const center=hullOutline(1.65,3.28);
 mesh(loft(center,[[.31,.85,.9],[.42,1,1],[.60,1,1],[.64,.97,.97]]),graphite);
 mesh(loft(center,[[.625,.986,.985],[.66,.99,.986],[.78,.85,.93],[.81,.82,.90]]),coat);
 panel(1.16,.018,1.2,rubber,0,.812,.69,.04);panel(1.12,.015,1.16,metal,0,.823,.69,.025);
 for(let col=0;col<3;col++)for(let row=0;row<5;row++){
  const x=(col-1)*.353,z=.25+row*.218;panel(.336,.008,.202,solar,x,.835,z,.016,.0015);
  for(const dx of [-.1,0,.1])panel(.0018,.0015,.183,metal,x+dx,.8405,z,.0005,.0003);
 }
 for(const x of [-.57,.57])for(const z of [.13,1.25])bolt(x,.842,z,.014);
 panel(.86,.135,.075,rubber,0,.575,1.63,.025);panel(.69,.075,.082,glass,0,.58,1.67,.015);
 panel(.32,.009,.086,indicator,0,.608,1.674,.004);
 for(const x of [-.39,.39])cylinder(.015,.015,metal,x,.58,1.681,6).rotation.x=Math.PI/2;
 for(const x of [-.76,.76])for(const z of [-1.2,-.8,-.35,.1,.6,1.05])bolt(x,.716,z,.013);
 for(const x of [-.65,.65]){
  beam([x,.81,-1.35],[x,.98,-1.35],.014,metal);beam([x,.98,-1.35],[x,.98,-.4],.017,metal);beam([x,.98,-.4],[x,.82,-.4],.014,metal);
  panel(.08,.015,.08,graphite,x,.816,-1.35,.01);panel(.08,.015,.08,graphite,x,.825,-.4,.01);
 }

 assemblyPart='modules';
 panel(.88,.08,.62,graphite,0,.842,-.66,.04);panel(.83,.023,.57,coat,0,.894,-.66,.035);
 for(const x of [-.25,0,.25]){
  cylinder(.088,.14,coat,x,.976,-.68);cylinder(.09,.018,graphite,x,1.037,-.68);cylinder(.083,.022,metal,x,1.055,-.68);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;beam([x+Math.sin(a)*.086,1.034,-.68+Math.cos(a)*.086],[x+Math.sin(a)*.086,1.065,-.68+Math.cos(a)*.086],.003,rubber);}
 }
 // Flanged camera mast, recessed optical lens and flat scanner cap.
 panel(.34,.045,.34,graphite,0,.829,-.03,.04);cylinder(.14,.065,metal,0,.884,-.03);
 for(const x of [-.12,.12])for(const z of [-.15,.09])bolt(x,.862,z,.018);
 cylinder(.088,.88,coat,0,1.32,-.03,32);cylinder(.098,.032,graphite,0,1.015,-.03);cylinder(.096,.024,metal,0,1.63,-.03);
 for(const y of [1.17,1.49])cylinder(.014,.009,metal,.01,y,.061,6).rotation.x=Math.PI/2;
 panel(.29,.29,.20,coat,0,1.47,.11,.035,.012);panel(.257,.254,.035,rubber,0,1.47,.226,.035,.006);
 cylinder(.092,.06,graphite,0,1.47,.271,40).rotation.x=Math.PI/2;torus(.079,.008,metal,0,1.47,.305);
 cylinder(.071,.012,glass,0,1.47,.308,40).rotation.x=Math.PI/2;torus(.049,.006,graphite,0,1.47,.316);mesh(new THREE.CircleGeometry(.038,32),glass,0,1.47,.318);
 for(const dx of [-.096,.096])for(const dy of [-.093,.093])cylinder(.009,.01,metal,dx,1.47+dy,.25,6).rotation.x=Math.PI/2;
 cylinder(.145,.04,graphite,0,1.78,-.03,40);cylinder(.187,.15,coat,0,1.865,-.03,48);cylinder(.19,.078,glass,0,1.966,-.03,48);
 cylinder(.191,.009,indicator,0,2.002,-.03,48);cylinder(.194,.031,graphite,0,2.024,-.03,48);cylinder(.193,.04,coat,0,2.056,-.03,48);cylinder(.179,.016,coat,0,2.08,-.03,48);
 for(const x of [-.57,.57]){
  const h=x<0?2.57:2.84;cylinder(.074,.055,metal,x,.848,-.96);cylinder(.043,.17,rubber,x,.958,-.96);
  for(let y=.99;y<1.13;y+=.025)cylinder(.029,.008,graphite,x,y,-.96,16);
  mesh(new THREE.CylinderGeometry(.007,.014,h-1.12,12),graphite,x,(h+1.12)/2,-.96);cylinder(.016,.07,rubber,x,h-.035,-.96,16);
 }
 cylinder(.095,.14,graphite,-.34,.92,-1.32);cylinder(.12,.075,coat,-.34,1.024,-1.32,32);cylinder(.122,.015,metal,-.34,1.065,-1.32,32);
 const cable=new THREE.CatmullRomCurve3([new THREE.Vector3(.087,1.67,-.065),new THREE.Vector3(.126,1.3,-.09),new THREE.Vector3(.15,.94,-.16),new THREE.Vector3(.31,.84,-.38)]);
 mesh(new THREE.TubeGeometry(cable,24,.009,6,false),rubber);

 // Hundreds of details batched into one draw call per material per assembly.
 source.updateMatrixWorld(true);const batches=new Map(),geometries=new Set();let detailCount=0;
 source.traverse(part=>{
  if(!part.isMesh)return;detailCount++;geometries.add(part.geometry);const name=part.userData.assemblyPart;
  if(!batches.has(name))batches.set(name,new Map());const materials=batches.get(name);
  if(!materials.has(part.material))materials.set(part.material,{position:[],normal:[]});const batch=materials.get(part.material);
  const g=part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone();g.applyMatrix4(part.matrixWorld);
  for(const v of g.getAttribute('position').array)batch.position.push(v);for(const v of g.getAttribute('normal').array)batch.normal.push(v);g.dispose();
 });
 const vessel=new THREE.Group();
 for(const [name,materials] of batches){const group=new THREE.Group();group.name=name;vessel.add(group);
  for(const [material,attributes] of materials){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(attributes.position,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(attributes.normal,3));g.computeBoundingSphere();const part=new THREE.Mesh(g,material);part.castShadow=part.receiveShadow=true;group.add(part);}
 }
 geometries.forEach(g=>g.dispose());vessel.userData.detailCount=detailCount;return vessel;
}
