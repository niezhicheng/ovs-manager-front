# LiveKit 传输质量优化指南

## 🎯 问题分析

**本地画面清晰，但远程接收模糊** - 这是典型的传输质量问题，主要出现在：

1. **网络传输过程** - 带宽限制、网络抖动、丢包
2. **编码压缩** - 过度压缩、编码参数不当
3. **服务器处理** - 服务器性能、转码质量
4. **接收端解码** - 解码器性能、显示设置

## 🔍 传输质量诊断

### 1. 使用内置质量监控

现在你的LiveKit界面已经添加了实时质量监控：

#### 学生端监控：
- **本地分辨率** - 实际捕获的分辨率
- **传输码率** - 实际发送的码率
- **网络质量** - 连接质量状态
- **连接状态** - 是否正常连接

#### 老师端监控：
- **连接学生数** - 当前连接的学生数量
- **网络质量** - 接收端网络状态
- **平均接收码率** - 实际接收到的码率
- **单个视频分辨率** - 每个学生视频的实际分辨率

### 2. 质量指标解读

#### 网络质量等级：
- 🟢 **Excellent** - 优秀，应该能收到高清画面
- 🟡 **Good** - 良好，可能有些质量损失
- 🟠 **Poor** - 较差，建议优化网络或降低质量

#### 码率参考：
- **< 2Mbps** - 质量较差，可能出现模糊
- **2-4Mbps** - 质量一般，适合720p
- **4-8Mbps** - 质量良好，适合1080p
- **8-15Mbps** - 质量优秀，适合1440p/4K

## 🚀 传输质量优化方案

### 1. 网络优化

#### 带宽检查：
```bash
# 测试上行带宽
speedtest-cli --upload

# 测试到服务器的延迟
ping 47.120.36.189

# 测试网络稳定性
traceroute 47.120.36.189
```

#### 网络优化建议：
- **使用有线网络** - 避免WiFi不稳定
- **关闭其他应用** - 释放带宽资源
- **使用VPN** - 如果网络路由有问题
- **更换网络** - 尝试不同的网络环境

### 2. 编码参数优化

#### 当前设置检查：
1. 打开浏览器开发者工具
2. 查看Console中的视频设置信息
3. 确认实际使用的分辨率、码率、帧率

#### 编码优化策略：

**如果网络带宽充足但质量差：**
```javascript
// 提高编码质量，降低压缩率
videoEncoding: {
  maxBitrate: 12000000,        // 提高到12Mbps
  maxFramerate: 30,            // 降低帧率节省带宽
  priority: 'high',
  scaleResolutionDownBy: 1.0,  // 不缩放
  codec: 'h264',
  profile: 'high',             // 使用高质量配置
  level: '4.2'
}
```

**如果网络带宽不足：**
```javascript
// 降低分辨率但保持高码率
videoEncoding: {
  maxBitrate: 6000000,         // 6Mbps
  maxFramerate: 30,
  priority: 'high',
  scaleResolutionDownBy: 1.0,
  codec: 'h264',
  profile: 'main',             // 使用兼容性更好的配置
  level: '4.1'
}
```

### 3. 服务器端优化

#### 检查服务器配置：
```yaml
# 确保服务器支持高质量传输
rtc:
  video:
    max_bitrate: 15000000      # 15Mbps
    max_resolution: "4k"
    max_framerate: 60
    
  encoder:
    hardware_encoder: true     # 启用硬件编码
    preset: "slow"             # 高质量编码
    profile: "high"
```

#### 服务器性能监控：
- **CPU使用率** - 不应超过80%
- **内存使用** - 确保有足够缓冲区
- **网络带宽** - 服务器带宽是否充足
- **GPU使用** - 硬件编码是否正常工作

### 4. 接收端优化

#### 浏览器设置：
1. **启用硬件加速**
   - Chrome: `chrome://settings/system` → 硬件加速
   - Edge: 设置 → 系统 → 硬件加速

