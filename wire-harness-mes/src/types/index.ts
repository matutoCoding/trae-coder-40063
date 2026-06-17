export interface WireMaterial {
  id: string
  wireNo: string
  wireType: string
  color: string
  spec: string
  crossSection: number
  unitPrice: number
  stock: number
  occupiedQty: number
}

export interface TerminalMaterial {
  id: string
  terminalNo: string
  terminalType: string
  spec: string
  applicableWire: string[]
  crimpHeight: number
  crimpHeightTolerance: number
  tensileStrength: number
  unitPrice: number
  stock: number
  occupiedQty: number
}

export interface SheathMaterial {
  id: string
  sheathNo: string
  sheathType: string
  holeCount: number
  applicableTerminals: string[]
  unitPrice: number
  stock: number
  occupiedQty: number
}

export interface WaterproofPlug {
  id: string
  plugNo: string
  plugType: string
  applicableWire: string[]
  unitPrice: number
  stock: number
  occupiedQty: number
}

export interface ProductionBatch {
  id: string
  batchNo: string
  bomId: string
  productNo: string
  productName: string
  productQuantity: number
  status: 'pending' | 'producing' | 'completed' | 'cancelled'
  createTime: string
  completeTime?: string
}

export type MaterialType = 'wire' | 'terminal' | 'waterproof'

export interface MaterialReservation {
  id: string
  batchId: string
  batchNo: string
  materialType: MaterialType
  materialNo: string
  wireNos?: string[]
  requiredQty: number
  reservedQty: number
  status: 'reserved' | 'consumed' | 'released'
  createTime: string
  remark?: string
}

export interface BOMItem {
  id: string
  wireNo: string
  wireType: string
  color: string
  crossSection: number
  length: number
  leftTerminal: string
  rightTerminal: string
  leftWaterproof: string
  rightWaterproof: string
  perSetQuantity: number
  quantity: number
  remark: string
}

export interface BOM {
  id: string
  productNo: string
  productName: string
  version: string
  createTime: string
  totalWires: number
  productQuantity: number
  totalQuantity: number
  items: BOMItem[]
  status: 'draft' | 'approved' | 'producing' | 'completed'
}

export interface CuttingTask {
  id: string
  bomId: string
  batchId: string
  batchNo: string
  productNo: string
  wireNo: string
  wireType: string
  color: string
  crossSection: number
  totalLength: number
  stripLeft: number
  stripRight: number
  quantity: number
  completed: number
  status: 'pending' | 'processing' | 'completed'
  createTime: string
  operator: string
  machine: string
}

export interface CrimpingRecord {
  id: string
  taskId: string
  wireNo: string
  terminalNo: string
  side: 'left' | 'right'
  crimpHeight: number
  tensileStrength: number
  operator: string
  machine: string
  testTime: string
  result: 'pass' | 'fail'
}

export interface CrimpingTask {
  id: string
  bomId: string
  batchId: string
  batchNo: string
  productNo: string
  wireNo: string
  terminalNo: string
  side: 'left' | 'right' | 'both'
  quantity: number
  completed: number
  status: 'pending' | 'processing' | 'completed'
  standardHeight: number
  minTensile: number
  createTime: string
  operator: string
  machine: string
  records: CrimpingRecord[]
}

export interface PreAssemblyTask {
  id: string
  bomId: string
  batchId: string
  batchNo: string
  productNo: string
  wireNo: string
  waterproofPlug: string
  side: 'left' | 'right' | 'both'
  quantity: number
  completed: number
  status: 'pending' | 'processing' | 'completed'
  createTime: string
  operator: string
}

export interface AssemblyTask {
  id: string
  bomId: string
  batchId: string
  batchNo: string
  productNo: string
  sheathNo: string
  holePosition: string
  wireNo: string
  terminalNo: string
  quantity: number
  completed: number
  status: 'pending' | 'processing' | 'completed'
  createTime: string
  operator: string
  retainForcePassed: boolean
  retainForceRecords: RetainForceTestRecord[]
}

export interface RetainForceTestRecord {
  id: string
  taskId: string
  testNo: string
  sampleIndex: number
  retainForce: number
  standardForce: number
  wireNo: string
  sheathNo: string
  holePosition: string
  operator: string
  testTime: string
  result: 'pass' | 'fail'
  remark: string
}

export interface AppearanceCheckRecord {
  id: string
  checkItemId: string
  checkItem: string
  isRequired: boolean
  checked: boolean
  result: 'pass' | 'fail'
  remark: string
}

export interface LabelPrintRecord {
  id: string
  taskId: string
  printCount: number
  labelTemplate: string
  operator: string
  printTime: string
}

export interface ConductorTestRecord {
  id: string
  taskId: string
  productNo: string
  testPoint1: string
  testPoint2: string
  resistance: number
  insulationResistance: number
  voltage: number
  testTime: string
  operator: string
  result: 'pass' | 'fail'
}

export interface ConductorTestTask {
  id: string
  bomId: string
  batchId: string
  batchNo: string
  productNo: string
  quantity: number
  completed: number
  passCount: number
  failCount: number
  status: 'pending' | 'processing' | 'completed'
  createTime: string
  operator: string
  records: ConductorTestRecord[]
}

export interface AppearanceCheckItem {
  id: string
  checkItem: string
  standard: string
  checkMethod: string
  isRequired: boolean
}

export interface PackagingTask {
  id: string
  bomId: string
  batchId: string
  batchNo: string
  productNo: string
  quantity: number
  completed: number
  bellowsCoverage: boolean
  labelPrinted: boolean
  appearanceChecked: boolean
  status: 'pending' | 'processing' | 'completed'
  createTime: string
  operator: string
  packageSpec: string
  labelTemplate: string
  appearanceRecords: AppearanceCheckRecord[]
  labelPrintRecords: LabelPrintRecord[]
}

export interface DashboardStats {
  todayOutput: number
  weekOutput: number
  monthOutput: number
  passRate: number
  pendingTasks: number
  inProgressTasks: number
  completedTasks: number
  bomCount: number
}

export interface MaterialShortageDetail {
  materialType: MaterialType
  materialNo: string
  neededQty: number
  stockQty: number
  shortageQty: number
  affectedWireNos: string[]
  unit: string
}
