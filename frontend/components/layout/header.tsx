import {
  Check, Dot, Menu, LogOut, UserRound, Search, User, Globe, MapPin, 
  Wifi, RotateCcw, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { fetchSettings } from "@/store/reducers/settingSlice";
import { 
  toggleGeoMode, 
  fetchUserLocation, 
  setRadius, 
  resetGeoLocation 
} from "@/store/reducers/geoSlice";

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSelectedProgram?: (program: any) => void;
}

const selectedProgramInit = {
  _id: "", name: "", code: { java: "", python: "", html: "" },
  views: 0, copies: 0, shares: 0,
};

const Header = ({ isSidebarOpen, toggleSidebar, setSelectedProgram }: HeaderProps) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Get geo state from Redux
  const { 
    geoMode, 
    userLocation, 
    loading: geoLoading, 
    radiusKm,
    error: geoError,
    isDetecting 
  } = useAppSelector((state) => state.geo);
  
  const programs = useAppSelector((state) => state.programs.items);
  const settings = useAppSelector((state) => state.settings.item);
  const { user, logout, isAuthenticated } = useAuth();

  // Initialize settings and location on mount
  useEffect(() => {
    dispatch(fetchSettings());
    
    // Only fetch location if we don't have recent valid data
    const now = Date.now();
    const isStale = !userLocation?.country || 
                   userLocation.country === 'Unknown' ||
                   !userLocation.lastFetch ||
                   (now - userLocation.lastFetch) > 15 * 60 * 1000; // 15 minutes

    if (isStale) {
      console.log('Fetching location data...');
      dispatch(fetchUserLocation());
    }
  }, [dispatch]);

  const handleGeoToggle = async () => {
    console.log('Geo toggle clicked');
    
    if (!geoMode) {
      // Enabling geo mode
      if (!userLocation || userLocation.country === 'Unknown') {
        console.log('No valid location, fetching...');
        await dispatch(fetchUserLocation());
      }
    }
    
    dispatch(toggleGeoMode());
  };

  const handleLocationRefresh = () => {
    console.log('Refreshing location...');
    dispatch(resetGeoLocation());
    dispatch(fetchUserLocation());
  };

  const handleHeaderLogoClick = () => {
    if (setSelectedProgram && pathname === "/") {
      setSelectedProgram(selectedProgramInit);
    }
    router.push("/");
  };

  const handleViewProfile = () => {
    router.push("/profile");
  };

  const getLocationDisplay = () => {
    if (geoLoading || isDetecting) return 'Detecting...';
    if (!userLocation) return 'Location Unknown';
    if (userLocation.country === 'Unknown') return 'Unable to detect';
    
    return userLocation.city !== 'Unknown' 
      ? `${userLocation.city}, ${userLocation.countryCode}`
      : userLocation.region !== 'Unknown'
      ? `${userLocation.region}, ${userLocation.countryCode}`
      : `${userLocation.country}`;
  };

  const getCountryFlag = (countryCode: string) => {
    if (!countryCode || countryCode === 'XX') return '🌍';
    const flags: { [key: string]: string } = {
      'IN': '🇮🇳', 'US': '🇺🇸', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺',
      'DE': '🇩🇪', 'FR': '🇫🇷', 'JP': '🇯🇵', 'CN': '🇨🇳', 'BR': '🇧🇷',
      'SG': '🇸🇬', 'NL': '🇳🇱', 'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰',
    };
    return flags[countryCode.toUpperCase()] || '🌍';
  };

  const isLocationValid = userLocation && 
                         userLocation.country !== 'Unknown' && 
                         userLocation.latitude !== 0 && 
                         userLocation.longitude !== 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 w-full h-12 bg-[#0284DA] flex justify-between items-center px-4">
      {/* Logo */}
      <div className="flex items-center cursor-pointer" onClick={handleHeaderLogoClick}>
        <h1 className="text-[#f2d898] text-3xl font-bold">&lt;Be&gt;</h1>
        <h1 className="text-[#7ad1f4] text-3xl font-bold ml-1">Copy</h1>
      </div>

      {/* Center Tabs */}
      <div className="hidden xl:flex space-x-6 items-center">
        <p onClick={() => router.push("/categories")}
           className="text-[#7AD2F4] font-medium text-sm transition duration-300 ease-in-out hover:bg-blue-300 p-2 rounded-md hover:text-white md:text-base cursor-pointer">
          Codes
        </p>

        {settings?.isAddCode && (
          <button onClick={() => router.push("/add-code")}
                  className="text-[#7AD2F4] font-medium text-sm transition duration-300 ease-in-out hover:bg-blue-300 p-2 rounded-md hover:text-white md:text-base cursor-pointer">
            Add Code
          </button>
        )}

        {settings?.isJobs && (
          <p onClick={() => router.push("/jobs")}
             className="text-[#7AD2F4] font-medium text-sm transition duration-300 ease-in-out hover:bg-blue-300 p-2 rounded-md hover:text-white md:text-base cursor-pointer">
            Jobs
          </p>
        )}

        {settings?.isPostJob && (
          <button onClick={() => router.push("/post-job")}
                  className="text-[#7AD2F4] font-medium text-sm transition duration-300 ease-in-out hover:bg-blue-300 p-2 rounded-md hover:text-white md:text-base cursor-pointer">
            Post Job
          </button>
        )}

        {settings?.isApplyJob && (
          <button onClick={() => router.push("/apply-job")}
                  className="text-[#7AD2F4] font-medium text-sm transition duration-300 ease-in-out hover:bg-blue-300 p-2 rounded-md hover:text-white md:text-base cursor-pointer">
            Apply Job
          </button>
        )}

        <p onClick={() => router.push("/quiz")}
           className="text-[#7AD2F4] font-medium text-sm transition duration-300 ease-in-out hover:bg-blue-300 p-2 rounded-md hover:text-white md:text-base cursor-pointer">
          Quiz
        </p>
        
        <p onClick={() => router.push("/faq")}
           className="text-[#7AD2F4] font-medium text-sm transition duration-300 ease-in-out hover:bg-blue-300 p-2 rounded-md hover:text-white md:text-base cursor-pointer">
          FAQ
        </p>
        
        <p onClick={() => router.push("/policy")}
           className="text-[#7AD2F4] font-medium text-sm transition duration-300 ease-in-out hover:bg-blue-300 p-2 rounded-md hover:text-white md:text-base cursor-pointer">
          Policy
        </p>
        
        <p onClick={() => router.push("/contact")}
           className="text-[#7AD2F4] font-medium text-sm transition duration-300 ease-in-out hover:bg-blue-300 p-2 rounded-md hover:text-white md:text-base cursor-pointer">
          Contact Us
        </p>
      </div>

      {/* Stats & User */}
      <div className="md:flex items-center space-x-4">
        <div className="hidden lg:flex items-center">
          <p className="text-[#ffd633] flex items-center text-md whitespace-nowrap">
            <Dot className="h-3 mr-1" />100% Free
          </p>
          <p className="text-[#00ff55] flex items-center text-sm md:text-base">
            <Check className="h-3 mr-1" />{programs?.length ?? 0} Codes
          </p>
          <p className="text-[#ffd633] flex items-center text-sm md:text-base">
            <Dot className="h-3 mr-1" />350 Live
          </p>
        </div>

        <div className="flex items-center space-x-2 relative">
          {/* Search Input */}
          {showSearch && (
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search..."
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none w-40"
            />
          )}

          <button onClick={() => setShowSearch((prev) => !prev)}>
            <Search className="text-cyan-300 h-5 w-5" />
          </button>

          {/* User Menu */}
          {isAuthenticated ? (
            <Select>
              <SelectTrigger className="bg-transparent w-30 border-none focus:outline-none">
                <Avatar>
                  <AvatarFallback className="bg-[#ff1493] text-white">
                    {user?.name?.split(" ").map((word) => word[0]?.toUpperCase()).join("") || "U"}
                  </AvatarFallback>
                </Avatar>
              </SelectTrigger>
              <SelectContent className="ring-0 p-0 w-72">
                <Button
                  onClick={handleViewProfile}
                  className="w-full h-full bg-transparent text-black hover:bg-gray-100 justify-start rounded-none border-b"
                >
                  <User className="h-4 w-4 mr-4" />
                  View Profile
                </Button>
                
                {/* Enhanced Geo Controls */}
                <div className="border-b">
                  <Button
                    onClick={handleGeoToggle}
                    disabled={geoLoading || isDetecting}
                    className={`w-full h-full justify-start rounded-none transition-colors duration-200 ${
                      geoMode && isLocationValid
                        ? "bg-green-50 text-green-700 hover:bg-green-100"
                        : geoMode && !isLocationValid
                        ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"  
                        : "bg-transparent text-black hover:bg-gray-100"
                    } ${(geoLoading || isDetecting) && "opacity-50 cursor-not-allowed"}`}
                  >
                    <div className="flex items-center w-full">
                      {geoLoading || isDetecting ? (
                        <Wifi className="h-4 w-4 mr-3 animate-pulse" />
                      ) : geoError ? (
                        <AlertCircle className="h-4 w-4 mr-3 text-red-500" />
                      ) : (
                        <Globe className="h-4 w-4 mr-3" />
                      )}
                      <div className="flex flex-col items-start flex-1">
                        <span className="text-sm font-medium">
                          {geoMode ? 'Location Mode' : 'Global Mode'}
                        </span>
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">
                          {getLocationDisplay()}
                        </span>
                      </div>
                      {userLocation && userLocation.country !== 'Unknown' && (
                        <span className="text-lg ml-2">
                          {getCountryFlag(userLocation.countryCode)}
                        </span>
                      )}
                    </div>
                  </Button>
                  
                  {/* Location Controls */}
                  <div className="px-4 py-2 bg-gray-50 border-t space-y-2">
                    {/* Refresh Location Button */}
                    <Button
                      onClick={handleLocationRefresh}
                      disabled={geoLoading || isDetecting}
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                    >
                      <RotateCcw className={`h-3 w-3 mr-2 ${(geoLoading || isDetecting) ? 'animate-spin' : ''}`} />
                      Refresh Location
                    </Button>
                    
                    {/* Radius Selector (when geo mode is active and location is valid) */}
                    {geoMode && isLocationValid && (
                      <>
                        <label className="text-xs text-gray-700 font-medium block">
                          Search Radius:
                        </label>
                        <select
                          value={radiusKm}
                          onChange={(e) => dispatch(setRadius(Number(e.target.value)))}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                        >
                          <option value={50}>50 km</option>
                          <option value={100}>100 km</option>
                          <option value={200}>200 km</option>
                          <option value={250}>250 km (Default)</option>
                          <option value={300}>300 km</option>
                          <option value={500}>500 km</option>
                        </select>
                        <div className="flex items-center mt-1">
                          <MapPin className="h-3 w-3 text-green-600 mr-1" />
                          <span className="text-xs text-green-600">
                            Accuracy: ±{userLocation.accuracy}km
                          </span>
                        </div>
                      </>
                    )}
                    
                    {/* Error Message */}
                    {geoError && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        {geoError}
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  onClick={logout}
                  className="w-full h-full bg-transparent text-black hover:bg-gray-100 justify-start rounded-none"
                >
                  <LogOut className="h-4 w-4 mr-4" />
                  Log out
                </Button>
              </SelectContent>
            </Select>
          ) : (
            <button onClick={() => router.push("/login")}>
              <UserRound color="rgb(122 210 244)" />
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            size="icon"
            className="xl:hidden text-white ml-2 bg-transparent hover:bg-transparent"
            onClick={toggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Header;