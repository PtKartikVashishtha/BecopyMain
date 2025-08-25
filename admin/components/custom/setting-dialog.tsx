import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import CodeCard from "./code-card";
import { Save } from "lucide-react";
import { Button } from "../ui/button";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchDashboardString, updateDashboardString } from "@/store/reducers/dashStringSlice";

const SettingDialog = ({ open, onOpenChange }: any) => {
  const [code, setCode] = useState("");
  const dispatch = useAppDispatch();
  const dashboardString = useAppSelector((state) => state.dashboardstring.dashboardString);

  useEffect(() => {
    dispatch(fetchDashboardString());
  }, [dispatch])

  useEffect(() => {
    if (dashboardString)
      setCode(dashboardString.dashString);
  }, [dashboardString]);
  useEffect(() => {
    if (open) setCode(dashboardString.dashString);
  }, [open])
  const handleSave = async () => {
    if (code.length > 0)
      await dispatch(updateDashboardString({ dashboardString: code }));
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>

      <DialogContent
        className="p-2 m-2  w-[800px] h-[600px]"
      >
        <DialogHeader className="h-[5px] grid">
          <DialogTitle className="text-lg font-semibold">Set Dashboard String</DialogTitle>
          <Button variant="outline" className="hover:bg-gray-[400]" onClick={handleSave}>
            <Save className="w-3 h-3" />Save
          </Button>
        </DialogHeader>
        <div className="grid grid-cols-2 grid-rows-2 gap-4 w-[500px] h-[400px] max-w-[500px] max-h-[400px]">
          <textarea
            className="col-span-1 row-span-1 w-full h-full border resize-none overflow-hidden p-4 rounded-[15px] text-sm"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <CodeCard
            className="col-span-1 row-span-1 w-full h-full overflow-hidden"
            code={code}
            language="java"
          />
          <CodeCard
            className="col-span-1 row-span-1 w-full h-full overflow-hidden"
            code={code}
            language="python"
          />
          <CodeCard
            className="col-span-1 row-span-1 w-full h-full overflow-hidden"
            code={code}
            language="html"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingDialog;