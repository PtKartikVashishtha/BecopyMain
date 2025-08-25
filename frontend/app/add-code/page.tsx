"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Highlight, themes } from "prism-react-renderer";
import Editor from "react-simple-code-editor";
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
  const [javacode, setJavacode] = useState("");
  const [pythoncode, setPythoncode] = useState("");
  const [htmlcode, setHtmlcode] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const isMobile = useMediaQuery({ maxWidth: 640 });

  const categories = [
    { value: "", label: "Select a category", icon: "📁" },
    { value: "web-development", label: "Web Development", icon: "🌐" },
    { value: "mobile-development", label: "Mobile Development", icon: "📱" },
    { value: "data-science", label: "Data Science", icon: "📊" },
    { value: "algorithms", label: "Algorithms", icon: "⚡" },
    { value: "machine-learning", label: "Machine Learning", icon: "🤖" },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        isAnonymous,
      };

      console.log("Submitting:", programData);
      alert("Code submitted successfully!");

      // Reset form
      setName("");
      setDescription("");
      setJavacode("");
      setPythoncode("");
      setHtmlcode("");
    } catch (error: any) {
      setError(error.message || "There was an error submitting your contribution.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    console.log("Saving draft...");
    alert("Draft saved!");
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
    console.log("Show post job");
    // Add your post job logic here
  };

  const handleShowApplyJob = () => {
    console.log("Show apply job");
    // Add your apply job logic here
  };

  const handleCategorySelect = (value: string) => {
    setSelectedCategory(value);
    setIsDropdownOpen(false);
  };

  const selectedCategoryObj = categories.find(cat => cat.value === selectedCategory) || categories[0];

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

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col overflow-hidden">
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

      {/* Main Content */}
      <div className="flex-1 pt-16 sm:pt-20 overflow-hidden">
        {/* Main content wrapper with proper padding for sidebar */}
        <div 
          className={`h-full transition-all duration-300 ${
            isSidebarOpen && !isMobile ? 'xl:ml-64' : ''
          }`}
          onClick={handleContentClick}
        >
          <div className="h-full max-w-6xl mx-auto px-3 sm:px-6 py-3 overflow-y-auto">
            {/* Page Header */}
            <div className="mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Add Code
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Share your code snippets with the BeCopy community
              </p>
            </div>

            {/* Form Container - Enhanced Design */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
              <form onSubmit={handleSubmit} className="p-4 sm:p-5">
                <div className="space-y-4">
                  
                  {/* Title and Category - Side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Title *"
                        maxLength={200}
                        required
                        className="w-full h-11 px-4 text-sm bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg pointer-events-none"></div>
                    </div>
                    
                    {/* Enhanced Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full h-11 px-4 text-sm bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex items-center justify-between hover:bg-white/70"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-base">{selectedCategoryObj.icon}</span>
                          <span className={selectedCategory ? "text-gray-900" : "text-gray-400"}>
                            {selectedCategoryObj.label}
                          </span>
                        </div>
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isDropdownOpen ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Dropdown Menu */}
                      {isDropdownOpen && (
                        <div className="absolute top-12 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                          {categories.map((category, index) => (
                            <button
                              key={category.value}
                              type="button"
                              onClick={() => handleCategorySelect(category.value)}
                              className={`w-full px-4 py-3 text-sm text-left hover:bg-blue-50 transition-colors duration-150 flex items-center space-x-3 ${
                                selectedCategory === category.value ? "bg-blue-50 text-blue-600" : "text-gray-700"
                              } ${index === 0 ? "text-gray-400" : ""}`}
                            >
                              <span className="text-base">{category.icon}</span>
                              <span>{category.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg pointer-events-none"></div>
                    </div>
                  </div>

                  {/* Description - Enhanced */}
                  <div className="relative">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      maxLength={5000}
                      required
                      placeholder="Description *"
                      className="w-full px-4 py-3 text-sm bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 placeholder-gray-400"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg pointer-events-none"></div>
                  </div>

                  {/* Code Editors - Horizontal Layout for Desktop */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Java */}
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                        <span className="text-orange-600">☕</span>
                        <span>Java</span>
                      </label>
                      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white/70 backdrop-blur-sm shadow-sm">
                        <Editor
                          className="text-xs"
                          value={javacode}
                          onValueChange={setJavacode}
                          highlight={(code) => highlightCode(code, "java")}
                          padding={12}
                          style={{
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                            fontSize: "11px",
                            backgroundColor: "transparent",
                            minHeight: "120px",
                            outline: "none",
                          }}
                          placeholder="// Java code here..."
                        />
                      </div>
                    </div>

                    {/* Python */}
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                        <span className="text-blue-600">🐍</span>
                        <span>Python</span>
                      </label>
                      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white/70 backdrop-blur-sm shadow-sm">
                        <Editor
                          className="text-xs"
                          value={pythoncode}
                          onValueChange={setPythoncode}
                          highlight={(code) => highlightCode(code, "python")}
                          padding={12}
                          style={{
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                            fontSize: "11px",
                            backgroundColor: "transparent",
                            minHeight: "120px",
                            outline: "none",
                          }}
                          placeholder="# Python code here..."
                        />
                      </div>
                    </div>

                    {/* HTML */}
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                        <span className="text-red-600">🌐</span>
                        <span>HTML</span>
                      </label>
                      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white/70 backdrop-blur-sm shadow-sm">
                        <Editor
                          className="text-xs"
                          value={htmlcode}
                          onValueChange={setHtmlcode}
                          highlight={(code) => highlightCode(code, "html")}
                          padding={12}
                          style={{
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                            fontSize: "11px",
                            backgroundColor: "transparent",
                            minHeight: "120px",
                            outline: "none",
                          }}
                          placeholder="<!-- HTML code here... -->"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Anonymous Toggle - Enhanced */}
                  <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-700 text-sm font-medium">Show name publicly</span>
                      <span className="text-xs text-gray-500">Toggle to remain anonymous</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-sm"></div>
                    </label>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm flex items-center space-x-2">
                        <span>⚠️</span>
                        <span>{error}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons - Enhanced */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex-1 h-11 text-sm font-medium border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                    disabled={loading}
                  >
                    <span>💾</span>
                    <span>Save as Draft</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-11 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span>🚀</span>
                        <span>Submit Code</span>
                      </div>
                    )}
                  </button>
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

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      {/* Footer */}
      <div className="shrink-0">
        <Footer />
      </div>
    </div>
  );
};

export default AddCodePage;