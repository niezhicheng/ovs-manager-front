# LiveKit 高清监考优化指南

## 问题分析

LiveKit画面模糊的主要原因：

1. **默认视频质量设置较低** - 通常使用720p或更低分辨率
2. **码率限制** - 默认码率不足以支持高清画面
3. **编码参数未优化** - 未针对监考场景进行优化
4. **网络自适应过于激进** - 在网络波动时过度降低质量

## 解决方案

### 1. 客户端优化 (已完成)

#### 主要改进：
- ✅ **高清分辨率设置** - 强制1920x1080分辨率
- ✅ **高码率配置** - 设置2-4Mbps码率
- ✅ **多流编码** - 启用Simulcast支持多种质量
- ✅ **硬件加速** - 启用GPU编码
- ✅ **全屏优化** - 支持点击全屏查看

#### 关键配置：
```javascript
// 屏幕共享高清设置
const stream = await navigator.mediaDevices.getDisplayMedia({ 
  video: {
    width: { ideal: 1920, max: 3840 },
    height: { ideal: 1080, max: 2160 },
    frameRate: { ideal: 30, max: 60 }
  }
});

// 视频轨道约束
await track.applyConstraints({
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  frameRate: { ideal: 30, max: 60 }
});

// 发布高质量参数
await room.localParticipant.publishTrack(track, { 
  simulcast: true,
  videoEncoding: {
    maxBitrate: 2_000_000, // 2Mbps
    maxFramerate: 30,
    priority: 'high'
  }
});
```

### 2. 服务器端优化

#### 使用高清配置文件：
```bash
# 使用优化后的配置文件启动LiveKit
livekit-server --config livekit-high-quality-config.yaml
```

#### 关键服务器配置：
```yaml
rtc:
  video:
    max_resolution: "1080p"
    max_framerate: 30
    max_bitrate: 4000000  # 4Mbps
    
  network:
    adaptive_stream: true
    simulcast: true
    dynacast: true
```

### 3. 网络优化建议

#### 带宽要求：
- **最低带宽**: 5Mbps 上行/下行
- **推荐带宽**: 10Mbps 上行/下行
- **理想带宽**: 20Mbps+ 上行/下行

#### 网络质量检测：
```javascript
// 监控网络质量
room.on('connectionQualityChanged', (quality, participant) => {
  console.log('网络质量:', quality);
  // quality: excellent, good, poor, unknown
});
```

### 4. 浏览器优化

#### 推荐的浏览器设置：
1. **Chrome/Edge**: 启用硬件加速
2. **Firefox**: 启用WebRTC硬件加速
3. **Safari**: 确保使用最新版本

#### 浏览器检查：
```javascript
// 检查硬件编码支持
const capabilities = RTCRtpSender.getCapabilities('video');
console.log('支持的编码:', capabilities.codecs);

// 检查屏幕共享支持
const displayMedia = navigator.mediaDevices.getDisplayMedia;
if (!displayMedia) {
  alert('浏览器不支持屏幕共享');
}
```

## 使用方法

### 1. 启动优化后的LiveKit服务器
```bash
# 使用Docker启动
docker run -p 7880:7880 -p 7881:7881 -p 7882-8000:7882-8000/udp \
  -v $(pwd)/livekit-high-quality-config.yaml:/config.yaml \
  livekit/livekit-server --config /config.yaml
```

### 2. 使用优化后的前端代码
- 打开 `src/views/ovs/livekit-demo.vue`
- 确保所有质量选项都已启用
- 测试高清屏幕共享

### 3. 监控视频质量
```javascript
// 在浏览器控制台查看视频质量信息
room.on('trackSubscribed', (track, publication, participant) => {
  if (track.kind === 'video') {
    const settings = track.mediaStreamTrack.getSettings();
    console.log('视频设置:', settings);
    // 检查分辨率、帧率、码率等
  }
});
```

## 性能监控

### 1. 客户端监控
- 网络质量指标
- 视频分辨率变化
- 帧率稳定性
- 码率波动

### 2. 服务器监控
- CPU使用率
- 内存使用情况
- 网络带宽使用
- 连接数统计

## 故障排除

### 常见问题：

1. **画面仍然模糊**
   - 检查网络带宽是否足够
   - 确认硬件编码是否启用
   - 验证分辨率设置是否生效

2. **全屏时画面变形**
   - 使用 `object-fit: contain` 保持比例
   - 检查视频容器的CSS设置

3. **网络卡顿**
   - 降低目标分辨率到720p
   - 减少码率到1Mbps
   - 检查网络连接质量

4. **CPU使用率过高**
   - 启用硬件加速
   - 降低帧率到15fps
   - 使用更高效的编码器

## 最佳实践

### 1. 监考环境设置
- 使用有线网络连接
- 关闭不必要的应用程序
- 确保足够的系统资源

### 2. 质量平衡
- 根据网络情况动态调整
- 优先保证画面清晰度
- 适当降低帧率以节省带宽

### 3. 用户体验
- 提供质量设置选项
- 显示网络质量指示器
- 支持全屏查看功能

## 测试建议

### 1. 质量测试
- 在不同网络环境下测试
- 验证全屏时的清晰度
- 检查长时间运行的稳定性

### 2. 性能测试
- 监控CPU和内存使用
- 测试多用户并发场景
- 验证网络带宽使用情况

### 3. 兼容性测试
- 测试不同浏览器
- 验证不同操作系统
- 检查移动设备支持

通过以上优化，LiveKit应该能够提供足够清晰的高清画面用于监考场景。如果仍有问题，可以进一步调整参数或考虑使用其他视频服务。 