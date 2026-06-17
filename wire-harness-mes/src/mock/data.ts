import type {
  WireMaterial,
  TerminalMaterial,
  SheathMaterial,
  WaterproofPlug,
  BOM,
  CuttingTask,
  CrimpingTask,
  PreAssemblyTask,
  AssemblyTask,
  ConductorTestTask,
  PackagingTask,
  AppearanceCheckItem,
  DashboardStats
} from '../types'

export const mockWires: WireMaterial[] = [
  { id: 'w1', wireNo: 'AVSS-0.5', wireType: 'AVSS', color: '红色', spec: '0.5mm²', crossSection: 0.5, unitPrice: 1.2, stock: 50000 },
  { id: 'w2', wireNo: 'AVSS-0.5-BK', wireType: 'AVSS', color: '黑色', spec: '0.5mm²', crossSection: 0.5, unitPrice: 1.2, stock: 60000 },
  { id: 'w3', wireNo: 'AVSS-0.75', wireType: 'AVSS', color: '黄色', spec: '0.75mm²', crossSection: 0.75, unitPrice: 1.8, stock: 40000 },
  { id: 'w4', wireNo: 'AVSS-1.0', wireType: 'AVSS', color: '绿色', spec: '1.0mm²', crossSection: 1.0, unitPrice: 2.5, stock: 30000 },
  { id: 'w5', wireNo: 'AVSS-1.5', wireType: 'AVSS', color: '蓝色', spec: '1.5mm²', crossSection: 1.5, unitPrice: 3.2, stock: 25000 },
  { id: 'w6', wireNo: 'AVSS-2.0', wireType: 'AVSS', color: '白色', spec: '2.0mm²', crossSection: 2.0, unitPrice: 4.5, stock: 20000 },
  { id: 'w7', wireNo: 'FLRY-B-0.5', wireType: 'FLRY-B', color: '红色', spec: '0.5mm²', crossSection: 0.5, unitPrice: 1.5, stock: 35000 },
  { id: 'w8', wireNo: 'FLRY-B-0.75', wireType: 'FLRY-B', color: '黑色', spec: '0.75mm²', crossSection: 0.75, unitPrice: 2.2, stock: 45000 },
]

export const mockTerminals: TerminalMaterial[] = [
  { id: 't1', terminalNo: '1.5系列-公端', terminalType: '公端', spec: '1.5mm', applicableWire: ['AVSS-0.5', 'AVSS-0.75', 'AVSS-1.0'], crimpHeight: 1.5, crimpHeightTolerance: 0.1, tensileStrength: 50, unitPrice: 0.3, stock: 100000 },
  { id: 't2', terminalNo: '1.5系列-母端', terminalType: '母端', spec: '1.5mm', applicableWire: ['AVSS-0.5', 'AVSS-0.75', 'AVSS-1.0'], crimpHeight: 1.5, crimpHeightTolerance: 0.1, tensileStrength: 50, unitPrice: 0.32, stock: 100000 },
  { id: 't3', terminalNo: '2.8系列-公端', terminalType: '公端', spec: '2.8mm', applicableWire: ['AVSS-0.75', 'AVSS-1.0', 'AVSS-1.5'], crimpHeight: 2.8, crimpHeightTolerance: 0.15, tensileStrength: 80, unitPrice: 0.45, stock: 80000 },
  { id: 't4', terminalNo: '2.8系列-母端', terminalType: '母端', spec: '2.8mm', applicableWire: ['AVSS-0.75', 'AVSS-1.0', 'AVSS-1.5'], crimpHeight: 2.8, crimpHeightTolerance: 0.15, tensileStrength: 80, unitPrice: 0.48, stock: 80000 },
  { id: 't5', terminalNo: '4.8系列-公端', terminalType: '公端', spec: '4.8mm', applicableWire: ['AVSS-1.0', 'AVSS-1.5', 'AVSS-2.0'], crimpHeight: 4.8, crimpHeightTolerance: 0.2, tensileStrength: 120, unitPrice: 0.65, stock: 60000 },
  { id: 't6', terminalNo: '4.8系列-母端', terminalType: '母端', spec: '4.8mm', applicableWire: ['AVSS-1.0', 'AVSS-1.5', 'AVSS-2.0'], crimpHeight: 4.8, crimpHeightTolerance: 0.2, tensileStrength: 120, unitPrice: 0.68, stock: 60000 },
  { id: 't7', terminalNo: '6.3系列-公端', terminalType: '公端', spec: '6.3mm', applicableWire: ['AVSS-1.5', 'AVSS-2.0'], crimpHeight: 6.3, crimpHeightTolerance: 0.25, tensileStrength: 150, unitPrice: 0.85, stock: 40000 },
  { id: 't8', terminalNo: '6.3系列-母端', terminalType: '母端', spec: '6.3mm', applicableWire: ['AVSS-1.5', 'AVSS-2.0'], crimpHeight: 6.3, crimpHeightTolerance: 0.25, tensileStrength: 150, unitPrice: 0.88, stock: 40000 },
]

