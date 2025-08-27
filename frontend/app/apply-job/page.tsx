"use client";

import { useState, useEffect, useRef, ChangeEvent, useMemo } from "react";
import { ChevronDown, Upload, X, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchJobs } from "@/store/reducers/jobSlice";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Sidebar from "@/components/layout/sidebar";
import { useMediaQuery } from "react-responsive";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import ftpapi from "@/lib/ftpapi";
import { formatDate } from "date-fns";

// Define the Program type
type Program = {
  _id: string;
  name: string;
  description?: string;
  category?: string;
};

// Define draft data structure
interface DraftData {
  selectedJob: string;
  coverLetter: string;
  fileName: string;
  timestamp: number;
}

export default function ApplyJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [selectedJob, setSelectedJob] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Enhanced draft state management
  const [hasDraft, setHasDraft] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  const { user, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const jobsState = useAppSelector((state) => state.jobs);
  const jobs = jobsState.items || [];
  const jobsLoading = jobsState.loading;
  
  const rawIsMobile = useMediaQuery({ maxWidth: 640 });
  const isMobile = isMounted && rawIsMobile;

  const characterCount = useMemo(() => coverLetter.length, [coverLetter]);

  // Check if form has data for draft saving
  const hasFormData = useMemo(() => {
    return selectedJob.trim() !== "" || coverLetter.trim() !== "" || uploadedFile !== null;
  }, [selectedJob, coverLetter, uploadedFile]);

  useEffect(() => {
    setIsMounted(true);
    // Check for existing draft on mount
    checkForExistingDraft();
  }, []);

  useEffect(() => {
    if (jobs.length === 0 && isMounted) {
      dispatch(fetchJobs()).catch((err) => console.error("Fetch jobs failed:", err));
    }
  }, [dispatch, jobs.length, isMounted]);

  // Pre-fill job selection based on URL parameters
  useEffect(() => {
    if (isMounted && searchParams) {
      const jobTitle = searchParams.get('jobTitle');
      const jobId = searchParams.get('jobId');
      
      if (jobTitle && jobs.length > 0) {
        // Find the job by title or ID
        const decodedJobTitle = decodeURIComponent(jobTitle);
        const matchingJob = jobs.find(job => 
          job.title === decodedJobTitle || job._id === jobId
        );
        
        if (matchingJob) {
          setSelectedJob(matchingJob.title);
        }
      }
    }
  }, [isMounted, searchParams, jobs]);

  // Auto-save draft when form data changes (with debounce)
  useEffect(() => {
    if (!hasFormData || !isMounted) return;

    const timeoutId = setTimeout(() => {
      if (hasFormData) {
        saveDraftSilently();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [selectedJob, coverLetter, uploadedFile?.name, hasFormData, isMounted]);

  const checkForExistingDraft = () => {
    try {
      const savedDraft = (window as any).jobApplicationDraft;
      if (savedDraft && savedDraft.timestamp) {
        setHasDraft(true);
        setLastSavedTime(new Date(savedDraft.timestamp));
      }
    } catch (error) {
      console.error('Error checking for existing draft:', error);
    }
  };

  const saveDraftSilently = () => {
    if (!hasFormData) return;
    
    try {
      const draft: DraftData = {
        selectedJob,
        coverLetter,
        fileName: uploadedFile?.name || "",
        timestamp: Date.now(),
      };
      
      (window as any).jobApplicationDraft = draft;
      setHasDraft(true);
      setLastSavedTime(new Date());
    } catch (error) {
      console.error('Error auto-saving draft:', error);
    }
  };

  const saveDraft = () => {
    if (!hasFormData) {
      toast({
        title: "Nothing to Save",
        description: "Please fill in some information before saving a draft.",
        variant: "default",
        duration: 2000,
      });
      return;
    }

    setIsSavingDraft(true);

    // Use setTimeout to simulate async operation and show loading state
    setTimeout(() => {
      try {
        const draft: DraftData = {
          selectedJob,
          coverLetter,
          fileName: uploadedFile?.name || "",
          timestamp: Date.now(),
        };
        
        // Store in memory object instead of sessionStorage
        window.jobApplicationDraft = draft;
        setHasDraft(true);
        setLastSavedTime(new Date());
        
        toast({
          title: "Draft Saved Successfully",
          description: "Your application has been saved in memory for this session.",
          variant: "success",
          duration: 3000,
        });
      } catch (error) {
        toast({
          title: "Failed to Save Draft",
          description: "There was an error saving your draft. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      } finally {
        setIsSavingDraft(false);
      }
    }, 500);
  };

  const loadDraft = () => {
    setIsLoadingDraft(true);

    // Use setTimeout to simulate async operation and show loading state
    setTimeout(() => {
      try {
        const savedDraft = (window as any).jobApplicationDraft;
        if (!savedDraft) {
          toast({
            title: "No Draft Found",
            description: "No saved draft found in current session.",
            variant: "default",
            duration: 2000,
          });
          setIsLoadingDraft(false);
          return;
        }

        const draftData: DraftData = savedDraft;
        
        // Load the draft data
        setSelectedJob(draftData.selectedJob || "");
        setCoverLetter(draftData.coverLetter || "");
        
        // Clear any existing errors
        setErrors({});
        
        toast({
          title: "Draft Loaded Successfully",
          description: `Draft from ${new Date(draftData.timestamp).toLocaleString()} loaded. Please re-upload your resume if needed.`,
          variant: "success",
          duration: 4000,
        });
      } catch (error) {
        console.error('Error loading draft:', error);
        toast({
          title: "Failed to Load Draft",
          description: "There was an error loading your draft. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      } finally {
        setIsLoadingDraft(false);
      }
    }, 300);
  };

  const clearDraft = () => {
    try {
      delete (window as any).jobApplicationDraft;
      setHasDraft(false);
      setLastSavedTime(null);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  };

  const resetForm = () => {
    setSelectedJob("");
    setCoverLetter("");
    setUploadedFile(null);
    setErrors({});
    clearDraft();
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    toast({
      title: "Form Reset",
      description: "All form data has been cleared.",
      variant: "success",
      duration: 2000,
    });
  };

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
    console.log("Already on apply job page");
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      // Validate file type
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file only.",
          variant: "destructive",
          duration: 3000,
        });
        setUploadedFile(null);
        event.target.value = "";
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive",
          duration: 3000,
        });
        setUploadedFile(null);
        event.target.value = "";
        return;
      }
      
      setUploadedFile(file);
      setErrors(prev => ({...prev, file: ""}));
    } else {
      setUploadedFile(null);
    }
  };

  const validate = () => {
    const tempErrors: { [key: string]: string } = {};
    
    if (!selectedJob.trim()) {
      tempErrors.selectedJob = "Please select a job position";
    }
    
    if (!coverLetter.trim()) {
      tempErrors.coverLetter = "Cover letter is required";
    } else if (coverLetter.trim().length < 50) {
      tempErrors.coverLetter = "Cover letter should be at least 50 characters long";
    }
    
    if (!uploadedFile) {
      tempErrors.file = "Please upload your resume (PDF format only)";
    }
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      toast({
        title: "Form Validation Failed",
        description: "Please fix the errors below and try again.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit your application.",
        variant: "destructive",
        duration: 4000,
      });
      router.push('/userauth?fromApplyJob=true');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedJobObj = jobs.find(job => job.title === selectedJob);
      if (!selectedJobObj) {
        throw new Error("Selected job not found. Please refresh the page and try again.");
      }

      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('jobId', selectedJobObj._id);
      formData.append('coverLetter', coverLetter.trim());
      formData.append('file', uploadedFile!, uploadedFile!.name);

      const response = await ftpapi.post('/api/upload/apply', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });

      if (response.status === 200 || response.status === 201) {
        toast({
          title: "Application Submitted Successfully!",
          description: `Your application for "${selectedJob}" has been submitted. You'll receive a confirmation email shortly.`,
          variant: "success",
          duration: 5000,
        });

        // Clear form and draft after successful submission
        resetForm();
        
        // Redirect to jobs page after a delay
        setTimeout(() => {
          router.push('/jobs');
        }, 2000);
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (error: any) {
      console.error("Error submitting application:", error);
      
      let errorMessage = "There was an error submitting your application. Please try again.";
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timeout. Please check your connection and try again.";
      } else if (error.response?.status === 413) {
        errorMessage = "File too large. Please upload a smaller resume file.";
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid application data. Please check your inputs and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Application Submission Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setErrors(prev => ({...prev, file: ""}));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileClick = () => {
    if (!isSubmitting) {
      fileInputRef.current?.click();
    }
  };

  // Don't render until mounted
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {isMobile && (
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          onSelectProgram={handleSelectProgram}
          onCloseSidebar={() => setIsSidebarOpen(false)}
          onShowJobPosting={handleShowPostJob}
          onShowApplyJob={handleShowApplyJob}
          expandedCategories={[]}
          toggleCategory={function (name: string): void {
            console.log("Toggle category:", name);
          }}
        />
      )}
      
      {/* Fixed height container - fit to single screen */}
      <div className="flex-1 pt-16 sm:pt-20 h-[calc(100vh-4rem)] sm:h-[calc(100vh-2.5rem)]">
        <div onClick={handleContentClick} className="h-full overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2 sm:py-3">
            {/* Header with actions - compressed */}
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start gap-3">
              <div>
                <div className="text-lg sm:text-3xl font-bold text-gray-900">
                  Apply for Job
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Complete your application and submit your resume • {jobs.length} jobs available
                  {lastSavedTime && (
                    <span className="block text-xs text-blue-600 mt-1">
                      Draft last saved: {lastSavedTime.toLocaleTimeString()}
                    </span>
                  )}
                </p>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {hasDraft && (
                  <Button
                    type="button"
                    onClick={loadDraft}
                    disabled={isLoadingDraft || isSubmitting}
                    variant="outline"
                    size="sm"
                    className="text-xs flex items-center gap-1 h-8 px-2"
                  >
                    {isLoadingDraft ? (
                      <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent" />
                    ) : (
                      <RotateCcw className="w-3 h-3" />
                    )}
                    Load Draft
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={saveDraft}
                  disabled={!hasFormData || isSavingDraft || isSubmitting}
                  variant="outline"
                  size="sm"
                  className="text-xs flex items-center gap-1 h-8 px-2"
                >
                  {isSavingDraft ? (
                    <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  Save Draft
                </Button>
              </div>
            </div>

            {/* Main Form - compressed */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <form onSubmit={handleSubmit} className="p-4 sm:p-5">
                <div className="space-y-4">
                  {/* Job Selection - compressed */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Job Position *
                    </label>
                    <div className="relative">
                      <select
                        value={selectedJob}
                        onChange={(e) => {
                          setSelectedJob(e.target.value);
                          setErrors(prev => ({...prev, selectedJob: ""}));
                        }}
                        disabled={jobsLoading || isSubmitting}
                        className={`w-full h-10 px-3 text-sm border border-gray-300 rounded-lg appearance-none bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors ${
                          errors.selectedJob ? "border-red-500 ring-2 ring-red-500" : ""
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
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    </div>
                    {errors.selectedJob && (
                      <p className="text-red-500 text-xs mt-1">{errors.selectedJob}</p>
                    )}
                  </div>

                  {/* Cover Letter - compressed */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cover Letter *
                    </label>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => {
                        setCoverLetter(e.target.value);
                        setErrors(prev => ({...prev, coverLetter: ""}));
                      }}
                      placeholder="Write your cover letter here... (minimum 50 characters)"
                      maxLength={2000}
                      disabled={isSubmitting}
                      rows={isMobile ? 3 : 4}
                      className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400 text-sm leading-relaxed transition-colors ${
                        errors.coverLetter ? "border-red-500 ring-2 ring-red-500" : ""
                      }`}
                    />
                    {errors.coverLetter && (
                      <p className="text-red-500 text-xs mt-1">{errors.coverLetter}</p>
                    )}
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">
                        Highlight your qualifications
                      </p>
                      <p className={`text-xs ${characterCount > 1900 ? 'text-orange-500' : 'text-gray-500'}`}>
                        {characterCount}/2000
                      </p>
                    </div>
                  </div>

                  {/* File Upload - compressed */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Resume *
                    </label>
                    <div className={`border-2 border-dashed rounded-lg p-3 text-center transition-all duration-200 ${
                      isSubmitting ? "cursor-not-allowed opacity-50 bg-gray-50" : "cursor-pointer hover:border-blue-400 hover:bg-blue-50"
                    } ${errors.file ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50"}`}>
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
                          onClick={handleFileClick}
                          className="cursor-pointer flex flex-col items-center space-y-2 py-2"
                        >
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200">
                            <Upload className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="text-gray-700">
                            <span className="text-gray-900 font-medium text-sm block">
                              Click to upload resume
                            </span>
                            <span className="text-xs text-gray-500 mt-1 block">
                              PDF only • Max 10MB
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-3 text-sm text-green-700 bg-green-50 py-2 px-3 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Upload className="w-3 h-3 text-green-600" />
                            </div>
                            <div className="text-left min-w-0">
                              <p className="font-medium truncate text-xs" title={uploadedFile.name}>
                                {uploadedFile.name}
                              </p>
                              <p className="text-xs text-green-600">
                                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={removeFile}
                            disabled={isSubmitting}
                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    {errors.file && (
                      <p className="text-red-500 text-xs mt-1">{errors.file}</p>
                    )}
                  </div>
                </div>

                {/* Form Actions - compressed */}
                <div className="flex flex-col sm:flex-row gap-2 mt-5 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/jobs')}
                    className="flex-1 h-10 text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    Back to Jobs
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1 h-10 text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    Reset Form
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting || jobsLoading || jobs.length === 0}
                    className="flex-1 sm:flex-[2] bg-blue-600 hover:bg-blue-700 text-white h-10 text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                        <span>Submitting...</span>
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
      <div className="pb-2">
        <Footer />
      </div>
      </div>
      )}                  