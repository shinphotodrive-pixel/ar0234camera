import React, { useState, useEffect } from 'react';
import { TabType } from './types';
import { Header } from './components/Header';
import { ProtocolStackTab } from './components/ProtocolStackTab';
import { SensorI2CTab } from './components/SensorI2CTab';
import { UVCTopologyTab } from './components/UVCTopologyTab';
import { BandwidthPayloadTab } from './components/BandwidthPayloadTab';
import { GlobalShutterTab } from './components/GlobalShutterTab';
import { PinoutSpecsTab } from './components/PinoutSpecsTab';
import { ExportModal } from './components/ExportModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('stack');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Sync dark class with documentElement
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex flex-col font-sans transition-colors">
      {/* Header with Navigation and Telemetry Badges */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        setIsDark={setIsDark}
        onExportConfig={() => setIsExportModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        {activeTab === 'stack' && <ProtocolStackTab />}
        {activeTab === 'i2c' && <SensorI2CTab />}
        {activeTab === 'uvc' && <UVCTopologyTab />}
        {activeTab === 'bandwidth' && <BandwidthPayloadTab />}
        {activeTab === 'shutter' && <GlobalShutterTab />}
        {activeTab === 'pinout' && <PinoutSpecsTab />}
      </main>

      {/* Global Minimalist Industrial Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 mt-auto transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Hampotech AR0234 2MP USB Global Shutter Camera Workbench
            </span>
            <span>·</span>
            <span>onsemi AR0234CS</span>
          </div>

          <div className="flex items-center space-x-3 font-mono text-[11px]">
            <span>UVC 1.1 / 1.5 Class</span>
            <span>·</span>
            <span>MIPI CSI-2 4-Lane (3.6Gbps)</span>
            <span>·</span>
            <span>Linux V4L2 Subsystem</span>
            <span>·</span>
            <span>HW Trigger &lt; 125ns</span>
          </div>
        </div>
      </footer>

      {/* Specification Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
