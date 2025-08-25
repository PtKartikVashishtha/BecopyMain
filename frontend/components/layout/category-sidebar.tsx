"use client";

import DailyQuiz from "@/components/sections/sidebar/daily-quiz";
import Articles from "@/components/sections/sidebar/articles";
import { Button } from "../ui/button";

interface CategorySidebarProps {
  isSidebarOpen: boolean;
  onShowJobPosting: () => void;
  onShowApplyJob: () => void;
}

const CategorySidebar = ({ isSidebarOpen, onShowJobPosting, onShowApplyJob }: CategorySidebarProps) => {
  const handleShowJobPosting = () => {
    // Handle job posting display logic here
    console.log("show job posting");
  };
  return (
    <div className={`
      fixed xl:fixed inset-y-0 left-0 z-40 overflow-y-auto
      w-64 bg-white border-r border-gray-200
      transform transition-transform duration-300 ease-in-out 
      top-12 xl:top-12
      h-[calc(100vh-3rem)]
      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
    `}>
      <div className="h-full flex flex-col overflow-auto">
        {/* Bottom Section */}
        <div className="min-h-[390px]" />
        <div className="shrink-0 p-4 space-y-4 border-t border-gray-200">
          <div className="flex justify-center">
            <Button
              className="text-[#0284DA] outline-hidden bg-white hover:bg-white hover:text-[#0284FF]"
              onClick={() => window.location.assign('/')}
            >
              Go Back
            </Button>
          </div>
          <DailyQuiz />
          <Articles onShowJobPosting={onShowJobPosting} onShowApplyJob={onShowApplyJob} />
        </div>
      </div>
    </div>
  );
};

export default CategorySidebar; 