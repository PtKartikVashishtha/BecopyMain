"use client";

import { useEffect, useState } from "react";
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
import {
  newContributions,
  savedContributions,
} from "@/store/reducers/contributionSlice";
import { X } from "lucide-react";
import { Highlight, themes } from "prism-react-renderer";
import Editor from "react-simple-code-editor";
import { useToast } from "@/hooks/use-toast";
import { Program } from "@/types";
import { motion } from "framer-motion";

interface FeedbackFormProps {
  type: "bug" | "suggestion";
  programId: string;
  open: boolean;
  selectedProgram: Program;
  onOpenChange: (open: boolean) => void;
}

const FeedbackDialog = ({
  type,
  programId,
  open,
  onOpenChange,
  selectedProgram,
}: FeedbackFormProps) => {
  const { isAuthenticated, user } = useAuth();
  const [javacode, setJavacode] = useState("");
  const [pythoncode, setPythoncode] = useState("");
  const [htmlcode, setHtmlcode] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const savedContributionItems = useAppSelector(
    (state) => state.contributions.savedContributions
  );

  useEffect(() => {
    // if (open) {
    //   onOpenChange(false);
    //   // router.push("/userauth");
    // }
    if (isAuthenticated && user?.id) {
      dispatch(savedContributions(user.id));
    }
  }, [open, isAuthenticated, router, onOpenChange]);

  const formatCode = (code: string) => code.replaceAll("    ", "  ");

  useEffect(() => {
    if (open) {
      const saved = savedContributionItems.find(
        (item) => item.programId === programId && item.type === type
      );
      setDescription(saved ? saved.description : "");
      setJavacode(saved ? saved.code.java : selectedProgram.code.java);
      setPythoncode(saved ? saved.code.python : selectedProgram.code.python);
      setHtmlcode(saved ? saved.code.html : selectedProgram.code.html);
    }
  }, [open]);

  const handleClose = () => onOpenChange(false);
  const [submitType, setSubmitType] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!isAuthenticated) {

      localStorage.setItem('addContributionData', JSON.stringify({
        useremail: '',
        type,
        programId,
        status: submitType === "save" ? "saved" : "pending",
        code: { javacode, pythoncode, htmlcode },
        description,
      }))
      return router.push('/login?fromAddContribution=true')
    }


    try {
      await dispatch(
        newContributions({
          useremail: user?.email,
          type,
          programId,
          status: submitType === "save" ? "saved" : "pending",
          code: { javacode, pythoncode, htmlcode },
          description,
        })
      );

      onOpenChange(false);
      toast({
        title: "Contribution Submitted",
        description: "Your contribution has been successfully submitted.",
        variant: "default",
        duration: 5000,
      });
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description:
          error.message || "There was an error submitting your contribution.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const highlightCode = (code: string, language: string) => (
    <Highlight
      theme={themes.oneLight}
      code={formatCode(code)}
      language={language}
    >
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
      <motion.div
        drag
        dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
        className="relative bg-white rounded-lg shadow-lg w-[600px] h-[700px]"
      >
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={handleClose}
        >
          <X className="h-5 w-5" />
        </button>

        <Card className="h-full flex flex-col border-none shadow-none overflow-hidden">
          <CardHeader className="cursor-move">
            <CardTitle>
              {type === "bug" ? "Report a Bug" : "Suggest Improvement"}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-y-auto flex-1">
            <form onSubmit={handleSubmit} className="space-y-4 h-full">
              <div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    type === "bug"
                      ? "Describe the bug..."
                      : "Describe your suggestion..."
                  }
                  rows={2}
                  maxLength={5000}
                  required
                  className="outline-none focus-visible:ring-offset-0 focus-visible:ring-0 max-h-[100px] overflow-auto resize-none"
                />
              </div>
              {[
                { label: "Java Code", value: javacode, setValue: setJavacode, lang: "java" },
                { label: "Python Code", value: pythoncode, setValue: setPythoncode, lang: "python" },
                { label: "HTML Code", value: htmlcode, setValue: setHtmlcode, lang: "html" },
              ].map(({ label, value, setValue, lang }, idx) => (
                <div key={idx}>
                  <div className="rounded-md border bg-muted">
                    <Editor
                      value={value}
                      onValueChange={setValue}
                      highlight={(code) => highlightCode(code, lang)}
                      padding={15}
                      maxLength={5000}
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: "14px",
                        backgroundColor: "white",
                        minHeight: "100px",
                        outline: "none",
                      }}
                      placeholder={`Enter ${label.toLowerCase()} here...`}
                    />
                  </div>
                </div>
              ))}

              {error && <div className="text-red-500 text-sm text-center">{error}</div>}

              <div className="flex space-x-4 pb-4">
                <Button
                  type="submit"
                  className="w-full mt-2 bg-[#0284DA] hover:bg-[#0284FF]"
                  size="sm"
                  disabled={loading}
                  name="submitType"
                  value="save"
                  onClick={() => setSubmitType("save")}
                >
                  {loading ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="submit"
                  className="w-full mt-2 bg-[#0284DA] hover:bg-[#0284FF]"
                  size="sm"
                  disabled={loading}
                  name="submitType"
                  value="publish"
                  onClick={() => setSubmitType("submit")}
                >
                  {loading ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default FeedbackDialog;
