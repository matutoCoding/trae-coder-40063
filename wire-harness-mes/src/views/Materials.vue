<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useMESStore } from '../stores/mes'

const store = useMESStore()

const activeTab = ref('wire')
const searchKeyword = ref('')

const tabs = [
  { name: 'wire', label: '电线电缆' },
  { name: 'terminal', label: '端子' },
  { name: 'sheath', label: '护套' },
  { name: 'waterproof', label: '防水栓' }
]

const currentData = computed(() => {
  let data: any[] = []
  switch (activeTab.value) {
    case 'wire':
      data = store.wires
      break
    case 'terminal':
      data = store.terminals
      break
    case 'sheath':
      data = store.sheaths
      break
    case 'waterproof':
      data = store.waterproofPlugs
      break
  }
  if (searchKeyword.value) {
    data = data.filter(item => {
      const searchKey = activeTab.value === 'wire' ? 'wireNo' :
                        activeTab.value === 'terminal' ? 'terminalNo' :
                        activeTab.value === 'sheath' ? 'sheathNo' : 'plugNo'
      return item[searchKey].includes(searchKeyword.value)
    })
  }
  return data
})

const wireColumns = [
  { prop: 'wireNo', label: '线号', width: 140 },
  { prop: 'wireType', label: '类型', width: 100 },
  { prop: 'color', label: '颜色', width: 80 },
  { prop: 'spec', label: '规格', width: 100 },
  { prop: 'crossSection', label: '截面积(mm²)', width: 110, align: 'right' },
  { prop: 'unitPrice', label: '单价(元)', width: 100, align: 'right' },
  { prop: 'stock', label: '库存(m)', width: 120, align: 'right' },
]

const terminalColumns = [
  { prop: 'terminalNo', label: '端子编号', width: 140 },
  { prop: 'terminalType', label: '类型', width: 80 },
  { prop: 'spec', label: '规格', width: 100 },
  { prop: 'crimpHeight', label: '压接高度(mm)', width: 110, align: 'right' },
  { prop: 'tensileStrength', label: '最小拉力(N)', width: 110, align: 'right' },
  { prop: 'unitPrice', label: '单价(元)', width: 100, align: 'right' },
  { prop: 'stock', label: '库存(个)', width: 120, align: 'right' },
]

const sheathColumns = [
  { prop: 'sheathNo', label: '护套编号', width: 160 },
  { prop: 'sheathType', label: '类型', width: 80 },
  { prop: 'holeCount', label: '孔位数', width: 80, align: 'center' },
  { prop: 'unitPrice', label: '单价(元)', width: 100, align: 'right' },
  { prop: 'stock', label: '库存(个)', width: 120, align: 'right' },
]

const waterproofColumns = [
  { prop: 'plugNo', label: '防水栓编号', width: 140 },
  { prop: 'plugType', label: '类型', width: 120 },
  { prop: 'unitPrice', label: '单价(元)', width: 100, align: 'right' },
  { prop: 'stock', label: '库存(个)', width: 120, align: 'right' },
]

const columnsMap: Record<string, any[]> = {
  wire: wireColumns,
  terminal: terminalColumns,
  sheath: sheathColumns,
  waterproof: waterproofColumns
}

function handleAdd() {
  ElMessage.info('新增物料功能')
}

function handleEdit(row: any) {
  console.log('Edit', row)
}

function handleDelete(row: any) {
  console.log('Delete', row)
}

function getStockClass(stock: number) {
  if (stock < 10000) return 'stock-low'
  if (stock < 50000) return 'stock-medium'
  return 'stock-high'
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
</script>

<template>
  <div class="materials-page">
    <div class="page-header">
      <h2 class="page-title">物料管理</h2>
      <p class="page-subtitle">电线、端子、护套、防水栓等物料库存管理</p>
    </div>

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
            placeholder="搜索物料编号"
            style="width: 220px"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增物料
          </el-button>
        </div>
      </div>

      <el-table :data="currentData" style="width: 100%" stripe>
        <el-table-column type="index" label="#" width="50" align="center" />
        <el-table-column
          v-for="col in columnsMap[activeTab]"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :align="col.align"
        >
          <template v-if="col.prop === 'stock'" #default="{ row }">
            <span :class="getStockClass(row.stock)">{{ row.stock.toLocaleString() }}</span>
          </template>
          <template v-else-if="col.prop === 'color' && activeTab === 'wire'" #default="{ row }">
            <span class="color-tag" :style="{ background: getColor(row.color) }"></span>
            <span class="color-text">{{ row.color }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="total, prev, pager, next, sizes"
          :page-size="10"
          :total="currentData.length"
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

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
