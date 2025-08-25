"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, ChevronDown, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

interface PostJobProps {
  onClose?: () => void;
}

export default function PostJob({ onClose }: PostJobProps) {
  const router = useRouter();
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
      
      if (onClose) {
        onClose();
      } else {
        router.back();
      }
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

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">Post a Job</h1>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          disabled={isSubmitting}
        >
          <X className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Job Title and Company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Job Title *"
                  className="h-12 text-base border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>
              <div>
                <Input
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Company *"
                  className="h-12 text-base border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                {errors.company && <p className="text-red-500 text-sm mt-1">{errors.company}</p>}
              </div>
            </div>

            {/* Description */}
            <div>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Description"
                rows={4}
                className="text-base border-gray-300 focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Responsibilities and Requirements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Textarea
                  name="responsibilities"
                  value={formData.responsibilities}
                  onChange={handleInputChange}
                  placeholder="Responsibilities"
                  rows={4}
                  className="text-base border-gray-300 focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <Textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  placeholder="Requirements"
                  rows={4}
                  className="text-base border-gray-300 focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Country and Salary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full h-12 p-3 text-base border border-gray-300 rounded-lg appearance-none bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                >
                  <option value="">Select Country</option>
                  <option value="India">India</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>
              <div>
                <Input
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  placeholder="Salary"
                  className="h-12 text-base border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Apply Before */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apply Before
              </label>
              <div className="relative">
                <Input
                  type="date"
                  name="applyBefore"
                  value={formData.applyBefore}
                  onChange={handleInputChange}
                  placeholder="Select a date"
                  className="h-12 text-base border-gray-300 focus:ring-2 focus:ring-blue-500 pl-4"
                />
              </div>
              {errors.applyBefore && <p className="text-red-500 text-sm mt-1">{errors.applyBefore}</p>}
            </div>

            {/* How to Apply */}
            <div>
              <Textarea
                name="howToApply"
                value={formData.howToApply}
                onChange={handleInputChange}
                placeholder="How to Apply"
                rows={4}
                className="text-base border-gray-300 focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {errors.howToApply && <p className="text-red-500 text-sm mt-1">{errors.howToApply}</p>}
            </div>
          </div>
        </form>
      </div>

      {/* Footer Buttons */}
      <div className="flex space-x-4 p-6 border-t border-gray-200 bg-white">
        <Button
          type="button"
          onClick={handleSave}
          variant="outline"
          className="flex-1 py-3 text-lg font-medium h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Save
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium h-12 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Submitting...</span>
            </div>
          ) : (
            "Submit"
          )}
        </Button>
      </div>
    </div>
  );
}