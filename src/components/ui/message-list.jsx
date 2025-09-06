"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChatMessage } from "./chat"

const MessageList = React.forwardRef(({ 
  className, 
  messages = [], 
  showTimeStamps = true, 
  isTyping = false, 
  messageOptions = {},
  ...props 
}, ref) => {
  const getMessageOptions = (message) => {
    if (typeof messageOptions === "function") {
      return messageOptions(message)
    }
    return messageOptions
  }

  return (
    <div
      ref={ref}
      className={cn("space-y-4", className)}
      {...props}
    >
      {messages.map((message, index) => {
        const options = getMessageOptions(message)
        return (
          <ChatMessage
            key={message.id || index}
            message={message}
            showTimeStamps={showTimeStamps}
            {...options}
          />
        )
      })}
      {isTyping && (
        <div className="flex items-start space-x-2">
          <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background shadow">
            <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="flex items-center space-x-2 bg-muted rounded-lg px-3 py-2">
            <div className="flex space-x-1">
              <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
            </div>
            <span className="text-sm text-muted-foreground">Typing...</span>
          </div>
        </div>
      )}
    </div>
  )
})
MessageList.displayName = "MessageList"

export { MessageList }
