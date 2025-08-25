import { Code, WandSparkles, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useState } from "react";
import api from "@/lib/api";
import ChatgptConvertDialog from "../dialog/chatgpt-covert-dialog";
interface ChatGPTCardProps {
  language: string;
  clickFunc: (lang: string) => void;
  showDialog: (open: boolean) => void;
}

const ChatGPTCard = ({ language, clickFunc, showDialog }: ChatGPTCardProps) => {
  const [code, setCode] = useState("");
  const [open, setOpen] = useState(false);
  const [convertedCode, setConvertedCode] = useState("");
  const [convertTo, setConvertTo] = useState("Java");
  const [converting, setConverting] = useState(false);
  // const [language, setLanguage] = useState("")
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
      <Card className="shadow-md flex flex-col">
        <div className="grid grid-cols-12 bg-white p-2 border-b border-[#c8c8c8] rounded-t-lg">
          <div className="col-span-11 p-2 flex flex-wrap">
            <div className="flex flex-inline">
              <Code className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
              <h2 className="text-base sm:text-lg font-bold">
                &nbsp;&nbsp;ChatGPT Code Converter
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 ">
              Transform your code between programming languages
            </p>
          </div>
          <div className="col-span-1 flex align-center justify-center">
            {/* <Button
              variant="outline"
              size="sm"
              className="text-white hover:text-white outline-none border-none"
              onClick={() => showDialog(true)}>
              <ExternalLink className="w-4 h-4 text-gray-600 place-self-center" />
            </Button> */}
          </div>
        </div>
        <CardContent className="p-0 ">
          <textarea
            className="w-full h-28 sm:h-32 bg-white p-2 text-sm font-mono outline-none overflow-auto size-fixed min-h-[125px] sm:min-h-[185px]"
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
              {/* <Button
                  variant="outline"
                  size="sm"
                  className="text-white bg-[#0284DA] hover:bg-[#0284FF] hover:text-white outline-none col-span-1"
                  onClick={() => convertCode("java")}
                >
                  <WandSparkles className="h-4 w-4 mr-1" /> {"Java"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-white bg-[#0284DA] hover:bg-[#0284FF] hover:text-white outline-none col-span-1"
                  onClick={() => convertCode("python")}
                >
                  <WandSparkles className="h-4 w-4 mr-1" /> {"Python"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-white bg-[#0284DA] hover:bg-[#0284FF] hover:text-white outline-none col-span-1"
                  onClick={() => convertCode("html")}
                >
                  <WandSparkles className="h-4 w-4 mr-1" /> {"HTML"}
                </Button> */}

              <Button
                variant="outline"
                size="sm"
                className="text-white bg-[#0284DA] hover:bg-[#0284FF] hover:text-white outline-none col-span-1"
                onClick={() => convertCode("javascript", "Generate a JavaScript function")}
              >
                <WandSparkles className="h-4 w-4 mr-1" />{" "}
                {"Generate JS Function"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="text-white bg-[#0284DA] hover:bg-[#0284FF] hover:text-white outline-none col-span-1"
                onClick={() => convertCode("css", "Create a responsive CSS grid layout")}
              >
                <WandSparkles className="h-4 w-4 mr-1" />{" "}
                {"Create CSS Grid"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="text-white bg-[#0284DA] hover:bg-[#0284FF] hover:text-white outline-none col-span-1"
                onClick={() => convertCode("regex", "Write a regex for email validation")}
              >
                <WandSparkles className="h-4 w-4 mr-1" />{" "}
                {"Email Regex"}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </>
  );
};

export default ChatGPTCard;
