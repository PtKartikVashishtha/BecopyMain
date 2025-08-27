"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Sidebar from "@/components/layout/sidebar";
import { useMediaQuery } from "react-responsive";
import { useAuth } from "@/hooks/useAuth"; // ADD THIS
import { useAppDispatch } from "@/store/hooks"; // ADD THIS
import { newjob } from "@/store/reducers/jobSlice"; // ADD THIS
import { toast } from "@/hooks/use-toast"; // ADD THIS

// Define the Program type
type Program = {
  _id: string;
  name: string;
  description?: string;
  category?: string;
};

export default function PostJob() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
    responsibilities: "",
    requirements: "",
    salary: "",
    country: "",
    applyBefore: "",
    howToApply: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ADD THESE
  const { isAuthenticated, user } = useAuth();
  const dispatch = useAppDispatch();

  const rawIsMobile = useMediaQuery({ maxWidth: 640 });
  const isMobile = isMounted && rawIsMobile;

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // ADD DRAFT FUNCTIONALITY
  const saveDraft = () => {
    localStorage.setItem('jobPostDraft', JSON.stringify(formData));
    toast({
      title: "Draft Saved",
      description: "Your job post has been saved as draft.",
      variant: "success",
      duration: 3000,
    });
  };

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem('jobPostDraft');
      if (draft) {
        const draftData = JSON.parse(draft);
        setFormData(draftData);
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
    console.log("Already on post job page");
  };

  const handleShowApplyJob = () => {
    router.push("/apply-job");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    let tempErrors: { [key: string]: string } = {};
    if (!formData.title) tempErrors.title = "Job title is required";
    if (!formData.company) tempErrors.company = "Company is required";
    if (!formData.description) tempErrors.description = "Job description is required";
    if (!formData.applyBefore) tempErrors.applyBefore = "Apply before date is required";
    if (!formData.howToApply) tempErrors.howToApply = "How to apply is required";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // REPLACE handleSubmit WITH REAL BACKEND INTEGRATION
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Check authentication
      if (!isAuthenticated || !user) {
        // Save job data and redirect to login
        const postJobData = {
          title: formData.title,
          company: formData.company,
          description: formData.description,
          responsibilities: formData.responsibilities,
          requirements: formData.requirements,
          jobLocation: formData.location,
          salary: formData.salary,
          deadline: formData.applyBefore,
          howtoapply: formData.howToApply,
        };

        localStorage.setItem("postJobData", JSON.stringify(postJobData));
        return router.push("/recruiterauth?fromPostJob=true");
      }

      // Dispatch job creation action
      await dispatch(
        newjob({
          recruiter: user.id,
          title: formData.title,
          company: formData.company,
          description: formData.description,
          responsibilities: formData.responsibilities,
          requirements: formData.requirements,
          jobLocation: formData.location,
          salary: formData.salary,
          deadline: formData.applyBefore,
          howtoapply: formData.howToApply,
        })
      ).unwrap();

      // Success - clear form and show toast
      setFormData({
        title: "",
        company: "",
        location: "",
        description: "",
        responsibilities: "",
        requirements: "",
        salary: "",
        country: "",
        applyBefore: "",
        howToApply: "",
      });

      // Clear draft
      localStorage.removeItem('jobPostDraft');

      toast({
        title: "Job Posted Successfully!",
        description: "Your job posting has been published.",
        variant: "success",
        duration: 5000,
      });

      // Optionally redirect
      // router.push("/jobs");

    } catch (error: any) {
      console.error("Error posting job:", error);
      toast({
        title: "Job Posting Failed",
        description: error.message || "There was an error posting your job. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // REPLACE handleSave WITH REAL SAVE FUNCTIONALITY
  const handleSave = async () => {
    saveDraft();
  };

  const countries = [
    { value: "", label: "Select Country" },
    { value: "India", label: "India" },
    { value: "USA", label: "USA" },
    { value: "UK", label: "UK" },
    { value: "Canada", label: "Canada" },
    { value: "Australia", label: "Australia" },
    { value: "Germany", label: "Germany" },
    { value: "France", label: "France" },
    { value: "Japan", label: "Japan" },
    { value: "Singapore", label: "Singapore" },
    { value: "Netherlands", label: "Netherlands" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Sidebar Component */}
      {isMobile && <Sidebar
        isSidebarOpen={isSidebarOpen}
        onSelectProgram={handleSelectProgram}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        onShowPostJob={handleShowPostJob}
        onShowApplyJob={handleShowApplyJob}
      />}
      
      <div className="flex-1 pt-12 sm:pt-13">
        {/* Main content wrapper with proper padding for sidebar */}
        <div onClick={handleContentClick}>
          <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-2">
            {/* Page Header */}
            <div className="mb-3 sm:mb-4 flex justify-between items-start">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  Post a Job
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Fill out the details below to post your job opportunity
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
                <div className="space-y-3 sm:space-y-4">
                  {/* Job Title and Company */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Input
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Job Title *"
                        maxLength={200}
                        disabled={isSubmitting}
                        className={`h-9 sm:h-10 text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          errors.title ? "border-red-500" : ""
                        }`}
                      />
                      {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                    </div>
                    <div>
                      <Input
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder="Company *"
                        maxLength={100}
                        disabled={isSubmitting}
                        className={`h-9 sm:h-10 text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          errors.company ? "border-red-500" : ""
                        }`}
                      />
                      {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
                    </div>
                  </div>

                  {/* Location and Country */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Input
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="Location (City, State)"
                        maxLength={100}
                        disabled={isSubmitting}
                        className="h-9 sm:h-10 text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="relative">
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        className="w-full h-9 sm:h-10 px-3 text-sm border border-gray-300 rounded-md appearance-none bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        {countries.map((country) => (
                          <option key={country.value} value={country.value}>
                            {country.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Job Description * (Provide a detailed description of the role)"
                      rows={isMobile ? 3 : 4}
                      maxLength={2000}
                      disabled={isSubmitting}
                      className={`text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        errors.description ? "border-red-500" : ""
                      }`}
                    />
                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.description.length}/2000 characters
                    </p>
                  </div>

                  {/* Responsibilities and Requirements */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Textarea
                        name="responsibilities"
                        value={formData.responsibilities}
                        onChange={handleInputChange}
                        placeholder="Key Responsibilities (List main duties and expectations)"
                        rows={isMobile ? 3 : 4}
                        maxLength={1000}
                        disabled={isSubmitting}
                        className="text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.responsibilities.length}/1000 characters
                      </p>
                    </div>
                    <div>
                      <Textarea
                        name="requirements"
                        value={formData.requirements}
                        onChange={handleInputChange}
                        placeholder="Requirements (Skills, experience, qualifications needed)"
                        rows={isMobile ? 3 : 4}
                        maxLength={1000}
                        disabled={isSubmitting}
                        className="text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.requirements.length}/1000 characters
                      </p>
                    </div>
                  </div>

                  {/* Salary and Apply Before */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Input
                        name="salary"
                        value={formData.salary}
                        onChange={handleInputChange}
                        placeholder="Salary (e.g., $50,000 - $70,000 per year)"
                        maxLength={50}
                        disabled={isSubmitting}
                        className="h-9 sm:h-10 text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <Input
                        type="date"
                        name="applyBefore"
                        value={formData.applyBefore}
                        onChange={handleInputChange}
                        placeholder="Apply Before *"
                        min={new Date().toISOString().split('T')[0]} // Prevent past dates
                        disabled={isSubmitting}
                        className={`h-9 sm:h-10 text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          errors.applyBefore ? "border-red-500" : ""
                        }`}
                      />
                      {errors.applyBefore && <p className="text-red-500 text-xs mt-1">{errors.applyBefore}</p>}
                    </div>
                  </div>

                  {/* How to Apply */}
                  <div>
                    <Textarea
                      name="howToApply"
                      value={formData.howToApply}
                      onChange={handleInputChange}
                      placeholder="How to Apply * (Instructions for candidates on how to apply)"
                      rows={isMobile ? 2 : 3}
                      maxLength={500}
                      disabled={isSubmitting}
                      className={`text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        errors.howToApply ? "border-red-500" : ""
                      }`}
                    />
                    {errors.howToApply && <p className="text-red-500 text-xs mt-1">{errors.howToApply}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.howToApply.length}/500 characters
                    </p>
                  </div>

                  {/* Authentication Notice */}
                  {!isAuthenticated && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-700 text-sm flex items-center space-x-2">
                        <span>ℹ️</span>
                        <span>You'll be redirected to sign in before posting your job.</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4 sm:mt-6">
                  <Button
                    type="button"
                    onClick={handleSave}
                    variant="outline"
                    className="flex-1 h-9 sm:h-10 text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-9 sm:h-10 text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Posting Job...</span>
                      </div>
                    ) : (
                      "Post Job"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

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