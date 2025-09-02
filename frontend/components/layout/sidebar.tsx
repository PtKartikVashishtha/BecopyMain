"use client";
import Category from "@/components/sections/sidebar/category";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import api from "@/lib/api";

interface SidebarProps {
  isSidebarOpen: boolean;
  expandedCategories?: string[];
  onSelectProgram: (program: Program) => void;
  onShowJobPosting: () => void;
  onShowApplyJob: () => void;
  onCloseSidebar?: () => void;
  toggleCategory: () => void;
}

interface CategoryPrograms {
  [categoryName: string]: Program[];
}

const Sidebar = ({
  isSidebarOpen,
  expandedCategories: parentExpandedCategories = [],
  onSelectProgram,
  onShowJobPosting,
  onShowApplyJob,
  onCloseSidebar,
}: SidebarProps) => {
  const isMountedRef = useRef(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const rawIsMobile = useMediaQuery({ maxWidth: 768 });
  const isMobile = isMountedRef.current ? rawIsMobile : false;

  // Initialize with safe defaults - FIXED: Use useMemo to prevent recreation
  const initialExpandedCategories = useMemo(() => 
    Array.isArray(parentExpandedCategories) ? [...parentExpandedCategories] : [], 
    []
  );

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [programNotFound, setProgramNotFound] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(initialExpandedCategories);
  const [showPostJob, setShowPostJob] = useState(false);
  const [categoryPrograms, setCategoryPrograms] = useState<CategoryPrograms>({});
  const [dataFetched, setDataFetched] = useState(false);

  // Track mounting
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Add CSS for hiding scrollbars
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "sidebar-scrollbar-style";
    style.textContent = `
      /* Hide scrollbar for webkit browsers (Chrome, Safari, Edge) */
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      
      /* Hide scrollbar for IE, Edge and Firefox */
      .hide-scrollbar {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
      }
      
      /* Ensure scrolling still works */
      .hide-scrollbar {
        overflow: auto;
      }
    `;
    
    // Check if style already exists
    const existingStyle = document.getElementById("sidebar-scrollbar-style");
    if (!existingStyle) {
      document.head.appendChild(style);
    }

    return () => {
      const styleToRemove = document.getElementById("sidebar-scrollbar-style");
      if (styleToRemove && document.head.contains(styleToRemove)) {
        document.head.removeChild(styleToRemove);
      }
    };
  }, []);

  // Redux state with safe defaults
  const categoriesState = useAppSelector((state) => state.categories) || { items: [] };
  const programsState = useAppSelector((state) => state.programs) || { items: [] };
  const settingsState = useAppSelector((state) => state.settings) || { item: null };

  const categories = Array.isArray(categoriesState.items) ? categoriesState.items : [];
  const programs = Array.isArray(programsState.items) ? programsState.items : [];
  const settings = settingsState.item;

  // FIXED: Fetch data only once with proper dependency management
  useEffect(() => {
    if (!isMountedRef.current || dataFetched) return;

    let abortController = new AbortController();

    const fetchData = async () => {
      try {
        if (isMountedRef.current && !abortController.signal.aborted) {
          await Promise.allSettled([
            dispatch(fetchCategories()),
            dispatch(fetchPrograms()),
            dispatch(fetchSettings())
          ]);
          
          if (isMountedRef.current) {
            setDataFetched(true);
          }
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Error fetching sidebar data:", error);
        }
      }
    };

    fetchData();

    return () => {
      abortController.abort();
    };
  }, [dispatch]); // Only depend on dispatch

  // FIXED: Remove the problematic useEffect that was causing infinite updates
  // Instead, initialize expandedCategories only when categories are first loaded
  useEffect(() => {
    if (categories.length > 0 && expandedCategories.length === 0 && isMountedRef.current) {
      setExpandedCategories([categories[0].name]);
    }
  }, [categories.length]); // Only depend on categories.length, not the full array

  // Memoized functions to prevent recreation
  const fetchProgramsForCategory = useCallback(async (categoryId: string, categoryName: string) => {
    if (!isMountedRef.current || categoryPrograms[categoryName]) {
      return;
    }
    
    try {
      const filteredPrograms = programs.filter((program) => program.category === categoryId);
      
      if (isMountedRef.current) {
        setCategoryPrograms(prev => ({
          ...prev,
          [categoryName]: filteredPrograms
        }));
      }
    } catch (error) {
      console.error(`Failed to fetch programs for category ${categoryName}:`, error);
      if (isMountedRef.current) {
        setCategoryPrograms(prev => ({
          ...prev,
          [categoryName]: []
        }));
      }
    }
  }, [programs, categoryPrograms]);

  const toggleCategory = useCallback(async (categoryName: string) => {
    if (!isMountedRef.current || !Array.isArray(expandedCategories)) return;
    
    const isExpanding = !expandedCategories.includes(categoryName);
    
    setExpandedCategories(prev => {
      if (!Array.isArray(prev)) return [categoryName];
      return prev.includes(categoryName)
        ? prev.filter((name) => name !== categoryName)
        : [...prev, categoryName];
    });

    if (isExpanding) {
      const category = categories.find(cat => cat.name === categoryName);
      if (category) {
        await fetchProgramsForCategory(category._id, categoryName);
      }
    }
  }, [expandedCategories, categories, fetchProgramsForCategory]);

  const handleSearch = useCallback((query: string) => {
    if (!isMountedRef.current) return;
    
    setSearchQuery(query);

    if (query.trim()) {
      const matchingPrograms = programs.filter((program) =>
        program.name && program.name.toLowerCase().includes(query.toLowerCase())
      );
      const matchingCategoryNames = Array.from(
        new Set(matchingPrograms.map((p) => p.category).filter(Boolean))
      );

      matchingCategoryNames.forEach((categoryName) => {
        if (Array.isArray(expandedCategories) && !expandedCategories.includes(categoryName)) {
          toggleCategory(categoryName);
        }
      });

      setProgramNotFound(matchingPrograms.length === 0);
    } else {
      setProgramNotFound(false);
    }
  }, [programs, expandedCategories, toggleCategory]);

  const handlePostJobClick = useCallback(() => {
    if (!isMountedRef.current) return;
    
    if (isMobile) {
      setShowPostJob(true);
      onCloseSidebar?.();
    } else {
      handleNavigation("/post-job");
    }
  }, [isMobile, onCloseSidebar]);

  const handleClosePostJob = useCallback(() => {
    if (isMountedRef.current) {
      setShowPostJob(false);
    }
  }, []);

  const handleNavigation = useCallback((path: string) => {
    onCloseSidebar?.();
    router.push(path);
  }, [onCloseSidebar, router]);

  // Memoized filtered categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories;
    }
    
    return categories.filter(category => {
      const matchingPrograms = programs.filter(program => 
        program.category === category.name && 
        program.name && program.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return matchingPrograms.length > 0;
    });
  }, [searchQuery, categories, programs]);

  // Show full-screen PostJob component
  if (showPostJob && isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <PostJob onClose={handleClosePostJob} />
      </div>
    );
  }

  // Don't render if not mounted to prevent hydration issues
  if (!isMountedRef.current) {
    return null;
  }

  return (
    <div
      className={`
        fixed inset-y-0 left-0 hide-scrollbar
        ${isMobile ? 'overflow-y-auto' : 'overflow-hidden'}
        w-64 bg-white border-r border-gray-200
        transform transition-transform duration-300 z-30 ease-in-out
        top-12 h-[calc(100vh-3rem)] pb-4
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"}
        ${!isMobile ? 'flex flex-col' : ''}
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
      <div className={`${isMobile ? "pt-2 px-4" : "p-4 border-b border-gray-200 flex-shrink-0"}`}>
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
        <p className={`my-2 text-center text-gray-500 ${!isMobile ? 'flex-shrink-0' : ''}`}>No Result found</p>
      )}

      {/* Categories Section */}
      <div className={`${!isMobile ? 'flex-1 overflow-y-auto px-4 hide-scrollbar' : ''}`}>
        {!isMobile ? (
          <div className="py-2">
            {filteredCategories.map((category) => {
              const isExpanded = Array.isArray(expandedCategories) && expandedCategories.includes(category.name);
              const categoryProgramsList = categoryPrograms[category.name] || [];

              return (
                <div key={category.id || category._id} className="mb-1">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category.name)}
                    className="w-full flex items-center justify-between py-2 px-2 hover:bg-gray-50 rounded transition-colors"
                  >
                    <span className="text-md font-medium text-gray-700 font-bold">
                      {category.name}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    )}
                  </button>

                  {/* Programs Dropdown */}
                  {isExpanded && (
                    <div className="ml-3 space-y-1 max-h-32 overflow-y-auto hide-scrollbar">
                      {categoryProgramsList.length > 0 ? (
                        categoryProgramsList.map((program) => (
                          <button
                            key={program._id || program.id}
                            onClick={() => onSelectProgram(program)}
                            className="w-full text-left py-1 px-2 hover:bg-blue-50 rounded text-sm text-gray-600 hover:text-blue-600 transition-colors"
                          >
                            {program.name || 'Untitled'}
                          </button>
                        ))
                      ) : (
                        <div className="py-1 px-2 text-xs text-gray-400">No programs</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <Category
            expandedCategories={Array.isArray(expandedCategories) ? expandedCategories : []}
            toggleCategory={toggleCategory}
            onSelectProgram={onSelectProgram}
            searchQuery={searchQuery}
            setProgramNotFound={setProgramNotFound}
          />
        )}
      </div>

      {!isMobile && (
        <div className="flex-shrink-0">
          <div className="flex justify-center py-2">
            <button
              onClick={() => handleNavigation("/categories")}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 text-[#0284DA] bg-white hover:text-[#0284FF] hover:bg-blue-50 transition-colors"
            >
              View All Programs
            </button>
          </div>
          <div className="border-t border-gray-200 px-4 pt-2 flex flex-col gap-y-[11px] pb-4">
            <DailyQuiz router={router} />
            {settings?.isJobs && settings?.isPostJob && (
              <Articles 
                onShowJobPosting={onShowJobPosting} 
                onShowApplyJob={onShowApplyJob} 
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;