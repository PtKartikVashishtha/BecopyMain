"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Highlight, themes } from "prism-react-renderer";
import Editor from "react-simple-code-editor";

interface AddCodeProps {
  onClose?: () => void;
}

export default function AddCode({ onClose }: AddCodeProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    javaCode: "",
    pythonCode: "",
    htmlCode: "",
    isAnonymous: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Memoized editor style to prevent re-renders
  const editorStyle = useMemo(() => ({
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: "14px",
    backgroundColor: "white",
    minHeight: "100px",
    outline: "none"
  }), []);

  // Memoized highlight function to prevent re-creation
  const highlightCode = useCallback((code: string, language: string) => (
    <Highlight theme={themes.oneLight} code={code} language={language}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </>
      )}
    </Highlight>
  ), []);

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  }, []);

  const handleCodeChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  }, []);

  const validate = useCallback(() => {
    let tempErrors: { [key: string]: string } = {};
    if (!formData.title.trim()) tempErrors.title = "Title is required";
    if (!formData.description.trim()) tempErrors.description = "Description is required";
    
    const hasCode = formData.javaCode.trim() || formData.pythonCode.trim() || formData.htmlCode.trim();
    if (!hasCode) tempErrors.code = "At least one code section is required";
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  }, [formData.title, formData.description, formData.javaCode, formData.pythonCode, formData.htmlCode]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const programData = {
        name: formData.title,
        description: formData.description,
        code: {
          java: formData.javaCode,
          python: formData.pythonCode,
          html: formData.htmlCode,
        },
        copies: 0,
        bugfixes: 0,
        suggestions: 0,
        views: 0,
        featureRank: 0,
        isFeatured: false,
        isAnonymous: formData.isAnonymous
      };

      console.log("Code submission data:", programData);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert("Code submitted successfully!");
      
      if (onClose) {
        onClose();
      } else {
        router.back();
      }
    } catch (error) {
      console.error("Error submitting code:", error);
      alert("Error submitting code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, formData, onClose, router]);

  const handleSave = useCallback(async () => {
    console.log("Code saved as draft:", formData);
    alert("Code saved as draft!");
  }, [formData]);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  }, [onClose, router]);

  const handleAnonymousToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }));
  }, []);

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col h-screen overflow-hidden">
      {/* Header - Copied from PostJob */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">Add Code</h1>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          disabled={isSubmitting}
        >
          <X className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Title"
                maxLength={200}
                className="h-12 text-base border-gray-300 focus:ring-2 focus:ring-blue-500"
                style={{ color: 'gray', fontSize: '13px' }}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Description"
                rows={2}
                maxLength={5000}
                className="text-base border-gray-300 focus:ring-2 focus:ring-blue-500 resize-none"
                style={{ color: 'gray', fontSize: '13px' }}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Java Code Editor */}
            <div>
              <div className="rounded-md border bg-muted">
                <Editor
                  className="text-sm"
                  value={formData.javaCode}
                  onValueChange={(code) => handleCodeChange('javaCode', code)}
                  highlight={(code) => highlightCode(code, "java")}
                  padding={15}
                  style={editorStyle}
                  placeholder="Enter Java code here..."
                />
              </div>
            </div>

            {/* Python Code Editor */}
            <div>
              <div className="rounded-md border bg-muted">
                <Editor
                  value={formData.pythonCode}
                  onValueChange={(code) => handleCodeChange('pythonCode', code)}
                  highlight={(code) => highlightCode(code, "python")}
                  padding={15}
                  className="text-sm"
                  style={editorStyle}
                  placeholder="Enter Python code here..."
                />
              </div>
            </div>

            {/* HTML Code Editor */}
            <div>
              <div className="rounded-md border bg-muted">
                <Editor
                  value={formData.htmlCode}
                  onValueChange={(code) => handleCodeChange('htmlCode', code)}
                  highlight={(code) => highlightCode(code, "html")}
                  padding={15}
                  style={editorStyle}
                  placeholder="Enter HTML code here..."
                />
              </div>
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center space-x-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAnonymous}
                  onChange={handleAnonymousToggle}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <span className="text-sm text-gray-700">
                Do you want your name to be publicly shown with the submitted code on the BeCopy website?
              </span>
            </div>

            {/* Error Messages */}
            {errors.code && <p className="text-red-500 text-sm">{errors.code}</p>}
          </div>
        </form>
      </div>

      {/* Footer Buttons - Copied from PostJob */}
      <div className="flex space-x-4 p-6 border-t border-gray-200 bg-white">
        <Button
          type="button"
          onClick={handleSave}
          variant="outline"
          className="flex-1 py-3 text-lg font-medium h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Save
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium h-12 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Submitting...</span>
            </div>
          ) : (
            "Submit"
          )}
        </Button>
      </div>
    </div>
  );
}