2. **启用WebRTC优化**
   - Chrome: `chrome://flags` → WebRTC hardware video decoding
   - 启用VP9硬件解码

3. **关闭不必要的扩展**
   - 禁用广告拦截器
   - 关闭VPN代理
   - 关闭其他占用资源的扩展

#### 显示设置：
```css
/* 确保视频元素正确渲染 */
video {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  object-fit: contain;
}

/* 全屏时保持质量 */
video:fullscreen {
  width: 100vw;
  height: 100vh;
  object-fit: contain;
}
```

## 🛠️ 故障排除步骤

### 步骤1: 检查网络质量
1. 查看学生端的"网络质量"指标
2. 如果显示"Poor"，检查网络连接
3. 测试到服务器的延迟和丢包率

### 步骤2: 检查传输码率
1. 查看学生端的"传输码率"
2. 如果低于4Mbps，提高码率设置
3. 如果高于8Mbps但质量仍差，可能是网络问题

### 步骤3: 检查接收质量
1. 查看老师端的"平均接收码率"
2. 对比发送和接收码率，看是否有明显差异
3. 检查单个视频的实际分辨率

### 步骤4: 调整质量设置
1. 如果网络好但质量差：提高码率，降低帧率
2. 如果网络差：降低分辨率，保持高码率
3. 如果都不行：尝试不同的编码配置

## 📊 质量测试方法

### 1. 对比测试
```javascript
// 在浏览器控制台运行，对比本地和远程质量
function compareQuality() {
  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.querySelector('video[id]');
  
  console.log('本地视频:', {
    分辨率: `${localVideo.videoWidth}x${localVideo.videoHeight}`,
    帧率: localVideo.getVideoPlaybackQuality().totalFrameDelay
  });
  
  console.log('远程视频:', {
    分辨率: `${remoteVideo.videoWidth}x${remoteVideo.videoHeight}`,
    帧率: remoteVideo.getVideoPlaybackQuality().totalFrameDelay
  });
}
```

### 2. 网络测试
```javascript
// 测试网络连接质量
async function testNetworkQuality() {
  const room = window.room; // 假设room是全局变量
  if (room) {
    const stats = await room.localParticipant.getTrack(Track.Source.ScreenShare).getStats();
    stats.forEach(report => {
      if (report.type === 'outbound-rtp') {
        console.log('传输统计:', {
          码率: `${(report.bytesSent * 8 / 1000000).toFixed(2)} Mbps`,
          丢包率: `${((report.packetsLost || 0) / report.packetsSent * 100).toFixed(2)}%`,
          往返时间: `${report.roundTripTime}ms`
        });
      }
    });
  }
}
```

## 🎯 最佳实践

### 1. 网络环境
- **学生端**: 使用稳定的有线网络，确保上行带宽充足
- **老师端**: 使用高质量显示器，确保网络稳定
- **服务器**: 选择地理位置近、带宽充足的服务器

### 2. 硬件要求
- **学生端**: 支持硬件编码的GPU，足够的CPU资源
- **老师端**: 支持硬件解码的GPU，高分辨率显示器
- **服务器**: 高性能CPU/GPU，充足的内存和带宽

### 3. 软件设置
- **浏览器**: 使用最新版本，启用所有硬件加速
- **编码**: 根据网络情况动态调整参数
- **监控**: 实时监控质量指标，及时调整

## 🔧 快速修复方案

### 如果传输质量差：

1. **立即尝试**：
   - 降低分辨率到1080p
   - 提高码率到8Mbps
   - 降低帧率到30fps

2. **网络优化**：
   - 使用有线网络
   - 关闭其他应用
   - 重启路由器

3. **浏览器优化**：
   - 启用硬件加速
   - 关闭扩展程序
   - 清除缓存

4. **服务器检查**：
   - 确认服务器配置正确
   - 检查服务器负载
   - 验证网络连接

通过这些优化，应该能够显著改善传输质量，让远程接收的画面与本地预览一样清晰！ 