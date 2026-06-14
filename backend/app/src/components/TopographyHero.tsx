import { useRef, useEffect } from 'react';

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - 0.5;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float terrainHeight(vec2 p, float t) {
  float n = snoise(vec3(p * 0.8, t * 0.15));
  n += 0.5 * snoise(vec3(p * 1.6 + 10.0, t * 0.2));
  n += 0.25 * snoise(vec3(p * 3.2 + 30.0, t * 0.25));
  return n * 0.5 + 0.5;
}

vec3 getPixelColor(int px, int py, float contourScale, vec2 pos, float time) {
  vec2 p = vec2(float(px), float(py)) * contourScale;
  float h = terrainHeight(p, time);
  float val = h * 8.0;
  float iv = floor(val);
  float id = iv / 8.0;

  vec3 baseColor;
  if (id < 0.1) baseColor = vec3(0.04, 0.04, 0.06);
  else if (id < 0.2) baseColor = vec3(0.12, 0.12, 0.14);
  else if (id < 0.3) baseColor = vec3(0.20, 0.20, 0.22);
  else if (id < 0.4) baseColor = vec3(0.80, 0.78, 0.76);
  else if (id < 0.5) baseColor = vec3(1.00, 0.82, 0.76);
  else if (id < 0.6) baseColor = vec3(0.70, 0.62, 0.58);
  else if (id < 0.7) baseColor = vec3(0.85, 0.72, 0.64);
  else baseColor = vec3(1.00, 1.00, 0.98);

  float blend = fract(val);
  float isoline = smoothstep(0.05, 0.0, abs(blend - 0.5));
  float edge = smoothstep(0.02, 0.0, min(blend, 1.0 - blend));
  float edgeDarken = 0.85 + 0.15 * edge;
  return baseColor * edgeDarken + vec3(1.0, 0.98, 0.96) * isoline * 0.2;
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 pixel = fragCoord / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;

  vec2 mouseOffset = vec2(0.0);
  if (u_mouse.x > 0.0) {
    mouseOffset = (u_mouse / u_resolution - 0.5) * 0.3;
  }

  float angleX = mouseOffset.x * 3.14159;
  float angleY = -mouseOffset.y * 3.14159 * 0.5;

  float cosX = cos(angleX);
  float sinX = sin(angleX);
  float cosY = cos(angleY);
  float sinY = sin(angleY);

  mat3 rotX = mat3(1.0, 0.0, 0.0, 0.0, cosY, -sinY, 0.0, sinY, cosY);
  mat3 rotY = mat3(cosX, 0.0, sinX, 0.0, 1.0, 0.0, -sinX, 0.0, cosX);

  vec3 camPos = vec3(0.0, 0.0, 2.0);
  vec3 viewDir = normalize(vec3(pixel.x - 0.5, (pixel.y - 0.5) * (u_resolution.y / u_resolution.x), -1.0));
  vec3 terrainPos = (rotX * rotY) * (camPos + viewDir * 3.0);
  float contourScale = 0.0035;

  int px = int(terrainPos.x / contourScale);
  int py = int(terrainPos.y / contourScale);

  vec3 c00 = getPixelColor(px, py, contourScale, terrainPos.xy, u_time);
  vec3 c10 = getPixelColor(px + 1, py, contourScale, terrainPos.xy, u_time);
  vec3 c01 = getPixelColor(px, py + 1, contourScale, terrainPos.xy, u_time);
  vec3 c11 = getPixelColor(px + 1, py + 1, contourScale, terrainPos.xy, u_time);

  float fx = fract(terrainPos.x / contourScale);
  float fy = fract(terrainPos.y / contourScale);
  fx = fx * fx * (3.0 - 2.0 * fx);
  fy = fy * fy * (3.0 - 2.0 * fy);
  vec3 col = mix(mix(c00, c10, fx), mix(c01, c11, fx), fy);

  col *= 1.0 - length(pixel - 0.5) * 0.3;
  gl_FragColor = vec4(col, 1.0);
}
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export default function TopographyHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -1, y: -1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: false });
    if (!gl) return;

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = createProgram(gl, vs, fs);
    if (!program) return;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_position');
    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const resLoc = gl.getUniformLocation(program, 'u_resolution');
    const mouseLoc = gl.getUniformLocation(program, 'u_mouse');

    gl.useProgram(program);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    function resize() {
      if (!canvas || !container || !gl) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
    }

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const startTime = performance.now();
    let isVisible = true;

    function render() {
      if (!gl || !canvas) return;
      if (isVisible) {
        const elapsed = (performance.now() - startTime) * 0.001;
        gl.uniform1f(timeLoc, elapsed);
        gl.uniform2f(mouseLoc, mouseRef.current.x * dpr, mouseRef.current.y * dpr);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1, y: -1 };
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[360px] overflow-hidden rounded-[24px]">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Abstract topography visualization"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-full h-[200px] pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(10,10,15,0) 0%, rgba(10,10,15,0.7) 60%, rgba(10,10,15,1) 100%)',
          zIndex: 2,
        }}
      />
      <div className="absolute inset-0 flex flex-col justify-center px-8 z-[3]" style={{ paddingBottom: '60px' }}>
        <div className="flex items-center gap-3 mb-3">
          <h1
            className="font-display text-hero font-medium tracking-[-0.03em] leading-[1.05]"
            style={{
              color: '#F0EDE6',
              textShadow: '0 2px 30px rgba(10, 10, 15, 0.8)',
            }}
          >
            Welcome back, Founder
          </h1>
          <span className="text-2xl" style={{ textShadow: '0 2px 30px rgba(10, 10, 15, 0.8)' }}>👋</span>
        </div>
        <p
          className="text-sm mb-4"
          style={{
            color: '#8A8A93',
            textShadow: '0 2px 30px rgba(10, 10, 15, 0.8)',
          }}
        >
          Here&apos;s what&apos;s happening across your platform today
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full badge-green w-fit text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />
          Platform Health Score: 98/100
        </div>
      </div>
    </div>
  );
}
