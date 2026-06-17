<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMESStore } from '../stores/mes'
import type { BOM, BOMItem } from '../types'

const store = useMESStore()

const searchKeyword = ref('')
const statusFilter = ref('')
const dialogVisible = ref(false)
const detailVisible = ref(false)
const currentBOM = ref<BOM | null>(null)
const importType = ref('excel')

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
  ElMessageBox.confirm(`确认开始生产 "${bom.productName}"？`, '生产确认', {
    type: 'warning'
  }).then(() => {
    store.updateBOMStatus(bom.id, 'producing')
    store.generateCuttingTasksFromBOM(bom.id)
    ElMessage.success('生产任务已下发')
  }).catch(() => {})
}

function handleDelete(bom: BOM) {
  ElMessageBox.confirm(`确认删除 "${bom.productName}"？`, '删除确认', {
    type: 'error'
  }).then(() => {
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function handleDownloadTemplate() {
  ElMessage.info('BOM导入模板下载中...')
}

function confirmImport() {
  const newBOM: BOM = {
    id: `bom_${Date.now()}`,
    productNo: `WH-2024-${String(store.boms.length + 1).padStart(3, '0')}`,
    productName: '新导入线束总成',
    version: 'V1.0',
    createTime: new Date().toLocaleString('zh-CN'),
    totalWires: 5,
    totalQuantity: 100,
    status: 'draft',
    items: [
      { id: '1', wireNo: 'AVSS-0.5', wireType: 'AVSS', color: '红色', crossSection: 0.5, length: 300, leftTerminal: '1.5系列-公端', rightTerminal: '1.5系列-母端', leftWaterproof: 'WPD-1.5', rightWaterproof: 'WPD-1.5', quantity: 100, remark: '示例' }
    ]
  }
  store.addBOM(newBOM)
  dialogVisible.value = false
  ElMessage.success('BOM导入成功')
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
      <p class="page-subtitle">线束BOM管理与导入，支持Excel批量导入</p>
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

    <el-dialog v-model="dialogVisible" title="导入BOM" width="520px" :close-on-click-modal="false">
      <div class="import-dialog">
        <el-radio-group v-model="importType" style="margin-bottom: 20px">
          <el-radio value="excel">Excel导入</el-radio>
          <el-radio value="manual">手动录入</el-radio>
        </el-radio-group>

        <div v-if="importType === 'excel'" class="upload-area">
          <el-upload
            drag
            action="#"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将Excel文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .xlsx / .xls 格式，请使用标准BOM模板
              </div>
            </template>
          </el-upload>
        </div>

        <div v-else class="manual-form">
          <el-form :model="{}" label-width="100px">
            <el-form-item label="产品编号">
              <el-input placeholder="请输入产品编号" />
            </el-form-item>
            <el-form-item label="产品名称">
              <el-input placeholder="请输入产品名称" />
            </el-form-item>
            <el-form-item label="版本">
              <el-input placeholder="V1.0" />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImport">确认导入</el-button>
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
.bom-page {
  padding-bottom: 20px;
}

.page-header {
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

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 12px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.import-dialog {
  padding: 10px 0;
}

.upload-area {
  margin-top: 10px;
}

.bom-detail .detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.bom-detail h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #262626;
}

.detail-meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #8c8c8c;
}

.detail-summary {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 13px;
  color: #8c8c8c;
}

.summary-value {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 12px 0;
}
</style>
