"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchJobs } from "@/store/reducers/jobSlice";

interface ApplyJobPageProps {
  onClose?: () => void;
}

export default function ApplyJobPage({ onClose }: ApplyJobPageProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [selectedJob, setSelectedJob] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const jobsState = useAppSelector((state) => state.jobs);
  const jobs = jobsState.items;

  useEffect(() => {
    if (jobs.length === 0) {
      dispatch(fetchJobs());
    }
  }, [dispatch, jobs.length]);

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

  const handleSubmit = async () => {
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
      
      if (onClose) {
        onClose();
      } else {
        router.back();
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Error submitting application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
        <h1 className="text-2xl font-semibold text-gray-900">Apply Job</h1>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          disabled={isSubmitting}
        >
          <X className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">
        {/* Job Selection */}
        <div className="space-y-2">
          <div className="relative">
            <select
              value={selectedJob}
              onChange={(e) => {
                setSelectedJob(e.target.value);
                setErrors({...errors, selectedJob: ""});
              }}
              className="w-full p-4 text-lg border border-gray-300 rounded-lg appearance-none bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            >
              <option value="">Select a job to apply for</option>
              {jobs.map((job) => (
                <option key={job._id} value={job.title}>
                  {job.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6 pointer-events-none" />
          </div>
          {errors.selectedJob && <p className="text-red-500 text-sm">{errors.selectedJob}</p>}
        </div>

        {/* Cover Letter */}
        <div className="flex-1 flex flex-col space-y-2">
          <textarea
            value={coverLetter}
            onChange={(e) => {
              setCoverLetter(e.target.value);
              setErrors({...errors, coverLetter: ""});
            }}
            placeholder="Briefly explain why you're a good fit for this role..."
            className="flex-1 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500 text-base min-h-[120px]"
          />
          {errors.coverLetter && <p className="text-red-500 text-sm">{errors.coverLetter}</p>}
        </div>

        {/* Resume Upload */}
        <div className="space-y-3">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors bg-gray-50">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              className="cursor-pointer flex flex-col items-center space-y-3"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              <div className="text-gray-600">
                <span className="text-gray-800 font-medium text-lg">
                  Click to upload resume
                </span>
              </div>
              <p className="text-sm text-gray-500">PDF only (MAX. 10MB)</p>
            </label>

            {uploadedFile && (
              <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-green-700 bg-green-50 py-3 px-4 rounded-lg border border-green-200">
                <span className="font-medium">✓ {uploadedFile.name}</span>
                <button
                  onClick={() => setUploadedFile(null)}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex space-x-4 p-6 border-t border-gray-200 bg-white">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium h-12 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Applying...</span>
            </div>
          ) : (
            "Apply"
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleClose}
          className="flex-1 py-3 text-lg font-medium h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}