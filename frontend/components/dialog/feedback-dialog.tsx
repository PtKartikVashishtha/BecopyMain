"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  newContributions,
  savedContributions,
} from "@/store/reducers/contributionSlice";
import { X } from "lucide-react";
import { Highlight, themes } from "prism-react-renderer";
import Editor from "react-simple-code-editor";
import { useToast } from "@/hooks/use-toast";
import { Program } from "@/types";
import { motion } from "framer-motion";

interface FeedbackFormProps {
  type: "bug" | "suggestion";
  programId: string;
  open: boolean;
  selectedProgram: Program;
  onOpenChange: (open: boolean) => void;
}

const FeedbackDialog = ({
  type,
  programId,
  open,
  onOpenChange,
  selectedProgram,
}: FeedbackFormProps) => {
  const { isAuthenticated, user } = useAuth();
  const [javacode, setJavacode] = useState("");
  const [pythoncode, setPythoncode] = useState("");
  const [htmlcode, setHtmlcode] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("java");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  const savedContributionItems = useAppSelector(
    (state) => state.contributors?.savedContributions || []
  );

  // Separate useEffect for loading saved contributions - only when dialog opens
  useEffect(() => {
    if (open && isAuthenticated && user?.id) {
      dispatch(savedContributions(user.id));
    }
  }, [open, isAuthenticated, user?.id, dispatch]);

  const formatCode = (code: string) => code.replaceAll("    ", "  ");

  // Initialize form data only when dialog opens - using useRef to track if already initialized
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsInitialized(false);
      return;
    }
    
    if (isInitialized) return; // Prevent re-initialization
    
    const saved = savedContributionItems.find(
      (item: any) => item.programId === programId && item.type === type
    );
    
    if (saved) {
      setDescription(saved.description || "");
      setJavacode(saved.code?.java || "");
      setPythoncode(saved.code?.python || "");
      setHtmlcode(saved.code?.html || "");
    } else {
      // Only set initial values when no saved contribution exists
      setDescription("");
      setJavacode(selectedProgram?.code?.java || "");
      setPythoncode(selectedProgram?.code?.python || "");
      setHtmlcode(selectedProgram?.code?.html || "");
    }
    
    setIsInitialized(true);
  }, [open, savedContributionItems, programId, type, isInitialized, selectedProgram?.code?.java, selectedProgram?.code?.python, selectedProgram?.code?.html]);

  const handleClose = () => {
    onOpenChange(false);
    setError("");
  };

  // Fixed description change handler
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    console.log("Description changing:", value); // Debug log
    setDescription(value);
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");

    if (!isAuthenticated) {
      localStorage.setItem('addContributionData', JSON.stringify({
        useremail: '',
        type,
        programId,
        status: "saved",
        code: { java: javacode, python: pythoncode, html: htmlcode },
        description,
      }));
      return router.push('/login?fromAddContribution=true');
    }

    try {
      const contributionData = {
        useremail: user?.email,
        type,
        programId,
        status: "saved",
        code: { java: javacode, python: pythoncode, html: htmlcode },
        description,
      };

      await dispatch(newContributions(contributionData)).unwrap();

      onOpenChange(false);
      toast({
        title: "Contribution Saved",
        description: "Your contribution has been saved successfully.",
        variant: "default",
        duration: 5000,
      });

    } catch (error: any) {
      setError(error?.message || "There was an error saving your contribution.");
      toast({
        title: "Save Failed",
        description: error?.message || "There was an error saving your contribution.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    if (!isAuthenticated) {
      localStorage.setItem('addContributionData', JSON.stringify({
        useremail: '',
        type,
        programId,
        status: "pending",
        code: { java: javacode, python: pythoncode, html: htmlcode },
        description,
      }));
      return router.push('/login?fromAddContribution=true');
    }

    try {
      const contributionData = {
        useremail: user?.email,
        type,
        programId,
        status: "pending",
        code: { java: javacode, python: pythoncode, html: htmlcode },
        description,
      };

      await dispatch(newContributions(contributionData)).unwrap();

      onOpenChange(false);
      toast({
        title: "Contribution Submitted",
        description: "Your contribution has been submitted successfully.",
        variant: "default",
        duration: 5000,
      });

    } catch (error: any) {
      setError(error?.message || "There was an error submitting your contribution.");
      toast({
        title: "Submission Failed",
        description: error?.message || "There was an error submitting your contribution.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const highlightCode = (code: string, language: string) => (
    <Highlight
      theme={themes.oneLight}
      code={formatCode(code)}
      language={language}
    >
      {({ tokens, getLineProps, getTokenProps }) => (
        <>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </>
      )}
    </Highlight>
  );

  const getCurrentCode = () => {
    switch (activeTab) {
      case "java": return javacode;
      case "python": return pythoncode;
      case "html": return htmlcode;
      default: return javacode;
    }
  };

  const setCurrentCode = (code: string) => {
    switch (activeTab) {
      case "java": setJavacode(code); break;
      case "python": setPythoncode(code); break;
      case "html": setHtmlcode(code); break;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 p-2">
      <div className="h-full flex items-center justify-center">
        <motion.div
          drag
          dragConstraints={{ left: -50, right: 50, top: -30, bottom: 30 }}
          className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl h-[90vh] border border-gray-200"
        >
          <button
            className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 z-10"
            onClick={handleClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="cursor-move p-3 border-b">
              <h2 className="text-base font-medium text-gray-900">
                {type === "bug" ? "Report a Bug" : "Suggest Improvement"}
              </h2>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-3 overflow-hidden">
              <div className="h-full flex flex-col">
                {/* Description - Fixed */}
                <div className="mb-3">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={handleDescriptionChange}
                    placeholder={
                      type === "bug"
                        ? "Describe the bug you encountered..."
                        : "Describe your improvement suggestion..."
                    }
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {description.length}/5000 characters
                  </div>
                </div>

                {/* Language Tabs */}
                <div className="flex border-b border-gray-200 mb-3">
                  {[
                    { key: "java", label: "Java" },
                    { key: "python", label: "Python" },
                    { key: "html", label: "HTML" }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveTab(key)}
                      className={`px-3 py-1 text-xs font-medium border-b-2 transition-colors ${
                        activeTab === key
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Code Editor */}
                <div className="flex-1 border border-gray-300 rounded bg-white overflow-hidden">
                  <Editor
                    value={getCurrentCode()}
                    onValueChange={setCurrentCode}
                    highlight={(code) => highlightCode(code, activeTab)}
                    padding={10}
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: "11px",
                      backgroundColor: "white",
                      color: "#1f2937",
                      height: "100%",
                      overflow: "auto",
                    }}
                    placeholder={`Enter ${activeTab} code here...`}
                  />
                </div>

                {error && (
                  <div className="text-red-500 text-xs mt-2">{error}</div>
                )}

                {/* Buttons */}
                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading || !description.trim()}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-sm py-2 px-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !description.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FeedbackDialog;