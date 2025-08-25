"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Category from "@/components/sections/sidebar/category";
import DailyQuiz from "@/components/sections/sidebar/daily-quiz";
import Articles from "@/components/sections/sidebar/articles";
import { Button } from "../ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCategories } from "@/store/reducers/categorySlice";
import { fetchPrograms } from "@/store/reducers/programSlice";
import { Program } from "@/types";
import { useRouter, usePathname } from "next/navigation";
import { useMediaQuery } from "react-responsive";
import { fetchSettings } from "@/store/reducers/settingSlice";
import PostJob from "../ui/postjob";
import ApplyJobPage from "../ui/applypost";

interface SidebarProps {
  isSidebarOpen: boolean;
  onSelectProgram: (program: Program) => void;
  onCloseSidebar?: () => void;
  onShowPostJob: () => void;
  onShowApplyJob: () => void;
}

const Sidebar = ({
  isSidebarOpen,
  onSelectProgram,
  onCloseSidebar,
  onShowPostJob,
  onShowApplyJob,
}: SidebarProps) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [programNotFound, setProgramNotFound] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [showPostJob, setShowPostJob] = useState(false);
  const [showApplyJob, setShowApplyJob] = useState(false);

  const categoriesState = useAppSelector((state) => state.categories);
  const programsState = useAppSelector((state) => state.programs);
  const settingsState = useAppSelector((state) => state.settings);

  const categories = categoriesState.items;
  const programs = programsState.items;
  const settings = settingsState.item;

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchPrograms());
    dispatch(fetchSettings());
  }, [dispatch]);

  useEffect(() => {
    if (categories.length > 0 && expandedCategories.length === 0) {
      setExpandedCategories([categories[0].name]);
    }
  }, [categories, expandedCategories]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((name) => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (query.trim()) {
      const matchingPrograms = programs.filter((program) =>
        program.name.toLowerCase().includes(query.toLowerCase())
      );
      const matchingCategoryNames = Array.from(
        new Set(matchingPrograms.map((p) => p.category))
      );

      matchingCategoryNames.forEach((categoryName) => {
        if (!expandedCategories.includes(categoryName)) {
          toggleCategory(categoryName);
        }
      });

      expandedCategories.forEach((name) => {
        if (!matchingCategoryNames.includes(name)) {
          toggleCategory(name);
        }
      });

      setProgramNotFound(matchingPrograms.length === 0);
    } else {
      setProgramNotFound(false);
    }
  };

  // Handle showing full-screen components for mobile
  const handlePostJobClick = () => {
    if (isMobile) {
      setShowPostJob(true);
      if (onCloseSidebar) {
        onCloseSidebar();
      }
    } else {
      onShowPostJob();
    }
  };

  const handleApplyJobClick = () => {
    if (isMobile) {
      setShowApplyJob(true);
      if (onCloseSidebar) {
        onCloseSidebar();
      }
    } else {
      onShowApplyJob();
    }
  };

  // Handle closing full-screen components
  const handleClosePostJob = () => {
    setShowPostJob(false);
  };

  const handleCloseApplyJob = () => {
    setShowApplyJob(false);
  };

  // Handle other navigation actions
  const handleNavigation = (path: string) => {
    if (onCloseSidebar) {
      onCloseSidebar();
    }
    router.push(path);
  };

  // Show full-screen PostJob component
  if (showPostJob && isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <PostJob onClose={handleClosePostJob} />
      </div>
    );
  }

  // Show full-screen ApplyJob component
  if (showApplyJob && isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <ApplyJobPage onClose={handleCloseApplyJob} />
      </div>
    );
  }

  return (
    <div
      className={`
        fixed inset-y-0 left-0 overflow-y-auto
        w-64 bg-white border-r border-gray-200
        transform transition-transform duration-300 z-30 ease-in-out
        top-12 h-[calc(100vh-3rem)] pb-4
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"}
      `}
    >
      {/* Mobile Top Tabs */}
      <ul className="xl:hidden flex flex-col justify-center space-y-1 p-4 pb-0">
        <li>
          <button
            onClick={() => {
              if (pathname === "/categories" && onCloseSidebar) {
                onCloseSidebar();
              } else {
                handleNavigation("/categories");
              }
            }}
            style={{ color: "rgb(2 132 218)" }}
            className="w-full font-medium text-sm p-1 rounded-lg text-left hover:bg-blue-50 transition-colors"
          >
            Codes
          </button>
        </li>

        {settings?.isJobs && (
          <li>
            <button
              onClick={() => handleNavigation("/jobs")}
              style={{ color: "rgb(2 132 218)" }}
              className="w-full font-medium text-sm p-1 rounded-lg text-left hover:bg-blue-50 transition-colors"
            >
              Jobs
            </button>
          </li>
        )}

        <li>
          <button
            onClick={() => handleNavigation("/quiz")}
            style={{ color: "rgb(2 132 218)" }}
            className="w-full font-medium text-sm p-1 rounded-lg text-left hover:bg-blue-50 transition-colors"
          >
            Quiz
          </button>
        </li>

        {settings?.isApplyJob && (
          <li>
            <button
              onClick={() => handleNavigation("/apply-job")}
              style={{ color: "rgb(2 132 218)" }}
              className="w-full font-medium text-sm p-1 rounded-lg text-left hover:bg-blue-50 transition-colors"
            >
              Apply Job
            </button>
          </li>
        )}

        {settings?.isPostJob && (
          <li>
            <button
              onClick={() => handleNavigation("/post-job")}
              style={{ color: "rgb(2 132 218)" }}
              className="w-full font-medium text-sm p-1 rounded-lg text-left hover:bg-blue-50 transition-colors"
            >
              Post Job
            </button>
          </li>
        )}

        <li>
          <button
            onClick={() => handleNavigation("/contact")}
            style={{ color: "rgb(2 132 218)" }}
            className="w-full font-medium text-sm p-1 rounded-lg text-left hover:bg-blue-50 transition-colors"
          >
            Contact Us
          </button>
        </li>
      </ul>

      {/* Search */}
      <div className={`${isMobile ? "pt-2 px-4" : "p-4 border-b border-gray-200"}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search programs..."
            className="pl-10 ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {programNotFound && (
        <p className="my-2 text-center text-gray-500">No Result found</p>
      )}

      <Category
        expandedCategories={expandedCategories}
        toggleCategory={toggleCategory}
        onSelectProgram={onSelectProgram}
        searchQuery={searchQuery}
        setProgramNotFound={setProgramNotFound}
      />

      {!isMobile && (
        <>
          <div className="flex justify-center border-t border-gray-200 py-2">
            <button
              onClick={() => handleNavigation("/categories")}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 text-[#0284DA] bg-white hover:text-[#0284FF] hover:bg-blue-50 transition-colors"
            >
              View All Programs
            </button>
          </div>
          <div className="px-4 flex flex-col gap-y-[11px]">
            <DailyQuiz router={router} />
            {settings?.isJobs && (settings?.isPostJob || settings?.isApplyJob) && (
              <Articles 
                onShowJobPosting={handlePostJobClick} 
                onShowApplyJob={handleApplyJobClick} 
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;