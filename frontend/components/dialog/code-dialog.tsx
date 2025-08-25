"use client";

import { useCallback, useState } from "react";
import { Copy, Share, Flag, Lightbulb, ExternalLink } from "lucide-react";
import { Highlight, themes } from "prism-react-renderer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import * as Tooltip from "@radix-ui/react-tooltip";
const CodeDialog = (props: any) => {
  const [copied, setCopied] = useState(false);
  const formatCode = (code: string) => {
    const formattedCode = code.replaceAll('    ', '  ');
    return formattedCode;
  }
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(props.code);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
    await props.copyCode();
  }

  let handleShareClick = useCallback(async (e: any) => {


    if (props?.language?.length === 0 && navigator.share === undefined) return;

    try {
      await navigator.share({
        title: 'Check out this code',
        text: `${props.code}`,
        url: window.location.href
      })

      console.log('code shared successfully')

    } catch (error) {
      console.log('error', error)
    }
  }, [props])
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="dialog-size p-0 m-0">
        <DialogTitle className="hidden"></DialogTitle>
        <DialogDescription className="hidden"></DialogDescription>
        <Card className="h-full w-full flex flex-col overflow-hidden">
          <CardHeader className="p-4 border-b border-[#c8c8c8] flex justify-between items-center">
            <CardTitle className="text-lg md:text-1xl lg:text-2xl whitespace-nowrap overflow-hidden text-ellipsis">{props.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 flex-1 overflow-hidden">
            <ScrollArea className="h-full w-full text-sm sm:text-md">
              <Highlight theme={themes.oneLight} code={formatCode(props.code)} language={props.language == "java" ? "c" : props.language}>
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre className={className} style={{ ...style, backgroundColor: 'transparent' }}>
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
          <CardFooter className="h-max-[50px] bg-white p-2 sm:p-4 border-t border-[#c8c8c8] flex justify-center space-x-2 sm:space-x-6 items-center rounded-lg">
            <Tooltip.Provider>
              <Tooltip.Root open={copied}>
                <Tooltip.Trigger asChild>
                  <button
                    className={`hover:text-gray-600 transition-colors ${copied ? "text-gray-600" : "text-gray-400"}`}
                    onClick={handleCopyCode}
                  >
                    <Copy className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Content
                  side="top"
                  sideOffset={5}
                  className="bg-black text-white px-2 py-1 rounded text-xs shadow-md animate-fadeIn"
                >
                  Code copied
                  <Tooltip.Arrow className="fill-black" />
                </Tooltip.Content>
              </Tooltip.Root>
            </Tooltip.Provider>
            {/* <button className={`hover:text-gray-600 transition-colors ${copied ? "text-gray-600" : "text-gray-400"}`} onClick={() => handleCopyCode()} ><Copy className="h-4 w-4 sm:h-5 sm:w-5" /></button> */}
            {/* <button className="text-gray-400 hover:text-gray-800 outline-none" onClick={() => props.onShowFeedback("suggestion")}><Lightbulb className="h-4 w-4 sm:h-5 sm:w-5" /></button> */}
            {/* <button className="text-gray-400 hover:text-gray-800 outline-none" onClick={() => props.onShowFeedback("bug")} ><Flag className="h-4 w-4 sm:h-5 sm:w-5" /></button> */}
            <button className="text-gray-400 hover:text-gray-800 outline-none" onClick={handleShareClick}><ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" /></button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

export default CodeDialog;