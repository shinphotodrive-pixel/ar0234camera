import React, { useState } from 'react';
import { Cable, Zap, Shield, CheckCircle2, AlertCircle, Cpu, Thermometer, Radio, Eye } from 'lucide-react';

export const PinoutSpecsTab: React.FC = () => {
  const [activeConnector, setActiveConnector] = useState<'jst6' | 'jst4'>('jst6');
  const [trigPulseWidthNs, setTrigPulseWidthNs] = useState<number>(150);

  const isPulseWidthValid = trigPulseWidthNs >= 125;

  const jst6Pins = [
    { pin: 1, name: 'VBUS (5V)', color: 'text-red-500', desc: 'USB 전원 입력 (DC +5.0V ± 5%, 최대 350mA)' },
    { pin: 2, name: 'USB D-', color: 'text-white bg-slate-600 px-1 rounded', desc: 'USB 2.0 고속 차동 데이터 신호 (-)' },
    { pin: 3, name: 'USB D+', color: 'text-emerald-500', desc: 'USB 2.0 고속 차동 데이터 신호 (+)' },
    { pin: 4, name: 'GND', color: 'text-slate-800 dark:text-slate-200', desc: '공통 접지 (Power & Signal Ground)' },
    { pin: 5, name: 'TRIG_IN', color: 'text-amber-500', desc: '외부 하드웨어 트리거 입력 (1.8V ~ 3.3V LVCMOS, <125ns 지연)' },
    { pin: 6, name: 'FLASH_OUT', color: 'text-blue-500', desc: '스트로브 조명 동기화 출력 (1.8V ~ 3.3V Push-Pull/Open Drain)' },
  ];

  const jst4Pins = [
    { pin: 1, name: 'VBUS (5V)', color: 'text-red-500', desc: 'USB 전원 공급 (+5.0V)' },
    { pin: 2, name: 'USB D-', color: 'text-white bg-slate-600 px-1 rounded', desc: '차동 데이터 D-' },
    { pin: 3, name: 'USB D+', color: 'text-emerald-500', desc: '차동 데이터 D+' },
    { pin: 4, name: 'GND', color: 'text-slate-800 dark:text-slate-200', desc: '접지 (Ground)' },
  ];

  return (
    <div className="space-y-6">
      {/* Intro Box */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2 mb-1">
          <Cable className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Hampotech AR0234 물리적 핀아웃 & 전기적 하드웨어 사양</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          산업용 비전 및 로봇 설비에 결합할 때 필요한 물리적 JST 커넥터 핀 배열, 옵토커플러(포토커플러) 절연 인터페이스 회로, 그리고 onsemi AR0234CS 센서 모듈의 광학/전기적 상세 스펙입니다.
        </p>
      </div>

      {/* Pinout Inspector & Optocoupler Circuit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Connector Pinout Map (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>JST 커넥터 핀아웃 맵 (Pinout Map)</span>
            </h3>

            <div className="flex items-center space-x-1 text-xs">
              <button
                onClick={() => setActiveConnector('jst6')}
                className={`px-2.5 py-1 rounded font-semibold transition ${
                  activeConnector === 'jst6'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                JST 6-Pin (USB + 트리거)
              </button>
              <button
                onClick={() => setActiveConnector('jst4')}
                className={`px-2.5 py-1 rounded font-semibold transition ${
                  activeConnector === 'jst4'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                JST 4-Pin (USB 전용)
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            {activeConnector === 'jst6'
              ? 'Hampotech 모듈 후면 6-Pin JST 1.25mm 피치 커넥터: USB 통신 라인과 외부 하드웨어 동기화 신호를 모두 수용합니다.'
              : '표준 4-Pin USB 2.0 전용 커넥터 배선입니다.'}
          </p>

          <div className="space-y-2 text-xs font-mono">
            {(activeConnector === 'jst6' ? jst6Pins : jst4Pins).map((pin) => (
              <div
                key={pin.pin}
                className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-start space-x-3"
              >
                <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0 text-xs">
                  {pin.pin}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${pin.color}`}>{pin.name}</span>
                    <span className="text-[10px] text-slate-400">Pin {pin.pin}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans mt-0.5">
                    {pin.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Trigger Pulse Width Validator */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                TRIG 펄스 폭 (Pulse Width) 검증:
              </span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {trigPulseWidthNs} ns
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="500"
              step="25"
              value={trigPulseWidthNs}
              onChange={(e) => setTrigPulseWidthNs(parseInt(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex items-center space-x-1.5 text-[11px] pt-1 font-sans">
              {isPulseWidthValid ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                    규격 충족: 125ns 이상의 High 레벨이 인가되어 센서가 안정적으로 수광을 개시합니다.
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span className="text-rose-700 dark:text-rose-300 font-medium">
                    펄스 폭 부족! 센서 최소 감지 임계치(125ns) 미만이므로 트리거가 무시될 수 있습니다.
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Hardware Specifications Table (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>AR0234CS 모듈 종합 하드웨어 사양서</span>
            </h3>
            <span className="text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono font-semibold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
              onsemi AR0234CS
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans text-slate-700 dark:text-slate-300">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100 w-36">센서 제조사 / 모델</td>
                  <td className="p-2.5 font-mono">onsemi AR0234CS (글로벌 셔터 CMOS)</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">유효 화소수</td>
                  <td className="p-2.5 font-mono">1920 (H) × 1200 (V) (2.3 Megapixels)</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">광학 포맷 / 픽셀 크기</td>
                  <td className="p-2.5 font-mono">1/2.6인치 (8.92mm 대각선) / 3.0 µm × 3.0 µm BSI</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">셔터 방식 & 셔터 효율</td>
                  <td className="p-2.5 font-mono text-blue-600 dark:text-blue-400 font-bold">전 화소 동시 노출 글로벌 셔터 (효율 99.9%)</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">최대 프레임 레이트</td>
                  <td className="p-2.5 font-mono">120 fps @ 1920×1200 (USB 3.0 or MJPEG)</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">동적 범위 (Dynamic Range)</td>
                  <td className="p-2.5 font-mono">71.4 dB (선형 모드)</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">렌즈 마운트 & 필터</td>
                  <td className="p-2.5 font-mono">M12 × P0.5 표준 마운트 / 650nm IR-Cut 필터</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">소비 전력 & 발열</td>
                  <td className="p-2.5 font-mono">동작 시 약 1.2W (DC 5V @ 240mA)</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">동작 온도 범위</td>
                  <td className="p-2.5 font-mono">-20°C ~ +70°C (산업용 등급 인증)</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">모듈 외형 치수</td>
                  <td className="p-2.5 font-mono">38mm × 38mm (표준 산업용 카메라 PCB)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Optocoupler Isolation Note */}
          <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 p-3.5 rounded-xl text-xs space-y-1">
            <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center space-x-1.5">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>산업 현장 서지 보호 (Optocoupler Isolation 권장안)</span>
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
              공장 자동화 PLC(24V 로직)와 카메라의 `TRIG_IN`(1.8V~3.3V)을 직결하면 센서 ISP가 영구 파손됩니다. 반드시 고속 포토커플러(예: 6N137, TLP2362)를 사용한 절연 회로를 구성하여 그라운드 루프 노이즈와 역기전력을 완벽 차단하십시오.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