export const mockSheaths: SheathMaterial[] = [
  { id: 's1', sheathNo: 'DJ7021-1.5-11', sheathType: '公护套', holeCount: 2, applicableTerminals: ['1.5系列-公端'], unitPrice: 1.2, stock: 50000 },
  { id: 's2', sheathNo: 'DJ7021-1.5-21', sheathType: '母护套', holeCount: 2, applicableTerminals: ['1.5系列-母端'], unitPrice: 1.25, stock: 50000 },
  { id: 's3', sheathNo: 'DJ7041-1.5-11', sheathType: '公护套', holeCount: 4, applicableTerminals: ['1.5系列-公端'], unitPrice: 2.5, stock: 40000 },
  { id: 's4', sheathNo: 'DJ7041-1.5-21', sheathType: '母护套', holeCount: 4, applicableTerminals: ['1.5系列-母端'], unitPrice: 2.6, stock: 40000 },
  { id: 's5', sheathNo: 'DJ7061-2.8-11', sheathType: '公护套', holeCount: 6, applicableTerminals: ['2.8系列-公端'], unitPrice: 4.2, stock: 30000 },
  { id: 's6', sheathNo: 'DJ7061-2.8-21', sheathType: '母护套', holeCount: 6, applicableTerminals: ['2.8系列-母端'], unitPrice: 4.3, stock: 30000 },
  { id: 's7', sheathNo: 'DJ7101-2.8-11', sheathType: '公护套', holeCount: 10, applicableTerminals: ['2.8系列-公端'], unitPrice: 6.8, stock: 20000 },
  { id: 's8', sheathNo: 'DJ7161-2.8-21', sheathType: '母护套', holeCount: 16, applicableTerminals: ['2.8系列-母端'], unitPrice: 8.5, stock: 15000 },
]

export const mockWaterproofPlugs: WaterproofPlug[] = [
  { id: 'wp1', plugNo: 'WPD-1.5', plugType: '硅胶防水栓', applicableWire: ['AVSS-0.5', 'AVSS-0.75'], unitPrice: 0.15, stock: 200000 },
  { id: 'wp2', plugNo: 'WPD-2.0', plugType: '硅胶防水栓', applicableWire: ['AVSS-0.75', 'AVSS-1.0'], unitPrice: 0.18, stock: 150000 },
  { id: 'wp3', plugNo: 'WPD-2.8', plugType: '硅胶防水栓', applicableWire: ['AVSS-1.0', 'AVSS-1.5'], unitPrice: 0.22, stock: 100000 },
  { id: 'wp4', plugNo: 'WPD-4.8', plugType: '硅胶防水栓', applicableWire: ['AVSS-1.5', 'AVSS-2.0'], unitPrice: 0.3, stock: 80000 },
  { id: 'wp5', plugNo: 'WPR-1.5', plugType: '橡胶防水圈', applicableWire: ['AVSS-0.5', 'AVSS-0.75'], unitPrice: 0.12, stock: 180000 },
  { id: 'wp6', plugNo: 'WPR-2.8', plugType: '橡胶防水圈', applicableWire: ['AVSS-1.0', 'AVSS-1.5'], unitPrice: 0.18, stock: 120000 },
]

