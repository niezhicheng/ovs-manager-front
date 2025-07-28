<template>
  <div style="padding: 24px">
    <h2>ion-sfu WebRTC Demo</h2>
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
          <video v-for="stream in remoteStreams" :key="stream.id" :id="stream.id" autoplay playsinline style="width: 240px; border: 1px solid #ccc;"></video>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import IonSFUJSONRPCSignal from 'ion-sdk-js/lib/signal/ion-sfu';
import Client from 'ion-sdk-js/lib/client';
import { LocalStream } from 'ion-sdk-js/lib/stream';

const role = ref('student');
const roomId = ref('exam-room-1');
const sid = ref('');
const joined = ref(false);
const remoteStreams = reactive([]);
let client = null;
let signal = null;

const joinRoom = async () => {
  if (joined.value) return;
  signal = new IonSFUJSONRPCSignal('ws://47.120.36.189:7000/ws');
  client = new Client(signal);

  signal.onopen = async () => {
    if (role.value === 'student') {
      // 获取屏幕画面
      const rawStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const stream = new LocalStream(rawStream, {
        codec: 'vp8',
        resolution: 'hd',
        audio: false,
        video: true,
        simulcast: false
      });
      client.join(roomId.value, sid.value);
      client.publish(stream);
      document.getElementById('localVideo').srcObject = rawStream;
    } else if (role.value === 'teacher') {
      client.join(roomId.value, sid.value);
      client.ontrack = (track, stream) => {
        // 检查是否已存在该流的 video
        let video = document.getElementById(stream.id);
        if (!video) {
          remoteStreams.push(stream);
          // 等 DOM 渲染后再赋值
          setTimeout(() => {
            let v = document.getElementById(stream.id);
            if (v) v.srcObject = stream;
          }, 0);
        }
      };
    }
    joined.value = true;
  };
};
</script>

<style scoped>
</style>
