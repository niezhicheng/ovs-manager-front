# LiveKit 超高清监考优化指南

## 🎯 超高清优化目标

将LiveKit视频质量从"勉强看清"提升到"超高清清晰"，适合监考场景的严格要求。

## 🚀 超高清优化方案

### 1. 客户端超高清设置

#### 主要改进：
- ✅ **4K/2K分辨率支持** - 最高3840x2160分辨率
- ✅ **超高码率配置** - 8-15Mbps码率
- ✅ **60fps高帧率** - 流畅的画面体验
- ✅ **硬件加速优化** - GPU编码提升性能
- ✅ **多流编码增强** - 更精细的质量控制

#### 关键配置参数：
```javascript
// 超高清屏幕共享设置
const stream = await navigator.mediaDevices.getDisplayMedia({ 
  video: {
    width: { ideal: 2560, max: 3840 },  // 2K-4K分辨率
    height: { ideal: 1440, max: 2160 },
    frameRate: { ideal: 60, max: 60 },   // 60fps
    aspectRatio: { ideal: 16/9 },
    colorSpace: 'srgb'
  }
});

// 超高质量视频约束
await track.applyConstraints({
  width: { ideal: 2560, min: 1920 },
  height: { ideal: 1440, min: 1080 },
  frameRate: { ideal: 60, min: 30 },
  deviceId: 'default',
  aspectRatio: { ideal: 16/9 },
  colorSpace: 'srgb',
  advanced: [
    {
      width: { ideal: 2560 },
      height: { ideal: 1440 },
      frameRate: { ideal: 60 }
    }
  ]
});

// 超高质量发布参数
await room.localParticipant.publishTrack(track, { 
  name: 'ultra-hd-screen',
  simulcast: true,
  videoEncoding: {
    maxBitrate: 8000000,        // 8Mbps
    maxFramerate: 60,
    priority: 'high',
    scaleResolutionDownBy: 1.0, // 不缩放
    codec: 'h264',
    profile: 'high',
    level: '4.2'
  }
});
```

### 2. 服务器端超高清配置

#### 关键服务器参数：
```yaml
rtc:
  video:
    max_resolution: "4k"           # 支持4K
    max_framerate: 60              # 60fps
    max_bitrate: 15000000          # 15Mbps
    target_bitrate: 8000000        # 8Mbps目标
    
  encoder:
    hardware_encoder: true         # 硬件编码
    encoder_type: "h264_nvenc"     # NVIDIA GPU
    preset: "slow"                 # 高质量编码
    profile: "high"                # 高配置
    level: "4.2"                   # 4.2级别
    b_frames: true                 # B帧
    ref_frames: 4                  # 参考帧
    deblocking: true               # 去块滤波
```

### 3. 网络带宽要求

#### 超高清带宽需求：
- **最低带宽**: 10Mbps 上行/下行
- **推荐带宽**: 20Mbps 上行/下行  
- **理想带宽**: 50Mbps+ 上行/下行
- **4K带宽**: 100Mbps+ 上行/下行

#### 网络质量检测：
```javascript
// 监控网络质量
room.on('connectionQualityChanged', (quality, participant) => {
  console.log('网络质量:', quality);
  if (quality === 'poor') {
    console.warn('网络质量差，建议降低分辨率');
  }
});

// 监控带宽使用
room.on('trackStats', (stats) => {
  console.log('视频统计:', {
    bitrate: stats.bitrate,
    packetsLost: stats.packetsLost,
    jitter: stats.jitter,
    roundTripTime: stats.roundTripTime
  });
});
```

### 4. 浏览器优化设置

#### Chrome/Edge 优化：
1. 启用硬件加速：`chrome://settings/system` → 硬件加速
2. 启用WebRTC硬件编码：`chrome://flags` → WebRTC hardware video encoding
3. 启用VP9编码：`chrome://flags` → VP9 hardware video encoding

#### Firefox 优化：
1. 启用WebRTC硬件加速：`about:config` → `media.webrtc.hw.h264.enabled`
2. 启用VP9编码：`about:config` → `media.webrtc.hw.vp9.enabled`

#### 浏览器检查代码：
```javascript
// 检查硬件编码支持
const capabilities = RTCRtpSender.getCapabilities('video');
console.log('支持的编码器:', capabilities.codecs.map(c => c.mimeType));

// 检查屏幕共享支持
if (!navigator.mediaDevices.getDisplayMedia) {
  alert('浏览器不支持屏幕共享');
}

// 检查分辨率支持
const videoTrack = stream.getVideoTracks()[0];
const capabilities = videoTrack.getCapabilities();
console.log('支持的分辨率:', capabilities.width, capabilities.height);
```

