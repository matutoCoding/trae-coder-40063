<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'
import { useMESStore } from '../stores/mes'
import type { CrimpingTask, CrimpingRecord } from '../types'

const store = useMESStore()
const route = useRoute()

const activeTab = ref('all')
const searchKeyword = ref((route.query.productNo as string) || '')
const dialogVisible = ref(false)
const testDialogVisible = ref(false)
const currentTask = ref<CrimpingTask | null>(null)
const testForm = ref({
  crimpHeight: 0,
  tensileStrength: 0,
  operator: '',
  machine: ''
})

const tabs = [
  { name: 'all', label: '全部' },
  { name: 'pending', label: '待处理' },
  { name: 'processing', label: '进行中' },
  { name: 'completed', label: '已完成' }
]

const filteredTasks = computed(() => {
  let tasks = store.crimpingTasks
  if (activeTab.value !== 'all') {
    tasks = tasks.filter(t => t.status === activeTab.value)
  }
  if (searchKeyword.value) {
    tasks = tasks.filter(t =>
      t.productNo.includes(searchKeyword.value) ||
      t.wireNo.includes(searchKeyword.value) ||
      t.terminalNo.includes(searchKeyword.value)
    )
  }
  return tasks
})

const stats = computed(() => ({
  total: store.crimpingTasks.length,
  pending: store.pendingCrimpingTasks.length,
  processing: store.processingCrimpingTasks.length,
  completed: store.completedCrimpingTasks.length
}))

function getStatusTag(status: string) {
  const map: Record<string, { type: string; text: string }> = {
    pending: { type: 'warning', text: '待处理' },
    processing: { type: 'primary', text: '进行中' },
    completed: { type: 'success', text: '已完成' }
  }
  return map[status] || { type: 'info', text: status }
}

function getSideText(side: string) {
  const map: Record<string, string> = {
    left: '左端',
    right: '右端',
    both: '两端'
  }
  return map[side] || side
}

function getProgress(task: CrimpingTask) {
  return Math.round((task.completed / task.quantity) * 100)
}

function handleStart(task: CrimpingTask) {
  store.updateCrimpingTaskStatus(task.id, 'processing')
  ElMessage.success(`已开始 ${task.wireNo} - ${task.terminalNo} 的压接任务`)
}

function handleTest(task: CrimpingTask) {
  currentTask.value = task
  testForm.value = {
    crimpHeight: task.standardHeight,
    tensileStrength: task.minTensile,
    operator: task.operator,
    machine: task.machine
  }
  testDialogVisible.value = true
}

function submitTest() {
  if (!currentTask.value) return
  const isHeightValid = Math.abs(testForm.value.crimpHeight - currentTask.value.standardHeight) <= 0.15
  const isTensileValid = testForm.value.tensileStrength >= currentTask.value.minTensile
  const result = isHeightValid && isTensileValid ? 'pass' : 'fail'

  const record: CrimpingRecord = {
    id: `rec_${Date.now()}`,
    taskId: currentTask.value.id,
    wireNo: currentTask.value.wireNo,
    terminalNo: currentTask.value.terminalNo,
    side: currentTask.value.side === 'both' ? 'left' : currentTask.value.side,
    crimpHeight: testForm.value.crimpHeight,
    tensileStrength: testForm.value.tensileStrength,
    operator: testForm.value.operator,
    machine: testForm.value.machine,
    testTime: new Date().toLocaleString('zh-CN'),
    result
  }
  store.addCrimpingRecord(currentTask.value.id, record)
  store.updateCrimpingCompleted(currentTask.value.id, currentTask.value.completed + 5)

  testDialogVisible.value = false
  if (result === 'pass') {
    ElMessage.success('首件测试合格')
  } else {
    ElMessage.warning('首件测试不合格，请调整参数')
  }
}

function handleDetail(task: CrimpingTask) {
  currentTask.value = task
  dialogVisible.value = true
}

function handleComplete(task: CrimpingTask) {
  ElMessageBox.confirm(`确认完成 "${task.wireNo} - ${task.terminalNo}" 的压接任务？`, '完成确认', {
    type: 'success'
  }).then(() => {
    store.updateCrimpingCompleted(task.id, task.quantity)
    store.updateCrimpingTaskStatus(task.id, 'completed')
    ElMessage.success('任务已完成')
  }).catch(() => {})
}

function getRecordResultClass(result: string) {
  return result === 'pass' ? 'text-success' : 'text-danger'
}
</script>

