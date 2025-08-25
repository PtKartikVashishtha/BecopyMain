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
import { Badge } from '@/components/ui/badge';
import { Check, X, ArrowUpDown, User, Calendar, Trash2, Pin, PinOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchJobs, rejectJob, acceptJob, fetchStatus, deleteJob, toggleJobPin } from '@/store/reducers/jobSlice';

export function JobPostings() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchJobs());
  }, [dispatch]);
  const { items, loading, error } = useAppSelector((state) => state.jobs);
  const [sortField, setSortField] = useState<string>('postedDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleAccept = async (id: string) => {
    await dispatch(acceptJob({ id }));
    await dispatch(fetchStatus({ id }));
  };
  const handleReject = async (id: string) => {
    await dispatch(rejectJob({ id }));
    await dispatch(fetchStatus({ id }));
  };

  const handleDelete = async (id: string) => {
    await dispatch(deleteJob({ id }));
  };

  const handlePinned = async (id: string) => {
    dispatch(toggleJobPin(id))
      .unwrap()
      .then((res) => {
        if (res?.success) {
          dispatch(fetchJobs());
        }
      })
      .catch((err) => {
        console.error('Pin job failed:', err);
      });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1"
    >
      {children}
      <ArrowUpDown className="h-4 w-4 ml-1" />
    </Button>
  );

  // Separate pinned and unpinned jobs
  const pinnedJobs = items.filter(job => job.isPinned);
  const unpinnedJobs = items.filter(job => !job.isPinned);

  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortButton field="title">Title</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="description">Description</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="company">Company</SortButton>
            </TableHead>
            <TableHead>Local & Budget</TableHead>
            <TableHead>
              <SortButton field="postedDate">Date</SortButton>
            </TableHead>
            <TableHead className="text-center border-gray-200">
              <SortButton field="status">Status</SortButton>
            </TableHead>
            <TableHead className="text-center">Actions</TableHead>
            <TableHead className="text-center border-gray-200">#</TableHead> {/* Serial only for pinned */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pinnedJobs.map((job, idx) => (
            <TableRow key={job._id}>
              <TableCell>{job.title}</TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center space-x-2">
                      <span>{job.description.slice(0, 30)}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{job.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>

              <TableCell className="text-center border-gray-200">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span className="text-center">{job.company}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{job.company}</p>
                      <p className="text-sm">{job.salary}</p>
                      <p className="text-sm">{job.jobLocation}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="text-center border-gray-200">
                <p className="text-sm">{job.salary}</p>
                <p className="text-sm">{job.jobLocation}</p>
              </TableCell>
              <TableCell className="text-center border-gray-200">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{job.deadline}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Posted on {job.createdAt}</p>
                      <p>Project Deadline {job.deadline}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="text-center border-gray-200">
                <Badge
                  variant={job.status === 'approved' ? 'default' : 'secondary'}
                >
                  {job.status}
                </Badge>
              </TableCell>
              <TableCell className="text-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={job.status !== 'pending'}
                  className="text-green-600"
                  onClick={() => handleAccept(job._id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={job.status !== 'pending'}
                  className="text-red-600"
                  onClick={() => handleReject(job._id)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-600"
                  onClick={() => handleDelete(job._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-600"
                  onClick={() => handlePinned(job._id)}
                >
                  {job.isPinned ? (
                    <Pin className="h-4 w-4" />
                  ) : (
                    <PinOff className="h-4 w-4" />
                  )}
                </Button>
              </TableCell>
              <TableCell className="text-center border-gray-200">{idx + 1}</TableCell>{/* Serial number */}
            </TableRow>
          ))}

          {unpinnedJobs.map((job) => (
            <TableRow key={job._id}>
              <TableCell>{job.title}</TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center space-x-2">
                      <span>{job.description.slice(0, 30)}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{job.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>

              <TableCell className="text-center border-gray-200">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span className="text-center">{job.company}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{job.company}</p>
                      <p className="text-sm">{job.salary}</p>
                      <p className="text-sm">{job.jobLocation}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="text-center border-gray-200">
                <p className="text-sm">{job.salary}</p>
                <p className="text-sm">{job.jobLocation}</p>
              </TableCell>
              <TableCell className="text-center border-gray-200">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{job.deadline}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Posted on {job.createdAt}</p>
                      <p>Project Deadline {job.deadline}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="text-center border-gray-200">
                <Badge
                  variant={job.status === 'approved' ? 'default' : 'secondary'}
                >
                  {job.status}
                </Badge>
              </TableCell>
              <TableCell className="text-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={job.status !== 'pending'}
                  className="text-green-600"
                  onClick={() => handleAccept(job._id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={job.status !== 'pending'}
                  className="text-red-600"
                  onClick={() => handleReject(job._id)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-600"
                  onClick={() => handleDelete(job._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-600"
                  onClick={() => handlePinned(job._id)}
                >
                  {job.isPinned ? (
                    <Pin className="h-4 w-4" />
                  ) : (
                    <PinOff className="h-4 w-4" />
                  )}
                </Button>
              </TableCell>
              <TableCell className="text-center border-gray-200">{/* Empty for unpinned */}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
