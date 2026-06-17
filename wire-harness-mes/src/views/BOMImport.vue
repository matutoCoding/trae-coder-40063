<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadRawFile, UploadUserFile } from 'element-plus'
import * as XLSX from 'xlsx'
import { Plus, Download, UploadFilled, DataAnalysis, VideoPlay } from '@element-plus/icons-vue'
import { useMESStore } from '../stores/mes'
import type { BOMItem, BOM } from '../types'

const IconPlus = Plus
const IconDownload = Download
const IconDataAnalysis = DataAnalysis
const IconVideoPlay = VideoPlay

const store = useMESStore()
const route = useRoute()
const router = useRouter()

const activeTab = ref<'excel' | 'manual'>('excel')
const uploading = ref(false)
const uploadFile = ref<UploadRawFile | null>(null)
const uploadFileList = ref<UploadUserFile[]>([])
const excelPreviewData = ref<BOMItem[]>([])
const dialogVisible = ref(false)
const materialDialogVisible = ref(false)

const excelInfo = ref({ productNo: '', productName: '', version: 'V1.0', productQuantity: 1, totalQuantity: 0 })

const manualForm = reactive({
  productNo: '',
  productName: '',
  version: 'V1.0',
  productQuantity: 1,
  totalQuantity: 0,
  items: [] as BOMItem[]
})

const materialCalcBom = ref<BOM | null>(null)
const materialCalcResult = ref<any>(null)

const activeBomId = computed(() => route.query.bomId as string || null)

const activeBom = computed(() => {
  if (!activeBomId.value) return null
  return store.boms.find(b => b.id === activeBomId.value) || null
})

const activeTaskSummary = computed(() => {
  if (!activeBomId.value) return null
  return store.getTaskSummaryByBom(activeBomId.value)
})

const manualActualQty = (row: BOMItem) => manualForm.productQuantity * (row.perSetQuantity || 1)
const excelActualQty = (row: BOMItem) => excelInfo.value.productQuantity * (row.perSetQuantity || 1)

watch(
  [() => manualForm.productQuantity, () => manualForm.items],
  () => {
    manualForm.totalQuantity = manualForm.items.reduce((s, i) => s + manualActualQty(i), 0)
  },
  { deep: true }
)

watch(
  [() => excelInfo.value.productQuantity, () => excelPreviewData.value],
  () => {
    excelInfo.value.totalQuantity = excelPreviewData.value.reduce((s, i) => s + excelActualQty(i), 0)
  },
  { deep: true }
)

function handleDownloadTemplate() {
  const data = [
    { '产品编号': 'WH-DEMO-001', '产品名称': '示例线束总成', '产品批量': 50, '线号': 'AVSS-0.5-RD', '线类型': 'AVSS', '颜色': '红色', '截面积mm²': 0.5, '长度mm': 450, '每套用几根': 1, '左端端子': '1.5系列-公端', '右端端子': '1.5系列-母端', '左防水栓': 'WPD-1.5', '右防水栓': 'WPD-1.5', '数量': 50, '备注': '电源线示例' },
    { '产品编号': '', '产品名称': '', '产品批量': '', '线号': 'AVSS-0.75-YL', '线类型': 'AVSS', '颜色': '黄色', '截面积mm²': 0.75, '长度mm': 520, '每套用几根': 2, '左端端子': '2.8系列-公端', '右端端子': '2.8系列-母端', '左防水栓': 'WPD-2.8', '右防水栓': 'WPD-2.8', '数量': 100, '备注': '信号线示例，每套用2根' },
  ]
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 18 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '线束BOM')
  XLSX.writeFile(wb, '线束BOM导入模板.xlsx')
  ElMessage.success('模板已下载，请按格式填写后导入')
}

