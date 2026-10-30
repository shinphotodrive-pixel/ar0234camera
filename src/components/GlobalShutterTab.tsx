import React, { useState, useEffect, useRef } from 'react';
import { Camera, Zap, Cpu, Calculator, AlertTriangle, CheckCircle2, Play, Pause, RotateCw, Grid, ShieldCheck } from 'lucide-react';

export const GlobalShutterTab: React.FC = () => {
  // Canvas simulation state
  const [shutterMode, setShutterMode] = useState<'global' | 'rolling'>('global');
  const [rpmSpeed, setRpmSpeed] = useState<number>(6);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isFlashActive, setIsFlashActive] = useState<boolean>(false);

  // Trigger Calculator state
  const [triggerPeriodMs, setTriggerPeriodMs] = useState<number>(20.0); // 50 Hz
  const [maxFps, setMaxFps] = useState<number>(120);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const angleRef = useRef<number>(0);

  // Formula: Max Exp < Trigger_Period - (1 / Max_FPS) - 1.6 ms
  const frameTimeMs = (1000 / maxFps);
  const maxSafeExposureMs = Math.max(0.1, triggerPeriodMs - frameTimeMs - 1.6);
  const triggerHz = (1000 / triggerPeriodMs).toFixed(1);
  const maxSafeExposureUs = Math.round(maxSafeExposureMs * 1000);

  const triggerFlash = () => {
    setIsFlashActive(true);
    setTimeout(() => {
      setIsFlashActive(false);
    }, 180);
  };

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (!isPaused) {
        angleRef.current += rpmSpeed * 0.035;
      }

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Clear Canvas Background
      if (isFlashActive) {
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = '#090d16'; // Deep Obsidian
      }
      ctx.fillRect(0, 0, w, h);

      // Grid Lines
      if (showGrid) {
        ctx.strokeStyle = isFlashActive ? '#cbd5e1' : '#1e293b';
        ctx.lineWidth = 1;
        const step = 25;
        for (let x = 0; x < w; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }

      // If Rolling Shutter & Flash, draw Partial Flash Band
      if (shutterMode === 'rolling' && isFlashActive) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(0, cy - 35, w, 70); // Only rows exposed during flash are illuminated!
      }

      // Draw Rotating Propeller
      const numBlades = 3;
      const radius = Math.min(cx, cy) * 0.72;

      for (let i = 0; i < numBlades; i++) {
        const bladeAngle = angleRef.current + (i * (2 * Math.PI / numBlades));

        ctx.save();
        ctx.translate(cx, cy);

        if (shutterMode === 'rolling') {
          // Rolling Shutter: progressive row-by-row distortion (Jello Skew)
          ctx.fillStyle = '#f59e0b'; // Amber
          for (let y = -radius; y <= radius; y += 3) {
            const rowSkewAngle = bladeAngle + (y * 0.015);
            const x1 = Math.cos(rowSkewAngle) * y;
            const y1 = Math.sin(rowSkewAngle) * y;
            ctx.beginPath();
            ctx.arc(x1, y1, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Global Shutter: Clean solid elliptic blade
          ctx.rotate(bladeAngle);
          ctx.fillStyle = '#3b82f6'; // Blue
          ctx.beginPath();
          ctx.ellipse(radius / 2, 0, radius / 2, 12, 0, 0, Math.PI * 2);
          ctx.fill();

          // Blade tip accent
          ctx.fillStyle = '#60a5fa';
          ctx.beginPath();
          ctx.arc(radius, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Center Hub
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fillStyle = isFlashActive ? '#475569' : '#334155';
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Outer Reference Measurement Ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = isFlashActive ? '#94a3b8' : 'rgba(59, 130, 246, 0.25)';
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [shutterMode, rpmSpeed, isPaused, showGrid, isFlashActive]);

  return (
    <div className="space-y-6">
      {/* Intro Box */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2 mb-1">
          <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>글로벌 셔터 노이즈 비교 & 외부 하드웨어 트리거 시뮬레이터</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          고속 회전체나 차량 번호판 등 이동 피사체 촬영 시, 순차 행 스캔 방식의 <span className="font-semibold text-amber-700 dark:text-amber-400">롤링 셔터(Rolling Shutter)</span>는 기하학적 젤로 왜곡(Skew)과 플래시 부분 노출(Partial Flash)을 발생시킵니다. <span className="font-semibold text-blue-700 dark:text-blue-400">글로벌 셔터(AR0234CS)</span>의 동시 수광 정밀 동결 영상과 &lt;125ns 지연의 하드웨어 외부 트리거 타이밍을 검증하세요.
        </p>
      </div>

      {/* Shutter Mode Comparison Interactive Canvas */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              롤링 셔터 vs 글로벌 셔터 고속 피사체 캡처 인터랙티브 비교
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              고속 3엽 프로펠러의 물리적 회전 스캔 방식 차이 시뮬레이션
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShutterMode('global')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                shutterMode === 'global'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>글로벌 셔터 (Global Shutter)</span>
            </button>
            <button
              onClick={() => setShutterMode('rolling')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                shutterMode === 'rolling'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>롤링 셔터 (Rolling Shutter)</span>
            </button>
          </div>
        </div>

        {/* Canvas Display Viewport */}
        <div className="relative w-full h-72 sm:h-80 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
          <canvas
            ref={canvasRef}
            width={720}
            height={320}
            className="w-full h-full block object-contain"
          ></canvas>

          {/* Mode Overlay Badge */}
          <div className="absolute top-3 left-3 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-sm text-white text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-700 flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                shutterMode === 'global' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="font-semibold">
              {shutterMode === 'global'
                ? 'AR0234CS 글로벌 셔터: 1920×1200 전 픽셀 동시 수광 (0% Skew)'
                : '롤링 셔터: 행별 순차 스캔 (젤로 왜곡 및 플래시 밴딩 발생)'}
            </span>
          </div>

          {/* Quick HUD controls overlay */}
          <div className="absolute bottom-3 right-3 flex items-center space-x-1.5 bg-slate-900/80 backdrop-blur-sm p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 text-slate-300 hover:text-white rounded"
              title={isPaused ? '재생' : '일시정지'}
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-1.5 rounded ${showGrid ? 'text-blue-400' : 'text-slate-400'}`}
              title="격자 선 토글"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Controls Ribbon */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Speed Slider */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                피사체 회전 속도 (RPM):
              </label>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {rpmSpeed * 200} RPM
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="12"
              value={rpmSpeed}
              onChange={(e) => setRpmSpeed(parseInt(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Strobe Flash Trigger */}
          <button
            onClick={triggerFlash}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold p-3 rounded-xl flex items-center justify-center space-x-2 transition shadow-sm"
          >
            <Zap className="w-4 h-4" />
            <span>스트로브 조명 플래시 인가 (FLASH Pin)</span>
          </button>

          {/* Evaluation Metric */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-center">
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">왜곡 상태 평가:</span>
            <span
              className={`font-bold font-mono text-xs ${
                shutterMode === 'global'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {shutterMode === 'global'
                ? '기하학적 형태 100% 보존 (0% Skew, 균일 광량)'
                : '젤로 아티팩트 (Skew Distortion & Partial Flash)'}
            </span>
          </div>
        </div>
      </div>

      {/* Hardware Trigger Protocols & Exposure Limit Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trigger Mode Mechanics (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>하드웨어 외부 트리거 2대 프로토콜 모드</span>
          </h3>

          <div className="space-y-3 text-xs">
            {/* Pulsed Mode */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  1. Pulsed Mode (단일 펄스 트리거 모드)
                </span>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono px-2 py-0.5 rounded font-bold border border-amber-200 dark:border-amber-900">
                  TRIG High &gt; 125ns
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                센서가 초저전력 대기(Standby) 상태에서 외부 `TRIG` 핀 신호를 대기합니다. 상승 엣지(Rising Edge) 인가 즉시 사전 설정된 `R0x3012` Coarse_Integration_Time 동안 전체 픽셀이 동시에 빛을 전하로 축적하고 1장의 프레임을 전송합니다.
              </p>
              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-0.5">
                적용 분야: 컨베이어 벨트 불량 검출, 포토센서 동기 스냅샷, 번호판 감지기
              </div>
            </div>

            {/* Sync-Sink Mode */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  2. Sync-Sink Mode (동기화 싱크 위상 잠금)
                </span>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono px-2 py-0.5 rounded font-bold border border-blue-200 dark:border-blue-900">
                  최대 120 fps 위상 잠금
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                파이프라인 연속 스트리밍을 유지하면서 프레임 시작 타이밍(VSync)을 외부 `TRIG` 클럭 위상에 동기화(Phase-Lock)시킵니다. 이전 프레임의 판독(Readout)과 다음 프레임 노출이 오버랩되어 최대 120fps를 손실 없이 유지합니다.
              </p>
              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-0.5">
                적용 분야: 다중 카메라 3D 스테레오 비전 동기화, 로봇 팔 비주얼 서보잉
              </div>
            </div>
          </div>
        </div>

        {/* Exposure Limit Formula Calculator (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>외부 트리거 노출시간 한계 공식 계산기</span>
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            외부 트리거 연동 시 자동 노출(AE)은 위상 충돌을 유발할 수 있어 수동 고정 노출 모드가 필수적입니다. 아래 타이밍 수식을 만족해야 프레임 버퍼 오버런이 방지됩니다.
          </p>

          <div className="bg-slate-950 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] space-y-1 border border-slate-800">
            <div className="text-amber-400 font-bold">노출시간(Exposure) 임계 조건식:</div>
            <div className="text-slate-300">
              Exposure_Max &lt; Trigger_Period - (1 / Max_FPS) - 1.6 ms
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Trigger Period Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  외부 트리거 입력 주기 (Trigger Period):
                </label>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                  {triggerPeriodMs.toFixed(1)} ms ({triggerHz} Hz)
                </span>
              </div>
              <input
                type="range"
                min="10.0"
                max="50.0"
                step="1.0"
                value={triggerPeriodMs}
                onChange={(e) => setTriggerPeriodMs(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Max FPS Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  센서 모드 Max FPS 설정:
                </label>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {maxFps} FPS (프레임 판독 시간: {frameTimeMs.toFixed(2)} ms)
                </span>
              </div>
              <input
                type="range"
                min="60"
                max="120"
                step="30"
                value={maxFps}
                onChange={(e) => setMaxFps(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Calculation Result */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3.5 rounded-xl text-xs space-y-1">
              <span className="text-emerald-800 dark:text-emerald-300 font-bold block">
                허용 가능한 최대 안전 수동 노출 시간:
              </span>
              <div className="font-mono text-lg font-black text-emerald-700 dark:text-emerald-300">
                {maxSafeExposureMs.toFixed(2)} ms ({maxSafeExposureUs.toLocaleString()} µs)
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">
                * 이 값보다 긴 노출 시간을 레지스터에 기록하면 다음 트리거 엣지가 손실되거나 프레임 오버런이 발생합니다.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
