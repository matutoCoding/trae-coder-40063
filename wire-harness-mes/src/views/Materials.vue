<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useMESStore } from '../stores/mes'
import type { MaterialReservation } from '../types'

const store = useMESStore()

const activeTab = ref('wire')
const searchKeyword = ref('')

const tabs = [
  { name: 'wire', label: '电线电缆' },
  { name: 'terminal', label: '端子' },
  { name: 'sheath', label: '护套' },
  { name: 'waterproof', label: '防水栓' },
  { name: 'reservation', label: '占用记录' }
]

const reservationSearch = ref('')

const wireColumns = [
  { prop: 'wireNo', label: '线号', width: 120 },
  { prop: 'wireType', label: '类型', width: 90 },
  { prop: 'color', label: '颜色', width: 70 },
  { prop: 'spec', label: '规格', width: 90 },
  { prop: 'crossSection', label: '截面积(mm²)', width: 100, align: 'right' },
  { prop: 'unitPrice', label: '单价(元)', width: 90, align: 'right' },
  { prop: 'stock', label: '总库存(m)', width: 100, align: 'right' },
  { prop: 'occupiedQty', label: '已占用(m)', width: 100, align: 'right' },
  { label: '可用库存(m)', width: 100, align: 'right' },
  { label: '缺口', width: 90, align: 'center' },
]

const terminalColumns = [
  { prop: 'terminalNo', label: '端子编号', width: 130 },
  { prop: 'terminalType', label: '类型', width: 80 },
  { prop: 'spec', label: '规格', width: 90 },
  { prop: 'crimpHeight', label: '压接高度(mm)', width: 110, align: 'right' },
  { prop: 'tensileStrength', label: '最小拉力(N)', width: 100, align: 'right' },
  { prop: 'unitPrice', label: '单价(元)', width: 90, align: 'right' },
  { prop: 'stock', label: '总库存(个)', width: 100, align: 'right' },
  { prop: 'occupiedQty', label: '已占用(个)', width: 100, align: 'right' },
  { label: '可用库存(个)', width: 100, align: 'right' },
  { label: '缺口', width: 90, align: 'center' },
]

const sheathColumns = [
  { prop: 'sheathNo', label: '护套编号', width: 160 },
  { prop: 'sheathType', label: '类型', width: 80 },
  { prop: 'holeCount', label: '孔位数', width: 80, align: 'center' },
  { prop: 'unitPrice', label: '单价(元)', width: 100, align: 'right' },
  { prop: 'stock', label: '库存(个)', width: 120, align: 'right' },
]

const waterproofColumns = [
  { prop: 'plugNo', label: '防水栓编号', width: 130 },
  { prop: 'plugType', label: '类型', width: 110 },
  { prop: 'unitPrice', label: '单价(元)', width: 90, align: 'right' },
  { prop: 'stock', label: '总库存(个)', width: 100, align: 'right' },
  { prop: 'occupiedQty', label: '已占用(个)', width: 100, align: 'right' },
  { label: '可用库存(个)', width: 100, align: 'right' },
  { label: '缺口', width: 90, align: 'center' },
]

const columnsMap: Record<string, any[]> = {
  wire: wireColumns,
  terminal: terminalColumns,
  sheath: sheathColumns,
  waterproof: waterproofColumns,
}

function getAvailableQty(row: any): number {
  return Math.max(0, Number(row.stock || 0) - Number(row.occupiedQty || 0))
}

function getShortage(row: any): number {
  const available = getAvailableQty(row)
  return available < 0 ? Math.abs(available) : 0
}

function getStockClass(row: any) {
  const available = getAvailableQty(row)
  if (activeTab.value === 'wire') {
    if (available < 100) return 'stock-low'
    if (available < 500) return 'stock-medium'
  } else {
    if (available < 50) return 'stock-low'
    if (available < 200) return 'stock-medium'
  }
  return 'stock-high'
}

function getAvailableClass(row: any) {
  const available = getAvailableQty(row)
  if (activeTab.value === 'wire') {
    if (available < 100) return 'stock-low'
    if (available < 500) return 'stock-medium'
  } else {
    if (available < 50) return 'stock-low'
    if (available < 200) return 'stock-medium'
  }
  return 'stock-high'
}

const filteredWireData = computed(() => {
  let data = store.wires
  if (searchKeyword.value) {
    data = data.filter(item => item.wireNo.includes(searchKeyword.value))
  }
  return data
})

const filteredTerminalData = computed(() => {
  let data = store.terminals
  if (searchKeyword.value) {
    data = data.filter(item => item.terminalNo.includes(searchKeyword.value))
  }
  return data
})

const filteredSheathData = computed(() => {
  let data = store.sheaths
  if (searchKeyword.value) {
    data = data.filter(item => item.sheathNo.includes(searchKeyword.value))
  }
  return data
})

const filteredWaterproofData = computed(() => {
  let data = store.waterproofPlugs
  if (searchKeyword.value) {
    data = data.filter(item => item.plugNo.includes(searchKeyword.value))
  }
  return data
})

const currentData = computed(() => {
  switch (activeTab.value) {
    case 'wire': return filteredWireData.value
    case 'terminal': return filteredTerminalData.value
    case 'sheath': return filteredSheathData.value
    case 'waterproof': return filteredWaterproofData.value
    default: return []
  }
})

const filteredReservations = computed<MaterialReservation[]>(() => {
  let list = store.reservations
  if (reservationSearch.value) {
    const kw = reservationSearch.value.trim()
    list = list.filter(r =>
      (r.batchNo && r.batchNo.includes(kw)) ||
      (r.materialNo && r.materialNo.includes(kw))
    )
  }
  return list
})

