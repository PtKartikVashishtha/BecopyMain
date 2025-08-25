import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Textarea } from '../ui/textarea';



const QuizDialog = ({open,setOpen}) => {

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ maxWidth: '600px', maxHeight: '700px', overflowY: 'scroll', width: '90vw' }} className="max-w-md rounded-xl px-6 py-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Create New Quiz
            </DialogTitle>
            <p className="text-sm text-gray-500">
              Choose your quiz settings and challenge friends or
              practice solo
            </p>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            <div>
              <Input
                placeholder="Enter quiz title"
                className="outline-none focus-visible:ring-0 focus-visible:border-blue-500"
              />
            </div>

            <div>
              <Textarea
                placeholder="Add a brief description"
                className="outline-none focus-visible:ring-0 focus-visible:border-blue-500"
              />
            </div>

            <div>
              <Tabs defaultValue="solo">
                <TabsList className="w-full bg-gray-100 grid grid-cols-3 gap-1 rounded-md p-1">
                  <TabsTrigger value="solo" className="text-sm">
                    Solo Practice
                  </TabsTrigger>
                  <TabsTrigger value="direct" className="text-sm">
                    Direct Challenge
                  </TabsTrigger>
                  <TabsTrigger value="group" className="text-sm">
                    Group Challenge
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-sm text-muted-foreground mt-1">
                Practice on your own to improve your knowledge
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-2">
                Questions Configuration
              </h3>
              <div className="space-y-4">
                <div>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="10 Questions" />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 15, 20].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} Questions
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>

                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Any", "Easy", "Medium", "Hard"].map((d) => (
                        <SelectItem key={d} value={d.toLowerCase()}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Question Type
                  </label>
                  <RadioGroup
                    defaultValue="any"
                    className="flex gap-6"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="any" id="any" />
                      <label htmlFor="any" className="text-sm">
                        Any Type
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="multiple" id="multiple" />
                      <label htmlFor="multiple" className="text-sm">
                        Multiple Choice
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="truefalse" id="truefalse" />
                      <label htmlFor="truefalse" className="text-sm">
                        True/False
                      </label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>

            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm mt-2">
              Create Quiz
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default QuizDialog;
