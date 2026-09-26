/* Remi — sky shader.
   A single full-bleed fragment shader: soft drifting clouds over a pale sky,
   with a faint light that follows the cursor. Rendered at reduced resolution
   (DPR capped at 1.5, then halved) and throttled to ~30fps. Pauses when the
   tab is hidden or when neither the hero nor the final CTA is on screen.
   Falls back to the CSS gradient on <html> when WebGL is unavailable. */
(function () {
  'use strict';

  var canvas = document.getElementById('sky');
  if (!canvas) return;

  var gl =
    canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, powerPreference: 'low-power' }) ||
    canvas.getContext('experimental-webgl');
  if (!gl) return;

  var VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uScroll;uniform float uCalm;',
    'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    ' return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;mat2 r=mat2(.8,.6,-.6,.8);',
    ' for(int i=0;i<5;i++){v+=a*noise(p);p=r*p*2.03+11.7;a*=.5;}return v;}',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/uRes;',
    ' float asp=uRes.x/uRes.y;',
    ' vec2 p=vec2(uv.x*asp,uv.y);',
    ' vec2 m=uMouse-.5;',
    ' p+=m*vec2(.05,.035);',
    ' p.y+=uScroll;',
    ' float t=uTime;',
    // sky gradient: deeper blue at the top, near-white at the bottom
    ' vec3 top=vec3(.53,.73,.98);vec3 mid=vec3(.76,.87,1.);vec3 low=vec3(.95,.975,1.);',
    ' vec3 col=mix(low,mid,smoothstep(0.,.55,uv.y));col=mix(col,top,smoothstep(.5,1.05,uv.y));',
    // domain-warped fbm clouds, drifting slowly to the right
    ' vec2 q=p*1.35+vec2(t*.010,t*.002);',
    ' vec2 w=vec2(fbm(q+vec2(0.,t*.006)),fbm(q+vec2(5.2,1.3)-t*.005));',
    ' float c=fbm(q*1.15+w*1.5);',
    ' float cloud=smoothstep(.40,.82,c);',
    ' float wisp=smoothstep(.55,.95,fbm(q*3.1+w*2.+vec2(t*.02,0.)))*.35;',
    ' cloud=clamp(cloud+wisp*cloud,0.,1.);',
    ' cloud*=.5+.5*smoothstep(1.1,.15,uv.y);',
    // soft self-shadow on the underside of clouds
    ' float shade=smoothstep(.5,.9,fbm(q*1.15+w*1.5+vec2(0.,.06)));',
    ' vec3 cloudCol=mix(vec3(1.),vec3(.86,.91,.98),clamp(shade-c,0.,1.)*2.);',
    ' col=mix(col,cloudCol,cloud*.92);',
    // cursor light
    ' vec2 d=(uv-uMouse)*vec2(asp,1.);',
    ' col+=vec3(.9,.95,1.)*.07*exp(-dot(d,d)*5.);',
    // calm: fade toward a paler sky in the middle of the page
    ' col=mix(col,vec3(.93,.96,1.),uCalm*.5);',
    ' col+=(hash(gl_FragCoord.xy+fract(t))-.5)/255.;',
    ' gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }
  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, 'uRes');
  var uTime = gl.getUniformLocation(prog, 'uTime');
  var uMouse = gl.getUniformLocation(prog, 'uMouse');
  var uScroll = gl.getUniformLocation(prog, 'uScroll');
  var uCalm = gl.getUniformLocation(prog, 'uCalm');

  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = reduceMQ.matches;
  var mouse = { x: 0.5, y: 0.7, tx: 0.5, ty: 0.7 };
  var time = 18;
  var last = 0;
  var live = true;
  var visibleSections = 0;
  var raf = 0;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var scale = dpr * 0.5;
    var w = Math.max(1, Math.round(window.innerWidth * scale));
    var h = Math.max(1, Math.round(window.innerHeight * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    draw();
  }

  function smooth(a, b, x) {
    var t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  function draw() {
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var prog = window.scrollY / max;
    var calm = smooth(0.06, 0.24, prog) * (1 - smooth(0.82, 0.98, prog));
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, time);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uScroll, (window.scrollY / Math.max(1, window.innerHeight)) * 0.12);
    gl.uniform1f(uCalm, calm);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now) {
    raf = 0;
    if (!live) return;
    var dt = now - last;
    if (dt >= 33) {
      time += Math.min(dt, 100) / 1000;
      last = now;
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      draw();
    }
    raf = requestAnimationFrame(frame);
  }

  function updateLive() {
    var should = !reduced && !document.hidden && visibleSections > 0;
    if (should === live && (raf || !should)) return;
    live = should;
    if (live && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }

  var scrollQueued = false;
  function onScroll() {
    if (live || scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(function () {
      scrollQueued = false;
      draw();
    });
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener(
    'pointermove',
    function (e) {
      if (reduced) return;
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = 1 - e.clientY / window.innerHeight;
    },
    { passive: true }
  );
  document.addEventListener('visibilitychange', updateLive);
  reduceMQ.addEventListener &&
    reduceMQ.addEventListener('change', function (e) {
      reduced = e.matches;
      updateLive();
      draw();
    });

  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault();
    live = false;
    document.documentElement.classList.remove('has-sky');
  });

  // Animate only while the hero or the final CTA is on screen.
  var liveTargets = document.querySelectorAll('.hero, .cta');
  if ('IntersectionObserver' in window && liveTargets.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var was = en.target.__skyVisible || false;
        if (en.isIntersecting !== was) {
          en.target.__skyVisible = en.isIntersecting;
          visibleSections += en.isIntersecting ? 1 : -1;
        }
      });
      updateLive();
    });
    liveTargets.forEach(function (el) {
      io.observe(el);
    });
  } else {
    visibleSections = 1;
  }

  live = false;
  resize();
  document.documentElement.classList.add('has-sky');
  updateLive();
})();
