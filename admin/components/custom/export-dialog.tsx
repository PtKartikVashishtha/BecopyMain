import { Dialog, DialogHeader, DialogTitle, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import * as XLSX from "xlsx";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useEffect, useState } from "react";
import { ChevronDown, Folder, FolderOpen } from "lucide-react";

const ExportDialog = ({ open, onOpenChange }: any) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const categories = useAppSelector((state) => state.categories.items);
  const programs = useAppSelector((state) => state.programs.items);

  const getCategoryName = async (categoryId: string) => {
    const categoryName = await categories.filter((category) => { if (category._id == categoryId) return category; })[0].name;
    return categoryName;
  }
  const handleCategorySelection = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId) // Remove if already selected
        : [...prev, categoryId] // Add if not selected
    );
  };

  const exportSelectedCategories = async () => {
    // Filter programs by selected categories
    const filteredPrograms = programs.filter((program) =>
      selectedCategories.includes(program.category)
    );

    // Prepare data for Excel
    const data = await Promise.all(
      filteredPrograms.map(async (program) => {
        const categoryName = await getCategoryName(program.category);
        return {
          name: program.name,
          description: program.description,
          javaCode: program.code.java,
          pythonCode: program.code.python,
          htmlCode: program.code.html,
          category: categoryName,
        }
      }));
    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Create a workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Programs");

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, "Programs.xlsx");

    // Close the dialog
    onOpenChange(false);
  };
  const renderCategoryTree = (parentId: string | null) => {
    const children = categories.filter((category) => category.parent === parentId);

    if (children.length === 0) {
      return null;
    }

    return (
      <div className="ml-4 border-l-2 border-gray-300 pl-2 space-y-1">
        {children.map((category) => (
          <div key={category._id}>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedCategories.includes(category._id)}
                onCheckedChange={() => handleCategorySelection(category._id)}
              />
              <span className="font-bold">{category.name}</span>
            </div>
            {renderCategoryTree(category._id)}
          </div>
        ))}
      </div>
    );
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Categories</DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-2">{renderCategoryTree(null)}</div>
        <div className="flex justify-end space-x-4 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={exportSelectedCategories}>Export</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ExportDialog;