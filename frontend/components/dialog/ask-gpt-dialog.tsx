"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Copy, X, Check } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogHeader } from "../ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "../ui/textarea";
import api from "@/lib/api";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AskGPTDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Code highlighting component
const CodeBlock = ({ children, language = "" }: { children: string; language?: string }) => {
  const [copied, setCopied] = useState(false);
  
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between bg-gradient-to-r from-slate-100 to-gray-100 border border-gray-200 text-gray-700 px-4 py-2 text-xs rounded-t-md">
        <span className="text-gray-600 font-medium">{language || 'code'}</span>
        <button
          onClick={copyCode}
          className="flex items-center gap-1 hover:bg-white hover:shadow-sm px-2 py-1 rounded transition-all duration-200 text-gray-600 hover:text-gray-800"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-600" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="bg-gradient-to-br from-slate-50 to-gray-50 border-x border-b border-gray-200 text-gray-800 p-4 rounded-b-md overflow-x-auto text-sm">
        <code className="font-mono leading-relaxed whitespace-pre text-slate-800">{children}</code>
      </pre>
    </div>
  );
};

// Inline code component
const InlineCode = ({ children }: { children: string }) => (
  <code className="bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded font-mono text-sm">
    {children}
  </code>
);

// Message formatter that handles code blocks and inline code
const FormattedMessage = ({ content, index }: { content: string; index: number }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Parse content for code blocks and inline code
  const parseContent = (text: string) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // First, handle code blocks (```code```)
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    let match;
    const segments: Array<{ type: 'text' | 'codeblock'; content: string; language?: string; start: number; end: number }> = [];

    while ((match = codeBlockRegex.exec(text)) !== null) {
      segments.push({
        type: 'codeblock',
        content: match[2],
        language: match[1],
        start: match.index,
        end: match.index + match[0].length
      });
    }

    // Sort segments by start position
    segments.sort((a, b) => a.start - b.start);

    let currentIndex = 0;
    segments.forEach((segment, segIndex) => {
      // Add text before code block
      if (segment.start > currentIndex) {
        const textContent = text.slice(currentIndex, segment.start);
        parts.push(
          <span key={`text-${segIndex}`}>
            {parseInlineCode(textContent)}
          </span>
        );
      }

      // Add code block
      parts.push(
        <CodeBlock key={`code-${segIndex}`} language={segment.language}>
          {segment.content}
        </CodeBlock>
      );

      currentIndex = segment.end;
    });

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      parts.push(
        <span key="remaining">
          {parseInlineCode(remainingText)}
        </span>
      );
    }

    // If no code blocks found, just parse inline code
    if (segments.length === 0) {
      return parseInlineCode(text);
    }

    return parts;
  };

  // Parse inline code (`code`)
  const parseInlineCode = (text: string) => {
    const parts: React.ReactNode[] = [];
    const inlineCodeRegex = /`([^`]+)`/g;
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = inlineCodeRegex.exec(text)) !== null) {
      // Add text before inline code
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        parts.push(
          <span key={`before-${keyIndex}`} className="whitespace-pre-wrap">
            {beforeText}
          </span>
        );
      }

      // Add inline code
      parts.push(
        <InlineCode key={`inline-${keyIndex}`}>
          {match[1]}
        </InlineCode>
      );

      lastIndex = match.index + match[0].length;
      keyIndex++;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`after-${keyIndex}`} className="whitespace-pre-wrap">
          {text.slice(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : <span className="whitespace-pre-wrap">{text}</span>;
  };

  return (
    <div className="relative group">
      <div className="prose prose-sm max-w-none text-gray-800">
        {parseContent(content)}
      </div>
      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-gray-200 rounded-md bg-white shadow-sm border"
        title="Copy message"
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-600" />
        ) : (
          <Copy className="h-3 w-3 text-gray-500" />
        )}
      </button>
      {copied && (
        <div className="absolute -top-8 right-0 text-xs bg-slate-800 text-white px-2 py-1 rounded whitespace-nowrap shadow-lg">
          Copied!
        </div>
      )}
    </div>
  );
};

const AskGPTDialog = ({ open, onOpenChange }: AskGPTDialogProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Clear messages when dialog closes
  useEffect(() => {
    if (!open) {
      setMessages([]);
      setInput("");
    }
  }, [open]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Prepare conversation history for API
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await api.post("/api/gpt/chat", {
        message: userMessage.content,
        conversationHistory
      });

      if (response.status === 200) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.data.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 m-0 w-[95vw] max-w-5xl h-[85vh] sm:h-[80vh] md:w-[90vw] lg:w-[80vw] xl:max-w-6xl">
        <DialogHeader className="p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">
            <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            Ask GPT
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-gray-600 mt-1">
            Get help with coding questions, explanations, and more
          </DialogDescription>
        </DialogHeader>

        <Card className="h-full w-full flex flex-col overflow-hidden border-none shadow-none bg-gray-50">
          <CardContent className="p-2 sm:p-4 flex-1 overflow-hidden">
            <ScrollArea className="h-full w-full" ref={scrollAreaRef}>
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center px-4">
                    <Bot className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-base sm:text-lg mb-2 font-medium">Ask me anything!</p>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                      I can help with coding questions, explanations, debugging, and more.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6 p-2">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-2 sm:gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                          <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] md:max-w-[75%] rounded-lg shadow-sm ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white p-3 sm:p-4'
                            : 'bg-white border border-gray-200 p-3 sm:p-4'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <div className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                            {message.content}
                          </div>
                        ) : (
                          <FormattedMessage content={message.content} index={index} />
                        )}
                      </div>

                      {message.role === 'user' && (
                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center shadow-sm">
                          <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-2 sm:gap-3 justify-start">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                        <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <div className="bg-white border border-gray-200 p-3 sm:p-4 rounded-lg flex items-center gap-2 shadow-sm">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-3 sm:p-4 border-t border-gray-200 bg-white">
            <div className="w-full space-y-2">
              <div className="flex gap-2">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about programming..."
                  className="flex-1 min-h-[40px] max-h-[120px] resize-none text-sm sm:text-base border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg"
                  disabled={isLoading}
                />
                <div className="flex flex-col gap-1">
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm h-10 w-10 sm:h-10 sm:w-12"
                  >
                    <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  {messages.length > 0 && (
                    <Button
                      onClick={clearChat}
                      variant="outline"
                      size="sm"
                      title="Clear chat"
                      className="border-gray-300 hover:bg-gray-50 h-8 w-10 sm:h-8 sm:w-12"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default AskGPTDialog;