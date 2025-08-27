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
    // Already on post job page, could show a message or do nothing
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      console.log("Job posting data:", formData);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert("Job posted successfully!");
      router.push("/jobs"); // Navigate to jobs page or wherever you want
    } catch (error) {
      console.error("Error posting job:", error);
      alert("Error posting job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    console.log("Job saved as draft:", formData);
    alert("Job saved as draft!");
  };

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
      
      <div className="flex-1 pt-16 sm:pt-13">
        {/* Main content wrapper with proper padding for sidebar */}
        <div 
          onClick={handleContentClick}
        >
          <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-2">
            {/* Page Header */}
            <div className="mb-3 sm:mb-4">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                Post a Job
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Fill out the details below to post your job opportunity
              </p>
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
                        className={`h-9 sm:h-10 text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 ${
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
                        className={`h-9 sm:h-10 text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 ${
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
                        placeholder="Location"
                        className="h-9 sm:h-10 text-sm border-gray-300 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="relative">
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full h-9 sm:h-10 px-3 text-sm border border-gray-300 rounded-md appearance-none bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                      >
                        <option value="">Select Country</option>
                        <option value="India">India</option>
                        <option value="USA">USA</option>
                        <option value="UK">UK</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                        <option value="Germany">Germany</option>
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
                      placeholder="Job Description *"
                      rows={isMobile ? 3 : 4}
                      className={`text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 resize-none ${
                        errors.description ? "border-red-500" : ""
                      }`}
                    />
                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                  </div>

                  {/* Responsibilities and Requirements */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Textarea
                        name="responsibilities"
                        value={formData.responsibilities}
                        onChange={handleInputChange}
                        placeholder="Responsibilities"
                        rows={isMobile ? 3 : 4}
                        className="text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                    <div>
                      <Textarea
                        name="requirements"
                        value={formData.requirements}
                        onChange={handleInputChange}
                        placeholder="Requirements"
                        rows={isMobile ? 3 : 4}
                        className="text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                  </div>

                  {/* Salary and Apply Before */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Input
                        name="salary"
                        value={formData.salary}
                        onChange={handleInputChange}
                        placeholder="Salary"
                        className="h-9 sm:h-10 text-sm border-gray-300 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Input
                        type="date"
                        name="applyBefore"
                        value={formData.applyBefore}
                        onChange={handleInputChange}
                        placeholder="Apply Before *"
                        className={`h-9 sm:h-10 text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 ${
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
                      placeholder="How to Apply *"
                      rows={isMobile ? 2 : 3}
                      className={`text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 resize-none ${
                        errors.howToApply ? "border-red-500" : ""
                      }`}
                    />
                    {errors.howToApply && <p className="text-red-500 text-xs mt-1">{errors.howToApply}</p>}
                  </div>
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
                        <span>Submitting...</span>
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