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
  LabelPrintRecord
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
  mockProcessData
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

const initialData = loadFromStorage<{
  boms: BOM[]
  cuttingTasks: CuttingTask[]
  crimpingTasks: CrimpingTask[]
  preAssemblyTasks: PreAssemblyTask[]
  assemblyTasks: AssemblyTask[]
  conductorTestTasks: ConductorTestTask[]
  packagingTasks: PackagingTask[]
}>(STORAGE_KEY, {
  boms: mockBOMs,
  cuttingTasks: mockCuttingTasks,
  crimpingTasks: mockCrimpingTasks,
  preAssemblyTasks: mockPreAssemblyTasks,
  assemblyTasks: mockAssemblyTasks,
  conductorTestTasks: mockConductorTestTasks,
  packagingTasks: mockPackagingTasks
})

export const useMESStore = defineStore('mes', () => {
  const boms = ref<BOM[]>(initialData.boms)
  const cuttingTasks = ref<CuttingTask[]>(initialData.cuttingTasks)
  const crimpingTasks = ref<CrimpingTask[]>(initialData.crimpingTasks)
  const preAssemblyTasks = ref<PreAssemblyTask[]>(initialData.preAssemblyTasks)
  const assemblyTasks = ref<AssemblyTask[]>(initialData.assemblyTasks)
  const conductorTestTasks = ref<ConductorTestTask[]>(initialData.conductorTestTasks)
  const packagingTasks = ref<PackagingTask[]>(initialData.packagingTasks)
  const wires = ref<WireMaterial[]>([...mockWires])
  const terminals = ref<TerminalMaterial[]>([...mockTerminals])
  const sheaths = ref<SheathMaterial[]>([...mockSheaths])
  const waterproofPlugs = ref<WaterproofPlug[]>([...mockWaterproofPlugs])
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
    [boms, cuttingTasks, crimpingTasks, preAssemblyTasks, assemblyTasks, conductorTestTasks, packagingTasks],
    () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          boms: boms.value,
          cuttingTasks: cuttingTasks.value,
          crimpingTasks: crimpingTasks.value,
          preAssemblyTasks: preAssemblyTasks.value,
          assemblyTasks: assemblyTasks.value,
          conductorTestTasks: conductorTestTasks.value,
          packagingTasks: packagingTasks.value
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

  function updateCuttingTaskStatus(id: string, status: CuttingTask['status']) {
    const task = cuttingTasks.value.find(t => t.id === id)
    if (task) {
      task.status = status
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
    }
  }

  function updateCrimpingTaskStatus(id: string, status: CrimpingTask['status']) {
    const task = crimpingTasks.value.find(t => t.id === id)
    if (task) {
      task.status = status
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
    }
  }

  function updateAssemblyTaskStatus(id: string, status: AssemblyTask['status']) {
    const task = assemblyTasks.value.find(t => t.id === id)
    if (task) {
      task.status = status
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
    }
  }

  function updatePackagingTaskStatus(id: string, status: PackagingTask['status']) {
    const task = packagingTasks.value.find(t => t.id === id)
    if (task) {
      task.status = status
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

  function generateCuttingTasksFromBOM(bomId: string) {
    const bom = boms.value.find(b => b.id === bomId)
    if (!bom) return

    const existingCount = cuttingTasks.value.filter(t => t.bomId === bomId).length
    if (existingCount > 0) return

    bom.items.forEach((item: BOMItem, index: number) => {
      const task: CuttingTask = {
        id: `cut_${Date.now()}_${index}`,
        bomId: bom.id,
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
        const leftTask: CrimpingTask = {
          id: `crimp_left_${Date.now()}_${index}`,
          bomId: bom.id,
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
        }
        crimpingTasks.value.unshift(leftTask)
      }
      if (item.rightTerminal && item.rightTerminal !== item.leftTerminal) {
        const rightTask: CrimpingTask = {
          id: `crimp_right_${Date.now()}_${index}`,
          bomId: bom.id,
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
        }
        crimpingTasks.value.unshift(rightTask)
      }
      if (item.leftWaterproof || item.rightWaterproof) {
        const preTask: PreAssemblyTask = {
          id: `pre_${Date.now()}_${index}`,
          bomId: bom.id,
          productNo: bom.productNo,
          wireNo: item.wireNo,
          waterproofPlug: item.leftWaterproof || item.rightWaterproof,
          side: (item.leftWaterproof && item.rightWaterproof) ? 'both' : item.leftWaterproof ? 'left' : 'right',
          quantity: item.quantity,
          completed: 0,
          status: 'pending',
          createTime: new Date().toLocaleString('zh-CN'),
          operator: ''
        }
        preAssemblyTasks.value.unshift(preTask)
      }
    })

    const asmTask: AssemblyTask = {
      id: `asm_${Date.now()}`,
      bomId: bom.id,
      productNo: bom.productNo,
      sheathNo: 'DJ7041-1.5-11',
      holePosition: '1#-4#孔',
      wireNo: bom.items[0]?.wireNo || '-',
      terminalNo: bom.items[0]?.leftTerminal || '-',
      quantity: bom.totalQuantity,
      completed: 0,
      status: 'pending',
      createTime: new Date().toLocaleString('zh-CN'),
      operator: '',
      retainForcePassed: false,
      retainForceRecords: []
    }
    assemblyTasks.value.unshift(asmTask)

    const testTask: ConductorTestTask = {
      id: `test_${Date.now()}`,
      bomId: bom.id,
      productNo: bom.productNo,
      quantity: bom.totalQuantity,
      completed: 0,
      passCount: 0,
      failCount: 0,
      status: 'pending',
      createTime: new Date().toLocaleString('zh-CN'),
      operator: '',
      records: []
    }
    conductorTestTasks.value.unshift(testTask)

    const pkgTask: PackagingTask = {
      id: `pkg_${Date.now()}`,
      bomId: bom.id,
      productNo: bom.productNo,
      quantity: bom.totalQuantity,
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
    }
    packagingTasks.value.unshift(pkgTask)
  }

  return {
    boms,
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
    generateCuttingTasksFromBOM
  }
})
