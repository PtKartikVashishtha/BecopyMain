"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronDown, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchJobs } from "@/store/reducers/jobSlice";
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

export default function ApplyJobPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [selectedJob, setSelectedJob] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const jobsState = useAppSelector((state) => state.jobs);
  const jobs = jobsState.items;
  
  const rawIsMobile = useMediaQuery({ maxWidth: 640 });
  const isMobile = isMounted && rawIsMobile;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (jobs.length === 0 && isMounted) {
      dispatch(fetchJobs());
    }
  }, [dispatch, jobs.length, isMounted]);

  // Memoize calculations to improve performance
  const characterCount = useMemo(() => coverLetter.length, [coverLetter]);
  
  // Prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
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
    // Already on apply job page, could show a message or do nothing
    console.log("Already on apply job page");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file && file.type === "application/pdf" && file.size <= 10485760) {
      setUploadedFile(file);
    } else {
      alert("Please upload a PDF file under 10MB");
    }
  };

  const validate = () => {
    let tempErrors: { [key: string]: string } = {};
    if (!selectedJob) tempErrors.selectedJob = "Please select a job";
    if (!coverLetter.trim()) tempErrors.coverLetter = "Cover letter is required";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      console.log("Job application submitted:", {
        job: selectedJob,
        coverLetter,
        resume: uploadedFile,
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert("Application submitted successfully!");
      router.push("/jobs"); // Navigate to jobs page or wherever you want
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Error submitting application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

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
        <div 
          onClick={handleContentClick}
        >
          <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
            {/* Page Header */}
            <div className="mb-3 sm:mb-4">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                Apply for Job
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Complete your application and submit your resume
              </p>
            </div>

            {/* Form Container */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <form onSubmit={handleSubmit} className="p-3 sm:p-4 lg:p-6">
                <div className="space-y-4 sm:space-y-5">
                  {/* Job Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Job Position *
                    </label>
                    <div className="relative">
                      <select
                        value={selectedJob}
                        onChange={(e) => {
                          setSelectedJob(e.target.value);
                          setErrors({...errors, selectedJob: ""});
                        }}
                        className={`w-full h-10 sm:h-11 px-3 text-sm sm:text-base border border-gray-300 rounded-md appearance-none bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer ${
                          errors.selectedJob ? "border-red-500" : ""
                        }`}
                      >
                        <option value="">Select a job to apply for</option>
                        {jobs.map((job) => (
                          <option key={job._id} value={job.title}>
                            {job.title} - {job.company}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
                    </div>
                    {errors.selectedJob && <p className="text-red-500 text-xs mt-1">{errors.selectedJob}</p>}
                  </div>

                  {/* Cover Letter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Letter *
                    </label>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => {
                        setCoverLetter(e.target.value);
                        setErrors({...errors, coverLetter: ""});
                      }}
                      placeholder="Briefly explain why you're a good fit for this role..."
                      rows={isMobile ? 4 : 4}
                      maxLength={1000}
                      className={`w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500 text-sm ${
                        errors.coverLetter ? "border-red-500" : ""
                      }`}
                    />
                    {errors.coverLetter && <p className="text-red-500 text-xs mt-1">{errors.coverLetter}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      {characterCount}/1000 characters
                    </p>
                  </div>

                  {/* Resume Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Resume
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-blue-400 transition-colors bg-gray-50">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="resume-upload"
                      />
                      
                      {!uploadedFile ? (
                        <label
                          htmlFor="resume-upload"
                          className="cursor-pointer flex flex-col items-center space-y-2 sm:space-y-3"
                        >
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                          </div>
                          <div className="text-gray-600">
                            <span className="text-gray-800 font-medium text-sm sm:text-base">
                              Click to upload resume
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500">PDF only (MAX. 10MB)</p>
                        </label>
                      ) : (
                        <div className="flex items-center justify-center space-x-2 text-sm text-green-700 bg-green-50 py-2 sm:py-3 px-3 sm:px-4 rounded-lg border border-green-200">
                          <span className="font-medium">✓ {uploadedFile.name}</span>
                          <button
                            type="button"
                            onClick={removeFile}
                            className="text-red-500 hover:text-red-700 ml-2 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Upload your resume for a better application
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1 h-10 sm:h-11 text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 sm:h-11 text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Applying...</span>
                      </div>
                    ) : (
                      "Submit Application"
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
}