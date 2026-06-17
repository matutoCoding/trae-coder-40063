<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMESStore } from '../stores/mes'
import type { BOM, BOMItem } from '../types'
import * as XLSX from 'xlsx'

const store = useMESStore()

const searchKeyword = ref('')
const statusFilter = ref('')
const dialogVisible = ref(false)
const detailVisible = ref(false)
const currentBOM = ref<BOM | null>(null)
const importType = ref('excel')

const uploading = ref(false)
const uploadFileList = ref<any[]>([])

const excelPreviewData = ref<BOMItem[]>([])
const excelInfo = ref({ productNo: '', productName: '', version: 'V1.0', totalQuantity: 100 })

const manualForm = ref({
  productNo: '',
  productName: '',
  version: 'V1.0',
  totalQuantity: 100,
  items: [] as BOMItem[]
})

const filteredBOMs = computed(() => {
  return store.boms.filter(bom => {
    const matchKeyword = !searchKeyword.value ||
      bom.productNo.includes(searchKeyword.value) ||
      bom.productName.includes(searchKeyword.value)
    const matchStatus = !statusFilter.value || bom.status === statusFilter.value
    return matchKeyword && matchStatus
  })
})

const statusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'approved', label: '已审核' },
  { value: 'producing', label: '生产中' },
  { value: 'completed', label: '已完成' }
]

function getStatusTag(status: string) {
  const map: Record<string, { type: string; text: string }> = {
    draft: { type: 'info', text: '草稿' },
    approved: { type: 'warning', text: '已审核' },
    producing: { type: 'primary', text: '生产中' },
    completed: { type: 'success', text: '已完成' }
  }
  return map[status] || { type: 'info', text: status }
}

function handleImport() {
  dialogVisible.value = true
  importType.value = 'excel'
  excelPreviewData.value = []
  uploadFileList.value.length = 0
  excelInfo.value = { productNo: '', productName: '', version: 'V1.0', totalQuantity: 100 }
  manualForm.value = {
    productNo: '',
    productName: '',
    version: 'V1.0',
    totalQuantity: 100,
    items: []
  }
}

function handleDetail(bom: BOM) {
  currentBOM.value = bom
  detailVisible.value = true
}

function handleApprove(bom: BOM) {
  ElMessageBox.confirm(`确认审核通过 "${bom.productName}"？`, '审核确认', {
    type: 'warning'
  }).then(() => {
    store.updateBOMStatus(bom.id, 'approved')
    ElMessage.success('审核成功')
  }).catch(() => {})
}

function handleStartProduce(bom: BOM) {
  ElMessageBox.confirm(`确认开始生产 "${bom.productName}"？\n将自动生成裁线、压接、预装、总装、测试、包装各工序任务`, '生产确认', {
    type: 'warning'
  }).then(() => {
    store.updateBOMStatus(bom.id, 'producing')
    store.generateCuttingTasksFromBOM(bom.id)
    ElMessage.success('生产任务已下发，所有工序任务已自动生成')
  }).catch(() => {})
}

function handleDelete(bom: BOM) {
  ElMessageBox.confirm(`确认删除 "${bom.productName}"？此操作不可撤销`, '删除确认', {
    type: 'error'
  }).then(() => {
    const idx = store.boms.findIndex(b => b.id === bom.id)
    if (idx >= 0) store.boms.splice(idx, 1)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function handleDownloadTemplate() {
  const data = [
    ['线号', '线类型', '颜色', '截面积mm²', '长度mm', '左端端子', '右端端子', '左防水栓', '右防水栓', '数量', '备注'],
    ['AVSS-0.5', 'AVSS', '红色', 0.5, 300, '1.5系列-公端', '1.5系列-母端', 'WPD-1.5', 'WPD-1.5', 100, '电源线示例'],
    ['AVSS-0.5-BK', 'AVSS', '黑色', 0.5, 280, '1.5系列-公端', '1.5系列-母端', '', '', 100, '地线示例']
  ]
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'BOM明细')
  XLSX.writeFile(wb, 'BOM导入模板.xlsx')
  ElMessage.success('模板已下载，请按格式填写后导入')
}

function handleExcelChange(uploadFile: any, fileList: any[]) {
  uploading.value = true
  uploadFileList.value.splice(0, uploadFileList.value.length, ...fileList)
  const file = uploadFile.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: 'binary' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

      if (jsonData.length === 0) {
        ElMessage.error('Excel内容为空')
        uploading.value = false
        return
      }

      const items: BOMItem[] = jsonData.map((row, idx) => ({
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
        quantity: Number(row['数量'] || row['quantity'] || row['Qty'] || 100),
        remark: String(row['备注'] || row['remark'] || row['Remark'] || '')
      })).filter(it => it.wireNo)

      if (items.length === 0) {
        ElMessage.error('未解析到有效线号，请检查Excel列名是否与模板一致')
        uploading.value = false
        return
      }

      excelPreviewData.value = items
      const fname = file.name.replace(/\.(xlsx|xls)$/i, '')
      excelInfo.value.productName = excelInfo.value.productName || fname
      excelInfo.value.productNo = excelInfo.value.productNo || `WH-IMP-${String(store.boms.length + 1).padStart(3, '0')}`
      excelInfo.value.totalQuantity = items[0]?.quantity || 100
      ElMessage.success(`成功解析 ${items.length} 条BOM明细`)
    } catch (err: any) {
      console.error(err)
      ElMessage.error('Excel解析失败：' + err.message)
    } finally {
      uploading.value = false
    }
  }
  reader.readAsBinaryString(file)
}

