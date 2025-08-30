import { Code, WandSparkles, ExternalLink, MessageCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useState } from "react";
import api from "@/lib/api";
import ChatgptConvertDialog from "../dialog/chatgpt-covert-dialog";
import AskGPTDialog from "../dialog/ask-gpt-dialog";

interface ChatGPTCardProps {
  language: string;
  clickFunc: (lang: string) => void;
  showDialog: (open: boolean) => void;
}

const ChatGPTCard = ({ language, clickFunc, showDialog }: ChatGPTCardProps) => {
  const [code, setCode] = useState("");
  const [open, setOpen] = useState(false);
  const [askGPTOpen, setAskGPTOpen] = useState(false);
  const [convertedCode, setConvertedCode] = useState("");
  const [convertTo, setConvertTo] = useState("Java");
  const [converting, setConverting] = useState(false);

  const convertCode = async (convertTo: String, codeOption: String = "") => {
    setConverting(true);

    let codeUpdate = codeOption?.length > 0 ? codeOption : code;

    try {
      const response = await api.post("/api/gpt/convertcode", {
        convertTo,
        code: codeUpdate,
      });

      if (response.status === 200) {
        setConvertedCode(response.data.code);
        setConvertTo(response.data.convertTo);
        setOpen(true);
      }
    } catch (err: any) {
      console.error(err.response?.data || err.message);
    } finally {
      setConverting(false);
    }
  };

  return (
    <>
      <ChatgptConvertDialog
        open={open}
        onOpenChange={() => setOpen((prev) => !prev)}
        code={convertedCode}
        language={convertTo}
        title={convertTo}
      />
      
      <AskGPTDialog
        open={askGPTOpen}
        onOpenChange={setAskGPTOpen}
      />

      <Card className="shadow-md flex flex-col">
        <div className="grid grid-cols-12 bg-white p-2 border-b border-[#c8c8c8] rounded-t-lg">
          <div className="col-span-11 p-2 flex flex-wrap">
            <div className="flex flex-inline">
              <Code className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
              <h2 className="text-base sm:text-lg font-bold">
                &nbsp;&nbsp;ChatGPT Code Helper
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 ">
              Transform your code between programming languages & get help
            </p>
          </div>
          <div className="col-span-1 flex align-center justify-center">
            {/* Optional: Add expand dialog button here if needed */}
          </div>
        </div>
        <CardContent className="p-0 ">
          <textarea
            className="w-full h-28 sm:h-20 bg-white p-2 text-sm font-mono outline-none overflow-auto size-fixed min-h-[125px] sm:min-h-[178px]"
            placeholder="// Write your code here to convert..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                convertCode("Response", code);
              }
            }}
          />
        </CardContent>
        <CardFooter
          className={`bg-gray-100 flex flex-wrap justify-start px-2 py-2 gap-2 rounded-b-lg border-t border-[#c8c8c8]  w-full ${
            converting ? "flex align-center" : ""
          } `}
        >
          {converting ? (
            <>
              <p
                style={{ color: "green" }}
                className="text-center text-green block w-full"
              >
                Converting...
              </p>
            </>
          ) : (
            <>
              {/* Top row - 2 buttons */}
              <div className="w-full grid grid-cols-2 gap-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-white bg-[#0284DA] hover:bg-[#0284FF] hover:text-white outline-none"
                  onClick={() => convertCode("javascript", "Generate a JavaScript function")}
                >
                  <WandSparkles className="h-4 w-4 mr-1" />
                  {"Generate JS Function"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-white bg-[#0284DA] hover:bg-[#0284FF] hover:text-white outline-none"
                  onClick={() => convertCode("css", "Create a responsive CSS grid layout")}
                >
                  <WandSparkles className="h-4 w-4 mr-1" />
                  {"Create CSS Grid"}
                </Button>
              </div>

              {/* Bottom row - 2 buttons */}
              <div className="w-full grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-white bg-[#0284DA] hover:bg-[#0284FF] hover:text-white outline-none"
                  onClick={() => convertCode("regex", "Write a regex for email validation")}
                >
                  <WandSparkles className="h-4 w-4 mr-1" />
                  {"Email Regex"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-white bg-[#16a34a] hover:bg-[#15803d] hover:text-white outline-none"
                  onClick={() => setAskGPTOpen(true)}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {"Ask GPT"}
                </Button>
              </div>
            </>
          )}
        </CardFooter>
      </Card>
    </>
  );
};

export default ChatGPTCard;