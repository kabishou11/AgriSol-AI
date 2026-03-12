<template>
  <div class="voice-recorder">
    <div class="recorder-container">
      <div class="waveform" v-if="isRecording">
        <div
          v-for="i in 20"
          :key="i"
          class="wave-bar"
          :style="{ height: waveHeights[i] + '%' }"
        ></div>
      </div>

      <button
        class="record-button"
        :class="{ recording: isRecording }"
        @click="toggleRecording"
      >
        <icon-voice v-if="!isRecording" :size="48" />
        <icon-stop v-else :size="48" />
      </button>

      <div class="timer" v-if="isRecording || duration > 0">
        {{ formatTime(duration) }}
      </div>
    </div>

    <div class="controls" v-if="audioBlob && !isRecording">
      <a-space size="large">
        <a-button @click="playAudio" :type="isPlaying ? 'primary' : 'default'">
          <template #icon>
            <icon-play-arrow v-if="!isPlaying" />
            <icon-pause v-else />
          </template>
          {{ isPlaying ? '暂停' : '播放' }}
        </a-button>

        <a-button type="primary" @click="saveRecording">
          <template #icon><icon-check /></template>
          保存
        </a-button>

        <a-button @click="cancelRecording">
          <template #icon><icon-close /></template>
          取消
        </a-button>
      </a-space>
    </div>

    <audio ref="audioPlayer" @ended="isPlaying = false"></audio>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import {
  IconVoice,
  IconStop,
  IconPlayArrow,
  IconPause,
  IconCheck,
  IconClose
} from '@arco-design/web-vue/es/icon'

const emit = defineEmits(['save', 'cancel'])

const isRecording = ref(false)
const isPlaying = ref(false)
const duration = ref(0)
const audioBlob = ref(null)
const audioPlayer = ref(null)
const waveHeights = ref(Array(20).fill(20))

let mediaRecorder = null
let audioChunks = []
let timerInterval = null
let waveInterval = null

const toggleRecording = async () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    await startRecording()
  }
}

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    audioChunks = []

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data)
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' })
      audioBlob.value = blob
      stream.getTracks().forEach(track => track.stop())
    }

    mediaRecorder.start()
    isRecording.value = true
    duration.value = 0

    timerInterval = setInterval(() => {
      duration.value++
    }, 1000)

    waveInterval = setInterval(() => {
      waveHeights.value = waveHeights.value.map(() => Math.random() * 80 + 20)
    }, 100)
  } catch (error) {
    console.error('Failed to start recording:', error)
    alert('无法访问麦克风，请检查权限设置')
  }
}

const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
    isRecording.value = false
    clearInterval(timerInterval)
    clearInterval(waveInterval)
    waveHeights.value = Array(20).fill(20)
  }
}

const playAudio = () => {
  if (!audioPlayer.value || !audioBlob.value) return

  if (isPlaying.value) {
    audioPlayer.value.pause()
    isPlaying.value = false
  } else {
    audioPlayer.value.src = URL.createObjectURL(audioBlob.value)
    audioPlayer.value.play()
    isPlaying.value = true
  }
}

const saveRecording = () => {
  emit('save', {
    blob: audioBlob.value,
    duration: duration.value
  })
  resetRecorder()
}

const cancelRecording = () => {
  emit('cancel')
  resetRecorder()
}

const resetRecorder = () => {
  audioBlob.value = null
  duration.value = 0
  isPlaying.value = false
  if (audioPlayer.value) {
    audioPlayer.value.src = ''
  }
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

onUnmounted(() => {
  if (isRecording.value) {
    stopRecording()
  }
  clearInterval(timerInterval)
  clearInterval(waveInterval)
})
</script>

<style scoped>
.voice-recorder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 32px;
}

.recorder-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.waveform {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 80px;
  width: 300px;
}

.wave-bar {
  width: 8px;
  background: linear-gradient(180deg, #165dff 0%, #4080ff 100%);
  border-radius: 4px;
  transition: height 0.1s ease;
}

.record-button {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #165dff 0%, #4080ff 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(22, 93, 255, 0.3);
  transition: all 0.3s ease;
}

.record-button:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 32px rgba(22, 93, 255, 0.4);
}

.record-button:active {
  transform: scale(0.95);
}

.record-button.recording {
  background: linear-gradient(135deg, #f53f3f 0%, #f76560 100%);
  box-shadow: 0 8px 24px rgba(245, 63, 63, 0.3);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.timer {
  font-size: 32px;
  font-weight: 600;
  color: #1d2129;
  font-variant-numeric: tabular-nums;
}

.controls {
  margin-top: 16px;
}
</style>