function handleExcelChange(file: UploadRawFile, fileList: UploadUserFile[]) {
  uploadFile.value = file
  uploadFileList.value.splice(0, uploadFileList.value.length, ...fileList)
  uploading.value = true

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const firstSheet = wb.Sheets[wb.SheetNames[0]]
      const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })

      if (jsonData.length === 0) {
        ElMessage.error('Excel内容为空')
        uploading.value = false
        return
      }

      const excelProductNoRow = jsonData.find(r => r['产品编号'] || r['productNo'] || r['ProductNo'])
      const excelProductNameRow = jsonData.find(r => r['产品名称'] || r['productName'] || r['ProductName'])
      const excelQtyRow = jsonData.find(r => r['产品批量'] !== undefined && r['产品批量'] !== '' && r['产品批量'] !== null)

      const excelProductNo = excelProductNoRow ? String(excelProductNoRow['产品编号'] || excelProductNoRow['productNo'] || '') : ''
      const excelProductName = excelProductNameRow ? String(excelProductNameRow['产品名称'] || excelProductNameRow['productName'] || '') : ''
      const excelProductQty = excelQtyRow && !isNaN(Number(excelQtyRow['产品批量'])) ? Number(excelQtyRow['产品批量']) : null

      const items: BOMItem[] = jsonData.map((row, idx) => {
        const perSet = Number(row['每套用几根'] || row['perSet'] || row['PerSet'] || 1) || 1
        const qtyRaw = Number(row['数量'] || row['quantity'] || row['Qty'])
        const productQty = excelProductQty || 1
        const quantity = qtyRaw > 0 ? qtyRaw : productQty * perSet
        return {
          id: `import_${Date.now()}_${idx}`,
          wireNo: String(row['线号'] || row['wireNo'] || row['WireNo'] || ''),
          wireType: String(row['线类型'] || row['wireType'] || row['Type'] || 'AVSS'),
          color: String(row['颜色'] || row['color'] || row['Color'] || ''),
          crossSection: Number(row['截面积mm²'] || row['截面积'] || row['crossSection'] || 0.5),
          length: Number(row['长度mm'] || row['长度'] || row['length'] || 300),
          leftTerminal: String(row['左端端子'] || row['leftTerminal'] || row['LeftTerminal'] || ''),
          rightTerminal: String(row['右端端子'] || row['rightTerminal'] || row['RightTerminal'] || ''),
          leftWaterproof: String(row['左防水栓'] || row['leftWaterproof'] || ''),
          rightWaterproof: String(row['右防水栓'] || row['rightWaterproof'] || ''),
          perSetQuantity: perSet,
          quantity,
          remark: String(row['备注'] || row['remark'] || row['Remark'] || '')
        }
      }).filter(it => it.wireNo)

      if (items.length === 0) {
        ElMessage.error('未解析到有效线号，请检查Excel列名是否与模板一致')
        uploading.value = false
        return
      }

      excelPreviewData.value = items
      const fname = file.name.replace(/\.(xlsx|xls)$/i, '')
      excelInfo.value.productNo = excelProductNo || `WH-IMP-${String(store.boms.length + 1).padStart(3, '0')}`
      excelInfo.value.productName = excelProductName || fname
      excelInfo.value.productQuantity = excelProductQty && excelProductQty > 0 ? excelProductQty : 1
      excelInfo.value.totalQuantity = items.reduce((s, i) => s + (excelInfo.value.productQuantity * (i.perSetQuantity || 1)), 0)
      uploading.value = false
    } catch (err) {
      console.error(err)
      ElMessage.error('Excel解析失败，请确认文件格式正确')
      uploading.value = false
    }
  }
  reader.readAsArrayBuffer(file)
  return false
}

function addManualRow() {
  manualForm.items.push({
    id: `manual_${Date.now()}_${manualForm.items.length}`,
    wireNo: '',
    wireType: 'AVSS',
    color: '',
    crossSection: 0.5,
    length: 300,
    leftTerminal: '',
    rightTerminal: '',
    leftWaterproof: '',
    rightWaterproof: '',
    perSetQuantity: 1,
    quantity: manualForm.productQuantity,
    remark: ''
  })
}

function removeManualRow(id: string) {
  const idx = manualForm.items.findIndex(i => i.id === id)
  if (idx >= 0) manualForm.items.splice(idx, 1)
}

function handleClearExcel() {
  excelPreviewData.value = []
  uploadFileList.value = []
  excelInfo.value = { productNo: '', productName: '', version: 'V1.0', productQuantity: 1, totalQuantity: 0 }
}

