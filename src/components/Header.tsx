import React from 'react';
import { Cpu, Aperture, Cable, Zap, Sun, Moon, Download, Layers } from 'lucide-react';
import { TabType } from '../types';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onExportConfig: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  setIsDark,
  onExportConfig,
}) => {
  const navTabs: { id: TabType; label: string; num: string }[] = [
    { id: 'stack', label: '전계층 프로토콜 스택', num: '1' },
    { id: 'i2c', label: 'AR0234CS & I2C 제어', num: '2' },
    { id: 'uvc', label: 'UVC 토폴로지 & V4L2', num: '3' },
    { id: 'bandwidth', label: '대역폭 & USB 페이로드', num: '4' },
    { id: 'shutter', label: '글로벌 셔터 & 트리거', num: '5' },
    { id: 'pinout', label: '핀아웃 & 하드웨어 사양', num: '6' },
  ];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors">
      {/* Top 3-Zone Clean Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-base tracking-tight whitespace-nowrap">
                Hampotech AR0234 Protocol Workbench
              </span>
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                2MP Global Shutter
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              onsemi AR0234CS · MIPI CSI-2 · USB 2.0/3.0 UVC 1.5 · HW Trigger &lt; 125ns
            </p>
          </div>
        </div>

        {/* Zone 2: Hardware Spec Indicators (Clean unboxed text with separators) */}
        <div className="hidden lg:flex items-center space-x-3 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <div className="flex items-center space-x-1.5">
            <Aperture className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-slate-500 dark:text-slate-400 font-sans">센서:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-200">1920×1200 @ 120fps</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <div className="flex items-center space-x-1.5">
            <Cable className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-slate-500 dark:text-slate-400 font-sans">버스:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-200">USB 2.0 / 3.0 UVC</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <div className="flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-slate-500 dark:text-slate-400 font-sans">지연:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-200">&lt; 125 ns</span>
          </div>
        </div>

        {/* Zone 3: Primary Utility Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={onExportConfig}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-1.5 whitespace-nowrap"
            title="카메라 레지스터 및 프로토콜 진단 사양 JSON 내보내기"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">사양 내보내기</span>
          </button>

          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Navigation Segmented Tab Bar */}
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex space-x-1 overflow-x-auto text-xs font-medium border-t border-slate-100 dark:border-slate-800/80 py-1" aria-label="Tabs">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-900'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`w-4 h-4 rounded text-[10px] flex items-center justify-center font-bold ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {tab.num}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