function handleAdd() {
  ElMessage.info('新增物料功能')
}

function handleEdit(row: any) {
  console.log('Edit', row)
}

function handleDelete(row: any) {
  console.log('Delete', row)
}

function getColor(colorName: string): string {
  const colorMap: Record<string, string> = {
    '红色': '#f56c6c',
    '黑色': '#303133',
    '黄色': '#e6a23c',
    '绿色': '#67c23a',
    '蓝色': '#409eff',
    '白色': '#f5f7fa',
  }
  return colorMap[colorName] || '#909399'
}

function getMaterialTypeLabel(type: string) {
  const map: Record<string, string> = {
    wire: '线材',
    terminal: '端子',
    waterproof: '防水栓',
  }
  return map[type] || type
}

function getReservationStatusTag(status: string) {
  const map: Record<string, { type: string; text: string }> = {
    reserved: { type: 'warning', text: '已占用' },
    consumed: { type: 'success', text: '已消耗' },
    released: { type: 'info', text: '已释放' },
  }
  return map[status] || { type: 'info', text: status }
}
</script>

<template>
  <div class="materials-page">
    <div class="page-header">
      <h2 class="page-title">物料管理</h2>
      <p class="page-subtitle">电线、端子、护套、防水栓等物料库存及占用管理</p>
    </div>

    <div class="card">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-tabs v-model="activeTab" class="tab-filter">
            <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="tab.label" :name="tab.name" />
          </el-tabs>
        </div>
        <div class="toolbar-right">
          <template v-if="activeTab !== 'reservation'">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索物料编号"
              style="width: 220px"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </template>
          <template v-else>
            <el-input
              v-model="reservationSearch"
              placeholder="搜索批次号/物料编号"
              style="width: 240px"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </template>
          <el-button v-if="activeTab !== 'reservation'" type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增物料
          </el-button>
        </div>
      </div>

      <template v-if="activeTab !== 'reservation'">
        <el-table :data="currentData" style="width: 100%" stripe>
          <el-table-column type="index" label="#" width="50" align="center" />
          <el-table-column
            v-for="col in columnsMap[activeTab]"
            :key="col.prop || col.label"
            :prop="col.prop"
            :label="col.label"
            :width="col.width"
            :align="col.align"
          >
            <template v-if="col.prop === 'stock'" #default="{ row }">
              <span :class="getStockClass(row)">{{ Number(row.stock || 0).toLocaleString() }}</span>
            </template>
            <template v-else-if="col.prop === 'occupiedQty'" #default="{ row }">
              <span :class="Number(row.occupiedQty || 0) > 0 ? 'stock-medium' : ''">
                {{ Number(row.occupiedQty || 0).toLocaleString() }}
              </span>
            </template>
            <template v-else-if="col.label && col.label.startsWith('可用库存')" #default="{ row }">
              <span :class="getAvailableClass(row)">
                {{ getAvailableQty(row).toLocaleString() }}
              </span>
            </template>
            <template v-else-if="col.label === '缺口'" #default="{ row }">
              <span v-if="getShortage(row) > 0" class="stock-low">
                -{{ getShortage(row).toLocaleString() }}
              </span>
              <span v-else class="stock-high">—</span>
            </template>
            <template v-else-if="col.prop === 'color' && activeTab === 'wire'" #default="{ row }">
              <span class="color-tag" :style="{ background: getColor(row.color) }"></span>
              <span class="color-text">{{ row.color }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="activeTab !== 'sheath'" label="操作" width="150" fixed="right" align="center">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <template v-else>
        <el-table :data="filteredReservations" style="width: 100%" stripe empty-text="暂无物料占用记录，下发生产任务后会自动生成">
          <el-table-column type="index" label="#" width="50" align="center" />
          <el-table-column prop="batchNo" label="关联批次" width="170">
            <template #default="{ row }">
              <el-tag v-if="row.batchNo" type="primary" effect="plain" size="small">{{ row.batchNo }}</el-tag>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="物料类型" width="90" align="center">
            <template #default="{ row }">{{ getMaterialTypeLabel(row.materialType) }}</template>
          </el-table-column>
          <el-table-column prop="materialNo" label="物料编号" width="160" />
          <el-table-column label="影响线号" min-width="200">
            <template #default="{ row }">
              <template v-if="row.wireNos && row.wireNos.length > 0">
                <el-tag
                  v-for="(wn, i) in row.wireNos.slice(0, 5)"
                  :key="i"
                  size="small"
                  style="margin-right: 4px; margin-bottom: 2px"
                >{{ wn }}</el-tag>
                <span v-if="row.wireNos.length > 5" class="text-muted">
                  +{{ row.wireNos.length - 5 }}
                </span>
              </template>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="requiredQty" label="需求数量" width="100" align="right" />
          <el-table-column prop="reservedQty" label="已占用数量" width="110" align="right">
            <template #default="{ row }">
              <span class="stock-medium">{{ Number(row.reservedQty || 0).toLocaleString() }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="getReservationStatusTag(row.status).type" size="small">
                {{ getReservationStatusTag(row.status).text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="170" />
        </el-table>
      </template>

      <div class="pagination">
        <el-pagination
          background
          layout="total, prev, pager, next, sizes"
          :page-size="10"
          :total="activeTab === 'reservation' ? filteredReservations.length : currentData.length"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.materials-page {
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

.color-tag {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #e8e8e8;
  vertical-align: middle;
  margin-right: 6px;
}

.color-text {
  vertical-align: middle;
}

.stock-high { color: #52c41a; font-weight: 500; }
.stock-medium { color: #faad14; font-weight: 500; }
.stock-low { color: #ff4d4f; font-weight: 500; }

.text-muted { color: #8c8c8c; }

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
