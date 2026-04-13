export class AudioRecorder {
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private onDataCallback: ((audioBlob: Blob) => void) | null = null;

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.getSupportedMimeType(),
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
        if (this.onDataCallback) {
          this.onDataCallback(audioBlob);
        }
      };

      this.mediaRecorder.start();
      console.log("Recording started");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      throw error;
    }
  }

  private getSupportedMimeType(): string {
    const mimeTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }
    return "audio/webm";
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("No recording in progress"));
        return;
      }

      this.onDataCallback = resolve;
      this.mediaRecorder.stop();

      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop());
        this.stream = null;
      }

      console.log("Recording stopped");
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }
}

export const loadAudioAsArrayBuffer = async (blob: Blob): Promise<Float32Array> => {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext({ sampleRate: 16000 });
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Copy channel data so closing the context doesn't clear the buffer in some browsers
  const channelData = audioBuffer.getChannelData(0);
  const audioData = new Float32Array(channelData.length);
  audioData.set(channelData);

  const peak = channelData.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);
  console.log(
    "Audio stats",
    JSON.stringify({ sampleRate: audioBuffer.sampleRate, duration: audioBuffer.duration, peakAmplitude: peak })
  );

  await audioContext.close();
  return audioData;
};
