"use client"

import { useRef, useState, useCallback } from "react"
import { Play, Pause, Maximize, Volume2, VolumeX } from "lucide-react"

interface DemoVideoProps {
  className?: string
}

export function DemoVideo({ className }: DemoVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [ended, setEnded] = useState(false)

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (ended) {
      video.currentTime = 0
      setEnded(false)
    }
    if (video.paused) {
      video.play()
      setPlaying(true)
    } else {
      video.pause()
      setPlaying(false)
    }
  }, [ended])

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    setCurrentTime(video.currentTime)
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    setDuration(video.duration)
  }, [])

  const handleEnded = useCallback(() => {
    setPlaying(false)
    setEnded(true)
  }, [])

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current
      const bar = progressRef.current
      if (!video || !bar) return
      const rect = bar.getBoundingClientRect()
      const pos = (e.clientX - rect.left) / rect.width
      video.currentTime = pos * duration
    },
    [duration],
  )

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }, [])

  const handleFullscreen = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      video.requestFullscreen()
    }
  }, [])

  function formatTime(t: number) {
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-primary/20 bg-background ${className || ""} aspect-auto p-4`}
    >
      <video
        ref={videoRef}
        src="/demo.mp4"
        className="h-full w-full object-contain border rounded-md"
        preload="metadata"
        playsInline
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {!playing && !ended && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/30"
          aria-label="Play"
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full opacity-90 transition-transform hover:scale-105"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <Play className="h-7 w-7 text-white ml-0.5" fill="white" />
          </div>
        </button>
      )}

      {ended && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40"
          aria-label="Replay"
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full opacity-90 transition-transform hover:scale-105"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <Play className="h-7 w-7 text-white ml-0.5" fill="white" />
          </div>
        </button>
      )}

      <div
        className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-4 opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          background: "linear-gradient(transparent, rgba(0,0,0,0.75))",
        }}
      >
        <button
          onClick={togglePlay}
          className="shrink-0 text-white hover:text-white/80"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause className="h-4 w-4" fill="white" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" fill="white" />
          )}
        </button>

        <div
          ref={progressRef}
          className="relative flex-1 h-1 cursor-pointer rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.3)" }}
          onClick={handleProgressClick}
        >
          <div
            className="h-full rounded-full transition-[width] duration-100"
            style={{
              width: `${duration ? (currentTime / duration) * 100 : 0}%`,
              backgroundColor: "var(--primary)",
            }}
          />
        </div>

        <span className="shrink-0 text-xs text-white/80 tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <button
          onClick={toggleMute}
          className="shrink-0 text-white hover:text-white/80"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>

        <button
          onClick={handleFullscreen}
          className="shrink-0 text-white hover:text-white/80"
          aria-label="Fullscreen"
        >
          <Maximize className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
