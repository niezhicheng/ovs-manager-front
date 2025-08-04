import request from '@/utils/request'

// 获取数据库状态
export function getDatabaseStatus() {
  return request({
    url: '/ovs/database/status',
    method: 'get'
  })
}

// 重启数据库服务
export function restartDatabaseService() {
  return request({
    url: '/ovs/database/restart',
    method: 'post'
  })
}

// 备份数据库
export function backupDatabase(data) {
  return request({
    url: '/ovs/database/backup',
    method: 'post',
    data
  })
}

// 恢复数据库
export function restoreDatabase(data) {
  return request({
    url: '/ovs/database/restore',
    method: 'post',
    data
  })
}

// 导出配置
export function exportConfig() {
  return request({
    url: '/ovs/database/export',
    method: 'get'
  })
}

// 导入配置
export function importConfig(data) {
  return request({
    url: '/ovs/database/import',
    method: 'post',
    data
  })
}

// 获取数据库表列表
export function getDatabaseTables() {
  return request({
    url: '/ovs/database/tables',
    method: 'get'
  })
}

// 获取表数据
export function getTableData(tableName) {
  return request({
    url: `/ovs/database/tables/${tableName}`,
    method: 'get'
  })
}

// 导出表数据
export function exportTableData(tableName) {
  return request({
    url: `/ovs/database/tables/${tableName}/export`,
    method: 'get'
  })
}

// 设置日志级别
export function setLogLevel(level) {
  return request({
    url: '/ovs/database/log-level',
    method: 'post',
    data: { level }
  })
}

// 获取日志内容
export function getLogs(params) {
  return request({
    url: '/ovs/database/logs',
    method: 'get',
    params
  })
} 