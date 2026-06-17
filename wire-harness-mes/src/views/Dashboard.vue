<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useMESStore } from '../stores/mes'
import * as echarts from 'echarts'

const store = useMESStore()

const weeklyChartRef = ref<HTMLElement | null>(null)
const processChartRef = ref<HTMLElement | null>(null)
let weeklyChart: echarts.ECharts | null = null
let processChart: echarts.ECharts | null = null

const stats = computed(() => store.dashboardStats)

const processStatusList = computed(() => [
  { name: '裁线剥皮', icon: 'Scissors', pending: store.pendingCuttingTasks.length, processing: store.processingCuttingTasks.length, completed: store.completedCuttingTasks.length, color: '#1890ff' },
  { name: '端子压接', icon: 'Connection', pending: store.pendingCrimpingTasks.length, processing: store.processingCrimpingTasks.length, completed: store.completedCrimpingTasks.length, color: '#52c41a' },
  { name: '预装防水', icon: 'Watermelon', pending: store.pendingPreAssemblyTasks.length, processing: store.processingPreAssemblyTasks.length, completed: store.completedPreAssemblyTasks.length, color: '#faad14' },
  { name: '总装布线', icon: 'Grid', pending: store.pendingAssemblyTasks.length, processing: store.processingAssemblyTasks.length, completed: store.completedAssemblyTasks.length, color: '#722ed1' },
  { name: '导通测试', icon: 'Lightning', pending: store.conductorTestTasks.filter(t => t.status === 'pending').length, processing: store.conductorTestTasks.filter(t => t.status === 'processing').length, completed: store.conductorTestTasks.filter(t => t.status === 'completed').length, color: '#13c2c2' },
  { name: '外观包装', icon: 'Box', pending: store.packagingTasks.filter(t => t.status === 'pending').length, processing: store.packagingTasks.filter(t => t.status === 'processing').length, completed: store.packagingTasks.filter(t => t.status === 'completed').length, color: '#eb2f96' },
])

function initWeeklyChart() {
  if (!weeklyChartRef.value) return
  weeklyChart = echarts.init(weeklyChartRef.value)
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['产量', '合格数'],
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 40,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: store.weeklyOutputData.map(d => d.day),
      axisLine: { lineStyle: { color: '#e8e8e8' } }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0' } }
    },
    series: [
      {
        name: '产量',
        type: 'bar',
        data: store.weeklyOutputData.map(d => d.output),
        itemStyle: { color: '#1890ff', borderRadius: [4, 4, 0, 0] },
        barWidth: '35%'
      },
      {
        name: '合格数',
        type: 'bar',
        data: store.weeklyOutputData.map(d => d.pass),
        itemStyle: { color: '#52c41a', borderRadius: [4, 4, 0, 0] },
        barWidth: '35%'
      }
    ]
  }
  weeklyChart.setOption(option)
}

function initProcessChart() {
  if (!processChartRef.value) return
  processChart = echarts.init(processChartRef.value)
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['待处理', '进行中', '已完成'],
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 40,
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0' } }
    },
    yAxis: {
      type: 'category',
      data: store.processData.map(d => d.name),
      axisLine: { lineStyle: { color: '#e8e8e8' } }
    },
    series: [
      {
        name: '待处理',
        type: 'bar',
        stack: 'total',
        data: store.processData.map(d => d.pending),
        itemStyle: { color: '#faad14' }
      },
      {
        name: '进行中',
        type: 'bar',
        stack: 'total',
        data: store.processData.map(d => d.processing),
        itemStyle: { color: '#1890ff' }
      },
      {
        name: '已完成',
        type: 'bar',
        stack: 'total',
        data: store.processData.map(d => d.completed),
        itemStyle: { color: '#52c41a' }
      }
    ]
  }
  processChart.setOption(option)
}

function handleResize() {
  weeklyChart?.resize()
  processChart?.resize()
}

onMounted(() => {
  initWeeklyChart()
  initProcessChart()
  window.addEventListener('resize', handleResize)
})
</script>