export const mockBOMs: BOM[] = [
  {
    id: 'bom001',
    productNo: 'WH-2024-001',
    productName: '发动机舱线束总成',
    version: 'V1.0',
    createTime: '2024-01-15 09:30:00',
    totalWires: 12,
    productQuantity: 500,
    totalQuantity: 500,
    status: 'producing',
    items: [
      { id: 'item1', wireNo: 'AVSS-0.5', wireType: 'AVSS', color: '红色', crossSection: 0.5, length: 450, leftTerminal: '1.5系列-公端', rightTerminal: '1.5系列-母端', leftWaterproof: 'WPD-1.5', rightWaterproof: 'WPD-1.5', perSetQuantity: 1, quantity: 500, remark: '电源线' },
      { id: 'item2', wireNo: 'AVSS-0.5-BK', wireType: 'AVSS', color: '黑色', crossSection: 0.5, length: 380, leftTerminal: '1.5系列-公端', rightTerminal: '1.5系列-母端', leftWaterproof: 'WPD-1.5', rightWaterproof: 'WPD-1.5', perSetQuantity: 1, quantity: 500, remark: '地线' },
      { id: 'item3', wireNo: 'AVSS-0.75', wireType: 'AVSS', color: '黄色', crossSection: 0.75, length: 520, leftTerminal: '2.8系列-公端', rightTerminal: '2.8系列-母端', leftWaterproof: 'WPD-2.8', rightWaterproof: 'WPD-2.8', perSetQuantity: 1, quantity: 500, remark: '信号线' },
      { id: 'item4', wireNo: 'AVSS-1.0', wireType: 'AVSS', color: '绿色', crossSection: 1.0, length: 600, leftTerminal: '2.8系列-公端', rightTerminal: '2.8系列-母端', leftWaterproof: 'WPD-2.8', rightWaterproof: 'WPD-2.8', perSetQuantity: 1, quantity: 500, remark: '传感器线' },
      { id: 'item5', wireNo: 'AVSS-1.5', wireType: 'AVSS', color: '蓝色', crossSection: 1.5, length: 350, leftTerminal: '4.8系列-公端', rightTerminal: '4.8系列-母端', leftWaterproof: 'WPD-4.8', rightWaterproof: 'WPD-4.8', perSetQuantity: 1, quantity: 500, remark: '大电流线' },
    ]
  },
  {
    id: 'bom002',
    productNo: 'WH-2024-002',
    productName: '仪表台线束总成',
    version: 'V1.2',
    createTime: '2024-02-20 14:00:00',
    totalWires: 18,
    productQuantity: 300,
    totalQuantity: 300,
    status: 'approved',
    items: [
      { id: 'item6', wireNo: 'AVSS-0.5', wireType: 'AVSS', color: '红色', crossSection: 0.5, length: 300, leftTerminal: '1.5系列-公端', rightTerminal: '1.5系列-母端', leftWaterproof: '', rightWaterproof: '', perSetQuantity: 1, quantity: 300, remark: '仪表电源线' },
      { id: 'item7', wireNo: 'AVSS-0.5-BK', wireType: 'AVSS', color: '黑色', crossSection: 0.5, length: 280, leftTerminal: '1.5系列-公端', rightTerminal: '1.5系列-母端', leftWaterproof: '', rightWaterproof: '', perSetQuantity: 1, quantity: 300, remark: '仪表地线' },
      { id: 'item8', wireNo: 'FLRY-B-0.5', wireType: 'FLRY-B', color: '红色', crossSection: 0.5, length: 420, leftTerminal: '1.5系列-公端', rightTerminal: '1.5系列-公端', leftWaterproof: '', rightWaterproof: '', perSetQuantity: 1, quantity: 300, remark: 'CAN-H线' },
      { id: 'item9', wireNo: 'FLRY-B-0.75', wireType: 'FLRY-B', color: '黑色', crossSection: 0.75, length: 420, leftTerminal: '1.5系列-公端', rightTerminal: '1.5系列-公端', leftWaterproof: '', rightWaterproof: '', perSetQuantity: 1, quantity: 300, remark: 'CAN-L线' },
      { id: 'item10', wireNo: 'AVSS-0.75', wireType: 'AVSS', color: '黄色', crossSection: 0.75, length: 350, leftTerminal: '2.8系列-母端', rightTerminal: '2.8系列-母端', leftWaterproof: '', rightWaterproof: '', perSetQuantity: 1, quantity: 300, remark: '指示灯线' },
    ]
  },
  {
    id: 'bom003',
    productNo: 'WH-2024-003',
    productName: '车门线束总成',
    version: 'V2.0',
    createTime: '2024-03-10 10:15:00',
    totalWires: 8,
    productQuantity: 800,
    totalQuantity: 800,
    status: 'completed',
    items: [
      { id: 'item11', wireNo: 'AVSS-0.5', wireType: 'AVSS', color: '红色', crossSection: 0.5, length: 200, leftTerminal: '1.5系列-公端', rightTerminal: '1.5系列-母端', leftWaterproof: 'WPD-1.5', rightWaterproof: '', perSetQuantity: 1, quantity: 800, remark: '玻璃升降电源线' },
      { id: 'item12', wireNo: 'AVSS-0.5-BK', wireType: 'AVSS', color: '黑色', crossSection: 0.5, length: 200, leftTerminal: '1.5系列-公端', rightTerminal: '1.5系列-母端', leftWaterproof: 'WPD-1.5', rightWaterproof: '', perSetQuantity: 1, quantity: 800, remark: '玻璃升降地线' },
      { id: 'item13', wireNo: 'AVSS-0.75', wireType: 'AVSS', color: '黄色', crossSection: 0.75, length: 180, leftTerminal: '2.8系列-公端', rightTerminal: '2.8系列-母端', leftWaterproof: 'WPD-2.8', rightWaterproof: '', perSetQuantity: 1, quantity: 800, remark: '门锁信号线' },
      { id: 'item14', wireNo: 'AVSS-1.0', wireType: 'AVSS', color: '绿色', crossSection: 1.0, length: 220, leftTerminal: '2.8系列-公端', rightTerminal: '2.8系列-母端', leftWaterproof: 'WPD-2.8', rightWaterproof: '', perSetQuantity: 1, quantity: 800, remark: '扬声器线' },
    ]
  },
  {
    id: 'bom004',
    productNo: 'WH-2024-004',
    productName: '底盘线束总成',
    version: 'V1.0',
    createTime: '2024-04-05 16:45:00',
    totalWires: 6,
    productQuantity: 200,
    totalQuantity: 200,
    status: 'draft',
    items: [
      { id: 'item15', wireNo: 'AVSS-2.0', wireType: 'AVSS', color: '白色', crossSection: 2.0, length: 800, leftTerminal: '6.3系列-公端', rightTerminal: '6.3系列-母端', leftWaterproof: 'WPD-4.8', rightWaterproof: 'WPD-4.8', perSetQuantity: 1, quantity: 200, remark: '主电源线' },
      { id: 'item16', wireNo: 'AVSS-1.5', wireType: 'AVSS', color: '蓝色', crossSection: 1.5, length: 750, leftTerminal: '4.8系列-公端', rightTerminal: '4.8系列-母端', leftWaterproof: 'WPD-4.8', rightWaterproof: 'WPD-4.8', perSetQuantity: 1, quantity: 200, remark: 'ABS信号线' },
    ]
  }
]

