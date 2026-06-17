<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMESStore } from '../stores/mes'
import type { PackagingTask, AppearanceCheckRecord, LabelPrintRecord } from '../types'

const store = useMESStore()
const route = useRoute()

const activeTab = ref('all')
const searchKeyword = ref((route.query.productNo as string) || '')
const dialogVisible = ref(false)
const checkDialogVisible = ref(false)
const labelDialogVisible = ref(false)
const detailDialogVisible = ref(false)

const currentTask = ref<PackagingTask | null>(null)
const checkTask = ref<PackagingTask | null>(null)
const labelTask = ref<PackagingTask | null>(null)
const detailTask = ref<PackagingTask | null>(null)

const processForm = ref({ completed: 0, operator: '' })

const checkItems = ref<{
  id: string; checkItemId: string; checkItem: string; standard: string; checkMethod: string
  isRequired: boolean; checked: boolean; result: 'pass' | 'fail'; remark: string
}[]>([])

const labelPrintForm = reactive({
  printCount: 1,
  template: '标准标签模板A',
  operator: '',
  printMethod: 'batch' as 'single' | 'batch'
})

const tabs = [
  { name: 'all', label: '全部' },
  { name: 'pending', label: '待处理' },
  { name: 'processing', label: '进行中' },
  { name: 'completed', label: '已完成' }
]

const filteredTasks = computed(() => {
  let tasks = store.packagingTasks
  if (activeTab.value !== 'all') {
    tasks = tasks.filter(t => t.status === activeTab.value)
  }
  if (searchKeyword.value) {
    tasks = tasks.filter(t =>
      t.productNo.includes(searchKeyword.value) ||
      (t.batchNo && t.batchNo.includes(searchKeyword.value))
    )
  }
  return tasks
})

const stats = computed(() => ({
  total: store.packagingTasks.length,
  pending: store.packagingTasks.filter(t => t.status === 'pending').length,
  processing: store.packagingTasks.filter(t => t.status === 'processing').length,
  completed: store.packagingTasks.filter(t => t.status === 'completed').length
}))

function getStatusTag(status: string) {
  const map: Record<string, { type: string; text: string }> = {
    pending: { type: 'warning', text: '待处理' },
    processing: { type: 'primary', text: '进行中' },
    completed: { type: 'success', text: '已完成' }
  }
  return map[status] || { type: 'info', text: status }
}

function getProgress(task: PackagingTask) {
  return Math.round((task.completed / task.quantity) * 100)
}

function handleStart(task: PackagingTask) {
  store.updatePackagingTaskStatus(task.id, 'processing')
  ElMessage.success(`已开始 ${task.productNo} 的包装任务`)
}

function handleAppearanceCheck(task: PackagingTask) {
  checkTask.value = task

  if (task.appearanceRecords && task.appearanceRecords.length > 0) {
    checkItems.value = store.appearanceCheckItems.map(item => {
      const saved = task.appearanceRecords!.find(r => r.checkItemId === item.id)
      return {
        id: item.id,
        checkItemId: item.id,
        checkItem: item.checkItem,
        standard: item.standard,
        checkMethod: item.checkMethod,
        isRequired: item.isRequired,
        checked: saved ? saved.checked : false,
        result: (saved ? saved.result : 'pass') as 'pass' | 'fail',
        remark: saved ? saved.remark : ''
      }
    })
  } else {
    checkItems.value = store.appearanceCheckItems.map(item => ({
      id: item.id,
      checkItemId: item.id,
      checkItem: item.checkItem,
      standard: item.standard,
      checkMethod: item.checkMethod,
      isRequired: item.isRequired,
      checked: false,
      result: 'pass' as 'pass' | 'fail',
      remark: ''
    }))
  }

  checkDialogVisible.value = true
}

