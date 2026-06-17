import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '工作台', icon: 'DataLine' }
  },
  {
    path: '/bom',
    name: 'BOM',
    component: () => import('../views/BOMImport.vue'),
    meta: { title: 'BOM导入', icon: 'Document' }
  },
  {
    path: '/cutting',
    name: 'Cutting',
    component: () => import('../views/Cutting.vue'),
    meta: { title: '裁线剥皮', icon: 'Scissors' }
  },
  {
    path: '/crimping',
    name: 'Crimping',
    component: () => import('../views/Crimping.vue'),
    meta: { title: '端子压接', icon: 'Connection' }
  },
  {
    path: '/pre-assembly',
    name: 'PreAssembly',
    component: () => import('../views/PreAssembly.vue'),
    meta: { title: '预装防水', icon: 'Watermelon' }
  },
  {
    path: '/assembly',
    name: 'Assembly',
    component: () => import('../views/Assembly.vue'),
    meta: { title: '总装布线', icon: 'Grid' }
  },
  {
    path: '/conductor-test',
    name: 'ConductorTest',
    component: () => import('../views/ConductorTest.vue'),
    meta: { title: '导通测试', icon: 'Lightning' }
  },
  {
    path: '/packaging',
    name: 'Packaging',
    component: () => import('../views/Packaging.vue'),
    meta: { title: '外观包装', icon: 'Box' }
  },
  {
    path: '/materials',
    name: 'Materials',
    component: () => import('../views/Materials.vue'),
    meta: { title: '物料管理', icon: 'Goods' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
