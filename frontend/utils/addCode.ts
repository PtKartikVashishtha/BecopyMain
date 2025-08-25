import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';
export default async function addCode(userId: string) {

  let addPostData = JSON.parse(localStorage.getItem('addCodeData') || '{}')
  addPostData.userId = userId

  try {
    const response = await api.post("/api/programs", addPostData);
    if (response.status === 201) {
      toast({
        title: "Code Added",
        description: "Your code has been successfully submitted.",
        variant: "success",
        duration: 5000,
      });
    }

  } catch (error: any) {
    toast({
      title: "Code adding Failed",
      description: error.message || "There was an error submitting your code.",
      variant: "destructive",
      duration: 5000,
    });
    console.log(error)
  }

}