function submitAppearanceCheck() {
  if (!checkTask.value) return

  const uncheckedRequired = checkItems.value.filter(i => i.isRequired && !i.checked)
  const failedRequired = checkItems.value.filter(i => i.isRequired && i.checked && i.result !== 'pass')

  if (uncheckedRequired.length > 0 || failedRequired.length > 0) {
    const names: string[] = []
    uncheckedRequired.forEach(i => names.push(`${i.checkItem}（未勾选）`))
    failedRequired.forEach(i => names.push(`${i.checkItem}（不合格）`))
    ElMessage.warning({
      message: `必检项目未全部通过：\n${names.map((n, i) => `${i + 1}. ${n}`).join('\n')}`,
      duration: 5000,
      customClass: 'msg-wrap'
    })
    return
  }

  const records: AppearanceCheckRecord[] = checkItems.value.map(it => ({
    id: `apr_${Date.now()}_${it.checkItemId}`,
    checkItemId: it.checkItemId,
    checkItem: it.checkItem,
    isRequired: it.isRequired,
    checked: it.checked,
    result: it.result,
    remark: it.remark
  }))

  store.saveAppearanceCheckRecords(checkTask.value.id, records)
  checkDialogVisible.value = false

  const passedCount = records.filter(r => r.isRequired).every(r => r.checked && r.result === 'pass')
  if (passedCount) {
    ElMessage.success('外观检查全部通过，可进行后续工序')
  } else {
    ElMessage.warning('外观检查已保存，但仍有必检项未通过，请复查')
  }
}

function handleBellows(task: PackagingTask) {
  if (!task.appearanceChecked) {
    ElMessage.warning('请先完成外观检查并全部通过，再进行波纹管包覆')
    return
  }
  ElMessageBox.confirm(`确认 "${task.productNo}" 的波纹管包覆已完成？`, '确认', {
    type: 'info'
  }).then(() => {
    store.setBellowsCoverage(task.id, true)
    ElMessage.success('波纹管包覆已登记')
  }).catch(() => {})
}

function handleLabelPrint(task: PackagingTask) {
  if (!task.appearanceChecked) {
    ElMessage.warning('请先完成外观检查并全部通过，再打印标签')
    return
  }
  labelTask.value = task
  labelPrintForm.printCount = 1
  labelPrintForm.template = task.labelTemplate || '标准标签模板A'
  labelPrintForm.operator = task.operator || ''
  labelPrintForm.printMethod = 'batch'
  labelDialogVisible.value = true
}

function submitLabelPrint() {
  if (!labelTask.value) return
  if (labelPrintForm.printCount <= 0) {
    ElMessage.warning('请输入有效的打印数量')
    return
  }
  if (!labelPrintForm.operator.trim()) {
    ElMessage.warning('请输入操作人员')
    return
  }

  const record: LabelPrintRecord = {
    id: `lpr_${Date.now()}`,
    taskId: labelTask.value.id,
    printCount: Number(labelPrintForm.printCount),
    labelTemplate: labelPrintForm.template,
    operator: labelPrintForm.operator.trim(),
    printTime: new Date().toLocaleString('zh-CN')
  }

  store.addLabelPrintRecord(labelTask.value.id, record)
  labelDialogVisible.value = false
  ElMessage.success(`已打印标签 ${labelPrintForm.printCount} 张，任务数量未改动`)
}

function handleProcess(task: PackagingTask) {
  currentTask.value = task
  processForm.value = {
    completed: task.completed,
    operator: task.operator
  }
  dialogVisible.value = true
}

function submitProcess() {
  if (!currentTask.value) return
  if (processForm.value.completed > currentTask.value.quantity) {
    ElMessage.error('完成数量不能超过计划数量')
    return
  }
  store.updatePackagingCompleted(currentTask.value.id, processForm.value.completed)
  dialogVisible.value = false
  ElMessage.success('进度已更新')
}

