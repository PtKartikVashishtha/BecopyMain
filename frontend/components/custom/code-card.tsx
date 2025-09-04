"use client";

import { Copy, Flag, ExternalLink, Lightbulb, Eye, X, ArrowLeft, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState, useRef, useEffect, useCallback } from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import * as shiki from "shiki";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { usePathname, useSearchParams } from "next/navigation";

interface CodeCardProps {
  code: string;
  defaultCode: string;
  language: string;
  title: string;
  isDashboard: boolean;
  clickFunc: (lang: string) => void;
  copyCode: () => void;
  showDialog: (open: boolean) => void;
  copiedNumber: number;
  viewedNumber: number;
  sharedNumber: number;
  onShowFeedback: (type: "bug" | "suggestion") => void;
  hasButtons: boolean;
  bgColor: string;
  footerBgColor: string;
  fontSize: string;
}

// Mobile Full-Page Code Viewer
const MobileCodeViewer = ({ 
  isOpen, 
  onClose, 
  code, 
  language, 
  title, 
  highlightedCode,
  onCopy 
}: {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
  title: string;
  highlightedCode: string;
  onCopy: () => void;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white sm:hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <button onClick={onClose} className="p-1">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-600 truncate max-w-[200px]">{title}</h2>
            <span className="text-sm text-gray-500 capitalize">{language}</span>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 bg-white">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <ScrollArea className="h-full w-full">
            <div
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
              className="shiki text-sm [&_*]:!text-white"
              style={{ 
                backgroundColor: "#1f1f24",
                color: "white"
              }}
            />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

// Mobile Full-Page Feedback Form
const MobileFeedbackPage = ({ 
  isOpen, 
  onClose, 
  type, 
  title,
  onSubmit,
  codeData
}: {
  isOpen: boolean;
  onClose: () => void;
  type: "bug" | "suggestion";
  title: string;
  onSubmit: (feedback: string) => void;
  codeData: {
    java: string;
    python: string;
    html: string;
    javaHighlighted: string;
    pythonHighlighted: string;
    htmlHighlighted: string;
  };
}) => {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<"java" | "python" | "html">("java");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(feedback);
      setFeedback("");
      onClose();
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getLanguageData = () => {
    switch (activeLanguage) {
      case "java":
        return { code: codeData.java, highlighted: codeData.javaHighlighted };
      case "python":
        return { code: codeData.python, highlighted: codeData.pythonHighlighted };
      case "html":
        return { code: codeData.html, highlighted: codeData.htmlHighlighted };
      default:
        return { code: codeData.java, highlighted: codeData.javaHighlighted };
    }
  };

  const currentLangData = getLanguageData();

  return (
    <div className="fixed inset-0 z-50 bg-white sm:hidden overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <button onClick={onClose} className="p-1">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {type === "bug" ? "Report Bug" : "Submit Suggestion"}
            </h2>
            <span className="text-sm text-gray-500 truncate max-w-[200px]">{title}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col h-full bg-white">
        <div className="flex-1 overflow-auto">
          {/* Language Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50 px-4">
            {(["java", "python", "html"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLanguage(lang)}
                className={`px-4 py-3 text-sm font-medium capitalize border-b-2 ${
                  activeLanguage === lang
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-700 hover:text-gray-900"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Code Display */}
          <div className="p-4 bg-white">
            <div className="bg-[#1f1f24] rounded-lg border border-gray-200 mb-4">
              <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {activeLanguage} Code
                </span>
              </div>
              <ScrollArea className="h-48 p-3 bg-[#1f1f24] scrollbar-hide">
                <div
                  dangerouslySetInnerHTML={{ __html: currentLangData.highlighted }}
                  className="shiki text-sm [&_*]:!text-white"
                  style={{ 
                    backgroundColor: "#1f1f24",
                    color: "white"
                  }}
                />
              </ScrollArea>
            </div>
          </div>

          {/* Feedback Form */}
          <form onSubmit={handleSubmit} className="px-4 pb-4 bg-white">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {type === "bug" ? "Describe the bug:" : "Your suggestion:"}
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                placeholder={type === "bug" ? "Please describe what went wrong..." : "Please share your suggestion..."}
                required
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-blue-700">
                {type === "bug" 
                  ? "Help us fix this issue by providing detailed information about what happened in the code above."
                  : "We value your feedback! Let us know how we can improve this code example."
                }
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium bg-white hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
              disabled={!feedback.trim() || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile Full-Page Share
const MobileSharePage = ({ 
  isOpen, 
  onClose, 
  code, 
  title, 
  language 
}: {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  title: string;
  language: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out this ${language} code: ${title}`,
          text: code.substring(0, 200) + "...",
          url: window.location.href,
        });
      } catch (error) {
        console.log("Share cancelled or failed");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white sm:hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <button onClick={onClose} className="p-1">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Share Code</h2>
            <span className="text-sm text-gray-500 truncate max-w-[200px]">{title}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 bg-white">
        <div className="space-y-4">
          {/* Native Share */}
          {typeof navigator.share === "function" && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center space-x-3 py-4 bg-blue-600 text-white rounded-lg font-medium"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Share via Apps</span>
            </button>
          )}

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center space-x-3 py-4 border border-gray-300 rounded-lg font-medium bg-white text-gray-700 hover:bg-gray-50"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Preview:</h3>
            <p className="text-sm text-gray-600 mb-2">{title}</p>
            <div className="bg-white p-3 rounded border text-xs font-mono text-gray-700 overflow-hidden">
              {code.substring(0, 150)}...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CodeCard = ({
  code,
  language,
  title,
  showDialog,
  clickFunc,
  isDashboard,
  copyCode,
  onShowFeedback,
  copiedNumber,
  viewedNumber,
  sharedNumber,
  defaultCode,
  hasButtons = true,
  bgColor,
  footerBgColor,
  fontSize,
}: CodeCardProps) => {
  const [mouseDownPosition, setMouseDownPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const programId = searchParams.get("programId") || null;

  const [copied, setCopied] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState("");
  const [allHighlightedCode, setAllHighlightedCode] = useState({
    java: "",
    python: "",
    html: ""
  });
  
  // Mobile page states
  const [showMobileViewer, setShowMobileViewer] = useState(false);
  const [showMobileFeedback, setShowMobileFeedback] = useState(false);
  const [showMobileShare, setShowMobileShare] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"bug" | "suggestion">("bug");

  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseDownPosition({ x: e.clientX, y: e.clientY });
  };

  const onShowCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if mobile
    if (window.innerWidth < 640) {
      setShowMobileViewer(true);
    } else {
      // For desktop, set language and show dialog without navigation
      clickFunc(language);
      showDialog(true);
    }
  };
  
  const formatCode = (code: string) => {
    if (typeof code !== "string") return "";
    return code.replaceAll("    ", "  ");
  };
  
  const handleCopyCode = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert("Code cannot be copied from localhost");
      console.error("Failed to copy: ", err);
    }
    await copyCode();
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDashboard) {
      if (mouseDownPosition) {
        const deltaX = Math.abs(e.clientX - mouseDownPosition.x);
        const deltaY = Math.abs(e.clientY - mouseDownPosition.y);

        if (deltaX < 1 && deltaY < 1) {
          const selection = window.getSelection();
          if (!selection || selection.toString().length === 0) {
            onShowCode(e);
          }
        }

        setMouseDownPosition(null);
      }
    }
  };

  const handleFeedbackClick = (e: React.MouseEvent, type: "bug" | "suggestion") => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.innerWidth < 640) {
      setFeedbackType(type);
      setShowMobileFeedback(true);
    } else {
      // For desktop feedback, call the function directly
      onShowFeedback(type);
    }
  };

  const handleShareClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.innerWidth < 640) {
      setShowMobileShare(true);
    } else {
      // Desktop sharing logic
      try {
        if (navigator.share) {
          await navigator.share({
            title: "Check out this code",
            text: `${code}`,
            url: window.location.href,
          });
          console.log("code shared successfully");
        } else {
          // Fallback for desktop browsers without native share
          await navigator.clipboard.writeText(window.location.href);
          alert("Link copied to clipboard!");
        }
      } catch (error) {
        console.log("error", error);
      }
    }
  }, [code]);

  const handleFeedbackSubmit = async (feedback: string) => {
    // Here you would typically send the feedback to your API
    console.log("Feedback submitted:", { type: feedbackType, feedback, programId });
    // You can integrate this with your existing feedback system
  };
  
  useEffect(() => {
    const highlight = async () => {
      const highlighter = await shiki.createHighlighter({
        themes: ["github-dark"],
        langs: ["javascript", "python", "java", "html"],
      });

      // Use dark theme for better white text visibility
      const highlighted = highlighter.codeToHtml(formatCode(code), {
        lang: language,
        theme: "github-dark",
      });
      setHighlightedCode(highlighted);

      // Highlight all languages for feedback modal
      const allHighlighted = {
        java: highlighter.codeToHtml(formatCode(code), {
          lang: "java",
          theme: "github-dark",
        }),
        python: highlighter.codeToHtml(formatCode(code), {
          lang: "python", 
          theme: "github-dark",
        }),
        html: highlighter.codeToHtml(formatCode(code), {
          lang: "html",
          theme: "github-dark",
        })
      };
      setAllHighlightedCode(allHighlighted);
    };

    highlight();
  }, [code, language, isDashboard]);

  if (programId !== null && code.length === 0) {
    return (
      <div className="bg-green-50 p-4 rounded-lg mb-4 text-center">
        <p className="text-green-700">Loading Code...</p>
      </div>
    );
  }

  return (
    <>
      <Card className={`w-full max-w-full hover:cursor-pointer shadow-lg rounded-lg ${programId ? 'bg-white' : 'bg-[#1f1f24]'}`}>
        {/* Fixed header with better spacing and margins */}
        <CardHeader className={`px-4 sm:px-6 py-2 border-b border-[#c8c8c8] ${programId ? 'bg-white' : ''}`}>
          <div className="flex flex-col sm:grid sm:grid-cols-12 w-full gap-4 sm:gap-6">
            {/* Mobile: Language and Stats Row */}
            <div className="flex justify-between items-center sm:contents">
              {/* Language with proper margin */}
              <div className="sm:col-span-3 flex items-center mr-4">
                <span className="text-xs sm:text-sm font-medium text-white capitalize">
                  {language.toString().slice(0, 1).toUpperCase() +
                    language.toString().slice(1)}
                </span>
              </div>

              {/* Stats - Mobile only */}
              <div className="flex sm:hidden space-x-4">
                {!isDashboard && (
                  <>
                    <div className="flex items-center space-x-1 text-gray-600">
                      <Eye className="w-3 h-3" />
                      <span className="text-xs">{viewedNumber}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-600">
                      <Copy className="w-3 h-3" />
                      <span className="text-xs">{copiedNumber}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-600">
                      <ExternalLink className="w-3 h-3" />
                      <span className="text-xs">{sharedNumber}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Title Row with better spacing and margin from buttons */}
            <div className="sm:col-span-6 flex justify-center sm:justify-center px-4 sm:pr-10 sm:pl-6 text-white">
              <CardTitle className="text-sm sm:text-md md:text-lg lg:text-xl text-center truncate max-w-full mr-3">
                {title}
              </CardTitle>
            </div>

            {/* Dashboard buttons or Desktop stats with improved spacing and margin */}
            <div className="hidden sm:flex sm:col-span-3 justify-end items-center ml-6">
              {isDashboard ? (
                <div className="flex space-x-2">
                  <button className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <button className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <button className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
              ) : (
                <div className="flex space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{viewedNumber}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Copy className="w-4 h-4" />
                    <span>{copiedNumber}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ExternalLink className="w-4 h-4" />
                    <span>{sharedNumber}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Mobile-optimized content */}
        <CardContent className="p-1 sm:p-2 font-display ">
          <ScrollArea
            ref={scrollAreaRef}
            className="h-[120px] sm:h-[100px] lg:h-[135px] w-full p-2 sm:p-4 overflow-hidden scrollbar-hide"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
          >
            <div
              dangerouslySetInnerHTML={{
                __html: code.length === 0 ? defaultCode : highlightedCode,
              }}
              className="shiki break-all sm:break-normal text-white"
              style={{ 
                backgroundColor: programId ? "white" : "#1f1f24", 
                fontSize: fontSize,
                wordBreak: "break-all",
                overflowWrap: "break-word",
                whiteSpace: "pre-wrap",
                color: programId ? "black" : "white",
                padding: "0.5rem",
                borderRadius: "0.375rem"
              }}
            />
          </ScrollArea>
        </CardContent>

        {/* Fixed footer with better button spacing and corrected tooltip background */}
        <CardFooter className={`${programId ? 'bg-white' : 'bg-[#202938]'} max-h-[40px] px-3 sm:px-4 py-3 border-t border-[#c8c8c8] flex items-center justify-center rounded-b-lg rounded-t-lg`}>
          {(
            <div className="flex space-x-6">
              <RadixTooltip.Provider>
                <RadixTooltip.Root open={copied}>
                  <RadixTooltip.Trigger asChild>
                    <button
                      className={`hover:text-gray-600 transition-colors p-2 ${
                        copied ? "text-gray-600" : "text-gray-400"
                      }`}
                      onClick={handleCopyCode}
                    >
                      <Copy className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </RadixTooltip.Trigger>
                  <RadixTooltip.Content
                    side="top"
                    sideOffset={5}
                    className="bg-white px-3 py-2 rounded text-sm shadow-lg animate-fadeIn z-50 "
                    style={{ color: '#6b7280' }}
                  >
                    Code copied
                    <RadixTooltip.Arrow className="fill-gray-800" />
                  </RadixTooltip.Content>
                </RadixTooltip.Root>
              </RadixTooltip.Provider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                      onClick={onShowCode}

                    >
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-800 text-white border-gray-700">
                    <p>View</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                      onClick={(e) => handleFeedbackClick(e, "bug")}
                    >
                      <Flag className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-800 text-white border-gray-700 ">
                    <p>Bug</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                      onClick={(e) => handleFeedbackClick(e, "suggestion")}
                    >
                      <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-800 text-white border-gray-700 ">
                    <p>Suggestion</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                      onClick={handleShareClick}
                    >
                      <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-800 text-white border-gray-700 ">
                    <p>Share</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Mobile Full-Page Modals */}
      <MobileCodeViewer
        isOpen={showMobileViewer}
        onClose={() => setShowMobileViewer(false)}
        code={code}
        language={language}
        title={title}
        highlightedCode={highlightedCode}
        onCopy={handleCopyCode}
      />

      <MobileFeedbackPage
        isOpen={showMobileFeedback}
        onClose={() => setShowMobileFeedback(false)}
        type={feedbackType}
        title={title}
        onSubmit={handleFeedbackSubmit}
        codeData={{
          java: code,
          python: code,
          html: code,
          javaHighlighted: allHighlightedCode.java,
          pythonHighlighted: allHighlightedCode.python,
          htmlHighlighted: allHighlightedCode.html
        }}
      />

      <MobileSharePage
        isOpen={showMobileShare}
        onClose={() => setShowMobileShare(false)}
        code={code}
        title={title}
        language={language}
      />
    </>
  );
};

export default CodeCard;