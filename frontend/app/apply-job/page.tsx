"use client";

import { useState, useEffect, useRef, ChangeEvent, useMemo } from "react";
import { ChevronDown, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchJobs } from "@/store/reducers/jobSlice";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Sidebar from "@/components/layout/sidebar";
import { useMediaQuery } from "react-responsive";
import { useAuth } from "@/hooks/useAuth"; // ADD THIS
import { toast } from "@/hooks/use-toast"; // ADD THIS
import ftpapi from "@/lib/ftpapi"; // ADD THIS
import { saveFile } from "../../utils/fileStoreInIdb"; // ADD THIS

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

  // ADD THESE
  const { user, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const jobsState = useAppSelector((state) => state.jobs);
  const jobs = jobsState.items;
  const jobsLoading = jobsState.loading;
  
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

  useEffect(() => {
    if (jobs.length === 0) {
      dispatch(fetchJobs());
    }
  }, [dispatch, jobs.length]);

  // ADD DRAFT FUNCTIONALITY
  const saveDraft = () => {
    const draftData = {
      selectedJob,
      coverLetter,
      fileName: uploadedFile?.name || "",
    };
    localStorage.setItem('jobApplicationDraft', JSON.stringify(draftData));
    toast({
      title: "Draft Saved",
      description: "Your application has been saved as draft.",
      variant: "success",
      duration: 3000,
    });
  };

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem('jobApplicationDraft');
      if (draft) {
        const draftData = JSON.parse(draft);
        setSelectedJob(draftData.selectedJob || "");
        setCoverLetter(draftData.coverLetter || "");
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
    console.log("Already on apply job page");
  };

  // REPLACE handleFileUpload WITH PROPER VALIDATION
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        setUploadedFile(null);
        event.target.value = "";
      } else if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive",
        });
        setUploadedFile(null);
        event.target.value = "";
      } else {
        setUploadedFile(file);
        setErrors({...errors, file: ""});
      }
    } else {
      setUploadedFile(null);
    }
  };

  const validate = () => {
    let tempErrors: { [key: string]: string } = {};
    if (!selectedJob) tempErrors.selectedJob = "Please select a job";
    if (!coverLetter.trim()) tempErrors.coverLetter = "Cover letter is required";
    if (!uploadedFile) tempErrors.file = "Please upload your resume (PDF)";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // REPLACE handleSubmit WITH REAL BACKEND INTEGRATION
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Find the selected job object
      const selectedJobObj = jobs.find(job => job.title === selectedJob);
      if (!selectedJobObj) {
        throw new Error("Selected job not found");
      }

      // Check authentication for non-anonymous applications
      if (!isAuthenticated || !user) {
        // Save application data and redirect to login
        let fileId = await saveFile(uploadedFile!);
        
        let applyFormData = {
          userId: null,
          jobId: selectedJobObj._id,
          coverLetter: coverLetter,
          fileId
        };

        localStorage.setItem('jobApplyData', JSON.stringify(applyFormData));
        return router.push('/userauth?fromApplyJob=true');
      }

      // Create form data for API submission
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('jobId', selectedJobObj._id);
      formData.append('coverLetter', coverLetter);
      formData.append('file', uploadedFile!, uploadedFile!.name);

      // Submit to backend
      const response = await ftpapi.post('/api/upload/apply', formData);

      if (response.status === 200) {
        toast({
          title: "Application Sent!",
          description: `Your application for ${selectedJob} has been submitted successfully.`,
          variant: "success",
          duration: 5000,
        });

        // Clear form
        setSelectedJob("");
        setCoverLetter("");
        setUploadedFile(null);
        setErrors({});
        
        // Clear draft
        localStorage.removeItem('jobApplicationDraft');
        
        // Optionally redirect
        // router.push("/jobs");
      } else {
        throw new Error("Application submission failed");
      }
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast({
        title: "Application Failed",
        description: error.message || "There was an error submitting your application. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setErrors({...errors, file: ""});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
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
        <div onClick={handleContentClick}>
          <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
            {/* Page Header */}
            <div className="mb-3 sm:mb-4 flex justify-between items-start">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  Apply for Job
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Complete your application and submit your resume
                </p>
              </div>
              
              {/* ADD LOAD DRAFT BUTTON */}
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
                        disabled={jobsLoading || isSubmitting}
                        className={`w-full h-10 sm:h-11 px-3 text-sm sm:text-base border border-gray-300 rounded-md appearance-none bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          errors.selectedJob ? "border-red-500" : ""
                        }`}
                      >
                        <option value="">
                          {jobsLoading ? "Loading jobs..." : "Select a job to apply for"}
                        </option>
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
                      maxLength={1000}
                      disabled={isSubmitting}
                      rows={isMobile ? 4 : 4}
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
                      Upload Resume *
                    </label>
                    <div className={`border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-blue-400 transition-colors bg-gray-50 ${
                      isSubmitting ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                    } ${errors.file ? "border-red-500" : ""}`}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="resume-upload"
                        disabled={isSubmitting}
                      />
                      
                      {!uploadedFile ? (
                        <div
                          onClick={isSubmitting ? undefined : handleFileClick}
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
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2 text-sm text-green-700 bg-green-50 py-2 sm:py-3 px-3 sm:px-4 rounded-lg border border-green-200">
                          <span className="font-medium truncate max-w-[200px]">✓ {uploadedFile.name}</span>
                          <button
                            type="button"
                            onClick={removeFile}
                            disabled={isSubmitting}
                            className="text-red-500 hover:text-red-700 ml-2 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    {errors.file && <p className="text-red-500 text-xs mt-1">{errors.file}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      Required: Upload your resume for the application
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={saveDraft}
                    className="flex-1 h-10 sm:h-11 text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    Save Draft
                  </Button>
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
                    disabled={isSubmitting || jobsLoading}
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