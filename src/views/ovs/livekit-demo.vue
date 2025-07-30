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
import { Room } from 'livekit-client';

const role = ref('student');
const roomId = ref('');
const sid = ref('');
const joined = ref(false);
const remoteStreams = reactive([]);
let room = null;

// 自动订阅并渲染所有远端 video track
function setupRoomEvents(room) {
  // 监听 trackSubscribed 事件
  room.on('trackSubscribed', (track, publication, participant) => {
    console.log('【老师端】trackSubscribed', participant.identity, track);
    console.log('【老师端】trackSubscribed - participant.isLocal:', participant.isLocal);
    console.log('【老师端】trackSubscribed - track.kind:', track.kind);
    
    if (track.kind === 'video') {
      let exists = remoteStreams.find(item => item.id === participant.identity);
      if (!exists) {
        console.log('【老师端】Creating new stream for participant:', participant.identity);
        const newStream = new MediaStream([track.mediaStreamTrack]);
        remoteStreams.push({ id: participant.identity, stream: newStream });
        setTimeout(() => {
          let v = document.getElementById(participant.identity);
          if (v) {
            v.srcObject = newStream;
            console.log('【老师端】Set srcObject for video element:', participant.identity);
          } else {
            console.log('【老师端】Video element not found for:', participant.identity);
          }
        }, 0);
      } else {
        console.log('【老师端】Stream already exists for participant:', participant.identity);
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
    subscribeToParticipantTracks(participant);
  });

  // 监听 participantDisconnected
  room.on('participantDisconnected', (participant) => {
    console.log('【老师端】participantDisconnected', participant.identity);
    const idx = remoteStreams.findIndex(item => item.id === participant.identity);
    if (idx !== -1) remoteStreams.splice(idx, 1);
  });
}

// 订阅参与者的所有 tracks
function subscribeToParticipantTracks(participant) {
  console.log('【老师端】subscribeToParticipantTracks for', participant.identity);
  console.log('【老师端】participant.isLocal:', participant.isLocal);
  
  // 直接使用 videoTrackPublications Map
  const videoPublications = participant.videoTrackPublications;
  console.log('【老师端】videoPublications:', videoPublications);
  
  if (videoPublications && videoPublications.size > 0) {
    videoPublications.forEach((publication) => {
      console.log('【老师端】processing video publication:', publication);
      console.log('【老师端】publication.isSubscribed:', publication.isSubscribed);
      console.log('【老师端】publication.track:', publication.track);
      
      if (!publication.isSubscribed) {
        console.log('【老师端】Subscribing to publication...');
        publication.subscribe();
      } else if (publication.track) {
        console.log('【老师端】Publication already subscribed, rendering track...');
        // 如果已经订阅了，直接渲染
        let exists = remoteStreams.find(item => item.id === participant.identity);
        if (!exists) {
          const newStream = new MediaStream([publication.track.mediaStreamTrack]);
          remoteStreams.push({ id: participant.identity, stream: newStream });
          setTimeout(() => {
            let v = document.getElementById(participant.identity);
            if (v) v.srcObject = newStream;
          }, 0);
        }
      }
    });
  } else {
    console.log('【老师端】No video publications found for', participant.identity);
  }
}

const joinRoom = async () => {
  if (joined.value) return;
  
  try {
    // 1. 获取 Token
    const resp = await fetch(`http://172.18.10.207:3000/api/livekit/token?room=${roomId.value}&identity=${sid.value}`);
    const { token: livekitToken } = await resp.json();

    // 2. 创建 Room 实例并连接
    room = new Room();
    await room.connect(`ws://47.120.36.189:7880`, livekitToken);
    console.log('【通用】Connected to room:', room.name);

    if (role.value === 'student') {
      // 学生端：屏幕共享
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true, 
          audio: false 
        });
        console.log('【学生端】getDisplayMedia success:', stream);
        
        const [track] = stream.getVideoTracks();
        await room.localParticipant.publishTrack(track, { name: 'screen' });
        console.log('【学生端】publishTrack success');
        
        document.getElementById('localVideo').srcObject = stream;
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
        console.log('【老师端】Current user identity:', room.localParticipant.identity);
        room.remoteParticipants.forEach((participant) => {
          console.log('【老师端】Existing participant:', participant.identity);
          console.log('【老师端】Participant isLocal:', participant.isLocal);
          console.log('【老师端】Participant videoTrackPublications:', participant.videoTrackPublications);
          subscribeToParticipantTracks(participant);
        });
      } else {
        console.log('【老师端】No existing participants');
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
</style>
