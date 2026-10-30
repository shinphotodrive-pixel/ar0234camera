import { ProtocolLayer, RegisterEntry, XUControlSpec, UVCNode } from '../types';

export const PROTOCOL_LAYERS: ProtocolLayer[] = [
  {
    level: 5,
    id: 'l5',
    name: '호스트 OS & V4L2 / UVC 서브시스템',
    subtitle: 'Linux uvcvideo, V4L2 IOCTL, Windows DirectShow API',
    bus: 'V4L2 Subsystem / DirectShow KSCATEGORY_VIDEO_CAMERA',
    description: '호스트 운영체제(Linux/Windows)의 사용자 공간 애플리케이션이 카메라와 통신하는 최상위 소프트웨어 계층입니다. 표준 UVC 1.1/1.5 드라이버를 통해 표준 스트리밍을 수신하며, 커널 공간의 uvcvideo 드라이버가 UVCIOC_CTRL_MAP IOCTL 메커니즘을 수행하여 벤더 고유 Extension Unit(XU)을 V4L2 컨트롤로 동적 매핑합니다.',
    props: [
      { label: '커널 드라이버:', value: 'uvcvideo (리눅스 커널 표준 빌트인)' },
      { label: 'XU 제어 방식:', value: '16-Byte GUID + UVCIOC_CTRL_MAP' },
      { label: '비디오 캡처 큐:', value: 'V4L2 mmap / DMABUF Zero-Copy' },
      { label: '프레임 동기화:', value: 'PTS(32-bit) / SCR(48-bit) 타임스탬프' },
    ],
    note: '별도의 사제 벤더 드라이버 설치 없이 UVC 규격을 통한 드라이버리스 플러그 앤 플레이를 지원합니다. 외부 하드웨어 트리거 및 플래시 스트로브 제어는 Extension Unit(XU) 디스크립터에 할당된 16바이트 고유 GUID를 통해 사용자 정의 V4L2 컨트롤로 맵핑되어 제어됩니다.',
    bandwidth: '최대 실효 호스트 버퍼 대역폭: 4.8 Gbps (USB 3.0 SuperSpeed Direct DMA)',
  },
  {
    level: 4,
    id: 'l4',
    name: 'USB 2.0 / 3.0 버스 전송 계층',
    subtitle: 'High-Bandwidth Isochronous / SuperSpeed Bulk, UVC Payload Header',
    bus: 'USB 2.0 High-Speed (480Mbps) / USB 3.0 SuperSpeed (5Gbps)',
    description: 'ISP에서 엔코딩된 패킷을 USB 물리 버스로 실어나르는 전송 계층입니다. USB 2.0 환경에서는 엔드포인트 디스크립터의 wMaxPacketSize(0x1400: 마이크로프레임 125µs당 3회 트랜잭션 = 24.576 MB/s 고정 할당)를 사용하는 High-Bandwidth Isochronous 전송으로 지터 없는 스트리밍을 보장하며, USB 3.0에서는 대용량 Bulk 전송을 사용합니다.',
    props: [
      { label: 'USB 인터페이스:', value: 'USB 2.0 High-Speed / USB 3.0 SuperSpeed' },
      { label: '엔드포인트 전송 모드:', value: 'High-Bandwidth Isochronous (EP1 IN)' },
      { label: '최대 패킷 사이즈:', value: '3 × 1024 Bytes / 125 µs (wMaxPacketSize=0x1400)' },
      { label: 'UVC 페이로드 헤더:', value: '2 ~ 12 Bytes (HLE, BFH, PTS, SCR)' },
    ],
    note: 'USB 2.0의 실제 가용 대역폭(~350 Mbps) 한계로 인해 1080p 60fps / 1200p 60fps는 실시간 하드웨어 MJPEG 압축 파이프라인으로 전송됩니다. 비압축 YUY2(16bpp) 포맷은 USB 3.0 SuperSpeed 환경에서 최대 1920x1200 60fps까지 전송 가능합니다.',
    bandwidth: 'USB 2.0: 480 Mbps (실효 350 Mbps) / USB 3.0: 5.0 Gbps (실효 4.0 Gbps)',
  },
  {
    level: 3,
    id: 'l3',
    name: 'ISP 파이프라인 & UVC 엔지니어링',
    subtitle: 'Raw Bayer Processing, De-Bayer, AWB, AE, HW MJPEG Encoder, XU Parser',
    bus: 'SoC Internal Image Signal Processing Pipeline + USB Device Controller',
    description: 'AR0234CS 센서에서 출력된 Raw Bayer 스트림을 입력받아 결함 픽셀 보정(DPC), 렌즈 쉐이딩 보정(LSC), 디베이어링(Demosaicing), 감마 커브, 3A(AE/AWB/AF), 색 보정 매트릭스(CCM)를 하드웨어 파이프라인으로 실시간 연산합니다. 동시에 UVC 클래스 요청(SET_CUR, GET_CUR 등)을 수신하여 I2C 마스터를 통해 센서 내부 레지스터를 실시간 제어합니다.',
    props: [
      { label: '입력 센서 데이터:', value: '10-bit / 8-bit Raw Bayer CFA (GRBG / RGGB)' },
      { label: '출력 스트림 포맷:', value: 'YUV422 (YUY2) 비압축 / 하드웨어 MJPEG 압축' },
      { label: 'UVC 펌웨어 표준:', value: 'USB Video Class 1.1 / 1.5 Compliant' },
      { label: '확장 유닛(XU) 파서:', value: 'Hampotech 벤더 고유 커맨드 해석 엔진' },
    ],
    note: 'ISP 내부 펌웨어는 호스트 OS의 UVCIOC_CTRL_MAP 요청을 파싱하여, 외부 하드웨어 트리거 핀 모드 전환, 플래시 지연 시간 조절, 256×16 SRAM 컨텍스트 스위칭 등의 특수 기능을 즉각 수행합니다.',
    bandwidth: 'ISP 내부 처리 대역폭: 최대 6.4 Gbps 픽셀 처리 엔진',
  },
  {
    level: 2,
    id: 'l2',
    name: 'MIPI CSI-2 & I2C 제어 버스',
    subtitle: '4-Lane MIPI D-PHY (3.6Gbps) + Fast-Mode I2C Bus (Slave ID 0x20)',
    bus: '4-Lane MIPI CSI-2 D-PHY v1.2 + 400kHz Fast-Mode I2C (2-Wire)',
    description: 'AR0234CS 센서와 ISP 칩셋 간의 초고속 영상 스트림 및 16비트 레지스터 제어 버스입니다. 영상 픽셀 데이터는 전자기 간섭(EMI)이 적은 MIPI CSI-2 4개 레인을 통해 최대 3.6 Gbps 속도로 고속 전송되며, 센서 노출/게인/해상도 제어 신호는 I2C 버스(Slave ID 0x20)를 통해 양방향으로 전달됩니다.',
    props: [
      { label: 'MIPI 레인 구성:', value: '1 / 2 / 4-Lane 프로그래머블 (레인당 900Mbps)' },
      { label: 'MIPI 총 대역폭:', value: '최대 3.6 Gbps (1920x1200 120fps 수용)' },
      { label: 'I2C 슬레이브 주소:', value: '8-bit Write 0x20 / Read 0x21 (7-bit 0x10)' },
      { label: '레지스터 주소 공간:', value: '16-bit Address / 16-bit Data Bus' },
    ],
    note: '영상 스트리밍 도중 레지스터 변경으로 인한 프레임 찢김(Bad Frame)을 방지하기 위해, I2C로 전송된 값은 먼저 대기 레지스터(Pending Register)에 보관된 뒤 Dark Pixel Blanking 구간(VSync)에서 활성 레지스터(Live Register)로 원자적(Atomic) 복사됩니다.',
    bandwidth: 'MIPI D-PHY 4-Lane: 3.6 Gbps / I2C 제어: 400 kHz (Fast-Mode)',
  },
  {
    level: 1,
    id: 'l1',
    name: 'AR0234CS 글로벌 셔터 센서 코어',
    subtitle: '1/2.6" Optical Format 2.3MP CMOS, Shielded Pixel Memory, TRIG & FLASH Pins',
    bus: 'Pixel Array Matrix + Dedicated Hardware Trigger & Strobe Control Logic',
    description: 'onsemi사의 2.3메가픽셀(1920x1200) 글로벌 셔터 CMOS 디지털 이미지 센서입니다. 모든 픽셀에 차폐형 아날로그 메모리 노드가 내장되어 있어, 1920x1200 해상도 전체 픽셀이 동시에 노출을 시작하고 종료합니다. 고속 이동 물체 촬영 시 롤링 셔터 특유의 젤로 현상(Geometric Skew)이 원천 차단되며, 외부 하드웨어 TRIG 핀(<125ns 지연)과 FLASH 스트로브 출력 핀을 갖추고 있습니다.',
    props: [
      { label: '광학 포맷 / 픽셀 크기:', value: '1/2.6인치 (8.92mm) / 3.0 µm × 3.0 µm BSI' },
      { label: '유효 픽셀 해상도:', value: '1920(H) × 1200(V) (2.3 Megapixels)' },
      { label: '최대 프레임 레이트:', value: '120 fps @ 1920x1200 (선형 모드)' },
      { label: '동적 범위 & 감도:', value: '71.4 dB / 6.8 V/lux-sec' },
      { label: '외부 트리거 인터페이스:', value: '1.8V ~ 3.3V LVCMOS TRIG / FLASH Pin' },
      { label: '트리거 반응 지연:', value: '입력 엣지 검출 < 125 ns (초정밀 위상 동기)' },
    ],
    note: '글로벌 셔터 아키텍처는 수백만 화소 각각에 1개씩 독립된 전하 저장 노드(Storage Gate)가 배치되어 빛을 동시에 캡처합니다. 따라서 회전하는 프로펠러나 고속 주행 차량의 번호판을 촬영할 때도 상하 왜곡이나 스트로브 조명 가로 밴딩이 발생하지 않습니다.',
    bandwidth: '최대 내부 센서 코어 판독 속도: 1920x1200 @ 120fps (~5.52 Gbps Raw)',
  },
];