function buildBOMFromExcel(): BOM | null {
  if (!excelInfo.value.productNo || !excelInfo.value.productName) {
    ElMessage.warning('请填写产品编号和产品名称')
    return null
  }
  if (excelPreviewData.value.length === 0) {
    ElMessage.warning('请先导入Excel文件并解析')
    return null
  }
  if (excelInfo.value.productQuantity <= 0) {
    ElMessage.warning('产品批量必须大于0')
    return null
  }
  const invalid = excelPreviewData.value.find(i => !i.wireNo)
  if (invalid) {
    ElMessage.warning('第 ' + (excelPreviewData.value.indexOf(invalid) + 1) + ' 行线号为空，请完善')
    return null
  }

  const items = excelPreviewData.value.map(i => ({
    ...i,
    perSetQuantity: i.perSetQuantity || 1,
    quantity: excelInfo.value.productQuantity * (i.perSetQuantity || 1)
  }))
  return {
    id: `bom_${Date.now()}`,
    productNo: excelInfo.value.productNo,
    productName: excelInfo.value.productName,
    version: excelInfo.value.version,
    createTime: new Date().toLocaleString('zh-CN'),
    totalWires: items.length,
    productQuantity: excelInfo.value.productQuantity,
    totalQuantity: items.reduce((s, i) => s + i.quantity, 0),
    items,
    status: 'draft'
  }
}

function buildBOMFromManual(): BOM | null {
  if (!manualForm.productNo || !manualForm.productName) {
    ElMessage.warning('请填写产品编号和产品名称')
    return null
  }
  if (manualForm.items.length === 0) {
    ElMessage.warning('请至少添加一条明细')
    return null
  }
  if (manualForm.productQuantity <= 0) {
    ElMessage.warning('产品批量必须大于0')
    return null
  }
  const invalid = manualForm.items.find(i => !i.wireNo)
  if (invalid) {
    ElMessage.warning('存在线号为空的明细行，请完善')
    return null
  }

  const items = manualForm.items.map(i => ({
    ...i,
    perSetQuantity: i.perSetQuantity || 1,
    quantity: manualForm.productQuantity * (i.perSetQuantity || 1)
  }))
  return {
    id: `bom_${Date.now()}`,
    productNo: manualForm.productNo,
    productName: manualForm.productName,
    version: manualForm.version,
    createTime: new Date().toLocaleString('zh-CN'),
    totalWires: items.length,
    productQuantity: manualForm.productQuantity,
    totalQuantity: items.reduce((s, i) => s + i.quantity, 0),
    items,
    status: 'draft'
  }
}

function confirmImport() {
  let newBOM: BOM | null = null
  if (activeTab.value === 'excel') {
    newBOM = buildBOMFromExcel()
  } else {
    newBOM = buildBOMFromManual()
  }
  if (!newBOM) return
  store.addBOM(newBOM)
  ElMessage.success(`BOM已导入：${newBOM.productNo}（${newBOM.productName}）· 产品批量${newBOM.productQuantity}套 · 共${newBOM.totalWires}种线号`)
  router.push({ query: { bomId: newBOM.id } })
  dialogVisible.value = false
}

function showMaterialCalc(fromExcel: boolean) {
  let bom: BOM | null = null
  if (fromExcel) {
    bom = buildBOMFromExcel()
  } else {
    bom = buildBOMFromManual()
  }
  if (!bom) return
  materialCalcBom.value = bom
  materialCalcResult.value = store.calcMaterialRequirement(bom)
  materialDialogVisible.value = true
}

function showMaterialCalcForBom() {
  if (!activeBom.value) return
  materialCalcBom.value = activeBom.value
  materialCalcResult.value = store.calcMaterialRequirement(activeBom.value)
  materialDialogVisible.value = true
}

async function handleIssue() {
  if (!activeBom.value) return
  const result = store.calcMaterialRequirement(activeBom.value)
  if (result.hasShortage) {
    const names = result.shortageList.map((s: any, i: number) => `${i + 1}. ${s.type} - ${s.name} 需${s.need}，库存${s.stock}，缺${s.shortage}`).join('\n')
    try {
      await ElMessageBox.confirm(
        `检测到以下物料库存不足，是否仍要下发？\n\n${names}`,
        '物料库存不足提醒',
        { type: 'warning', confirmButtonText: '仍要下发', cancelButtonText: '取消', dangerouslyUseHTMLString: false }
      )
    } catch {
      return
    }
  }
  store.generateCuttingTasksFromBOM(activeBom.value.id)
  store.updateBOMStatus(activeBom.value.id, 'producing')
  ElMessage.success(`已下发BOM：${activeBom.value.productNo}，各工序任务已生成`)
}

function resetImport() {
  activeTab.value = 'excel'
  handleClearExcel()
  manualForm.productNo = ''
  manualForm.productName = ''
  manualForm.version = 'V1.0'
  manualForm.productQuantity = 1
  manualForm.totalQuantity = 0
  manualForm.items.splice(0, manualForm.items.length)
  dialogVisible.value = true
}

