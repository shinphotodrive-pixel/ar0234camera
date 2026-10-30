import React, { useState } from 'react';
import { Sliders, RefreshCw, Send, Zap, Cpu, ToggleRight, Check, AlertCircle, Search, Filter } from 'lucide-react';
import { REGISTER_DATABASE } from '../data/cameraData';
import { RegisterEntry } from '../types';

export const SensorI2CTab: React.FC = () => {
  // Double Buffering Simulator State
  const [exposureMs, setExposureMs] = useState<number>(12.5);
  const [gainDb, setGainDb] = useState<number>(0);
  const [pendingExposureHex, setPendingExposureHex] = useState<string>('0x04E2');
  const [pendingGainHex, setPendingGainHex] = useState<string>('0x0020');
  const [liveExposureHex, setLiveExposureHex] = useState<string>('0x04E2');
  const [liveGainHex, setLiveGainHex] = useState<string>('0x0020');
  const [liveExposureMs, setLiveExposureMs] = useState<number>(12.5);
  const [liveGainDb, setLiveGainDb] = useState<number>(0);

  const [hasPendingWrite, setHasPendingWrite] = useState<boolean>(false);
  const [i2cStatusLog, setI2cStatusLog] = useState<string>(
    '상태: 대기 중 - 센서 파이프라인이 현재 활성 레지스터(Live) 값으로 구동 중입니다.'
  );

  // Context Switching State
  const [activeContext, setActiveContext] = useState<'A' | 'B' | 'C'>('A');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Slider change updates local state
  const handleExposureChange = (val: number) => {
    setExposureMs(val);
    const regVal = Math.round(val * 100);
    const hex = '0x' + regVal.toString(16).padStart(4, '0').toUpperCase();
    setPendingExposureHex(hex);
  };

  const handleGainChange = (val: number) => {
    setGainDb(val);
    // 0dB = 0x0020 (1x), 6dB = 0x0040 (2x), 12dB = 0x0080 (4x)
    const multiplier = Math.pow(10, val / 20);
    const gainCode = Math.round(multiplier * 32);
    const hex = '0x' + gainCode.toString(16).padStart(4, '0').toUpperCase();
    setPendingGainHex(hex);
  };

  // I2C Write Button: Pushes values to Pending Register
  const handleI2CWrite = () => {
    setHasPendingWrite(true);
    setI2cStatusLog(
      `[I2C Write 성공] 슬레이브 0x20 R0x3012=${pendingExposureHex}, R0x3060=${pendingGainHex} 대기 레지스터 수신 완료. VSync Dark Blanking 대기 중...`
    );
  };

  // Frame Start Blanking: Copies Pending to Live Register
  const handleFrameStartVSync = () => {
    if (hasPendingWrite) {
      setLiveExposureHex(pendingExposureHex);
      setLiveGainHex(pendingGainHex);
      setLiveExposureMs(exposureMs);
      setLiveGainDb(gainDb);
      setHasPendingWrite(false);
      setI2cStatusLog(
        `[Frame Start Dark Pixel Blanking] Pending → Live 레지스터 일괄 이관 완료! 신규 노출: ${exposureMs}ms (${pendingExposureHex}), 게인: ${gainDb}dB`
      );
    } else {
      setI2cStatusLog(
        `[Frame Start Dark Pixel Blanking] 변경 사항 없음 - 기존 Live 레지스터(${liveExposureHex})가 유지됩니다.`
      );
    }
  };

  // Toggle Context Switch
  const toggleContext = () => {
    if (activeContext === 'A') {
      setActiveContext('B');
    } else if (activeContext === 'B') {
      setActiveContext('C');
    } else {
      setActiveContext('A');
    }
  };

  const filteredRegisters = REGISTER_DATABASE.filter((reg) => {
    const matchesSearch =
      reg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || reg.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Intro Box */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2 mb-1">
          <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>onsemi AR0234CS 센서 아키텍처 & I2C 레지스터 제어</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          AR0234CS 센서 내부의 레지스터 제어는 400kHz Fast-mode I2C 2-wire 프로토콜(Slave ID 0x20)을 통과합니다. 프레임의 중도 찢김과 상하단 노출 불일치를 원천 차단하기 위한 <span className="font-semibold text-slate-800 dark:text-slate-200">이중 버퍼링(Double Buffering)</span> 메커니즘과 지연 없는 온-디맨드 해상도 전환을 위한 <span className="font-semibold text-slate-800 dark:text-slate-200">256×16 SRAM 컨텍스트 스위칭(Context Switching)</span>을 직접 시뮬레이션할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Double Buffering Interactive Simulator */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>이중 버퍼링(Double Buffering) 레지스터 시뮬레이터</span>
            </h3>
            <span className="text-xs bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-mono font-semibold px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
              I2C Slave: 0x20
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            I2C를 통해 노출 시간이나 게인 레지스터 값을 변경할 때, 즉시 센서 활성 레지스터(Live Register)에 반영되면 프레임 중간에 광량이 바뀌어 <span className="font-semibold text-rose-600 dark:text-rose-400">배드 프레임(Bad Frame)</span>이 발생합니다. 수신 데이터는 먼저 <span className="font-semibold text-amber-700 dark:text-amber-300">대기 레지스터(Pending Register)</span>에 보관된 후, 프레임 시작점(Frame Start)의 다크 픽셀 블랭킹 구간에서 일괄 전송됩니다.
          </p>

          {/* Interactive Sliders */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3.5 text-xs">
            {/* Exposure Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  노출 시간 Coarse_Integration (`R0x3012`):
                </label>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                  {exposureMs.toFixed(1)} ms ({pendingExposureHex})
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="33.0"
                step="0.5"
                value={exposureMs}
                onChange={(e) => handleExposureChange(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0.5 ms (고속 셔터)</span>
                <span>16.6 ms (60fps 한계)</span>
                <span>33.0 ms (30fps 한계)</span>
              </div>
            </div>

            {/* Gain Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  아날로그 게인 Analogue_Gain (`R0x3060`):
                </label>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                  {gainDb} dB ({pendingGainHex})
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="18"
                step="3"
                value={gainDb}
                onChange={(e) => handleGainChange(parseInt(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0 dB (1.0x)</span>
                <span>6 dB (2.0x)</span>
                <span>12 dB (4.0x)</span>
                <span>18 dB (8.0x)</span>
              </div>
            </div>

            {/* Step 1: I2C Write Button */}
            <div className="flex justify-end pt-1">
              <button
                onClick={handleI2CWrite}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition text-xs shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>1단계: I2C Write 전송 (대기 버퍼 적재)</span>
              </button>
            </div>
          </div>

          {/* Pending vs Live Register Blocks */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Pending Register Box */}
            <div
              className={`p-3.5 rounded-xl text-center space-y-1 transition-all border ${
                hasPendingWrite
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/30'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
              }`}
            >
              <span className="text-amber-800 dark:text-amber-300 font-bold block text-xs">
                대기 레지스터 (Pending)
              </span>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                I2C 수신 대기 버퍼
              </span>
              <div className="font-mono text-sm font-black text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-900 py-1.5 rounded border border-amber-300 dark:border-amber-800 mt-2">
                {pendingExposureHex} / {pendingGainHex}
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {exposureMs}ms · {gainDb}dB
              </span>
            </div>

            {/* Live Register Box */}
            <div className="p-3.5 rounded-xl text-center space-y-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800">
              <span className="text-emerald-800 dark:text-emerald-300 font-bold block text-xs">
                활성 레지스터 (Live)
              </span>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                현재 센서 화소 노출 중
              </span>
              <div className="font-mono text-sm font-black text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 py-1.5 rounded border border-emerald-300 dark:border-emerald-800 mt-2">
                {liveExposureHex} / {liveGainHex}
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {liveExposureMs}ms · {liveGainDb}dB
              </span>
            </div>
          </div>

          {/* Step 2: Trigger Frame Start VSync */}
          <div className="pt-1">
            <button
              onClick={handleFrameStartVSync}
              className={`w-full py-2.5 rounded-xl font-medium text-xs flex items-center justify-center space-x-2 shadow-sm transition ${
                hasPendingWrite
                  ? 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>2단계: Frame Start VSync 발생 (Pending → Live 복사)</span>
            </button>
            <p
              className={`text-[11px] text-center mt-2 font-mono leading-tight ${
                hasPendingWrite
                  ? 'text-amber-600 dark:text-amber-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {i2cStatusLog}
            </p>
          </div>
        </div>

        {/* 256x16 SRAM Context Switching & Comparison Table */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>256×16 SRAM 컨텍스트 스위칭 (Context Switching)</span>
            </h3>
            <span className="text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-mono font-semibold px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
              R0x30B0[13]
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            AR0234CS는 센서 내부 고속 SRAM에 2개 이상의 해상도/프레임 프로필을 미리 로딩해두고, 단일 비트 토글만으로 1 프레임 지연 없이 해상도와 타이밍을 교체합니다.
          </p>

          {/* Context Switch Controller Widget */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                현재 활성화된 센서 컨텍스트:
              </span>
              <span
                className={`text-xs font-mono font-bold ${
                  activeContext === 'A'
                    ? 'text-blue-600 dark:text-blue-400'
                    : activeContext === 'B'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-purple-600 dark:text-purple-400'
                }`}
              >
                {activeContext === 'A' && 'Context A: Full HD 1080p @ 60fps (1920×1080)'}
                {activeContext === 'B' && 'Context B: High-Speed HD 720p @ 120fps (1280×720)'}
                {activeContext === 'C' && 'Context C: 2.3MP Native @ 90fps (1920×1200)'}
              </span>
            </div>

            <button
              onClick={toggleContext}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition shadow-sm"
            >
              <ToggleRight className="w-4 h-4" />
              <span>`R0x30B0[13]` 컨텍스트 전환</span>
            </button>
          </div>

          {/* Table Filters & Search */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="레지스터 검색 (주소/이름)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-800 dark:text-slate-200 focus:outline-none w-40"
              />
            </div>

            <div className="flex items-center space-x-1 text-[11px]">
              <span className="text-slate-400">카테고리:</span>
              {(['all', 'geometry', 'timing', 'gain', 'mode'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-0.5 rounded transition ${
                    categoryFilter === cat
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Register Comparison Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-2.5 font-bold">주소</th>
                  <th className="p-2.5 font-bold">레지스터 명칭</th>
                  <th className="p-2.5 font-bold">기능 설명</th>
                  <th className="p-2.5 font-bold text-blue-700 dark:text-blue-400">
                    Context A (1080p)
                  </th>
                  <th className="p-2.5 font-bold text-emerald-700 dark:text-emerald-400">
                    Context B (720p)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                {filteredRegisters.map((reg) => {
                  const isContextAActive = activeContext === 'A';
                  const isContextBActive = activeContext === 'B';
                  return (
                    <tr
                      key={reg.address}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-2.5 font-semibold text-slate-900 dark:text-slate-100">
                        {reg.address}
                      </td>
                      <td className="p-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">
                        {reg.name}
                      </td>
                      <td className="p-2.5 font-sans text-slate-500 dark:text-slate-400 max-w-[180px] truncate">
                        {reg.description}
                      </td>
                      <td
                        className={`p-2.5 transition-colors ${
                          isContextAActive
                            ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {reg.contextA}
                      </td>
                      <td
                        className={`p-2.5 transition-colors ${
                          isContextBActive
                            ? 'font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {reg.contextB}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
