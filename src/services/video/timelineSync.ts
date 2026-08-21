export class VideoTimelineSyncService {
  /**
   * Directly maps normalized progress [0.0, 1.0] to video element currentTime.
   * Ensures video is paused so it never autoplays linearly while controlled by gestures or scrubbers.
   */
  public syncProgressToVideo(
    video: HTMLVideoElement | null,
    progress: number,
    durationOverride: number = 10
  ): { currentTime: number; duration: number } {
    if (!video) {
      return { currentTime: progress * durationOverride, duration: durationOverride };
    }

    if (!video.paused) {
      video.pause();
    }

    const duration = video.duration && !isNaN(video.duration) && video.duration > 0
      ? video.duration
      : durationOverride;

    const clampedProgress = Math.max(0, Math.min(1, progress));
    const targetTime = clampedProgress * duration;

    // Direct seeking with small delta tolerance to avoid redundant seeks
    if (Math.abs(video.currentTime - targetTime) > 0.015) {
      video.currentTime = targetTime;
    }

    return {
      currentTime: video.currentTime,
      duration
    };
  }
}

export const videoSyncService = new VideoTimelineSyncService();
