"use client";

import { useEffect, useState } from "react";
import CodeCard from "@/components/custom/code-card";
import ChatGPTCard from "@/components/custom/chatgpt-card";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CodeDialog from "@/components/dialog/code-dialog";
import FeedbackDialog from "@/components/dialog/feedback-dialog";
import JobPostingDialog from "@/components/dialog/jobposting-dialog";
import { ApplyJobDialog } from "@/components/dialog/applyjob-dialog";
import Sidebar from "@/components/layout/sidebar";
import Recruiters from "@/components/sections/recruiters";
import Contributors from "@/components/sections/contributors";
import Quizes from "@/components/sections/quizes";
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

export default function Home() {
  const [selectedLanguage, setSelectedLanguage] = useState("");

  // Add targeted CSS override for code cards only
  useEffect(() => {
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
      document.head.removeChild(style);
    };
  }, []);

  const dispatch = useAppDispatch();
  const [copied, setCopied] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 639 }); // sm breakpoint

  const searchParams = useSearchParams();
  const programId = searchParams.get("programId") || null;

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchDashboardString());
    dispatch(fetchPrograms());
    dispatch(fetchSettings());
  }, [dispatch]);

  const { user } = useAuth();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"bug" | "suggestion">("bug");
  const [showJobPosting, setShowJobPosting] = useState(false);
  const [showApplyJob, setShowApplyJob] = useState(false);

  const { items } = useAppSelector((state) => state.programs);
  const settings = useAppSelector((state) => state.settings);
  const categoriesState = useAppSelector((state) => state.categories);
  const programState = useAppSelector((state) => state.programs);
  const categories = categoriesState.items;

  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    categories.length > 0 ? [categories[0].name] : []
  );

  const [showDialog, setShowDialog] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

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

  const handleViewCode = async () => {
    setShowDialog(true);
    await dispatch(viewProgram(selectedProgram._id));
  };

  useEffect(() => {
    if (programId && programState) {
      let { items } = programState;
      if (items.length > 0) {
        let selProg = items.filter((item) => item._id === programId);
        return setSelectedProgram(selProg[0]);
      }
    }
  }, [programId, programState]);

  useEffect(() => {
    if (isMobile && !programId) setIsSidebarOpen(true);
  }, [isMobile]);

  useEffect(() => {
    if (showDialog && selectedLanguage.length > 0) setIsOpen(true);
  }, [showDialog]);

  const handleCopyCode = async () => {
    if (selectedProgram.name === "") return;
    dispatch(copyProgram(selectedProgram._id));
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleProgramSelect = (program: Program) => {
    setSelectedProgram(program);
    if (window.innerWidth < 1280) setIsSidebarOpen(false);
  };

  const removeBackticks = (code: string) => code.replace(/`/g, "");

  return (
    <div className="min-h-[80vh] bg-[#f5f5f5]">
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setSelectedProgram={setSelectedProgram}
      />

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
            toggleCategory={() => {}}
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
                    ? settings?.item?.javaHeading
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
                    ? settings?.item?.pythonHeading
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
                    ? settings?.item?.htmlHeading
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
      <div className="pt-2 pb-1">
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
              ? HELLO_DEVELOPER.java
              : removeBackticks(selectedProgram.code?.java)
            : selectedLanguage === "python"
            ? selectedProgram.name === ""
              ? HELLO_DEVELOPER.python
              : removeBackticks(selectedProgram.code?.python)
            : selectedProgram.name === ""
            ? HELLO_DEVELOPER.html
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
