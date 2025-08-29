"use client";

import { useEffect, useState } from "react";
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
import { fetchUserLocation } from "@/store/reducers/geoSlice";

// Dynamic imports with SSR disabled
const CodeCard = dynamic(() => import("@/components/custom/code-card"), { ssr: false });
const ChatGPTCard = dynamic(() => import("@/components/custom/chatgpt-card"), { ssr: false });
const Header = dynamic(() => import("@/components/layout/header"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/footer"), { ssr: false });
const CodeDialog = dynamic(() => import("@/components/dialog/code-dialog"), { ssr: false });
const FeedbackDialog = dynamic(() => import("@/components/dialog/feedback-dialog"), { ssr: false });
const JobPostingDialog = dynamic(() => import("@/components/dialog/jobposting-dialog"), { ssr: false });
const ApplyJobDialog = dynamic(() => import("@/components/dialog/applyjob-dialog").then(mod => ({ default: mod.ApplyJobDialog })), { ssr: false });
const Sidebar = dynamic(() => import("@/components/layout/sidebar"), { ssr: false });
const Recruiters = dynamic(() => import("@/components/sections/recruiters"), { ssr: false });
const Contributors = dynamic(() => import("@/components/sections/contributors"), { ssr: false });
const Quizes = dynamic(() => import("@/components/sections/quizes"), { ssr: false });

export default function Home() {
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"bug" | "suggestion">("bug");
  const [showJobPosting, setShowJobPosting] = useState(false);
  const [showApplyJob, setShowApplyJob] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery({ maxWidth: 639 });
  const searchParams = useSearchParams();
  const programId = searchParams.get("programId") || null;

  // Ensure client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize data on client mount
  useEffect(() => {
    if (!isClient) return;
    
    console.log('Initializing home page data...');
    dispatch(fetchCategories());
    dispatch(fetchDashboardString());
    dispatch(fetchPrograms());
    dispatch(fetchSettings());
    
    // Initialize location detection
    dispatch(fetchUserLocation());
  }, [dispatch, isClient]);

  // Add targeted CSS override for code cards
  useEffect(() => {
    if (!isClient) return;
    
    const style = document.createElement("style");
    style.textContent = `
      .code-cards-container * {
        color: #000000 !important;
      }
      .code-cards-container pre,
      .code-cards-container code,
      .code-cards-container p,
      .code-cards-container div,
      .code-cards-container span {
        color: #000000 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [isClient]);

  const { user } = useAuth();
  const { items } = useAppSelector((state) => state.programs);
  const settings = useAppSelector((state) => state.settings);
  const categoriesState = useAppSelector((state) => state.categories);
  const programState = useAppSelector((state) => state.programs);
  const categories = categoriesState.items;

  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    categories.length > 0 ? [categories[0].name] : []
  );

  const selectedProgramInit: Program = {
    _id: "",
    name: "",
    code: { java: "", python: "", html: "" },
    views: 0,
    copies: 0,
    shares: 0,
  };

  const [selectedProgram, setSelectedProgram] =
    useState<Program>(selectedProgramInit);

  // Handle program selection from URL
  useEffect(() => {
    if (programId && programState?.items?.length > 0) {
      const selectedProg = programState.items.find((item) => item._id === programId);
      if (selectedProg) {
        setSelectedProgram(selectedProg);
      }
    }
  }, [programId, programState]);

  // Mobile sidebar auto-open logic
  useEffect(() => {
    if (isMobile && !programId) {
      setIsSidebarOpen(true);
    }
  }, [isMobile, programId]);

  // Dialog management
  useEffect(() => {
    if (showDialog && selectedLanguage.length > 0) {
      setIsOpen(true);
    }
  }, [showDialog, selectedLanguage]);

  const handleViewCode = async () => {
    if (selectedProgram._id) {
      setShowDialog(true);
      await dispatch(viewProgram(selectedProgram._id));
    }
  };

  const handleCopyCode = async () => {
    if (selectedProgram.name === "" || !selectedProgram._id) return;
    try {
      await dispatch(copyProgram(selectedProgram._id));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleProgramSelect = (program: Program) => {
    setSelectedProgram(program);
    if (window.innerWidth < 1280) {
      setIsSidebarOpen(false);
    }
  };

  const removeBackticks = (code: string) => code?.replace(/`/g, "") || "";

  // Loading state until hydration
  if (!isClient) {
    return (
      <div className="min-h-[80vh] bg-[#f5f5f5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-[#f5f5f5]">
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setSelectedProgram={setSelectedProgram}
      />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 xl:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div className="pt-12">
        <div className="flex flex-col xl:flex-row w-full relative min-h-[calc(80vh-5rem)]">
          <Sidebar
            isSidebarOpen={isSidebarOpen}
            expandedCategories={expandedCategories}
            onSelectProgram={handleProgramSelect}
            onShowJobPosting={() => setShowJobPosting(true)}
            onShowApplyJob={() => setShowApplyJob(true)}
            onCloseSidebar={() => setIsSidebarOpen(false)}
            toggleCategory={(categoryName: string) => {
              setExpandedCategories(prev => 
                prev.includes(categoryName) 
                  ? prev.filter(name => name !== categoryName)
                  : [...prev, categoryName]
              );
            }}
          />

          <div className="flex-1 xl:ml-64 p-2 sm:p-4 xl:p-6">
            {/* Code Cards Grid */}
            <div className="code-cards-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mb-4">
              {/* Java Card */}
              <CodeCard
                code={
                  selectedProgram.name === ""
                    ? ""
                    : removeBackticks(selectedProgram.code?.java)
                }
                language="java"
                title={
                  selectedProgram.name === ""
                    ? settings?.item?.javaHeading || "Java Code"
                    : selectedProgram.name
                }
                defaultCode={settings?.item?.javaCode}
                clickFunc={setSelectedLanguage}
                showDialog={handleViewCode}
                copyCode={handleCopyCode}
                isDashboard={selectedProgram.name === ""}
                onShowFeedback={(type: "bug" | "suggestion") => {
                  setFeedbackType(type);
                  setShowFeedback(true);
                }}
                copiedNumber={selectedProgram.copies}
                viewedNumber={selectedProgram.views}
                sharedNumber={selectedProgram.shares}
                hasButtons={selectedProgram.name !== ""}
                bgColor={settings?.item?.javaBackgroundColor}
                footerBgColor={settings?.item?.javaFooterBackgroundColor}
                fontSize={settings?.item?.javaFontSize}
              />

              {/* Python Card */}
              <CodeCard
                defaultCode={settings?.item?.pythonCode}
                code={
                  selectedProgram.name === ""
                    ? ""
                    : removeBackticks(selectedProgram.code?.python)
                }
                language="python"
                title={
                  selectedProgram.name === ""
                    ? settings?.item?.pythonHeading || "Python Code"
                    : selectedProgram.name
                }
                clickFunc={setSelectedLanguage}
                showDialog={handleViewCode}
                copyCode={handleCopyCode}
                isDashboard={selectedProgram.name === ""}
                onShowFeedback={(type: "bug" | "suggestion") => {
                  setFeedbackType(type);
                  setShowFeedback(true);
                }}
                copiedNumber={selectedProgram.copies}
                viewedNumber={selectedProgram.views}
                sharedNumber={selectedProgram.shares}
                hasButtons={selectedProgram.name !== ""}
                bgColor={settings?.item?.pythonBackgroundColor}
                footerBgColor={settings?.item?.pythonFooterBackgroundColor}
                fontSize={settings?.item?.pythonFontSize}
              />

              {/* HTML Card */}
              <CodeCard
                defaultCode={settings?.item?.htmlCode}
                code={
                  selectedProgram.name === ""
                    ? ""
                    : removeBackticks(selectedProgram.code?.html)
                }
                language="html"
                title={
                  selectedProgram.name === ""
                    ? settings?.item?.htmlHeading || "HTML Code"
                    : selectedProgram.name
                }
                clickFunc={setSelectedLanguage}
                showDialog={handleViewCode}
                copyCode={handleCopyCode}
                isDashboard={selectedProgram.name === ""}
                onShowFeedback={(type: "bug" | "suggestion") => {
                  setFeedbackType(type);
                  setShowFeedback(true);
                }}
                copiedNumber={selectedProgram.copies}
                viewedNumber={selectedProgram.views}
                sharedNumber={selectedProgram.shares}
                hasButtons={selectedProgram.name !== ""}
                bgColor={settings?.item?.htmlBackgroundColor}
                footerBgColor={settings?.item?.htmlFooterBackgroundColor}
                fontSize={settings?.item?.htmlFontSize}
              />
            </div>

            {/* ChatGPTCard + Other Sections */}
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
          </div>
        </div>
      </div>
      
      <div className="pb-1">
        <Footer />
      </div>

      {/* Dialogs */}
      <CodeDialog
        open={isOpen}
        onOpenChange={(open: boolean) => {
          setIsOpen(open);
          if (!open) {
            setShowDialog(false);
            setSelectedLanguage("");
          }
        }}
        onShowFeedback={setShowFeedback}
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

      <FeedbackDialog
        type={feedbackType}
        programId={selectedProgram._id}
        open={showFeedback}
        onOpenChange={setShowFeedback}
        selectedProgram={selectedProgram}
      />
      <JobPostingDialog open={showJobPosting} onOpenChange={setShowJobPosting} />
      <ApplyJobDialog open={showApplyJob} onOpenChange={setShowApplyJob} />
    </div>
  );
}