"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchCategories } from "@/store/reducers/categorySlice";
import { fetchDashboardString } from "@/store/reducers/dashStringSlice";
import { Program } from "@/types";
import { copyProgram, fetchPrograms, viewProgram } from "@/store/reducers/programSlice";
import { useAuth } from "@/hooks/useAuth";
import { useMediaQuery } from "react-responsive";
import { fetchSettings } from "@/store/reducers/settingSlice";
import { useSearchParams } from "next/navigation";
import { HELLO_DEVELOPER } from "@/constants";

// Dynamic imports with loading components to prevent hydration issues
const CodeCard = dynamic(() => import("@/components/custom/code-card"), { 
  ssr: false,
  loading: () => <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
});

const ChatGPTCard = dynamic(() => import("@/components/custom/chatgpt-card"), { 
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />
});

const Header = dynamic(() => import("@/components/layout/header"), { 
  ssr: false 
});

const Footer = dynamic(() => import("@/components/layout/footer"), { 
  ssr: false 
});

const CodeDialog = dynamic(() => import("@/components/dialog/code-dialog"), { 
  ssr: false 
});

const Sidebar = dynamic(() => import("@/components/layout/sidebar"), { 
  ssr: false,
  loading: () => <div className="w-64 h-full bg-gray-100 animate-pulse" />
});

const Recruiters = dynamic(() => import("@/components/sections/recruiters"), { 
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />
});

const Contributors = dynamic(() => import("@/components/sections/contributors"), { 
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />
});

const Quizes = dynamic(() => import("@/components/sections/quizes"), { 
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />
});

// Critical: Load FeedbackDialog with error boundary
const FeedbackDialog = dynamic(() => import("@/components/dialog/feedback-dialog"), { 
  ssr: false,
  loading: () => null
});

