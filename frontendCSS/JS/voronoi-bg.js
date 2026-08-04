/* ══════════════════════════════════════════════════
   VORONOI WEBGL BACKGROUND — Light Theme Only
   Vanilla JS port of the React ShaderBackground component.
   Adapted from Paper Shaders: https://shaders.paper.design/voronoi
   Paper Shaders is licensed under Apache-2.0.
   ══════════════════════════════════════════════════ */
(function initVoronoiBg() {
  "use strict";

  // ── Shader sources ────────────────────────────────
  const VERT = `attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

  const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec3 u_colors[8];
uniform vec4 u_scene;
uniform vec4 u_shape;
uniform vec4 u_surface;
uniform vec4 u_finish;
uniform vec4 u_transform;
uniform vec4 u_space;
uniform vec4 u_cursor;

#define u_resolution u_scene.xy
#define u_time u_scene.z
#define u_colorCount u_scene.w
#define u_scale u_shape.x
#define u_intensity u_shape.y
#define u_paramA u_shape.z
#define u_warp u_shape.w
#define u_detail u_surface.x
#define u_contrast u_surface.y
#define u_brightness u_surface.z
#define u_saturation u_surface.w
#define u_hue u_finish.x
#define u_vignette u_finish.y
#define u_blur u_finish.z
#define u_grain u_finish.w
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define u_seed u_transform.x
#else
#define u_seed mod(u_transform.x, 31.0)
#endif
#define u_rotate u_transform.y
#define u_drift u_transform.z
#define u_oklab u_transform.w
#define u_offset u_space.xy
#define u_mouse u_space.zw
#define u_cursorPresence u_cursor.x
#define u_cursorEffect u_cursor.y
#define u_cursorStrength u_cursor.z
#define u_cursorRadius u_cursor.w

float hash21(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float grainHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  float n = sin(dot(p, vec2(41.0, 289.0)));
  return fract(vec2(15731.743, 7892.321) * n);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.0, 9.2);
    a *= 0.5;
  }
  return v;
}

vec3 srgbToLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)),
    step(0.04045, c));
}
vec3 linearToSrgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055,
    step(0.0031308, c));
}
vec3 linToOklab(vec3 c) {
  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
  l = pow(max(l, 0.0), 1.0 / 3.0);
  m = pow(max(m, 0.0), 1.0 / 3.0);
  s = pow(max(s, 0.0), 1.0 / 3.0);
  return vec3(
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s);
}
vec3 oklabToLin(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}
vec3 mixColour(vec3 a, vec3 b, float t) {
  if (u_oklab > 0.5) {
    vec3 la = linToOklab(srgbToLinear(a));
    vec3 lb = linToOklab(srgbToLinear(b));
    return clamp(linearToSrgb(oklabToLin(mix(la, lb, t))), 0.0, 1.0);
  }
  return mix(a, b, t);
}

vec3 palette(float x) {
  float n = max(u_colorCount - 1.0, 1.0);
  float f = clamp(x, 0.0, 1.0) * n;
  vec3 col = u_colors[0];
  for (int i = 0; i < 7; i++) {
    if (float(i) < n)
      col = mixColour(col, u_colors[i + 1],
        smoothstep(0.0, 1.0, clamp(f - float(i), 0.0, 1.0)));
  }
  return col;
}

vec3 hueRotate(vec3 col, float a) {
  const mat3 toYIQ = mat3(0.299, 0.596, 0.211,
                          0.587, -0.274, -0.523,
                          0.114, -0.322, 0.312);
  const mat3 toRGB = mat3(1.0, 1.0, 1.0,
                          0.956, -0.272, -1.106,
                          0.621, -0.647, 1.703);
  vec3 yiq = toYIQ * col;
  float ca = cos(a), sa = sin(a);
  yiq = vec3(yiq.x, yiq.y * ca - yiq.z * sa, yiq.y * sa + yiq.z * ca);
  return toRGB * yiq;
}

vec3 shade(vec2 uv, vec2 p, float t) {
  vec2 grid = p * (3.0 + u_intensity * 9.0);
  vec2 cell = floor(grid);
  vec2 local = fract(grid);
  float nearest = 8.0;
  float second = 8.0;
  float colourIndex = 0.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 rnd = hash22(cell + offset + u_seed);
      vec2 point = offset + 0.5 + 0.42 * sin(t * 0.3 + 6.2831853 * rnd) - local;
      float dist = dot(point, point);
      if (dist < nearest) {
        second = nearest;
        nearest = dist;
        colourIndex = rnd.x;
      } else if (dist < second) {
        second = dist;
      }
    }
  }
  float edge = smoothstep(0.0, mix(0.18, 0.015, u_paramA), sqrt(second) - sqrt(nearest));
  return mix(palette(colourIndex), u_colors[0], edge * 0.7);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 screenUv = uv;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
    / min(u_resolution.x, u_resolution.y);
  float cursorMask = 0.0;

  if (u_cursorPresence > 0.001) {
    vec2 cursor = (0.5 * u_mouse * u_resolution.xy)
      / min(u_resolution.x, u_resolution.y);
    vec2 cursorDelta = p - cursor;
    if (u_cursorEffect < 0.5) {
      p += cursor * u_cursorPresence * u_cursorStrength * 0.55;
    } else {
      float cursorDistance = length(cursorDelta);
      vec2 cursorDirection = cursorDelta / max(cursorDistance, 0.0001);
      cursorMask = u_cursorPresence
        * (1.0 - smoothstep(0.0, u_cursorRadius, cursorDistance));
      if (u_cursorEffect < 1.5) {
        p -= cursorDirection * cursorMask * u_cursorStrength * 0.24;
      } else if (u_cursorEffect < 2.5) {
        float cursorAngle = cursorMask * u_cursorStrength * 2.2;
        float cc = cos(cursorAngle), cs = sin(cursorAngle);
        p = cursor + mat2(cc, -cs, cs, cc) * cursorDelta;
      } else if (u_cursorEffect < 3.5) {
        float ripple = sin(
          cursorDistance / max(u_cursorRadius, 0.001) * 18.0 - u_time * 5.0);
        p -= cursorDirection * ripple * cursorMask * u_cursorStrength * 0.07;
      }
    }
  }

  uv = p * min(u_resolution.x, u_resolution.y) / u_resolution.xy + 0.5;
  p *= u_scale;
  if (abs(u_rotate) > 0.0001) {
    float cr = cos(u_rotate), sr = sin(u_rotate);
    p = mat2(cr, -sr, sr, cr) * p;
  }
  p += u_offset;
  if (u_drift > 0.0001)
    p += u_drift * vec2(sin(u_time * 0.31), cos(u_time * 0.23));
  if (u_warp > 0.0) {
    p += u_warp * (vec2(
      fbm(p * u_detail + u_seed),
      fbm(p * u_detail + vec2(5.2, 1.3))) - 0.5);
  }
  vec3 col;
  if (u_blur > 0.0) {
    float e = u_blur;
    float pe = e * u_scale;
    vec2 uvE = vec2(e) * min(u_resolution.x, u_resolution.y) / u_resolution.xy;
    col  = shade(uv, p, u_time) * 0.36;
    col += shade(uv + vec2(uvE.x, 0.0), p + vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv - vec2(uvE.x, 0.0), p - vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv + vec2(0.0, uvE.y), p + vec2(0.0, pe), u_time) * 0.16;
    col += shade(uv - vec2(0.0, uvE.y), p - vec2(0.0, pe), u_time) * 0.16;
  } else {
    col = shade(uv, p, u_time);
  }
  if (abs(u_contrast - 1.0) > 0.0001)
    col = (col - 0.5) * u_contrast + 0.5;
  if (abs(u_saturation - 1.0) > 0.0001) {
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luma), col, u_saturation);
  }
  if (abs(u_hue) > 0.0001)
    col = hueRotate(col, u_hue);
  if (abs(u_brightness) > 0.0001)
    col += u_brightness;
  if (u_vignette > 0.0001) {
    float vd = length(screenUv - 0.5) * 1.41421356;
    col *= 1.0 - u_vignette * smoothstep(0.35, 1.0, vd);
  }
  if (u_cursorPresence > 0.001 && u_cursorEffect > 3.5)
    col += (vec3(0.18) + col * 0.12) * cursorMask * u_cursorStrength;
  if (u_grain > 0.0001)
    col += (grainHash(
      gl_FragCoord.xy + vec2(u_seed * 17.0, u_seed * 31.0)) - 0.5) * u_grain;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

  // ── Uniform presets (from the React component) ─────
  var UNIFORMS = {
    colors: [
      [0.403921568627451, 0.9098039215686274, 0.9764705882352941],
      [0.9254901960784314, 0.996078431372549, 1],
      [0.023529411764705882, 0.06274509803921569, 0.0784313725490196],
      [0.054901960784313725, 0.4549019607843137, 0.5647058823529412],
      [0.054901960784313725, 0.4549019607843137, 0.5647058823529412],
      [0.054901960784313725, 0.4549019607843137, 0.5647058823529412],
      [0.054901960784313725, 0.4549019607843137, 0.5647058823529412],
      [0.054901960784313725, 0.4549019607843137, 0.5647058823529412],
    ],
    colorCount: 4,
    scale: 1.7,
    intensity: 0.69,
    paramA: 0.74,
    warp: 0.3,
    detail: 3.68,
    contrast: 1.005,
    brightness: 0.0,
    saturation: 1.0,
    hue: 0.0,
    vignette: 0.0,
    blur: 0.0,
    grain: 0.063,
    seed: 1.0,
    rotate: 1.2915,
    offsetX: 0.0,
    offsetY: 0.0,
    drift: 0.0,
    cursorEnabled: false,
    cursorEffect: 2.0,
    cursorStrength: 0.65,
    cursorRadius: 0.46,
    oklab: 0.0,
    timeScale: 1.069,
  };

  // ── State ─────────────────────────────────────────
  var canvas = null;
  var gl = null;
  var program = null;
  var buf = null;
  var uni = {};
  var raf = 0;
  var lastNow = null;
  var startTime = 0;
  var disposed = false;
  var visible = document.visibilityState === "visible";
  var inView = true;
  var resizeObserver = null;
  var intersectionObserver = null;
  var initialized = false;

  // ── Helpers ────────────────────────────────────────
  function isLightTheme() {
    return (
      document.documentElement.classList.contains("light-theme") ||
      document.body.classList.contains("light-theme")
    );
  }

  function compileShader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  // ── Create canvas element ──────────────────────────
  function createCanvas() {
    canvas = document.createElement("canvas");
    canvas.id = "voronoi-canvas";
    document.body.insertBefore(canvas, document.body.firstChild);
  }

  // ── Initialize WebGL ───────────────────────────────
  function initGL() {
    if (initialized) return true;
    gl = canvas.getContext("webgl", { antialias: false });
    if (!gl) return false;

    program = gl.createProgram();
    var vertexShader = compileShader(gl.VERTEX_SHADER, VERT);
    var fragmentShader = compileShader(gl.FRAGMENT_SHADER, FRAG);
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    gl.useProgram(program);

    buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    var loc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    uni = {
      colors: gl.getUniformLocation(program, "u_colors"),
      scene: gl.getUniformLocation(program, "u_scene"),
      shape: gl.getUniformLocation(program, "u_shape"),
      surface: gl.getUniformLocation(program, "u_surface"),
      finish: gl.getUniformLocation(program, "u_finish"),
      transform: gl.getUniformLocation(program, "u_transform"),
      space: gl.getUniformLocation(program, "u_space"),
      cursor: gl.getUniformLocation(program, "u_cursor"),
    };

    // Set static uniforms
    gl.uniform3fv(uni.colors, new Float32Array([].concat.apply([], UNIFORMS.colors)));
    gl.uniform4f(uni.shape, UNIFORMS.scale, UNIFORMS.intensity, UNIFORMS.paramA, UNIFORMS.warp);
    gl.uniform4f(uni.surface, UNIFORMS.detail, UNIFORMS.contrast, UNIFORMS.brightness, UNIFORMS.saturation);
    gl.uniform4f(uni.finish, UNIFORMS.hue, UNIFORMS.vignette, UNIFORMS.blur, UNIFORMS.grain);
    gl.uniform4f(uni.transform, UNIFORMS.seed, UNIFORMS.rotate, UNIFORMS.drift, UNIFORMS.oklab);
    gl.uniform4f(uni.cursor, 0, UNIFORMS.cursorEffect, UNIFORMS.cursorStrength, UNIFORMS.cursorRadius);

    startTime = performance.now();
    initialized = true;
    return true;
  }

  // ── Resize canvas ──────────────────────────────────
  function resizeCanvas() {
    if (!canvas || !gl) return;
    var bounds = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rawWidth = Math.max(1, Math.round(bounds.width * dpr));
    var rawHeight = Math.max(1, Math.round(bounds.height * dpr));
    var pixelScale = Math.min(1, Math.sqrt(2000000 / Math.max(1, rawWidth * rawHeight)));
    var width = Math.max(1, Math.round(rawWidth * pixelScale));
    var height = Math.max(1, Math.round(rawHeight * pixelScale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  // ── Request render ─────────────────────────────────
  function requestRender() {
    if (!disposed && visible && inView && raf === 0 && isLightTheme()) {
      raf = requestAnimationFrame(render);
    }
  }

  // ── Render frame ───────────────────────────────────
  function render(now) {
    raf = 0;
    if (disposed || !visible || !inView || !isLightTheme()) return;

    var dt = lastNow === null ? 0 : Math.min((now - lastNow) / 1000, 0.1);
    lastNow = now;

    resizeCanvas();
    var width = canvas.width;
    var height = canvas.height;

    gl.uniform4f(
      uni.scene,
      width,
      height,
      ((now - startTime) / 1000) * UNIFORMS.timeScale,
      UNIFORMS.colorCount
    );
    gl.uniform4f(uni.space, UNIFORMS.offsetX, UNIFORMS.offsetY, 0, 0);
    gl.uniform4f(uni.cursor, 0, UNIFORMS.cursorEffect, UNIFORMS.cursorStrength, UNIFORMS.cursorRadius);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Time is animated, keep rendering
    if (Math.abs(UNIFORMS.timeScale) > 0.0001) {
      requestRender();
    } else {
      lastNow = null;
    }
  }

  // ── Start / Stop based on theme ────────────────────
  function start() {
    if (!canvas) return;
    if (!initialized && !initGL()) return;
    disposed = false;
    lastNow = null;
    resizeCanvas();
    requestRender();
  }

  function stop() {
    if (raf !== 0) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    lastNow = null;
  }

  // ── Theme change handler ──────────────────────────
  function onThemeChange() {
    if (isLightTheme()) {
      start();
    } else {
      stop();
    }
  }

  // ── Boot ───────────────────────────────────────────
  createCanvas();

  // Observe theme toggles on both body and html
  var bodyObserver = new MutationObserver(onThemeChange);
  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  var htmlObserver = new MutationObserver(onThemeChange);
  htmlObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  // Resize handler
  window.addEventListener("resize", function () {
    if (isLightTheme() && initialized) {
      resizeCanvas();
      requestRender();
    }
  });

  // ResizeObserver for the canvas element itself
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(function () {
      if (isLightTheme() && initialized) {
        resizeCanvas();
        requestRender();
      }
    });
    resizeObserver.observe(canvas);
  }

  // IntersectionObserver — pause when out of viewport
  if (typeof IntersectionObserver !== "undefined") {
    intersectionObserver = new IntersectionObserver(function (entries) {
      var entry = entries[0];
      inView = entry ? entry.isIntersecting : true;
      if (inView) {
        requestRender();
      } else {
        stop();
      }
    });
    intersectionObserver.observe(canvas);
  }

  // Visibility change — pause when tab is hidden
  document.addEventListener("visibilitychange", function () {
    visible = document.visibilityState === "visible";
    if (visible && isLightTheme()) {
      requestRender();
    } else {
      stop();
    }
  });

  // Start if already in light theme
  if (isLightTheme()) {
    start();
  }
})();
