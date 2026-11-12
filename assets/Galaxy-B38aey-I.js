import{n as e,r as t,t as n}from"./index-blYUDwJ5.js";var r=t(e(),1),i=n(),a=8,o=4,s=2.2,c=`#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`,l=`#version 300 es
precision highp float;
precision highp int;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uGloss;
uniform float uDepth;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uStarGlow;
uniform float uFlareGain;
uniform float uSquash;
uniform float uSaturation;
uniform float uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationAngle;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform int uLayers;
uniform vec3 uColors[${o}];
uniform int uColorCount;
uniform float uWarp;
uniform float uReveal;
uniform float uMode;
uniform vec3 uBackground;
uniform float uOpacity;
out vec4 outColor;

#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float tri(float x) {
  return abs(fract(x) * 2.0 - 1.0);
}

float tris(float x) {
  float t = fract(x);
  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}

float trisn(float x) {
  float t = fract(x);
  return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float Star(vec2 uv, float flare, vec2 radial, float invReach) {
#ifdef WARP
  float along = dot(uv, radial);
  float d = sqrt(max(dot(uv, uv) - uSquash * along * along, 0.0));
#else
  float d = length(uv);
#endif
  float m = uStarGlow / d;
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare * uFlareGain;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * 0.3 * flare * uFlareGain;
  m *= smoothstep(1.0, 0.2, d * invReach);
#ifdef WARP
  m *= mix(1.0, smoothstep(1.0, 0.55, length(uv) * invReach), min(uWarp * 4.0, 1.0));
#endif
  return m;
}

vec3 StarLayer(vec2 uv, vec2 radial, vec2 repelAt, float pushCells, float spread) {
  vec3 col = vec3(0.0);
  vec2 gv = fract(uv) - 0.5;
  vec2 id = floor(uv);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 si = id + offset;
      float seed = Hash21(si);
      float size = fract(seed * 345.32);
      float glossLocal = tri(uGloss / (PERIOD * seed + 1.0));
      float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;

#ifdef PALETTE
      float pick = Hash21(si + 7.0) * float(uColorCount);
      vec3 base = uColors[int(min(floor(pick), float(uColorCount - 1)))];
#else
      float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;
      float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;
      float grn = min(red, blu) * seed;
      vec3 base = vec3(red, grn, blu);
      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;
      hue = fract(hue + uHueShift / 360.0);
      float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;
      float val = max(max(base.r, base.g), base.b);
      base = hsv2rgb(vec3(hue, sat, val));
#endif

      vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5;
      vec2 shift = vec2(0.0);
      float invReach = 1.0;
#ifdef REPEL
      vec2 away = si + 0.5 + pad - repelAt;
      float dist = length(away);
      float q = dist * spread;
      float cells = pushCells * exp(-q * q);
      float moved = cells * inversesqrt(1.0 + cells * cells * 2.78);
      shift = away * (moved / max(dist, 0.0001));
      invReach = 1.0 / (1.0 - moved);
#endif
      float star = Star(gv - offset - pad - shift, flareSize, radial, invReach);
      float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
      twinkle = mix(1.0, twinkle, uTwinkleIntensity);
      col += star * twinkle * size * base;
    }
  }
  return col;
}

void main() {
  vec2 focalPx = uFocal * uResolution;
  vec2 uv = (gl_FragCoord.xy - focalPx) / uResolution.y;
  vec2 mouseNorm = uMouse - vec2(0.5);

  vec2 repelAt = vec2(0.0);
  float strength = 0.0;
  float push = 0.0;
  if (uAutoCenterRepulsion > 0.0) {
    strength = uAutoCenterRepulsion;
    push = strength * 0.05;
  } else if (uMouseRepulsion > 0.5) {
    repelAt = (uMouse * uResolution - focalPx) / uResolution.y;
    strength = max(uRepulsionStrength, 0.0);
    push = strength * 0.05 * uMouseActiveFactor;
  } else {
    uv += mouseNorm * 0.1 * uMouseActiveFactor;
  }
  float radius = 0.16 + 0.04 * strength;

  vec2 radial = length(uv) > 0.0001 ? normalize(uv) : vec2(1.0, 0.0);
  float angle = uRotationAngle;
  uv = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * uv;
  uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;
  radial = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * radial;
  radial = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * radial;
  repelAt = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * repelAt;
  repelAt = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * repelAt;

  vec3 col = vec3(0.0);
  float layers = float(uLayers);
  for (int k = 0; k < ${a}; k++) {
    if (k >= uLayers) break;
    float i = float(k) / layers;
    float depth = fract(i + uDepth);
    float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
    float fade = depth * smoothstep(1.0, 0.9, depth);
    vec2 offset = vec2(i * 453.32);
    col += StarLayer(uv * scale + offset, radial, repelAt * scale + offset, push * scale, 1.0 / (scale * radius)) * fade;
  }
  col *= uReveal;

  if (uMode > 1.5) {
    vec3 lit = col * smoothstep(0.0, 0.3, length(col));
    float energy = max(max(lit.r, lit.g), lit.b);
    vec3 tint = lit / max(energy, 0.0001);
    vec3 ink = tint * (0.16 / max(dot(tint, vec3(0.2126, 0.7152, 0.0722)), 0.16));
    float coverage = pow(min(energy * 1.3, 1.0), 1.3) * 0.92 * uOpacity;
    outColor = uMode > 2.5 ? vec4(ink * coverage, coverage) : vec4(mix(uBackground, ink, coverage), 1.0);
  } else if (uMode > 0.5) {
    float alpha = min(smoothstep(0.0, 0.3, length(col)), 1.0) * uOpacity;
    outColor = vec4(col * alpha, alpha);
  } else {
    outColor = vec4(mix(uBackground, col, uOpacity), 1.0);
  }
}`,u=(e,t,n)=>Math.min(n,Math.max(t,e)),d=(e,t,n)=>(e?4:0)+(t?2:0)+ +!!n,f=(e,t,n,r)=>{let i=`${t?`#define PALETTE
`:``}${n?`#define REPEL
`:``}${r?`#define WARP
`:``}`,a=e.createProgram(),o=e.createShader(e.VERTEX_SHADER),s=e.createShader(e.FRAGMENT_SHADER);return!a||!o||!s?null:(e.shaderSource(o,c),e.shaderSource(s,l.replace(`
`,`\n${i}`)),e.compileShader(o),e.compileShader(s),e.attachShader(a,o),e.attachShader(a,s),e.bindAttribLocation(a,0,`aPosition`),e.linkProgram(a),e.deleteShader(o),e.deleteShader(s),a)},p=(e,t)=>{if(!e.getProgramParameter(t,e.LINK_STATUS))return null;let n={},r=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let i=0;i<r;i++){let r=e.getActiveUniform(t,i);r&&(n[r.name.replace(`[0]`,``)]=e.getUniformLocation(t,r.name))}return{program:t,uniforms:n}},m=({focal:e=[.5,.5],rotation:t=[1,0],starSpeed:n=.5,density:c=1,hueShift:l=140,disableAnimation:m=!1,speed:h=1,mouseInteraction:g=!0,glowIntensity:_=.3,saturation:v=0,mouseRepulsion:y=!0,repulsionStrength:b=2,twinkleIntensity:x=.3,rotationSpeed:S=.1,autoCenterRepulsion:C=0,transparent:w=!0,lightMode:T=!1,starColors:E,starSize:D=1,flareIntensity:O=1,layers:k=4,direction:A=`forward`,clickWarp:j=!0,intro:M=!0,backgroundColor:N,opacity:P=1,dpr:F,className:I=``,style:L,...R})=>{let z=(0,r.useRef)(null),B=(0,r.useRef)(null),V=(0,r.useRef)(null),H=Array.isArray(E)?E.filter(Boolean).slice(0,o):[],U={focal:Array.isArray(e)?e:[.5,.5],rotation:Array.isArray(t)?t:[1,0],starSpeed:n,density:Math.max(.01,c),hueShift:l,disableAnimation:m,speed:h,mouseInteraction:g,glowIntensity:Math.max(0,_),saturation:Math.max(0,v),mouseRepulsion:y,repulsionStrength:b,twinkleIntensity:u(x,0,1),rotationSpeed:S,autoCenterRepulsion:Math.max(0,C),transparent:w,lightMode:T,palette:H,starSize:Math.max(0,D),flareIntensity:Math.max(0,O),layers:u(Math.round(k),2,a),reverse:A===`backward`,clickWarp:j,intro:M,backgroundColor:N,opacity:u(P,0,1),dpr:F},W=(0,r.useRef)(U);return W.current=U,(0,r.useEffect)(()=>{let e=z.current,t=B.current,n=t?.getContext(`webgl2`,{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1});if(!e||!t||!n)return;let r=n.getExtension(`KHR_parallel_shader_compile`),i=new Map,a=(e,t,r)=>{let a=d(e,t,r),o=i.get(a);return o||(o={program:f(n,e,t,r),linked:null,done:!1},i.set(a,o)),o},o=(e,t,i,o)=>{let s=a(e,t,i);if(!s.done&&s.program){if(!o&&r&&!n.getProgramParameter(s.program,r.COMPLETION_STATUS_KHR))return null;s.linked=p(n,s.program),s.done=!0}return s.linked},c=W.current;if(!o(c.palette.length>0,!1,!1,!0)){i.forEach(e=>e.program&&n.deleteProgram(e.program));return}let l=n.createBuffer(),m=n.createVertexArray();n.bindVertexArray(m),n.bindBuffer(n.ARRAY_BUFFER,l),n.bufferData(n.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),n.STATIC_DRAW),n.enableVertexAttribArray(0),n.vertexAttribPointer(0,2,n.FLOAT,!1,0,0);let h=document.createElement(`canvas`).getContext(`2d`,{willReadFrequently:!0}),g=window.matchMedia?.(`(prefers-reduced-motion: reduce)`).matches??!1,_=new Map,v=(e,t)=>{if(!e)return t;let n=String(e);if(_.has(n))return _.get(n);let r=t;if(h){h.clearRect(0,0,1,1),h.fillStyle=`#000000`,h.fillStyle=n,h.fillRect(0,0,1,1);let[e,t,i]=h.getImageData(0,0,1,1).data;r=[e/255,t/255,i/255]}return _.set(n,r),r},y=new Float32Array(12),b={x:.5,y:.5,inside:!1},x={time:0,gloss:0,depth:0,angle:0,mx:.5,my:.5,active:0,boost:0,reveal:W.current.intro&&!g?0:1},S=0,C=0,w=!0,T=()=>{let e=W.current;e.palette.forEach((e,t)=>y.set(v(e,[1,1,1]),t*3));let r=e.lightMode?e.transparent?3:2:+!!e.transparent,i=v(e.backgroundColor,e.lightMode?[1,1,1]:[0,0,0]),a=x.reveal,s=e.palette.length>0,c=e.autoCenterRepulsion>0||e.mouseRepulsion&&e.repulsionStrength>0&&x.active>0,l=x.boost>0,u=o(s,!1,!1,!0);if(!u)return;let d=(c||l?o(s,c,l,!1):null)??u,f=d.uniforms;n.viewport(0,0,t.width,t.height),n.useProgram(d.program),n.bindVertexArray(m),n.uniform1f(f.uTime,x.time),n.uniform2f(f.uResolution,t.width,t.height),n.uniform2f(f.uFocal,e.focal[0],e.focal[1]),n.uniform2f(f.uRotation,e.rotation[0],e.rotation[1]),n.uniform1f(f.uGloss,x.gloss),n.uniform1f(f.uDepth,x.depth),n.uniform1f(f.uDensity,e.density),n.uniform1f(f.uHueShift,e.hueShift),n.uniform1f(f.uSpeed,e.speed),n.uniform2f(f.uMouse,x.mx,x.my);let p=1+x.boost*5;n.uniform1f(f.uStarGlow,.05*e.glowIntensity*e.starSize/p**.6),n.uniform1f(f.uFlareGain,e.glowIntensity*e.flareIntensity),n.uniform1f(f.uSquash,1-1/(p*p)),n.uniform1f(f.uSaturation,e.saturation),n.uniform1f(f.uMouseRepulsion,+!!e.mouseRepulsion),n.uniform1f(f.uTwinkleIntensity,e.twinkleIntensity),n.uniform1f(f.uRotationAngle,x.angle),n.uniform1f(f.uRepulsionStrength,e.repulsionStrength),n.uniform1f(f.uMouseActiveFactor,x.active),n.uniform1f(f.uAutoCenterRepulsion,e.autoCenterRepulsion),n.uniform1i(f.uLayers,e.layers),n.uniform3fv(f.uColors,y),n.uniform1i(f.uColorCount,e.palette.length),n.uniform1f(f.uWarp,x.boost);let h=Math.min(1,a/.35);n.uniform1f(f.uReveal,h*h*(3-2*h)),n.uniform1f(f.uMode,r),n.uniform3fv(f.uBackground,i),n.uniform1f(f.uOpacity,e.opacity),n.drawArrays(n.TRIANGLES,0,3)},E=e=>{if(S=0,!w||document.hidden)return;let t=W.current,n=C?u((e-C)/1e3,5e-4,.05):1/60;C=e;let r=t.disableAnimation||g?0:1;t.intro&&!g&&x.reveal<1?(x.reveal=Math.min(1,x.reveal+n/s),x.boost=Math.max(x.boost,(1-x.reveal)**2*1.4)):(!t.intro||g)&&(x.reveal=1);let i=t.starSpeed/10*(t.reverse?-1:1);x.time+=n*r,x.gloss+=n*i*r,x.depth+=n*i*t.speed*r*(1+x.boost*14),x.angle+=n*t.rotationSpeed*r,x.boost*=Math.exp(-n*1.3),x.boost<.001&&(x.boost=0);let a=1-Math.exp(-n/.325),o=t.mouseInteraction&&b.inside&&!g;o&&(x.mx+=(b.x-x.mx)*a,x.my+=(b.y-x.my)*a);let c=+!!o;x.active+=(c-x.active)*a,Math.abs(c-x.active)<.001&&(x.active=c),T(),r>0||x.boost>0||x.active!==c||x.reveal<1?S=requestAnimationFrame(E):C=0},D=()=>{!S&&w&&!document.hidden&&(S=requestAnimationFrame(E))},O=()=>{let n=W.current,r=Math.max(1,e.clientWidth),i=Math.max(1,e.clientHeight),a=Math.min(n.dpr||window.devicePixelRatio||1,2);t.width=Math.max(1,Math.round(r*a)),t.height=Math.max(1,Math.round(i*a)),T(),D()},k=t=>{let n=e.getBoundingClientRect(),r=t.clientX-n.left,i=t.clientY-n.top;b.inside=r>=0&&i>=0&&r<=n.width&&i<=n.height,b.x=r/Math.max(1,n.width),b.y=1-i/Math.max(1,n.height)},A=e=>{k(e),D()},j=e=>{let t=W.current;k(e),b.inside&&t.clickWarp&&!g&&(x.boost=Math.min(1.6,x.boost+1),D())},M=e=>{e.pointerType!==`mouse`&&(b.inside=!1)},N=()=>{b.inside=!1},P=()=>{C=0,D()},F=new ResizeObserver(O);F.observe(e);let I=new IntersectionObserver(e=>{w=e.some(e=>e.isIntersecting),w&&(C=0,D())});I.observe(e),window.addEventListener(`pointermove`,A,{passive:!0}),window.addEventListener(`pointerdown`,j,{passive:!0}),window.addEventListener(`pointerup`,M,{passive:!0}),window.addEventListener(`pointercancel`,M,{passive:!0}),document.documentElement.addEventListener(`pointerleave`,N),document.addEventListener(`visibilitychange`,P),O();let L=c.autoCenterRepulsion>0||c.mouseInteraction&&c.mouseRepulsion,R=c.palette.length>0;(c.clickWarp||c.intro)&&a(R,!1,!0),L&&a(R,!0,!1),L&&c.clickWarp&&a(R,!0,!0);let H=W.current.dpr;return V.current=()=>{let e=W.current;e.dpr===H?(S||T(),D()):(H=e.dpr,O())},()=>{cancelAnimationFrame(S),V.current=null,F.disconnect(),I.disconnect(),window.removeEventListener(`pointermove`,A),window.removeEventListener(`pointerdown`,j),window.removeEventListener(`pointerup`,M),window.removeEventListener(`pointercancel`,M),document.documentElement.removeEventListener(`pointerleave`,N),document.removeEventListener(`visibilitychange`,P),i.forEach(e=>e.program&&n.deleteProgram(e.program)),n.deleteBuffer(l),n.deleteVertexArray(m),n.getExtension(`WEBGL_lose_context`)?.loseContext()}},[]),(0,r.useEffect)(()=>{V.current?.()}),(0,i.jsx)(`div`,{ref:z,className:`galaxy-container${I?` ${I}`:``}`,style:L,...R,children:(0,i.jsx)(`canvas`,{ref:B,className:`galaxy-canvas`,"aria-hidden":`true`})})};export{m as default};