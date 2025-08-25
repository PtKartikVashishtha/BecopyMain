"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  MapPin,
  DollarSign,
  CalendarDays,
  Users,
  Trophy,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchJobs } from "@/store/reducers/jobSlice";
import { format } from "date-fns";
import { fetchRecruiters } from "@/store/reducers/recruiterSlice";
import Sidebar from "@/components/layout/sidebar";
import { useMediaQuery } from "react-responsive";
import { ApplyJobDialog } from "@/components/dialog/applyjob-dialog";
import { Program } from "@/types";

export default function Jobs() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showApplyJob, setShowApplyJob] = useState(false);
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery({ maxWidth: 640 });
  const isTablet = useMediaQuery({ maxWidth: 1024 });
  const [page, setPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const { items, loading, error } = useAppSelector((state) => state.jobs);
  const recruiterItems = useAppSelector((state) => state.recruiters);

  const [expandedJobs, setExpandedJobs] = useState<(string | number)[]>([]);
  const toggleJobDescription = (jobId: string | number) => {
    setExpandedJobs((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  useEffect(() => {
    dispatch(fetchJobs()).catch((err) => console.error("Fetch failed", err));
    dispatch(fetchRecruiters());
  }, [dispatch]);

  const companies = useMemo(() => {
    if (!items) return [];
    return Array.from(new Set(items.map((job) => job.company))).sort();
  }, [items]);

  const locations = useMemo(() => {
    if (!items) return [];
    return Array.from(new Set(items.map((job) => job.jobLocation))).sort();
  }, [items]);

  const filteredJobs = useMemo(() => {
    if (!items) return [];
    return items.filter((job) => {
      const matchesSearch =
        searchTerm === "" ||
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCompany =
        selectedCompany === "" || job.company === selectedCompany;
      const matchesLocation =
        selectedLocation === "" || job.jobLocation === selectedLocation;
      return matchesSearch && matchesCompany && matchesLocation;
    });
  }, [items, searchTerm, selectedCompany, selectedLocation]);

  const pageSize = 2;
  const paginatedJobs = filteredJobs.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredJobs.length / pageSize);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCompany("");
    setSelectedLocation("");
    setPage(1);
  };

  const filteredRecruiters =
    selectedLocation === ""
      ? recruiterItems.items
      : recruiterItems.items.filter((c) => c.country === selectedLocation);

  let onSelectProgram = (program: Program) => {
    window.location.assign(`/?programId=${program._id}`);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {isMobile && (
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          onSelectProgram={onSelectProgram}
          onCloseSidebar={() => setIsSidebarOpen(false)}
          expandedCategories={[]}
          toggleCategory={() => {}}
          onShowJobPosting={() => {}}
          onShowApplyJob={() => {}}
        />
      )}

      <div className="pt-12 sm:pt-16 flex-1 flex flex-col">
        <div className="flex flex-col lg:flex-row flex-1">
          {/* Desktop Sidebar */}
          {!isMobile && !isTablet && (
            <aside className="w-1/6 px-4">
              <div className="sticky top-20 w-full border border-gray-200 rounded-md p-4 h-[calc(100vh-6rem)] shadow-md bg-white overflow-y-auto">
                <h2 className="text-lg font-semibold flex items-center mb-4">
                  <Trophy className="w-5 h-5 text-yellow-500 mr-2" /> Top 100 Recruiters
                </h2>
                <ol className="space-y-3">
                  {filteredRecruiters?.map((recruiter, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 text-sm font-bold rounded-full flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{recruiter?.name}</p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <Users className="w-3 h-3 mr-1" /> {recruiter?.contributions} recruiters
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-6xl mx-auto flex flex-col flex-1">
              <div className="mb-4">
                <h1 className="text-lg sm:text-2xl font-bold mb-1">Job Opportunities</h1>
                <p className="text-gray-600 text-xs sm:text-sm">Find your next role in tech</p>
              </div>

              {/* Filters */}
              <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3 mb-5 w-full">
                <input
                  type="text"
                  placeholder="Search jobs..."
                  className="border rounded px-3 py-2 text-sm w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  className="border rounded px-3 py-2 text-sm w-full sm:w-auto sm:min-w-[150px] sm:max-w-[200px] appearance-none bg-white truncate"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  style={{
                    maxHeight: isMobile ? '200px' : '240px',
                    overflowY: 'auto'
                  }}
                >
                  <option value="">All Locations</option>
                  {locations?.map((loc) => (
                    <option key={loc} value={loc} className="truncate">{loc}</option>
                  ))}
                </select>
                <select
                  className="border rounded px-3 py-2 text-sm w-full sm:w-auto sm:min-w-[150px] sm:max-w-[200px] appearance-none bg-white truncate"
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  style={{
                    maxHeight: isMobile ? '200px' : '240px',
                    overflowY: 'auto'
                  }}
                >
                  <option value="">All Companies</option>
                  {companies?.map((comp) => (
                    <option key={comp} value={comp} className="truncate">{comp}</option>
                  ))}
                </select>
                <Button variant="outline" onClick={clearFilters} className="text-sm px-4 py-2 w-full sm:w-auto sm:min-w-[80px]">
                  Clear
                </Button>
              </div>

              {/* Pagination */}
              <div className="flex justify-center items-center gap-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="text-xs px-3 py-1"
                >
                  <ChevronLeft className="w-3 h-3" /> <span className="ml-1">Prev</span>
                </Button>
                <span className="text-xs sm:text-sm bg-blue-500 text-white px-3 py-1 rounded">
                  {page} of {totalPages || 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages || totalPages === 0}
                  className="text-xs px-3 py-1"
                >
                  <span className="mr-1">Next</span> <ChevronRight className="w-3 h-3" />
                </Button>
              </div>

              {/* Loader / Error */}
              {loading && (
                <div className="text-center text-gray-600 py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-sm">Loading jobs...</p>
                </div>
              )}
              {error && (
                <p className="text-center text-red-600 py-4 text-sm">
                  Error loading jobs: {error.toString()}
                </p>
              )}

              {/* Jobs List */}
              <div className="flex flex-col gap-6 flex-1">
                {paginatedJobs.length === 0 && !loading && (
                  <div className="text-center text-gray-600 py-6">
                    <p className="text-sm">No jobs found.</p>
                  </div>
                )}
                {paginatedJobs.map((job, index) => (
                  <div
                    key={job?.id ?? index}
                    className="border rounded-lg p-4 sm:p-6 shadow bg-white space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Logo */}
                      <div className="flex flex-col items-center sm:items-start gap-2 w-full sm:w-20">
                        <div className="w-14 h-14">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-full w-full text-gray-500 bg-gray-100 rounded-md p-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 4h6a2 2 0 002-2v-1H7v1a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div className="text-center sm:text-left">
                          <div className="text-sm font-semibold break-words">
                          {job?.company && job.company.length > 8
                            ? job.company.replace(/(\S{8})(\S)/g, '$1-\n$2')
                            : job?.company}
                        </div>
                          <div className="text-xs text-gray-500 truncate">{job?.recruiter}</div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <h2 className="text-base font-semibold">{job?.title}</h2>
                          {new Date(job?.deadline) < new Date() && (
                            <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded-full">
                              Expired
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3 text-xs">
                          <span className="flex items-center px-2 py-1 rounded border bg-gray-50">
                            <MapPin className="w-3 h-3 mr-1" /> {job.jobLocation}
                          </span>
                          <span className="flex items-center px-2 py-1 rounded border bg-gray-50">
                            <DollarSign className="w-3 h-3 mr-1" /> {job.salary}
                          </span>
                          <span className="flex items-center px-2 py-1 rounded border bg-gray-50">
                            <CalendarDays className="w-3 h-3 mr-1" />{" "}
                            {format(new Date(job?.deadline), "MMM dd")}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {expandedJobs.includes(index)
                            ? job.description
                            : job.description?.length > 120
                            ? `${job.description.slice(0, 120)}...`
                            : job.description}
                        </p>
                        <div className="flex justify-between items-center mt-3">
                          {job.description?.length > 120 && (
                            <button
                              className="text-blue-600 text-xs flex items-center gap-1 hover:underline"
                              onClick={() => toggleJobDescription(index)}
                            >
                              {expandedJobs.includes(index) ? (
                                <>
                                  <ChevronUp className="w-3 h-3" /> Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" /> More
                                </>
                              )}
                            </button>
                          )}
                          <Button
                            onClick={() => setShowApplyJob(true)}
                            className="bg-blue-500 hover:bg-blue-700 text-white text-xs px-3 py-1 ml-auto"
                            size="sm"
                            disabled={new Date(job?.deadline) < new Date()}
                          >
                            {new Date(job?.deadline) < new Date() ? "Expired" : "Apply"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>

        {/* Recruiters (Mobile/Tablet Bottom) */}
        {(isMobile || isTablet) && !loading && (
          <div className="bg-white border-t px-4 mt-6">
            <h3 className="text-sm font-semibold flex items-center mb-3">
              <Trophy className="w-4 h-4 text-yellow-500 mr-1" /> Top Recruiters
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredRecruiters?.map((recruiter, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded text-xs">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 text-xs font-bold rounded-full flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{recruiter?.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
        <div className="pb-3">
          <Footer />
        </div>
      <ApplyJobDialog open={showApplyJob} onOpenChange={setShowApplyJob} />
    </div>
  );
}