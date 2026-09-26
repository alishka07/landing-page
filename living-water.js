import * as THREE from './assets/vendor/three.module.min.js';

// A photographic cinemagraph, not footage of the prototype. Water moves in
// image space; the hull and instruments are protected from displacement.
export function createLivingWater(renderer, invalidate) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const loader = new THREE.TextureLoader();
  const textures = new Map();
  const files = {
    wide: './assets/subulaq-wide-v3.png',
    detail: './assets/subulaq-detail-v3.png',
    portrait: './assets/subulaq-mobile-v3.png',
  };
  const uniforms = {
    photoA: { value: null }, photoB: { value: null },
    viewport: { value: new THREE.Vector2(1, 1) },
    imageAspect: { value: 1.5 }, time: { value: 0 },
    progress: { value: 0 }, blend: { value: 0 }, portrait: { value: 0 },
    pointer: { value: new THREE.Vector2() },
    ripple: { value: new THREE.Vector3(.5, .1, -100) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, depthTest: false, depthWrite: false, toneMapped: false,
    vertexShader: `varying vec2 vUv;
      void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D photoA,photoB;
      uniform vec2 viewport,pointer;
      uniform vec3 ripple;
      uniform float imageAspect,time,progress,blend,portrait;

      vec2 framing(vec2 point){
        float screenAspect=viewport.x/viewport.y;
        vec2 cover=vec2(min(screenAspect/imageAspect,1.0),min(imageAspect/screenAspect,1.0));
        float zoom=1.025+progress*mix(.085,.04,portrait)+sin(time*.19)*.002;
        vec2 drift=vec2(sin(time*.16)*.0015,cos(time*.21)*.001)+pointer*vec2(.005,.003);
        return (point-.5)*cover/zoom+.5+drift;
      }

      float waterMask(vec2 uv,float closeup){
        // Conservative masks keep the entire rigid subject, including its
        // waterline, sharp. Coordinates are measured against the source frames.
        float left=mix(.285,.045,closeup);
        float right=mix(.70,.94,closeup);
        left=mix(left,.23,portrait);right=mix(right,.74,portrait);
        float side=smoothstep(left-.015,left+.025,uv.x)*(1.0-smoothstep(right-.025,right+.015,uv.x));
        float bottom=mix(.18,.205,closeup);
        bottom=mix(bottom,.365,portrait);
        float hull=side*smoothstep(bottom-.03,bottom+.025,uv.y);
        float horizon=mix(.412,.59,closeup);
        horizon=mix(horizon,.548,portrait);
        float water=1.0-smoothstep(horizon-.012,horizon+.012,uv.y);
        return water*(1.0-hull);
      }

      vec3 photograph(sampler2D photo,vec2 uv,float closeup){
        float mask=waterMask(uv,closeup);
        float depth=pow(clamp((.61-uv.y)/.61,0.0,1.0),1.3);
        float t=time;
        vec2 waves=vec2(
          sin(uv.y*103.0+uv.x*17.0-t*1.55)+.38*sin(uv.y*219.0-uv.x*29.0+t*1.13),
          .65*sin(uv.x*62.0+uv.y*48.0-t*1.05)+.28*sin(uv.x*117.0-uv.y*91.0+t*1.65)
        );
        vec2 offset=waves*vec2(.0045,.0033)*depth*mask;
        vec2 delta=(uv-framing(ripple.xy))*vec2(imageAspect,1.0);
        float age=max(0.0,time-ripple.z);
        float radius=length(delta);
        float pulse=sin(radius*160.0-age*10.0)*exp(-pow((radius-age*.065)*32.0,2.0))*exp(-age*.85);
        offset+=normalize(delta+vec2(.00001))*pulse*.003*mask;
        vec3 color=texture2D(photo,uv+offset).rgb;
        // Small changes in the light on wave crests, kept below a few percent.
        float crest=sin(uv.x*163.0+uv.y*271.0-t*1.8)*sin(uv.y*190.0+t*.65);
        color*=1.0+crest*.026*depth*mask;
        return color;
      }

      void main(){
        vec2 uv=framing(vUv);
        vec3 color=photograph(photoA,uv,0.0);
        if(blend>.001)color=mix(color,photograph(photoB,uv,1.0),blend);
        gl_FragColor=vec4(color,1.0);
        #include <colorspace_fragment>
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  function request(name) {
    if (textures.has(name)) return;
    textures.set(name, null);
    loader.load(files[name], texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      textures.set(name, texture);
      invalidate();
    }, undefined, () => {
      console.warn('Photographic animation unavailable; the still image remains visible.');
    });
  }

  return {
    render({ width, height, time, progress, pointerX, pointerY }) {
      const portrait = width / height < .82;
      const primary = portrait ? 'portrait' : 'wide';
      request(primary);
      const texture = textures.get(primary);
      if (!texture) return false;
      if (!portrait && progress > .12) request('detail');
      const detail = textures.get('detail');
      uniforms.photoA.value = texture;
      uniforms.photoB.value = detail || texture;
      uniforms.viewport.value.set(width, height);
      uniforms.imageAspect.value = texture.image.width / texture.image.height;
      uniforms.portrait.value = Number(portrait);
      uniforms.time.value = time;
      uniforms.progress.value = progress;
      uniforms.pointer.value.set(pointerX, pointerY);
      uniforms.blend.value = portrait || !detail ? 0 : THREE.MathUtils.smoothstep(progress, .46, .76);
      renderer.render(scene, camera);
      return true;
    },
    touch(x, y, time) { uniforms.ripple.value.set(x, 1 - y, time); },
  };
}