export const mockCuttingTasks: CuttingTask[] = [
  { id: 'cut001', bomId: 'bom001', productNo: 'WH-2024-001', wireNo: 'AVSS-0.5', wireType: 'AVSS', color: '红色', crossSection: 0.5, totalLength: 450, stripLeft: 8, stripRight: 8, quantity: 500, completed: 500, status: 'completed', createTime: '2024-01-16 08:00:00', operator: '张工', machine: '裁线机-01' },
  { id: 'cut002', bomId: 'bom001', productNo: 'WH-2024-001', wireNo: 'AVSS-0.5-BK', wireType: 'AVSS', color: '黑色', crossSection: 0.5, totalLength: 380, stripLeft: 8, stripRight: 8, quantity: 500, completed: 500, status: 'completed', createTime: '2024-01-16 09:30:00', operator: '张工', machine: '裁线机-01' },
  { id: 'cut003', bomId: 'bom001', productNo: 'WH-2024-001', wireNo: 'AVSS-0.75', wireType: 'AVSS', color: '黄色', crossSection: 0.75, totalLength: 520, stripLeft: 10, stripRight: 10, quantity: 500, completed: 320, status: 'processing', createTime: '2024-01-16 11:00:00', operator: '李工', machine: '裁线机-02' },
  { id: 'cut004', bomId: 'bom001', productNo: 'WH-2024-001', wireNo: 'AVSS-1.0', wireType: 'AVSS', color: '绿色', crossSection: 1.0, totalLength: 600, stripLeft: 10, stripRight: 10, quantity: 500, completed: 0, status: 'pending', createTime: '2024-01-16 11:00:00', operator: '', machine: '' },
  { id: 'cut005', bomId: 'bom001', productNo: 'WH-2024-001', wireNo: 'AVSS-1.5', wireType: 'AVSS', color: '蓝色', crossSection: 1.5, totalLength: 350, stripLeft: 12, stripRight: 12, quantity: 500, completed: 0, status: 'pending', createTime: '2024-01-16 11:00:00', operator: '', machine: '' },
  { id: 'cut006', bomId: 'bom002', productNo: 'WH-2024-002', wireNo: 'AVSS-0.5', wireType: 'AVSS', color: '红色', crossSection: 0.5, totalLength: 300, stripLeft: 8, stripRight: 8, quantity: 300, completed: 0, status: 'pending', createTime: '2024-02-21 08:00:00', operator: '', machine: '' },
  { id: 'cut007', bomId: 'bom002', productNo: 'WH-2024-002', wireNo: 'AVSS-0.5-BK', wireType: 'AVSS', color: '黑色', crossSection: 0.5, totalLength: 280, stripLeft: 8, stripRight: 8, quantity: 300, completed: 0, status: 'pending', createTime: '2024-02-21 08:00:00', operator: '', machine: '' },
]

