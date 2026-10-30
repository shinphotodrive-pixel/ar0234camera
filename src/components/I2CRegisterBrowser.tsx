import React, { useState, useMemo } from 'react';
import {
  Binary,
  Search,
  RotateCcw,
  Send,
  Download,
  Check,
  AlertCircle,
  Cpu,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Lock,
  ArrowRight,
  Eye,
  Radio,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { AR0234_DETAILED_REGISTERS } from '../data/ar0234Registers';
import { DetailedRegister, BitSlice } from '../types';

export const I2CRegisterBrowser: React.FC = () => {
  // State: selected register
  const [selectedAddress, setSelectedAddress] = useState<string>('0x301A');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Maintain runtime register values (address -> 16-bit number)
  const [registerValues, setRegisterValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    AR0234_DETAILED_REGISTERS.forEach((reg) => {
      initial[reg.addressHex] = reg.defaultValue;
    });
    return initial;
  });

  // I2C bus traffic log
  const [i2cBusLogs, setI2cBusLogs] = useState<string[]>([
    '[INIT] I2C Bus Master Ready (SCL: 400kHz Fast-Mode, Slave Address: 0x20)',
    '[READY] AR0234CS Registers Loaded from Datasheet Specification',
  ]);

  const activeRegister = useMemo(() => {
    return (
      AR0234_DETAILED_REGISTERS.find((r) => r.addressHex === selectedAddress) ||
      AR0234_DETAILED_REGISTERS[1]
    );
  }, [selectedAddress]);

  const currentValue = registerValues[activeRegister.addressHex] ?? activeRegister.defaultValue;

  // Bit toggle handler
  const toggleBit = (bitIndex: number) => {
    if (activeRegister.access === 'RO') return;

    // Check if the bit slice is RO
    const slice = activeRegister.bitfields.find(
      (b) => bitIndex <= b.startBit && bitIndex >= b.endBit
    );
    if (slice?.access === 'RO') return;

    const newValue = currentValue ^ (1 << bitIndex);
    updateRegisterValue(activeRegister.addressHex, newValue, `Bit [${bitIndex}] 토글`);
  };

  const updateRegisterValue = (addressHex: string, newValue: number, reason: string) => {
    const clampedValue = newValue & 0xffff;
    setRegisterValues((prev) => ({
      ...prev,
      [addressHex]: clampedValue,
    }));

    const hexVal = '0x' + clampedValue.toString(16).padStart(4, '0').toUpperCase();
    const addrMsb = '0x' + addressHex.slice(2, 4);
    const addrLsb = '0x' + addressHex.slice(4, 6);
    const dataMsb = '0x' + hexVal.slice(2, 4);
    const dataLsb = '0x' + hexVal.slice(4, 6);

    const logEntry = `[I2C WRITE] SLA:0x20 ADDR:${addrMsb} ${addrLsb} DATA:${dataMsb} ${dataLsb} (${hexVal}) → ${reason}`;
    setI2cBusLogs((prev) => [logEntry, ...prev.slice(0, 19)]);
  };

  // Direct Hex Input change
  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    try {
      const num = parseInt(raw, 16);
      if (!isNaN(num)) {
        updateRegisterValue(activeRegister.addressHex, num, '직접 Hex 입력');
      }
    } catch {
      // ignore
    }
  };

  // Reset current register to default
  const handleResetRegister = () => {
    updateRegisterValue(
      activeRegister.addressHex,
      activeRegister.defaultValue,
      '기본 데이터시트 값 복원'
    );
  };

  // Presets
  const applyPreset = (presetName: string) => {
    if (presetName === 'trigger_mode') {
      // Enable global shutter, enable external trigger, pulsed mode in 0x30CE
      updateRegisterValue('0x30CE', 0x000D, '하드웨어 외부 트리거(Pulsed) 프리셋');
      updateRegisterValue('0x301A', 0x10DC, '스트리밍 레디');
    } else if (presetName === 'test_color_bars') {
      // Set test pattern to Color Bars (0x0002) in 0x305E
      updateRegisterValue('0x305E', 0x0002, 'SMPTE 컬러바 BIST 패턴 활성화');
    } else if (presetName === 'standby') {
      // Set bit 11 in 0x301A (Standby Mode = 1)
      const current = registerValues['0x301A'] ?? 0x10dc;
      updateRegisterValue('0x301A', current | (1 << 11), '초저전력 Standby 모드 진입');
    } else if (presetName === 'mirror_flip') {
      // Set bit 0 (mirror) & bit 1 (flip) in 0x3040
      updateRegisterValue('0x3040', 0x0003, '상하/좌우 영상 미러 플립 반전');
    } else if (presetName === 'reset_all') {
      const resetMap: Record<string, number> = {};
      AR0234_DETAILED_REGISTERS.forEach((r) => {
        resetMap[r.addressHex] = r.defaultValue;
      });
      setRegisterValues(resetMap);
      setI2cBusLogs((prev) => [
        `[FACTORY RESET] 전체 ${AR0234_DETAILED_REGISTERS.length}개 레지스터 초기화 완료`,
        ...prev,
      ]);
    }
  };

  // Compute live simulated hardware telemetry based on current register states
  const hardwareStatus = useMemo(() => {
    const reg301A = registerValues['0x301A'] ?? 0x10dc;
    const reg30CE = registerValues['0x30CE'] ?? 0x0005;
    const reg3040 = registerValues['0x3040'] ?? 0x0000;
    const reg305E = registerValues['0x305E'] ?? 0x0000;
    const reg3060 = registerValues['0x3060'] ?? 0x0020;
    const reg3012 = registerValues['0x3012'] ?? 0x04e2;
    const reg31BE = registerValues['0x31BE'] ?? 0x0004;

    const isStandby = (reg301A & (1 << 11)) !== 0;
    const isStreaming = (reg301A & (1 << 2)) !== 0 && !isStandby;
    const isGlobalShutter = (reg30CE & (1 << 0)) !== 0;
    const isFlashEnabled = (reg30CE & (1 << 1)) !== 0;
    const isExternalTrigger = (reg30CE & (1 << 3)) !== 0;
    const triggerModeType = (reg30CE & (1 << 4)) !== 0 ? 'Sync-Sink (120fps)' : 'Pulsed (Single)';

    const isMirror = (reg3040 & (1 << 0)) !== 0;
    const isFlip = (reg3040 & (1 << 1)) !== 0;
    const testPatternCode = reg305E & 0x07;

    const coarseGainCode = (reg3060 >> 6) & 0x07;
    const gainMultipliers = [1.0, 2.0, 4.0, 8.0, 16.0, 16.0, 16.0, 16.0];
    const gainMultiplier = gainMultipliers[coarseGainCode] || 1.0;
    const gainDb = (20 * Math.log10(gainMultiplier)).toFixed(1);

    const exposureMs = ((reg3012 * 2200) / 74250000) * 1000; // based on 74.25MHz pixel clock approx

    const mipiLanes = (reg31BE & 0x04) !== 0 ? '4-Lane (3.6Gbps)' : (reg31BE & 0x02) !== 0 ? '2-Lane (1.8Gbps)' : '1-Lane';

    return {
      streamState: isStandby ? 'STANDBY (저전력 대기)' : isStreaming ? 'STREAMING (영상 출력 중)' : 'IDLE (정지)',
      streamColor: isStandby ? 'text-amber-500' : isStreaming ? 'text-emerald-500' : 'text-slate-400',
      shutterType: isGlobalShutter ? '글로벌 셔터 (Global Shutter 0% Skew)' : '롤링 셔터 (Electronic Rolling)',
      shutterColor: isGlobalShutter ? 'text-blue-500' : 'text-amber-500',
      triggerState: isExternalTrigger ? `외부 트리거 인가 [${triggerModeType}]` : '연속 자유 스트리밍 (Free-Run)',
      triggerColor: isExternalTrigger ? 'text-purple-500' : 'text-slate-400',
      flashPinState: isFlashEnabled ? 'FLASH 스트로브 활성 (Active)' : 'FLASH 핀 차단 (Disabled)',
      orientation: `${isMirror ? '좌우 미러' : '정방향'} / ${isFlip ? '상하 반전' : '정방향'}`,
      testPattern:
        testPatternCode === 0
          ? '정상 센서 화소 스트림 (Normal Live Bayer)'
          : testPatternCode === 1
          ? 'BIST: 단색 솔리드 컬러 (Solid Color)'
          : testPatternCode === 2
          ? 'BIST: SMPTE 8색 수직 컬러바 (Color Bars)'
          : testPatternCode === 3
          ? 'BIST: Walking 1s 비트 패턴'
          : 'BIST: 그라디언트 페이드',
      testPatternColor: testPatternCode === 0 ? 'text-slate-400' : 'text-emerald-500 font-bold',
      gain: `${gainMultiplier.toFixed(1)}x (+${gainDb} dB)`,
      exposure: `${exposureMs.toFixed(2)} ms (${reg3012} 라인)`,
      mipiLanes,
    };
  }, [registerValues]);

  // Filtered register list
  const filteredRegisters = AR0234_DETAILED_REGISTERS.filter((reg) => {
    const matchesSearch =
      reg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.addressHex.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || reg.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <Binary className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>AR0234 데이터시트 I2C 레지스터 브라우저 & 16-Bit 비트필드 자극기</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
              onsemi AR0234CS 데이터시트의 16비트 레지스터 맵을 직접 탐색하고, 각 레지스터의 비트 단위 플래그를 실시간 토글하여 센서 내부 하드웨어의 동작 상태(글로벌 셔터, 외부 트리거, 스트리밍, BIST 컬러바, 게인, 미러링)를 자극(Stimulation)하고 검증할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] mr-1">빠른 하드웨어 자극 프리셋:</span>
            <button
              onClick={() => applyPreset('trigger_mode')}
              className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 font-semibold rounded-lg border border-purple-200 dark:border-purple-800 text-[11px] transition"
            >
              외부 트리거 모드
            </button>
            <button
              onClick={() => applyPreset('test_color_bars')}
              className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-semibold rounded-lg border border-emerald-200 dark:border-emerald-800 text-[11px] transition"
            >
              컬러바 BIST
            </button>
            <button
              onClick={() => applyPreset('mirror_flip')}
              className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold rounded-lg border border-blue-200 dark:border-blue-800 text-[11px] transition"
            >
              상하/좌우 반전
            </button>
            <button
              onClick={() => applyPreset('reset_all')}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] transition flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>전체 리셋</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Hardware Stimulation Telemetry HUD */}
      <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              실시간 센서 하드웨어 상태 자극 모니터 (Live Hardware Stimulation Telemetry)
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>I2C Link Active (0x20)</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">동작 전력 상태 (`R0x301A`):</span>
            <span className={`font-mono font-bold text-xs ${hardwareStatus.streamColor}`}>
              {hardwareStatus.streamState}
            </span>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">셔터 코어 모드 (`R0x30CE[0]`):</span>
            <span className={`font-mono font-bold text-xs ${hardwareStatus.shutterColor}`}>
              {hardwareStatus.shutterType}
            </span>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">트리거 & 플래시 (`R0x30CE`):</span>
            <span className={`font-mono font-bold text-xs ${hardwareStatus.triggerColor}`}>
              {hardwareStatus.triggerState}
            </span>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">테스트 패턴 BIST (`R0x305E`):</span>
            <span className={`font-mono text-xs ${hardwareStatus.testPatternColor}`}>
              {hardwareStatus.testPattern}
            </span>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">영상 오리엔테이션 (`R0x3040`):</span>
            <span className="font-mono font-bold text-xs text-slate-200">
              {hardwareStatus.orientation}
            </span>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">아날로그 게인 (`R0x3060`):</span>
            <span className="font-mono font-bold text-xs text-blue-400">
              {hardwareStatus.gain}
            </span>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">노출 시간 (`R0x3012`):</span>
            <span className="font-mono font-bold text-xs text-amber-400">
              {hardwareStatus.exposure}
            </span>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">MIPI D-PHY 대역폭 (`R0x31BE`):</span>
            <span className="font-mono font-bold text-xs text-slate-200">
              {hardwareStatus.mipiLanes}
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Workspace: Left Register Browser (5 cols), Right Bitfield Manipulator (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Register Catalog & Search (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>AR0234CS 레지스터 카탈로그</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {filteredRegisters.length}개 탐색됨
            </span>
          </div>

          {/* Search Bar */}
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="레지스터 주소 (0x301A) 또는 이름 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-800 dark:text-slate-200 focus:outline-none w-full"
            />
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-1 text-[10px]">
            {(['all', 'system', 'shutter', 'geometry', 'timing', 'gain', 'test', 'mipi'] as const).map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 rounded-md font-medium transition ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'all'
                    ? '전체'
                    : cat === 'system'
                    ? '시스템'
                    : cat === 'shutter'
                    ? '셔터/트리거'
                    : cat === 'geometry'
                    ? '지오메트리'
                    : cat === 'timing'
                    ? '타이밍'
                    : cat === 'gain'
                    ? '게인'
                    : cat === 'test'
                    ? '테스트'
                    : 'MIPI'}
                </button>
              )
            )}
          </div>

          {/* Register List */}
          <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
            {filteredRegisters.map((reg) => {
              const isSelected = reg.addressHex === activeRegister.addressHex;
              const val = registerValues[reg.addressHex] ?? reg.defaultValue;
              const hexStr = '0x' + val.toString(16).padStart(4, '0').toUpperCase();

              return (
                <div
                  key={reg.addressHex}
                  onClick={() => setSelectedAddress(reg.addressHex)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-500 shadow-sm ring-1 ring-blue-500/30'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                        {reg.addressHex}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                        {reg.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                      <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">
                        {hexStr}
                      </span>
                      <span
                        className={`text-[9px] px-1 py-0.5 rounded font-bold uppercase ${
                          reg.access === 'RO'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {reg.access}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate">
                    {reg.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: 16-Bit Bitfield Stimulator & Live Controller (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          {/* Header of Active Register */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm font-black text-blue-600 dark:text-blue-400">
                  {activeRegister.addressHex}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {activeRegister.name}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                    activeRegister.access === 'RO'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {activeRegister.access} (16-bit)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {activeRegister.description}
              </p>
            </div>

            <button
              onClick={handleResetRegister}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center space-x-1 transition font-medium"
              title="데이터시트 기본값 복원"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>기본값 복원</span>
            </button>
          </div>

          {/* Quick Value Formats: Hex / Binary / Dec */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 dark:text-slate-400 font-sans">Hex:</span>
              <input
                type="text"
                disabled={activeRegister.access === 'RO'}
                value={'0x' + currentValue.toString(16).padStart(4, '0').toUpperCase()}
                onChange={handleHexInputChange}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded text-blue-600 dark:text-blue-400 font-bold text-sm w-28 text-center focus:outline-none focus:border-blue-500 disabled:opacity-60"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-500 dark:text-slate-400 font-sans">Dec:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {currentValue.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-500 dark:text-slate-400 font-sans">Default:</span>
              <span className="text-slate-600 dark:text-slate-400">
                0x{activeRegister.defaultValue.toString(16).padStart(4, '0').toUpperCase()}
              </span>
            </div>
          </div>

          {/* 16-Bit Interactive Grid (Bit 15 to Bit 0) */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                16-Bit 비트필드 조작기 (클릭하여 0/1 토글):
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                [MSB 15 ────── 0 LSB]
              </span>
            </div>

            {/* 16 Bit Tiles */}
            <div className="grid grid-cols-8 sm:grid-cols-16 gap-1">
              {Array.from({ length: 16 }).map((_, idx) => {
                const bitIndex = 15 - idx; // from 15 down to 0
                const isSet = (currentValue & (1 << bitIndex)) !== 0;

                // Find slice description
                const bitSlice = activeRegister.bitfields.find(
                  (b) => bitIndex <= b.startBit && bitIndex >= b.endBit
                );
                const isReadOnly = activeRegister.access === 'RO' || bitSlice?.access === 'RO';

                return (
                  <button
                    key={bitIndex}
                    onClick={() => toggleBit(bitIndex)}
                    disabled={isReadOnly}
                    title={`Bit ${bitIndex}: ${bitSlice?.name || 'Bit'} (${isSet ? '1' : '0'}) - ${
                      isReadOnly ? 'Read-Only' : 'Click to Toggle'
                    }`}
                    className={`p-2 rounded-lg flex flex-col items-center justify-between border text-center transition-all ${
                      isSet
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    } ${isReadOnly ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                  >
                    <span className="text-[9px] font-mono opacity-70">
                      {bitIndex}
                    </span>
                    <span className="font-mono text-sm leading-none my-1">
                      {isSet ? '1' : '0'}
                    </span>
                    {isReadOnly && (
                      <Lock className="w-2.5 h-2.5 opacity-60 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Nibbles representation */}
            <div className="grid grid-cols-4 text-center text-[10px] font-mono text-slate-400 mt-1">
              <span>[15:12] Nibble 3</span>
              <span>[11:8] Nibble 2</span>
              <span>[7:4] Nibble 1</span>
              <span>[3:0] Nibble 0</span>
            </div>
          </div>

          {/* Active Hardware Effect Description Box */}
          <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 p-3.5 rounded-xl text-xs space-y-1">
            <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>하드웨어 자극 효과 분석 (Hardware Stimulation Effect)</span>
            </span>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
              {activeRegister.effectDescription || activeRegister.description}
            </p>
          </div>

          {/* Bitfields Table breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              비트필드 정의 및 슬라이스 값 (Bitfield Slices):
            </h4>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-[11px]">
                    <th className="p-2 font-bold w-16">비트 범위</th>
                    <th className="p-2 font-bold w-36">필드 명칭</th>
                    <th className="p-2 font-bold">기능 설명</th>
                    <th className="p-2 font-bold w-20 text-center">권한</th>
                    <th className="p-2 font-bold w-24 text-right">현재 값</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
                  {activeRegister.bitfields.map((field, i) => {
                    const mask =
                      ((1 << (field.startBit - field.endBit + 1)) - 1) << field.endBit;
                    const sliceVal = (currentValue & mask) >> field.endBit;
                    const sliceHex = '0x' + sliceVal.toString(16).toUpperCase();

                    return (
                      <tr
                        key={i}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="p-2 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {field.startBit === field.endBit
                            ? `[${field.startBit}]`
                            : `[${field.startBit}:${field.endBit}]`}
                        </td>
                        <td className="p-2 font-mono font-medium text-slate-900 dark:text-slate-100">
                          {field.name}
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-400 leading-tight">
                          {field.description}
                        </td>
                        <td className="p-2 text-center font-mono text-[10px]">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                              field.access === 'RO'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            {field.access}
                          </span>
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                          {sliceHex} ({sliceVal})
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* I2C Bus Live Packet Traffic Console */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                <span>실시간 I2C 2-Wire 트래픽 패킷 덤프 (400kHz Fast-Mode)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Slave Write: 0x20 / Read: 0x21
              </span>
            </div>

            <div className="bg-slate-950 text-slate-300 p-3 rounded-xl font-mono text-[10px] leading-relaxed space-y-1 max-h-28 overflow-y-auto border border-slate-800">
              {i2cBusLogs.map((log, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <span className="text-emerald-400 shrink-0">➜</span>
                  <span className={idx === 0 ? 'text-emerald-300 font-bold' : 'text-slate-400'}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
