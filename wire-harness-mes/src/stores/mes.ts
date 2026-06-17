import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  BOM,
  BOMItem,
  CuttingTask,
  CrimpingTask,
  CrimpingRecord,
  PreAssemblyTask,
  AssemblyTask,
  ConductorTestTask,
  ConductorTestRecord,
  PackagingTask,
  DashboardStats,
  WireMaterial,
  TerminalMaterial,
  SheathMaterial,
  WaterproofPlug,
  AppearanceCheckItem,
  RetainForceTestRecord,
  AppearanceCheckRecord,
  LabelPrintRecord,
  ProductionBatch,
  MaterialReservation,
  MaterialShortageDetail,
  MaterialType
} from '../types'
import {
  mockBOMs,
  mockCuttingTasks,
  mockCrimpingTasks,
  mockPreAssemblyTasks,
  mockAssemblyTasks,
  mockConductorTestTasks,
  mockPackagingTasks,
  mockDashboardStats,
  mockWires,
  mockTerminals,
  mockSheaths,
  mockWaterproofPlugs,
  mockAppearanceCheckItems,
  mockWeeklyOutputData,
  mockProcessData,
  mockBatches,
  mockReservations
} from '../mock/data'

const STORAGE_KEY = 'wire-harness-mes-data'

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.warn('加载本地数据失败，使用模拟数据', e)
  }
  return fallback
}

