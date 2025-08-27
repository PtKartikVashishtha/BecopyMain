"use client";

import { useEffect, useState } from "react";
import { PlusCircle, Trophy, Users, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useMediaQuery } from "react-responsive";
import { useRouter } from "next/navigation";
import { Program } from "@/types";

interface Scorer {
  id: string;
  name: string;
  score: number;
  country: string;
  contributions?: string;
}

const mockScorers: Scorer[] = [
  { id: "1", name: "Justin Owens", score: 0, country: "UK" },
  { id: "2", name: "William John", score: 0, country: "UK" },
  { id: "3", name: "James Anderson", score: 0, country: "US" },
  { id: "4", name: "Michael Roberts", score: 0, country: "AU" },
  { id: "5", name: "David Smith", score: 0, country: "Europe" },
];

export default function Quiz() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter() ;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("all");

  const filteredScorers =
    selectedCountry === "all"
      ? mockScorers
      : mockScorers.filter((s) => s.country === selectedCountry);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const rawIsMobile = useMediaQuery({ maxWidth: 768 });
  const rawIsTablet = useMediaQuery({ maxWidth: 1024 });

  // Use them only if mounted
  const isMobile = isMounted && rawIsMobile;
  const isTablet = isMounted && rawIsTablet;
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  let onSelectProgram = (program: Program) => {
    window.location.assign(`/?programId=${program._id}`);
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) {
    return null;
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

      <div className="pt-12 sm:pt-16 flex-1 flex flex-col">
        <div className="flex flex-col lg:flex-row flex-1">
          {/* Desktop Left Sidebar */}
          {!isMobile && !isTablet && (
            <aside className="w-1/6 px-4">
              <div className="sticky top-20 w-full border border-gray-200 rounded-md p-4 h-[calc(100vh-6rem)] shadow-md bg-white overflow-y-auto">
                <h2 className="text-lg font-semibold flex items-center mb-4">
                  <Trophy className="w-5 h-5 text-yellow-500 mr-2" /> Top 100 Quiz Rankers
                </h2>
                <ol className="space-y-3">
                  {filteredScorers?.map((scorer, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 text-sm font-bold rounded-full flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{scorer?.name}</p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <Users className="w-3 h-3 mr-1" /> {scorer?.contributions || 0} rank
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
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-1">Quiz Dashboard</h1>
                  <p className="text-gray-500 text-sm sm:text-base">
                    Challenge friends or practice your knowledge
                  </p>
                </div>
                <Button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 w-full sm:w-auto"
                  onClick={() => {
                    router.push('/create-quiz')
                  }}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Quiz
                </Button>
              </div>

              {/* Tabs Section */}
              <div className="mb-6">
                <Tabs defaultValue="my-quizzes" className="w-full">
                  <TabsList className="w-full bg-gray-100 grid grid-cols-3 gap-1">
                    <TabsTrigger
                      value="my-quizzes"
                      className="flex items-center justify-center text-xs sm:text-sm px-2 py-2"
                    >
                      <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden xs:inline">My </span>Quizzes
                    </TabsTrigger>
                    <TabsTrigger 
                      value="invited" 
                      className="flex items-center justify-center text-xs sm:text-sm px-2 py-2"
                    >
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden xs:inline">Invited </span>Quizzes
                    </TabsTrigger>
                    <TabsTrigger
                      value="invitations"
                      className="flex items-center justify-center text-xs sm:text-sm px-2 py-2"
                    >
                      <Bell className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Invitations
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Content Section */}
              <div className="flex-1 flex flex-col">
                <div className="border rounded-lg p-6 sm:p-8 text-center bg-white shadow-sm">
                  <h2 className="text-xl sm:text-2xl font-semibold mb-2">No Quizzes</h2>
                  <p className="text-gray-500 mb-4 text-sm sm:text-base">
                    You haven't created any quizzes yet
                  </p>
                  <Button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 w-full sm:w-auto"
                    onClick={() => {
                      router.push('/create-quiz')
                    }}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create Your First Quiz
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Mobile/Tablet Quiz Rankers Bottom Section */}
        {(isMobile || isTablet) && (
          <div className="bg-white border-t px-4 py-4 mt-6">
            <h3 className="text-sm font-semibold flex items-center mb-3">
              <Trophy className="w-4 h-4 text-yellow-500 mr-1" /> Top Quiz Rankers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredScorers?.slice(0, 6).map((scorer, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 text-sm font-bold rounded-full flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{scorer?.name}</p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Users className="w-3 h-3 mr-1" /> {scorer?.contributions || 0} rank
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto mb-2">
        <Footer />
      </div>

    </div>
  );
}