export const mockCrimpingTasks: CrimpingTask[] = [
  {
    id: 'crimp001', bomId: 'bom001', productNo: 'WH-2024-001', wireNo: 'AVSS-0.5', terminalNo: '1.5系列-公端', side: 'left',
    quantity: 500, completed: 500, status: 'completed', standardHeight: 1.5, minTensile: 50,
    createTime: '2024-01-17 08:00:00', operator: '王工', machine: '压接机-01',
    records: [
      { id: 'rec1', taskId: 'crimp001', wireNo: 'AVSS-0.5', terminalNo: '1.5系列-公端', side: 'left', crimpHeight: 1.48, tensileStrength: 55, operator: '王工', machine: '压接机-01', testTime: '2024-01-17 08:30:00', result: 'pass' },
      { id: 'rec2', taskId: 'crimp001', wireNo: 'AVSS-0.5', terminalNo: '1.5系列-公端', side: 'left', crimpHeight: 1.52, tensileStrength: 58, operator: '王工', machine: '压接机-01', testTime: '2024-01-17 10:00:00', result: 'pass' },
      { id: 'rec3', taskId: 'crimp001', wireNo: 'AVSS-0.5', terminalNo: '1.5系列-公端', side: 'left', crimpHeight: 1.50, tensileStrength: 52, operator: '王工', machine: '压接机-01', testTime: '2024-01-17 11:30:00', result: 'pass' },
    ]
  },
  {
    id: 'crimp002', bomId: 'bom001', productNo: 'WH-2024-001', wireNo: 'AVSS-0.5', terminalNo: '1.5系列-母端', side: 'right',
    quantity: 500, completed: 500, status: 'completed', standardHeight: 1.5, minTensile: 50,
    createTime: '2024-01-17 13:00:00', operator: '王工', machine: '压接机-01',
    records: [
      { id: 'rec4', taskId: 'crimp002', wireNo: 'AVSS-0.5', terminalNo: '1.5系列-母端', side: 'right', crimpHeight: 1.49, tensileStrength: 56, operator: '王工', machine: '压接机-01', testTime: '2024-01-17 13:30:00', result: 'pass' },
      { id: 'rec5', taskId: 'crimp002', wireNo: 'AVSS-0.5', terminalNo: '1.5系列-母端', side: 'right', crimpHeight: 1.51, tensileStrength: 54, operator: '王工', machine: '压接机-01', testTime: '2024-01-17 15:00:00', result: 'pass' },
    ]
  },
  {
    id: 'crimp003', bomId: 'bom001', productNo: 'WH-2024-001', wireNo: 'AVSS-0.5-BK', terminalNo: '1.5系列-公端', side: 'left',
    quantity: 500, completed: 280, status: 'processing', standardHeight: 1.5, minTensile: 50,
    createTime: '2024-01-18 08:00:00', operator: '赵工', machine: '压接机-02',
    records: [
      { id: 'rec6', taskId: 'crimp003', wireNo: 'AVSS-0.5-BK', terminalNo: '1.5系列-公端', side: 'left', crimpHeight: 1.47, tensileStrength: 53, operator: '赵工', machine: '压接机-02', testTime: '2024-01-18 08:30:00', result: 'pass' },
    ]
  },
  {
    id: 'crimp004', bomId: 'bom001', productNo: 'WH-2024-001', wireNo: 'AVSS-0.75', terminalNo: '2.8系列-公端', side: 'left',
    quantity: 500, completed: 0, status: 'pending', standardHeight: 2.8, minTensile: 80,
    createTime: '2024-01-18 10:00:00', operator: '', machine: '',
    records: []
  },
]

