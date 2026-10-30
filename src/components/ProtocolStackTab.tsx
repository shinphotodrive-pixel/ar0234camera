import React, { useState, useEffect } from 'react';
import { Layers, ChevronRight, PlayCircle, CheckCircle2, Activity, ArrowRight, RefreshCw, Cpu, Network, Clock, ShieldCheck } from 'lucide-react';
import { PROTOCOL_LAYERS } from '../data/cameraData';
import { ProtocolLayer } from '../types';

export const ProtocolStackTab: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<number>(5);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(0);
  const [simLog, setSimLog] = useState<string[]>([]);

  const selectedLayer: ProtocolLayer =
    PROTOCOL_LAYERS.find((l) => l.level === selectedLevel) || PROTOCOL_LAYERS[0];

  const packetSteps = [
    {
      stage: 'L1: 센서 수광',
      desc: 'AR0234CS 2.3MP 픽셀 전하 축적 (글로벌 동시 노출 12.5ms)',
      latency: '12.50 ms',
      bytes: '3.84 MB Raw10',
    },
    {
      stage: 'L2: MIPI CSI-2 직렬화',
      desc: 'MIPI D-PHY 4-Lane 차동 신호 송신 (3.6 Gbps 패킷화)',
      latency: '1.12 ms',
      bytes: '4-Lane D-PHY',
    },
    {
      stage: 'L3: ISP 하드웨어 인코딩',
      desc: 'De-Bayer, AWB, AE 처리 및 MJPEG 20:1 실시간 하드웨어 압축',
      latency: '3.40 ms',
      bytes: '98.5 KB MJPEG',
    },
    {
      stage: 'L4: USB EP1 등시성 전송',
      desc: 'wMaxPacketSize 0x1400 (3×1024B/125µs) UVC 페이로드 헤더 첨부',
      latency: '4.15 ms',
      bytes: '33 Microframes',
    },
    {
      stage: 'L5: V4L2 커널 링 버퍼',
      desc: 'UVCIOC_DQBUF 완료 및 호스트 앱 프레임 포인터 전달',
      latency: '0.45 ms',
      bytes: 'V4L2 DMABUF Ready',
    },
  ];

  const runPacketSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimStep(1);
    setSimLog([`[T+0.00ms] 시뮬레이션 개시: 1080p 60fps 단일 프레임 파이프라인 트리거`]);

    const stepTimings = [700, 1400, 2200, 3000, 3800];

    stepTimings.forEach((ms, index) => {
      setTimeout(() => {
        const stepNum = index + 1;
        setSimStep(stepNum);
        const info = packetSteps[index];
        setSimLog((prev) => [
          ...prev,
          `[T+${info.latency}] ${info.stage}: ${info.desc} (${info.bytes})`,
        ]);

        if (stepNum === 5) {
          setTimeout(() => {
            setIsSimulating(false);
            setSimLog((prev) => [
              ...prev,
              `[완료] 총 파이프라인 지연시간: 21.62ms - 프레임 드롭 0%, PTS 동기화 완료!`,
            ]);
          }, 600);
        }
      }, ms);
    });
  };

  return (
    <div className="space-y-6">
      {/* Intro Hero Section */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <Network className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Hampotech AR0234 카메라 시스템 전계층 프로토콜 스택</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
              빛 신호가 onsemi AR0234CS 센서 픽셀에 수광되는 물리 계층(L1)부터 호스트 운영체제의 V4L2/DirectShow 애플리케이션 버퍼에 도달하기까지의 5단계 프로토콜 계층입니다. 각 계층을 클릭하여 버스 사양, 프로토콜 구조, 실시간 패킷 흐름을 분석하세요.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="font-mono text-slate-500 dark:text-slate-400">Total Latency:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800">
              ~21.6 ms (at 60fps)
            </span>
          </div>
        </div>
      </div>

      {/* Layer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Stack Layers List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>프로토콜 계층 선택 (L1 ~ L5)</span>
            <span className="text-[11px] font-normal text-slate-400">클릭하여 세부 사양 확인</span>
          </div>

          {PROTOCOL_LAYERS.map((layer) => {
            const isSelected = selectedLevel === layer.level;
            const badgeColors: Record<number, string> = {
              5: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300',
              4: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300',
              3: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300',
              2: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300',
              1: 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300',
            };

            return (
              <div
                key={layer.id}
                onClick={() => setSelectedLevel(layer.level)}
                className={`cursor-pointer p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                        badgeColors[layer.level]
                      }`}
                    >
                      L{layer.level}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        {layer.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[260px] mt-0.5 font-mono text-[11px]">
                        {layer.subtitle}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected ? 'text-blue-600 dark:text-blue-400 translate-x-0.5' : 'text-slate-400'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Detailed Breakdown (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col justify-between transition-colors">
            <div>
              {/* Header Badge & Bus */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 gap-2">
                <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold text-xs px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900">
                  L{selectedLayer.level} Layer Details
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {selectedLayer.bus}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                {selectedLayer.name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                {selectedLayer.description}
              </p>

              {/* Dynamic Key Properties Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
                {selectedLayer.props.map((prop, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60"
                  >
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">
                      {prop.label}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                      {prop.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bandwidth Callout */}
              {selectedLayer.bandwidth && (
                <div className="mb-4 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400">대역폭 스펙:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedLayer.bandwidth}
                  </span>
                </div>
              )}

              {/* Technical Protocol Note Box */}
              <div className="bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-xl p-3.5 text-xs text-blue-950 dark:text-blue-200 space-y-1">
                <div className="font-semibold flex items-center space-x-1.5 text-blue-800 dark:text-blue-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>하드웨어 프로토콜 엔지니어링 분석</span>
                </div>
                <p className="leading-relaxed text-slate-700 dark:text-slate-300 text-[11px]">
                  {selectedLayer.note}
                </p>
              </div>
            </div>

            {/* Live Packet Simulation Trigger Bar */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                실시간 1080p 60fps 비디오 패킷 파이프라인 검증:
              </span>
              <button
                onClick={runPacketSimulation}
                disabled={isSimulating}
                className={`text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 transition shadow-sm ${
                  isSimulating
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-500'
                }`}
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>전송 패킷 시뮬레이션 중...</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 text-emerald-400" />
                    <span>패킷 전송 시뮬레이션 시작</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Live Packet Pipeline Simulator Tray */}
      {(isSimulating || simLog.length > 0) && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                실시간 데이터 패킷 파이프라인 시뮬레이터 (L1 → L5)
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              1080p 60fps YUV422/MJPEG Frame #1042
            </span>
          </div>

          {/* 5-Stage Visual Progress Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {packetSteps.map((step, idx) => {
              const stepNumber = idx + 1;
              const isPast = simStep > stepNumber;
              const isCurrent = simStep === stepNumber;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    isCurrent
                      ? 'bg-blue-50 dark:bg-blue-950 border-blue-500 shadow-sm ring-1 ring-blue-500'
                      : isPast
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-[11px]">
                      Stage {stepNumber}
                    </span>
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping" />
                    ) : (
                      <span className="text-[10px] text-slate-400">대기</span>
                    )}
                  </div>
                  <span className="font-semibold block text-slate-800 dark:text-slate-200 text-xs">
                    {step.stage}
                  </span>
                  <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    <span>{step.latency}</span>
                    <span>{step.bytes}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Console Output Terminal */}
          <div className="bg-slate-950 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed space-y-1 max-h-40 overflow-y-auto border border-slate-800">
            {simLog.map((log, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <span className="text-emerald-400 shrink-0">➜</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
