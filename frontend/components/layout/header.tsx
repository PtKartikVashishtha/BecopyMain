import {
  Check,
  Dot,
  Twitter,
  Menu,
  LogOut,
  ChevronDown,
  LogInIcon,
  UserRound,
  Search,
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
  SelectValue,
} from "../ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import router from "next/router";
import JobPostingDialog from "@/components/dialog/jobposting-dialog";
import { ApplyJobDialog } from "@/components/dialog/applyjob-dialog";
import dynamic from "next/dynamic";
import { fetchSettings } from "@/store/reducers/settingSlice";
// import AddCodeDialog from "../dialog/add-code-dialog";
const AddCodeDialog = dynamic(
  () => import("@/components/dialog/add-code-dialog"),
  {
    ssr: false,
  }
);

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSelectedProgram?: (program: any) => void; // mark as optional with ?}
}

const selectedProgramInit = {
  _id: "",
  name: "",
  code: {
    java: "",
    python: "",
    html: "",
  },
  views: 0,
  copies: 0,
  shares: 0,
};
const Header = ({
  isSidebarOpen,
  toggleSidebar,
  setSelectedProgram,
}: HeaderProps) => {
  const [showJobPosting, setShowJobPosting] = useState(false);
  const [showApplyJob, setShowApplyJob] = useState(false);
  const [showAddCode, setShowAddCode] = useState<boolean>(false);
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);
  const handleJobPosting = () => {
    setShowJobPosting(true);
  };
  const handleApplyJob = () => {
    setShowApplyJob(true);
  };

  const handleAddCodeClick = () => {
    setShowAddCode(true);
  };

  const handleHeaderLogoClick = (e: any) => {
    if (setSelectedProgram) {
      if (pathname === "/") {
        setSelectedProgram(selectedProgramInit);
      }
    }

    router.push("/");
  };
  const { user, logout, isAuthenticated } = useAuth();
  useEffect(() => {
    console.log("isAuthenticated", isAuthenticated);
    console.log("user", user);
  }, []);
  const router = useRouter();
  const programs = useAppSelector((state) => state.programs.items);
  const settings = useAppSelector((state) => state.settings.item);

  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");

  return (
    <div className="fixed top-0 left-0 right-0 z-50 w-full h-12 bg-[#0284DA] flex justify-between items-center px-4">
      {/* Logo */}
      <div
        className="flex items-center cursor-pointer"
        onClick={handleHeaderLogoClick}
      >
        <h1 className="text-[#f2d898] text-3xl font-bold">&lt;Be&gt;</h1>
        <h1 className="text-[#7ad1f4] text-3xl font-bold ml-1">Copy</h1>
      </div>

      {/* Center Tabs */}
      <div className="hidden xl:flex space-x-6 items-center">
        <p
          onClick={() => router.push("../../categories")}
          className="text-[#7AD2F4] font-medium text-sm transition duration-300 ease-in-out hover:bg-blue-300 p-2 rounded-md hover:text-white md:text-base cursor-pointer"
        >
          Codes
        </p>

        {settings?.isAddCode && (
          <>
            <button
              onClick={handleAddCodeClick}
              className="text-[#7AD2F4] font-medium text-sm transition duration-300 ease-in-out hover:bg-blue-300 p-2 rounded-md hover:text-white md:text-base cursor-pointer"
            >
              Add Code
            </button>
          </>
        )}

        {settings?.isJobs && (
          <>
            <p
              onClick={() => router.push("../../jobs")}
              className="text-[#7AD2F4] font-medium text-sm transition duration-300 ease-in-out hover:bg-blue-300 p-2 rounded-md hover:text-white md:text-base cursor-pointer"
            >
              Jobs
            </p>
          </>
        )}

        {settings?.isPostJob && (
          <>
            <button
              onClick={handleJobPosting}
              className="text-[#7AD2F4] font-medium text-sm transition duration-300 ease-in-out hover:bg-blue-300 p-2 rounded-md hover:text-white md:text-base cursor-pointer"
            >
              Post Job
            </button>
          </>
        )}

        {settings?.isApplyJob && (
          <>
            <button
              onClick={handleApplyJob}
              className="text-[#7AD2F4] font-medium text-sm transition duration-300 ease-in-out hover:bg-blue-300 p-2 rounded-md hover:text-white md:text-base cursor-pointer"
            >
              Apply Job
            </button>
          </>
        )}

        <p
          onClick={() => router.push("../../quiz")}
          className="text-[#7AD2F4] font-medium text-sm transition duration-300 ease-in-out hover:bg-blue-300 p-2 rounded-md hover:text-white md:text-base cursor-pointer"
        >
          Quiz
        </p>
        <p
          onClick={() => router.push("../../contact")}
          className="text-[#7AD2F4] font-medium text-sm transition duration-300 ease-in-out hover:bg-blue-300 p-2 rounded-md hover:text-white md:text-base cursor-pointer"
        >
          Contact Us
        </p>
      </div>

      {/* Stats & User */}
      <div className="md:flex items-center space-x-4">
        <div className="hidden lg:flex items-center">
          <p className="text-[#ffd633] flex items-center text-md whitespace-nowrap">
            <Dot className="h-3 mr-1" />
            100% Free
          </p>
          <p className="text-[#00ff55] flex items-center text-sm md:text-base">
            <Check className="h-3 mr-1" />
            {programs?.length ?? 0} Codes
          </p>
          <p className="text-[#ffd633] flex items-center text-sm md:text-base">
            <Dot className="h-3 mr-1" />
            350 Live
          </p>
        </div>

        <div className="flex items-center space-x-2 relative">


          {/* Search Input Field (toggle visibility) */}
          {showSearch && (
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search..."
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none w-40"
            />
          )}

          {/* Search Icon */}
          <button onClick={() => setShowSearch((prev) => !prev)}>
            <Search className="text-cyan-300 h-5 w-5" />
          </button>

          {/* Auth Buttons */}
          {isAuthenticated ? (
            <Select defaultValue={user?.name}>
              <SelectTrigger className="bg-transparent w-30 border-none focus:outline-none">
                <Avatar>
                  <AvatarFallback className="bg-[#ff1493] text-white">
                    {user?.name
                      .split(" ")
                      .map((word) => word[0]?.toUpperCase())
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </SelectTrigger>
              <SelectContent className="ring-0 p-0">
                <Button
                  onClick={logout}
                  className="w-15 h-full bg-transparent text-black hover:bg-transparent"
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

      <JobPostingDialog
        open={showJobPosting}
        onOpenChange={setShowJobPosting}
      />
      <ApplyJobDialog open={showApplyJob} onOpenChange={setShowApplyJob} />
      <AddCodeDialog open={showAddCode} onOpenChange={setShowAddCode} />
    </div>
  );
};

export default Header;
