<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMESStore } from '../stores/mes'
import type { AssemblyTask, RetainForceTestRecord } from '../types'

const store = useMESStore()
const route = useRoute()

const activeTab = ref('all')
const searchKeyword = ref((route.query.productNo as string) || '')
const processDialogVisible = ref(false)
const retainDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentTask = ref<AssemblyTask | null>(null)
const retainTask = ref<AssemblyTask | null>(null)
const detailTask = ref<AssemblyTask | null>(null)
const processForm = ref({ completed: 0, operator: '' })

const retainForm = reactive({
  sampleIndex: 1,
  retainForce: 0,
  standardForce: 50,
  wireNo: '',
  sheathNo: '',
  holePosition: '',
  operator: '',
  remark: ''
})

const tabs = [
  { name: 'all', label: '全部' },
  { name: 'pending', label: '待处理' },
  { name: 'processing', label: '进行中' },
  { name: 'completed', label: '已完成' }
]

const filteredTasks = computed(() => {
  let tasks = store.assemblyTasks
  if (activeTab.value !== 'all') {
    tasks = tasks.filter(t => t.status === activeTab.value)
  }
  if (searchKeyword.value) {
    tasks = tasks.filter(t =>
      t.productNo.includes(searchKeyword.value) ||
      t.sheathNo.includes(searchKeyword.value) ||
      t.wireNo.includes(searchKeyword.value) ||
      (t.batchNo && t.batchNo.includes(searchKeyword.value))
    )
  }
  return tasks
})

const stats = computed(() => ({
  total: store.assemblyTasks.length,
  pending: store.pendingAssemblyTasks.length,
  processing: store.processingAssemblyTasks.length,
  completed: store.completedAssemblyTasks.length
}))

function getStatusTag(status: string) {
  const map: Record<string, { type: string; text: string }> = {
    pending: { type: 'warning', text: '待处理' },
    processing: { type: 'primary', text: '进行中' },
    completed: { type: 'success', text: '已完成' }
  }
  return map[status] || { type: 'info', text: status }
}

function getProgress(task: AssemblyTask) {
  return Math.round((task.completed / task.quantity) * 100)
}

function getRetainForceTag(task: AssemblyTask) {
  if (task.retainForcePassed) {
    return { type: 'success', text: '已通过' }
  }
  if (task.retainForceRecords && task.retainForceRecords.length > 0) {
    return { type: 'danger', text: '未通过' }
  }
  return { type: 'info', text: '未检测' }
}

function calcStandardForce(crossSection: number): number {
  if (crossSection >= 2.0) return 120
  if (crossSection >= 1.5) return 90
  if (crossSection >= 1.0) return 70
  if (crossSection >= 0.75) return 60
  return 50
}

function handleStart(task: AssemblyTask) {
  store.updateAssemblyTaskStatus(task.id, 'processing')
  ElMessage.success(`已开始 ${task.sheathNo} - ${task.holePosition} 的总装任务`)
}

function handleProcess(task: AssemblyTask) {
  currentTask.value = task
  processForm.value = {
    completed: task.completed,
    operator: task.operator
  }
  processDialogVisible.value = true
}

function submitProcess() {
  if (!currentTask.value) return
  if (processForm.value.completed > currentTask.value.quantity) {
    ElMessage.error('完成数量不能超过计划数量')
    return
  }
  store.updateAssemblyCompleted(currentTask.value.id, processForm.value.completed)
  processDialogVisible.value = false
  ElMessage.success('进度已更新')
}

function handleComplete(task: AssemblyTask) {
  if (!task.retainForcePassed) {
    ElMessage.warning('请先通过端子保持力检测，再完成任务')
    return
  }
  ElMessageBox.confirm(`确认完成 "${task.sheathNo} - ${task.holePosition}" 的总装任务？`, '完成确认', {
    type: 'success'
  }).then(() => {
    store.updateAssemblyCompleted(task.id, task.quantity)
    store.updateAssemblyTaskStatus(task.id, 'completed')
    ElMessage.success('任务已完成')
  }).catch(() => {})
}

function handleCheckRetain(task: AssemblyTask) {
  retainTask.value = task
  retainForm.sampleIndex = (task.retainForceRecords?.length || 0) + 1
  retainForm.retainForce = 0
  retainForm.standardForce = calcStandardForce(0.5)
  retainForm.wireNo = task.wireNo
  retainForm.sheathNo = task.sheathNo
  retainForm.holePosition = task.holePosition
  retainForm.operator = task.operator || ''
  retainForm.remark = ''
  retainDialogVisible.value = true
}

