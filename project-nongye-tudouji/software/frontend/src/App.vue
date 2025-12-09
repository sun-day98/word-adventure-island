<template>
  <div id="app">
    <el-container class="app-container">
      <!-- 侧边栏 -->
      <el-aside :width="sidebarWidth" class="sidebar">
        <div class="logo-container">
          <img src="@/assets/images/logo.png" alt="Logo" class="logo" />
          <h1 v-show="!isCollapse" class="title">农业机器人</h1>
        </div>
        
        <el-menu
          :default-active="$route.path"
          :collapse="isCollapse"
          :unique-opened="true"
          router
          class="sidebar-menu"
        >
          <el-menu-item index="/dashboard">
            <el-icon><Monitor /></el-icon>
            <span>控制台</span>
          </el-menu-item>
          
          <el-sub-menu index="robot">
            <template #title>
              <el-icon><Robot /></el-icon>
              <span>机器人管理</span>
            </template>
            <el-menu-item index="/robot/status">状态监控</el-menu-item>
            <el-menu-item index="/robot/control">远程控制</el-menu-item>
            <el-menu-item index="/robot/navigation">路径规划</el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="detection">
            <template #title>
              <el-icon><View /></el-icon>
              <span>目标检测</span>
            </template>
            <el-menu-item index="/detection/realtime">实时检测</el-menu-item>
            <el-menu-item index="/detection/history">历史记录</el-menu-item>
            <el-menu-item index="/detection/statistics">统计分析</el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="tasks">
            <template #title>
              <el-icon><List /></el-icon>
              <span>任务管理</span>
            </template>
            <el-menu-item index="/tasks/current">当前任务</el-menu-item>
            <el-menu-item index="/tasks/schedule">任务调度</el-menu-item>
            <el-menu-item index="/tasks/history">任务历史</el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="data">
            <template #title>
              <el-icon><DataAnalysis /></el-icon>
              <span>数据分析</span>
            </template>
            <el-menu-item index="/data/crops">作物分析</el-menu-item>
            <el-menu-item index="/data/environment">环境数据</el-menu-item>
            <el-menu-item index="/data/performance">性能统计</el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="settings">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统设置</span>
            </template>
            <el-menu-item index="/settings/robot">机器人配置</el-menu-item>
            <el-menu-item index="/settings/detection">检测参数</el-menu-item>
            <el-menu-item index="/settings/notification">通知设置</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>
      
      <!-- 主内容区 -->
      <el-container>
        <!-- 顶部导航栏 -->
        <el-header class="header">
          <div class="header-left">
            <el-button
              type="text"
              :icon="isCollapse ? Expand : Fold"
              @click="toggleSidebar"
              class="collapse-btn"
            />
          </div>
          
          <div class="header-center">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index">
                {{ item }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          
          <div class="header-right">
            <!-- 连接状态 -->
            <div class="connection-status">
              <el-tooltip :content="connectionStatus.text" placement="bottom">
                <el-tag :type="connectionStatus.type" size="small">
                  <el-icon><Connection /></el-icon>
                  {{ connectionStatus.text }}
                </el-tag>
              </el-tooltip>
            </div>
            
            <!-- 通知 -->
            <el-badge :value="unreadNotifications" class="notification-badge">
              <el-button :icon="Bell" circle size="small" @click="showNotifications" />
            </el-badge>
            
            <!-- 用户菜单 -->
            <el-dropdown @command="handleUserCommand">
              <span class="user-dropdown">
                <el-avatar :size="32" src="@/assets/images/avatar.png" />
                <span class="username">{{ userInfo.name }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>
                    个人中心
                  </el-dropdown-item>
                  <el-dropdown-item command="settings">
                    <el-icon><Setting /></el-icon>
                    系统设置
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <!-- 主要内容 -->
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
    
    <!-- 通知抽屉 -->
    <el-drawer
      v-model="notificationDrawerVisible"
      title="系统通知"
      direction="rtl"
      size="400px"
    >
      <div class="notification-list">
        <div
          v-for="(notification, index) in notifications"
          :key="index"
          class="notification-item"
          :class="{ 'unread': !notification.read }"
          @click="markAsRead(index)"
        >
          <div class="notification-header">
            <el-tag :type="notification.type" size="small">
              {{ notification.category }}
            </el-tag>
            <span class="notification-time">
              {{ formatTime(notification.timestamp) }}
            </span>
          </div>
          <div class="notification-content">
            {{ notification.message }}
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default {
  name: 'App',
  setup() {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()
    
    // 响应式数据
    const isCollapse = ref(false)
    const notificationDrawerVisible = ref(false)
    
    // 计算属性
    const sidebarWidth = computed(() => isCollapse.value ? '64px' : '200px')
    
    const breadcrumbs = computed(() => {
      const matched = route.matched
      return matched.slice(1).map(item => item.meta.title || item.name)
    })
    
    const connectionStatus = computed(() => store.state.socket.connected)
    
    const userInfo = computed(() => store.state.user.info)
    
    const notifications = computed(() => store.state.notifications.list)
    
    const unreadNotifications = computed(() => {
      return notifications.value.filter(n => !n.read).length
    })
    
    // 方法
    const toggleSidebar = () => {
      isCollapse.value = !isCollapse.value
    }
    
    const showNotifications = () => {
      notificationDrawerVisible.value = true
    }
    
    const markAsRead = (index) => {
      store.dispatch('notifications/markAsRead', index)
    }
    
    const handleUserCommand = (command) => {
      switch (command) {
        case 'profile':
          router.push('/profile')
          break
        case 'settings':
          router.push('/settings/profile')
          break
        case 'logout':
          logout()
          break
      }
    }
    
    const logout = () => {
      store.dispatch('user/logout')
      router.push('/login')
    }
    
    const formatTime = (timestamp) => {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: zhCN
      })
    }
    
    // 生命周期
    onMounted(() => {
      // 初始化Socket连接
      store.dispatch('socket/connect')
      
      // 获取用户信息
      store.dispatch('user/getInfo')
      
      // 获取通知
      store.dispatch('notifications/fetch')
    })
    
    onUnmounted(() => {
      // 断开Socket连接
      store.dispatch('socket/disconnect')
    })
    
    return {
      isCollapse,
      sidebarWidth,
      breadcrumbs,
      connectionStatus,
      userInfo,
      notifications,
      unreadNotifications,
      notificationDrawerVisible,
      toggleSidebar,
      showNotifications,
      markAsRead,
      handleUserCommand,
      formatTime
    }
  }
}
</script>

