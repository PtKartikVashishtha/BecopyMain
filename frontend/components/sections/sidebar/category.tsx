"use client";

import { ChevronDown, FolderOpen, Folder, FileCode } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchCategories } from "@/store/reducers/categorySlice";
import { fetchPrograms } from "@/store/reducers/programSlice";
import { useEffect, useState } from "react";
import { Program } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMediaQuery } from "react-responsive";

interface CategoryProps {
  expandedCategories: string[];
  toggleCategory: (name: string) => void;
  onSelectProgram: (program: Program) => void;
  setProgramNotFound: (isTrue: boolean) => void;
  searchQuery: string;
}

const Category = ({
  expandedCategories,
  toggleCategory,
  onSelectProgram,
  setProgramNotFound,
  searchQuery,
}: CategoryProps) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchPrograms());
  }, [dispatch]);

  const isMobile = useMediaQuery({ maxWidth: 768 });
  const categoriesState = useAppSelector((state) => state.categories);
  const programsState = useAppSelector((state) => state.programs);

  const categories = categoriesState.items;
  const programs = programsState.items;

  useEffect(() => {
    let filteredPrograms = programs.filter(
      (program) =>
        program.isActive &&
        program.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (programs.length !== 0 && filteredPrograms.length == 0) {
      console.log(programs, filteredPrograms);
      setProgramNotFound(true);
    } else {
      setProgramNotFound(false);
    }
  }, [programs, searchQuery]);

  const renderCategoryTree = (categoryId: string | null) => {
    return (
      <>
        {categories
          .filter((category) => category.parent === categoryId)
          .map((category, index) => (
            <div key={index} className="space-y-1">
              <TooltipProvider>
                <Tooltip>
                  {/* <TooltipTrigger asChild>
                    <button
                      onClick={() => toggleCategory(category._id)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <div className="flex items-center">
                        {expandedCategories.includes(category._id) ? (
                          <FolderOpen className="h-5 w-5 text-blue-500 mr-2" />
                        ) : (
                          <Folder className="h-5 w-5 text-blue-500 mr-2" />
                        )}
                        <span className="text-base font-medium">
                          {category.name}
                        </span>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${
                          expandedCategories.includes(category._id)
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    </button>
                  </TooltipTrigger> */}

                  <TooltipTrigger asChild>
                    <button
                      onClick={() => toggleCategory(category._id)}
                      className="w-full flex items-center p-2 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      {expandedCategories.includes(category._id) ? (
                        <FolderOpen className="h-4 w-4 text-blue-500 mr-2" />
                      ) : (
                        <Folder className="h-4 w-4 text-blue-500 mr-2" />
                      )}
                      <span className="text-sm font-medium">
                        {category.name}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 ml-auto transition-transform ${
                          expandedCategories.includes(category._id)
                            ? "transform rotate-180"
                            : ""
                        }`}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{category.description || "No description available"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Children */}
              {expandedCategories.includes(category._id) && (
                <div className="mt-3 pl-4 space-y-2">
                  {renderCategoryTree(category._id)}

                  {programs
                    .filter(
                      (program) =>
                        program.isActive &&
                        program.category === category._id &&
                        program.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())
                    )
                    .map((program, index) => (
                      <TooltipProvider key={index}>
                        {/* <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              key={program._id}
                              className="flex items-center p-2 rounded-md w-full hover:bg-gray-100 text-sm"
                              onClick={() => onSelectProgram(program)}
                            >
                              <FileCode className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{program.name}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {program.description ||
                                "No description available"}
                            </p>
                          </TooltipContent>
                        </Tooltip> */}

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              key={program._id}
                              className="w-full flex items-center py-0 px-2 hover:bg-gray-100 rounded-md text-sm group"
                              onClick={() => onSelectProgram(program)}
                            >
                              <FileCode className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{program.name}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {program.description ||
                                "No description available"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                </div>
              )}
            </div>
          ))}
      </>
    );
  };

  return (
    <div
      className={`overflow-y-auto ${
        isMobile ? "max-h-[350px] min-h-[292px]" : "flex-1 min-h-[350px] max-h-[350px]"
      }`}
    >
      <div className="p-4 space-y-2">{renderCategoryTree(null)}</div>
    </div>
  );
};

export default Category;
