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
