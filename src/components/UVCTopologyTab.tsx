import React, { useState } from 'react';
import { Terminal, Code2, Copy, Check, AlertTriangle, Layers, Play, CheckCircle2, FileCode } from 'lucide-react';
import { UVC_NODES, XU_CONTROLS } from '../data/cameraData';
import { UVCNode, XUControlSpec } from '../types';

export const UVCTopologyTab: React.FC = () => {
  const [selectedEntityId, setSelectedEntityId] = useState<string>('XU');
  const [selectedXUControlKey, setSelectedXUControlKey] = useState<string>('trigger_mode');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [uvcReqLog, setUvcReqLog] = useState<{
    request: string;
    payload: string;
    setupPacket: string;
    result: string;
  } | null>(null);

  const activeControl: XUControlSpec = XU_CONTROLS[selectedXUControlKey];
  const activeNode: UVCNode = UVC_NODES.find((n) => n.id === selectedEntityId) || UVC_NODES[2];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeControl.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const executeUVCRequest = (reqType: 'SET_CUR' | 'GET_CUR' | 'GET_INFO' | 'GET_MIN' | 'GET_MAX') => {
    let setup = '';
    let payload = '';
    let res = '';

    if (reqType === 'SET_CUR') {
      setup = `bmRequestType: 0x21 (Host-to-Device Class Interface), bRequest: 0x01 (SET_CUR), wValue: 0x0${activeControl.selector}00, wIndex: 0x0300 (Unit 0x03), wLength: ${activeControl.sizeBits / 8}`;
      payload = `Data: [ 0x01 ] (Trigger Mode: Pulsed Mode 활성화)`;
      res = `USB ACK Status: 0x00 (SUCCESS, Transaction Completed in 48 µs)`;
    } else if (reqType === 'GET_CUR') {
      setup = `bmRequestType: 0xA1 (Device-to-Host Class Interface), bRequest: 0x81 (GET_CUR), wValue: 0x0${activeControl.selector}00, wIndex: 0x0300 (Unit 0x03), wLength: ${activeControl.sizeBits / 8}`;
      payload = `Return: [ 0x01 ] (Current Active Setting)`;
      res = `USB Data In: 1 Byte Received, Handshake: ACK`;
    } else if (reqType === 'GET_INFO') {
      setup = `bmRequestType: 0xA1, bRequest: 0x86 (GET_INFO), wValue: 0x0${activeControl.selector}00, wIndex: 0x0300, wLength: 1`;
      payload = `Bitmask: 0x03 (D0=GET Supported, D1=SET Supported, D2=AutoDisabled, D3=Autoupdate)`;
      res = `Query Capabilities: Read & Write Permissions Verified`;
    } else if (reqType === 'GET_MIN') {
      setup = `bmRequestType: 0xA1, bRequest: 0x82 (GET_MIN), wValue: 0x0${activeControl.selector}00, wIndex: 0x0300`;
      payload = `Return: [ 0x00 ] (Minimum Allowed Parameter Value)`;
      res = `Range Check: Minimum Value 0`;
    } else if (reqType === 'GET_MAX') {
      setup = `bmRequestType: 0xA1, bRequest: 0x83 (GET_MAX), wValue: 0x0${activeControl.selector}00, wIndex: 0x0300`;
      payload = `Return: [ 0x02 ] (Maximum Allowed Parameter Value: Sync-Sink)`;
      res = `Range Check: Maximum Value 2`;
    }

    setUvcReqLog({
      request: reqType,
      setupPacket: setup,
      payload: payload,
      result: res,
    });
  };

  return (
    <div className="space-y-6">
      {/* Intro Box */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2 mb-1">
          <Terminal className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>UVC 디바이스 토폴로지 & Linux V4L2 `UVCIOC_CTRL_MAP` 매핑 아키텍처</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          USB 비디오 클래스(UVC) 표준 규격은 하드웨어를 엔터티(IT, PU, XU, OT) 단위로 모델링합니다. Hampotech AR0234의 외부 트리거, 플래시 지연 시간, I2C 직결 등의 기능은 <span className="font-semibold text-slate-800 dark:text-slate-200">Extension Unit (XU Node 0x03)</span>을 통해 제공되며, 리눅스 커널의 V4L2 서브시스템과 <span className="font-semibold text-slate-800 dark:text-slate-200">UVCIOC_CTRL_MAP IOCTL</span> 메커니즘으로 결합됩니다.
        </p>
      </div>

      {/* UVC Topology Visual Interactive Map */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            UVC 카메라 내부 엔터티 토폴로지 구조 (Entity Topology)
          </h3>
          <span className="text-xs text-slate-500 font-mono">신호 흐름: IT → PU → XU → OT</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {UVC_NODES.map((node) => {
            const isSelected = selectedEntityId === node.id;
            return (
              <div
                key={node.id}
                onClick={() => setSelectedEntityId(node.id)}
                className={`p-4 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-500 dark:border-blue-400 shadow-sm ring-1 ring-blue-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{node.name}</span>
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono px-1.5 py-0.5 rounded font-semibold">
                    {node.nodeIdHex}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
                  {node.description}
                </p>
                <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-medium">
                  대표 컨트롤: {node.controls[0]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Entity Details Drawer */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
          <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-slate-100 mb-1">
            <span>선택된 엔터티 역할: {activeNode.role}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {activeNode.controls.map((ctrl, i) => (
              <span
                key={i}
                className="bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px]"
              >
                {ctrl}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Linux V4L2 Control Mapping Code Generator & Request Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Configuration (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>V4L2 Control Mapper 파라미터</span>
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                매핑할 XU 벤더 컨트롤 기능 선택:
              </label>
              <select
                value={selectedXUControlKey}
                onChange={(e) => setSelectedXUControlKey(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-blue-500"
              >
                {Object.values(XU_CONTROLS).map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Spec Readout Box */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">XU GUID:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-[10px] break-all">
                  {activeControl.guid}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Unit ID / Selector:</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">
                  bUnitID = 0x03, Selector = {activeControl.selector}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Size / Data Type:</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">
                  {activeControl.sizeBits} bits ({activeControl.dataType})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">V4L2 Control ID:</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {activeControl.v4l2Id}
                </span>
              </div>
            </div>

            {/* UVC Standard Control Request Tester */}
            <div className="pt-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                USB EP0 UVC 제어 요청 (Control Request) 전송 테스트:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => executeUVCRequest('SET_CUR')}
                  className="bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold py-2 px-1 rounded-lg border border-blue-200 dark:border-blue-800 text-center transition"
                >
                  SET_CUR
                </button>
                <button
                  onClick={() => executeUVCRequest('GET_CUR')}
                  className="bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold py-2 px-1 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center transition"
                >
                  GET_CUR
                </button>
                <button
                  onClick={() => executeUVCRequest('GET_INFO')}
                  className="bg-purple-50 dark:bg-purple-950/70 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 font-bold py-2 px-1 rounded-lg border border-purple-200 dark:border-purple-800 text-center transition"
                >
                  GET_INFO
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => executeUVCRequest('GET_MIN')}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-center transition"
                >
                  GET_MIN (최솟값)
                </button>
                <button
                  onClick={() => executeUVCRequest('GET_MAX')}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-center transition"
                >
                  GET_MAX (최댓값)
                </button>
              </div>
            </div>

            {/* Request Inspection Results */}
            {uvcReqLog && (
              <div className="bg-slate-950 text-slate-200 p-3 rounded-xl font-mono text-[11px] space-y-1.5 border border-slate-800">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>[USB Packet Sent] {uvcReqLog.request}</span>
                  <span className="text-[10px] text-slate-400">Endpoint 0</span>
                </div>
                <div className="text-slate-400 text-[10px] leading-tight">
                  {uvcReqLog.setupPacket}
                </div>
                <div className="text-amber-300 text-[10px]">{uvcReqLog.payload}</div>
                <div className="text-emerald-400 text-[10px] pt-1 border-t border-slate-800">
                  {uvcReqLog.result}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generated C Code & Error Reference (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
              <FileCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>리눅스 C/C++ `uvc_xu_control_mapping` 소스 코드</span>
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono">
                IOCTL: UVCIOC_CTRL_MAP
              </span>
              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-md transition flex items-center space-x-1 border border-blue-200 dark:border-blue-900"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>코드 복사</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Code Viewer */}
          <pre className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800 max-h-96">
            <code>{activeControl.code}</code>
          </pre>

          {/* POSIX Error Codes Reference */}
          <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-3.5 rounded-xl text-xs space-y-1.5">
            <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>UVCIOC_CTRL_MAP 호출 시 발생 가능한 POSIX 에러 처리</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1 font-mono">
              <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded border border-amber-200/60 dark:border-amber-900/40">
                <strong className="text-amber-800 dark:text-amber-300">EPERM:</strong>
                <p className="text-slate-600 dark:text-slate-400 text-[10px] mt-0.5 font-sans">
                  루트 권한 부족 (`sudo` 또는 udev 규칙 필요)
                </p>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded border border-amber-200/60 dark:border-amber-900/40">
                <strong className="text-amber-800 dark:text-amber-300">EEXIST:</strong>
                <p className="text-slate-600 dark:text-slate-400 text-[10px] mt-0.5 font-sans">
                  이미 동일한 V4L2 CID가 매핑됨
                </p>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded border border-amber-200/60 dark:border-amber-900/40">
                <strong className="text-amber-800 dark:text-amber-300">EOVERFLOW:</strong>
                <p className="text-slate-600 dark:text-slate-400 text-[10px] mt-0.5 font-sans">
                  페이로드 크기나 비트 오프셋 초과
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
