"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Highlight, themes } from "prism-react-renderer";
import Editor from "react-simple-code-editor";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useMediaQuery } from "react-responsive";

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

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const isMobile = useMediaQuery({ maxWidth: 640 });

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
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
        <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        {/* Main Content */}
        <div className="flex-1 pt-16 sm:pt-12">
            <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-2">
            {/* Page Header */}
            <div className="mb-3 sm:mb-4">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Add Code</h1>
                <p className="text-sm text-gray-600 mt-1">
                Share your code snippets with the BeCopy community
                </p>
            </div>

            {/* Form Container */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <form onSubmit={handleSubmit} className="p-3 sm:p-4 lg:p-6">
                <div className="space-y-3 sm:space-y-4">
                    
                    {/* Title */}
                    <div>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Title *"
                        maxLength={200}
                        required
                        className="w-full h-9 sm:h-10 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ color: "gray" }}
                    />
                    </div>

                    {/* Description */}
                    <div>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        maxLength={5000}
                        required
                        placeholder="Description *"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 resize-none"
                        style={{ color: "gray" }}
                    />
                    </div>

                    {/* Code Editors */}
                    <div className="space-y-3 sm:space-y-4">
                    {/* Java */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Java Code</label>
                        <div className="rounded-md border bg-muted">
                        <Editor
                            className="text-sm"
                            value={javacode}
                            onValueChange={setJavacode}
                            highlight={(code) => highlightCode(code, "java")}
                            padding={15}
                            style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: "14px",
                            backgroundColor: "white",
                            minHeight: "70px",
                            outline: "none",
                            }}
                            placeholder="Enter Java code here..."
                        />
                        </div>
                    </div>

                    {/* Python */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Python Code</label>
                        <div className="rounded-md border bg-muted">
                        <Editor
                            className="text-sm"
                            value={pythoncode}
                            onValueChange={setPythoncode}
                            highlight={(code) => highlightCode(code, "python")}
                            padding={15}
                            style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: "14px",
                            backgroundColor: "white",
                            minHeight: "70px",
                            outline: "none",
                            }}
                            placeholder="Enter Python code here..."
                        />
                        </div>
                    </div>

                    {/* HTML */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">HTML Code</label>
                        <div className="rounded-md border bg-muted">
                        <Editor
                            className="text-sm"
                            value={htmlcode}
                            onValueChange={setHtmlcode}
                            highlight={(code) => highlightCode(code, "html")}
                            padding={15}
                            style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: "14px",
                            backgroundColor: "white",
                            minHeight: "70px",
                            outline: "none",
                            }}
                            placeholder="Enter HTML code here..."
                        />
                        </div>
                    </div>
                    </div>

                    {/* Anonymous Toggle */}
                    <div className="flex items-center space-x-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    <span className="text-sm text-gray-700">
                        Do you want your name to be publicly shown with the submitted code?
                    </span>
                    </div>

                    {/* Error Message */}
                    {error && <p className="text-red-500 text-xs">{error}</p>}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4 sm:mt-6">
                    <button
                    type="button"
                    onClick={handleSave}
                    className="flex-1 h-9 sm:h-10 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md"
                    disabled={loading}
                    >
                    Save as Draft
                    </button>
                    <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-9 sm:h-10 text-sm font-medium rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                    {loading ? (
                        <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                        </div>
                    ) : (
                        "Submit Code"
                    )}
                    </button>
                </div>
                </form>
            </div>
            </div>
        </div>

        {/* Footer */}
        <div className="pb-2">
            <Footer />
        </div>
    </div>
  )
};

export default AddCodePage;
