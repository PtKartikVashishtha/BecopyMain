"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { savedContributions } from "@/store/reducers/contributionSlice";
import { X } from "lucide-react";
import { Highlight, themes } from "prism-react-renderer";
import Editor from "react-simple-code-editor";
import Draggable from "react-draggable";
import CategorySelect from "../custom/category-select";
import api from "@/lib/api";
import { BootstrapSwitch } from "../ui/bootstrap-switch";
import { toast } from "@/hooks/use-toast";

interface AddCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddCodeDialog = ({ onOpenChange, open }: AddCodeDialogProps) => {
  const { isAuthenticated, user } = useAuth();
  const [javacode, setJavacode] = useState("");
  const [pythoncode, setPythoncode] = useState("");
  const [htmlcode, setHtmlcode] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const dragRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !isAuthenticated) {
      // onOpenChange(false);
      // router.push("/userauth");
    }

    if (isAuthenticated && user?.id) {
      dispatch(savedContributions(user.id));
    }
  }, [open, isAuthenticated, router, onOpenChange]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const programData = {
        name,
        description,
        category: selectedCategory,
        code: {
          java: javacode,
          python: pythoncode,
          html: htmlcode,
        },
        copies: 0,
        bugfixes: 0,
        suggestions: 0,
        views: 0,
        featureRank: 0,
        isFeatured: false,
        isAnonymous
      };

      if (!isAnonymous && !isAuthenticated) {
        localStorage.setItem('addCodeData', JSON.stringify(programData))
        return router.push('/login?fromAddCode=true')
      }

      const response = await api.post("/api/programs", programData);
      if (response.status === 201) {

        setName("")
        setDescription("")
        setJavacode("")
        setPythoncode("")
        setHtmlcode("")
        toast({
          title: "Code Submitted",
          description: "Your Code has been successfully submitted.",
          variant: "success",
          duration: 5000,
        });
        onOpenChange(false);

      }
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your contribution.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
      onOpenChange(false);

    }
  };

  const highlightCode = (code: string, language: string) => (
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
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Draggable handle=".drag-handle" nodeRef={dragRef}>
        <div
          ref={dragRef}
          className="relative bg-white rounded-lg shadow-lg w-[600px] h-[700px]"
          style={{ maxHeight: '700px' }}
        >
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </button>

          <Card className="h-full flex flex-col border-none shadow-none overflow-hidden " style={{ maxHeight: '700px' }}>
            <CardHeader className="drag-handle cursor-move">
              <CardTitle>Add Code</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-4 h-full">
                <div>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Title"
                    maxLength={200}
                    required
                    className="w-full p-2 border border-gray-300 rounded focus-visible:ring-0 focus-visible:ring-offset-0 text-sm" style={{color: 'gray', fontSize: '13px'}}
                  />
                </div>

                <div>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{
                      color: 'gray',
                      fontSize: '13px'
                    }}
                    rows={2}
                    maxLength={5000}
                    required
                    className="resize-none w-full p-2 border border-gray-300 rounded focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-gray "
                    placeholder="Description"
                  />
                </div>

                <div>
                  <div className="rounded-md border bg-muted">
                    <Editor
                    className="text-sm"
                      value={javacode}
                      onValueChange={setJavacode}
                      highlight={(code) => highlightCode(code, "java")}
                      padding={15}
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: "14px",
                        backgroundColor: "white",
                        minHeight: "100px",
                        outline: "none"
                      }}
                      placeholder="Enter Java code here..."
                    />
                  </div>
                </div>

                <div>
                  <div className="rounded-md border bg-muted">
                    <Editor
                      value={pythoncode}
                      onValueChange={setPythoncode}
                      highlight={(code) => highlightCode(code, "python")}
                      padding={15}
                      className="text-sm"
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: "14px",
                        backgroundColor: "white",
                        minHeight: "100px",
                        outline: "none",
                        color: 'red',
                      }}
                      placeholder="Enter Python code here..."
                    />
                  </div>
                </div>

                <div>
                  <div className="rounded-md border bg-muted">
                    <Editor
                      value={htmlcode}
                      onValueChange={setHtmlcode}
                      highlight={(code) => highlightCode(code, "html")}
                      padding={15}
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: "14px",
                        backgroundColor: "white",
                        minHeight: "100px",
                        outline: "none",
                        // resize: "vertical",
                      }}
                      placeholder="Enter HTML code here..."
                    />
                  </div>
                </div>

                {/* <CategorySelect
                  value={selectedCategory}
                  onChange={(e: any) => setSelectedCategory(e.target.value)}
                /> */}

                {error && (
                  <div className="text-red-500 text-sm text-center">{error}</div>
                )}
                <BootstrapSwitch checked={isAnonymous} onChange={(isChecked) => setIsAnonymous(isChecked)} label="Do you want your name to be publicly shown with the submitted code on the BeCopy website?" />

                <div className="flex space-x-4 pb-4">
                  <Button
                    type="button"
                    className="w-full mt-2 bg-[#0284DA] hover:bg-[#0284FF]"
                    size="sm"
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Save"}
                  </Button>
                  <Button
                    type="submit"
                    className="w-full mt-2 bg-[#0284DA] hover:bg-[#0284FF]"
                    size="sm"
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </Draggable>
    </div>
  );
};

export default AddCodeDialog;