function openImport() {
  resetImport()
}

function goToProcess(process: string) {
  if (!activeBom.value) return
  router.push({ path: `/${process}`, query: { productNo: activeBom.value.productNo } })
}

function getStatusTag(status: string) {
  const map: Record<string, { type: string; text: string }> = {
    draft: { type: 'info', text: '草稿' },
    approved: { type: 'warning', text: '已审核' },
    producing: { type: 'primary', text: '生产中' },
    completed: { type: 'success', text: '已完成' }
  }
  return map[status] || { type: 'info', text: status }
}

if (activeBomId.value) {
  // 有bomId就停在详情视图，不打开导入弹窗
} else {
  // 默认无bomId时展示导入弹窗方便快速操作
  dialogVisible.value = true
}
</script>

<template>
  <div class="bom-import-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">BOM导入</h2>
        <p class="page-subtitle">线束物料清单导入、管理与生产下发</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="IconPlus" @click="openImport">
          新建导入
        </el-button>
      </div>
    </div>

    <!-- 列表视图 -->
    <div class="card" v-if="!activeBom">
      <div class="card-header">
        <h3 class="card-title">BOM清单</h3>
      </div>
      <el-table :data="store.boms" style="width: 100%" stripe @row-click="(row: BOM) => router.push({ query: { bomId: row.id } })" highlight-current-row>
        <el-table-column type="index" label="#" width="50" align="center" />
        <el-table-column prop="productNo" label="产品编号" width="140" />
        <el-table-column prop="productName" label="产品名称" />
        <el-table-column label="产品批量" width="110" align="right">
          <template #default="{ row }">
            <b style="color:#1890ff">{{ row.productQuantity || row.totalQuantity }}</b> 套
          </template>
        </el-table-column>
        <el-table-column prop="totalWires" label="线号种数" width="90" align="right" />
        <el-table-column label="线号总需求" width="110" align="right">
          <template #default="{ row }">
            {{ row.totalQuantity }} 根
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="80" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status).type" size="small">
              {{ getStatusTag(row.status).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click.stop="router.push({ query: { bomId: row.id } })">详情</el-button>
            <el-button type="success" link size="small" :disabled="row.status === 'producing' || row.status === 'completed'" @click.stop="handleIssue">
              {{ store.getTaskSummaryByBom(row.id).cutting > 0 ? '查看任务' : '下发生产' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 详情视图 -->
    <div v-if="activeBom" class="detail-view">
      <div class="card mb-16">
        <div class="detail-top">
          <div>
            <el-button type="info" link @click="router.push({ query: {} })">← 返回BOM列表</el-button>
            <h3 class="detail-title">{{ activeBom.productNo }} · {{ activeBom.productName }}</h3>
            <div class="detail-meta">
              <el-tag :type="getStatusTag(activeBom.status).type">{{ getStatusTag(activeBom.status).text }}</el-tag>
              <span>版本 {{ activeBom.version }}</span>
              <span>创建于 {{ activeBom.createTime }}</span>
            </div>
          </div>
          <div class="detail-actions">
            <el-button type="info" :icon="IconDataAnalysis" @click="showMaterialCalcForBom">物料需求核算</el-button>
            <el-button v-if="activeBom.status === 'draft' || activeBom.status === 'approved'" type="primary" :icon="IconVideoPlay" @click="handleIssue">
              {{ activeTaskSummary && activeTaskSummary.cutting > 0 ? '查看已生成任务' : '下发生产' }}
            </el-button>
          </div>
        </div>

        <el-row :gutter="20" class="summary-row">
          <el-col :span="6">
            <div class="sum-card">
              <div class="sum-label">产品批量</div>
              <div class="sum-value" style="color:#1890ff">{{ activeBom.productQuantity }} <span class="unit">套</span></div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="sum-card">
              <div class="sum-label">线号种数</div>
              <div class="sum-value">{{ activeBom.totalWires }} <span class="unit">种</span></div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="sum-card">
              <div class="sum-label">线号总需求</div>
              <div class="sum-value">{{ activeBom.totalQuantity }} <span class="unit">根</span></div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="sum-card">
              <div class="sum-label">预估线材总长度</div>
              <div class="sum-value">
                {{ (activeBom.items.reduce((s, i) => s + i.quantity * i.length, 0) / 1000).toFixed(1) }}
                <span class="unit">米</span>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <div class="card mb-16" v-if="activeTaskSummary && (activeTaskSummary.cutting > 0 || activeTaskSummary.assembly > 0)">
        <div class="card-header">
          <h3 class="card-title">已生成的各工序任务</h3>
          <span class="muted">点击对应工序查看该产品任务</span>
        </div>
        <div class="task-summary">
          <div class="task-item" @click="goToProcess('cutting')">
            <div class="task-icon" style="background:#e6f7ff;color:#1890ff"><el-icon :size="22"><Scissors /></el-icon></div>
            <div class="task-info">
              <div class="task-name">裁线剥皮</div>
              <div class="task-count">{{ activeTaskSummary.cutting }} 条</div>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </div>
          <div class="task-item" @click="goToProcess('crimping')">
            <div class="task-icon" style="background:#f6ffed;color:#52c41a"><el-icon :size="22"><Connection /></el-icon></div>
            <div class="task-info">
              <div class="task-name">端子压接</div>
              <div class="task-count">{{ activeTaskSummary.crimping }} 条</div>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </div>
          <div class="task-item" @click="goToProcess('pre-assembly')">
            <div class="task-icon" style="background:#fffbe6;color:#faad14"><el-icon :size="22"><Watermelon /></el-icon></div>
            <div class="task-info">
              <div class="task-name">预装防水</div>
              <div class="task-count">{{ activeTaskSummary.preAssembly }} 条</div>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </div>
          <div class="task-item" @click="goToProcess('assembly')">
            <div class="task-icon" style="background:#f9f0ff;color:#722ed1"><el-icon :size="22"><Grid /></el-icon></div>
            <div class="task-info">
              <div class="task-name">总装布线</div>
              <div class="task-count">{{ activeTaskSummary.assembly }} 条</div>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </div>
          <div class="task-item" @click="goToProcess('conductor-test')">
            <div class="task-icon" style="background:#e6fffb;color:#13c2c2"><el-icon :size="22"><Lightning /></el-icon></div>
            <div class="task-info">
              <div class="task-name">导通测试</div>
              <div class="task-count">{{ activeTaskSummary.test }} 条</div>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </div>
          <div class="task-item" @click="goToProcess('packaging')">
            <div class="task-icon" style="background:#fff0f6;color:#eb2f96"><el-icon :size="22"><Box /></el-icon></div>
            <div class="task-info">
              <div class="task-name">外观包装</div>
              <div class="task-count">{{ activeTaskSummary.packaging }} 条</div>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">线号明细</h3>
        </div>
        <el-table :data="activeBom.items" size="small" border>
          <el-table-column type="index" label="#" width="50" align="center" />
          <el-table-column prop="wireNo" label="线号" width="140" />
          <el-table-column prop="wireType" label="线类型" width="90" />
          <el-table-column prop="color" label="颜色" width="70" />
          <el-table-column prop="crossSection" label="截面积" width="80" align="right">
            <template #default="{ row }">{{ row.crossSection }} mm²</template>
          </el-table-column>
          <el-table-column prop="length" label="长度" width="80" align="right">
            <template #default="{ row }">{{ row.length }} mm</template>
          </el-table-column>
          <el-table-column label="每套用几根" width="100" align="center">
            <template #default="{ row }">× {{ row.perSetQuantity || 1 }}</template>
          </el-table-column>
          <el-table-column label="单根需求量" width="100" align="right">
            <template #default="{ row }">
              <b style="color:#1890ff">{{ (activeBom.productQuantity * (row.perSetQuantity || 1)) }}</b> 根
            </template>
          </el-table-column>
          <el-table-column prop="leftTerminal" label="左端端子" width="120" />
          <el-table-column prop="rightTerminal" label="右端端子" width="120" />
          <el-table-column prop="leftWaterproof" label="左防水栓" width="110" />
          <el-table-column prop="rightWaterproof" label="右防水栓" width="110" />
          <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        </el-table>
      </div>
    </div>

    <!-- 导入弹窗 -->
    <el-dialog v-model="dialogVisible" title="BOM导入" width="1080px" :close-on-click-modal="false">
      <el-tabs v-model="activeTab" class="import-tabs">
        <el-tab-pane label="Excel导入" name="excel">
          <div class="import-section">
            <div class="section-tip">
              <el-alert type="info" :closable="false" show-icon>
                步骤1：先下载模板 → 步骤2：按格式填写 → 步骤3：上传文件 → 步骤4：确认预览内容后导入
              </el-alert>
            </div>
            <div class="section-actions">
              <el-button type="success" :icon="IconDownload" @click="handleDownloadTemplate">下载导入模板</el-button>
              <span class="tip-text">模板含示例数据，可参照填写</span>
            </div>

            <div class="info-row">
              <el-form :model="excelInfo" label-width="90px" inline>
                <el-form-item label="产品编号">
                  <el-input v-model="excelInfo.productNo" placeholder="如 WH-2024-001" />
                </el-form-item>
                <el-form-item label="产品名称">
                  <el-input v-model="excelInfo.productName" placeholder="如 发动机舱线束总成" />
                </el-form-item>
                <el-form-item label="版本">
                  <el-input v-model="excelInfo.version" style="width: 120px" />
                </el-form-item>
                <el-form-item label="产品批量">
                  <el-input-number v-model="excelInfo.productQuantity" :min="1" />
                </el-form-item>
                <el-form-item label="线号总需求">
                  <el-tag type="primary" size="large">{{ excelInfo.totalQuantity }} 根</el-tag>
                </el-form-item>
              </el-form>
            </div>

            <el-upload
              class="upload-demo"
              drag
              action="#"
              :auto-upload="false"
              :show-file-list="true"
              :file-list="uploadFileList"
              accept=".xlsx,.xls"
              :on-change="handleExcelChange"
              :limit="1"
            >
              <el-icon :size="48" color="#1890ff"><UploadFilled /></el-icon>
              <div class="el-upload__text">拖拽Excel文件到这里，或<em>点击选择文件</em></div>
              <template #tip>
                <div class="el-upload__tip">仅支持 .xlsx / .xls 格式</div>
              </template>
            </el-upload>

            <div v-if="excelPreviewData.length > 0" class="preview-box">
              <div class="preview-head">
                <h4>解析预览（可直接修改）</h4>
                <el-button size="small" type="danger" link @click="handleClearExcel">清空重选</el-button>
              </div>
              <el-table :data="excelPreviewData" size="small" border style="width: 100%">
                <el-table-column type="index" label="#" width="45" align="center" />
                <el-table-column label="线号" width="130">
                  <template #default="{ row }"><el-input v-model="row.wireNo" size="small" /></template>
                </el-table-column>
                <el-table-column label="线类型" width="90">
                  <template #default="{ row }"><el-input v-model="row.wireType" size="small" /></template>
                </el-table-column>
                <el-table-column label="颜色" width="70">
                  <template #default="{ row }"><el-input v-model="row.color" size="small" /></template>
                </el-table-column>
                <el-table-column label="截面积mm²" width="95">
                  <template #default="{ row }"><el-input-number v-model="row.crossSection" :min="0.1" :step="0.25" size="small" controls-position="right" /></template>
                </el-table-column>
                <el-table-column label="长度mm" width="95">
                  <template #default="{ row }"><el-input-number v-model="row.length" :min="1" size="small" controls-position="right" /></template>
                </el-table-column>
                <el-table-column label="每套用几根" width="100">
                  <template #default="{ row }"><el-input-number v-model="row.perSetQuantity" :min="1" size="small" controls-position="right" /></template>
                </el-table-column>
                <el-table-column label="单根需求量" width="100" align="center">
                  <template #default="{ row }">
                    <b style="color:#1890ff">{{ excelInfo.productQuantity * (row.perSetQuantity || 1) }}</b>
                  </template>
                </el-table-column>
                <el-table-column label="左端端子" width="120">
                  <template #default="{ row }"><el-input v-model="row.leftTerminal" size="small" /></template>
                </el-table-column>
                <el-table-column label="右端端子" width="120">
                  <template #default="{ row }"><el-input v-model="row.rightTerminal" size="small" /></template>
                </el-table-column>
                <el-table-column label="左防水栓" width="110">
                  <template #default="{ row }"><el-input v-model="row.leftWaterproof" size="small" /></template>
                </el-table-column>
                <el-table-column label="右防水栓" width="110">
                  <template #default="{ row }"><el-input v-model="row.rightWaterproof" size="small" /></template>
                </el-table-column>
                <el-table-column label="备注" min-width="140">
                  <template #default="{ row }"><el-input v-model="row.remark" size="small" /></template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="手动录入" name="manual">
          <div class="import-section">
            <div class="info-row">
              <el-form :model="manualForm" label-width="90px" inline>
                <el-form-item label="产品编号">
                  <el-input v-model="manualForm.productNo" placeholder="如 WH-2024-001" />
                </el-form-item>
                <el-form-item label="产品名称">
                  <el-input v-model="manualForm.productName" placeholder="如 发动机舱线束总成" />
                </el-form-item>
                <el-form-item label="版本">
                  <el-input v-model="manualForm.version" style="width: 120px" />
                </el-form-item>
                <el-form-item label="产品批量">
                  <el-input-number v-model="manualForm.productQuantity" :min="1" />
                </el-form-item>
                <el-form-item label="线号总需求">
                  <el-tag type="primary" size="large">{{ manualForm.totalQuantity }} 根</el-tag>
                </el-form-item>
              </el-form>
            </div>
            <div class="section-actions">
              <el-button type="primary" :icon="IconPlus" @click="addManualRow">新增明细行</el-button>
            </div>
            <el-table :data="manualForm.items" size="small" border style="width: 100%">
              <el-table-column type="index" label="#" width="45" align="center" />
              <el-table-column label="线号" width="130">
                <template #default="{ row }"><el-input v-model="row.wireNo" size="small" placeholder="必填" /></template>
              </el-table-column>
              <el-table-column label="线类型" width="90">
                <template #default="{ row }"><el-input v-model="row.wireType" size="small" /></template>
              </el-table-column>
              <el-table-column label="颜色" width="70">
                <template #default="{ row }"><el-input v-model="row.color" size="small" /></template>
              </el-table-column>
              <el-table-column label="截面积mm²" width="95">
                <template #default="{ row }"><el-input-number v-model="row.crossSection" :min="0.1" :step="0.25" size="small" controls-position="right" /></template>
              </el-table-column>
              <el-table-column label="长度mm" width="95">
                <template #default="{ row }"><el-input-number v-model="row.length" :min="1" size="small" controls-position="right" /></template>
              </el-table-column>
              <el-table-column label="每套用几根" width="100">
                <template #default="{ row }"><el-input-number v-model="row.perSetQuantity" :min="1" size="small" controls-position="right" /></template>
              </el-table-column>
              <el-table-column label="单根需求量" width="100" align="center">
                <template #default="{ row }">
                  <b style="color:#1890ff">{{ manualActualQty(row) }}</b>
                </template>
              </el-table-column>
              <el-table-column label="左端端子" width="120">
                <template #default="{ row }"><el-input v-model="row.leftTerminal" size="small" /></template>
              </el-table-column>
              <el-table-column label="右端端子" width="120">
                <template #default="{ row }"><el-input v-model="row.rightTerminal" size="small" /></template>
              </el-table-column>
              <el-table-column label="左防水栓" width="110">
                <template #default="{ row }"><el-input v-model="row.leftWaterproof" size="small" /></template>
              </el-table-column>
              <el-table-column label="右防水栓" width="110">
                <template #default="{ row }"><el-input v-model="row.rightWaterproof" size="small" /></template>
              </el-table-column>
              <el-table-column label="备注" min-width="140">
                <template #default="{ row }"><el-input v-model="row.remark" size="small" /></template>
              </el-table-column>
              <el-table-column label="操作" width="70" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button type="danger" link size="small" @click="removeManualRow(row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div v-if="manualForm.items.length === 0" class="empty-tip">暂无明细，请点击「新增明细行」</div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="info" :icon="IconDataAnalysis" @click="showMaterialCalc(activeTab === 'excel')">物料需求核算</el-button>
        <el-button type="primary" @click="confirmImport">确认导入</el-button>
      </template>
    </el-dialog>

    <!-- 物料需求核算弹窗 -->
    <el-dialog v-model="materialDialogVisible" title="物料需求核算" width="880px" :close-on-click-modal="false">
      <div v-if="materialCalcBom && materialCalcResult">
        <div class="mat-header">
          <div>
            <b>{{ materialCalcBom.productNo }}</b> · {{ materialCalcBom.productName }} ·
            <el-tag type="primary">产品批量 {{ materialCalcBom.productQuantity }} 套</el-tag>
          </div>
          <el-alert
            v-if="materialCalcResult.hasShortage"
            type="error"
            :closable="false"
            show-icon
            style="width: 380px"
            title="部分物料库存不足，请补充后再生产"
          />
          <el-alert v-else type="success" :closable="false" show-icon style="width: 280px" title="所有物料库存充足" />
        </div>

        <div class="section-title">线材需求（按米）</div>
        <el-table :data="materialCalcResult.wires" size="small" border>
          <el-table-column type="index" label="#" width="45" align="center" />
          <el-table-column prop="wireNo" label="线号" width="130" />
          <el-table-column prop="color" label="颜色" width="70" />
          <el-table-column label="截面积" width="80" align="right">
            <template #default="{ row }">{{ row.crossSection }} mm²</template>
          </el-table-column>
          <el-table-column prop="totalLengthMeter" label="需求长度(米)" width="110" align="right" />
          <el-table-column prop="stockMeter" label="库存(米)" width="100" align="right" />
          <el-table-column label="短缺" width="100" align="right">
            <template #default="{ row }">
              <span :style="{ color: row.shortage > 0 ? '#f5222d' : '#52c41a', fontWeight: 500 }">
                {{ row.shortage > 0 ? `缺${row.shortage}米` : '充足' }}
              </span>
            </template>
          </el-table-column>
        </el-table>

        <div class="section-title">端子需求（按个）</div>
        <el-table :data="materialCalcResult.terminals" size="small" border>
          <el-table-column type="index" label="#" width="45" align="center" />
          <el-table-column prop="terminalNo" label="端子型号" />
          <el-table-column prop="count" label="需求数" width="100" align="right" />
          <el-table-column prop="stock" label="库存" width="100" align="right" />
          <el-table-column label="短缺" width="100" align="right">
            <template #default="{ row }">
              <span :style="{ color: row.shortage > 0 ? '#f5222d' : '#52c41a', fontWeight: 500 }">
                {{ row.shortage > 0 ? `缺${row.shortage}个` : '充足' }}
              </span>
            </template>
          </el-table-column>
        </el-table>

        <div class="section-title">防水栓需求（按个）</div>
        <el-table :data="materialCalcResult.waterproofPlugs" size="small" border empty-text="本BOM无需防水栓">
          <el-table-column type="index" label="#" width="45" align="center" />
          <el-table-column prop="plugNo" label="防水栓型号" />
          <el-table-column prop="count" label="需求数" width="100" align="right" />
          <el-table-column prop="stock" label="库存" width="100" align="right" />
          <el-table-column label="短缺" width="100" align="right">
            <template #default="{ row }">
              <span :style="{ color: row.shortage > 0 ? '#f5222d' : '#52c41a', fontWeight: 500 }">
                {{ row.shortage > 0 ? `缺${row.shortage}个` : '充足' }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="materialDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.bom-import-page {
  padding-bottom: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 13px;
  color: #8c8c8c;
}

.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin: 0;
}

.muted {
  color: #8c8c8c;
  font-size: 12px;
}

.mb-16 { margin-bottom: 16px; }

.detail-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  margin: 8px 0 6px;
  color: #262626;
}

.detail-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #8c8c8c;
  align-items: center;
}

.detail-actions {
  display: flex;
  gap: 10px;
}

.summary-row {
  padding: 16px 20px;
}

.sum-card {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px 20px;
}

.sum-label {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 6px;
}

.sum-value {
  font-size: 26px;
  font-weight: 600;
  color: #262626;
}

.sum-value .unit {
  font-size: 14px;
  color: #8c8c8c;
  font-weight: normal;
}

.task-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px 20px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: #fafafa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.task-item:hover {
  background: #e6f4ff;
  transform: translateY(-1px);
}

.task-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.task-info { flex: 1; }

.task-name {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
}

.task-count {
  font-size: 20px;
  font-weight: 600;
  color: #262626;
}

.import-section {
  padding: 16px 4px;
}

.section-tip {
  margin-bottom: 14px;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.tip-text {
  color: #8c8c8c;
  font-size: 13px;
}

.info-row {
  background: #fafafa;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 16px;
}

.upload-demo {
  margin-bottom: 20px;
}

.preview-box {
  background: #fafafa;
  border-radius: 8px;
  padding: 14px;
}

.preview-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.preview-head h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.empty-tip {
  padding: 40px;
  text-align: center;
  color: #8c8c8c;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin: 18px 0 10px;
  padding-left: 8px;
  border-left: 3px solid #1890ff;
}

.section-title:first-child {
  margin-top: 6px;
}

.mat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0 16px;
  font-size: 14px;
  gap: 16px;
}
</style>
