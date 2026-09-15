/**
 * Screen & Document Awareness Service
 * Handles on-demand screen frame capture via getDisplayMedia, canvas compression, and file-drop ingestion.
 */

import { telemetry } from './telemetryLogger';

export interface CapturedFrame {
  id: string;
  dataUrl: string; // base64 data:image/jpeg;base64,...
  width: number;
  height: number;
  timestamp: number;
}

export class ScreenCaptureService {
  private lastCapturedFrame: CapturedFrame | null = null;

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 
           typeof navigator.mediaDevices !== 'undefined' && 
           typeof navigator.mediaDevices.getDisplayMedia === 'function';
  }

  /**
   * Captures a single snapshot of user-selected screen/window and releases media stream immediately.
   */
  public async captureScreenSnapshot(maxWidth = 1280, quality = 0.75): Promise<CapturedFrame | null> {
    if (!this.isSupported()) {
      telemetry.log('error', { source: 'ScreenCapture', message: 'getDisplayMedia not supported in this browser' });
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as any,
        audio: false
      });

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        stream.getTracks().forEach(t => t.stop());
        return null;
      }

      // Create video element to grab frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();

      // Draw to offscreen canvas
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, maxWidth / (video.videoWidth || maxWidth));
      canvas.width = Math.round((video.videoWidth || 1280) * scale);
      canvas.height = Math.round((video.videoHeight || 720) * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        stream.getTracks().forEach(t => t.stop());
        return null;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);

      // Stop all tracks immediately to release permission banner
      stream.getTracks().forEach(t => t.stop());
      video.srcObject = null;

      const frame: CapturedFrame = {
        id: 'frame-' + Date.now(),
        dataUrl,
        width: canvas.width,
        height: canvas.height,
        timestamp: Date.now()
      };

      this.lastCapturedFrame = frame;
      telemetry.log('event', { action: 'screen_snapshot_captured', width: frame.width, height: frame.height });
      return frame;
    } catch (err) {
      telemetry.log('error', { source: 'ScreenCapture', message: String(err) });
      return null;
    }
  }

  /**
   * Converts a dropped/selected image or PDF file into a compressed image data URL
   */
  public async processImageFile(file: File, maxWidth = 1280): Promise<CapturedFrame | null> {
    if (!file.type.startsWith('image/')) return null;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = Math.min(1, maxWidth / img.width);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);

          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

          const frame: CapturedFrame = {
            id: 'file-' + Date.now(),
            dataUrl,
            width: canvas.width,
            height: canvas.height,
            timestamp: Date.now()
          };

          this.lastCapturedFrame = frame;
          resolve(frame);
        };
        img.onerror = () => resolve(null);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  public getLastFrame(): CapturedFrame | null {
    return this.lastCapturedFrame;
  }

  public clear(): void {
    this.lastCapturedFrame = null;
  }
}

export const screenCaptureService = new ScreenCaptureService();
