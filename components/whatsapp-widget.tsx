"use client"

import { MessageCircle, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-4 w-80 rounded-lg bg-white shadow-2xl">
          <div className="flex items-center justify-between rounded-t-lg bg-green-600 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20" />
              <div>
                <p className="font-semibold">MCS Consulting</p>
                <p className="text-xs">Typically replies in a few hours</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4">
            <div className="mb-4 rounded-lg bg-gray-100 p-3">
              <p className="text-sm">Selamat datang di MCS Consulting!</p>
            </div>
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => window.open("https://wa.me/6287877967799", "_blank")}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Start Chat
            </Button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition-transform hover:scale-110"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  )
}