function submitRetainTest() {
  if (!retainTask.value) return
  if (retainForm.retainForce <= 0) {
    ElMessage.warning('请输入有效的检测值（大于0N）')
    return
  }
  if (!retainForm.operator.trim()) {
    ElMessage.warning('请输入操作人员')
    return
  }

  const result: 'pass' | 'fail' = retainForm.retainForce >= retainForm.standardForce ? 'pass' : 'fail'
  const record: RetainForceTestRecord = {
    id: `ret_${Date.now()}`,
    taskId: retainTask.value.id,
    testNo: `RT${Date.now()}`,
    sampleIndex: retainForm.sampleIndex,
    retainForce: Number(retainForm.retainForce),
    standardForce: Number(retainForm.standardForce),
    wireNo: retainForm.wireNo,
    sheathNo: retainForm.sheathNo,
    holePosition: retainForm.holePosition,
    operator: retainForm.operator.trim(),
    testTime: new Date().toLocaleString('zh-CN'),
    result,
    remark: retainForm.remark
  }

  store.addRetainForceRecord(retainTask.value.id, record)
  retainDialogVisible.value = false

  if (result === 'pass') {
    ElMessage.success(`第 ${retainForm.sampleIndex} 号试样检测通过（${retainForm.retainForce}N ≥ 标准${retainForm.standardForce}N）`)
  } else {
    ElMessage.error(`第 ${retainForm.sampleIndex} 号试样检测不合格（${retainForm.retainForce}N < 标准${retainForm.standardForce}N），请重新检测`)
  }
}

function handleShowDetail(task: AssemblyTask) {
  detailTask.value = task
  detailDialogVisible.value = true
}

function getResultTag(result: 'pass' | 'fail') {
  return result === 'pass'
    ? { type: 'success' as const, text: '合格' }
    : { type: 'danger' as const, text: '不合格' }
}
</script>