export const REGISTER_DATABASE: RegisterEntry[] = [
  {
    address: '0x3004',
    name: 'X_Addr_End',
    description: '수평 방향 유효 픽셀 스캔 종료 지점 (해상도 폭)',
    contextA: '1919 (0x077F) - FHD 1080p',
    contextB: '1279 (0x04FF) - HD 720p',
    contextC: '1919 (0x077F) - 2.3MP 1200p',
    category: 'geometry',
  },
  {
    address: '0x3006',
    name: 'Y_Addr_End',
    description: '수직 방향 유효 픽셀 스캔 종료 지점 (해상도 높이)',
    contextA: '1079 (0x0437) - FHD 1080p',
    contextB: '719 (0x02CF) - HD 720p',
    contextC: '1199 (0x04AF) - 2.3MP 1200p',
    category: 'geometry',
  },
  {
    address: '0x300A',
    name: 'Frame_Length_Lines',
    description: '프레임 전체 라인 수 (블랭킹 라인 포함, FPS 결정 파라미터)',
    contextA: '1125 (0x0465) @ 60fps',
    contextB: '750 (0x02EE) @ 120fps',
    contextC: '1250 (0x04E2) @ 90fps',
    category: 'timing',
  },
  {
    address: '0x300C',
    name: 'Line_Length_Pck',
    description: '단일 라인당 마스터 클럭 픽셀 카운트 수',
    contextA: '2200 (0x0898)',
    contextB: '1650 (0x0672)',
    contextC: '2200 (0x0898)',
    category: 'timing',
  },
  {
    address: '0x3012',
    name: 'Coarse_Integration_Time',
    description: '노출 시간 라인 수 (Exposure Coarse 라인 단위)',
    contextA: '0x04E2 (12.5 ms)',
    contextB: '0x0200 (5.1 ms)',
    contextC: '0x0380 (8.9 ms)',
    category: 'timing',
  },
  {
    address: '0x301A',
    name: 'Reset_Register / Mode',
    description: '센서 동작 모드 제어 (스트리밍 개시, 파이프라인 동기화)',
    contextA: '0x10DC (Pipelined Global)',
    contextB: '0x10DC (Pipelined Global)',
    contextC: '0x10DC (Pipelined Global)',
    category: 'mode',
  },
  {
    address: '0x3060',
    name: 'Analogue_Gain_Code',
    description: '센서 픽셀 아날로그 증폭 게인 (1x ~ 16x)',
    contextA: '0x0020 (1.0x Unity Gain)',
    contextB: '0x0040 (2.0x Boost Gain)',
    contextC: '0x0020 (1.0x Unity Gain)',
    category: 'gain',
  },
  {
    address: '0x30B0',
    name: 'Digital_Test_Pattern / Ctx',
    description: 'Bit 13: 컨텍스트 A/B 즉각 토글 비트 (0=Context A, 1=Context B)',
    contextA: '0x0000 (Context A 활성)',
    contextB: '0x2000 (Context B 활성, Bit13=1)',
    contextC: '0x0000 (Context A 활성)',
    category: 'mode',
  },
];

