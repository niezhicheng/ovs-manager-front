<template>
  <div style="padding: 24px">
    <h2>LiveKit WebRTC Demo - 简化高清模式</h2>
    <div style="margin-bottom: 16px;">
      <label>角色：</label>
      <select v-model="role">
        <option value="student">学生（推流）</option>
        <option value="teacher">老师（拉流）</option>
      </select>
      <label style="margin-left: 16px;">房间号：</label>
      <input v-model="roomId" placeholder="请输入房间号" style="width: 120px;" />
      <label style="margin-left: 16px;">{{ role === 'student' ? '学号' : '工号' }}：</label>
      <input v-model="sid" placeholder="请输入ID" style="width: 120px;" />
      <button @click="joinRoom" :disabled="joined || !roomId || !sid">加入房间</button>
    </div>
    
    <!-- 简化质量设置 -->
    <div style="margin-bottom: 16px; padding: 12px; background: #f0f8ff; border-radius: 4px; border: 1px solid #4CAF50;">
      <h4>🎯 高清质量设置</h4>
      <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center;">
        <label>
          <input type="checkbox" v-model="enableHighQuality" />
          <strong>启用高清模式</strong>
        </label>
        <label>
          <input type="checkbox" v-model="enableSimulcast" />
          启用多流编码
        </label>
      </div>
    </div>
    
    <div v-if="role === 'student'">
      <video id="localVideo" autoplay muted playsinline style="width: 320px; border: 1px solid #ccc;" v-show="joined"></video>
      <div v-if="joined" style="margin-top: 8px; font-size: 12px; color: #666;">
        本地预览 - 实际传输质量更高
      </div>
      
      <!-- 传输质量监控 -->
      <div v-if="joined" style="margin-top: 12px; padding: 8px; background: #e8f5e8; border-radius: 4px; border: 1px solid #4CAF50;">
        <h5>📊 传输质量监控：</h5>
        <div style="font-size: 12px; line-height: 1.4;">
          <div>本地分辨率: {{ localVideoStats.resolution || '检测中...' }}</div>
          <div>传输码率: {{ localVideoStats.bitrate || '检测中...' }}</div>
          <div>网络质量: <span :style="{ color: getNetworkQualityColor(localVideoStats.quality) }">{{ localVideoStats.quality || '检测中...' }}</span></div>
          <div>连接状态: <span :style="{ color: localVideoStats.connected ? '#4CAF50' : '#f44336' }">{{ localVideoStats.connected ? '已连接' : '连接中...' }}</span></div>
        </div>
      </div>
    </div>
    <div v-if="role === 'teacher'">
      <div v-if="joined">
        <h3>学生画面：</h3>
        
        <!-- 接收质量监控 -->
        <div style="margin-bottom: 12px; padding: 8px; background: #fff3cd; border-radius: 4px; border: 1px solid #FF9800;">
          <h5>📊 接收质量监控：</h5>
          <div style="font-size: 12px; line-height: 1.4;">
            <div>连接学生数: {{ remoteStreams.length }}</div>
            <div>网络质量: <span :style="{ color: getNetworkQualityColor(teacherNetworkQuality) }">{{ teacherNetworkQuality || '检测中...' }}</span></div>
          </div>
        </div>
        
        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
          <div v-for="item in remoteStreams" :key="item.id" style="position: relative;">
            <video 
              :id="item.id" 
              autoplay 
              playsinline 
              style="width: 400px; height: 300px; border: 1px solid #ccc; object-fit: contain;" 
              ref="remoteVideos"
              @click="toggleFullscreen(item.id)"
            ></video>
            <div style="position: absolute; top: 4px; left: 4px; background: rgba(0,0,0,0.8); color: white; padding: 2px 6px; border-radius: 2px; font-size: 10px;">
              {{ item.id }}
            </div>
            <div style="position: absolute; top: 4px; right: 4px; background: rgba(76,175,80,0.8); color: white; padding: 2px 6px; border-radius: 2px; font-size: 10px;">
              HD
            </div>
            
            <!-- 单个视频质量信息 -->
            <div style="position: absolute; bottom: 4px; left: 4px; background: rgba(0,0,0,0.7); color: white; padding: 2px 6px; border-radius: 2px; font-size: 10px;">
              {{ item.receivedResolution || '检测中...' }}
            </div>
            
            <div style="margin-top: 4px; font-size: 12px; color: #666;">
              点击画面可全屏查看
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted } from 'vue';
import { Room, VideoPresets, Track } from 'livekit-client';

