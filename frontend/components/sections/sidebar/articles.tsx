import { Briefcase } from "lucide-react";
import { ARTICLES } from "@/constants";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchJobs } from "@/store/reducers/jobSlice";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface ArticlesProps {
  onShowJobPosting: () => void;
  onShowApplyJob: () => void;
  router?: any;
}

const Articles = ({ onShowJobPosting, onShowApplyJob, router }: ArticlesProps) => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  useEffect(() => {
    dispatch(fetchJobs());
  }, [dispatch]);
  const { items, loading, error } = useAppSelector((state) => state.jobs);
  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h3 className="font-semibold mb-2 flex items-center">
        <Briefcase className="h-6 w-6 mr-2 text-[#0284DA]" /> Jobs
      </h3>
      <div className="space-y-2 h-[100px] overflow-auto ">
        {items.map((job) => (
          job.status === "approved" && (
            <div key={job._id} className="text-sm hover:bg-gray-50 p-2 rounded cursor-pointer">
              {job.title}
            </div>
          )
        ))}
      </div>
      <div className="flex space-x-4">
        {/* {user?.role === "user" ?
          <Button onClick={onShowApplyJob} className="w-full mt-4 bg-[#0284DA] hover:bg-[#0284FF] text-white">Apply</Button>
          : <Button onClick={onShowJobPosting} className="w-full mt-4 bg-[#0284DA] hover:bg-[#0284FF] text-white">Post Job</Button>
        } */}
        <Button onClick={() => {router.push("../../jobs")}} className="w-full mt-4 bg-[#0284DA] hover:bg-[#0284FF] text-white">More</Button>
        <Button onClick={onShowJobPosting} className="w-full mt-4 bg-[#0284DA] hover:bg-[#0284FF] text-white">Post Job</Button>

      </div>

    </div>
  );
};

export default Articles; 