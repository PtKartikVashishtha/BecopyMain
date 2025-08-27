"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { ChevronDown, Search, Menu, Trophy, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import CategorySidebar from "@/components/layout/category-sidebar";

import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchCategories } from "@/store/reducers/categorySlice";
import { fetchPrograms } from "@/store/reducers/programSlice";
import { fetchContributors } from "@/store/reducers/contributorSlice";
import { useAuth } from "@/hooks/useAuth";
import { useMediaQuery } from "react-responsive";
import Sidebar from "@/components/layout/sidebar";

// Add this export for dynamic rendering
export const dynamic = "force-dynamic";

export default function Categories() {
  // CRITICAL: Add mounting state FIRST before any other hooks
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state immediately
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Early return BEFORE other hooks to prevent hook order changes
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return <CategoriesContent />;
}

// Move all component logic to separate component to avoid hook order issues
function CategoriesContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isContributorsSidebarOpen, setIsContributorsSidebarOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const dispatch = useAppDispatch();
  const categoriesState = useAppSelector((state) => state.categories);
  const programsState = useAppSelector((state) => state.programs);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [categoryNotFound, setCategoryNotFound] = useState(false);
  const [programNotFound, setProgramNotFound] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [programsPerPage] = useState(11);
  const [totalPrograms, setTotalPrograms] = useState(0);
  
  type Program = {
    _id: string;
    name: string;
    description?: string;
    category?: string;
  };

  const [allFilteredPrograms, setAllFilteredPrograms] = useState<Program[]>([]);
  const [displayPrograms, setDisplayPrograms] = useState<Program[]>([]);
  const { items, loading, error } = useAppSelector((state) => state.contributors);
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  
  // Now safe to use media queries after mounting check
  const isMobile = useMediaQuery({ maxWidth: 640 });
  const isTablet = useMediaQuery({ maxWidth: 1024 });
  
  useEffect(() => {
    if (isAuthenticated && user?.country) setSelectedCountry(user.country);
    else setSelectedCountry("all");
  }, [isAuthenticated, user]);

  const filteredContributors =
    selectedCountry === "all"
      ? items
      : items.filter((c) => c.country === selectedCountry);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchPrograms());
    dispatch(fetchContributors());
  }, []);

  const [categories, setCategories] = useState(
    isMobile ? categoriesState.items.slice(0, 4) : categoriesState.items
  );

  const programs = programsState.items;

  useEffect(() => {
    if (categoriesState.items.length > 0) {
      setCategories(
        isMobile ? categoriesState.items.slice(0, 4) : categoriesState.items
      );
    }
  }, [categoriesState.items, isMobile]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * programsPerPage;
    const endIndex = startIndex + programsPerPage;
    const paginatedPrograms = allFilteredPrograms.slice(startIndex, endIndex);
    setDisplayPrograms(paginatedPrograms);
  }, [allFilteredPrograms, currentPage, programsPerPage]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleContributorsSidebar = () => {
    setIsContributorsSidebarOpen(!isContributorsSidebarOpen);
  };

  const handleContentClick = () => {
    if (isSidebarOpen) setIsSidebarOpen(false);
    if (isContributorsSidebarOpen) setIsContributorsSidebarOpen(false);
  };

  let handleSelectCategory = useCallback(
    (categoryId: string) => {
      setSelectedCategory(categoryId);
      setCurrentPage(1);
      
      let selectedCategoryObj = categories.filter(
        (cat) => cat._id === categoryId
      );
      let filteredPrograms =
        programs?.filter((program) => program.category == categoryId) || [];
      
      setAllFilteredPrograms(filteredPrograms);
      setTotalPrograms(filteredPrograms.length);
      setSelectedCategoryName(selectedCategoryObj[0].name);
    },
    [programs, categories]
  );

  let handleSearchPrograms = (query: string) => {
    setCurrentPage(1);
    
    if (query == "") {
      setProgramNotFound(false);
      let allCatsPrograms = programs.filter(
        (program) => program.category == selectedCategory
      );
      setAllFilteredPrograms(allCatsPrograms);
      setTotalPrograms(allCatsPrograms.length);
      return;
    }

    let filteredPrograms;

    if (selectedCategory) {
      filteredPrograms = programs.filter(
        (program) =>
          program.category == selectedCategory &&
          program.name.toLowerCase().includes(query.toLowerCase())
      );
    } else {
      filteredPrograms = programs.filter((program) =>
        program.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (filteredPrograms.length === 0) {
      setProgramNotFound(true);
    } else {
      setProgramNotFound(false);
    }
    
    setAllFilteredPrograms(filteredPrograms);
    setTotalPrograms(filteredPrograms.length);
  };

  let handleProgramClick = (programId: string) => {
    window.location.assign(`/?programId=${programId}`);
  };

  const handleCategorySearch = (searchValue: string) => {
    if (searchValue == "") {
      setCategoryNotFound(false);
      return setCategories(categoriesState.items);
    }
    let filteredCategories = categories.filter((cat) =>
      cat.name.toLowerCase().includes(searchValue.toLowerCase())
    );

    setCategories(filteredCategories);
    if (filteredCategories.length === 0) {
      setCategoryNotFound(true);
    } else {
      setCategoryNotFound(false);
    }
  };

  const handleLoadMoreCategories = () => {
    setCategories(categoriesState.items);
  };

  let onSelectProgram = (program: Program) => {
    window.location.assign(`/?programId=${program._id}`);
  };

  const totalPages = Math.ceil(totalPrograms / programsPerPage);
  const startIndex = (currentPage - 1) * programsPerPage + 1;
  const endIndex = Math.min(currentPage * programsPerPage, totalPrograms);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      {isMobile && (
        <Sidebar
          onCloseSidebar={() => setIsSidebarOpen(false)}
          isSidebarOpen={isSidebarOpen}
          onSelectProgram={onSelectProgram} 
          expandedCategories={[]} 
          toggleCategory={function (name: string): void {
            console.log("Toggle category:", name);
          }} 
          onShowJobPosting={function (): void {
            console.log("Show job posting");
          }} 
          onShowApplyJob={function (): void {
            console.log("Show apply job");
          }}        
        />
      )}

      <div className="pt-16 sm:pt-20 bg-[#F5F5F5]">
        <div className="flex flex-col w-full relative min-h-[calc(95vh-4rem)] sm:min-h-[calc(95vh-5rem)]">
          <div className="flex flex-col lg:flex-row flex-1">
            <aside className="lg:w-[13.5%] w-full hidden lg:block p-2 sm:p-4 lg:p-6">
              <div
                style={{
                  width: isMobile ? "100%" : isTablet ? "16%" : "13.5%",
                  marginTop: isMobile ? "10px" : "20px",
                }}
                className={`
                  fixed xl:fixed inset-y-0 left-0 z-40 overflow-y-auto
                  w-42 border border-gray-200 rounded-md bg-white
                  transform transition-transform duration-300 ease-in-out 
                  top-14 sm:top-16 xl:top-16
                  xl:left-2 lg:left-2
                  p-3 sm:p-4 lg:p-6
                  h-[calc(85vh-3rem)] sm:h-[calc(90vh-3rem)]
                  shadow-md
                  translate-x-0
                `}
              >
                <h2 className="text-sm sm:text-base lg:text-lg font-semibold flex items-center mb-2 sm:mb-4">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 mr-1 sm:mr-2" /> 
                  <span className="hidden sm:inline">Top 100 Contributors</span>
                  <span className="sm:hidden">Top Contributors</span>
                </h2>
                <ol className="space-y-2 sm:space-y-4" style={{ scrollBehavior: "smooth" }}>
                  {filteredContributors?.map((contributor, index) => (
                    <li
                      style={{ maxWidth: "100%" }}
                      key={index}
                      className="flex items-center space-x-2 sm:space-x-3"
                    >
                      <div className="w-6 h-6 sm:w-8 sm:h-8 p-1 sm:p-2 bg-blue-100 text-blue-600 text-xs sm:text-sm font-bold rounded-full flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">
                          {contributor?.name}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 flex-shrink-0" />
                          <span className="truncate">{contributor?.contributions} Contributors</span>
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>

            <main 
              className="flex-1 p-2 sm:p-4 xl:p-6 lg:w-[81.5%]" 
              style={{ paddingTop: 0 }}
            >
              <div className="mx-auto max-w-full">
                <div className="pl-0 lg:pl-4 xl:pl-6" onClick={handleContentClick}>
                  {isMobile && (
                    <div className="mb-4 flex justify-between items-center">
                      <h1 className="text-lg font-semibold">Categories</h1>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleContributorsSidebar();
                        }}
                        className="flex items-center space-x-2 touch-manipulation min-h-[44px] px-3 py-2"
                        type="button"
                      >
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span>Contributors</span>
                      </Button>
                    </div>
                  )}

                  <div className="max-w-full mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
                    <div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-3 sm:gap-4">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                          Programming Categories
                        </h2>
                        <div className="relative w-full sm:w-48 lg:w-64">
                          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
                          <Input
                            placeholder="Search categories..."
                            className="pl-8 sm:pl-10 text-xs sm:text-sm ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                            onChange={(e) =>
                              handleCategorySearch(e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div
                        className={`grid gap-2 sm:gap-3 lg:gap-4 ${
                          categoryNotFound
                            ? "grid-cols-1"
                            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        }`}
                      >
                        {categories?.map((category) => (
                          <div
                            key={category?.name}
                            className={`bg-white p-3 sm:p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                              category._id === selectedCategory &&
                              "border-[#0284DA]"
                            }`}
                            style={{ borderWidth: 2 }}
                            onClick={() => handleSelectCategory(category._id)}
                          >
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm flex-shrink-0">
                                {category?.name?.[0]}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-sm sm:text-base truncate">
                                  {category?.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                                  {category?.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}

                        {categoryNotFound && (
                          <div className="bg-red-50 p-3 sm:p-4 rounded-lg text-center col-span-full">
                            <p className="text-red-700 text-sm">No category found</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="sm:hidden">
                        <Button
                          className="mt-3 sm:mt-4 w-full sm:w-auto bg-[#0284DA] hover:bg-[#0284FF] text-white flex items-center justify-center space-x-2 text-sm"
                          onClick={handleLoadMoreCategories}
                        >
                          <span>Load More</span>
                        </Button>
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-3 sm:gap-4">
                        <div className="flex flex-col">
                          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                            Available Programs
                          </h2>
                          {selectedCategory && totalPrograms > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              {selectedCategoryName} - Showing {startIndex} to {endIndex} of {totalPrograms} programs
                            </p>
                          )}
                        </div>
                        <div className="relative w-full sm:w-48 lg:w-64">
                          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
                          <Input
                            placeholder="Search programs..."
                            className="pl-8 sm:pl-10 text-xs sm:text-sm ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                            onChange={(e) =>
                              handleSearchPrograms(e.target.value)
                            }
                          />
                        </div>
                      </div>

                      {programNotFound && (
                        <div className="bg-red-50 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4 text-center">
                          <p className="text-red-700 text-sm">No Programs Found</p>
                        </div>
                      )}

                      {displayPrograms.length > 0 ? (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                            {displayPrograms.map((program) => (
                              <div
                                onClick={() => handleProgramClick(program?._id)}
                                key={program?._id}
                                className="bg-white p-3 sm:p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                              >
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm flex-shrink-0">
                                    {program?.name?.[0]}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-sm sm:text-base truncate">
                                      {program?.name}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                                      {program?.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                              <div className="text-sm text-gray-600">
                                Page {currentPage} of {totalPages}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handlePreviousPage}
                                  disabled={currentPage === 1}
                                  className="flex items-center space-x-1"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                  <span className="hidden sm:inline">Previous</span>
                                </Button>

                                <div className="flex items-center space-x-1">
                                  {getPageNumbers().map((page, index) => (
                                    <div key={index}>
                                      {page === '...' ? (
                                        <span className="px-2 py-1 text-gray-500">...</span>
                                      ) : (
                                        <Button
                                          variant={currentPage === page ? "default" : "outline"}
                                          size="sm"
                                          onClick={() => handlePageClick(page as number)}
                                          className={`w-8 h-8 p-0 ${
                                            currentPage === page 
                                              ? 'bg-[#0284DA] text-white' 
                                              : 'hover:bg-gray-100'
                                          }`}
                                        >
                                          {page}
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleNextPage}
                                  disabled={currentPage === totalPages}
                                  className="flex items-center space-x-1"
                                >
                                  <span className="hidden sm:inline">Next</span>
                                  <ChevronRight className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {!programNotFound && (
                            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg text-center">
                              <p className="text-blue-700 text-sm">
                                Please select a category to view its programs
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
          
          {isMobile && (
            <div
              className={`
                fixed inset-y-0 right-0 z-30 overflow-y-auto
                w-64 bg-white border-l border-gray-200 shadow-lg
                transform transition-transform duration-300 ease-in-out 
                top-16 p-4 h-[calc(100vh-4rem)]
                ${isContributorsSidebarOpen ? "translate-x-0" : "translate-x-full"}
              `}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold flex items-center">
                  <Trophy className="w-4 h-4 text-yellow-500 mr-2" /> 
                  Top Contributors
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleContributorsSidebar();
                  }}
                  className="p-2 hover:bg-gray-100 touch-manipulation min-h-[44px] min-w-[44px]"
                  type="button"
                  aria-label="Close contributors sidebar"
                >
                  <span className="text-xl leading-none">×</span>
                </Button>
              </div>
              <ol className="space-y-3">
                {filteredContributors?.map((contributor, index) => (
                  <li
                    key={index}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-7 h-7 p-1 bg-blue-100 text-blue-600 text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {contributor?.name}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Users className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{contributor?.contributions} Contributors</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {isMobile && (isSidebarOpen || isContributorsSidebarOpen) && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-20"
              onClick={(e) => {
                e.preventDefault();
                setIsSidebarOpen(false);
                setIsContributorsSidebarOpen(false);
              }}
              aria-label="Close sidebars"
            />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}