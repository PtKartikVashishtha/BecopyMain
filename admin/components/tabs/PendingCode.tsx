'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Eye,
  EyeOff,
  FileUp,
  Search,
  ArrowUpDown,
  Copy,
  Lightbulb,
  Flag,
  FileText,
  Pin,
  PinOff,
  CheckCheckIcon
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchPrograms, acceptProgram, rejectProgram, fetchStatus, togglePinnedProgram, aproveProgram, } from '@/store/reducers/programSlice';
import { fetchCategories } from '@/store/reducers/categorySlice';
import ftpapi from '@/lib/ftpapi';


export function PendingCode(props: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const removeBackticks = (code: string) => {
    return code.replace(/`/g, '');
  };
  const dispatch = useAppDispatch();
  const programs = useAppSelector((state) => state.programs.items);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchPrograms());
  }, [dispatch]);

  const handleAccept = async (id: string) => {
    await dispatch(acceptProgram(id));
    await dispatch(fetchStatus(id));
  };

  const handleReject = async (id: string) => {
    await dispatch(rejectProgram(id));
    await dispatch(fetchStatus(id));
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePinned = async (id: string) => {
    dispatch(togglePinnedProgram(id))
      .unwrap()
      .then(() => {
        dispatch(fetchPrograms());
      })
      .catch((error) => {
        console.error('Error toggling pinned status:', error);
      });
  };
  const handleAprroved = async (id: string) => {
    dispatch(aproveProgram(id))
      .unwrap()
      .then(() => {
        dispatch(fetchPrograms());
      })
      .catch((error) => {
        console.error('Error toggling pinned status:', error);
      });
  };

  const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <Button variant="ghost" onClick={() => handleSort(field)} className="flex items-center space-x-1">
      {children}
      <ArrowUpDown className="h-4 w-4 ml-1" />
    </Button>
  );

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      console.error('No file selected');
      return;
    }
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await ftpapi.post('/api/upload/code', formData);
      console.log(response);
      dispatch(fetchPrograms());
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // Filter programs by search query
  const filteredPrograms = programs.filter(program =>
    program?.name?.toLowerCase().includes(searchQuery?.toLowerCase())
  );

  // Separate pinned and unpinned
  const pinnedPrograms = filteredPrograms.filter(p => p.isPinned);
  const unpinnedPrograms = filteredPrograms.filter(p => !p.isPinned);
  const pendingPrograms = filteredPrograms.filter(p => p.status === 'pending').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex justify-end space-x-4">
          <Button className="justify-self-end">
            <Input
              type="file"
              accept=".xlsx"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <FileUp className="mr-2 h-4 w-4" />
              Import Excel
            </label>
          </Button>
          <Button onClick={props.handleOpenExportDialog} className="justify-self-end">
            <FileText className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center border-gray-200">
              <SortButton field="name">Name</SortButton>
            </TableHead>
            <TableHead className="text-center border-gray-200">
              <SortButton field="name">Category</SortButton>
            </TableHead>
            <TableHead className="text-center border-gray-200">Status</TableHead>
            <TableHead className="text-left border-gray-200">Description</TableHead>
            <TableHead className="justify-items-center border-gray-200">
              <SortButton field="lastUpdated">Last Updated</SortButton>
            </TableHead>
            <TableHead className="justify-items-center border-gray-200">
              <SortButton field="copiedCount">Usage Stats</SortButton>
            </TableHead>
            <TableHead className="text-center border-gray-200">Review Code</TableHead>
            <TableHead className="text-center border-gray-200">Actions</TableHead>
            <TableHead className="text-center border-gray-200">#</TableHead>{/* Serial number only for pinned */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingPrograms.map((program, idx) => (
            <TableRow key={program._id}>
              <TableCell className="justify-items-center border-gray-200">{program.name}</TableCell>
              <TableCell className="justify-items-center border-gray-200">{program.categoryFullName}</TableCell>
              <TableCell className="text-center border-gray-200">
                <Badge variant={program.isActive === true ? 'default' : 'secondary'}>
                  {program.isActive === true ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="justify-items-left border-gray-200">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-left space-x-1">
                      <FileText className="h-4 w-4" />
                      <span>{program.description.slice(0, 30)}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{program.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="text-center border-gray-200">{program.updatedAt}</TableCell>
              <TableCell className="justify-items-center border-gray-200">
                <div className="flex items-center space-x-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center space-x-1">
                        <Copy className="h-4 w-4" />
                        <span>{program.copies}</span>
                      </TooltipTrigger>
                      <TooltipContent>Copied {program.copies} times</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center space-x-1">
                        <Flag className="h-4 w-4" />
                        <span>{program.bugfixes}</span>
                      </TooltipTrigger>
                      <TooltipContent>Bugfixes {program.bugfixes}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center space-x-1">
                        <Lightbulb className="h-4 w-4" />
                        <span>{program.suggestions}</span>
                      </TooltipTrigger>
                      <TooltipContent>Suggested {program.suggestions} times</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
              <TableCell className="justify-items-center space-x-6 border-gray-200">
                <div className="flex items-center space-x-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      props.handleOpenDialog(removeBackticks(program.code.java), program.name, 'java')
                    }
                  >
                    <Badge variant="outline" className="font-semibold">
                      Java
                    </Badge>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      props.handleOpenDialog(removeBackticks(program.code.python), program.name, 'python')
                    }
                  >
                    <Badge variant="outline" className="font-semibold">
                      Python
                    </Badge>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      props.handleOpenDialog(removeBackticks(program.code.html), program.name, 'html')
                    }
                  >
                    <Badge variant="outline" className="font-semibold">
                      HTMl
                    </Badge>
                  </Button>
                </div>
              </TableCell>
              <TableCell className="justify-items-center border-gray-200">
                <div className="flex items-center space-x-2">

                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={program.isActive}
                    onClick={() => handleAccept(program._id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!program.isActive}
                    onClick={() => handleReject(program._id)}
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-600"
                    onClick={() => handlePinned(program._id)}
                  >
                    {program.isPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-600"
                    onClick={() => handleAprroved(program._id)}
                  >
                    {program.status === 'approved' ? <CheckCheckIcon className="h-4 w-4 text-green-500" /> : <CheckCheckIcon className="h-4 w-4" />}
                  </Button>



                </div>
              </TableCell>
              <TableCell className="text-center border-gray-200">{idx + 1}</TableCell> {/* Serial number */}
            </TableRow>
          ))}

        </TableBody>
      </Table>
    </div>
  );
}
