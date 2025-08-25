'use client';

import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

import { useToast } from '@/hooks/use-toast';
import { FileText, UploadCloud, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth'; // Assuming you have useAuth for user details
import { useRef } from 'react';

import ftpapi from '@/lib/ftpapi';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useRouter } from 'next/navigation';

import {saveFile} from '../../utils/fileStoreInIdb'
import Draggable from "react-draggable";
import { useDispatch } from 'react-redux';
import { fetchJobs } from '@/store/reducers/jobSlice';
interface ApplyJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplyJobDialog({
  open,
  onOpenChange,
}: ApplyJobDialogProps) {
  const { user, isAuthenticated } = useAuth(); // Get logged-in user info
  const { toast } = useToast();
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a PDF file.',
          variant: 'destructive',
        });
        setResumeFile(null);
        setFileName('');
        event.target.value = ''; // Reset file input
      } else if (file.size > 10 * 1024 * 1024) { // 10MB size limit
        toast({
          title: 'File Too Large',
          description: 'Please upload a file smaller than 10MB.',
          variant: 'destructive',
        });
        setResumeFile(null);
        setFileName('');
        event.target.value = ''; // Reset file input
      } else {
        setResumeFile(file);
        setFileName(file.name);
      }
    } else {
      setResumeFile(null);
      setFileName('');
    }
  };
  const { items, loading, error } = useAppSelector((state) => state.jobs);

  const dispatch = useAppDispatch()

  useEffect(() => {
    if (open) {
      dispatch(fetchJobs());
    }
  }, [open]);

  const resetForm = () => {
    setDescription('');
    setResumeFile(null);
    setFileName('');
    setIsLoading(false);
    // Optionally reset the file input visually if needed
    const fileInput = document.getElementById('resume-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    // if (!user) {
    //   toast({ title: "Authentication Error", description: "You must be logged in to apply.", variant: "destructive" });
    //   return;
    // }
    if (!description.trim()) {
      toast({ title: "Missing Description", description: "Please enter a cover letter or message.", variant: "destructive" });
      return;
    }
    if (!resumeFile) {
      toast({ title: "Missing Resume", description: "Please upload your resume (PDF).", variant: "destructive" });
      return;
    }

    let fileId = await saveFile(resumeFile)

    let applyFormData = {
      userId: null,
      jobId: selectedJobId,
      coverLetter: description,
      fileId
    }

    if(!user) {
          localStorage.setItem('jobApplyData', JSON.stringify(applyFormData))
          return router.push('/userauth?fromApplyJob=true')

    }

    

    setIsLoading(true);
    const formData = new FormData();
    formData.append('userId', user.id); // Get name from auth context
    formData.append('jobId', selectedJobId);
    formData.append('coverLetter', description);
    formData.append('file', resumeFile, resumeFile.name); // 'file' key matches backend upload.single('file')

    try {
      const response = await ftpapi.post('/api/upload/apply', formData);

      if (response.status == 200) {
        toast({
          title: 'Application Sent!',
          // description: `Your application for ${jobTitle} has been submitted.`,
          variant: 'success', // Use the green variant if you added it
        });
        resetForm();
        onOpenChange(false); // Close dialog on success
      } else {
        toast({
          title: 'Submission Failed',
          description: 'An error occurred while submitting your application.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Network Error',
        description: 'Could not submit application. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle closing the dialog (e.g., clicking outside or X button)
  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm(); // Reset form when dialog closes
    }
    onOpenChange(isOpen);
  };
  useEffect(() => {
    // if (open && !isAuthenticated) {
    //   onOpenChange(false); // Close the dialog
    //   router.push('/userauth'); // Redirect to auth page
    // }
  }, [open, isAuthenticated, router, onOpenChange]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Draggable handle=".drag-handle" nodeRef={dragRef}>
        <div
          ref={dragRef}
          className="relative bg-white rounded-lg shadow-lg w-[600px] max-h-[700px] h-fit"
          style={{ maxHeight: '700px' }}
        >
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            onClick={() => handleDialogClose(false)}
            disabled={isLoading}
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <Card className="h-full flex flex-col border-none shadow-none overflow-hidden" style={{ maxHeight: '700px' }}>
            <CardHeader className="drag-handle cursor-move">
              <CardTitle>Apply Job</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-1 overflow-auto">
              <form onSubmit={handleSubmit} className="grid gap-4 py-4 h-full">
                <div className="grid gap-2">
                  <Select
                    value={selectedJobId}
                    onValueChange={setSelectedJobId}
                    disabled={isLoading || loading}
                  >
                    <SelectTrigger className="focus:outline-none focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder="Select a job to apply for" />
                    </SelectTrigger>
                    <SelectContent className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0">
                      {loading ? (
                        <SelectItem value="loading" disabled>
                          <div className="flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading jobs...
                          </div>
                        </SelectItem>
                      ) : items.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No jobs available
                        </SelectItem>
                      ) : (
                        items.map((job) => (
                          <SelectItem key={job._id} value={job._id}>
                            {job.title} - {job.company}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Textarea
                    id="description"
                    placeholder="Briefly explain why you're a good fit for this role..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
                  onClick={isLoading ? undefined : handleUploadClick}
                  role="button"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                    {fileName ? (
                      <>
                        <FileText className="w-8 h-8 mb-3 text-green-500" />
                        <p className="mb-1 text-sm text-gray-700 dark:text-gray-300 font-semibold truncate max-w-[200px]">{fileName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Click to replace</p>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400" />
                        <p className="mb-1 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload resume</span></p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">PDF only (MAX. 10MB)</p>
                      </>
                    )}
                  </div>
                  <input
                    id="resume-upload-hidden"
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex justify-align-end space-x-4 pb-4">
                  <Button type="submit" disabled={isLoading} className="bg-[#0284DA] hover:bg-[#0284FF] text-white w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      'Apply'
                    )}
                  </Button>
                  <Button type="button" variant="outline" disabled={isLoading} className='w-full' onClick={() => handleDialogClose(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </Draggable>
    </div>
  );
}