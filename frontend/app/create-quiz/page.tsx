"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
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

export default function CreateQuizPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    mode: "solo",
    questionCount: "10",
    difficulty: "any",
    questionType: "any",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuestionCountOpen, setIsQuestionCountOpen] = useState(false);
  const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);

  const isMobile = useMediaQuery({ maxWidth: 640 });

  const questionCounts = [
    { value: "5", label: "5 Questions" },
    { value: "10", label: "10 Questions" },
    { value: "15", label: "15 Questions" },
    { value: "20", label: "20 Questions" },
  ];

  const difficulties = [
    { value: "any", label: "Any Difficulty" },
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
  ];

  const modes = [
    { value: "solo", label: "Solo Practice", desc: "Practice on your own to improve your knowledge" },
    { value: "direct", label: "Direct Challenge", desc: "Challenge a specific friend" },
    { value: "group", label: "Group Challenge", desc: "Create a group quiz for multiple players" },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSelectProgram = (program: Program) => {
    router.push(`/?programId=${program._id}`);
  };

  const handleContentClick = () => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  const handleShowPostJob = () => {
    router.push("/post-job");
  };

  const handleShowApplyJob = () => {
    router.push("/apply-job");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleModeChange = (mode: string) => {
    setFormData({ ...formData, mode });
  };

  const handleQuestionTypeChange = (type: string) => {
    setFormData({ ...formData, questionType: type });
  };

  const handleDropdownSelect = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (field === "questionCount") setIsQuestionCountOpen(false);
    if (field === "difficulty") setIsDifficultyOpen(false);
  };

  const validate = () => {
    let tempErrors: { [key: string]: string } = {};
    if (!formData.title.trim()) tempErrors.title = "Quiz title is required";
    if (!formData.description.trim()) tempErrors.description = "Description is required";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      console.log("Quiz data:", formData);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert("Quiz created successfully!");
      router.push("/quiz");
    } catch (error) {
      console.error("Error creating quiz:", error);
      alert("Error creating quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedLabel = (options: any[], value: string) => {
    return options.find(option => option.value === value)?.label || "";
  };

  const getSelectedMode = () => {
    return modes.find(mode => mode.value === formData.mode);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col overflow-hidden">
      <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Sidebar Component */}
      {isMobile && (
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          onSelectProgram={handleSelectProgram}
          onCloseSidebar={() => setIsSidebarOpen(false)}
          onShowPostJob={handleShowPostJob}
          onShowApplyJob={handleShowApplyJob}
        />
      )}

      <div className="flex-1 pt-16 sm:pt-20 overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${
            isSidebarOpen && !isMobile ? 'xl:ml-64' : ''
          }`}
          onClick={handleContentClick}
        >
          <div className="h-full max-w-4xl mx-auto px-3 sm:px-6 py-3 overflow-y-auto">
            {/* Page Header */}
            <div className="mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Create New Quiz
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Choose your quiz settings and challenge friends or practice solo
              </p>
            </div>

            {/* Form Container */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
              <form onSubmit={handleSubmit} className="p-4 sm:p-5">
                <div className="space-y-4">
                  
                  {/* Title */}
                  <div className="relative">
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter quiz title"
                      className={`h-11 px-4 text-sm bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 ${
                        errors.title ? "border-red-500" : ""
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg pointer-events-none"></div>
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                  </div>

                  {/* Description */}
                  <div className="relative">
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Add a brief description"
                      rows={3}
                      className={`px-4 py-3 text-sm bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 placeholder-gray-400 ${
                        errors.description ? "border-red-500" : ""
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg pointer-events-none"></div>
                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                  </div>

                  {/* Quiz Mode Tabs */}
                  <div>
                    <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100/80 rounded-lg">
                      {modes.map((mode) => (
                        <button
                          key={mode.value}
                          type="button"
                          onClick={() => handleModeChange(mode.value)}
                          className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
                            formData.mode === mode.value
                              ? "bg-white text-blue-600 shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {getSelectedMode()?.desc}
                    </p>
                  </div>

                  {/* Questions Configuration */}
                  <div>
                    <h3 className="text-base font-semibold mb-3 text-gray-800">
                      Questions Configuration
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Question Count Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsQuestionCountOpen(!isQuestionCountOpen)}
                          className="w-full h-11 px-4 text-sm bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex items-center justify-between hover:bg-white/70"
                        >
                          <span className="text-gray-700">
                            {getSelectedLabel(questionCounts, formData.questionCount)}
                          </span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                            isQuestionCountOpen ? "rotate-180" : ""
                          }`} />
                        </button>
                        
                        {isQuestionCountOpen && (
                          <div className="absolute top-12 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                            {questionCounts.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleDropdownSelect("questionCount", option.value)}
                                className={`w-full px-4 py-3 text-sm text-left hover:bg-blue-50 transition-colors duration-150 ${
                                  formData.questionCount === option.value ? "bg-blue-50 text-blue-600" : "text-gray-700"
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Difficulty Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsDifficultyOpen(!isDifficultyOpen)}
                          className="w-full h-11 px-4 text-sm bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex items-center justify-between hover:bg-white/70"
                        >
                          <span className="text-gray-700">
                            {getSelectedLabel(difficulties, formData.difficulty)}
                          </span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                            isDifficultyOpen ? "rotate-180" : ""
                          }`} />
                        </button>
                        
                        {isDifficultyOpen && (
                          <div className="absolute top-12 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                            {difficulties.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleDropdownSelect("difficulty", option.value)}
                                className={`w-full px-4 py-3 text-sm text-left hover:bg-blue-50 transition-colors duration-150 ${
                                  formData.difficulty === option.value ? "bg-blue-50 text-blue-600" : "text-gray-700"
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Question Type Radio Buttons */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-3 text-gray-700">
                        Question Type
                      </label>
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {[
                          { value: "any", label: "Any Type" },
                          { value: "multiple", label: "Multiple Choice" },
                          { value: "truefalse", label: "True/False" },
                        ].map((type) => (
                          <div key={type.value} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={type.value}
                              name="questionType"
                              value={type.value}
                              checked={formData.questionType === type.value}
                              onChange={(e) => handleQuestionTypeChange(e.target.value)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor={type.value} className="text-sm text-gray-700 cursor-pointer">
                              {type.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Create Button */}
                <div className="mt-6">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-11 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Creating Quiz...</span>
                      </div>
                    ) : (
                      "Create Quiz"
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

      {/* Click outside to close dropdowns */}
      {(isQuestionCountOpen || isDifficultyOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsQuestionCountOpen(false);
            setIsDifficultyOpen(false);
          }}
        />
      )}

      {/* Footer */}
      <div className="shrink-0 mb-2">
        <Footer />
      </div>
    </div>
  );
}