export default function Home() {
  // Use ref to track if component is mounted
  const isMountedRef = useRef(false);
  const [isClient, setIsClient] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("");

  // Initialize all state with proper defaults
  const [copied, setCopied] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"bug" | "suggestion">("bug");
  const [showJobPosting, setShowJobPosting] = useState(false);
  const [showApplyJob, setShowApplyJob] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Safe mounting check
  useEffect(() => {
    isMountedRef.current = true;
    
    // Use requestAnimationFrame to ensure DOM is ready
    const frame = requestAnimationFrame(() => {
      if (isMountedRef.current) {
        setIsClient(true);
      }
    });

    return () => {
      isMountedRef.current = false;
      cancelAnimationFrame(frame);
    };
  }, []);

  const dispatch = useAppDispatch();
  
  // Safe media query hook
  const rawIsMobile = useMediaQuery({ maxWidth: 639 }, undefined, { deviceWidth: 640 });
  const isMobile = isClient ? rawIsMobile : false;

  const searchParams = useSearchParams();
  const programId = searchParams?.get("programId") || null;

  // Redux state with safe defaults
  const programState = useAppSelector((state) => state.programs) || { items: [] };
  const settings = useAppSelector((state) => state.settings) || { item: null };
  const categoriesState = useAppSelector((state) => state.categories) || { items: [] };
  const { user } = useAuth() || {};

  const { items = [] } = programState;
  const categories = categoriesState?.items || [];

  const selectedProgramInit: Program = {
    _id: "",
    name: "",
    code: { java: "", python: "", html: "" },
    views: 0,
    copies: 0,
    shares: 0,
  };

  const [selectedProgram, setSelectedProgram] = useState<Program>(selectedProgramInit);

  // Safe state setters with mount checks
  const safeSetState = useCallback((setter: Function, value: any) => {
    if (isMountedRef.current) {
      setter(value);
    }
  }, []);

  // Safe feedback handlers
  const handleShowFeedback = useCallback((type: "bug" | "suggestion") => {
    if (!isMountedRef.current) return;
    setFeedbackType(type);
    setShowFeedback(true);
  }, []);

  const handleCloseFeedback = useCallback(() => {
    if (!isMountedRef.current) return;
    setShowFeedback(false);
  }, []);

  // Fetch data only once with proper error handling
  useEffect(() => {
    if (!isClient || !isMountedRef.current) return;
    
    let abortController = new AbortController();
    
    const fetchData = async () => {
      try {
        if (isMountedRef.current && !abortController.signal.aborted) {
          const promises = [
            dispatch(fetchCategories()),
            dispatch(fetchDashboardString()),
            dispatch(fetchPrograms()),
            dispatch(fetchSettings())
          ];
          
          await Promise.allSettled(promises);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Error fetching data:", error);
        }
      }
    };

    const timeoutId = setTimeout(fetchData, 100);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [dispatch, isClient]);

  // Initialize expanded categories safely
  useEffect(() => {
    if (categories.length > 0 && expandedCategories.length === 0 && isMountedRef.current) {
      setExpandedCategories([categories[0].name]);
    }
  }, [categories, expandedCategories.length]);

  // Handle program selection with safety checks
  useEffect(() => {
    if (!programId || !programState || !Array.isArray(programState.items) || !isMountedRef.current) {
      return;
    }
    
    const { items } = programState;
    if (items.length > 0) {
      const selProg = items.find((item) => item._id === programId);
      if (selProg && isMountedRef.current) {
        setSelectedProgram(selProg);
      }
    }
  }, [programId, programState]);

  // Handle mobile sidebar with safety
  useEffect(() => {
    if (isMobile && !programId && isClient && isMountedRef.current) {
      setIsSidebarOpen(true);
    }
  }, [isMobile, programId, isClient]);

  // Dialog state management
  useEffect(() => {
    if (showDialog && selectedLanguage.length > 0 && isMountedRef.current) {
      setIsOpen(true);
    }
  }, [showDialog, selectedLanguage]);

  // Safe handlers
  const handleViewCode = useCallback(async () => {
    if (!isMountedRef.current) return;
    safeSetState(setIsOpen, true);
    safeSetState(setShowDialog, true);
    if (selectedProgram._id) {
      try {
        await dispatch(viewProgram(selectedProgram._id));
      } catch (error) {
        console.error("Error viewing program:", error);
      }
    }
  }, [selectedProgram._id, dispatch, safeSetState]);

  const handleCopyCode = useCallback(async () => {
    if (!selectedProgram.name || !selectedProgram._id || !isMountedRef.current) return;
    try {
      await dispatch(copyProgram(selectedProgram._id));
    } catch (error) {
      console.error("Error copying code:", error);
    }
  }, [selectedProgram.name, selectedProgram._id, dispatch]);

  const toggleSidebar = useCallback(() => {
    if (isMountedRef.current) {
      setIsSidebarOpen(prev => !prev);
    }
  }, []);

  const handleProgramSelect = useCallback((program: Program) => {
    if (!isMountedRef.current) return;
    setSelectedProgram(program);
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      setIsSidebarOpen(false);
    }
  }, []);

  const removeBackticks = useCallback((code: string = "") => {
    if (typeof code !== 'string') return "";
    return code.replace(/`/g, "");
  }, []);

  // Safe dialog handlers
  const handleDialogOpenChange = useCallback((open: boolean) => {
    if (!isMountedRef.current) return;
    setIsOpen(open);
    if (!open) {
      setShowDialog(false);
      setSelectedLanguage("");
    }
  }, []);

  // CSS injection with safety
  // useEffect(() => {
  //   if (!isClient) return;
    
  //   const style = document.createElement("style");
  //   style.id = "code-cards-style";
  //   style.textContent = `
  //     .code-cards-container * {
  //       color: #000000 !important;
  //     }
  //     .code-cards-container pre,
  //     .code-cards-container code,
  //     .code-cards-container p,
  //     .code-cards-container div,
  //     .code-cards-container span {
  //       color: #000000 !important;
  //     }
  //   `;
    
  //   // Check if style already exists
  //   const existingStyle = document.getElementById("code-cards-style");
  //   if (!existingStyle) {
  //     document.head.appendChild(style);
  //   }

  //   return () => {
  //     const styleToRemove = document.getElementById("code-cards-style");
  //     if (styleToRemove && document.head.contains(styleToRemove)) {
  //       document.head.removeChild(styleToRemove);
  //     }
  //   };
  // }, [isClient]);

  // Early returns for loading states
  if (!isClient) {
    return (
      <div className="min-h-[80vh] bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-[#f5f5f5]">
      {isClient && (
        <Header
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          setSelectedProgram={setSelectedProgram}
        />
      )}

      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 xl:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div className="pt-12">
        <div className="flex flex-col xl:flex-row w-full relative min-h-[calc(80vh-5rem)]">
          {isClient && (
            <Sidebar
              isSidebarOpen={isSidebarOpen}
              expandedCategories={expandedCategories}
              onSelectProgram={handleProgramSelect}
              onShowJobPosting={() => safeSetState(setShowJobPosting, true)}
              onShowApplyJob={() => safeSetState(setShowApplyJob, true)}
              onCloseSidebar={() => safeSetState(setIsSidebarOpen, false)}
              toggleCategory={() => {}}
            />
          )}

          <div className="flex-1 xl:ml-64 p-2 sm:p-4 xl:p-6">
            {/* Code Cards Grid */}
            <div className=" grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mb-4">
              {/* Java Card */}
              {isClient && (
                <CodeCard
                  code={
                    selectedProgram.name === ""
                      ? ""
                      : removeBackticks(selectedProgram.code?.java)
                  }
                  language="java"
                  title={
                    selectedProgram.name === ""
                      ? settings?.item?.javaHeading || "Java"
                      : selectedProgram.name
                  }
                  defaultCode={settings?.item?.javaCode || ""}
                  clickFunc={setSelectedLanguage}
                  showDialog={setShowDialog}
                  copyCode={handleCopyCode}
                  isDashboard={selectedProgram.name === ""}
                  onShowFeedback={handleShowFeedback}
                  copiedNumber={selectedProgram.copies || 0}
                  viewedNumber={selectedProgram.views || 0}
                  sharedNumber={selectedProgram.shares || 0}
                  hasButtons={selectedProgram.name !== ""}
                  bgColor={settings?.item?.javaBackgroundColor}
                  footerBgColor={settings?.item?.javaFooterBackgroundColor}
                  fontSize={settings?.item?.javaFontSize}
                />
              )}

              {/* Python Card */}
              {isClient && (
                <CodeCard
                  defaultCode={settings?.item?.pythonCode || ""}
                  code={
                    selectedProgram.name === ""
                      ? ""
                      : removeBackticks(selectedProgram.code?.python)
                  }
                  language="python"
                  title={
                    selectedProgram.name === ""
                      ? settings?.item?.pythonHeading || "Python"
                      : selectedProgram.name
                  }
                  clickFunc={setSelectedLanguage}
                  showDialog={setShowDialog}
                  copyCode={handleCopyCode}
                  isDashboard={selectedProgram.name === ""}
                  onShowFeedback={handleShowFeedback}
                  copiedNumber={selectedProgram.copies || 0}
                  viewedNumber={selectedProgram.views || 0}
                  sharedNumber={selectedProgram.shares || 0}
                  hasButtons={selectedProgram.name !== ""}
                  bgColor={settings?.item?.pythonBackgroundColor}
                  footerBgColor={settings?.item?.pythonFooterBackgroundColor}
                  fontSize={settings?.item?.pythonFontSize}
                />
              )}

              {/* HTML Card */}
              {isClient && (
                <CodeCard
                  defaultCode={settings?.item?.htmlCode || ""}
                  code={
                    selectedProgram.name === ""
                      ? ""
                      : removeBackticks(selectedProgram.code?.html)
                  }
                  language="html"
                  title={
                    selectedProgram.name === ""
                      ? settings?.item?.htmlHeading || "HTML"
                      : selectedProgram.name
                  }
                  clickFunc={setSelectedLanguage}
                  showDialog={setShowDialog}
                  copyCode={handleCopyCode}
                  isDashboard={selectedProgram.name === ""}
                  onShowFeedback={handleShowFeedback}
                  copiedNumber={selectedProgram.copies || 0}
                  viewedNumber={selectedProgram.views || 0}
                  sharedNumber={selectedProgram.shares || 0}
                  hasButtons={selectedProgram.name !== ""}
                  bgColor={settings?.item?.htmlBackgroundColor}
                  footerBgColor={settings?.item?.htmlFooterBackgroundColor}
                  fontSize={settings?.item?.htmlFontSize}
                />
              )}
            </div>

            {/* ChatGPTCard + Other Sections */}
            {isClient && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4">
                <div className="col-span-1 mb-4 sm:mb-0">
                  <ChatGPTCard
                    language={selectedLanguage}
                    clickFunc={setSelectedLanguage}
                    showDialog={setShowDialog}
                  />
                </div>
                <div className="col-span-1 lg:col-span-2 space-y-4">
                  {settings?.item?.isJobs && (
                    <div className="w-full overflow-x-auto shadow-md">
                      <Recruiters />
                    </div>
                  )}
                  <div className="w-full overflow-x-auto shadow-md">
                    <Contributors />
                  </div>
                  <div className="w-full overflow-x-auto shadow-md">
                    <Quizes />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isClient && (
        <div className="pb-1">
          <Footer />
        </div>
      )}

      {/* Dialogs - Only render when absolutely necessary */}
      {isClient && isOpen && (
        <CodeDialog
          open={isOpen}
          onOpenChange={handleDialogOpenChange}
          onShowFeedback={handleShowFeedback}
          language={selectedLanguage}
          code={
            selectedLanguage === "java"
              ? selectedProgram.name === ""
                ? HELLO_DEVELOPER?.java || ""
                : removeBackticks(selectedProgram.code?.java)
              : selectedLanguage === "python"
              ? selectedProgram.name === ""
                ? HELLO_DEVELOPER?.python || ""
                : removeBackticks(selectedProgram.code?.python)
              : selectedProgram.name === ""
              ? HELLO_DEVELOPER?.html || ""
              : removeBackticks(selectedProgram.code?.html)
          }
          title={
            selectedProgram.name === "" ? "Hello Developer" : selectedProgram.name
          }
          copyCode={handleCopyCode}
        />
      )}

      {/* Feedback Dialog - Only render when needed and mounted */}
      {isClient && showFeedback && isMountedRef.current && (
        <FeedbackDialog
          type={feedbackType}
          programId={selectedProgram._id || ""}
          open={showFeedback}
          onOpenChange={handleCloseFeedback}
          selectedProgram={selectedProgram}
        />
      )}
    </div>
  );
}