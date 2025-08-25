

// app/apply-job/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

// Mock job data - replace with actual API call
const mockJobs = [
  {
    id: 1,
    title: "Senior React Developer",
    company: "Tech Corp",
    location: "Remote",
    salary: "$80,000 - $120,000",
    type: "Full Time",
    description: "We are looking for an experienced React developer to join our team...",
    requirements: "3+ years React experience, TypeScript, Node.js"
  },
  {
    id: 2,
    title: "Python Backend Developer",
    company: "Data Solutions Inc",
    location: "New York, NY",
    salary: "$70,000 - $100,000",
    type: "Full Time",
    description: "Join our backend team to build scalable Python applications...",
    requirements: "Python, Django, PostgreSQL, AWS experience"
  },
  {
    id: 3,
    title: "Frontend Intern",
    company: "Startup Hub",
    location: "San Francisco, CA",
    salary: "$25 - $30/hour",
    type: "Internship",
    description: "Great opportunity for students to learn modern web development...",
    requirements: "HTML, CSS, JavaScript basics, React knowledge preferred"
  }
];

export default function ApplyJob() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [applicationData, setApplicationData] = useState({
    name: "",
    email: "",
    phone: "",
    coverLetter: "",
    experience: ""
  });

  const filteredJobs = mockJobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Application data:", {
      jobId: selectedJob.id,
      ...applicationData
    });
    alert("Application submitted successfully!");
    setSelectedJob(null);
    setApplicationData({
      name: "",
      email: "",
      phone: "",
      coverLetter: "",
      experience: ""
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setApplicationData({
      ...applicationData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Header isSidebarOpen={false} toggleSidebar={() => {}} />
      
      <div className="pt-16 sm:pt-20 bg-[#F5F5F5] min-h-screen">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center space-x-2 mr-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold">Find & Apply for Jobs</h1>
          </div>

          {!selectedJob ? (
            // Job Listings View
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-6">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search jobs by title, company, or location..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-gray-600">{job.company} • {job.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-600 font-semibold">{job.salary}</p>
                        <p className="text-sm text-gray-500">{job.type}</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3 line-clamp-2">{job.description}</p>
                    
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">
                        <strong>Requirements:</strong> {job.requirements}
                      </p>
                      <Button 
                        onClick={() => setSelectedJob(job)}
                        className="bg-[#0284DA] hover:bg-[#0284FF]"
                      >
                        Apply Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredJobs.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No jobs found matching your search criteria.</p>
                </div>
              )}
            </div>
          ) : (
            // Application Form View
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedJob(null)}
                  className="flex items-center space-x-2 mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Job Listings</span>
                </Button>
                
                <div className="border-b pb-4 mb-6">
                  <h2 className="text-xl font-semibold">{selectedJob.title}</h2>
                  <p className="text-gray-600">{selectedJob.company} • {selectedJob.location}</p>
                  <p className="text-green-600 font-semibold">{selectedJob.salary}</p>
                </div>
              </div>

              <form onSubmit={handleApplySubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <Input
                      name="name"
                      value={applicationData.name}
                      onChange={handleInputChange}
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <Input
                      name="email"
                      type="email"
                      value={applicationData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <Input
                      name="phone"
                      value={applicationData.phone}
                      onChange={handleInputChange}
                      placeholder="Your phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relevant Experience *
                  </label>
                  <Textarea
                    name="experience"
                    value={applicationData.experience}
                    onChange={handleInputChange}
                    placeholder="Describe your relevant experience and skills..."
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter
                  </label>
                  <Textarea
                    name="coverLetter"
                    value={applicationData.coverLetter}
                    onChange={handleInputChange}
                    placeholder="Why are you interested in this position? What makes you a good fit?"
                    rows={6}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="bg-[#0284DA] hover:bg-[#0284FF]">
                    Submit Application
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setSelectedJob(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}