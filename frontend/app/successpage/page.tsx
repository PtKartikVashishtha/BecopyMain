"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, Code, Share2, Eye, Copy, Home, Plus } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Sidebar from "@/components/layout/sidebar";
import { useMediaQuery } from "react-responsive";
import { useAuth } from "@/hooks/useAuth";

// Define the Program type
type Program = {
  _id: string;
  name: string;
  description?: string;
  category?: string;
};

const SuccessPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [submissionDetails, setSubmissionDetails] = useState<any>(null);
  const isMobile = useMediaQuery({ maxWidth: 640 });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    // Get submission details from localStorage or URL params
    const details = localStorage.getItem('lastSubmissionDetails');
    if (details) {
      setSubmissionDetails(JSON.parse(details));
      // Clear after reading
      localStorage.removeItem('lastSubmissionDetails');
    }
  }, []);

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

  // Navigation functions
  const handleShowPostJob = () => {
    router.push("/post-job");
  };

  const handleShowApplyJob = () => {
    router.push("/apply-job");
  };

  const handleViewSubmissions = () => {
    router.push("/dashboard");
  };

  const handleAddMore = () => {
    router.push("/add-code");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  const stats = [
    {
      icon: Eye,
      label: "Expected Views",
      value: "100+",
      description: "Community members will discover your code"
    },
    {
      icon: Copy,
      label: "Potential Copies",
      value: "10+",
      description: "Developers may use your code in their projects"
    },
    {
      icon: Share2,
      label: "Sharing",
      value: "Public",
      description: "Your code is now searchable and shareable"
    }
  ];

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
        {/* Main content wrapper */}
        <div onClick={handleContentClick}>
          <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
            
            {/* Success Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Header Section with Success Icon */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 sm:py-12 text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-white/20 p-4 rounded-full">
                    <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                  Code Successfully Submitted!
                </h1>
                <p className="text-green-100 text-sm sm:text-base max-w-2xl mx-auto">
                  Your code contribution has been successfully added to the BeCopy community. 
                  It's now live and available for other developers to discover and use.
                </p>
              </div>

              {/* Content Section */}
              <div className="p-6 sm:p-8">
                {/* Submission Summary */}
                {submissionDetails && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Submission Details
                    </h3>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><span className="font-medium">Title:</span> {submissionDetails.name || "Your Code"}</p>
                      <p><span className="font-medium">Languages:</span> 
                        {[
                          submissionDetails.code?.java && "Java",
                          submissionDetails.code?.python && "Python", 
                          submissionDetails.code?.html && "HTML"
                        ].filter(Boolean).join(", ") || "Code submitted"}
                      </p>
                      <p><span className="font-medium">Privacy:</span> {submissionDetails.isAnonymous ? "Anonymous" : "Public"}</p>
                    </div>
                  </div>
                )}

                {/* What Happens Next */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">What happens next?</h2>
                  <div className="grid gap-4 md:grid-cols-3">
                    {stats.map((stat, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <stat.icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{stat.value}</div>
                            <div className="text-sm font-medium text-gray-700">{stat.label}</div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">{stat.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Community Impact */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">
                    Welcome to the BeCopy Community!
                  </h3>
                  <p className="text-purple-800 text-sm mb-4">
                    Your contribution helps fellow developers learn, build, and create amazing projects. 
                    Thank you for sharing your knowledge with the community.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <div className="bg-white/70 px-3 py-1 rounded-full text-xs font-medium text-purple-800">
                      Open Source
                    </div>
                    <div className="bg-white/70 px-3 py-1 rounded-full text-xs font-medium text-purple-800">
                      Community Driven
                    </div>
                    <div className="bg-white/70 px-3 py-1 rounded-full text-xs font-medium text-purple-800">
                      Knowledge Sharing
                    </div>
                  </div>
                </div>

                {/* Tips Section */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-yellow-900 mb-2">Pro Tips</h3>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Monitor your code's performance in the dashboard</li>
                    <li>• Engage with community feedback and suggestions</li>
                    <li>• Consider adding more code snippets to build your reputation</li>
                    <li>• Share your code on social media to increase visibility</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleViewSubmissions}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11 text-sm font-medium"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View My Submissions
                  </Button>
                  
                  <Button
                    onClick={handleAddMore}
                    variant="outline"
                    className="flex-1 h-11 text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add More Code
                  </Button>
                  
                  <Button
                    onClick={handleGoHome}
                    variant="outline"
                    className="flex-1 h-11 text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Need help or have questions about your submission?
              </p>
              <button 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                onClick={() => router.push("/support")}
              >
                Contact Support
              </button>
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
};

export default SuccessPage;