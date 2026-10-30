export type TabType = 'stack' | 'i2c' | 'uvc' | 'bandwidth' | 'shutter' | 'pinout';

export interface ProtocolLayer {
  level: number;
  id: string;
  name: string;
  subtitle: string;
  bus: string;
  description: string;
  props: { label: string; value: string }[];
  note: string;
  pinout?: string;
  bandwidth?: string;
}

export interface BitSlice {
  startBit: number; // e.g. 15
  endBit: number;   // e.g. 12
  name: string;
  description: string;
  access: 'RW' | 'RO' | 'WO';
}

export interface DetailedRegister {
  addressHex: string;
  name: string;
  description: string;
  category: 'system' | 'geometry' | 'timing' | 'gain' | 'shutter' | 'test' | 'mipi';
  defaultValue: number; // 16-bit integer (0x0000 - 0xFFFF)
  access: 'RW' | 'RO';
  bitfields: BitSlice[];
  effectDescription?: string;
}

export interface RegisterEntry {
  address: string;
  name: string;
  description: string;
  contextA: string;
  contextB: string;
  contextC?: string;
  category: 'geometry' | 'timing' | 'gain' | 'mode';
}

export interface XUControlSpec {
  id: string;
  name: string;
  guid: string;
  guidHexArray: string;
  selector: number;
  sizeBits: number;
  offsetBits: number;
  v4l2Id: string;
  v4l2Type: string;
  dataType: string;
  description: string;
  code: string;
  defaultVal: number | string;
}

export interface UVCNode {
  id: string;
  name: string;
  code: string;
  nodeIdHex: string;
  description: string;
  role: string;
  controls: string[];
}
