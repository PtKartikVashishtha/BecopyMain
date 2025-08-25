"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth"; // You'll need to create this hook
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Input } from "../ui/input";

import { newjob } from "@/store/reducers/jobSlice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CustomDatePicker from "../custom/date-picker";
import Draggable from "react-draggable";
import { X } from "lucide-react";

interface JobPostingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const JobPostingDialog = ({ open, onOpenChange }: JobPostingFormProps) => {
  const { isAuthenticated, user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const dragRef = useRef<HTMLDivElement>(null);

  const [company, setCompany] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [deadline, setDeadline] = useState("");
  const [howtoapply, setHowtoapply] = useState("");

  const handleClose = () => {
    onOpenChange(false);
  };
  useEffect(() => {
    if (open && !isAuthenticated) {
      // onOpenChange(false); // Close the dialog
      // router.push('/recruiterauth'); // Redirect to auth page
    }
  }, [open, isAuthenticated, router, onOpenChange]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      let postJobData = {
        title,
        company,
        description,
        responsibilities,
        requirements,
        jobLocation,
        salary,
        deadline,
        howtoapply,
      };

      return console.log("postJobData", postJobData);
      if (!isAuthenticated) {
        localStorage.setItem("postJobData", JSON.stringify(postJobData));
        return router.push("/recruiterauth?fromPostJob=true");
      }
    }
    setLoading(true);
    setError("");

    dispatch(
      newjob({
        recruiter: user?.id,
        title,
        company,
        description,
        responsibilities,
        requirements,
        jobLocation,
        salary,
        deadline,
        howtoapply,
      })
    )
      .then(() => {
        onOpenChange(false);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Draggable handle=".drag-handle" nodeRef={dragRef}>
        <div
          ref={dragRef}
          className="relative bg-white rounded-lg shadow-lg w-[600px] h-fit-content"
          style={{ maxHeight: "700px" }}
        >
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </button>

          <Card className="w-full h-full overflow-auto">
            <CardHeader className="drag-handle cursor-move pb-1">
              <CardTitle>Post a Job</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-6 gap-4 py-4 align-items-end"
              >
                <div className="col-span-4 gap-2 ">
                  <Input
                    id="title"
                    name="title"
                    placeholder="Job Title *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                  />
                </div>
                <div className=" col-span-2 gap-2">
                  <Input
                    id="company"
                    name="company"
                    placeholder="Company *"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                    className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                  />
                </div>
                <div className="col-span-6">
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                  />
                </div>
                <div className=" gap-2 col-span-3">
                  <Textarea
                    id="responsibilities"
                    name="responsibilities"
                    placeholder="Responsibilities"
                    value={responsibilities}
                    onChange={(e) => setResponsibilities(e.target.value)}
                    className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                  />
                </div>
                <div className=" gap-2 col-span-3">
                  <Textarea
                    id="requirements"
                    name="requirements"
                    placeholder="Requirements"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                  />
                </div>
                <div className="gap-2 col-span-3">
                  <Select
                    value={jobLocation}
                    onValueChange={(
                      value: "UK" | "CA" | "US" | "AU" | "Europe"
                    ) => setJobLocation(value)}
                  >
                    <SelectTrigger className="focus:outline-none focus:ring-0 focus:ring-offset-0 w-full">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0">
                      <SelectItem value="UK">UK</SelectItem>
                      <SelectItem value="CA">CA</SelectItem>
                      <SelectItem value="US">US</SelectItem>
                      <SelectItem value="AU">AU</SelectItem>
                      <SelectItem value="Europe">Europe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="gap-2 col-span-3">
                  <Input
                    id="salary"
                    name="salary"
                    placeholder="Salary"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                  />
                </div>
                <div className=" gap-2 col-span-6">
                  <div className="text-xs text-gray-500">Apply Before</div>
                  <CustomDatePicker
                    selectedDate={deadline}
                    onChange={(date) => setDeadline(date?.toISOString() || "")}
                  />
                  {/* <Input id="deadline" name="deadline" title="Job Deadline" placeholder="Apply Before *" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0" /> */}
                </div>
                <div className=" gap-2 col-span-6">
                  <Textarea
                    id="howtoapply"
                    name="howtoapply"
                    placeholder="How to Apply"
                    value={howtoapply}
                    onChange={(e) => setHowtoapply(e.target.value)}
                    className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                  />
                </div>
                {error && (
                  <div className="text-red-500 text-sm text-center">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="bg-[#0284DA] hover:bg-[#0284FF] text-white col-span-3"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="submit"
                  className="bg-[#0284DA] hover:bg-[#0284FF] text-white col-span-3"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </Draggable>
    </div>
  );
};
export default JobPostingDialog;