function addManualRow() {
  manualForm.value.items.push({
    id: `manual_${Date.now()}_${manualForm.value.items.length}`,
    wireNo: '',
    wireType: 'AVSS',
    color: '红色',
    crossSection: 0.5,
    length: 300,
    leftTerminal: '',
    rightTerminal: '',
    leftWaterproof: '',
    rightWaterproof: '',
    quantity: 100,
    remark: ''
  })
}

function removeManualRow(idx: number) {
  manualForm.value.items.splice(idx, 1)
}

function confirmImport() {
  let newBOM: BOM | null = null

  if (importType.value === 'excel') {
    if (excelPreviewData.value.length === 0) {
      ElMessage.warning('请先选择并解析Excel文件')
      return
    }
    if (!excelInfo.value.productNo || !excelInfo.value.productName) {
      ElMessage.warning('请填写产品编号和产品名称')
      return
    }
    const totalQty = Math.max(...excelPreviewData.value.map(i => i.quantity), 100)
    newBOM = {
      id: `bom_${Date.now()}`,
      productNo: excelInfo.value.productNo,
      productName: excelInfo.value.productName,
      version: excelInfo.value.version,
      createTime: new Date().toLocaleString('zh-CN'),
      totalWires: excelPreviewData.value.length,
      totalQuantity: totalQty,
      status: 'draft',
      items: excelPreviewData.value
    }
  } else {
    if (!manualForm.value.productNo || !manualForm.value.productName) {
      ElMessage.warning('请填写产品编号和产品名称')
      return
    }
    if (manualForm.value.items.length === 0) {
      ElMessage.warning('请至少添加一条BOM明细')
      return
    }
    const valid = manualForm.value.items.every(i => i.wireNo)
    if (!valid) {
      ElMessage.warning('每条明细必须填写线号')
      return
    }
    const totalQty = Math.max(...manualForm.value.items.map(i => i.quantity), 100)
    newBOM = {
      id: `bom_${Date.now()}`,
      productNo: manualForm.value.productNo,
      productName: manualForm.value.productName,
      version: manualForm.value.version,
      createTime: new Date().toLocaleString('zh-CN'),
      totalWires: manualForm.value.items.length,
      totalQuantity: totalQty,
      status: 'draft',
      items: [...manualForm.value.items]
    }
  }

  store.addBOM(newBOM)
  dialogVisible.value = false
  ElMessage.success(`BOM导入成功！共 ${newBOM.totalWires} 条线号，可在列表中查看`)
}

const tableColumns = [
  { prop: 'productNo', label: '产品编号', width: 140 },
  { prop: 'productName', label: '产品名称', minWidth: 180 },
  { prop: 'version', label: '版本', width: 80 },
  { prop: 'totalWires', label: '线号数', width: 80, align: 'center' },
  { prop: 'totalQuantity', label: '计划数量', width: 100, align: 'right' },
  { prop: 'createTime', label: '创建时间', width: 160 },
]
</script>