function handleComplete(task: PackagingTask) {
  if (!task.appearanceChecked) {
    ElMessage.warning('请先完成外观检查')
    return
  }
  if (!task.bellowsCoverage) {
    ElMessage.warning('请先完成波纹管包覆')
    return
  }
  if (!task.labelPrinted) {
    ElMessage.warning('请先完成标签打印')
    return
  }
  ElMessageBox.confirm(`确认完成 "${task.productNo}" 的包装任务？`, '完成确认', {
    type: 'success'
  }).then(() => {
    store.updatePackagingCompleted(task.id, task.quantity)
    store.updatePackagingTaskStatus(task.id, 'completed')
    ElMessage.success('任务已完成')
  }).catch(() => {})
}

function getCheckStatus(task: PackagingTask) {
  const checks = [
    { key: 'appearanceChecked', label: '外观检查' },
    { key: 'bellowsCoverage', label: '波纹管' },
    { key: 'labelPrinted', label: '标签' }
  ]
  return checks.filter(c => task[c.key as keyof PackagingTask] as boolean).length + '/' + checks.length
}

function handleShowDetail(task: PackagingTask) {
  detailTask.value = task
  detailDialogVisible.value = true
}

function getResultTag(result: 'pass' | 'fail') {
  return result === 'pass'
    ? { type: 'success' as const, text: '合格' }
    : { type: 'danger' as const, text: '不合格' }
}

function canBellows(task: PackagingTask) {
  return task.appearanceChecked
}

function canLabel(task: PackagingTask) {
  return task.appearanceChecked
}
</script>