<template>
  <div class="dashboard">
    <div class="page-header">
      <h2 class="page-title">工作台</h2>
      <p class="page-subtitle">线束加工生产管理系统 - 实时掌握生产进度</p>
    </div>

    <el-row :gutter="16" class="stats-row mb-20">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #e6f7ff">
            <el-icon :size="24" color="#1890ff"><Present /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">今日产量</div>
            <div class="stat-value">{{ stats.todayOutput }} <span class="unit">条</span></div>
          </div>
          <div class="stat-trend up">
            <el-icon><CaretTop /></el-icon>
            <span>较昨日 +12%</span>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f6ffed">
            <el-icon :size="24" color="#52c41a"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">合格率</div>
            <div class="stat-value">{{ stats.passRate }} <span class="unit">%</span></div>
          </div>
          <div class="stat-trend up">
            <el-icon><CaretTop /></el-icon>
            <span>较上周 +0.5%</span>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff7e6">
            <el-icon :size="24" color="#faad14"><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">待处理任务</div>
            <div class="stat-value">{{ stats.pendingTasks }} <span class="unit">个</span></div>
          </div>
          <div class="stat-trend down">
            <el-icon><CaretBottom /></el-icon>
            <span>较昨日 -3</span>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f9f0ff">
            <el-icon :size="24" color="#722ed1"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">BOM总数</div>
            <div class="stat-value">{{ stats.bomCount }} <span class="unit">份</span></div>
          </div>
          <div class="stat-trend up">
            <el-icon><CaretTop /></el-icon>
            <span>本月新增 +12</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mb-20">
      <el-col :span="16">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">本周产量趋势</h3>
            <el-radio-group size="small" v-model="stats">
              <el-radio-button label="本周"></el-radio-button>
              <el-radio-button label="本月"></el-radio-button>
            </el-radio-group>
          </div>
          <div ref="weeklyChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">工序任务分布</h3>
          </div>
          <div ref="processChartRef" class="chart-container-sm"></div>
        </div>
      </el-col>
    </el-row>

    <div class="card mb-20">
      <div class="card-header">
        <h3 class="card-title">各工序生产进度</h3>
      </div>
      <el-row :gutter="16">
        <el-col :span="4" v-for="item in processStatusList" :key="item.name">
          <div class="process-card" :style="{ borderTopColor: item.color }">
            <div class="process-icon" :style="{ background: item.color + '20', color: item.color }">
              <el-icon :size="28"><component :is="item.icon" /></el-icon>
            </div>
            <div class="process-name">{{ item.name }}</div>
            <div class="process-stats">
              <div class="process-stat">
                <span class="process-stat-value" style="color: #faad14">{{ item.pending }}</span>
                <span class="process-stat-label">待处理</span>
              </div>
              <div class="process-stat">
                <span class="process-stat-value" style="color: #1890ff">{{ item.processing }}</span>
                <span class="process-stat-label">进行中</span>
              </div>
              <div class="process-stat">
                <span class="process-stat-value" style="color: #52c41a">{{ item.completed }}</span>
                <span class="process-stat-label">已完成</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="16">
      <el-col :span="12">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">最近BOM清单</h3>
            <el-button type="primary" link size="small">查看全部</el-button>
          </div>
          <el-table :data="store.boms.slice(0, 5)" size="small" style="width: 100%">
            <el-table-column prop="productNo" label="产品编号" width="140" />
            <el-table-column prop="productName" label="产品名称" />
            <el-table-column prop="version" label="版本" width="80" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'completed' ? 'success' : row.status === 'producing' ? 'primary' : row.status === 'approved' ? 'warning' : 'info'" size="small">
                  {{ row.status === 'draft' ? '草稿' : row.status === 'approved' ? '已审核' : row.status === 'producing' ? '生产中' : '已完成' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="totalWires" label="线号数" width="80" align="right" />
          </el-table>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">进行中任务</h3>
            <el-button type="primary" link size="small">查看全部</el-button>
          </div>
          <el-table :data="store.processingCuttingTasks.slice(0, 5)" size="small" style="width: 100%">
            <el-table-column prop="productNo" label="产品编号" width="140" />
            <el-table-column prop="wireNo" label="线号" />
            <el-table-column prop="quantity" label="总数" width="80" align="right" />
            <el-table-column label="进度" width="160">
              <template #default="{ row }">
                <el-progress :percentage="Math.round(row.completed / row.quantity * 100)" :stroke-width="10" />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard {
  padding-bottom: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 14px;
  color: #8c8c8c;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.stat-info {
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #262626;
}

.stat-value .unit {
  font-size: 14px;
  color: #8c8c8c;
  font-weight: normal;
}

.stat-trend {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-trend.up {
  color: #52c41a;
}

.stat-trend.down {
  color: #ff4d4f;
}

.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
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

.chart-container {
  height: 300px;
  padding: 10px 20px 20px;
}

.chart-container-sm {
  height: 280px;
  padding: 10px 20px 20px;
}

.process-card {
  background: #fafafa;
  border-radius: 8px;
  padding: 20px 16px;
  text-align: center;
  border-top: 3px solid #1890ff;
}

.process-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}

.process-name {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 16px;
}

.process-stats {
  display: flex;
  justify-content: space-around;
}

.process-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.process-stat-value {
  font-size: 20px;
  font-weight: 600;
}

.process-stat-label {
  font-size: 12px;
  color: #8c8c8c;
}
</style>
