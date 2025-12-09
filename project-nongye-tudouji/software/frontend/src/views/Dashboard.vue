<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon online">
              <el-icon><Robot /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ onlineRobots }}</div>
              <div class="stats-label">在线机器人</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon running">
              <el-icon><VideoPlay /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ runningTasks }}</div>
              <div class="stats-label">运行任务</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon warning">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ warnings }}</div>
              <div class="stats-label">警告信息</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon battery">
              <el-icon><Lightning /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ avgBattery }}%</div>
              <div class="stats-label">平均电量</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 主要内容区 -->
    <el-row :gutter="20" class="main-content">
      <!-- 实时监控 -->
      <el-col :span="16">
        <el-card title="实时监控" class="monitor-card">
          <template #header>
            <div class="card-header">
              <span>实时监控</span>
              <div class="header-actions">
                <el-select v-model="selectedRobot" @change="changeRobot" style="width: 160px">
                  <el-option
                    v-for="robot in robots"
                    :key="robot.id"
                    :label="robot.name"
                    :value="robot.id"
                  />
                </el-select>
                <el-button :icon="FullScreen" @click="toggleFullscreen" size="small" />
              </div>
            </div>
          </template>
          
          <div class="monitor-content" ref="monitorContent">
            <!-- 视频监控 -->
            <div class="video-container" v-show="videoStream">
              <video
                ref="videoPlayer"
                class="video-player"
                autoplay
                muted
                playsinline
              ></video>
              
              <!-- 检测结果叠加层 -->
              <div class="detection-overlay">
                <div
                  v-for="(detection, index) in currentDetections"
                  :key="index"
                  class="detection-box"
                  :style="getDetectionStyle(detection)"
                >
                  <div class="detection-label">
                    {{ detection.class_name }}: {{ (detection.confidence * 100).toFixed(1) }}%
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 地图显示 -->
            <div class="map-container" v-show="!videoStream">
              <div id="robot-map" class="map"></div>
            </div>
            
            <!-- 控制按钮 -->
            <div class="control-panel">
              <div class="video-controls">
                <el-button-group>
                  <el-button
                    :type="videoStream ? 'primary' : 'default'"
                    @click="switchToVideo"
                    size="small"
                  >
                    视频监控
                  </el-button>
                  <el-button
                    :type="!videoStream ? 'primary' : 'default'"
                    @click="switchToMap"
                    size="small"
                  >
                    地图视图
                  </el-button>
                </el-button-group>
              </div>
              
              <div class="robot-controls" v-if="selectedRobot">
                <el-button
                  type="primary"
                  :icon="VideoPlay"
                  @click="startPatrol"
                  :disabled="isPatrolling"
                >
                  开始巡检
                </el-button>
                <el-button
                  type="danger"
                  :icon="VideoPause"
                  @click="stopPatrol"
                  :disabled="!isPatrolling"
                >
                  停止巡检
                </el-button>
                <el-button
                  :icon="Refresh"
                  @click="refreshData"
                >
                  刷新
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
        
        <!-- 状态信息 -->
        <el-card title="机器人状态" class="status-card" style="margin-top: 20px">
          <div class="status-grid">
            <div class="status-item">
              <span class="status-label">位置坐标:</span>
              <span class="status-value">{{ robotStatus.position }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">运动速度:</span>
              <span class="status-value">{{ robotStatus.velocity }} m/s</span>
            </div>
            <div class="status-item">
              <span class="status-label">电量状态:</span>
              <el-progress
                :percentage="robotStatus.battery"
                :status="getBatteryStatus(robotStatus.battery)"
                :width="80"
                type="circle"
              />
            </div>
            <div class="status-item">
              <span class="status-label">运行模式:</span>
              <el-tag :type="getModeType(robotStatus.mode)">
                {{ getModeText(robotStatus.mode) }}
              </el-tag>
            </div>
            <div class="status-item">
              <span class="status-label">在线时长:</span>
              <span class="status-value">{{ formatUptime(robotStatus.uptime) }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">任务进度:</span>
              <el-progress :percentage="taskProgress" :stroke-width="6" />
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 侧边信息 -->
      <el-col :span="8">
        <!-- 实时数据 -->
        <el-card title="实时数据" class="data-card">
          <div class="data-tabs">
            <el-tabs v-model="activeDataTab">
              <el-tab-pane label="检测统计" name="detection">
                <div class="detection-stats">
                  <div
                    v-for="(stat, index) in detectionStats"
                    :key="index"
                    class="detection-item"
                  >
                    <div class="detection-icon" :style="{ backgroundColor: stat.color }">
                      <el-icon><component :is="stat.icon" /></el-icon>
                    </div>
                    <div class="detection-info">
                      <div class="detection-name">{{ stat.name }}</div>
                      <div class="detection-count">{{ stat.count }}</div>
                    </div>
                  </div>
                </div>
                
                <!-- 检测趋势图 -->
                <div class="detection-chart">
                  <v-chart
                    :option="detectionChartOption"
                    :autoresize="true"
                    style="height: 200px"
                  />
                </div>
              </el-tab-pane>
              
              <el-tab-pane label="环境数据" name="environment">
                <div class="environment-data">
                  <div class="env-item">
                    <div class="env-label">温度</div>
                    <div class="env-value">{{ environmentData.temperature }}°C</div>
                  </div>
                  <div class="env-item">
                    <div class="env-label">湿度</div>
                    <div class="env-value">{{ environmentData.humidity }}%</div>
                  </div>
                  <div class="env-item">
                    <div class="env-label">土壤pH值</div>
                    <div class="env-value">{{ environmentData.soilPH }}</div>
                  </div>
                  <div class="env-item">
                    <div class="env-label">光照强度</div>
                    <div class="env-value">{{ environmentData.lightIntensity }} lux</div>
                  </div>
                </div>
                
                <!-- 环境趋势图 -->
                <div class="environment-chart">
                  <v-chart
                    :option="environmentChartOption"
                    :autoresize="true"
                    style="height: 200px"
                  />
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-card>
        
        <!-- 最近任务 -->
        <el-card title="最近任务" class="tasks-card" style="margin-top: 20px">
          <div class="recent-tasks">
            <div
              v-for="(task, index) in recentTasks"
              :key="index"
              class="task-item"
            >
              <div class="task-status" :class="task.status">
                <el-icon><component :is="getTaskIcon(task.status)" /></el-icon>
              </div>
              <div class="task-info">
                <div class="task-name">{{ task.name }}</div>
                <div class="task-time">{{ formatTime(task.startTime) }}</div>
              </div>
              <div class="task-progress">
                <el-progress :percentage="task.progress" :show-text="false" />
              </div>
            </div>
          </div>
        </el-card>
        
        <!-- 系统警告 -->
        <el-card title="系统警告" class="alerts-card" style="margin-top: 20px">
          <div class="alerts-list">
            <div
              v-for="(alert, index) in alerts"
              :key="index"
              class="alert-item"
              :class="alert.level"
            >
              <div class="alert-icon">
                <el-icon><component :is="getAlertIcon(alert.level)" /></el-icon>
              </div>
              <div class="alert-content">
                <div class="alert-message">{{ alert.message }}</div>
                <div class="alert-time">{{ formatTime(alert.timestamp) }}</div>
              </div>
              <el-button
                :icon="Close"
                size="small"
                circle
                @click="dismissAlert(index)"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useStore } from 'vuex'
import { VChart } from 'vue-echarts'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import * as echarts from 'echarts'

export default {
  name: 'Dashboard',
  components: {
    VChart
  },
  setup() {
    const store = useStore()
    
    // 响应式数据
    const selectedRobot = ref('')
    const videoStream = ref(true)
    const isPatrolling = ref(false)
    const activeDataTab = ref('detection')
    const monitorContent = ref(null)
    
    // 模拟数据
    const onlineRobots = ref(3)
    const runningTasks = ref(2)
    const warnings = ref(1)
    const avgBattery = ref(85)
    
    const robots = ref([
      { id: 'robot_01', name: '机器人01', status: 'online' },
      { id: 'robot_02', name: '机器人02', status: 'online' },
      { id: 'robot_03', name: '机器人03', status: 'offline' }
    ])
    
    const robotStatus = ref({
      position: 'X: 12.5, Y: 8.3',
      velocity: 0.8,
      battery: 85,
      mode: 'patrol',
      uptime: 12500
    })
    
    const taskProgress = ref(65)
    
    const currentDetections = ref([
      {
        class_name: '土豆',
        confidence: 0.92,
        bbox: { x: 100, y: 100, width: 120, height: 80 }
      },
      {
        class_name: '杂草',
        confidence: 0.78,
        bbox: { x: 300, y: 200, width: 60, height: 40 }
      }
    ])
    
    const detectionStats = ref([
      { name: '土豆', count: 45, color: '#52c41a', icon: 'Basketball' },
      { name: '杂草', count: 12, color: '#ff4d4f', icon: 'Warning' },
      { name: '地瓜', count: 28, color: '#1890ff', icon: 'Apple' },
      { name: '病害', count: 3, color: '#faad14', icon: 'Bug' }
    ])
    
    const environmentData = ref({
      temperature: 25.6,
      humidity: 68.5,
      soilPH: 6.8,
      lightIntensity: 12500
    })
    
    const recentTasks = ref([
      {
        name: '区域巡检',
        status: 'running',
        startTime: Date.now() - 1800000,
        progress: 65
      },
      {
        name: '自动灌溉',
        status: 'completed',
        startTime: Date.now() - 7200000,
        progress: 100
      },
      {
        name: '目标检测',
        status: 'pending',
        startTime: Date.now() - 3600000,
        progress: 0
      }
    ])
    
    const alerts = ref([
      {
        level: 'warning',
        message: '机器人02电量低于20%',
        timestamp: Date.now() - 300000
      },
      {
        level: 'error',
        message: '检测到异常病虫害',
        timestamp: Date.now() - 600000
      }
    ])
    
    // 检测趋势图配置
    const detectionChartOption = computed(() => ({
      title: {
        text: '检测趋势',
        textStyle: { fontSize: 14 }
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00']
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '作物',
          type: 'line',
          data: [12, 18, 25, 20, 22, 30],
          smooth: true
        },
        {
          name: '杂草',
          type: 'line',
          data: [5, 8, 6, 9, 7, 12],
          smooth: true
        }
      ]
    }))
    
    // 环境数据图配置
    const environmentChartOption = computed(() => ({
      title: {
        text: '环境趋势',
        textStyle: { fontSize: 14 }
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00']
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '温度',
          type: 'line',
          data: [24, 25, 26, 27, 26, 25],
          smooth: true
        },
        {
          name: '湿度',
          type: 'line',
          data: [70, 68, 65, 63, 66, 68],
          smooth: true
        }
      ]
    }))
    
    // 方法
    const changeRobot = (robotId) => {
      console.log('切换机器人:', robotId)
      // 这里添加切换逻辑
    }
    
    const toggleFullscreen = () => {
      if (monitorContent.value) {
        monitorContent.value.requestFullscreen()
      }
    }
    
    const switchToVideo = () => {
      videoStream.value = true
    }
    
    const switchToMap = () => {
      videoStream.value = false
      nextTick(() => {
        initMap()
      })
    }
    
    const startPatrol = () => {
      isPatrolling.value = true
      // 这里添加启动巡检逻辑
    }
    
    const stopPatrol = () => {
      isPatrolling.value = false
      // 这里添加停止巡检逻辑
    }
    
    const refreshData = () => {
      // 刷新数据逻辑
      console.log('刷新数据')
    }
    
    const getDetectionStyle = (detection) => {
      return {
        left: detection.bbox.x + 'px',
        top: detection.bbox.y + 'px',
        width: detection.bbox.width + 'px',
        height: detection.bbox.height + 'px'
      }
    }
    
    const getBatteryStatus = (battery) => {
      if (battery < 20) return 'exception'
      if (battery < 50) return 'warning'
      return 'success'
    }
    
    const getModeType = (mode) => {
      const typeMap = {
        patrol: 'primary',
        detection: 'success',
        idle: 'info',
        emergency: 'danger'
      }
      return typeMap[mode] || 'info'
    }
    
    const getModeText = (mode) => {
      const textMap = {
        patrol: '巡检中',
        detection: '检测中',
        idle: '空闲',
        emergency: '紧急停止'
      }
      return textMap[mode] || '未知'
    }
    
    const formatUptime = (seconds) => {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours}小时${minutes}分钟`
    }
    
    const getTaskIcon = (status) => {
      const iconMap = {
        running: 'VideoPlay',
        completed: 'Check',
        pending: 'Clock',
        failed: 'Close'
      }
      return iconMap[status] || 'Clock'
    }
    
    const getAlertIcon = (level) => {
      const iconMap = {
        info: 'InfoFilled',
        warning: 'WarningFilled',
        error: 'CircleCloseFilled'
      }
      return iconMap[level] || 'InfoFilled'
    }
    
    const dismissAlert = (index) => {
      alerts.value.splice(index, 1)
    }
    
    const formatTime = (timestamp) => {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: zhCN
      })
    }
    
    const initMap = () => {
      // 初始化地图（需要集成地图库）
      console.log('初始化地图')
    }
    
    // 生命周期
    onMounted(() => {
      // 选择第一个在线机器人
      const onlineRobot = robots.value.find(r => r.status === 'online')
      if (onlineRobot) {
        selectedRobot.value = onlineRobot.id
      }
    })
    
    return {
      selectedRobot,
      videoStream,
      isPatrolling,
      activeDataTab,
      monitorContent,
      onlineRobots,
      runningTasks,
      warnings,
      avgBattery,
      robots,
      robotStatus,
      taskProgress,
      currentDetections,
      detectionStats,
      environmentData,
      recentTasks,
      alerts,
      detectionChartOption,
      environmentChartOption,
      changeRobot,
      toggleFullscreen,
      switchToVideo,
      switchToMap,
      startPatrol,
      stopPatrol,
      refreshData,
      getDetectionStyle,
      getBatteryStatus,
      getModeType,
      getModeText,
      formatUptime,
      getTaskIcon,
      getAlertIcon,
      dismissAlert,
      formatTime
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard {
  .stats-row {
    margin-bottom: 20px;
    
    .stats-card {
      .stats-content {
        display: flex;
        align-items: center;
        
        .stats-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          
          .el-icon {
            font-size: 28px;
            color: white;
          }
          
          &.online {
            background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
          }
          
          &.running {
            background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
          }
          
          &.warning {
            background: linear-gradient(135deg, #faad14 0%, #ffc53d 100%);
          }
          
          &.battery {
            background: linear-gradient(135deg, #722ed1 0%, #9254de 100%);
          }
        }
        
        .stats-info {
          .stats-value {
            font-size: 32px;
            font-weight: 600;
            color: #303133;
            line-height: 1;
            margin-bottom: 4px;
          }
          
          .stats-label {
            font-size: 14px;
            color: #909399;
          }
        }
      }
    }
  }
  
  .main-content {
    .monitor-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }
      }
      
      .monitor-content {
        position: relative;
        min-height: 400px;
        
        .video-container {
          position: relative;
          width: 100%;
          height: 400px;
          background: #000;
          border-radius: 8px;
          overflow: hidden;
          
          .video-player {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .detection-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            
            .detection-box {
              position: absolute;
              border: 2px solid #52c41a;
              background: rgba(82, 196, 26, 0.1);
              
              .detection-label {
                position: absolute;
                top: -24px;
                left: 0;
                background: #52c41a;
                color: white;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 12px;
                white-space: nowrap;
              }
            }
          }
        }
        
        .map-container {
          width: 100%;
          height: 400px;
          border-radius: 8px;
          overflow: hidden;
          
          .map {
            width: 100%;
            height: 100%;
            background: #f0f0f0;
          }
        }
        
        .control-panel {
          position: absolute;
          bottom: 20px;
          left: 20px;
          right: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .video-controls {
            background: rgba(0, 0, 0, 0.7);
            border-radius: 6px;
            padding: 4px;
          }
          
          .robot-controls {
            display: flex;
            gap: 8px;
          }
        }
      }
    }
    
    .status-card {
      .status-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        
        .status-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          
          .status-label {
            font-size: 14px;
            color: #909399;
            margin-bottom: 8px;
          }
          
          .status-value {
            font-size: 16px;
            font-weight: 600;
            color: #303133;
          }
        }
      }
    }
  }
  
  .data-card {
    .detection-stats {
      .detection-item {
        display: flex;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        .detection-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          
          .el-icon {
            font-size: 16px;
            color: white;
          }
        }
        
        .detection-info {
          flex: 1;
          
          .detection-name {
            font-size: 14px;
            color: #303133;
          }
          
          .detection-count {
            font-size: 18px;
            font-weight: 600;
            color: #1890ff;
          }
        }
      }
    }
    
    .environment-data {
      .env-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        .env-label {
          font-size: 14px;
          color: #909399;
        }
        
        .env-value {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
        }
      }
    }
  }
  
  .tasks-card {
    .recent-tasks {
      .task-item {
        display: flex;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        .task-status {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          
          &.running {
            background: #e6f7ff;
            color: #1890ff;
          }
          
          &.completed {
            background: #f6ffed;
            color: #52c41a;
          }
          
          &.pending {
            background: #fff7e6;
            color: #faad14;
          }
        }
        
        .task-info {
          flex: 1;
          
          .task-name {
            font-size: 14px;
            color: #303133;
            margin-bottom: 4px;
          }
          
          .task-time {
            font-size: 12px;
            color: #909399;
          }
        }
        
        .task-progress {
          width: 80px;
        }
      }
    }
  }
  
  .alerts-card {
    .alerts-list {
      .alert-item {
        display: flex;
        align-items: flex-start;
        padding: 12px;
        border-radius: 6px;
        margin-bottom: 8px;
        
        &.info {
          background: #e6f7ff;
        }
        
        &.warning {
          background: #fffbe6;
        }
        
        &.error {
          background: #fff2f0;
        }
        
        .alert-icon {
          margin-right: 8px;
          margin-top: 2px;
        }
        
        .alert-content {
          flex: 1;
          
          .alert-message {
            font-size: 14px;
            color: #303133;
            margin-bottom: 4px;
          }
          
          .alert-time {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }
}
</style>