export const mockPreAssemblyTasks: PreAssemblyTask[] = [
  { id: 'pre001', bomId: 'bom001', productNo: 'WH-2024-001', wireNo: 'AVSS-0.5', waterproofPlug: 'WPD-1.5', side: 'both', quantity: 500, completed: 500, status: 'completed', createTime: '2024-01-18 14:00:00', operator: '刘工' },
  { id: 'pre002', bomId: 'bom001', productNo: 'WH-2024-001', wireNo: 'AVSS-0.5-BK', waterproofPlug: 'WPD-1.5', side: 'both', quantity: 500, completed: 350, status: 'processing', createTime: '2024-01-19 08:00:00', operator: '刘工' },
  { id: 'pre003', bomId: 'bom001', productNo: 'WH-2024-001', wireNo: 'AVSS-0.75', waterproofPlug: 'WPD-2.8', side: 'both', quantity: 500, completed: 0, status: 'pending', createTime: '2024-01-19 10:00:00', operator: '' },
  { id: 'pre004', bomId: 'bom001', productNo: 'WH-2024-001', wireNo: 'AVSS-1.0', waterproofPlug: 'WPD-2.8', side: 'both', quantity: 500, completed: 0, status: 'pending', createTime: '2024-01-19 10:00:00', operator: '' },
]