<style lang="scss">
#app {
  height: 100vh;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

.app-container {
  height: 100%;
  
  .sidebar {
    background: #304156;
    transition: width 0.3s;
    overflow: hidden;
    
    .logo-container {
      height: 60px;
      display: flex;
      align-items: center;
      padding: 0 20px;
      background: #2b2f3a;
      
      .logo {
        width: 32px;
        height: 32px;
        margin-right: 12px;
      }
      
      .title {
        color: #fff;
        font-size: 16px;
        font-weight: 600;
        margin: 0;
      }
    }
    
    .sidebar-menu {
      border: none;
      background: #304156;
      
      .el-menu-item,
      .el-sub-menu__title {
        color: #bfcbd9;
        border-bottom: none;
        
        &:hover {
          background: #263445 !important;
          color: #fff;
        }
        
        &.is-active {
          background: #1890ff !important;
          color: #fff;
        }
      }
      
      .el-sub-menu .el-menu-item {
        background: #1f2d3d;
        min-width: 0;
        
        &.is-active {
          background: #1890ff !important;
        }
      }
    }
  }
  
  .header {
    background: #fff;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    
    .header-left {
      .collapse-btn {
        margin-right: 20px;
      }
    }
    
    .header-center {
      flex: 1;
      display: flex;
      justify-content: center;
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .connection-status {
        .el-tag {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
      
      .notification-badge {
        margin-right: 12px;
      }
      
      .user-dropdown {
        display: flex;
        align-items: center;
        cursor: pointer;
        gap: 8px;
        
        .username {
          font-size: 14px;
          color: #303133;
        }
      }
    }
  }
  
  .main-content {
    background: #f0f2f5;
    padding: 20px;
    overflow-y: auto;
  }
}

.notification-list {
  .notification-item {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    
    &.unread {
      background: #fafafa;
      border-left: 3px solid #1890ff;
    }
    
    &:hover {
      background: #f5f5f5;
    }
    
    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      
      .notification-time {
        font-size: 12px;
        color: #999;
      }
    }
    
    .notification-content {
      font-size: 14px;
      color: #333;
      line-height: 1.5;
    }
  }
}

// Element Plus 主题定制
.el-button--primary {
  background-color: #1890ff;
  border-color: #1890ff;
  
  &:hover {
    background-color: #40a9ff;
    border-color: #40a9ff;
  }
}

.el-menu--horizontal .el-menu-item.is-active {
  border-bottom-color: #1890ff;
}
</style>