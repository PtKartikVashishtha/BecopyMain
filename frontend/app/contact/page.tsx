"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Send, Headset } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "react-responsive";
import Sidebar from "@/components/layout/sidebar";
import { Program } from "@/types";

export default function Contact() {
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: ""
  });
  
  const rawIsMobile = useMediaQuery({ maxWidth: 768 });
  const isMobile = isMounted && rawIsMobile;
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // All hooks must be called before any conditional returns
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(!isSidebarOpen);
  }, [isSidebarOpen]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSelectChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Add your form submission logic here
  }, [formData]);

  const handleSelectProgram = useCallback((program: Program) => {
    router.push(`/?programId=${program._id}`);
  }, [router]);

  const handleShowJobPosting = useCallback(() => {
    router.push("/post-job");
  }, [router]);

  const handleShowApplyJob = useCallback(() => {
    router.push("/apply-job");
  }, [router]);

  // Prevent hydration mismatch - moved after all hooks
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        {isMobile && (
          <Sidebar
            isSidebarOpen={isSidebarOpen}
            onCloseSidebar={() => setIsSidebarOpen(false)} 
            expandedCategories={[]} 
            toggleCategory={() => {}} 
            onSelectProgram={handleSelectProgram} 
            onShowJobPosting={handleShowJobPosting} 
            onShowApplyJob={handleShowApplyJob}          
          />
        )}

        <main className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-16 sm:pt-18 md:pt-19 pb-4 sm:pb-6 md:pb-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left side - Support Icon Illustration */}
            <div
              style={{
                background: "linear-gradient(to bottom, #0284DA, rgb(14, 149, 246))",
              }}
              className="relative flex flex-col items-center justify-center p-6 sm:p-8 md:p-12 lg:p-16 text-white min-h-[200px] sm:min-h-[250px] lg:min-h-auto"
            >
              <Headset className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 mb-4 sm:mb-6 md:mb-8 opacity-90" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 md:mb-4 text-center">
                Need Help?
              </h2>
              <p className="max-w-xs text-center text-blue-100 text-sm sm:text-base md:text-lg leading-relaxed">
                Our support team is here to assist you. Send us a message and
                we'll get back promptly.
              </p>
            </div>

            {/* Right side - Contact Form */}
            <section className="p-4 sm:p-5 md:p-6 lg:p-8 flex flex-col justify-center">
              <div className="mb-4 sm:mb-6 md:mb-8 text-center">
                <div className="inline-flex items-center justify-center bg-blue-100 text-blue-600 rounded-full w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mx-auto mb-3 sm:mb-4 shadow-inner">
                  <MessageCircle color="rgb(2 132 218)" className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                  Connect With Us
                </h1>
                <p className="text-gray-600 max-w-sm mx-auto text-xs sm:text-sm md:text-base px-2">
                  Have a question or feedback? We'd love to hear from you!
                  Fill out the form and we will get back to you.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  <div>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your name"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Your email address"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Message subject"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <Select name="category" value={formData.category} onValueChange={handleSelectChange}>
                      <SelectTrigger className="w-full border border-gray-300 rounded-md px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Type your message here..."
                    maxLength={1000}
                    className="w-full border border-gray-300 rounded-md px-3 py-3 sm:px-4 sm:py-3 text-sm sm:text-base text-gray-900 resize-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.message.length}/1000 characters
                  </p>
                </div>

                <div className="flex justify-center sm:justify-end pt-2">
                  <Button
                    style={{ backgroundColor: "rgb(2 132 218)" }}
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 text-white font-semibold px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base rounded-lg shadow-md transition"
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    Send Message
                  </Button>
                </div>
              </form>
            </section>
          </div>
        </main>

        {/* Mobile sidebar backdrop */}
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}
      </div>

      <Footer />
    </>
  );
}