<template>
  <div class="bom-page">
    <div class="page-header">
      <h2 class="page-title">BOM导入</h2>
      <p class="page-subtitle">线束BOM管理与导入，支持Excel批量导入和手动录入；数据会自动保存在本地</p>
    </div>

    <div class="card">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索产品编号/名称"
            style="width: 260px"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 140px">
            <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>
        <div class="toolbar-right">
          <el-button @click="handleDownloadTemplate">
            <el-icon><Download /></el-icon>
            下载模板
          </el-button>
          <el-button type="primary" @click="handleImport">
            <el-icon><Upload /></el-icon>
            导入BOM
          </el-button>
        </div>
      </div>

      <el-table :data="filteredBOMs" style="width: 100%" stripe>
        <el-table-column type="index" label="#" width="50" align="center" />
        <el-table-column v-for="col in tableColumns" :key="col.prop" :prop="col.prop" :label="col.label" :width="col.width" :min-width="col.minWidth" :align="col.align" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status).type" size="small">
              {{ getStatusTag(row.status).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDetail(row)">
              详情
            </el-button>
            <el-button v-if="row.status === 'draft'" type="success" link size="small" @click="handleApprove(row)">
              审核
            </el-button>
            <el-button v-if="row.status === 'approved'" type="primary" link size="small" @click="handleStartProduce(row)">
              下发生产
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="total, prev, pager, next, sizes"
          :page-size="10"
          :total="filteredBOMs.length"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" title="导入BOM" width="860px" :close-on-click-modal="false" top="5vh">
      <div class="import-dialog">
        <el-radio-group v-model="importType" style="margin-bottom: 20px">
          <el-radio value="excel">Excel导入</el-radio>
          <el-radio value="manual">手动录入</el-radio>
        </el-radio-group>

        <div v-if="importType === 'excel'" class="excel-section">
          <el-alert title="请先点击「下载模板」，按模板填写后上传，支持 .xlsx / .xls" type="info" :closable="false" show-icon style="margin-bottom: 16px" />
          <el-upload
            drag
            action="#"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            :on-change="handleExcelChange"
            :file-list="uploadFileList"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将Excel文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .xlsx / .xls 格式，解析成功后可在下方预览和编辑
              </div>
            </template>
          </el-upload>

          <el-divider />
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
            </el-form>
          </div>

          <div v-if="excelPreviewData.length > 0">
            <div class="preview-title">
              <span>BOM明细预览（共 {{ excelPreviewData.length }} 条）</span>
              <el-button size="small" type="danger" link @click="excelPreviewData = []; uploadFileList = []">清空重选</el-button>
            </div>
            <el-table :data="excelPreviewData" size="small" border max-height="280" style="width: 100%">
              <el-table-column type="index" label="#" width="40" align="center" />
              <el-table-column prop="wireNo" label="线号" width="110">
                <template #default="{ row }">
                  <el-input v-model="row.wireNo" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="wireType" label="类型" width="80" />
              <el-table-column prop="color" label="颜色" width="70" />
              <el-table-column prop="crossSection" label="截面" width="60" align="right" />
              <el-table-column prop="length" label="长(mm)" width="70" align="right" />
              <el-table-column prop="leftTerminal" label="左端" width="100" />
              <el-table-column prop="rightTerminal" label="右端" width="100" />
              <el-table-column prop="quantity" label="数量" width="70" align="right" />
              <el-table-column prop="remark" label="备注" min-width="100" />
            </el-table>
          </div>
          <el-empty v-else description="尚未选择Excel文件" :image-size="80" style="padding: 30px 0" />
        </div>

        <div v-else class="manual-section">
          <el-alert title="依次填写BOM头信息，再添加明细行。支持增删明细行。" type="info" :closable="false" show-icon style="margin-bottom: 16px" />
          <el-form :model="manualForm" label-width="90px">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="产品编号" required>
                  <el-input v-model="manualForm.productNo" placeholder="如 WH-2024-005" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="产品名称" required>
                  <el-input v-model="manualForm.productName" placeholder="如 左前门线束总成" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="版本号">
                  <el-input v-model="manualForm.version" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>

          <div class="flex-between mb-12">
            <span class="section-title">BOM明细行</span>
            <el-button type="primary" size="small" @click="addManualRow">
              <el-icon><Plus /></el-icon>
              新增一行
            </el-button>
          </div>

          <el-table :data="manualForm.items" size="small" border style="width: 100%">
            <el-table-column type="index" label="#" width="40" align="center" />
            <el-table-column label="线号*" width="110">
              <template #default="{ row }">
                <el-input v-model="row.wireNo" size="small" placeholder="线号" />
              </template>
            </el-table-column>
            <el-table-column label="类型" width="80">
              <template #default="{ row }">
                <el-input v-model="row.wireType" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="颜色" width="80">
              <template #default="{ row }">
                <el-input v-model="row.color" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="截面mm²" width="80">
              <template #default="{ row }">
                <el-input-number v-model="row.crossSection" size="small" :min="0.1" :step="0.25" :precision="2" controls-position="right" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="长度mm" width="80">
              <template #default="{ row }">
                <el-input-number v-model="row.length" size="small" :min="1" :step="10" controls-position="right" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="左端端子" width="110">
              <template #default="{ row }">
                <el-input v-model="row.leftTerminal" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="右端端子" width="110">
              <template #default="{ row }">
                <el-input v-model="row.rightTerminal" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="数量" width="80">
              <template #default="{ row }">
                <el-input-number v-model="row.quantity" size="small" :min="1" :step="50" controls-position="right" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="110">
              <template #default="{ row }">
                <el-input v-model="row.remark" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="60" align="center" fixed="right">
              <template #default="{ $index }">
                <el-button type="danger" link size="small" @click="removeManualRow($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="manualForm.items.length === 0" description="暂无明细行，点击「新增一行」添加" :image-size="60" style="padding: 20px 0" />
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="confirmImport">确认导入</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="BOM详情" width="900px">
      <div v-if="currentBOM" class="bom-detail">
        <div class="detail-header">
          <div class="detail-info">
            <h3>{{ currentBOM.productName }}</h3>
            <div class="detail-meta">
              <span>产品编号：{{ currentBOM.productNo }}</span>
              <span>版本：{{ currentBOM.version }}</span>
              <span>创建时间：{{ currentBOM.createTime }}</span>
            </div>
          </div>
          <el-tag :type="getStatusTag(currentBOM.status).type" size="large">
            {{ getStatusTag(currentBOM.status).text }}
          </el-tag>
        </div>

        <el-divider />

        <div class="detail-summary">
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="summary-item">
                <span class="summary-label">线号总数</span>
                <span class="summary-value">{{ currentBOM.totalWires }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-item">
                <span class="summary-label">计划数量</span>
                <span class="summary-value">{{ currentBOM.totalQuantity }} 条</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-item">
                <span class="summary-label">物料种类</span>
                <span class="summary-value">{{ currentBOM.items.length }} 种</span>
              </div>
            </el-col>
          </el-row>
        </div>

        <h4 class="section-title">BOM明细</h4>
        <el-table :data="currentBOM.items" size="small" border>
          <el-table-column type="index" label="#" width="50" align="center" />
          <el-table-column prop="wireNo" label="线号" width="120" />
          <el-table-column prop="wireType" label="线类型" width="100" />
          <el-table-column prop="color" label="颜色" width="80" align="center" />
          <el-table-column prop="crossSection" label="截面积(mm²)" width="100" align="right" />
          <el-table-column prop="length" label="长度(mm)" width="90" align="right" />
          <el-table-column prop="leftTerminal" label="左端端子" width="120" />
          <el-table-column prop="rightTerminal" label="右端端子" width="120" />
          <el-table-column prop="quantity" label="数量" width="80" align="right" />
          <el-table-column prop="remark" label="备注" min-width="100" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.bom-page { padding-bottom: 20px; }
.page-header { margin-bottom: 16px; }
.page-title { font-size: 20px; font-weight: 600; color: #262626; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #8c8c8c; }

.toolbar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f0f0f0;
}
.toolbar-left, .toolbar-right { display: flex; gap: 12px; }

.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }

.import-dialog { padding: 10px 0; }

.preview-title {
  display: flex; justify-content: space-between; align-items: center;
  margin: 8px 0 12px; font-weight: 600; color: #262626;
}
.section-title { font-weight: 600; color: #262626; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.mb-12 { margin-bottom: 12px; }

.bom-detail .detail-header {
  display: flex; justify-content: space-between; align-items: flex-start;
}
.bom-detail h3 { margin: 0 0 8px; font-size: 20px; color: #262626; }
.detail-meta { display: flex; gap: 20px; font-size: 13px; color: #8c8c8c; }

.detail-summary {
  background: #f5f7fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;
}
.summary-item { display: flex; flex-direction: column; gap: 4px; }
.summary-label { font-size: 13px; color: #8c8c8c; }
.summary-value { font-size: 24px; font-weight: 600; color: #262626; }

h4.section-title { font-size: 15px; font-weight: 600; color: #262626; margin: 0 0 12px; }
</style>
