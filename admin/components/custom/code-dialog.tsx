import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Highlight, themes } from "prism-react-renderer";

const CodeDialog = ({ open, onOpenChange, title, code, language }: any) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 m-0 flex justify-center items-center max-w-full"
        style={{
          maxWidth: "100vw", // Ensure it doesn't overflow
          width: "auto",
          maxHeight: "100vh",
        }}
      >
        <Card className="bg-white border-[#c8c8c8] w-[90vw] sm:w-[80vw] md:w-[70vw] lg:w-[60vw] max-w-[1200px]">
          <CardHeader className="p-4 border-b border-[#c8c8c8] flex justify-between items-center">
            <CardTitle className="text-lg md:text-1xl lg:text-2xl whitespace-nowrap overflow-hidden text-ellipsis">{title + ' ( ' + language.slice(0, 1).toUpperCase() + language.slice(1) + ' ) '}</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[40vh] sm:h-[50vh] lg:h-[60vh] w-full text-md sm:text-lg overflow-x-auto">
              <Highlight theme={themes.oneLight} code={code} language={language == "java" ? "c" : language}>
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre className={`${className} whitespace-pre-wrap overflow-x-auto`} style={{ ...style, backgroundColor: 'transparent' }}>
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line })}>
                        <span className="text-gray-500 mr-4">{i + 1}</span>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            </ScrollArea>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default CodeDialog;
