<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMESStore } from '../stores/mes'
import type { ConductorTestTask, ConductorTestRecord } from '../types'

const store = useMESStore()
const route = useRoute()

const activeTab = ref('all')
const searchKeyword = ref((route.query.productNo as string) || '')
const dialogVisible = ref(false)
const testDialogVisible = ref(false)
const currentTask = ref<ConductorTestTask | null>(null)
const testForm = ref({
  testPoint1: '',
  testPoint2: '',
  resistance: 0,
  insulationResistance: 0,
  voltage: 500,
  operator: ''
})

const tabs = [
  { name: 'all', label: '全部' },
  { name: 'pending', label: '待测试' },
  { name: 'processing', label: '测试中' },
  { name: 'completed', label: '已完成' }
]

const filteredTasks = computed(() => {
  let tasks = store.conductorTestTasks
  if (activeTab.value !== 'all') {
    tasks = tasks.filter(t => t.status === activeTab.value)
  }
  if (searchKeyword.value) {
    tasks = tasks.filter(t =>
      t.productNo.includes(searchKeyword.value)
    )
  }
  return tasks
})

const stats = computed(() => ({
  total: store.conductorTestTasks.length,
  pending: store.conductorTestTasks.filter(t => t.status === 'pending').length,
  processing: store.conductorTestTasks.filter(t => t.status === 'processing').length,
  completed: store.conductorTestTasks.filter(t => t.status === 'completed').length
}))

function getStatusTag(status: string) {
  const map: Record<string, { type: string; text: string }> = {
    pending: { type: 'warning', text: '待测试' },
    processing: { type: 'primary', text: '测试中' },
    completed: { type: 'success', text: '已完成' }
  }
  return map[status] || { type: 'info', text: status }
}

function getPassRate(task: ConductorTestTask) {
  if (task.completed === 0) return 0
  return ((task.passCount / task.completed) * 100).toFixed(1)
}

function handleStart(task: ConductorTestTask) {
  store.updateConductorTestTaskStatus(task.id, 'processing')
  ElMessage.success(`已开始 ${task.productNo} 的导通测试`)
}

function handleTest(task: ConductorTestTask) {
  currentTask.value = task
  testForm.value = {
    testPoint1: '',
    testPoint2: '',
    resistance: 0,
    insulationResistance: 0,
    voltage: 500,
    operator: task.operator
  }
  testDialogVisible.value = true
}

function submitTest() {
  if (!currentTask.value) return
  if (!testForm.value.testPoint1 || !testForm.value.testPoint2) {
    ElMessage.warning('请输入测试点位')
    return
  }

  const isPass = testForm.value.resistance < 0.1 && testForm.value.insulationResistance > 100

  const record: ConductorTestRecord = {
    id: `trec_${Date.now()}`,
    taskId: currentTask.value.id,
    productNo: currentTask.value.productNo,
    testPoint1: testForm.value.testPoint1,
    testPoint2: testForm.value.testPoint2,
    resistance: testForm.value.resistance,
    insulationResistance: testForm.value.insulationResistance,
    voltage: testForm.value.voltage,
    testTime: new Date().toLocaleString('zh-CN'),
    operator: testForm.value.operator,
    result: isPass ? 'pass' : 'fail'
  }

  store.addConductorTestRecord(currentTask.value.id, record)
  testDialogVisible.value = false

  if (isPass) {
    ElMessage.success('导通测试合格')
  } else {
    ElMessage.warning('导通测试不合格，请检查线路')
  }
}

function handleDetail(task: ConductorTestTask) {
  currentTask.value = task
  dialogVisible.value = true
}

function handleComplete(task: ConductorTestTask) {
  ElMessageBox.confirm(`确认完成 "${task.productNo}" 的导通测试？`, '完成确认', {
    type: 'success'
  }).then(() => {
    store.updateConductorTestTaskStatus(task.id, 'completed')
    ElMessage.success('测试任务已完成')
  }).catch(() => {})
}

function getRecordResultClass(result: string) {
  return result === 'pass' ? 'text-success' : 'text-danger'
}
</script>

