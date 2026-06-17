import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  BOM,
  CuttingTask,
  CrimpingTask,
  PreAssemblyTask,
  AssemblyTask,
  ConductorTestTask,
  PackagingTask,
  DashboardStats,
  WireMaterial,
  TerminalMaterial,
  SheathMaterial,
  WaterproofPlug,
  AppearanceCheckItem
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

export const useMESStore = defineStore('mes', () => {
  const boms = ref<BOM[]>([...mockBOMs])
  const cuttingTasks = ref<CuttingTask[]>([...mockCuttingTasks])
  const crimpingTasks = ref<CrimpingTask[]>([...mockCrimpingTasks])
  const preAssemblyTasks = ref<PreAssemblyTask[]>([...mockPreAssemblyTasks])
  const assemblyTasks = ref<AssemblyTask[]>([...mockAssemblyTasks])
  const conductorTestTasks = ref<ConductorTestTask[]>([...mockConductorTestTasks])
  const packagingTasks = ref<PackagingTask[]>([...mockPackagingTasks])
  const wires = ref<WireMaterial[]>([...mockWires])
  const terminals = ref<TerminalMaterial[]>([...mockTerminals])
  const sheaths = ref<SheathMaterial[]>([...mockSheaths])
  const waterproofPlugs = ref<WaterproofPlug[]>([...mockWaterproofPlugs])
  const appearanceCheckItems = ref<AppearanceCheckItem[]>([...mockAppearanceCheckItems])
  const dashboardStats = ref<DashboardStats>({ ...mockDashboardStats })
  const weeklyOutputData = ref([...mockWeeklyOutputData])
  const processData = ref([...mockProcessData])

  const currentBOM = ref<BOM | null>(null)

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

  function addCrimpingRecord(taskId: string, record: CrimpingTask['records'][0]) {
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

  function updateConductorTestTaskStatus(id: string, status: ConductorTestTask['status']) {
    const task = conductorTestTasks.value.find(t => t.id === id)
    if (task) {
      task.status = status
    }
  }

  function addConductorTestRecord(taskId: string, record: ConductorTestTask['records'][0]) {
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

  function generateCuttingTasksFromBOM(bomId: string) {
    const bom = boms.value.find(b => b.id === bomId)
    if (!bom) return

    bom.items.forEach((item, index) => {
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
    updateConductorTestTaskStatus,
    addConductorTestRecord,
    updatePackagingTaskStatus,
    updatePackagingCompleted,
    generateCuttingTasksFromBOM
  }
})
