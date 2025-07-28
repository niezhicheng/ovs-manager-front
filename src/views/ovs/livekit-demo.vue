<template>
  <div style="padding: 24px">
    <h2>LiveKit WebRTC Demo</h2>
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
    <div v-if="role === 'student'">
      <video id="localVideo" autoplay muted playsinline style="width: 320px; border: 1px solid #ccc;" v-show="joined"></video>
    </div>
    <div v-if="role === 'teacher'">
      <div v-if="joined">
        <h3>学生画面：</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
          <video v-for="item in remoteStreams" :key="item.id" :id="item.id" autoplay playsinline style="width: 240px; border: 1px solid #ccc;" ref="remoteVideos"></video>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { Room, createLocalVideoTrack } from 'livekit-client';

const role = ref('student');
const roomId = ref('');
const sid = ref('');
const joined = ref(false);
const remoteStreams = reactive([]);
const remoteVideos = ref([]);
let room = null;

const joinRoom = async () => {
  if (joined.value) return;
  // 1. 自动请求后端获取 Token
  const resp = await fetch(`http://172.18.10.207:3000/api/livekit/token?room=${roomId.value}&identity=${sid.value}`);
  const { token: livekitToken } = await resp.json();

  // 2. 创建 Room 实例并连接
  room = new Room();
  await room.connect(`ws://47.120.36.189:7880`, livekitToken);

  if (role.value === 'student') {
    // 屏幕共享
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    const [track] = stream.getVideoTracks();
    await room.localParticipant.publishTrack(track, { name: 'screen' });
    document.getElementById('localVideo').srcObject = stream;
  } else if (role.value === 'teacher') {
    room.on('trackSubscribed', (track, publication, participant) => {
      if (track.kind === 'video') {
        // 检查是否已存在该流的 video
        let exists = remoteStreams.find(item => item.id === participant.identity);
        if (!exists) {
          const newStream = new MediaStream([track.mediaStreamTrack]);
          remoteStreams.push({ id: participant.identity, stream: newStream });
          // 等 DOM 渲染后再赋值
          setTimeout(() => {
            let v = document.getElementById(participant.identity);
            if (v) v.srcObject = newStream;
          }, 0);
        }
      }
    });
  }
  joined.value = true;
};
</script>

<style scoped>
</style>