<template>
  <div class="assembly-page">
    <div class="page-header">
      <h2 class="page-title">总装布线</h2>
      <p class="page-subtitle">护套穿线总装、扎带固定布线管理</p>
    </div>

    <el-row :gutter="16" class="stats-row mb-20">
      <el-col :span="6">
        <div class="stat-card total">
          <div class="stat-icon">
            <el-icon :size="24"><Grid /></el-icon>
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
            placeholder="搜索产品/护套/线号/批次号"
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
        <el-table-column label="批次号" width="160">
          <template #default="{ row }">
            <el-tag v-if="row.batchNo" type="primary" size="small" effect="plain">{{ row.batchNo }}</el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="productNo" label="产品编号" width="130" />
        <el-table-column prop="sheathNo" label="护套型号" width="150" />
        <el-table-column prop="holePosition" label="孔位" width="80" align="center" />
        <el-table-column prop="wireNo" label="线号" width="110" />
        <el-table-column prop="terminalNo" label="端子型号" width="110" />
        <el-table-column prop="quantity" label="计划数" width="70" align="right" />
        <el-table-column label="完成进度" width="170">
          <template #default="{ row }">
            <div class="progress-cell">
              <el-progress :percentage="getProgress(row)" :stroke-width="8" />
              <span class="progress-text">{{ row.completed }}/{{ row.quantity }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="保持力" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getRetainForceTag(row).type" size="small">
              {{ getRetainForceTag(row).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作员" width="90" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status).type" size="small">
              {{ getStatusTag(row.status).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="info" link size="small" @click="handleShowDetail(row)">
              详情
            </el-button>
            <el-button type="warning" link size="small" @click="handleCheckRetain(row)">
              保持力
            </el-button>
            <el-button v-if="row.status === 'pending'" type="primary" link size="small" @click="handleStart(row)">
              开始
            </el-button>
            <el-button v-if="row.status === 'processing'" type="primary" link size="small" @click="handleProcess(row)">
              报工
            </el-button>
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

    <el-dialog v-model="processDialogVisible" title="总装报工" width="460px" :close-on-click-modal="false">
      <div v-if="currentTask" class="process-dialog">
        <el-descriptions :column="2" border size="small" style="margin-bottom: 20px">
          <el-descriptions-item label="护套型号">{{ currentTask.sheathNo }}</el-descriptions-item>
          <el-descriptions-item label="孔位">{{ currentTask.holePosition }}</el-descriptions-item>
          <el-descriptions-item label="线号">{{ currentTask.wireNo }}</el-descriptions-item>
          <el-descriptions-item label="计划数量">{{ currentTask.quantity }}</el-descriptions-item>
        </el-descriptions>
        <el-form :model="processForm" label-width="100px">
          <el-form-item label="完成数量">
            <el-input-number v-model="processForm.completed" :min="0" :max="currentTask.quantity" style="width: 100%" />
          </el-form-item>
          <el-form-item label="操作人员">
            <el-input v-model="processForm.operator" placeholder="请输入操作人员" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="processDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProcess">确认提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="retainDialogVisible" title="端子保持力检测" width="520px" :close-on-click-modal="false">
      <div class="retain-dialog">
        <el-alert
          title="按端子保持力检测标准，试样检测值必须 ≥ 标准值才算合格"
          type="warning"
          :closable="false"
          style="margin-bottom: 20px"
        />
        <el-form :model="retainForm" label-width="110px">
          <el-form-item label="试样编号">
            <el-input-number v-model="retainForm.sampleIndex" :min="1" :max="999" style="width: 100%" />
          </el-form-item>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="护套型号">
                <el-input v-model="retainForm.sheathNo" readonly />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="孔位">
                <el-input v-model="retainForm.holePosition" readonly />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="检测值 (N)">
                <el-input-number v-model="retainForm.retainForce" :min="0" :precision="1" :step="5" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="标准值 (N)">
                <el-input-number v-model="retainForm.standardForce" :min="10" :precision="0" :step="10" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="判定结果">
            <el-tag
              v-if="retainForm.retainForce > 0"
              :type="retainForm.retainForce >= retainForm.standardForce ? 'success' : 'danger'"
              size="large"
            >
              {{ retainForm.retainForce >= retainForm.standardForce ? '合格（检测值 ≥ 标准值）' : '不合格（检测值 < 标准值）' }}
            </el-tag>
            <span v-else class="text-muted">请先输入检测值</span>
          </el-form-item>
          <el-form-item label="操作人员">
            <el-input v-model="retainForm.operator" placeholder="请输入检测操作人员" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="retainForm.remark" type="textarea" :rows="2" placeholder="选填，如检测环境、异常说明等" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="retainDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRetainTest">保存检测记录</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="总装任务详情" width="780px" :close-on-click-modal="false">
      <div v-if="detailTask" class="detail-dialog">
        <el-descriptions :column="3" border size="small" style="margin-bottom: 20px">
          <el-descriptions-item label="任务编号">{{ detailTask.id }}</el-descriptions-item>
          <el-descriptions-item label="产品编号">{{ detailTask.productNo }}</el-descriptions-item>
          <el-descriptions-item label="护套型号">{{ detailTask.sheathNo }}</el-descriptions-item>
          <el-descriptions-item label="孔位">{{ detailTask.holePosition }}</el-descriptions-item>
          <el-descriptions-item label="线号">{{ detailTask.wireNo }}</el-descriptions-item>
          <el-descriptions-item label="端子型号">{{ detailTask.terminalNo }}</el-descriptions-item>
          <el-descriptions-item label="计划数量">{{ detailTask.quantity }}</el-descriptions-item>
          <el-descriptions-item label="已完成">{{ detailTask.completed }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detailTask.createTime }}</el-descriptions-item>
          <el-descriptions-item label="操作员">{{ detailTask.operator || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTag(detailTask.status).type" size="small">
              {{ getStatusTag(detailTask.status).text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="保持力">
            <el-tag :type="getRetainForceTag(detailTask).type" size="small">
              {{ getRetainForceTag(detailTask).text }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="section-title">端子保持力检测记录</div>
        <el-table
          :data="detailTask.retainForceRecords || []"
          size="small"
          border
          empty-text="暂无检测记录，请点击操作列「保持力」按钮录入"
          style="margin-bottom: 8px"
        >
          <el-table-column type="index" label="#" width="50" align="center" />
          <el-table-column prop="testNo" label="检测单号" width="140" />
          <el-table-column prop="sampleIndex" label="试样号" width="70" align="center" />
          <el-table-column prop="retainForce" label="检测值(N)" width="90" align="right">
            <template #default="{ row }">
              <span :style="{ color: row.retainForce >= row.standardForce ? '#52c41a' : '#f5222d', fontWeight: 500 }">
                {{ row.retainForce }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="standardForce" label="标准值(N)" width="90" align="right" />
          <el-table-column label="判定" width="70" align="center">
            <template #default="{ row }">
              <el-tag :type="getResultTag(row.result).type" size="small">
                {{ getResultTag(row.result).text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="operator" label="操作员" width="90" />
          <el-table-column prop="testTime" label="检测时间" width="160" />
          <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        </el-table>
      </div>
      <template #footer>
        <el-button type="primary" @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.assembly-page {
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

.stat-card.total::after { background: #722ed1; }
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

.stat-card.total .stat-icon { background: #f9f0ff; color: #722ed1; }
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

.text-muted { color: #8c8c8c; }

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #1890ff;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
