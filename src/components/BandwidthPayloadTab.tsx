import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, Binary, FileCheck2, AlertCircle, CheckCircle2, AlertTriangle, ArrowUpDown, Cpu, Zap } from 'lucide-react';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components safely
Chart.register(...registerables);

export const BandwidthPayloadTab: React.FC = () => {
  const [resolution, setResolution] = useState<'1920x1080' | '1920x1200' | '1280x720' | '640x480'>('1920x1080');
  const [fps, setFps] = useState<number>(60);
  const [mjpegRatio, setMjpegRatio] = useState<number>(20);

  // wMaxPacketSize Decoder state
  const [hexInput, setHexInput] = useState<string>('0x1400');
  const [decodedPacketSize, setDecodedPacketSize] = useState<number>(1024);
  const [decodedMult, setDecodedMult] = useState<number>(2);

  // Payload Header state
  const [fid, setFid] = useState<number>(1);
  const [eof, setEof] = useState<number>(0);
  const [ptsEnabled, setPtsEnabled] = useState<boolean>(true);
  const [scrEnabled, setScrEnabled] = useState<boolean>(true);
  const [errBit, setErrBit] = useState<number>(0);

  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Parse width & height
  const [width, height] = resolution.split('x').map(Number);

  // Calculations
  // YUY2 = W * H * 16 bits * FPS
  const yuy2Bps = width * height * 16 * fps;
  const yuy2Mbps = yuy2Bps / 1_000_000;
  const yuy2Gbps = (yuy2Bps / 1_000_000_000).toFixed(2);

  // MJPEG = YUY2 / compression ratio
  const mjpegMbps = (yuy2Mbps / mjpegRatio).toFixed(1);

  const usb2CeilingMbps = 350; // USB 2.0 High-Speed effective video ceiling (~350Mbps out of 480Mbps physical)
  const usb3CeilingMbps = 4000; // USB 3.0 SuperSpeed effective video ceiling (~4.0Gbps out of 5.0Gbps physical)

  // Status diagnostics
  const isMjpegOkOnUsb2 = parseFloat(mjpegMbps) <= usb2CeilingMbps;
  const isYuy2OkOnUsb2 = yuy2Mbps <= usb2CeilingMbps;

  // wMaxPacketSize Decoding logic
  const handleHexChange = (val: string) => {
    setHexInput(val);
    try {
      const num = parseInt(val, 16);
      if (!isNaN(num)) {
        const size = num & 0x07ff; // bits 10:0
        const mult = (num >> 11) & 0x03; // bits 12:11
        setDecodedPacketSize(size);
        setDecodedMult(mult);
      }
    } catch {
      // ignore
    }
  };

  const totalTransactions = decodedMult + 1;
  const isochThroughputMBps = (totalTransactions * decodedPacketSize) / 125; // per microframe (125µs)
  const isochThroughputMbps = (isochThroughputMBps * 8).toFixed(1);

  // Compute BFH
  // Bit 0: FID, Bit 1: EOF, Bit 2: PTS, Bit 3: SCR, Bit 5: ERR, Bit 7: EOH
  let bfhVal = 0x80; // Header standard start
  if (fid) bfhVal |= 0x01;
  if (eof) bfhVal |= 0x02;
  if (ptsEnabled) bfhVal |= 0x04;
  if (scrEnabled) bfhVal |= 0x08;
  if (errBit) bfhVal |= 0x20;

  const headerLength = 2 + (ptsEnabled ? 4 : 0) + (scrEnabled ? 6 : 0);

  // Initialize and update Chart.js
  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['YUY2 비압축', 'MJPEG 압축', 'USB 2.0 실효 한계', 'USB 3.0 실효 한계'],
        datasets: [
          {
            label: '데이터 대역폭 (Mbps)',
            data: [
              Math.round(yuy2Mbps),
              parseFloat(mjpegMbps),
              usb2CeilingMbps,
              usb3CeilingMbps,
            ],
            backgroundColor: [
              'rgba(239, 68, 68, 0.85)',
              'rgba(16, 185, 129, 0.85)',
              'rgba(245, 158, 11, 0.85)',
              'rgba(37, 99, 235, 0.85)',
            ],
            borderColor: ['#dc2626', '#059669', '#d97706', '#1d4ed8'],
            borderWidth: 1.5,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` 대역폭: ${(context.parsed.y ?? 0).toLocaleString()} Mbps`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Mbps (메가비트/초, 로그 스케일 유사 비교)',
              font: { size: 11 },
            },
            grid: {
              color: 'rgba(156, 163, 175, 0.15)',
            },
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [resolution, fps, mjpegRatio]);

  return (
    <div className="space-y-6">
      {/* Intro Box */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2 mb-1">
          <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>비디오 데이터 대역폭 시뮬레이터 & USB 페이로드 프로토콜</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          USB 2.0 버스의 물리적 한계(~350 Mbps 실효 비디오 대역폭)로 인해 비압축 YUY2 포맷과 압축 MJPEG 포맷의 전송 가능성이 극명하게 갈립니다. 아래 계산기로 해상도와 FPS에 따른 실시간 대역폭 요구량을 확인하고, 고속 등시성 전송을 위한 <span className="font-semibold text-slate-800 dark:text-slate-200">wMaxPacketSize (0x1400) 비트 시프트</span> 및 <span className="font-semibold text-slate-800 dark:text-slate-200">UVC Payload Header 필드</span>를 디코딩하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders & Bandwidth Controls (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            비디오 파라미터 대역폭 실시간 설정
          </h3>

          <div className="space-y-3.5 text-xs">
            {/* Resolution Picker */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                해상도 프리셋 (Resolution):
              </label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="1920x1080">1080p Full HD (1920 × 1080)</option>
                <option value="1920x1200">2.3MP Full Native (1920 × 1200)</option>
                <option value="1280x720">720p HD (1280 × 720)</option>
                <option value="640x480">VGA (640 × 480)</option>
              </select>
            </div>

            {/* FPS Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  프레임 레이트 (FPS):
                </label>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                  {fps} FPS
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="120"
                step="15"
                value={fps}
                onChange={(e) => setFps(parseInt(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>15 fps</span>
                <span>30 fps</span>
                <span>60 fps</span>
                <span>120 fps</span>
              </div>
            </div>

            {/* MJPEG Compression Ratio Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  MJPEG 압축률 (Compression Ratio):
                </label>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  ~{mjpegRatio}:1
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="30"
                step="5"
                value={mjpegRatio}
                onChange={(e) => setMjpegRatio(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Exact Formula Calculations */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                  YUY2 (16 bpp) 비압축 요구 대역폭:
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {width} × {height} × 16 × {fps} = {yuy2Gbps} Gbps ({Math.round(yuy2Mbps)} Mbps)
                </span>
              </div>
              <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                  MJPEG 하드웨어 압축 예상 대역폭:
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  약 {mjpegMbps} Mbps (압축률 {mjpegRatio}:1 기준)
                </span>
              </div>
            </div>

            {/* USB Diagnostic Verdict Card */}
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                isMjpegOkOnUsb2
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              }`}
            >
              <div className="flex items-center space-x-1.5 font-bold">
                {isMjpegOkOnUsb2 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>USB 2.0 (MJPEG) 전송 안정권: {mjpegMbps} Mbps</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>USB 2.0 대역폭 초과 위험! (350 Mbps 한계)</span>
                  </>
                )}
              </div>
              <p className="text-[11px] leading-relaxed opacity-90 font-sans">
                {isMjpegOkOnUsb2
                  ? `MJPEG 포맷(${mjpegMbps} Mbps)은 USB 2.0 가용 대역폭(${usb2CeilingMbps} Mbps) 이내이므로 프레임 드롭 없이 안정 전송됩니다.`
                  : `MJPEG 포맷이 USB 2.0 한계를 초과했습니다. FPS를 낮추거나 USB 3.0 SuperSpeed 케이블을 연결하십시오.`}
              </p>
              {!isYuy2OkOnUsb2 && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 font-mono">
                  * YUY2 비압축({yuy2Gbps} Gbps)은 USB 3.0 전용입니다. (USB 2.0 연결 시 커널 버퍼 오버플로우)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                대역폭 비교 차트 (Mbps vs USB 버스 한계)
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                {resolution} @ {fps}fps
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              비압축 YUY2 vs 압축 MJPEG 대역폭 요구량과 USB 2.0 / USB 3.0 실효 한계선 비교
            </p>

            {/* Chart Container */}
            <div className="relative w-full h-72 sm:h-80">
              <canvas ref={chartRef}></canvas>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded">
              <span className="text-slate-400 block text-[10px]">YUY2 Raw</span>
              <span className="font-bold text-red-600 dark:text-red-400">{Math.round(yuy2Mbps)}M</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded">
              <span className="text-slate-400 block text-[10px]">MJPEG</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{mjpegMbps}M</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded">
              <span className="text-slate-400 block text-[10px]">USB 2.0 Max</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">350 Mbps</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded">
              <span className="text-slate-400 block text-[10px]">USB 3.0 Max</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">4,000 Mbps</span>
            </div>
          </div>
        </div>
      </div>

      {/* USB 2.0 High-Bandwidth Isochronous & Payload Header Decoder Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* wMaxPacketSize Shift Decoder (0x1400) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <Binary className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>`wMaxPacketSize` 비트 시프트 디코더 (0x1400)</span>
            </h3>
            <span className="text-xs font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
              High-Bandwidth Isoch
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            USB 2.0 등시성 전송(Isochronous) 시 마이크로프레임(125µs)당 최대 3회의 트랜잭션을 수행하기 위해 `wMaxPacketSize` 필드에 특별한 16비트 인코딩이 적용됩니다.
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">레지스터 Hex 입력:</span>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => handleHexChange(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded text-blue-600 dark:text-blue-400 font-bold text-xs w-24 text-center focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => handleHexChange('0x1400')}
                  className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                >
                  기본 0x1400
                </button>
              </div>
            </div>

            {/* Bit Breakdown Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                  Bits 10:0 (Packet Size):
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {decodedPacketSize} Bytes / Transaction
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                  Bits 12:11 (Mult Flag):
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {decodedMult} (추가 {decodedMult}회 = 총 {totalTransactions}회)
                </span>
              </div>
            </div>

            {/* Throughput Math Box */}
            <div className="bg-blue-50/80 dark:bg-blue-950/40 p-3 rounded-lg border border-blue-200 dark:border-blue-900/60 text-blue-950 dark:text-blue-200 text-[11px] leading-relaxed">
              <strong>고속 등시성 스루풋 계산:</strong>
              <div className="mt-1">
                {totalTransactions} × {decodedPacketSize} Bytes / 125 µs ={' '}
                <strong className="text-blue-700 dark:text-blue-300">
                  {isochThroughputMBps.toFixed(3)} MB/s ({isochThroughputMbps} Mbps)
                </strong>{' '}
                고정 대역폭 할당
              </div>
            </div>
          </div>
        </div>

        {/* UVC Payload Header Inspector */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>UVC Payload Header 비트필드 파서 (2 ~ 12 Bytes)</span>
            </h3>
            <span className="text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-200 dark:border-emerald-900">
              Header Length: {headerLength}B
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            모든 USB 비디오 패킷의 최상단에는 프레임 시작/종료 식별, 타임스탬프 동기화를 위한 UVC 페이로드 헤더가 부착됩니다.
          </p>

          <div className="space-y-2 text-xs">
            {/* Header Length & BFH Hex */}
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">HLE (Length):</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  0x{headerLength.toString(16).padStart(2, '0').toUpperCase()} ({headerLength}B)
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">BFH (Bitfield):</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                  0x{bfhVal.toString(16).padStart(2, '0').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Interactive Bit Toggles */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
                BFH 플래그 비트 대화형 토글:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono">
                <button
                  onClick={() => setFid(fid === 1 ? 0 : 1)}
                  className={`p-1.5 rounded border text-center transition ${
                    fid ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  FID: {fid} (프레임토글)
                </button>
                <button
                  onClick={() => setEof(eof === 1 ? 0 : 1)}
                  className={`p-1.5 rounded border text-center transition ${
                    eof ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  EOF: {eof} (프레임끝)
                </button>
                <button
                  onClick={() => setPtsEnabled(!ptsEnabled)}
                  className={`p-1.5 rounded border text-center transition ${
                    ptsEnabled ? 'bg-purple-600 text-white border-purple-600' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  PTS: {ptsEnabled ? '4B 포함' : '제외'}
                </button>
                <button
                  onClick={() => setScrEnabled(!scrEnabled)}
                  className={`p-1.5 rounded border text-center transition ${
                    scrEnabled ? 'bg-amber-600 text-white border-amber-600' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  SCR: {scrEnabled ? '6B 포함' : '제외'}
                </button>
              </div>
            </div>

            {/* Timestamps field info */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">PTS (Presentation Time):</span>
                <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px]">
                  32-bit HW 클럭 타임스탬프 (나노초 기준)
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">SCR (Source Clock Ref):</span>
                <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px]">
                  48-bit 클럭 + 11-bit USB SOF 카운터
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
