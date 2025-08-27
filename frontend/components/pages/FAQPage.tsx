"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, MessageCircle, Code, Users, Briefcase, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: 'general' | 'coding' | 'jobs' | 'quiz' | 'account';
  tags: string[];
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: "What is BeCopy and how does it work?",
    answer: "BeCopy is a free platform where developers can share, discover, and copy code snippets across multiple programming languages. You can browse through our extensive collection of code examples, copy them for your projects, and even contribute your own code to help the community.",
    category: "general",
    tags: ["platform", "overview"]
  },
  {
    id: 2,
    question: "Is BeCopy really 100% free to use?",
    answer: "Yes! BeCopy is completely free to use. You can browse, copy, and share code snippets without any charges. We believe in supporting the developer community with free resources.",
    category: "general",
    tags: ["pricing", "free"]
  },
  {
    id: 3,
    question: "How can I contribute code to the platform?",
    answer: "To contribute code, you need to create an account and log in. Then click on 'Add Code' in the navigation menu. You can submit code snippets in Java, Python, HTML, and other supported languages. Make sure your code is well-documented and follows our community guidelines.",
    category: "coding",
    tags: ["contribute", "add code"]
  },
  {
    id: 4,
    question: "What programming languages are supported?",
    answer: "We currently support multiple programming languages including Java, Python, HTML, CSS, JavaScript, C++, and many more. We're continuously adding support for new languages based on community demand.",
    category: "coding",
    tags: ["languages", "support"]
  },
  {
    id: 5,
    question: "How do I search for specific code snippets?",
    answer: "Use the search functionality in the header to find specific code snippets. You can search by keywords, programming language, or specific functionality. You can also browse by categories to discover relevant code examples.",
    category: "coding",
    tags: ["search", "browse"]
  },
  {
    id: 6,
    question: "Can I post job opportunities on BeCopy?",
    answer: "Yes! If you're a recruiter or company, you can post job opportunities on our platform. Click on 'Post Job' in the navigation menu to create a job listing. This feature helps connect developers with potential employers.",
    category: "jobs",
    tags: ["recruitment", "posting"]
  },
  {
    id: 7,
    question: "How can I apply for jobs posted on the platform?",
    answer: "Browse the 'Jobs' section to view available opportunities. You can apply directly through the platform using the 'Apply Job' feature. Make sure your profile is complete to increase your chances of being noticed by recruiters.",
    category: "jobs",
    tags: ["application", "career"]
  },
  {
    id: 8,
    question: "What is the Daily Quiz feature?",
    answer: "Our Daily Quiz feature allows you to test your programming knowledge and compete with other developers. You can win prizes and improve your skills while having fun. Check the quiz section daily for new challenges!",
    category: "quiz",
    tags: ["learning", "competition"]
  },
  {
    id: 9,
    question: "How do I create an account?",
    answer: "Click on the user icon in the top-right corner and select the sign-up option. You can register with your email address or use social login options. Having an account allows you to contribute code, apply for jobs, and participate in quizzes.",
    category: "account",
    tags: ["registration", "signup"]
  },
  {
    id: 10,
    question: "Can I edit or delete my submitted code?",
    answer: "Yes, you can manage your submitted code snippets through your profile. You can edit, update, or delete any code you've contributed to the platform. This helps keep your contributions up-to-date and relevant.",
    category: "account",
    tags: ["management", "editing"]
  },
  {
    id: 11,
    question: "How are code snippets organized?",
    answer: "Code snippets are organized by categories, programming languages, and popularity. You can filter and sort based on views, copies, and recent additions. This makes it easy to find exactly what you're looking for.",
    category: "coding",
    tags: ["organization", "categories"]
  },
  {
    id: 12,
    question: "Is there a mobile app available?",
    answer: "Currently, BeCopy is available as a web platform that's fully responsive and works great on mobile devices. We're considering developing dedicated mobile apps based on user feedback and demand.",
    category: "general",
    tags: ["mobile", "app"]
  }
];

const categoryIcons = {
  general: MessageCircle,
  coding: Code,
  jobs: Briefcase,
  quiz: Award,
  account: Users
};

const categoryColors = {
  general: "bg-blue-100 text-blue-800",
  coding: "bg-green-100 text-green-800",
  jobs: "bg-purple-100 text-purple-800",
  quiz: "bg-yellow-100 text-yellow-800",
  account: "bg-red-100 text-red-800"
};

const FAQPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: "all", name: "All Questions", count: faqData.length },
    { id: "general", name: "General", count: faqData.filter(f => f.category === "general").length },
    { id: "coding", name: "Coding", count: faqData.filter(f => f.category === "coding").length },
    { id: "jobs", name: "Jobs", count: faqData.filter(f => f.category === "jobs").length },
    { id: "quiz", name: "Quiz", count: faqData.filter(f => f.category === "quiz").length },
    { id: "account", name: "Account", count: faqData.filter(f => f.category === "account").length }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pt-16">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#0284DA] to-[#0ea5e9] text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Find answers to common questions about BeCopy
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-blue-200 focus:bg-white/20"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Category Filter Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-[#0284DA]">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => {
                  const IconComponent = category.id === "all" ? MessageCircle : categoryIcons[category.id as keyof typeof categoryIcons];
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "ghost"}
                      className={`w-full justify-between ${
                        selectedCategory === category.id 
                          ? "bg-[#0284DA] text-white" 
                          : "text-gray-700 hover:bg-blue-50"
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <span>{category.name}</span>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {category.count}
                      </Badge>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* FAQ Items */}
          <div className="lg:col-span-3 space-y-4">
            {filteredFAQs.length === 0 ? (
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    No FAQs found
                  </h3>
                  <p className="text-gray-500">
                    Try adjusting your search terms or category filter.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredFAQs.map((faq) => {
                const isExpanded = expandedItems.has(faq.id);
                const IconComponent = categoryIcons[faq.category];
                
                return (
                  <Card 
                    key={faq.id} 
                    className="shadow-lg border-0 bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <CardHeader
                      className="cursor-pointer hover:bg-blue-50/50 transition-colors duration-200"
                      onClick={() => toggleExpanded(faq.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <IconComponent className="h-5 w-5 text-[#0284DA]" />
                            <Badge className={categoryColors[faq.category]}>
                              {faq.category.charAt(0).toUpperCase() + faq.category.slice(1)}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg text-gray-800 leading-relaxed">
                            {faq.question}
                          </CardTitle>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="h-6 w-6 text-[#0284DA]" />
                          ) : (
                            <ChevronDown className="h-6 w-6 text-[#0284DA]" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="pt-0 animate-in slide-in-from-top-2 duration-200">
                        <div className="pl-8 border-l-4 border-blue-200">
                          <p className="text-gray-700 leading-relaxed mb-4">
                            {faq.answer}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {faq.tags.map((tag) => (
                              <Badge 
                                key={tag} 
                                variant="outline" 
                                className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Contact Section */}
        <Card className="mt-12 shadow-lg border-0 bg-gradient-to-r from-[#0284DA] to-[#0ea5e9] text-white overflow-hidden">
          <CardContent className="p-8 text-center relative">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-blue-100" />
              <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Can't find what you're looking for? Our support team is here to help you get the most out of BeCopy.
              </p>
              <Button 
                variant="secondary" 
                size="lg"
                className="bg-white text-[#0284DA] hover:bg-blue-50 font-semibold"
                onClick={() => window.location.href = '/contact'}
              >
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FAQPage;