import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode, FileJson } from 'lucide-react';
import { REGISTER_DATABASE, XU_CONTROLS, PROTOCOL_LAYERS } from '../data/cameraData';
import { AR0234_DETAILED_REGISTERS } from '../data/ar0234Registers';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [exportFormat, setExportFormat] = useState<'json' | 'c_header'>('json');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const exportData = {
    camera: 'Hampotech AR0234 2MP USB Global Shutter Camera',
    sensor: 'onsemi AR0234CS',
    opticalFormat: '1/2.6" BSI CMOS, 3.0um pixel',
    interface: ['USB 2.0 High-Speed', 'USB 3.0 SuperSpeed', 'UVC 1.5'],
    mipi: '4-Lane MIPI D-PHY v1.2 (3.6Gbps)',
    i2cSlaveAddress: '0x20',
    summaryRegisters: REGISTER_DATABASE,
    detailedBitfieldRegisters: AR0234_DETAILED_REGISTERS,
    xuControls: XU_CONTROLS,
    layers: PROTOCOL_LAYERS.map((l) => ({
      level: l.level,
      name: l.name,
      bus: l.bus,
    })),
    exportedAt: new Date().toISOString(),
  };

  const jsonString = JSON.stringify(exportData, null, 2);

  const cHeaderString = `/* 
 * Hampotech AR0234 Global Shutter Camera V4L2 Definition Header
 * Generated for onsemi AR0234CS ISP UVC 1.5 Subsystem
 */

#ifndef HAMPOTECH_AR0234_UVC_H
#define HAMPOTECH_AR0234_UVC_H

#include <linux/types.h>
#include <linux/videodev2.h>
#include <linux/uvcvideo.h>

#define HAMPO_XU_UNIT_ID 0x03

/* V4L2 Custom Control IDs */
#define V4L2_CID_USER_HAMPO_TRIG_MODE    (V4L2_CID_USER_BASE + 0x1001)
#define V4L2_CID_USER_HAMPO_FLASH_DELAY  (V4L2_CID_USER_BASE + 0x1002)
#define V4L2_CID_USER_HAMPO_REG_DIRECT   (V4L2_CID_USER_BASE + 0x1003)
#define V4L2_CID_USER_HAMPO_ROI_CROP     (V4L2_CID_USER_BASE + 0x1004)

/* 16-Byte GUIDs */
static const __u8 HAMPO_TRIG_GUID[16] = {
    0x48, 0x61, 0x6d, 0x70, 0x6f, 0x74, 0x65, 0x63, 
    0x68, 0x41, 0x30, 0x32, 0x33, 0x34, 0x00, 0x01
};

static const __u8 HAMPO_FLASH_GUID[16] = {
    0x48, 0x61, 0x6d, 0x70, 0x6f, 0x74, 0x65, 0x63, 
    0x68, 0x41, 0x30, 0x32, 0x33, 0x34, 0x00, 0x02
};

/* Register Addresses */
#define AR0234_REG_X_ADDR_END            0x3004
#define AR0234_REG_Y_ADDR_END            0x3006
#define AR0234_REG_FRAME_LENGTH_LINES    0x300A
#define AR0234_REG_COARSE_INTEGRATION    0x3012
#define AR0234_REG_RESET_MODE            0x301A
#define AR0234_REG_ANALOGUE_GAIN         0x3060
#define AR0234_REG_CONTEXT_TOGGLE        0x30B0

#endif /* HAMPOTECH_AR0234_UVC_H */
`;

  const activeContent = exportFormat === 'json' ? jsonString : cHeaderString;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = exportFormat === 'json' ? 'ar0234_workbench_spec.json' : 'hampotech_ar0234.h';
    const mimeType = exportFormat === 'json' ? 'application/json' : 'text/x-csrc';
    const blob = new Blob([activeContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              카메라 프로토콜 & 레지스터 사양 내보내기
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setExportFormat('json')}
                className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center space-x-1 ${
                  exportFormat === 'json'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
              <button
                onClick={() => setExportFormat('c_header')}
                className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center space-x-1 ${
                  exportFormat === 'c_header'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>C Header (.h)</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-950 font-mono text-[11px] text-slate-200">
          <pre className="whitespace-pre-wrap">{activeContent}</pre>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            {exportFormat === 'json' ? 'ar0234_workbench_spec.json' : 'hampotech_ar0234.h'}
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition flex items-center space-x-1"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>복사됨</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>클립보드 복사</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition flex items-center space-x-1 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>파일 다운로드</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
