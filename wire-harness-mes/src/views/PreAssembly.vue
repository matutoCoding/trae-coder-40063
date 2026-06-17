<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMESStore } from '../stores/mes'
import type { PreAssemblyTask } from '../types'

const store = useMESStore()

const activeTab = ref('all')
const searchKeyword = ref('')
const processDialogVisible = ref(false)
const currentTask = ref<PreAssemblyTask | null>(null)
const processForm = ref({ completed: 0, operator: '' })

const tabs = [
  { name: 'all', label: '全部' },
  { name: 'pending', label: '待处理' },
  { name: 'processing', label: '进行中' },
  { name: 'completed', label: '已完成' }
]

const filteredTasks = computed(() => {
  let tasks = store.preAssemblyTasks
  if (activeTab.value !== 'all') {
    tasks = tasks.filter(t => t.status === activeTab.value)
  }
  if (searchKeyword.value) {
    tasks = tasks.filter(t =>
      t.productNo.includes(searchKeyword.value) ||
      t.wireNo.includes(searchKeyword.value) ||
      t.waterproofPlug.includes(searchKeyword.value)
    )
  }
  return tasks
})

const stats = computed(() => ({
  total: store.preAssemblyTasks.length,
  pending: store.pendingPreAssemblyTasks.length,
  processing: store.processingPreAssemblyTasks.length,
  completed: store.completedPreAssemblyTasks.length
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

function getProgress(task: PreAssemblyTask) {
  return Math.round((task.completed / task.quantity) * 100)
}

function handleStart(task: PreAssemblyTask) {
  store.updatePreAssemblyTaskStatus(task.id, 'processing')
  ElMessage.success(`已开始 ${task.wireNo} 的防水栓预装任务`)
}

function handleProcess(task: PreAssemblyTask) {
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
  store.updatePreAssemblyCompleted(currentTask.value.id, processForm.value.completed)
  processDialogVisible.value = false
  ElMessage.success('进度已更新')
}

function handleComplete(task: PreAssemblyTask) {
  ElMessageBox.confirm(`确认完成 "${task.wireNo} - ${task.waterproofPlug}" 的预装任务？`, '完成确认', {
    type: 'success'
  }).then(() => {
    store.updatePreAssemblyCompleted(task.id, task.quantity)
    store.updatePreAssemblyTaskStatus(task.id, 'completed')
    ElMessage.success('任务已完成')
  }).catch(() => {})
}
</script>

<template>
  <div class="pre-assembly-page">
    <div class="page-header">
      <h2 class="page-title">预装防水</h2>
      <p class="page-subtitle">防水栓预装管理，确保防水密封质量</p>
    </div>

    <el-row :gutter="16" class="stats-row mb-20">
      <el-col :span="6">
        <div class="stat-card total">
          <div class="stat-icon">
            <el-icon :size="24"><Watermelon /></el-icon>
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
            placeholder="搜索产品/线号/防水栓"
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
        <el-table-column prop="waterproofPlug" label="防水栓型号" width="140" />
        <el-table-column label="预装端" width="80" align="center">
          <template #default="{ row }">{{ getSideText(row.side) }}</template>
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
        <el-table-column prop="operator" label="操作员" width="100" />
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status).type" size="small">
              {{ getStatusTag(row.status).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
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

    <el-dialog v-model="processDialogVisible" title="预装报工" width="460px" :close-on-click-modal="false">
      <div v-if="currentTask" class="process-dialog">
        <el-descriptions :column="2" border size="small" style="margin-bottom: 20px">
          <el-descriptions-item label="线号">{{ currentTask.wireNo }}</el-descriptions-item>
          <el-descriptions-item label="防水栓">{{ currentTask.waterproofPlug }}</el-descriptions-item>
          <el-descriptions-item label="预装端">{{ getSideText(currentTask.side) }}</el-descriptions-item>
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
  </div>
</template>

<style scoped>
.pre-assembly-page {
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

.stat-card.total::after { background: #faad14; }
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

.stat-card.total .stat-icon { background: #fffbe6; color: #faad14; }
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
</style>