## 🔧 使用方法

### 1. 启动超高清LiveKit服务器
```bash
# 使用超高清配置文件启动
docker run -p 7880:7880 -p 7881:7881 -p 7882-8000:7882-8000/udp \
  -v $(pwd)/livekit-high-quality-config.yaml:/config.yaml \
  --gpus all \  # 启用GPU支持
  livekit/livekit-server --config /config.yaml
```

### 2. 使用超高清前端
- 打开 `src/views/ovs/livekit-demo.vue`
- 启用所有超高清选项
- 选择1440p或4K分辨率
- 设置8-12Mbps码率
- 启用60fps帧率

### 3. 质量监控
```javascript
// 实时质量监控
setInterval(() => {
  const video = document.querySelector('video');
  if (video && video.videoWidth) {
    console.log('当前视频质量:', {
      分辨率: `${video.videoWidth}x${video.videoHeight}`,
      帧率: video.getVideoPlaybackQuality().totalFrameDelay,
      码率: '需要从WebRTC统计获取'
    });
  }
}, 5000);
```

## 📊 性能监控

### 1. 客户端性能指标
- **分辨率**: 实时监控当前分辨率
- **帧率**: 监控实际帧率
- **码率**: 监控实际码率
- **延迟**: 监控网络延迟
- **丢包率**: 监控网络质量

### 2. 服务器性能指标
- **CPU使用率**: 监控编码性能
- **GPU使用率**: 监控硬件编码
- **内存使用**: 监控缓冲区使用
- **网络带宽**: 监控带宽使用
- **连接数**: 监控并发连接

## 🛠️ 故障排除

### 常见问题及解决方案：

#### 1. 画面仍然不够清晰
**原因**: 网络带宽不足或硬件不支持
**解决**:
- 检查网络带宽是否达到要求
- 确认GPU硬件编码是否启用
- 降低分辨率到1080p但提高码率
- 使用有线网络连接

#### 2. 全屏时画面模糊
**原因**: 视频元素渲染问题
**解决**:
```css
video:fullscreen {
  object-fit: contain;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  width: 100vw;
  height: 100vh;
}
```

#### 3. 网络卡顿严重
**原因**: 码率过高或网络不稳定
**解决**:
- 降低码率到4-6Mbps
- 降低帧率到30fps
- 启用自适应码率
- 检查网络连接质量

#### 4. CPU使用率过高
**原因**: 软件编码或分辨率过高
**解决**:
- 启用硬件加速
- 降低分辨率
- 使用更高效的编码器
- 关闭不必要的应用程序

#### 5. 浏览器不支持
**原因**: 浏览器版本过旧或设置问题
**解决**:
- 更新到最新版本浏览器
- 启用硬件加速设置
- 检查WebRTC支持
- 尝试不同浏览器

## 🎯 最佳实践

### 1. 监考环境优化
- **网络**: 使用千兆有线网络
- **硬件**: 使用支持硬件编码的GPU
- **系统**: 关闭不必要的后台程序
- **浏览器**: 使用最新版本Chrome/Edge

### 2. 质量平衡策略
- **优先保证清晰度**: 分辨率 > 码率 > 帧率
- **网络自适应**: 根据网络情况动态调整
- **用户体验**: 提供质量设置选项
- **性能监控**: 实时监控质量指标

### 3. 用户体验优化
- **质量指示器**: 显示当前视频质量
- **全屏支持**: 支持点击全屏查看
- **设置面板**: 提供质量调整选项
- **错误提示**: 友好的错误信息

## 📈 测试建议

### 1. 质量测试
- 在不同分辨率下测试清晰度
- 在不同网络环境下测试稳定性
- 长时间运行测试性能稳定性
- 多用户并发测试服务器性能

### 2. 性能测试
- 监控CPU和GPU使用率
- 测试内存使用情况
- 监控网络带宽使用
- 测试编码延迟

### 3. 兼容性测试
- 测试不同浏览器兼容性
- 测试不同操作系统
- 测试不同硬件配置
- 测试移动设备支持

## 🎉 预期效果

通过以上超高清优化，你应该能够看到：

1. **分辨率提升**: 从1080p提升到1440p/4K
2. **清晰度提升**: 文字和图像更加清晰锐利
3. **流畅度提升**: 60fps提供更流畅的体验
4. **细节提升**: 能够看清更多细节内容
5. **全屏效果**: 全屏时保持高质量显示

如果仍然不够清晰，可能需要：
- 检查网络带宽是否足够
- 确认硬件是否支持硬件编码
- 考虑使用专业的视频会议解决方案
- 或者使用本地录制后传输的方案 