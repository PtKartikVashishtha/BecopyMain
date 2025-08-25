import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { NextRouter } from "next/router";

interface DailyQuizProps {
  router: AppRouterInstance;
}


const DailyQuiz = ({ router }: DailyQuizProps) => {

  return (
    <>
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2 flex items-center">
          <Trophy className="h-6 w-6 mr-2 text-[#0284DA]" /> Daily Quiz
        </h3>
        <p className="text-sm text-gray-600">Test your knowledge and win prizes!</p>
        <Button className="w-full mt-2 bg-[#0284DA] hover:bg-[#0284FF]" size="sm" onClick={() => {router.push("../../quiz")}}>
          Start Quiz
        </Button>
      </div>
    </>

  );
};

export default DailyQuiz; 