<template>
  <div class="crimping-page">
    <div class="page-header">
      <h2 class="page-title">端子压接</h2>
      <p class="page-subtitle">端子压接高度、压接拉力测试管理，确保压接质量</p>
    </div>

    <el-row :gutter="16" class="stats-row mb-20">
      <el-col :span="6">
        <div class="stat-card total">
          <div class="stat-icon">
            <el-icon :size="24"><Connection /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">任务总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card pending">
          <div class="stat-icon">
            <el-icon :size="24"><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pending }}</div>
            <div class="stat-label">待处理</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card processing">
          <div class="stat-icon">
            <el-icon :size="24"><Loading /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.processing }}</div>
            <div class="stat-label">进行中</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card completed">
          <div class="stat-icon">
            <el-icon :size="24"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.completed }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="card">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-tabs v-model="activeTab" class="tab-filter">
            <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="tab.label" :name="tab.name" />
          </el-tabs>
        </div>
        <div class="toolbar-right">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索产品/线号/端子"
            style="width: 220px"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <el-table :data="filteredTasks" style="width: 100%" stripe>
        <el-table-column type="index" label="#" width="50" align="center" />
        <el-table-column prop="productNo" label="产品编号" width="140" />
        <el-table-column prop="wireNo" label="线号" width="120" />
        <el-table-column prop="terminalNo" label="端子型号" width="120" />
        <el-table-column label="压接端" width="80" align="center">
          <template #default="{ row }">{{ getSideText(row.side) }}</template>
        </el-table-column>
        <el-table-column label="标准压高(mm)" width="120" align="center">
          <template #default="{ row }">{{ row.standardHeight }}±0.1</template>
        </el-table-column>
        <el-table-column label="最小拉力(N)" width="100" align="center">
          <template #default="{ row }">{{ row.minTensile }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="计划数" width="80" align="right" />
        <el-table-column label="完成进度" width="180">
          <template #default="{ row }">
            <div class="progress-cell">
              <el-progress :percentage="getProgress(row)" :stroke-width="8" />
              <span class="progress-text">{{ row.completed }}/{{ row.quantity }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="machine" label="设备" width="110" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status).type" size="small">
              {{ getStatusTag(row.status).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" type="primary" link size="small" @click="handleStart(row)">
              开始
            </el-button>
            <el-button v-if="row.status === 'processing'" type="warning" link size="small" @click="handleTest(row)">
              首件测试
            </el-button>
            <el-button type="info" link size="small" @click="handleDetail(row)">详情</el-button>
            <el-button v-if="row.status === 'processing'" type="success" link size="small" @click="handleComplete(row)">
              完成
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="total, prev, pager, next, sizes"
          :page-size="10"
          :total="filteredTasks.length"
        />
      </div>
    </div>

    <el-dialog v-model="testDialogVisible" title="首件压接测试" width="520px" :close-on-click-modal="false">
      <div v-if="currentTask" class="test-dialog">
        <el-alert
          :title="`标准压高: ${currentTask.standardHeight}±0.15mm | 最小拉力: ${currentTask.minTensile}N`"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        />
        <el-form :model="testForm" label-width="120px">
          <el-form-item label="压接高度(mm)">
            <el-input-number v-model="testForm.crimpHeight" :precision="2" :step="0.01" :min="0" style="width: 100%" />
          </el-form-item>
          <el-form-item label="拉力强度(N)">
            <el-input-number v-model="testForm.tensileStrength" :precision="1" :step="1" :min="0" style="width: 100%" />
          </el-form-item>
          <el-form-item label="操作人员">
            <el-input v-model="testForm.operator" placeholder="请输入操作人员" />
          </el-form-item>
          <el-form-item label="设备编号">
            <el-input v-model="testForm.machine" placeholder="请输入设备编号" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="testDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTest">提交测试</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogVisible" title="压接任务详情" width="700px">
      <div v-if="currentTask" class="detail-dialog">
        <el-descriptions :column="3" border size="small" style="margin-bottom: 20px">
          <el-descriptions-item label="产品编号">{{ currentTask.productNo }}</el-descriptions-item>
          <el-descriptions-item label="线号">{{ currentTask.wireNo }}</el-descriptions-item>
          <el-descriptions-item label="端子型号">{{ currentTask.terminalNo }}</el-descriptions-item>
          <el-descriptions-item label="压接端">{{ getSideText(currentTask.side) }}</el-descriptions-item>
          <el-descriptions-item label="标准压高">{{ currentTask.standardHeight }}mm</el-descriptions-item>
          <el-descriptions-item label="最小拉力">{{ currentTask.minTensile }}N</el-descriptions-item>
          <el-descriptions-item label="计划数量">{{ currentTask.quantity }}</el-descriptions-item>
          <el-descriptions-item label="已完成">{{ currentTask.completed }}</el-descriptions-item>
          <el-descriptions-item label="设备">{{ currentTask.machine || '-' }}</el-descriptions-item>
        </el-descriptions>

        <h4 class="section-title">质量检测记录</h4>
        <el-table :data="currentTask.records" size="small" border max-height="250">
          <el-table-column prop="testTime" label="检测时间" width="170" />
          <el-table-column prop="crimpHeight" label="压高(mm)" width="100" align="center" />
          <el-table-column prop="tensileStrength" label="拉力(N)" width="100" align="center" />
          <el-table-column prop="operator" label="操作员" width="100" />
          <el-table-column prop="machine" label="设备" width="120" />
          <el-table-column label="结果" width="80" align="center">
            <template #default="{ row }">
              <span :class="getRecordResultClass(row.result)">
                {{ row.result === 'pass' ? '合格' : '不合格' }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.crimping-page {
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

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.stat-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
}

.stat-card.total::after { background: #52c41a; }
.stat-card.pending::after { background: #faad14; }
.stat-card.processing::after { background: #1890ff; }
.stat-card.completed::after { background: #52c41a; }

.stat-card .stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-card.total .stat-icon { background: #f6ffed; color: #52c41a; }
.stat-card.pending .stat-icon { background: #fffbe6; color: #faad14; }
.stat-card.processing .stat-icon { background: #e6f7ff; color: #1890ff; }
.stat-card.completed .stat-icon { background: #f6ffed; color: #52c41a; }

.stat-info { flex: 1; }

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #262626;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #8c8c8c;
  margin-top: 4px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tab-filter :deep(.el-tabs__header) { margin-bottom: 0; }

.progress-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-text {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 12px 0;
}

.text-success { color: #52c41a; font-weight: 500; }
.text-danger { color: #ff4d4f; font-weight: 500; }
</style>