export const mockAssemblyTasks: AssemblyTask[] = [
  { id: 'asm001', bomId: 'bom001', productNo: 'WH-2024-001', sheathNo: 'DJ7061-2.8-11', holePosition: '1#孔', wireNo: 'AVSS-0.5', terminalNo: '1.5系列-公端', quantity: 500, completed: 200, status: 'processing', createTime: '2024-01-20 08:00:00', operator: '陈工', retainForcePassed: true, retainForceRecords: [
    { id: 'rf1', taskId: 'asm001', testNo: 'RF-2024-001', sampleIndex: 1, retainForce: 65, standardForce: 50, wireNo: 'AVSS-0.5', sheathNo: 'DJ7061-2.8-11', holePosition: '1#孔', operator: '陈工', testTime: '2024-01-20 10:00:00', result: 'pass', remark: '首件检测合格' }
  ] },
  { id: 'asm002', bomId: 'bom001', productNo: 'WH-2024-001', sheathNo: 'DJ7061-2.8-11', holePosition: '2#孔', wireNo: 'AVSS-0.5-BK', terminalNo: '1.5系列-公端', quantity: 500, completed: 150, status: 'processing', createTime: '2024-01-20 08:00:00', operator: '陈工', retainForcePassed: false, retainForceRecords: [] },
  { id: 'asm003', bomId: 'bom001', productNo: 'WH-2024-001', sheathNo: 'DJ7061-2.8-11', holePosition: '3#孔', wireNo: 'AVSS-0.75', terminalNo: '2.8系列-公端', quantity: 500, completed: 0, status: 'pending', createTime: '2024-01-20 08:00:00', operator: '', retainForcePassed: false, retainForceRecords: [] },
  { id: 'asm004', bomId: 'bom001', productNo: 'WH-2024-001', sheathNo: 'DJ7061-2.8-21', holePosition: '1#孔', wireNo: 'AVSS-0.5', terminalNo: '1.5系列-母端', quantity: 500, completed: 180, status: 'processing', createTime: '2024-01-20 09:00:00', operator: '周工', retainForcePassed: true, retainForceRecords: [
    { id: 'rf2', taskId: 'asm004', testNo: 'RF-2024-002', sampleIndex: 1, retainForce: 58, standardForce: 50, wireNo: 'AVSS-0.5', sheathNo: 'DJ7061-2.8-21', holePosition: '1#孔', operator: '周工', testTime: '2024-01-20 10:30:00', result: 'pass', remark: '首件检测合格' }
  ] },
]

export const mockConductorTestTasks: ConductorTestTask[] = [
  {
    id: 'test001', bomId: 'bom003', productNo: 'WH-2024-003', quantity: 800, completed: 800, passCount: 792, failCount: 8,
    status: 'completed', createTime: '2024-03-20 08:00:00', operator: '吴工',
    records: [
      { id: 'trec1', taskId: 'test001', productNo: 'WH-2024-003', testPoint1: 'DJ7021-1.5-11/1#', testPoint2: 'DJ7021-1.5-21/1#', resistance: 0.05, insulationResistance: 1000, voltage: 500, testTime: '2024-03-20 08:30:00', operator: '吴工', result: 'pass' },
      { id: 'trec2', taskId: 'test001', productNo: 'WH-2024-003', testPoint1: 'DJ7021-1.5-11/2#', testPoint2: 'DJ7021-1.5-21/2#', resistance: 0.06, insulationResistance: 950, voltage: 500, testTime: '2024-03-20 09:00:00', operator: '吴工', result: 'pass' },
      { id: 'trec3', taskId: 'test001', productNo: 'WH-2024-003', testPoint1: 'DJ7021-2.8-11/1#', testPoint2: 'DJ7021-2.8-21/1#', resistance: 0.04, insulationResistance: 1100, voltage: 500, testTime: '2024-03-20 09:30:00', operator: '吴工', result: 'pass' },
    ]
  },
  {
    id: 'test002', bomId: 'bom001', productNo: 'WH-2024-001', quantity: 500, completed: 0, passCount: 0, failCount: 0,
    status: 'pending', createTime: '2024-01-22 08:00:00', operator: '',
    records: []
  },
]

