"use client";

import React, { useState, useEffect } from 'react';
import dynamic from "next/dynamic";
import { Shield, Eye, Cookie, UserCheck, Scale, FileText, ChevronRight, Calendar, Mail, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "react-responsive";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchCategories } from "@/store/reducers/categorySlice";
import { fetchSettings } from "@/store/reducers/settingSlice";
import { Program } from "@/types";

// Dynamic imports with SSR disabled
const Header = dynamic(() => import("@/components/layout/header"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/footer"), { ssr: false });
const Sidebar = dynamic(() => import("@/components/layout/sidebar"), { ssr: false });

const PolicyPage = () => {
  const [isClient, setIsClient] = useState(false);
  const [activeSection, setActiveSection] = useState("privacy");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [showJobPosting, setShowJobPosting] = useState(false);
  const [showApplyJob, setShowApplyJob] = useState(false);
  
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery({ maxWidth: 639 });
  
  const categoriesState = useAppSelector((state) => state.categories);
  const categories = categoriesState?.items || [];

  // Initialize client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch data
  useEffect(() => {
    if (!isClient) return;
    
    // Dispatch with error handling
    try {
      dispatch(fetchCategories());
      dispatch(fetchSettings());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [dispatch, isClient]);

  // Initialize expanded categories
  const selectedProgramInit: Program = {
    _id: "",
    name: "",
    code: { java: "", python: "", html: "" },
    views: 0,
    copies: 0,
    shares: 0,
  };

  const [selectedProgram, setSelectedProgram] = useState<Program>(selectedProgramInit);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleProgramSelect = (program: Program) => {
    setSelectedProgram(program);
    setIsSidebarOpen(false);
  };

  const sections = [
    { id: "privacy", title: "Privacy Policy", icon: Shield },
    { id: "terms", title: "Terms of Service", icon: FileText },
    { id: "cookies", title: "Cookie Policy", icon: Cookie },
    { id: "community", title: "Community Guidelines", icon: UserCheck },
    { id: "copyright", title: "Copyright & DMCA", icon: Scale }
  ];

  const lastUpdated = "January 15, 2024";

  if (!isClient) {
    return (
      <div className="min-h-[80vh] bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setSelectedProgram={setSelectedProgram}
      />

      {isSidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        />
      )}

      <div className="pt-12">
        <div className="flex flex-col w-full relative min-h-[calc(100vh-5rem)]">
          {isMobile && categories && (
            <Sidebar
              isSidebarOpen={isSidebarOpen}
              expandedCategories={expandedCategories}
              onSelectProgram={handleProgramSelect}
              onShowJobPosting={() => setShowJobPosting(true)}
              onShowApplyJob={() => setShowApplyJob(true)}
              onCloseSidebar={() => setIsSidebarOpen(false)}
              toggleCategory={() => {}}
            />
          )}

          <div className="flex-1">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-[#0284DA] to-[#0ea5e9] text-white py-16">
              <div className="max-w-4xl mx-auto px-6 text-center">
                <Shield className="h-16 w-16 mx-auto mb-6 text-blue-100" />
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Legal & Policy Information
                </h1>
                <p className="text-xl text-blue-100 mb-6">
                  Your privacy and security are our top priorities
                </p>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Calendar className="h-4 w-4 mr-2" />
                  Last updated: {lastUpdated}
                </Badge>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
              <Tabs defaultValue="privacy" className="space-y-8">
                {/* Navigation Tabs */}
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1 bg-white/70 backdrop-blur-sm">
                  {sections.map((section) => {
                    const IconComponent = section.icon;
                    return (
                      <TabsTrigger 
                        key={section.id} 
                        value={section.id}
                        className="flex flex-col items-center gap-2 p-4 data-[state=active]:bg-[#0284DA] data-[state=active]:text-white"
                      >
                        <IconComponent className="h-5 w-5" />
                        <span className="text-sm font-medium">{section.title}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {/* Privacy Policy */}
                <TabsContent value="privacy">
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="h-8 w-8 text-[#0284DA]" />
                        <div>
                          <CardTitle className="text-2xl text-gray-800">Privacy Policy</CardTitle>
                          <CardDescription className="text-gray-600">
                            How we collect, use, and protect your personal information
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div className="prose max-w-none">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Information We Collect</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          We collect information you provide directly to us, such as when you create an account, 
                          submit code snippets, apply for jobs, or contact us for support. This may include:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700">
                          <li>Name and email address</li>
                          <li>Profile information and preferences</li>
                          <li>Code submissions and contributions</li>
                          <li>Job applications and resume information</li>
                          <li>Communication preferences</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">How We Use Your Information</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          We use the information we collect to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700">
                          <li>Provide and maintain our platform services</li>
                          <li>Process your account registration and manage your profile</li>
                          <li>Enable code sharing and community features</li>
                          <li>Facilitate job matching between candidates and employers</li>
                          <li>Send important updates and notifications</li>
                          <li>Improve our platform based on usage analytics</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">Data Security</h3>
                        <p className="text-gray-700 leading-relaxed">
                          We implement appropriate technical and organizational measures to protect your personal 
                          information against unauthorized access, alteration, disclosure, or destruction. However, 
                          no internet transmission is completely secure, and we cannot guarantee absolute security.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">Your Rights</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          You have the right to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700">
                          <li>Access and update your personal information</li>
                          <li>Delete your account and associated data</li>
                          <li>Opt-out of marketing communications</li>
                          <li>Request a copy of your data</li>
                          <li>Contact us about privacy concerns</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Terms of Service */}
                <TabsContent value="terms">
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-[#0284DA]" />
                        <div>
                          <CardTitle className="text-2xl text-gray-800">Terms of Service</CardTitle>
                          <CardDescription className="text-gray-600">
                            Rules and guidelines for using the BeCopy platform
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div className="prose max-w-none">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Acceptance of Terms</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          By accessing and using BeCopy, you accept and agree to be bound by these Terms of Service. 
                          If you do not agree to these terms, please do not use our platform.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">Platform Usage</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          BeCopy is a platform for sharing and discovering code snippets. You may:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700">
                          <li>Browse and copy code snippets for personal and commercial use</li>
                          <li>Submit original code contributions</li>
                          <li>Participate in community discussions and quizzes</li>
                          <li>Post and apply for job opportunities</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">User Responsibilities</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          As a user, you agree to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700">
                          <li>Provide accurate and truthful information</li>
                          <li>Respect intellectual property rights</li>
                          <li>Not submit malicious or harmful code</li>
                          <li>Maintain the security of your account</li>
                          <li>Follow community guidelines and standards</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">Prohibited Activities</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          You may not use BeCopy to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700">
                          <li>Upload malware, viruses, or malicious code</li>
                          <li>Violate any applicable laws or regulations</li>
                          <li>Infringe on others' intellectual property rights</li>
                          <li>Spam or harass other users</li>
                          <li>Attempt to gain unauthorized access to our systems</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">Limitation of Liability</h3>
                        <p className="text-gray-700 leading-relaxed">
                          BeCopy is provided "as is" without warranties. We are not liable for any damages 
                          arising from your use of the platform or code snippets obtained through it.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Cookie Policy */}
                <TabsContent value="cookies">
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-lg">
                      <div className="flex items-center gap-3">
                        <Cookie className="h-8 w-8 text-[#0284DA]" />
                        <div>
                          <CardTitle className="text-2xl text-gray-800">Cookie Policy</CardTitle>
                          <CardDescription className="text-gray-600">
                            How we use cookies and similar technologies
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div className="prose max-w-none">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">What Are Cookies?</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          Cookies are small text files stored on your device when you visit our website. 
                          They help us provide you with a better experience by remembering your preferences 
                          and analyzing how you use our platform.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">Types of Cookies We Use</h3>
                        
                        <div className="space-y-4">
                          <div className="border-l-4 border-blue-400 pl-4">
                            <h4 className="font-semibold text-gray-800">Essential Cookies</h4>
                            <p className="text-gray-700">Required for basic platform functionality, such as user authentication and security.</p>
                          </div>
                          
                          <div className="border-l-4 border-green-400 pl-4">
                            <h4 className="font-semibold text-gray-800">Performance Cookies</h4>
                            <p className="text-gray-700">Help us understand how visitors interact with our platform by collecting anonymous analytics.</p>
                          </div>
                          
                          <div className="border-l-4 border-purple-400 pl-4">
                            <h4 className="font-semibold text-gray-800">Functional Cookies</h4>
                            <p className="text-gray-700">Remember your preferences and settings to provide a personalized experience.</p>
                          </div>
                        </div>

                        <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">Managing Cookies</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          You can control cookies through your browser settings. However, disabling certain 
                          cookies may affect the functionality of our platform.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">Third-Party Cookies</h3>
                        <p className="text-gray-700 leading-relaxed">
                          We may use third-party services that set their own cookies, such as analytics 
                          providers. These are governed by the respective third parties' privacy policies.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Community Guidelines */}
                <TabsContent value="community">
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
                      <div className="flex items-center gap-3">
                        <UserCheck className="h-8 w-8 text-[#0284DA]" />
                        <div>
                          <CardTitle className="text-2xl text-gray-800">Community Guidelines</CardTitle>
                          <CardDescription className="text-gray-600">
                            Standards for respectful and productive community interaction
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div className="prose max-w-none">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Our Community Values</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          BeCopy is built on the principles of collaboration, learning, and mutual respect. 
                          We strive to create an inclusive environment where developers of all skill levels 
                          can share knowledge and grow together.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">Code Quality Standards</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          When submitting code, please ensure:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700">
                          <li>Code is well-documented and includes comments</li>
                          <li>Examples are functional and tested</li>
                          <li>Submissions are original or properly attributed</li>
                          <li>Code follows best practices and security guidelines</li>
                          <li>Descriptions are clear and helpful</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">Respectful Communication</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          We expect all community members to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700">
                          <li>Be respectful and constructive in all interactions</li>
                          <li>Provide helpful feedback and suggestions</li>
                          <li>Avoid discriminatory or offensive language</li>
                          <li>Help newcomers learn and grow</li>
                          <li>Report inappropriate content or behavior</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">Job Posting Guidelines</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          For job postings, please:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700">
                          <li>Provide clear job descriptions and requirements</li>
                          <li>Include accurate salary and benefit information</li>
                          <li>Be transparent about company culture and expectations</li>
                          <li>Respond promptly to applicant inquiries</li>
                          <li>Avoid discriminatory hiring practices</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">Enforcement</h3>
                        <p className="text-gray-700 leading-relaxed">
                          Violations of these guidelines may result in content removal, account suspension, 
                          or permanent bans. We review all reports and take appropriate action to maintain 
                          a positive community environment.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Copyright & DMCA */}
                <TabsContent value="copyright">
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 rounded-t-lg">
                      <div className="flex items-center gap-3">
                        <Scale className="h-8 w-8 text-[#0284DA]" />
                        <div>
                          <CardTitle className="text-2xl text-gray-800">Copyright & DMCA</CardTitle>
                          <CardDescription className="text-gray-600">
                            Intellectual property rights and copyright infringement procedures
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div className="prose max-w-none">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Intellectual Property Rights</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          BeCopy respects intellectual property rights. When you submit code to our platform, 
                          you represent that you have the right to share that code and grant others permission 
                          to use it as intended by our platform.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">User-Generated Content</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          By submitting content to BeCopy, you grant us and other users the right to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700">
                          <li>Display and distribute your content on our platform</li>
                          <li>Allow other users to view, copy, and use your code snippets</li>
                          <li>Create derivative works for platform improvement</li>
                          <li>Use your content for educational and promotional purposes</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">DMCA Takedown Procedure</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          If you believe your copyrighted work has been used without permission, 
                          please send a DMCA takedown notice including:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700">
                          <li>Your contact information and electronic signature</li>
                          <li>Identification of the copyrighted work</li>
                          <li>Location of the allegedly infringing material</li>
                          <li>A statement of good faith belief that use is unauthorized</li>
                          <li>A statement that the information is accurate</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">Counter-Notice Procedure</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          If your content was removed due to a DMCA notice and you believe it was 
                          removed in error, you may submit a counter-notice with:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700">
                          <li>Your contact information and electronic signature</li>
                          <li>Identification of the removed material</li>
                          <li>A statement under penalty of perjury that removal was a mistake</li>
                          <li>Consent to federal court jurisdiction</li>
                        </ul>

                        <div className="bg-blue-50 p-6 rounded-lg mt-8">
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <Mail className="h-5 w-5 text-[#0284DA]" />
                            DMCA Contact Information
                          </h4>
                          <p className="text-gray-700">
                            Send DMCA notices and counter-notices to: <br />
                            <strong>legal@becopy.com</strong> <br />
                            Subject Line: "DMCA Notice" or "DMCA Counter-Notice"
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Contact Section */}
              <Card className="mt-12 shadow-lg border-0 bg-gradient-to-r from-[#0284DA] to-[#0ea5e9] text-white overflow-hidden">
                <CardContent className="p-8 text-center relative">
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
                  <div className="relative z-10">
                    <Scale className="h-12 w-12 mx-auto mb-4 text-blue-100" />
                    <h3 className="text-2xl font-bold mb-4">Questions about our policies?</h3>
                    <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                      If you have any questions about these policies or need clarification on any points, 
                      our legal team is here to help.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button 
                        variant="secondary" 
                        size="lg"
                        className="bg-white text-[#0284DA] hover:bg-blue-50 font-semibold"
                        onClick={() => window.location.href = '/contact'}
                      >
                        <Mail className="h-5 w-5 mr-2" />
                        Contact Legal Team
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="border-white/30 text-white hover:bg-white/10 font-semibold"
                        onClick={() => window.location.href = '/faq'}
                      >
                        <ExternalLink className="h-5 w-5 mr-2" />
                        Visit FAQ
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="pb-1">
        <Footer />
      </div>
    </div>
  );
};

export default PolicyPage;