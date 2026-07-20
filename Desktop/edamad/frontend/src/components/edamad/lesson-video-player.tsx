"use client";

import { useEffect, useRef, useState } from "react";
import {
  Captions,
  Maximize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  Settings,
  Volume2,
} from "lucide-react";

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function LessonVideoPlayer({
  videoUrl,
  posterUrl,
  initialSeconds = 0,
  durationSeconds,
}: {
  videoUrl: string | null;
  posterUrl?: string | null;
  initialSeconds?: number;
  durationSeconds: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialSeconds);
  const [loadedDuration, setLoadedDuration] = useState(durationSeconds);

  const displayDuration = loadedDuration > 0 ? loadedDuration : durationSeconds;
  const progressPct =
    displayDuration > 0 ? Math.min(100, (currentTime / displayDuration) * 100) : 0;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    const seekTo = Math.min(initialSeconds, video.duration || initialSeconds);
    if (Number.isFinite(seekTo) && seekTo > 0) {
      video.currentTime = seekTo;
    }
    setCurrentTime(seekTo);
  }, [videoUrl, initialSeconds]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  }

  function seekBy(seconds: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
  }

  function handleFullscreen() {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
      void video.requestFullscreen();
    }
  }

  if (!videoUrl) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-[#0f172a] px-6 text-center">
        <p className="text-[14px] text-white/80">
          No video has been uploaded for this lesson yet. Check back after your instructor publishes
          the content.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-[#001E5A] shadow-sm">
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl ?? undefined}
          className="h-full w-full object-contain"
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d) && d > 0) setLoadedDuration(Math.floor(d));
          }}
          onClick={togglePlay}
        />
        {!playing && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/30"
            aria-label="Play video"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Play className="ml-1 h-7 w-7 fill-white text-white" />
            </span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 bg-[#0f172a]/95 px-3 py-2.5 text-white sm:gap-3 sm:px-4">
        <button type="button" onClick={togglePlay} className="shrink-0 hover:text-[#0057FF]">
          {playing ? <Pause className="h-[18px] w-[18px]" /> : <Play className="h-[18px] w-[18px] fill-white" />}
        </button>
        <button
          type="button"
          onClick={() => seekBy(-10)}
          className="hidden shrink-0 hover:text-[#0057FF] sm:block"
          aria-label="Rewind 10 seconds"
        >
          <RotateCcw className="h-[16px] w-[16px]" />
        </button>
        <button type="button" className="hidden shrink-0 hover:text-[#0057FF] sm:block" aria-label="Volume">
          <Volume2 className="h-[18px] w-[18px]" />
        </button>
        <span className="shrink-0 text-[11px] tabular-nums text-white/90 sm:text-xs">
          {formatDuration(currentTime)} / {formatDuration(displayDuration)}
        </span>
        <div className="mx-1 h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-[#0057FF] transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <button type="button" className="hidden shrink-0 hover:text-[#0057FF] sm:block" aria-label="Captions">
          <Captions className="h-[16px] w-[16px]" />
        </button>
        <button type="button" className="hidden shrink-0 hover:text-[#0057FF] md:block" aria-label="Settings">
          <Settings className="h-[16px] w-[16px]" />
        </button>
        <button type="button" className="hidden shrink-0 hover:text-[#0057FF] md:block" aria-label="Picture in picture">
          <PictureInPicture2 className="h-[16px] w-[16px]" />
        </button>
        <button type="button" onClick={handleFullscreen} className="shrink-0 hover:text-[#0057FF]" aria-label="Fullscreen">
          <Maximize className="h-[16px] w-[16px]" />
        </button>
      </div>
    </div>
  );
}
