"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ParsedData {
  customerName?: string
  customerPhone?: string
  items: Array<{ name: string; quantity: number; price: number }>
  services: Array<{ name: string; price: number }>
  labourCharges?: number
  discount?: number
  notes?: string
}

interface VoiceRecorderProps {
  onResult: (transcript: string, parsed: ParsedData) => void
  onInterimTranscript?: (text: string) => void
  disabled?: boolean
}

export function VoiceRecorder({
  onResult,
  onInterimTranscript,
  disabled,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType,
        })

        setIsProcessing(true)
        try {
          const formData = new FormData()
          formData.append("audio", blob, "recording.webm")

          const res = await fetch("/api/voice/parse", {
            method: "POST",
            body: formData,
          })

          if (!res.ok) throw new Error("Failed to process audio")

          const data = await res.json()
          onResult(data.transcript, data.parsed)
        } catch (err) {
          console.error("Transcription error:", err)
          toast.error("Something went wrong. Please try again.")
        } finally {
          setIsProcessing(false)
        }

        stream.getTracks().forEach((t) => t.stop())
      }

      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition

      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = "en-US"

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interim = ""
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const text = event.results[i][0].transcript
            interim += text
          }
          onInterimTranscript?.(interim)
        }

        recognition.start()
        recognitionRef.current = recognition
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error("Microphone access error:", err)
    }
  }, [onResult, onInterimTranscript])

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Button
          size="lg"
          variant={isRecording ? "destructive" : "default"}
          className="h-20 w-20 rounded-full shadow-lg transition-all"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : isRecording ? (
            <Square className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {isProcessing
          ? "Processing your voice..."
          : isRecording
            ? "Tap to stop recording"
            : "Tap to start speaking"}
      </p>
    </div>
  )
}
