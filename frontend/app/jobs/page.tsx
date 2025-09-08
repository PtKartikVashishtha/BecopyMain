"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ChevronDown, ChevronRight, ChevronLeft, MapPin, DollarSign, CalendarDays,
  Users, Trophy, ChevronUp, RefreshCw, Search, Filter, Globe, Crosshair,
  AlertCircle, Clock, Building, Target
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
import { Program } from "@/types";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { calculateDistance, isWithinRadius } from "@/lib/geo";

export default function EnhancedJobs() {
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const rawIsMobile = useMediaQuery({ maxWidth: 640 });
  const rawIsTablet = useMediaQuery({ maxWidth: 1024 });
  const isMobile = isMounted && rawIsMobile;
  const isTablet = isMounted && rawIsTablet;
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedJobType, setSelectedJobType] = useState("");
  const [selectedExperience, setSelectedExperience] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  
  const { items, loading, error } = useAppSelector((state) => state.jobs);
  const recruiterItems = useAppSelector((state) => state.recruiters);
  
  // Enhanced geo state
  const { geoMode, userLocation, radiusKm, loading: geoLoading, error: geoError } = useAppSelector((state) => state.geo);

  const [expandedJobs, setExpandedJobs] = useState<(string | number)[]>([]);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleJobDescription = (jobId: string | number) => {
    setExpandedJobs((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchJobs()).unwrap(),
        dispatch(fetchRecruiters()).unwrap()
      ]);
      toast({
        title: "Success",
        description: "Jobs and recruiters refreshed successfully",
        variant: "success",
      });
    } catch (err) {
      console.error("Refresh failed", err);
      toast({
        title: "Error", 
        description: "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Initial data load
  useEffect(() => {
    if (isMounted) {
      const geoParams = geoMode && userLocation && userLocation.latitude ? {
        geoMode: true,
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        radius: radiusKm,
        userCountry: userLocation.country,
        userCity: userLocation.city
      } : null;

      dispatch(fetchJobs(geoParams)).catch((err) => console.error("Fetch jobs failed", err));
      dispatch(fetchRecruiters()).catch((err) => console.error("Fetch recruiters failed", err));
    }
  }, [dispatch, isMounted]);

  // Extract unique filter options
  const filterOptions = useMemo(() => {
    if (!items || items.length === 0) return { companies: [], locations: [], jobTypes: [], experiences: [] };
    
    return {
      companies: Array.from(new Set(items.map((job) => job.company).filter(Boolean))).sort(),
      locations: Array.from(new Set(items.map((job) => job.jobLocation).filter(Boolean))).sort(),
      jobTypes: Array.from(new Set(items.map((job) => job.jobType).filter(Boolean))).sort(),
      experiences: Array.from(new Set(items.map((job) => job.experienceLevel).filter(Boolean))).sort()
    };
  }, [items]);

  // Enhanced filtering with distance calculation
  const filteredAndSortedJobs = useMemo(() => {
    if (!items || items.length === 0) return [];
    
    let filtered = items.filter((job) => {
      if (!job) return false;
      
      // Basic text filtering
      const matchesSearch =
        searchTerm === "" ||
        (job.title && job.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (job.description && job.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (job.company && job.company.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCompany = selectedCompany === "" || job.company === selectedCompany;
      const matchesLocation = selectedLocation === "" || job.jobLocation === selectedLocation;
      const matchesJobType = selectedJobType === "" || job.jobType === selectedJobType;
      const matchesExperience = selectedExperience === "" || job.experienceLevel === selectedExperience;
      
      // Enhanced geo filtering
      let matchesGeo = true;
      
      if (geoMode && userLocation && userLocation.latitude && userLocation.longitude && userLocation.country !== 'Unknown') {
        // Prioritize remote jobs (always show these)
        if (job.remoteWork) {
          matchesGeo = true;
        }
        // Use coordinate-based distance if available
        else if (job.latitude && job.longitude) {
          matchesGeo = isWithinRadius(
            userLocation.latitude,
            userLocation.longitude,
            job.latitude,
            job.longitude,
            radiusKm
          );
        }
        // Text-based location matching as fallback
        else {
          const countryMatch = job.country?.toLowerCase() === userLocation.country.toLowerCase() ||
                             job.countryCode?.toLowerCase() === userLocation.countryCode.toLowerCase();
          const regionMatch = job.region?.toLowerCase() === userLocation.region.toLowerCase();
          const cityMatch = job.city?.toLowerCase() === userLocation.city.toLowerCase();
          
          // More lenient matching for text-based locations
          matchesGeo = countryMatch || regionMatch || cityMatch ||
                      (job.jobLocation && userLocation.country !== 'Unknown' && 
                       job.jobLocation.toLowerCase().includes(userLocation.country.toLowerCase())) ||
                      (job.jobLocation && userLocation.city !== 'Unknown' &&
                       job.jobLocation.toLowerCase().includes(userLocation.city.toLowerCase()));
        }
      }
      
      return matchesSearch && matchesCompany && matchesLocation && 
             matchesJobType && matchesExperience && matchesGeo;
    });

    // Sort jobs
    filtered = [...filtered].sort((a, b) => {
  switch (sortBy) {
    case "newest":
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    case "deadline":
      return new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime();
    case "company":
      return (a.company || "").localeCompare(b.company || "");
    case "distance":
      if (!geoMode || !userLocation?.latitude || !userLocation?.longitude) return 0;
      const distanceA = a.latitude && a.longitude
        ? calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude)
        : 999999;
      const distanceB = b.latitude && b.longitude
        ? calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude)
        : 999999;
      return distanceA - distanceB;
    default:
      return 0;
  }
});

    return filtered;
  }, [items, searchTerm, selectedCompany, selectedLocation, selectedJobType, 
      selectedExperience, geoMode, userLocation, radiusKm, sortBy]);

  // Enhanced recruiter filtering
  const filteredRecruiters = useMemo(() => {
    let recruiters = recruiterItems.items || [];
    
    
    
    return [...recruiters].sort((a, b) => (b.contributions || 0) - (a.contributions || 0));
  }, [recruiterItems.items, geoMode, userLocation, radiusKm]);

  const pageSize = isMobile ? 1 : isTablet ? 2 : 2;
  const paginatedJobs = filteredAndSortedJobs.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredAndSortedJobs.length / pageSize);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCompany("");
    setSelectedLocation("");
    setSelectedJobType("");
    setSelectedExperience("");
    setSortBy("newest");
    setPage(1);
  };

  const handleApplyJob = (job: any) => {
    const jobTitle = encodeURIComponent(job?.title || '');
    const jobId = job?._id || '';
    router.push(`/apply-job?jobTitle=${jobTitle}&jobId=${jobId}`);
  };

  const onSelectProgram = (program: Program) => {
    window.location.assign(`/?programId=${program._id}`);
  };

  const formatDate = (dateString: any) => {
    if (!dateString) return "No deadline";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid date";
    }
  };

  const isExpired = (dateString: any) => {
    if (!dateString) return false;
    try {
      return new Date(dateString) < new Date();
    } catch (error) {
      return false;
    }
  };

  const getCountryFlag = (countryCode: string) => {
    if (!countryCode || countryCode === 'XX') return '🌍';
    const flagEmojis: { [key: string]: string } = {
      'IN': '🇮🇳', 'US': '🇺🇸', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺',
      'DE': '🇩🇪', 'FR': '🇫🇷', 'JP': '🇯🇵', 'CN': '🇨🇳', 'BR': '🇧🇷',
      'SG': '🇸🇬', 'NL': '🇳🇱', 'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰',
    };
    return flagEmojis[countryCode.toUpperCase()] || '🌍';
  };

  const getJobDistance = (job: any) => {
    if (!geoMode || !userLocation || !userLocation.latitude || !userLocation.longitude) return null;
    if (!job.latitude || !job.longitude) return null;
    
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      job.latitude,
      job.longitude
    );
    
    return Math.round(distance);
  };

  const isLocationValid = userLocation && 
                         userLocation.country !== 'Unknown' && 
                         userLocation.latitude !== 0 && 
                         userLocation.longitude !== 0;

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {isMobile && (
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          onSelectProgram={onSelectProgram}
          onCloseSidebar={() => setIsSidebarOpen(false)}
          onShowPostJob={() => {}}
          onShowApplyJob={() => {}}
        />
      )}

      <div className="pt-12 sm:pt-16 flex-1 flex flex-col h-[calc(100vh-3rem)] sm:h-[calc(100vh-4rem)]">
        <div className="flex flex-col lg:flex-row flex-1 min-h-0">
          {/* Desktop Sidebar */}
          {!isMobile && !isTablet && (
            <aside className="w-1/5 px-3 flex-shrink-0">
              <div className="sticky top-20 w-full border border-gray-200 rounded-md p-3 h-[calc(100vh-6rem)] shadow-md bg-white overflow-y-auto">
                <h2 className="text-base font-semibold flex items-center mb-3">
                  <Trophy className="w-4 h-4 text-yellow-500 mr-2" /> Top Recruiters
                </h2>
                <ol className="space-y-2">
                  {filteredRecruiters?.slice(0, 15).map((recruiter, index) => (
                    <li key={recruiter._id || index} className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">{recruiter?.name}</p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <Users className="w-3 h-3 mr-1" /> {recruiter?.contributions || 0}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1 flex flex-col p-3 sm:p-4 lg:p-6 min-h-0">
            <div className="w-full max-w-6xl mx-auto flex flex-col flex-1 min-h-0">
              {/* Header Section */}
              <div className="mb-3 flex justify-between items-start flex-shrink-0">
                <div>
                  <h1 className="text-lg sm:text-xl font-bold mb-1">Job Opportunities</h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                    <p className="text-gray-600 text-xs sm:text-sm">
                      {geoMode && isLocationValid ? (
                        <span className="flex items-center">
                          <Crosshair className="w-3 h-3 mr-1" />
                          Within {radiusKm}km of {userLocation.city !== 'Unknown' ? userLocation.city : userLocation.region}, {userLocation.countryCode} {getCountryFlag(userLocation.countryCode)} • {filteredAndSortedJobs.length} jobs
                        </span>
                      ) : geoMode && (geoLoading || !isLocationValid) ? (
                        <span className="flex items-center">
                          <Globe className="w-3 h-3 mr-1 animate-pulse" />
                          {geoLoading ? 'Detecting your location...' : 'Location detection failed'}
                        </span>
                      ) : (
                        `Showing all jobs globally • ${filteredAndSortedJobs.length} jobs available`
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-xs px-3 py-1"
                >
                  <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>

              {/* Enhanced Status Messages */}
              {geoMode && geoError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex-shrink-0">
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                    <p className="text-red-700 text-sm">
                      Location detection failed: {geoError}
                    </p>
                  </div>
                </div>
              )}

              {geoMode && isLocationValid && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg flex-shrink-0">
                  <p className="text-green-700 text-sm flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Location filter active: Showing content within {radiusKm}km of {userLocation.city !== 'Unknown' ? userLocation.city : userLocation.region}, {userLocation.countryCode} {getCountryFlag(userLocation.countryCode)}
                  </p>
                </div>
              )}

              {/* Search and Enhanced Filter Section */}
              <div className="mb-3 flex flex-col sm:flex-row gap-2 flex-shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search jobs, companies, or descriptions..."
                    className="border rounded-lg pl-10 pr-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="deadline">Deadline</option>
                  <option value="company">Company A-Z</option>
                  {geoMode && isLocationValid && <option value="distance">Distance</option>}
                </select>
                
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-xs px-3 py-2"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </Button>
              </div>

              {/* Collapsible Enhanced Filters */}
              {showFilters && (
                <div className="mb-3 p-3 bg-white rounded-lg border space-y-3 flex-shrink-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                      <select
                        className="border rounded px-3 py-2 text-sm w-full appearance-none bg-white"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                      >
                        <option value="">All Locations</option>
                        {filterOptions.locations.map((loc) => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                      <select
                        className="border rounded px-3 py-2 text-sm w-full appearance-none bg-white"
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                      >
                        <option value="">All Companies</option>
                        {filterOptions.companies.map((comp) => (
                          <option key={comp} value={comp}>{comp}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Job Type</label>
                      <select
                        className="border rounded px-3 py-2 text-sm w-full appearance-none bg-white"
                        value={selectedJobType}
                        onChange={(e) => setSelectedJobType(e.target.value)}
                      >
                        <option value="">All Types</option>
                        {filterOptions.jobTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Experience</label>
                      <select
                        className="border rounded px-3 py-2 text-sm w-full appearance-none bg-white"
                        value={selectedExperience}
                        onChange={(e) => setSelectedExperience(e.target.value)}
                      >
                        <option value="">All Levels</option>
                        {filterOptions.experiences.map((exp) => (
                          <option key={exp} value={exp}>{exp}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      onClick={clearFilters} 
                      className="text-sm px-4 py-2"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              )}

              {/* Jobs List - Main scrollable content */}
              <div className="flex flex-col flex-1 min-h-0">
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mb-3 flex-shrink-0">
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
                      {page} of {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                      disabled={page === totalPages}
                      className="text-xs px-3 py-1"
                    >
                      <span className="mr-1">Next</span> <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                {/* Scrollable jobs container */}
                <div className="flex-1 overflow-y-auto">
                  {/* Loading State */}
                  {loading && (
                    <div className="text-center text-gray-600 py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      <p className="text-sm">Loading jobs...</p>
                    </div>
                  )}

                  {/* Error State */}
                  {error && (
                    <div className="text-center text-red-600 py-6 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm font-medium">Error loading jobs</p>
                      <p className="text-xs text-red-500 mt-1">{error.toString()}</p>
                      <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-2">
                        Try Again
                      </Button>
                    </div>
                  )}

                  {/* No jobs found message with geo context */}
                  {!loading && filteredAndSortedJobs.length === 0 && (
                    <div className="text-center text-gray-600 py-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        {geoMode ? <Crosshair className="w-8 h-8 text-gray-400" /> : <Search className="w-8 h-8 text-gray-400" />}
                      </div>
                      <p className="text-sm font-medium">
                        {geoMode && isLocationValid 
                          ? `No jobs available within ${radiusKm}km of your location`
                          : "No jobs found"
                        }
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {geoMode && isLocationValid
                          ? "Try increasing your search radius or switching to global view"
                          : searchTerm || selectedCompany || selectedLocation
                          ? "Try adjusting your filters or search terms"
                          : "Check back later for new opportunities"
                        }
                      </p>
                    </div>
                  )}

                  {/* Enhanced Jobs List */}
                  <div className="space-y-4 pb-4">
                    {paginatedJobs.map((job, index) => {
                      const distance = getJobDistance(job);
                      const actualIndex = (page - 1) * pageSize + index;
                      
                      return (
                        <div
                          key={job?._id || actualIndex}
                          className="border rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col sm:flex-row gap-4">
                            {/* Enhanced Logo Section */}
                            <div className="flex flex-col items-center sm:items-start gap-2 w-full sm:w-16">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                {job?.recruiter?.companyLogo ? (
                                  <img 
                                    src={job.recruiter.companyLogo} 
                                    alt={job?.company} 
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-blue-500 text-white rounded text-sm font-bold flex items-center justify-center">
                                    {job?.company?.charAt(0) || 'J'}
                                  </div>
                                )}
                              </div>
                              <div className="text-center sm:text-left">
                                <div className="text-xs font-semibold break-words max-w-[60px]">
                                  {job?.company && job.company.length > 8
                                    ? `${job.company.substring(0, 8)}...`
                                    : job?.company || 'Company'}
                                </div>
                                {distance && (
                                  <div className="text-xs text-blue-600 font-medium">
                                    {distance}km away
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Enhanced Details */}
                            <div className="flex-1 flex flex-col">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <h2 className="text-base font-semibold text-gray-900 mb-1">
                                    {job?.title || 'Job Title'}
                                  </h2>
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="flex items-center px-2 py-1 rounded-full border bg-gray-50 text-gray-700">
                                      <MapPin className="w-3 h-3 mr-1" /> 
                                      {job?.jobLocation || 'Location not specified'}
                                    </span>
                                    {job?.salary && (
                                      <span className="flex items-center px-2 py-1 rounded-full border bg-gray-50 text-gray-700">
                                        <DollarSign className="w-3 h-3 mr-1" /> {job.salary}
                                      </span>
                                    )}
                                    <span className="flex items-center px-2 py-1 rounded-full border bg-gray-50 text-gray-700">
                                      <CalendarDays className="w-3 h-3 mr-1" />
                                      {formatDate(job?.deadline)}
                                    </span>
                                    {job?.jobType && (
                                      <span className="flex items-center px-2 py-1 rounded-full border bg-blue-50 text-blue-700">
                                        <Building className="w-3 h-3 mr-1" /> {job.jobType}
                                      </span>
                                    )}
                                    {job?.remoteWork && (
                                      <span className="flex items-center px-2 py-1 rounded-full border bg-purple-50 text-purple-700">
                                        <Globe className="w-3 h-3 mr-1" /> Remote
                                      </span>
                                    )}
                                    {geoMode && isLocationValid && !job?.remoteWork && (
                                      <span className="flex items-center px-2 py-1 rounded-full border bg-green-50 text-green-700">
                                        {getCountryFlag(job?.countryCode || userLocation.countryCode)} Local
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Enhanced Status Badge */}
                                {isExpired(job?.deadline) ? (
                                  <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded-full">
                                    Expired
                                  </span>
                                ) : job?.isPinned ? (
                                  <span className="bg-yellow-100 text-yellow-600 text-xs font-semibold px-2 py-1 rounded-full">
                                    Featured
                                  </span>
                                ) : (
                                  <span className="bg-green-100 text-green-600 text-xs font-semibold px-2 py-1 rounded-full">
                                    Active
                                  </span>
                                )}
                              </div>

                              {/* Enhanced Description */}
                              <div className="mt-2 mb-3">
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  {expandedJobs.includes(actualIndex)
                                    ? job?.description || 'No description available'
                                    : job?.description && job.description.length > 150
                                    ? `${job.description.slice(0, 150)}...`
                                    : job?.description || 'No description available'}
                                </p>
                                
                                {job?.description && job.description.length > 150 && (
                                  <button
                                    className="text-blue-600 text-xs flex items-center gap-1 hover:underline mt-1"
                                    onClick={() => toggleJobDescription(actualIndex)}
                                  >
                                    {expandedJobs.includes(actualIndex) ? (
                                      <>
                                        <ChevronUp className="w-3 h-3" /> Show Less
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-3 h-3" /> Show More
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>

                              {/* Enhanced Job Actions */}
                              <div className="flex justify-between items-center mt-auto">
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Posted: {formatDate(job?.createdAt)}
                                  </span>
                                  {job?.experienceLevel && (
                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                      {job.experienceLevel}
                                    </span>
                                  )}
                                </div>
                                
                                <Button
                                  onClick={() => handleApplyJob(job)}
                                  className="bg-blue-500 hover:bg-blue-700 text-white text-sm px-4 py-2"
                                  size="sm"
                                  disabled={isExpired(job?.deadline)}
                                >
                                  {isExpired(job?.deadline) ? "Expired" : "Apply Now"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Mobile/Tablet Bottom Recruiters */}
        {(isMobile || isTablet) && !loading && (
          <div className="bg-white border-t px-4 py-3 flex-shrink-0">
            <h3 className="text-sm font-semibold flex items-center mb-3">
              <Trophy className="w-4 h-4 text-yellow-500 mr-1" /> Top Recruiters
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredRecruiters?.slice(0, 6).map((recruiter, index) => (
                <div key={recruiter._id || index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded text-xs">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 text-xs font-bold rounded-full flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{recruiter?.name}</p>
                    <p className="text-xs text-gray-500">
                      <Users className="w-3 h-3 inline mr-1" /> {recruiter?.contributions || 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="pb-2 flex-shrink-0">
        <Footer />
      </div>
    </div>
  );
}