<template>
  <div class="conductor-test-page">
    <div class="page-header">
      <h2 class="page-title">导通测试</h2>
      <p class="page-subtitle">导通绝缘测试、端子保持力测试管理</p>
    </div>

    <el-row :gutter="16" class="stats-row mb-20">
      <el-col :span="6">
        <div class="stat-card total">
          <div class="stat-icon">
            <el-icon :size="24"><Lightning /></el-icon>
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
            <div class="stat-label">待测试</div>
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
            <div class="stat-label">测试中</div>
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
            placeholder="搜索产品编号"
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
        <el-table-column prop="quantity" label="计划测试数" width="110" align="right" />
        <el-table-column prop="completed" label="已测试数" width="100" align="right" />
        <el-table-column label="合格数" width="90" align="center">
          <template #default="{ row }">
            <span class="text-success">{{ row.passCount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="不合格数" width="100" align="center">
          <template #default="{ row }">
            <span class="text-danger">{{ row.failCount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="合格率" width="100" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="Number(getPassRate(row))"
              :stroke-width="8"
              :color="Number(getPassRate(row)) >= 98 ? '#52c41a' : '#faad14'"
            />
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
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" type="primary" link size="small" @click="handleStart(row)">
              开始
            </el-button>
            <el-button v-if="row.status === 'processing'" type="warning" link size="small" @click="handleTest(row)">
              点位测试
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

    <el-dialog v-model="testDialogVisible" title="导通测试" width="520px" :close-on-click-modal="false">
      <div v-if="currentTask" class="test-dialog">
        <el-alert
          title="测试标准: 导通电阻 < 0.1Ω | 绝缘电阻 > 100MΩ | 测试电压 500V"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        />
        <el-form :model="testForm" label-width="120px">
          <el-form-item label="测试点1">
            <el-input v-model="testForm.testPoint1" placeholder="如: J1/1#孔" />
          </el-form-item>
          <el-form-item label="测试点2">
            <el-input v-model="testForm.testPoint2" placeholder="如: J2/3#孔" />
          </el-form-item>
          <el-form-item label="导通电阻(Ω)">
            <el-input-number v-model="testForm.resistance" :precision="3" :step="0.001" :min="0" style="width: 100%" />
          </el-form-item>
          <el-form-item label="绝缘电阻(MΩ)">
            <el-input-number v-model="testForm.insulationResistance" :precision="1" :step="10" :min="0" style="width: 100%" />
          </el-form-item>
          <el-form-item label="测试电压(V)">
            <el-input-number v-model="testForm.voltage" :step="50" :min="0" style="width: 100%" />
          </el-form-item>
          <el-form-item label="操作人员">
            <el-input v-model="testForm.operator" placeholder="请输入操作人员" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="testDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTest">提交测试</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogVisible" title="测试详情" width="750px">
      <div v-if="currentTask" class="detail-dialog">
        <el-descriptions :column="3" border size="small" style="margin-bottom: 20px">
          <el-descriptions-item label="产品编号">{{ currentTask.productNo }}</el-descriptions-item>
          <el-descriptions-item label="计划测试">{{ currentTask.quantity }}</el-descriptions-item>
          <el-descriptions-item label="已测试">{{ currentTask.completed }}</el-descriptions-item>
          <el-descriptions-item label="合格数">
            <span class="text-success">{{ currentTask.passCount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="不合格数">
            <span class="text-danger">{{ currentTask.failCount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="合格率">{{ getPassRate(currentTask) }}%</el-descriptions-item>
        </el-descriptions>

        <h4 class="section-title">测试记录</h4>
        <el-table :data="currentTask.records" size="small" border max-height="300">
          <el-table-column prop="testTime" label="测试时间" width="170" />
          <el-table-column prop="testPoint1" label="测试点1" width="100" />
          <el-table-column prop="testPoint2" label="测试点2" width="100" />
          <el-table-column prop="resistance" label="电阻(Ω)" width="90" align="right" />
          <el-table-column prop="insulationResistance" label="绝缘(MΩ)" width="90" align="right" />
          <el-table-column prop="voltage" label="电压(V)" width="80" align="right" />
          <el-table-column prop="operator" label="操作员" width="80" />
          <el-table-column label="结果" width="70" align="center">
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
.conductor-test-page {
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

.stat-card.total::after { background: #13c2c2; }
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

.stat-card.total .stat-icon { background: #e6fffb; color: #13c2c2; }
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

.text-success { color: #52c41a; font-weight: 500; }
.text-danger { color: #ff4d4f; font-weight: 500; }

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
</style>
