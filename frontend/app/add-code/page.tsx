"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { savedContributions } from "@/store/reducers/contributionSlice";
import { ArrowLeft, Code, Save, Send } from "lucide-react";
import { Highlight, themes } from "prism-react-renderer";
import Editor from "react-simple-code-editor";
//import CategorySelect from "@/custom/category-select";
import api from "@/lib/api";
import { BootstrapSwitch } from "@/components/ui/bootstrap-switch";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Sidebar from "@/components/layout/sidebar";
import { useMediaQuery } from "react-responsive";

// Define the Program type
type Program = {
  _id: string;
  name: string;
  description?: string;
  category?: string;
};

const AddCodePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [javacode, setJavacode] = useState("");
  const [pythoncode, setPythoncode] = useState("");
  const [htmlcode, setHtmlcode] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const router = useRouter();
  const dispatch = useAppDispatch();
  const rawIsMobile = useMediaQuery({ maxWidth: 640 });
  const isMobile = isMounted && rawIsMobile;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    // Load saved data from localStorage if returning from login
    const savedData = localStorage.getItem('addCodeData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setName(parsedData.name || "");
        setDescription(parsedData.description || "");
        setJavacode(parsedData.code?.java || "");
        setPythoncode(parsedData.code?.python || "");
        setHtmlcode(parsedData.code?.html || "");
        setSelectedCategory(parsedData.category || "");
        setIsAnonymous(parsedData.isAnonymous || false);
        localStorage.removeItem('addCodeData');
      } catch (error) {
        console.error("Error loading saved data:", error);
      }
    }

    if (isAuthenticated && user?.id) {
      dispatch(savedContributions(user.id));
    }
  }, [isAuthenticated, user, dispatch]);

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem('draftCodeData');
      if (draft) {
        const draftData = JSON.parse(draft);
        setName(draftData.name || "");
        setDescription(draftData.description || "");
        setJavacode(draftData.code?.java || "");
        setPythoncode(draftData.code?.python || "");
        setHtmlcode(draftData.code?.html || "");
        setSelectedCategory(draftData.category || "");
        setIsAnonymous(draftData.isAnonymous || false);
        toast({
          title: "Draft Loaded",
          description: "Your saved draft has been loaded.",
          variant: "success",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error loading draft:", error);
    }
  };

  // Handle program selection from sidebar
  const handleSelectProgram = (program: Program) => {
    router.push(`/?programId=${program._id}`);
  };

  // Handle closing sidebar when clicking on main content
  const handleContentClick = () => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  // Placeholder functions for job-related actions
  const handleShowPostJob = () => {
    router.push("/post-job");
  };

  const handleShowApplyJob = () => {
    router.push("/apply-job");
  };

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    const programData = {
      name,
      description,
      category: selectedCategory,
      code: {
        java: javacode,
        python: pythoncode,
        html: htmlcode,
      },
      copies: 0,
      bugfixes: 0,
      suggestions: 0,
      views: 0,
      featureRank: 0,
      isFeatured: false,
      isAnonymous
    };

    localStorage.setItem('draftCodeData', JSON.stringify(programData));
    toast({
      title: "Draft Saved",
      description: "Your code has been saved as a draft locally.",
      variant: "success",
      duration: 3000,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const programData = {
        name,
        description,
        category: selectedCategory,
        code: {
          java: javacode,
          python: pythoncode,
          html: htmlcode,
        },
        copies: 0,
        bugfixes: 0,
        suggestions: 0,
        views: 0,
        featureRank: 0,
        isFeatured: false,
        isAnonymous
      };

      if (!isAnonymous && !isAuthenticated) {
        localStorage.setItem('addCodeData', JSON.stringify(programData));
        return router.push('/login?fromAddCode=true');
      }

      const response = await api.post("/api/programs", programData);
      if (response.status === 201) {
        // Clear form data
        setName("");
        setDescription("");
        setJavacode("");
        setPythoncode("");
        setHtmlcode("");
        setSelectedCategory("");
        setIsAnonymous(false);
        
        // Clear any saved drafts
        localStorage.removeItem('draftCodeData');
        
        toast({
          title: "Code Submitted",
          description: "Your Code has been successfully submitted.",
          variant: "success",
          duration: 5000,
        });
        
        // Redirect to a success page or back to the main page
        router.push('/successpage '); // Adjust the route as needed
      }
    } catch (error: any) {
      setError(error.message || "There was an error submitting your contribution.");
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your contribution.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const highlightCode = (code: string, language: string) => (
    <Highlight theme={themes.oneLight} code={code} language={language}>
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

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Sidebar Component */}
      {isMobile && 
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          onSelectProgram={handleSelectProgram}
          onCloseSidebar={() => setIsSidebarOpen(false)}
          onShowPostJob={handleShowPostJob}
          onShowApplyJob={handleShowApplyJob}
        />}
      
      <div className="flex-1 pt-16 sm:pt-13">
        {/* Main content wrapper with proper padding for sidebar */}
        <div onClick={handleContentClick}>
          <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
            {/* Page Header */}
            <div className="mb-3 sm:mb-4 flex justify-between items-start">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  Add New Code
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Share your code snippets with the community
                </p>
              </div>
              
              {/* Load Draft Button */}
              <button
                type="button"
                onClick={loadDraft}
                className="text-sm px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors duration-200"
              >
                Load Draft
              </button>
            </div>

            {/* Form Container */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <form onSubmit={handleSubmit} className="p-3 sm:p-4 lg:p-6">
                <div className="space-y-4 sm:space-y-5">
                  {/* Title Input */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="title"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter a descriptive title for your code"
                      maxLength={200}
                      required
                      disabled={loading}
                      className="w-full h-10 sm:h-11 px-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">{name.length}/200 characters</p>
                  </div>

                  {/* Description Input */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={isMobile ? 4 : 6}
                      maxLength={5000}
                      required
                      disabled={loading}
                      className="resize-none w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Describe what your code does and how to use it"
                    />
                    <p className="text-xs text-gray-500 mt-1">{description.length}/5000 characters</p>
                  </div>

                  {/* Code Editors */}
                  <div className="space-y-4 sm:space-y-5">
                    {/* Java Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-semibold">Java</span>
                        Java Code
                      </label>
                      <div className="rounded-md border border-gray-300 overflow-hidden hover:border-blue-400 transition-colors bg-white">
                        <Editor
                          value={javacode}
                          onValueChange={setJavacode}
                          highlight={(code) => highlightCode(code, "java")}
                          padding={16}
                          disabled={loading}
                          style={{
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                            fontSize: "14px",
                            backgroundColor: "#fafafa",
                            minHeight: "120px",
                            outline: "none"
                          }}
                          placeholder="// Enter your Java code here..."
                        />
                      </div>
                    </div>

                    {/* Python Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">Python</span>
                        Python Code
                      </label>
                      <div className="rounded-md border border-gray-300 overflow-hidden hover:border-blue-400 transition-colors bg-white">
                        <Editor
                          value={pythoncode}
                          onValueChange={setPythoncode}
                          highlight={(code) => highlightCode(code, "python")}
                          padding={16}
                          disabled={loading}
                          style={{
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                            fontSize: "14px",
                            backgroundColor: "#fafafa",
                            minHeight: "120px",
                            outline: "none"
                          }}
                          placeholder="# Enter your Python code here..."
                        />
                      </div>
                    </div>

                    {/* HTML Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">HTML</span>
                        HTML Code
                      </label>
                      <div className="rounded-md border border-gray-300 overflow-hidden hover:border-blue-400 transition-colors bg-white">
                        <Editor
                          value={htmlcode}
                          onValueChange={setHtmlcode}
                          highlight={(code) => highlightCode(code, "html")}
                          padding={16}
                          disabled={loading}
                          style={{
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                            fontSize: "14px",
                            backgroundColor: "#fafafa",
                            minHeight: "120px",
                            outline: "none"
                          }}
                          placeholder="<!-- Enter your HTML code here... -->"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category Select - Uncommented if needed */}
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <CategorySelect
                      value={selectedCategory}
                      onChange={(e: any) => setSelectedCategory(e.target.value)}
                    />
                  </div> */}

                  {/* Anonymous Toggle */}
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <BootstrapSwitch 
                      checked={isAnonymous} 
                      onChange={(isChecked) => setIsAnonymous(isChecked)} 
                      label="Do you want your name to be publicly shown with the submitted code on the BeCopy website?" 
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <div className="text-red-800 text-sm">{error}</div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button
                    type="button"
                    onClick={handleSave}
                    variant="outline"
                    className="flex-1 h-10 sm:h-11 text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 h-10 sm:h-11 text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
                    disabled={loading}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 sm:h-11 text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Code
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile sidebar */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <div className="pb-2">
        <Footer />
      </div>
    </div>
  );
};

export default AddCodePage;