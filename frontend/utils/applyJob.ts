import { deleteFile, getFile } from './fileStoreInIdb';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface JobApplyData {
  jobId: string;
  coverLetter: string;
  fileId: string;
}

export default async function applyJob(userId: string) {
  // Parse jobApplyData from localStorage
  const rawData = localStorage.getItem('jobApplyData');
  if (!rawData) {
    toast({
      title: 'Missing Data',
      description: 'No job application data found in local storage.',
      variant: 'destructive',
    });
    return;
  }

  const { jobId, coverLetter, fileId } = JSON.parse(rawData) as JobApplyData;


  // Get file from IndexedDB
  const resumeFile = await getFile(fileId);

  if (!resumeFile || !(resumeFile.data instanceof Blob)) {
    toast({
      title: 'File Error',
      description: 'Could not retrieve your resume file.',
      variant: 'destructive',
    });
    return;
  }

  // Ensure it's a File with name/type
  const fileToUpload =
    resumeFile.data instanceof File
      ? resumeFile.data
      : new File([resumeFile.data], resumeFile.name, { type: resumeFile.type });


  const formData = new FormData();
  formData.append('userId', userId);
  formData.append('jobId', jobId);
  formData.append('coverLetter', coverLetter);
  formData.append('file', fileToUpload, fileToUpload.name);

  try {
    const response = await api.post('/api/upload/apply', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });

    if (response.status === 200) {
      toast({
        title: 'Successfully applied job!',
        variant: 'success',
      });
      localStorage.removeItem('jobApplyData');
      await deleteFile(fileId)
      // window.location.href = "/";
      return { message: 'Job applied successfully' };
    } else {
      toast({
        title: 'Submission Failed',
        description: 'An error occurred while submitting your application.',
        variant: 'destructive',
      });
    }
  } catch (error) {

    toast({
      title: 'Network Error',
      description: 'Could not submit application. Please try again later.',
      variant: 'destructive',
    });
  }
}