function uid(prefix: string = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function generateBatchNo(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rnd = String(Math.floor(Math.random() * 900) + 100)
  return `PC${y}${m}${d}-${rnd}`
}

const initialData = loadFromStorage<{
  boms: BOM[]
  batches: ProductionBatch[]
  reservations: MaterialReservation[]
  cuttingTasks: CuttingTask[]
  crimpingTasks: CrimpingTask[]
  preAssemblyTasks: PreAssemblyTask[]
  assemblyTasks: AssemblyTask[]
  conductorTestTasks: ConductorTestTask[]
  packagingTasks: PackagingTask[]
  wires: WireMaterial[]
  terminals: TerminalMaterial[]
  sheaths: SheathMaterial[]
  waterproofPlugs: WaterproofPlug[]
}>(STORAGE_KEY, {
  boms: mockBOMs,
  batches: mockBatches,
  reservations: mockReservations,
  cuttingTasks: mockCuttingTasks,
  crimpingTasks: mockCrimpingTasks,
  preAssemblyTasks: mockPreAssemblyTasks,
  assemblyTasks: mockAssemblyTasks,
  conductorTestTasks: mockConductorTestTasks,
  packagingTasks: mockPackagingTasks,
  wires: mockWires,
  terminals: mockTerminals,
  sheaths: mockSheaths,
  waterproofPlugs: mockWaterproofPlugs
})

export const useMESStore = defineStore('mes', () => {
  const boms = ref<BOM[]>(initialData.boms)
  const batches = ref<ProductionBatch[]>(initialData.batches)
  const reservations = ref<MaterialReservation[]>(initialData.reservations)
  const cuttingTasks = ref<CuttingTask[]>(initialData.cuttingTasks)
  const crimpingTasks = ref<CrimpingTask[]>(initialData.crimpingTasks)
  const preAssemblyTasks = ref<PreAssemblyTask[]>(initialData.preAssemblyTasks)
  const assemblyTasks = ref<AssemblyTask[]>(initialData.assemblyTasks)
  const conductorTestTasks = ref<ConductorTestTask[]>(initialData.conductorTestTasks)
  const packagingTasks = ref<PackagingTask[]>(initialData.packagingTasks)
  const wires = ref<WireMaterial[]>(initialData.wires)
  const terminals = ref<TerminalMaterial[]>(initialData.terminals)
  const sheaths = ref<SheathMaterial[]>(initialData.sheaths)
  const waterproofPlugs = ref<WaterproofPlug[]>(initialData.waterproofPlugs)
  const appearanceCheckItems = ref<AppearanceCheckItem[]>([...mockAppearanceCheckItems])
  const dashboardStats = ref<DashboardStats>({ ...mockDashboardStats })
  const weeklyOutputData = ref([...mockWeeklyOutputData])
  const monthlyOutputData = ref([
    { day: '第1周', output: 2150, pass: 2110 },
    { day: '第2周', output: 2380, pass: 2345 },
    { day: '第3周', output: 2200, pass: 2175 },
    { day: '第4周', output: 1950, pass: 1920 },
  ])
  const processData = ref([...mockProcessData])

  const currentBOM = ref<BOM | null>(null)

  watch(
    [boms, batches, reservations, cuttingTasks, crimpingTasks, preAssemblyTasks, assemblyTasks, conductorTestTasks, packagingTasks, wires, terminals, sheaths, waterproofPlugs],
    () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          boms: boms.value,
          batches: batches.value,
          reservations: reservations.value,
          cuttingTasks: cuttingTasks.value,
          crimpingTasks: crimpingTasks.value,
          preAssemblyTasks: preAssemblyTasks.value,
          assemblyTasks: assemblyTasks.value,
          conductorTestTasks: conductorTestTasks.value,
          packagingTasks: packagingTasks.value,
          wires: wires.value,
          terminals: terminals.value,
          sheaths: sheaths.value,
          waterproofPlugs: waterproofPlugs.value
        }))
      } catch (e) {
        console.warn('保存本地数据失败', e)
      }
    },
    { deep: true }
  )

  const pendingCuttingTasks = computed(() => cuttingTasks.value.filter(t => t.status === 'pending'))
  const processingCuttingTasks = computed(() => cuttingTasks.value.filter(t => t.status === 'processing'))
  const completedCuttingTasks = computed(() => cuttingTasks.value.filter(t => t.status === 'completed'))

  const pendingCrimpingTasks = computed(() => crimpingTasks.value.filter(t => t.status === 'pending'))
  const processingCrimpingTasks = computed(() => crimpingTasks.value.filter(t => t.status === 'processing'))
  const completedCrimpingTasks = computed(() => crimpingTasks.value.filter(t => t.status === 'completed'))

  const pendingPreAssemblyTasks = computed(() => preAssemblyTasks.value.filter(t => t.status === 'pending'))
  const processingPreAssemblyTasks = computed(() => preAssemblyTasks.value.filter(t => t.status === 'processing'))
  const completedPreAssemblyTasks = computed(() => preAssemblyTasks.value.filter(t => t.status === 'completed'))

  const pendingAssemblyTasks = computed(() => assemblyTasks.value.filter(t => t.status === 'pending'))
  const processingAssemblyTasks = computed(() => assemblyTasks.value.filter(t => t.status === 'processing'))
  const completedAssemblyTasks = computed(() => assemblyTasks.value.filter(t => t.status === 'completed'))

  function setCurrentBOM(bom: BOM | null) {
    currentBOM.value = bom
  }

  function addBOM(bom: BOM) {
    boms.value.unshift(bom)
  }

  function updateBOMStatus(id: string, status: BOM['status']) {
    const bom = boms.value.find(b => b.id === id)
    if (bom) {
      bom.status = status
    }
  }

  function getBatchByBom(bomId: string): ProductionBatch | null {
    return batches.value.find(b => b.bomId === bomId) || null
  }

  function updateCuttingTaskStatus(id: string, status: CuttingTask['status']) {
    const task = cuttingTasks.value.find(t => t.id === id)
    if (task) {
      task.status = status
      tryUpdateBatchStatus(task.batchId)
    }
  }

  function updateCuttingCompleted(id: string, completed: number) {
    const task = cuttingTasks.value.find(t => t.id === id)
    if (task) {
      task.completed = completed
      if (completed >= task.quantity) {
        task.status = 'completed'
      } else if (completed > 0) {
        task.status = 'processing'
      }
      tryUpdateBatchStatus(task.batchId)
    }
  }

  function updateCrimpingTaskStatus(id: string, status: CrimpingTask['status']) {
    const task = crimpingTasks.value.find(t => t.id === id)
    if (task) {
      task.status = status
      tryUpdateBatchStatus(task.batchId)
    }
  }

  function updateCrimpingCompleted(id: string, completed: number) {
    const task = crimpingTasks.value.find(t => t.id === id)
    if (task) {
      task.completed = completed
      if (completed >= task.quantity) {
        task.status = 'completed'
      } else if (completed > 0) {
        task.status = 'processing'
      }
      tryUpdateBatchStatus(task.batchId)
    }
  }

  function addCrimpingRecord(taskId: string, record: CrimpingRecord) {
    const task = crimpingTasks.value.find(t => t.id === taskId)
    if (task) {
      task.records.push(record)
    }
  }

  function updatePreAssemblyTaskStatus(id: string, status: PreAssemblyTask['status']) {
    const task = preAssemblyTasks.value.find(t => t.id === id)
    if (task) {
      task.status = status
      tryUpdateBatchStatus(task.batchId)
    }
  }

  function updatePreAssemblyCompleted(id: string, completed: number) {
    const task = preAssemblyTasks.value.find(t => t.id === id)
    if (task) {
      task.completed = completed
      if (completed >= task.quantity) {
        task.status = 'completed'
      } else if (completed > 0) {
        task.status = 'processing'
      }
      tryUpdateBatchStatus(task.batchId)
    }
  }

  function updateAssemblyTaskStatus(id: string, status: AssemblyTask['status']) {
    const task = assemblyTasks.value.find(t => t.id === id)
    if (task) {
      task.status = status
      tryUpdateBatchStatus(task.batchId)
    }
  }

  function updateAssemblyCompleted(id: string, completed: number) {
    const task = assemblyTasks.value.find(t => t.id === id)
    if (task) {
      task.completed = completed
      if (completed >= task.quantity) {
        task.status = 'completed'
      } else if (completed > 0) {
        task.status = 'processing'
      }
      tryUpdateBatchStatus(task.batchId)
    }
  }

  function addRetainForceRecord(taskId: string, record: RetainForceTestRecord) {
    const task = assemblyTasks.value.find(t => t.id === taskId)
    if (task) {
      task.retainForceRecords.push(record)
      if (record.result === 'pass') {
        task.retainForcePassed = true
      }
    }
  }

  function updateConductorTestTaskStatus(id: string, status: ConductorTestTask['status']) {
    const task = conductorTestTasks.value.find(t => t.id === id)
    if (task) {
      task.status = status
      tryUpdateBatchStatus(task.batchId)
    }
  }

  function addConductorTestRecord(taskId: string, record: ConductorTestRecord) {
    const task = conductorTestTasks.value.find(t => t.id === taskId)
    if (task) {
      task.records.push(record)
      task.completed++
      if (record.result === 'pass') {
        task.passCount++
      } else {
        task.failCount++
      }
      if (task.completed >= task.quantity) {
        task.status = 'completed'
      } else if (task.completed > 0) {
        task.status = 'processing'
      }
      tryUpdateBatchStatus(task.batchId)
    }
  }

  function updatePackagingTaskStatus(id: string, status: PackagingTask['status']) {
    const task = packagingTasks.value.find(t => t.id === id)
    if (task) {
      task.status = status
      tryUpdateBatchStatus(task.batchId)
    }
  }

  function updatePackagingCompleted(id: string, completed: number) {
    const task = packagingTasks.value.find(t => t.id === id)
    if (task) {
      task.completed = completed
      if (completed >= task.quantity) {
        task.status = 'completed'
      } else if (completed > 0) {
        task.status = 'processing'
      }
      tryUpdateBatchStatus(task.batchId)
    }
  }

  function saveAppearanceCheckRecords(taskId: string, records: AppearanceCheckRecord[]) {
    const task = packagingTasks.value.find(t => t.id === taskId)
    if (task) {
      task.appearanceRecords = records
      const requiredPassed = records.filter(r => r.isRequired).every(r => r.checked && r.result === 'pass')
      if (requiredPassed && records.length > 0) {
        task.appearanceChecked = true
      }
    }
  }

  function setBellowsCoverage(taskId: string, value: boolean) {
    const task = packagingTasks.value.find(t => t.id === taskId)
    if (task) {
      task.bellowsCoverage = value
    }
  }

  function addLabelPrintRecord(taskId: string, record: LabelPrintRecord) {
    const task = packagingTasks.value.find(t => t.id === taskId)
    if (task) {
      task.labelPrintRecords.push(record)
      task.labelPrinted = true
    }
  }

  function calcMaterialRequirementWithShortage(bom: BOM) {
    const wireNeed: Record<string, { materialNo: string; wireType: string; crossSection: number; color: string; needed: number; wireNos: Set<string>; unit: string }> = {}
    const terminalNeed: Record<string, { materialNo: string; needed: number; wireNos: Set<string>; unit: string }> = {}
    const waterproofNeed: Record<string, { materialNo: string; needed: number; wireNos: Set<string>; unit: string }> = {}

    bom.items.forEach(item => {
      const perSetQty = item.perSetQuantity || 1
      const actualQty = bom.productQuantity * perSetQty

      const wireKey = `${item.wireType}_${item.crossSection}_${item.color}`
      if (!wireNeed[wireKey]) {
        wireNeed[wireKey] = {
          materialNo: item.wireNo,
          wireType: item.wireType,
          crossSection: item.crossSection,
          color: item.color,
          needed: 0,
          wireNos: new Set(),
          unit: '米'
        }
      }
      wireNeed[wireKey].needed += Number(((actualQty * item.length) / 1000).toFixed(2))
      wireNeed[wireKey].wireNos.add(item.wireNo)

      if (item.leftTerminal) {
        if (!terminalNeed[item.leftTerminal]) terminalNeed[item.leftTerminal] = { materialNo: item.leftTerminal, needed: 0, wireNos: new Set(), unit: '个' }
        terminalNeed[item.leftTerminal].needed += actualQty
        terminalNeed[item.leftTerminal].wireNos.add(item.wireNo)
      }
      if (item.rightTerminal) {
        if (!terminalNeed[item.rightTerminal]) terminalNeed[item.rightTerminal] = { materialNo: item.rightTerminal, needed: 0, wireNos: new Set(), unit: '个' }
        terminalNeed[item.rightTerminal].needed += actualQty
        terminalNeed[item.rightTerminal].wireNos.add(item.wireNo)
      }
      if (item.leftWaterproof) {
        if (!waterproofNeed[item.leftWaterproof]) waterproofNeed[item.leftWaterproof] = { materialNo: item.leftWaterproof, needed: 0, wireNos: new Set(), unit: '个' }
        waterproofNeed[item.leftWaterproof].needed += actualQty
        waterproofNeed[item.leftWaterproof].wireNos.add(item.wireNo)
      }
      if (item.rightWaterproof) {
        if (!waterproofNeed[item.rightWaterproof]) waterproofNeed[item.rightWaterproof] = { materialNo: item.rightWaterproof, needed: 0, wireNos: new Set(), unit: '个' }
        waterproofNeed[item.rightWaterproof].needed += actualQty
        waterproofNeed[item.rightWaterproof].wireNos.add(item.wireNo)
      }
    })

    const shortageDetails: MaterialShortageDetail[] = []
    Object.values(wireNeed).forEach(w => {
      const stockItem = wires.value.find(x => x.wireNo === w.materialNo) || wires.value.find(x => x.wireType === w.wireType && x.crossSection === w.crossSection)
      const stock = stockItem ? stockItem.stock - (stockItem.occupiedQty || 0) : 0
      const shortage = Math.max(0, w.needed - stock)
      if (shortage > 0) {
        shortageDetails.push({
          materialType: 'wire',
          materialNo: w.materialNo,
          neededQty: w.needed,
          stockQty: stock,
          shortageQty: shortage,
          affectedWireNos: Array.from(w.wireNos),
          unit: w.unit
        })
      }
    })
    Object.values(terminalNeed).forEach(t => {
      const stockItem = terminals.value.find(x => x.terminalNo === t.materialNo)
      const stock = stockItem ? stockItem.stock - (stockItem.occupiedQty || 0) : 0
      const shortage = Math.max(0, t.needed - stock)
      if (shortage > 0) {
        shortageDetails.push({
          materialType: 'terminal',
          materialNo: t.materialNo,
          neededQty: t.needed,
          stockQty: stock,
          shortageQty: shortage,
          affectedWireNos: Array.from(t.wireNos),
          unit: t.unit
        })
      }
    })
    Object.values(waterproofNeed).forEach(p => {
      const stockItem = waterproofPlugs.value.find(x => x.plugNo === p.materialNo)
      const stock = stockItem ? stockItem.stock - (stockItem.occupiedQty || 0) : 0
      const shortage = Math.max(0, p.needed - stock)
      if (shortage > 0) {
        shortageDetails.push({
          materialType: 'waterproof',
          materialNo: p.materialNo,
          neededQty: p.needed,
          stockQty: stock,
          shortageQty: shortage,
          affectedWireNos: Array.from(p.wireNos),
          unit: p.unit
        })
      }
    })

    const wiresList = Object.values(wireNeed).map(w => {
      const stockItem = wires.value.find(x => x.wireNo === w.materialNo) || wires.value.find(x => x.wireType === w.wireType && x.crossSection === w.crossSection)
      const total = stockItem ? stockItem.stock : 0
      const occupied = stockItem ? (stockItem.occupiedQty || 0) : 0
      return {
        wireNo: w.materialNo,
        wireType: w.wireType,
        crossSection: w.crossSection,
        color: w.color,
        totalLengthMeter: w.needed,
        stockMeter: total,
        occupiedMeter: occupied,
        availableMeter: Math.max(0, total - occupied),
        shortage: Math.max(0, w.needed - (total - occupied))
      }
    })
    const terminalsList = Object.values(terminalNeed).map(t => {
      const stockItem = terminals.value.find(x => x.terminalNo === t.materialNo)
      const total = stockItem ? stockItem.stock : 0
      const occupied = stockItem ? (stockItem.occupiedQty || 0) : 0
      return {
        terminalNo: t.materialNo,
        count: t.needed,
        stock: total,
        occupied,
        available: Math.max(0, total - occupied),
        shortage: Math.max(0, t.needed - (total - occupied))
      }
    })
    const waterproofList = Object.values(waterproofNeed).map(p => {
      const stockItem = waterproofPlugs.value.find(x => x.plugNo === p.materialNo)
      const total = stockItem ? stockItem.stock : 0
      const occupied = stockItem ? (stockItem.occupiedQty || 0) : 0
      return {
        plugNo: p.materialNo,
        count: p.needed,
        stock: total,
        occupied,
        available: Math.max(0, total - occupied),
        shortage: Math.max(0, p.needed - (total - occupied))
      }
    })

    const hasShortage = shortageDetails.length > 0
    const shortageList = shortageDetails.map(s => {
      const typeName = s.materialType === 'wire' ? '线材' : s.materialType === 'terminal' ? '端子' : '防水栓'
      return {
        type: typeName,
        name: s.materialNo,
        need: `${s.neededQty}${s.unit}`,
        stock: `${s.stockQty}${s.unit}`,
        shortage: `${s.shortageQty}${s.unit}`,
        affectedWireNos: s.affectedWireNos
      }
    })

    return {
      wires: wiresList,
      terminals: terminalsList,
      waterproofPlugs: waterproofList,
      hasShortage,
      shortageList,
      shortageDetails
    }
  }

  function calcMaterialRequirement(bom: BOM) {
    return calcMaterialRequirementWithShortage(bom)
  }

  function reserveMaterialsForBatch(bom: BOM, batch: ProductionBatch) {
    const result = calcMaterialRequirementWithShortage(bom)
    const now = new Date().toLocaleString('zh-CN')

    result.wires.forEach(w => {
      const stockItem = wires.value.find(x => x.wireNo === w.wireNo) || wires.value.find(x => x.wireType === w.wireType && x.crossSection === w.crossSection)
      if (!stockItem) return
      const toReserve = Math.min(w.totalLengthMeter, stockItem.stock - (stockItem.occupiedQty || 0))
      if (toReserve <= 0) return
      stockItem.occupiedQty = (stockItem.occupiedQty || 0) + toReserve
      reservations.value.push({
        id: uid('res'),
        batchId: batch.id,
        batchNo: batch.batchNo,
        materialType: 'wire',
        materialNo: w.wireNo,
        wireNos: [w.wireNo],
        requiredQty: w.totalLengthMeter,
        reservedQty: toReserve,
        status: 'reserved',
        createTime: now
      })
    })

    result.terminals.forEach(t => {
      const stockItem = terminals.value.find(x => x.terminalNo === t.terminalNo)
      if (!stockItem) return
      const toReserve = Math.min(t.count, stockItem.stock - (stockItem.occupiedQty || 0))
      if (toReserve <= 0) return
      stockItem.occupiedQty = (stockItem.occupiedQty || 0) + toReserve
      reservations.value.push({
        id: uid('res'),
        batchId: batch.id,
        batchNo: batch.batchNo,
        materialType: 'terminal',
        materialNo: t.terminalNo,
        requiredQty: t.count,
        reservedQty: toReserve,
        status: 'reserved',
        createTime: now
      })
    })

    result.waterproofPlugs.forEach(p => {
      const stockItem = waterproofPlugs.value.find(x => x.plugNo === p.plugNo)
      if (!stockItem) return
      const toReserve = Math.min(p.count, stockItem.stock - (stockItem.occupiedQty || 0))
      if (toReserve <= 0) return
      stockItem.occupiedQty = (stockItem.occupiedQty || 0) + toReserve
      reservations.value.push({
        id: uid('res'),
        batchId: batch.id,
        batchNo: batch.batchNo,
        materialType: 'waterproof',
        materialNo: p.plugNo,
        requiredQty: p.count,
        reservedQty: toReserve,
        status: 'reserved',
        createTime: now
      })
    })
  }

  function releaseReservationsForBatch(batchId: string) {
    const batchReservations = reservations.value.filter(r => r.batchId === batchId && r.status === 'reserved')
    batchReservations.forEach(r => {
      let stockItem: { stock: number; occupiedQty?: number } | undefined
      if (r.materialType === 'wire') {
        stockItem = wires.value.find(x => x.wireNo === r.materialNo)
      } else if (r.materialType === 'terminal') {
        stockItem = terminals.value.find(x => x.terminalNo === r.materialNo)
      } else {
        stockItem = waterproofPlugs.value.find(x => x.plugNo === r.materialNo)
      }
      if (stockItem) {
        stockItem.occupiedQty = Math.max(0, (stockItem.occupiedQty || 0) - r.reservedQty)
      }
      r.status = 'released'
    })
  }

  function consumeReservationsForBatch(batchId: string) {
    const batchReservations = reservations.value.filter(r => r.batchId === batchId && r.status === 'reserved')
    batchReservations.forEach(r => {
      let stockItem: { stock: number; occupiedQty?: number } | undefined
      if (r.materialType === 'wire') {
        stockItem = wires.value.find(x => x.wireNo === r.materialNo)
      } else if (r.materialType === 'terminal') {
        stockItem = terminals.value.find(x => x.terminalNo === r.materialNo)
      } else {
        stockItem = waterproofPlugs.value.find(x => x.plugNo === r.materialNo)
      }
      if (stockItem) {
        stockItem.stock = Math.max(0, stockItem.stock - r.reservedQty)
        stockItem.occupiedQty = Math.max(0, (stockItem.occupiedQty || 0) - r.reservedQty)
      }
      r.status = 'consumed'
    })
  }

  function issueProduction(bomId: string): ProductionBatch | null {
    const bom = boms.value.find(b => b.id === bomId)
    if (!bom) return null

    const existingCount = cuttingTasks.value.filter(t => t.bomId === bomId).length
    if (existingCount > 0) {
      return getBatchByBom(bomId)
    }

    const batch: ProductionBatch = {
      id: uid('batch'),
      batchNo: generateBatchNo(),
      bomId: bom.id,
      productNo: bom.productNo,
      productName: bom.productName,
      productQuantity: bom.productQuantity,
      status: 'producing',
      createTime: new Date().toLocaleString('zh-CN')
    }
    batches.value.unshift(batch)

    reserveMaterialsForBatch(bom, batch)

    const ts = Date.now()
    bom.items.forEach((item: BOMItem, index: number) => {
      const task: CuttingTask = {
        id: `cut_${ts}_${index}`,
        bomId: bom.id,
        batchId: batch.id,
        batchNo: batch.batchNo,
        productNo: bom.productNo,
        wireNo: item.wireNo,
        wireType: item.wireType,
        color: item.color,
        crossSection: item.crossSection,
        totalLength: item.length,
        stripLeft: 8 + item.crossSection * 2,
        stripRight: 8 + item.crossSection * 2,
        quantity: item.quantity,
        completed: 0,
        status: 'pending',
        createTime: new Date().toLocaleString('zh-CN'),
        operator: '',
        machine: ''
      }
      cuttingTasks.value.unshift(task)
    })

    bom.items.forEach((item: BOMItem, index: number) => {
      if (item.leftTerminal) {
        crimpingTasks.value.unshift({
          id: `crimp_left_${ts}_${index}`,
          bomId: bom.id,
          batchId: batch.id,
          batchNo: batch.batchNo,
          productNo: bom.productNo,
          wireNo: item.wireNo,
          terminalNo: item.leftTerminal,
          side: 'left',
          quantity: item.quantity,
          completed: 0,
          status: 'pending',
          standardHeight: 1.5,
          minTensile: 50,
          createTime: new Date().toLocaleString('zh-CN'),
          operator: '',
          machine: '',
          records: []
        })
      }
      if (item.rightTerminal && item.rightTerminal !== item.leftTerminal) {
        crimpingTasks.value.unshift({
          id: `crimp_right_${ts}_${index}`,
          bomId: bom.id,
          batchId: batch.id,
          batchNo: batch.batchNo,
          productNo: bom.productNo,
          wireNo: item.wireNo,
          terminalNo: item.rightTerminal,
          side: 'right',
          quantity: item.quantity,
          completed: 0,
          status: 'pending',
          standardHeight: 1.5,
          minTensile: 50,
          createTime: new Date().toLocaleString('zh-CN'),
          operator: '',
          machine: '',
          records: []
        })
      }
      if (item.leftWaterproof || item.rightWaterproof) {
        preAssemblyTasks.value.unshift({
          id: `pre_${ts}_${index}`,
          bomId: bom.id,
          batchId: batch.id,
          batchNo: batch.batchNo,
          productNo: bom.productNo,
          wireNo: item.wireNo,
          waterproofPlug: item.leftWaterproof || item.rightWaterproof,
          side: (item.leftWaterproof && item.rightWaterproof) ? 'both' : item.leftWaterproof ? 'left' : 'right',
          quantity: item.quantity,
          completed: 0,
          status: 'pending',
          createTime: new Date().toLocaleString('zh-CN'),
          operator: ''
        })
      }
    })

    assemblyTasks.value.unshift({
      id: `asm_${ts}`,
      bomId: bom.id,
      batchId: batch.id,
      batchNo: batch.batchNo,
      productNo: bom.productNo,
      sheathNo: 'DJ7041-1.5-11',
      holePosition: '1#-4#孔',
      wireNo: bom.items[0]?.wireNo || '-',
      terminalNo: bom.items[0]?.leftTerminal || '-',
      quantity: bom.productQuantity,
      completed: 0,
      status: 'pending',
      createTime: new Date().toLocaleString('zh-CN'),
      operator: '',
      retainForcePassed: false,
      retainForceRecords: []
    })

    conductorTestTasks.value.unshift({
      id: `test_${ts}`,
      bomId: bom.id,
      batchId: batch.id,
      batchNo: batch.batchNo,
      productNo: bom.productNo,
      quantity: bom.productQuantity,
      completed: 0,
      passCount: 0,
      failCount: 0,
      status: 'pending',
      createTime: new Date().toLocaleString('zh-CN'),
      operator: '',
      records: []
    })

    packagingTasks.value.unshift({
      id: `pkg_${ts}`,
      bomId: bom.id,
      batchId: batch.id,
      batchNo: batch.batchNo,
      productNo: bom.productNo,
      quantity: bom.productQuantity,
      completed: 0,
      bellowsCoverage: false,
      labelPrinted: false,
      appearanceChecked: false,
      status: 'pending',
      createTime: new Date().toLocaleString('zh-CN'),
      operator: '',
      packageSpec: '30条/箱',
      labelTemplate: '标准标签模板A',
      appearanceRecords: [],
      labelPrintRecords: []
    })

    bom.status = 'producing'
    return batch
  }

  function generateCuttingTasksFromBOM(bomId: string) {
    issueProduction(bomId)
  }

  function cancelProduction(bomId: string) {
    const batch = getBatchByBom(bomId)
    if (batch) {
      batch.status = 'cancelled'
      releaseReservationsForBatch(batch.id)
    }
    const bom = boms.value.find(b => b.id === bomId)
    if (bom) bom.status = 'approved'
  }

  function completeProduction(bomId: string) {
    const batch = getBatchByBom(bomId)
    if (batch) {
      batch.status = 'completed'
      batch.completeTime = new Date().toLocaleString('zh-CN')
      consumeReservationsForBatch(batch.id)
    }
    const bom = boms.value.find(b => b.id === bomId)
    if (bom) bom.status = 'completed'
  }

  function getTaskSummaryByBom(bomId: string) {
    return {
      cutting: cuttingTasks.value.filter(t => t.bomId === bomId).length,
      crimping: crimpingTasks.value.filter(t => t.bomId === bomId).length,
      preAssembly: preAssemblyTasks.value.filter(t => t.bomId === bomId).length,
      assembly: assemblyTasks.value.filter(t => t.bomId === bomId).length,
      test: conductorTestTasks.value.filter(t => t.bomId === bomId).length,
      packaging: packagingTasks.value.filter(t => t.bomId === bomId).length,
    }
  }

  type StageName = 'cutting' | 'crimping' | 'preAssembly' | 'assembly' | 'test' | 'packaging'
  interface StageProgress {
    name: StageName
    label: string
    totalQty: number
    completedQty: number
    progress: number
    status: 'pending' | 'processing' | 'completed'
  }

  function getProgressByBom(bomId: string): { stages: StageProgress[]; overallProgress: number; currentStage: string; currentStageLabel: string } {
    const bom = boms.value.find(b => b.id === bomId)
    if (!bom) {
      return { stages: [], overallProgress: 0, currentStage: 'cutting', currentStageLabel: '裁线剥皮' }
    }
    const productQty = bom.productQuantity

    function agg(list: { quantity: number; completed: number; status: string }[], useWire: boolean): { total: number; completed: number; status: 'pending' | 'processing' | 'completed' } {
      const total = useWire ? list.reduce((s, t) => s + t.quantity, 0) : productQty
      const completed = useWire ? list.reduce((s, t) => s + t.completed, 0) : list.length > 0 ? Math.min(...list.map(t => t.completed)) : 0
      let status: 'pending' | 'processing' | 'completed' = 'pending'
      if (list.length === 0) status = 'pending'
      else if (list.every(t => t.status === 'completed')) status = 'completed'
      else if (list.some(t => t.status === 'processing' || t.status === 'completed')) status = 'processing'
      return { total, completed, status }
    }

    const cuttingAgg = agg(cuttingTasks.value.filter(t => t.bomId === bomId), true)
    const crimpingAgg = agg(crimpingTasks.value.filter(t => t.bomId === bomId), true)
    const preAgg = agg(preAssemblyTasks.value.filter(t => t.bomId === bomId), true)
    const asmAgg = agg(assemblyTasks.value.filter(t => t.bomId === bomId), false)
    const testAgg = agg(conductorTestTasks.value.filter(t => t.bomId === bomId), false)
    const pkgAgg = agg(packagingTasks.value.filter(t => t.bomId === bomId), false)

    const stages: StageProgress[] = [
      { name: 'cutting', label: '裁线剥皮', totalQty: cuttingAgg.total, completedQty: cuttingAgg.completed, progress: cuttingAgg.total > 0 ? Math.round(cuttingAgg.completed * 100 / cuttingAgg.total) : 0, status: cuttingAgg.status },
      { name: 'crimping', label: '端子压接', totalQty: crimpingAgg.total, completedQty: crimpingAgg.completed, progress: crimpingAgg.total > 0 ? Math.round(crimpingAgg.completed * 100 / crimpingAgg.total) : 0, status: crimpingAgg.status },
      { name: 'preAssembly', label: '预装防水', totalQty: preAgg.total, completedQty: preAgg.completed, progress: preAgg.total > 0 ? Math.round(preAgg.completed * 100 / preAgg.total) : 0, status: preAgg.status },
      { name: 'assembly', label: '总装布线', totalQty: asmAgg.total, completedQty: asmAgg.completed, progress: asmAgg.total > 0 ? Math.round(asmAgg.completed * 100 / asmAgg.total) : 0, status: asmAgg.status },
      { name: 'test', label: '导通测试', totalQty: testAgg.total, completedQty: testAgg.completed, progress: testAgg.total > 0 ? Math.round(testAgg.completed * 100 / testAgg.total) : 0, status: testAgg.status },
      { name: 'packaging', label: '外观包装', totalQty: pkgAgg.total, completedQty: pkgAgg.completed, progress: pkgAgg.total > 0 ? Math.round(pkgAgg.completed * 100 / pkgAgg.total) : 0, status: pkgAgg.status }
    ]

    const wireStageAvg = stages.slice(0, 3).reduce((s, x) => s + x.progress, 0) / 3
    const productStageAvg = stages.slice(3).reduce((s, x) => s + x.progress, 0) / 3
    const overallProgress = Math.round((wireStageAvg + productStageAvg) / 2)

    let currentStage: StageName = 'cutting'
    for (let i = 0; i < stages.length; i++) {
      if (stages[i].status === 'processing') { currentStage = stages[i].name; break }
      if (stages[i].status === 'pending') { currentStage = stages[i].name; break }
      if (i === stages.length - 1) currentStage = stages[i].name
    }
    const currentStageLabel = stages.find(s => s.name === currentStage)?.label || '裁线剥皮'

    return { stages, overallProgress, currentStage, currentStageLabel }
  }

  function tryUpdateBatchStatus(batchId: string) {
    const batch = batches.value.find(b => b.id === batchId)
    if (!batch || batch.status === 'cancelled' || batch.status === 'completed') return
    const bomId = batch.bomId
    const { overallProgress, stages } = getProgressByBom(bomId)
    if (overallProgress >= 100 && stages.every(s => s.status === 'completed')) {
      completeProduction(bomId)
    }
  }

  function getMaterialSummary() {
    const wireList = wires.value.map(w => ({
      id: w.id,
      materialNo: w.wireNo,
      name: `${w.wireType} ${w.color} ${w.crossSection}mm²`,
      type: '线材' as MaterialType,
      stock: w.stock,
      occupied: w.occupiedQty || 0,
      available: Math.max(0, w.stock - (w.occupiedQty || 0)),
      unit: '米'
    }))
    const termList = terminals.value.map(t => ({
      id: t.id,
      materialNo: t.terminalNo,
      name: t.terminalType,
      type: '端子' as MaterialType,
      stock: t.stock,
      occupied: t.occupiedQty || 0,
      available: Math.max(0, t.stock - (t.occupiedQty || 0)),
      unit: '个'
    }))
    const plugList = waterproofPlugs.value.map(p => ({
      id: p.id,
      materialNo: p.plugNo,
      name: p.plugType,
      type: '防水栓' as MaterialType,
      stock: p.stock,
      occupied: p.occupiedQty || 0,
      available: Math.max(0, p.stock - (p.occupiedQty || 0)),
      unit: '个'
    }))
    return { wireList, termList, plugList, allMaterials: [...wireList, ...termList, ...plugList] }
  }

  return {
    boms,
    batches,
    reservations,
    cuttingTasks,
    crimpingTasks,
    preAssemblyTasks,
    assemblyTasks,
    conductorTestTasks,
    packagingTasks,
    wires,
    terminals,
    sheaths,
    waterproofPlugs,
    appearanceCheckItems,
    dashboardStats,
    weeklyOutputData,
    monthlyOutputData,
    processData,
    currentBOM,
    pendingCuttingTasks,
    processingCuttingTasks,
    completedCuttingTasks,
    pendingCrimpingTasks,
    processingCrimpingTasks,
    completedCrimpingTasks,
    pendingPreAssemblyTasks,
    processingPreAssemblyTasks,
    completedPreAssemblyTasks,
    pendingAssemblyTasks,
    processingAssemblyTasks,
    completedAssemblyTasks,
    setCurrentBOM,
    addBOM,
    updateBOMStatus,
    getBatchByBom,
    updateCuttingTaskStatus,
    updateCuttingCompleted,
    updateCrimpingTaskStatus,
    updateCrimpingCompleted,
    addCrimpingRecord,
    updatePreAssemblyTaskStatus,
    updatePreAssemblyCompleted,
    updateAssemblyTaskStatus,
    updateAssemblyCompleted,
    addRetainForceRecord,
    updateConductorTestTaskStatus,
    addConductorTestRecord,
    updatePackagingTaskStatus,
    updatePackagingCompleted,
    saveAppearanceCheckRecords,
    setBellowsCoverage,
    addLabelPrintRecord,
    generateCuttingTasksFromBOM,
    issueProduction,
    cancelProduction,
    completeProduction,
    getTaskSummaryByBom,
    calcMaterialRequirement,
    calcMaterialRequirementWithShortage,
    reserveMaterialsForBatch,
    releaseReservationsForBatch,
    consumeReservationsForBatch,
    getProgressByBom,
    getMaterialSummary
  }
})