export const UVC_NODES: UVCNode[] = [
  {
    id: 'IT',
    name: 'Input Terminal (IT)',
    code: 'Node 0x01',
    nodeIdHex: '0x01',
    role: '카메라 센서 물리 노드 (Camera Terminal Descriptor)',
    description: '물리적 AR0234CS 센서 인터페이스입니다. 노출 시간(Exposure Time Absolute), 조리개(Iris), 포커스(Focus), 자동 노출 우선순위(AE Priority) 등 센서 광학 소자 자체의 파라미터를 제어하는 UVC 표준 엔터티입니다.',
    controls: ['Exposure Time (Absolute/Auto)', 'Focus (Absolute)', 'Iris (Absolute)', 'Zoom (Absolute)'],
  },
  {
    id: 'PU',
    name: 'Processing Unit (PU)',
    code: 'Node 0x02',
    nodeIdHex: '0x02',
    role: 'ISP 영상 처리 유닛 (Processing Unit Descriptor)',
    description: '센서에서 입력된 영상을 가공하는 ISP 파이프라인 노드입니다. 밝기(Brightness), 대비(Contrast), 채도(Saturation), 화이트 밸런스(AWB / Manual Color Temperature), 선명도(Sharpness), 전원 주파수 플리커 방지(Power Line Frequency 50/60Hz) 등을 처리합니다.',
    controls: ['Brightness', 'Contrast', 'Saturation', 'Sharpness', 'White Balance Temp', 'Backlight Compensation', 'Power Line Frequency'],
  },
  {
    id: 'XU',
    name: 'Extension Unit (XU)',
    code: 'Node 0x03',
    nodeIdHex: '0x03',
    role: '제조사 벤더 고유 제어 유닛 (Extension Unit Descriptor)',
    description: '표준 UVC 사양에 정의되지 않은 특수 하드웨어 기능을 호스트에 노출하는 엔터티입니다. Hampotech 고유 16바이트 GUID를 사용하여 외부 하드웨어 트리거 모드(Pulsed/Sync-Sink), 스트로브 플래시 지연 시간, I2C 직접 레지스터 읽기/쓰기, ROI 크롭 등을 제어합니다.',
    controls: ['HW External Trigger Mode (Selector 1)', 'Strobe Flash Delay (Selector 2)', 'Direct Sensor Register RW (Selector 3)', 'Hardware ROI Crop Window (Selector 4)'],
  },
  {
    id: 'OT',
    name: 'Output Terminal (OT)',
    code: 'Node 0x04',
    nodeIdHex: '0x04',
    role: 'USB 스트리밍 엔드포인트 출력 노드',
    description: '최종 처리된 YUY2 / MJPEG 프레임 패킷을 USB 물리 버스(Endpoint 1 IN)로 내보내어 호스트 OS의 uvcvideo 드라이버 링 버퍼로 스트리밍하는 종단 노드입니다.',
    controls: ['Isochronous Streaming EP1', 'Bulk Transfer Pipe', 'USB Status Interrupt EP2'],
  },
];

