import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";


import * as shiki from "shiki";
const CodeCard = ({ code, language }: any) => {
  const [highlightedCode, setHighlightedCode] = useState('');
  useEffect(() => {
    const highlight = async () => {
      const highlighter = await shiki.createHighlighter({
        themes: ['light-plus', 'monokai'],
        langs: ['javascript', 'python', 'java', 'html']
      });

      const highlighted = highlighter.codeToHtml(code, {
        lang: language,
        theme: 'monokai',
      });
      // Remove background color from the generated HTML
      const cleanedHighlighted = highlighted.replace(
        /background-color:.*?;/g,
        "background-color: transparent;"
      );
      setHighlightedCode(cleanedHighlighted);
    };
    highlight();
  }, [code, language]);
  return (
    <Card className="bg-[#1f1f2b] border-[#c8c8c8]">
      {/* <CardHeader className="p-0 border-b border-[#c8c8c8] flex justify-between items-center max-h-[5px]">
        <CardTitle className="text-md pl-4">{language.slice(0, 1).toUpperCase() + language.slice(1)}</CardTitle>
      </CardHeader> */}
      <CardContent>
        <ScrollArea className="h-[40vh] sm:h-[50vh] lg:h-[60vh] w-full text-sm overflow-x-auto bg-transparent">
          <div
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
            className="shiki"
            style={{ backgroundColor: 'transparent' }}
          />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CodeCard;
