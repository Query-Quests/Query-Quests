"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Send, Bot, User, Loader2, X, Copy, Check } from "lucide-react"
import { useState } from "react"
import { MessageList } from "./message-list"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const ChatContainer = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col items-center gap-2 p-4",
      className
    )}
    {...props}
  />
))
ChatContainer.displayName = "ChatContainer"

const ChatMessages = React.forwardRef(({ className, ...props }, ref) => (
  <ScrollArea
    ref={ref}
    className={cn("flex-1 w-full", className)}
    {...props}
  />
))
ChatMessages.displayName = "ChatMessages"

const ChatForm = React.forwardRef(({ className, isPending, handleSubmit, children, ...props }, ref) => (
  <form
    ref={ref}
    onSubmit={handleSubmit}
    className={cn("flex w-full items-end gap-2 p-3", className)}
    {...props}
  >
    {children}
  </form>
))
ChatForm.displayName = "ChatForm"

const MessageInput = React.forwardRef(({ 
  className, 
  value, 
  onChange, 
  placeholder = "Ask Query Quest Assistant...", 
  disabled = false, 
  stop, 
  isGenerating = false,
  ...props 
}, ref) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && value.trim()) {
        const form = e.target.closest("form")
        if (form) {
          form.requestSubmit()
        }
      }
    }
  }

  return (
    <div className="relative flex-1">
      <Textarea
        ref={ref}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "min-h-[40px] max-h-[120px] w-full resize-none pr-12 py-[9px] leading-[22px]",
          className
        )}
        {...props}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
        {isGenerating && stop && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={stop}
            className="h-7 w-7"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        <Button
          type="submit"
          size="icon"
          disabled={disabled || !value.trim()}
          className="h-7 w-7"
        >
          <Send className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
})
MessageInput.displayName = "MessageInput"

// MessageList is now imported from the dedicated component

const ChatMessage = ({ message, showTimeStamps = true, className, ...props }) => {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === "user"

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return null
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div 
      className={cn(
        `group flex items-start space-x-2 ${isUser ? "flex-row-reverse space-x-reverse" : ""}`,
        className
      )}
      {...props}
    >
      <div className={`flex-1 space-y-2 ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block rounded-lg px-3 py-2 text-sm max-w-[80%] ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-pre:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                code: ({ node, inline, className, children, ...props }) => {
                  return inline ? (
                    <code 
                      className="bg-muted-foreground/20 px-1 py-0.5 rounded text-xs font-mono" 
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <pre className="bg-muted-foreground/10 p-3 rounded-md overflow-x-auto">
                      <code className="text-xs font-mono" {...props}>
                        {children}
                      </code>
                    </pre>
                  )
                },
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-sm">{children}</li>,
                h1: ({ children }) => <h1 className="text-lg font-semibold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mb-2">{children}</h3>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-muted-foreground/30 pl-3 italic mb-2">
                    {children}
                  </blockquote>
                ),
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
              }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <div className={`flex items-center gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
          {showTimeStamps && message.timestamp && (
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(message.timestamp)}
            </span>
          )}
          {!isUser && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

const PromptSuggestions = ({ suggestions = [], append }) => {
  if (!suggestions.length) return null

  return (
    <div className="grid gap-2">
      <p className="text-sm text-muted-foreground">Try these prompts:</p>
      <div className="grid gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            className="justify-start text-left h-auto p-3"
            onClick={() => append({ role: "user", content: suggestion })}
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  )
}

const Chat = ({ 
  messages, 
  input, 
  handleInputChange, 
  handleSubmit, 
  isGenerating, 
  stop, 
  append, 
  suggestions = [], 
  className,
  ...props 
}) => {
  const lastMessage = messages.at(-1)
  const isEmpty = messages.length === 0
  const isTyping = lastMessage?.role === "user"

  return (
    <ChatContainer className={className} {...props}>
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Bot className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Welcome to Query Quest Assistant</h3>
            <p className="text-sm text-muted-foreground">
              I&apos;m here to help you with SQL queries, database concepts, and your learning journey. Ask me anything!
            </p>
          </div>
          {suggestions.length > 0 && (
            <PromptSuggestions suggestions={suggestions} append={append} />
          )}
        </div>
      ) : (
        <ChatMessages>
          <MessageList messages={messages} isTyping={isTyping} />
        </ChatMessages>
      )}
      
      <ChatForm
        isPending={isGenerating}
        handleSubmit={handleSubmit}
        className="mt-auto"
      >
        <MessageInput
          value={input}
          onChange={handleInputChange}
          isGenerating={isGenerating}
          stop={stop}
        />
      </ChatForm>
    </ChatContainer>
  )
}

export {
  Chat,
  ChatContainer,
  ChatMessages,
  ChatForm,
  MessageInput,
  ChatMessage,
  PromptSuggestions,
}
