import { toast } from "@/hooks/use-toast";
import { useAppDispatch } from "@/store/hooks";
import { newContributions } from "@/store/reducers/contributionSlice";

// Define the shape of your contribution data
interface ContributionData {
  useremail?: string;
  [key: string]: any; // allows additional dynamic keys
}

export const submitContributions = async (
  userEmail: string,
  dispatch: ReturnType<typeof useAppDispatch>
): Promise<{ message: string } | undefined> => {
  const rawData = localStorage.getItem("addContributionData");
  const contributionData: ContributionData | null = rawData
    ? JSON.parse(rawData)
    : null;

  if (contributionData) {
    contributionData.useremail = userEmail;

    try {
      const { payload } = await dispatch(newContributions(contributionData));

      if (payload.success) {
        toast({
          title: "Contribution Submitted",
          description: "Your contribution has been successfully submitted.",
          variant: "success",
          duration: 5000,
        });
      }

      localStorage.removeItem('addContributionData')

      return { message: "Your contribution has been successfully submitted" };
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description:
          error?.message || "There was an error submitting your contribution.",
        variant: "destructive",
        duration: 5000,
      });
      throw new Error("Submission Failed");
    }
  }
};