export const mockPackagingTasks: PackagingTask[] = [
  { id: 'pkg001', bomId: 'bom003', productNo: 'WH-2024-003', quantity: 800, completed: 750, bellowsCoverage: true, labelPrinted: true, appearanceChecked: true, status: 'processing', createTime: '2024-03-21 08:00:00', operator: '郑工', packageSpec: '50条/箱', labelTemplate: '标准标签模板A', appearanceRecords: [], labelPrintRecords: [
    { id: 'lp1', taskId: 'pkg001', printCount: 500, labelTemplate: '标准标签模板A', operator: '郑工', printTime: '2024-03-21 14:00:00' }
  ] },
  { id: 'pkg002', bomId: 'bom001', productNo: 'WH-2024-001', quantity: 500, completed: 0, bellowsCoverage: false, labelPrinted: false, appearanceChecked: false, status: 'pending', createTime: '2024-01-23 08:00:00', operator: '', packageSpec: '30条/箱', labelTemplate: '标准标签模板B', appearanceRecords: [], labelPrintRecords: [] },
]

export const mockAppearanceCheckItems: AppearanceCheckItem[] = [
  { id: 'ac1', checkItem: '端子压接外观', standard: '无变形、无氧化、压痕清晰均匀', checkMethod: '目视+放大镜', isRequired: true },
  { id: 'ac2', checkItem: '防水栓位置', standard: '完全到位、无破损、密封良好', checkMethod: '目视+手感', isRequired: true },
  { id: 'ac3', checkItem: '护套穿入', standard: '到位、卡扣锁紧、无退针', checkMethod: '目视+拉力测试', isRequired: true },
  { id: 'ac4', checkItem: '波纹管包覆', standard: '包覆完整、无裸露、扎带间距均匀', checkMethod: '目视+卷尺', isRequired: false },
  { id: 'ac5', checkItem: '线号标识', standard: '清晰、正确、方向一致', checkMethod: '目视', isRequired: true },
  { id: 'ac6', checkItem: '扎带固定', standard: '牢固、无松动、尾端齐平', checkMethod: '目视+手感', isRequired: true },
  { id: 'ac7', checkItem: '标签粘贴', standard: '位置正确、平整、信息完整', checkMethod: '目视', isRequired: true },
  { id: 'ac8', checkItem: '外观整洁', standard: '无污渍、无划伤、无变形', checkMethod: '目视', isRequired: true },
]

export const mockDashboardStats: DashboardStats = {
  todayOutput: 320,
  weekOutput: 2150,
  monthOutput: 8600,
  passRate: 98.5,
  pendingTasks: 12,
  inProgressTasks: 8,
  completedTasks: 45,
  bomCount: 156
}

export const mockWeeklyOutputData = [
  { day: '周一', output: 350, pass: 342 },
  { day: '周二', output: 380, pass: 375 },
  { day: '周三', output: 320, pass: 315 },
  { day: '周四', output: 400, pass: 396 },
  { day: '周五', output: 360, pass: 354 },
  { day: '周六', output: 280, pass: 278 },
  { day: '周日', output: 60, pass: 58 },
]

export const mockProcessData = [
  { name: '裁线', pending: 5, processing: 2, completed: 48 },
  { name: '压接', pending: 8, processing: 3, completed: 42 },
  { name: '预装', pending: 6, processing: 2, completed: 38 },
  { name: '总装', pending: 10, processing: 4, completed: 30 },
  { name: '测试', pending: 7, processing: 2, completed: 35 },
  { name: '包装', pending: 4, processing: 1, completed: 28 },
]