const role = ref('student');
const roomId = ref('');
const sid = ref('');
const joined = ref(false);
const remoteStreams = reactive([]);
const enableHighQuality = ref(true); // 默认启用高清模式
const enableSimulcast = ref(true); // 默认启用多流编码
const teacherNetworkQuality = ref('');
let room = null;

// 传输质量监控数据
const localVideoStats = reactive({
  resolution: '',
  bitrate: '',
  quality: '',
  connected: false,
  statsInterval: null
});

// 获取网络质量颜色
const getNetworkQualityColor = (quality) => {
  switch(quality) {
    case 'excellent': return '#4CAF50';
    case 'good': return '#8BC34A';
    case 'poor': return '#FF9800';
    case 'unknown': return '#9E9E9E';
    default: return '#9E9E9E';
  }
};

// 全屏切换函数
const toggleFullscreen = (videoId) => {
  const video = document.getElementById(videoId);
  if (video) {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  }
};

// 监控传输质量
const startQualityMonitoring = () => {
  if (localVideoStats.statsInterval) {
    clearInterval(localVideoStats.statsInterval);
  }
  
  localVideoStats.statsInterval = setInterval(async () => {
    if (room && room.localParticipant) {
      try {
        // 获取本地视频轨道统计
        const videoTrack = room.localParticipant.getTrack(Track.Source.ScreenShare);
        if (videoTrack) {
          const stats = await videoTrack.getStats();
          let totalBitrate = 0;
          
          stats.forEach((report) => {
            if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
              totalBitrate += report.bytesSent * 8 / 1000000; // 转换为Mbps
            }
          });
          
          localVideoStats.bitrate = `${totalBitrate.toFixed(2)} Mbps`;
          localVideoStats.connected = true;
        }
        
        // 获取网络质量
        const quality = room.localParticipant.connectionQuality;
        localVideoStats.quality = quality;
        
        // 获取本地视频分辨率
        const localVideo = document.getElementById('localVideo');
        if (localVideo && localVideo.videoWidth) {
          localVideoStats.resolution = `${localVideo.videoWidth}x${localVideo.videoHeight}`;
        }
        
      } catch (error) {
        console.warn('获取传输统计失败:', error);
      }
    }
  }, 2000); // 每2秒更新一次
};

// 停止质量监控
const stopQualityMonitoring = () => {
  if (localVideoStats.statsInterval) {
    clearInterval(localVideoStats.statsInterval);
    localVideoStats.statsInterval = null;
  }
};

// 组件卸载时清理
onUnmounted(() => {
  stopQualityMonitoring();
});

// 自动订阅并渲染所有远端 video track
function setupRoomEvents(room) {
  // 监听 trackSubscribed 事件
  room.on('trackSubscribed', (track, publication, participant) => {
    console.log('【老师端】trackSubscribed', participant.identity, track);
    
    if (track.kind === 'video') {
      let exists = remoteStreams.find(item => item.id === participant.identity);
      if (!exists) {
        console.log('【老师端】Creating new stream for participant:', participant.identity);
        const newStream = new MediaStream([track.mediaStreamTrack]);
        const streamItem = { 
          id: participant.identity, 
          stream: newStream,
          receivedResolution: ''
        };
        remoteStreams.push(streamItem);
        
        setTimeout(() => {
          let v = document.getElementById(participant.identity);
          if (v) {
            v.srcObject = newStream;
            console.log('【老师端】Set srcObject for video element:', participant.identity);
            
            // 启动接收质量监控
            startReceptionQualityMonitoring(participant.identity, track);
          }
        }, 0);
      }
    }
  });

  // 监听 trackUnsubscribed，移除流
  room.on('trackUnsubscribed', (track, publication, participant) => {
    if (track.kind === 'video') {
      const idx = remoteStreams.findIndex(item => item.id === participant.identity);
      if (idx !== -1) remoteStreams.splice(idx, 1);
    }
  });

  // 监听 participantConnected
  room.on('participantConnected', (participant) => {
    console.log('【老师端】participantConnected', participant.identity);
  });

  // 监听 participantDisconnected
  room.on('participantDisconnected', (participant) => {
    console.log('【老师端】participantDisconnected', participant.identity);
    const idx = remoteStreams.findIndex(item => item.id === participant.identity);
    if (idx !== -1) remoteStreams.splice(idx, 1);
  });
  
  // 监听连接质量变化
  room.on('connectionQualityChanged', (quality, participant) => {
    console.log('【老师端】Connection quality changed:', quality, participant.identity);
    teacherNetworkQuality.value = quality;
  });
}