export const XU_CONTROLS: Record<string, XUControlSpec> = {
  trigger_mode: {
    id: 'trigger_mode',
    name: '1. 하드웨어 외부 트리거 모드 (Pulsed / Sync-Sink)',
    guid: '48-61-6d-70-6f-74-65-63-68-41-30-32-33-34-01',
    guidHexArray: '{0x48, 0x61, 0x6d, 0x70, 0x6f, 0x74, 0x65, 0x63, 0x68, 0x41, 0x30, 0x32, 0x33, 0x34, 0x00, 0x01}',
    selector: 1,
    sizeBits: 8,
    offsetBits: 0,
    v4l2Id: 'V4L2_CID_USER_HAMPO_TRIG_MODE',
    v4l2Type: 'V4L2_CTRL_TYPE_INTEGER',
    dataType: 'UVC_CTRL_DATA_TYPE_UNSIGNED',
    description: '0: 연속 프리런 스트리밍, 1: 외부 TRIG 펄스 모드(Pulsed Single Shot), 2: 고속 싱크-싱크 위상 잠금 모드(Sync-Sink continuous up to 120fps)',
    defaultVal: 1,
    code: `/* Linux C: uvc_xu_control_mapping for External Trigger Mode */
#include <linux/uvcvideo.h>
#include <linux/videodev2.h>
#include <sys/ioctl.h>
#include <fcntl.h>

#define V4L2_CID_USER_HAMPO_TRIG_MODE (V4L2_CID_USER_BASE + 0x1001)

struct uvc_xu_control_mapping trig_mapping = {
    .id        = V4L2_CID_USER_HAMPO_TRIG_MODE,
    .name      = "HW External Trigger Mode",
    .entity    = {0x48, 0x61, 0x6d, 0x70, 0x6f, 0x74, 0x65, 0x63, 
                  0x68, 0x41, 0x30, 0x32, 0x33, 0x34, 0x00, 0x01},
    .selector  = 1,                         /* XU Control Selector 1 */
    .size      = 8,                         /* 8-bit Integer (1 Byte) */
    .offset    = 0,                         /* Bit Offset 0 */
    .v4l2_type = V4L2_CTRL_TYPE_INTEGER,
    .data_type = UVC_CTRL_DATA_TYPE_UNSIGNED,
    .menu_info = NULL,
    .menu_count= 0
};

int ret = ioctl(v4l2_fd, UVCIOC_CTRL_MAP, &trig_mapping);
if (ret < 0) {
    perror("Failed to map HW Trigger XU control");
}`,
  },
  strobe_delay: {
    id: 'strobe_delay',
    name: '2. 스트로브 플래시 동기화 지연 (Flash Lead/Lag µs)',
    guid: '48-61-6d-70-6f-74-65-63-68-41-30-32-33-34-02',
    guidHexArray: '{0x48, 0x61, 0x6d, 0x70, 0x6f, 0x74, 0x65, 0x63, 0x68, 0x41, 0x30, 0x32, 0x33, 0x34, 0x00, 0x02}',
    selector: 2,
    sizeBits: 16,
    offsetBits: 0,
    v4l2Id: 'V4L2_CID_USER_HAMPO_FLASH_DELAY',
    v4l2Type: 'V4L2_CTRL_TYPE_INTEGER',
    dataType: 'UVC_CTRL_DATA_TYPE_UNSIGNED',
    description: '글로벌 셔터 노출 시작 시점 대비 FLASH 핀 출력 신호의 선행(Lead) 또는 지연(Lag) 시간 설정 (단위: 마이크로초 µs, 범위: 0 ~ 65535 µs)',
    defaultVal: 50,
    code: `/* Linux C: uvc_xu_control_mapping for Strobe Flash Delay */
#define V4L2_CID_USER_HAMPO_FLASH_DELAY (V4L2_CID_USER_BASE + 0x1002)

struct uvc_xu_control_mapping flash_mapping = {
    .id        = V4L2_CID_USER_HAMPO_FLASH_DELAY,
    .name      = "Flash Strobe Lead/Lag Delay (us)",
    .entity    = {0x48, 0x61, 0x6d, 0x70, 0x6f, 0x74, 0x65, 0x63, 
                  0x68, 0x41, 0x30, 0x32, 0x33, 0x34, 0x00, 0x02},
    .selector  = 2,                         /* XU Control Selector 2 */
    .size      = 16,                        /* 16-bit Unsigned Integer */
    .offset    = 0,
    .v4l2_type = V4L2_CTRL_TYPE_INTEGER,
    .data_type = UVC_CTRL_DATA_TYPE_UNSIGNED
};

ioctl(v4l2_fd, UVCIOC_CTRL_MAP, &flash_mapping);`,
  },
  direct_reg: {
    id: 'direct_reg',
    name: '3. 센서 I2C 레지스터 직접 접근 (Direct 16-bit RW)',
    guid: '48-61-6d-70-6f-74-65-63-68-41-30-32-33-34-03',
    guidHexArray: '{0x48, 0x61, 0x6d, 0x70, 0x6f, 0x74, 0x65, 0x63, 0x68, 0x41, 0x30, 0x32, 0x33, 0x34, 0x00, 0x03}',
    selector: 3,
    sizeBits: 32,
    offsetBits: 0,
    v4l2Id: 'V4L2_CID_USER_HAMPO_REG_DIRECT',
    v4l2Type: 'V4L2_CTRL_TYPE_INTEGER',
    dataType: 'UVC_CTRL_DATA_TYPE_RAW',
    description: 'AR0234CS 센서 내부 레지스터 주소 16비트 + 데이터 16비트 (총 32비트)를 I2C 버스로 직접 읽고 쓰는 저수준 엔지니어링 인터페이스',
    defaultVal: '0x301204E2',
    code: `/* Linux C: uvc_xu_control_mapping for Direct Sensor Register RW */
#define V4L2_CID_USER_HAMPO_REG_DIRECT (V4L2_CID_USER_BASE + 0x1003)

struct uvc_xu_control_mapping reg_mapping = {
    .id        = V4L2_CID_USER_HAMPO_REG_DIRECT,
    .name      = "Sensor Register Direct Access",
    .entity    = {0x48, 0x61, 0x6d, 0x70, 0x6f, 0x74, 0x65, 0x63, 
                  0x68, 0x41, 0x30, 0x32, 0x33, 0x34, 0x00, 0x03},
    .selector  = 3,                         /* XU Control Selector 3 */
    .size      = 32,                        /* 32-bit (16b Addr + 16b Val) */
    .offset    = 0,
    .v4l2_type = V4L2_CTRL_TYPE_INTEGER,
    .data_type = UVC_CTRL_DATA_TYPE_RAW
};

ioctl(v4l2_fd, UVCIOC_CTRL_MAP, &reg_mapping);`,
  },
  roi_crop: {
    id: 'roi_crop',
    name: '4. 하드웨어 관심 영역 크롭 (ROI Window Crop)',
    guid: '48-61-6d-70-6f-74-65-63-68-41-30-32-33-34-04',
    guidHexArray: '{0x48, 0x61, 0x6d, 0x70, 0x6f, 0x74, 0x65, 0x63, 0x68, 0x41, 0x30, 0x32, 0x33, 0x34, 0x00, 0x04}',
    selector: 4,
    sizeBits: 64,
    offsetBits: 0,
    v4l2Id: 'V4L2_CID_USER_HAMPO_ROI_CROP',
    v4l2Type: 'V4L2_CTRL_TYPE_INTEGER',
    dataType: 'UVC_CTRL_DATA_TYPE_RAW',
    description: '센서 하드웨어 레벨에서 특정 윈도우(Start X, Start Y, Width, Height)만 고속 판독하여 프레임 레이트를 120fps 이상으로 끌어올리는 기능',
    defaultVal: '0x00000000077F0437',
    code: `/* Linux C: uvc_xu_control_mapping for Hardware ROI Crop */
#define V4L2_CID_USER_HAMPO_ROI_CROP (V4L2_CID_USER_BASE + 0x1004)

struct uvc_xu_control_mapping roi_mapping = {
    .id        = V4L2_CID_USER_HAMPO_ROI_CROP,
    .name      = "Hardware ROI Crop Window",
    .entity    = {0x48, 0x61, 0x6d, 0x70, 0x6f, 0x74, 0x65, 0x63, 
                  0x68, 0x41, 0x30, 0x32, 0x33, 0x34, 0x00, 0x04},
    .selector  = 4,                         /* XU Control Selector 4 */
    .size      = 64,                        /* 64-bit (4x 16b: X, Y, W, H) */
    .offset    = 0,
    .v4l2_type = V4L2_CTRL_TYPE_INTEGER,
    .data_type = UVC_CTRL_DATA_TYPE_RAW
};

ioctl(v4l2_fd, UVCIOC_CTRL_MAP, &roi_mapping);`,
  },
};