<template>
  <div class="packaging-page">
    <div class="page-header">
      <h2 class="page-title">外观包装</h2>
      <p class="page-subtitle">外观防呆检查、波纹管包覆、成品标签管理</p>
    </div>

    <el-row :gutter="16" class="stats-row mb-20">
      <el-col :span="6">
        <div class="stat-card total">
          <div class="stat-icon">
            <el-icon :size="24"><Box /></el-icon>
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
            placeholder="搜索产品编号/批次号"
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
        <el-table-column prop="packageSpec" label="包装规格" width="100" />
        <el-table-column prop="labelTemplate" label="标签模板" width="130" />
        <el-table-column prop="quantity" label="计划数" width="70" align="right" />
        <el-table-column label="完成进度" width="155">
          <template #default="{ row }">
            <div class="progress-cell">
              <el-progress :percentage="getProgress(row)" :stroke-width="8" />
              <span class="progress-text">{{ row.completed }}/{{ row.quantity }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="包装检查" width="110" align="center">
          <template #default="{ row }">
            <el-tooltip placement="top">
              <template #content>
                <div>外观检查: {{ row.appearanceChecked ? '✓' : '✗' }}</div>
                <div>波纹管: {{ row.bellowsCoverage ? '✓' : '✗' }}</div>
                <div>标签: {{ row.labelPrinted ? '✓' : '✗' }}</div>
              </template>
              <span :class="row.appearanceChecked && row.bellowsCoverage && row.labelPrinted ? 'text-success' : 'text-warning'">
                {{ getCheckStatus(row) }}
              </span>
            </el-tooltip>
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
        <el-table-column label="操作" width="290" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="info" link size="small" @click="handleShowDetail(row)">详情</el-button>
            <el-button type="warning" link size="small" @click="handleAppearanceCheck(row)">
              {{ row.appearanceChecked ? '外观✓' : '外观' }}
            </el-button>
            <el-button :type="canBellows(row) ? 'info' : 'info'" link size="small" :disabled="!canBellows(row)" @click="handleBellows(row)">
              {{ row.bellowsCoverage ? '波纹✓' : '波纹' }}
            </el-button>
            <el-button type="info" link size="small" :disabled="!canLabel(row)" @click="handleLabelPrint(row)">
              {{ row.labelPrinted ? '标签✓' : '标签' }}
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

    <el-dialog v-model="checkDialogVisible" title="外观防呆检查" width="720px" :close-on-click-modal="false">
      <div class="check-dialog">
        <el-alert
          title="请逐项勾选并判定结果。红色「必检」项目必须同时：已勾选 + 判定合格，才能放行后续工序。"
          type="warning"
          :closable="false"
          style="margin-bottom: 20px"
        />
        <el-table :data="checkItems" size="small" border>
          <el-table-column label="勾选" width="55" align="center">
            <template #default="{ row }">
              <el-checkbox v-model="row.checked" />
            </template>
          </el-table-column>
          <el-table-column prop="checkItem" label="检查项目" width="130" />
          <el-table-column prop="standard" label="检查标准" min-width="160" show-overflow-tooltip />
          <el-table-column prop="checkMethod" label="检查方法" width="100" />
          <el-table-column label="是否必检" width="75" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isRequired" type="danger" size="small">必检</el-tag>
              <span v-else class="text-muted">选检</span>
            </template>
          </el-table-column>
          <el-table-column label="结果" width="100" align="center">
            <template #default="{ row }">
              <el-radio-group v-model="row.result" size="small">
                <el-radio-button value="pass">合格</el-radio-button>
                <el-radio-button value="fail">不合格</el-radio-button>
              </el-radio-group>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="checkDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAppearanceCheck">保存并提交检查</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="labelDialogVisible" title="成品标签打印" width="500px" :close-on-click-modal="false">
      <div v-if="labelTask" class="label-dialog">
        <el-form label-width="100px">
          <el-form-item label="产品编号">
            <el-input :value="labelTask.productNo" readonly />
          </el-form-item>
          <el-form-item label="任务计划数">
            <el-input :value="`${labelTask.quantity} PCS（不受本页修改）`" readonly />
          </el-form-item>
          <el-form-item label="标签模板">
            <el-select v-model="labelPrintForm.template" style="width: 100%">
              <el-option label="标准标签模板A" value="标准标签模板A" />
              <el-option label="标准标签模板B" value="标准标签模板B" />
              <el-option label="客户定制模板" value="客户定制模板" />
            </el-select>
          </el-form-item>
          <el-form-item label="打印数量 (张)">
            <el-input-number v-model="labelPrintForm.printCount" :min="1" style="width: 100%" />
            <div class="form-tip">※ 只代表打印多少张标签，不会修改任务计划数</div>
          </el-form-item>
          <el-form-item label="打印方式">
            <el-radio-group v-model="labelPrintForm.printMethod">
              <el-radio value="single">单张打印</el-radio>
              <el-radio value="batch">批量打印</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="操作人员">
            <el-input v-model="labelPrintForm.operator" placeholder="请输入操作人员" />
          </el-form-item>
        </el-form>
        <div class="label-preview">
          <div class="label-title">标签预览（共 {{ labelPrintForm.printCount }} 张）</div>
          <div class="label-content">
            <div class="label-header">{{ labelTask.productNo || '线束总成' }}</div>
            <div class="label-body">
              <div>产品编号: {{ labelTask.productNo }}</div>
              <div>数量: {{ labelPrintForm.printCount }} PCS</div>
              <div>日期: {{ new Date().toLocaleDateString() }}</div>
            </div>
            <div class="label-barcode">|||||||||||</div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="labelDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitLabelPrint">
          <el-icon><Printer /></el-icon>
          打印标签
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogVisible" title="包装报工" width="460px" :close-on-click-modal="false">
      <div v-if="currentTask" class="process-dialog">
        <el-descriptions :column="2" border size="small" style="margin-bottom: 20px">
          <el-descriptions-item label="产品编号">{{ currentTask.productNo }}</el-descriptions-item>
          <el-descriptions-item label="包装规格">{{ currentTask.packageSpec }}</el-descriptions-item>
          <el-descriptions-item label="计划数量">{{ currentTask.quantity }}</el-descriptions-item>
          <el-descriptions-item label="已完成">{{ currentTask.completed }}</el-descriptions-item>
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
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProcess">确认提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="包装任务详情" width="820px" :close-on-click-modal="false">
      <div v-if="detailTask" class="detail-dialog">
        <el-descriptions :column="3" border size="small" style="margin-bottom: 20px">
          <el-descriptions-item label="任务编号">{{ detailTask.id }}</el-descriptions-item>
          <el-descriptions-item label="产品编号">{{ detailTask.productNo }}</el-descriptions-item>
          <el-descriptions-item label="包装规格">{{ detailTask.packageSpec }}</el-descriptions-item>
          <el-descriptions-item label="标签模板">{{ detailTask.labelTemplate }}</el-descriptions-item>
          <el-descriptions-item label="计划数量">
            <b style="color:#1890ff">{{ detailTask.quantity }} PCS</b>
          </el-descriptions-item>
          <el-descriptions-item label="已完成">{{ detailTask.completed }}</el-descriptions-item>
          <el-descriptions-item label="外观检查">
            <el-tag v-if="detailTask.appearanceChecked" type="success" size="small">已通过</el-tag>
            <el-tag v-else type="warning" size="small">未通过/未做</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="波纹管">
            <el-tag v-if="detailTask.bellowsCoverage" type="success" size="small">已包覆</el-tag>
            <el-tag v-else type="info" size="small">未包覆</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="标签打印">
            <el-tag v-if="detailTask.labelPrinted" type="success" size="small">已打印</el-tag>
            <el-tag v-else type="info" size="small">未打印</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ detailTask.createTime }}</el-descriptions-item>
          <el-descriptions-item label="操作员">{{ detailTask.operator || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="section-title">外观检查记录</div>
        <el-table
          :data="detailTask.appearanceRecords || []"
          size="small"
          border
          empty-text="暂无检查记录"
          style="margin-bottom: 20px"
        >
          <el-table-column type="index" label="#" width="50" align="center" />
          <el-table-column prop="checkItem" label="检查项目" width="140" />
          <el-table-column label="是否必检" width="80" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isRequired" type="danger" size="small">必检</el-tag>
              <span v-else class="text-muted">选检</span>
            </template>
          </el-table-column>
          <el-table-column label="已勾选" width="70" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.checked" type="success" size="small">是</el-tag>
              <span v-else class="text-muted">否</span>
            </template>
          </el-table-column>
          <el-table-column label="结果" width="70" align="center">
            <template #default="{ row }">
              <el-tag :type="getResultTag(row.result).type" size="small">
                {{ getResultTag(row.result).text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
        </el-table>

        <div class="section-title">标签打印历史</div>
        <el-table
          :data="detailTask.labelPrintRecords || []"
          size="small"
          border
          empty-text="暂无打印记录"
        >
          <el-table-column type="index" label="#" width="50" align="center" />
          <el-table-column prop="printCount" label="打印数量(张)" width="110" align="right" />
          <el-table-column prop="labelTemplate" label="使用模板" width="150" />
          <el-table-column prop="operator" label="操作人员" width="100" />
          <el-table-column prop="printTime" label="打印时间" width="170" />
          <el-table-column label="任务计划数" width="110" align="right">
            <template #default>
              <span style="color:#1890ff">{{ detailTask.quantity }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button type="primary" @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.packaging-page {
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

.stat-card.total::after { background: #eb2f96; }
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

.stat-card.total .stat-icon { background: #fff0f6; color: #eb2f96; }
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

.text-success { color: #52c41a; font-weight: 500; }
.text-warning { color: #faad14; font-weight: 500; }
.text-muted { color: #8c8c8c; }

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #1890ff;
}

.form-tip {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.label-preview {
  margin-top: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.label-title {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 10px;
}

.label-content {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 12px;
}

.label-header {
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e8e8e8;
  margin-bottom: 8px;
}

.label-body {
  font-size: 12px;
  line-height: 1.8;
  color: #666;
}

.label-barcode {
  text-align: center;
  margin-top: 8px;
  font-size: 20px;
  letter-spacing: 2px;
  color: #333;
}
</style>