// 启动接收质量监控
const startReceptionQualityMonitoring = (participantId, track) => {
  setInterval(async () => {
    try {
      // 更新流的质量信息
      const streamItem = remoteStreams.find(item => item.id === participantId);
      if (streamItem) {
        // 获取实际接收到的分辨率
        const video = document.getElementById(participantId);
        if (video && video.videoWidth) {
          streamItem.receivedResolution = `${video.videoWidth}x${video.videoHeight}`;
        }
      }
    } catch (error) {
      console.warn('获取接收统计失败:', error);
    }
  }, 3000); // 每3秒更新一次
};

const joinRoom = async () => {
  if (joined.value) return;
  
  try {
    // 1. 获取 Token
    const resp = await fetch(`http://172.18.10.207:3000/api/livekit/token?room=${roomId.value}&identity=${sid.value}`);
    const { token: livekitToken } = await resp.json();

    // 2. 创建 Room 实例并连接 - 使用简化配置
    room = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: enableHighQuality.value ? VideoPresets.h1080 : VideoPresets.h720,
        facingMode: 'user',
      },
      publishDefaults: {
        simulcast: enableSimulcast.value,
        videoSimulcastLayers: enableSimulcast.value ? [
          VideoPresets.h1080,
          VideoPresets.h720,
          VideoPresets.h540
        ] : undefined,
      }
    });
    
    await room.connect(`ws://47.120.36.189:7880`, livekitToken);
    console.log('【通用】Connected to room:', room.name);

    if (role.value === 'student') {
      // 学生端：屏幕共享
      try {
        // 设置高清屏幕共享参数
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: {
            cursor: 'always',
            displaySurface: 'monitor',
            logicalSurface: true,
            // 强制高清分辨率
            width: { ideal: enableHighQuality.value ? 1920 : 1280, max: 3840 },
            height: { ideal: enableHighQuality.value ? 1080 : 720, max: 2160 },
            frameRate: { ideal: 30, max: 60 },
            deviceId: 'default'
          }, 
          audio: false 
        });
        console.log('【学生端】getDisplayMedia success:', stream);
        
        const [track] = stream.getVideoTracks();
        
        // 设置视频轨道参数
        if (track) {
          // 设置高质量约束
          await track.applyConstraints({
            width: { ideal: enableHighQuality.value ? 1920 : 1280, min: 1280 },
            height: { ideal: enableHighQuality.value ? 1080 : 720, min: 720 },
            frameRate: { ideal: 30, min: 15 }
          });
          
          console.log('【学生端】Video track settings:', track.getSettings());
        }
        
        // 发布轨道 - 使用简化配置
        await room.localParticipant.publishTrack(track, { 
          name: 'screen-share',
          simulcast: enableSimulcast.value
        });
        console.log('【学生端】publishTrack success');
        
        document.getElementById('localVideo').srcObject = stream;
        
        // 启动质量监控
        startQualityMonitoring();
        
        // 监听连接质量变化
        room.on('connectionQualityChanged', (quality, participant) => {
          console.log('【学生端】Connection quality changed:', quality);
          localVideoStats.quality = quality;
        });
        
      } catch (e) {
        console.error('【学生端】Error:', e);
        alert('获取屏幕共享失败: ' + e.message);
      }
    } else if (role.value === 'teacher') {
      // 老师端：设置事件监听
      setupRoomEvents(room);
      
      // 处理已存在的参与者
      if (room.remoteParticipants && room.remoteParticipants.size > 0) {
        console.log('【老师端】Found existing participants:', room.remoteParticipants.size);
        room.remoteParticipants.forEach((participant) => {
          console.log('【老师端】Existing participant:', participant.identity);
        });
      }
    }
    
    joined.value = true;
  } catch (error) {
    console.error('【通用】Join room error:', error);
    alert('加入房间失败: ' + error.message);
  }
};
</script>

<style scoped>
/* 高清视频样式优化 */
video {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

/* 全屏时的样式优化 */
video:fullscreen {
  object-fit: contain;
  background: black;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

/* 视频容器样式 */
.video-container {
  position: relative;
  display: inline-block;
}

.video-container:hover {
  box-shadow: 0 0 15px rgba(76,175,80,0.5);
  transform: scale(1.02);
  transition: all 0.3s ease;
}
</style> 