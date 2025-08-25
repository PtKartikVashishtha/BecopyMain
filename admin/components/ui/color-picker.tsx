"use client";

import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";
import { Pen } from "lucide-react";
// import { EyeDropper } from "lucide-react";

export default function ColorPicker(props: any) {

  return (
    <div className="flex items-center gap-4">
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            className="w-10 h-10 rounded-full border-2 border-gray-300 shadow"
            style={{ backgroundColor: props.value }}
            aria-label="Select color"
          />
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            sideOffset={8}
            className="bg-white p-4 rounded-lg shadow-lg border w-48 flex flex-col items-center gap-3"
          >
            <label className="text-sm text-gray-600 font-medium">
              Choose any color:
            </label>

            <input
              type="color"
              value={props.value}
              onChange={props.onChange}
              className="w-full h-10 border rounded overflow-hidden cursor-pointer bg-transparent"
              style={{ padding: 0 }}
            />

            <div className="flex items-center gap-2 mt-2 text-sm font-mono">
              <Pen size={16} />
              <span>{props.value}</span>
            </div>

            <Popover.Arrow className="fill-white" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <span className="text-sm font-mono">{props.value}</span>
    </div>
  );
}
