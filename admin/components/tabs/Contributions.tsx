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
import { Check, X, ArrowUpDown, Clock, FileText, Trash2, Pin, PinOff } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEffect, useState } from 'react';

import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  fetchContributions,
  accpetContribution,
  rejectContribution,
  deleteContribution,
  fetchStatus,
  togglePinnedContribution,
} from '@/store/reducers/contributionSlice';

export function Contributions(props: any) {
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const dispatch = useAppDispatch();
  const contributions = useAppSelector((state) => state.contributions.items);

  useEffect(() => {
    dispatch(fetchContributions());
  }, [dispatch]);

  const removeBackticks = (code: string) => {
    return code.replace(/`/g, '');
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

  const handleAccept = async (id: string) => {
    await dispatch(accpetContribution({ id }));
    await dispatch(fetchStatus({ id }));
  };

  const handleReject = async (id: string) => {
    await dispatch(rejectContribution({ id }));
    await dispatch(fetchStatus({ id }));
  };

  const handleDelete = async (id: string) => {
    await dispatch(deleteContribution({ id }));
  };

  const handlePinned = async (id: string) => {
    dispatch(togglePinnedContribution(id))
      .unwrap()
      .then((res) => {
        if (res?.success) {
          dispatch(fetchContributions());
        }
      })
      .catch((err) => {
        console.error('Pin contribution failed:', err);
      });
  };

  // Separate pinned and unpinned contributions
  const pinnedContributions = contributions.filter(c => c.isPinned);
  const unpinnedContributions = contributions.filter(c => !c.isPinned);

  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="justify-items-center border-gray-200">
              <SortButton field="type">Type</SortButton>
            </TableHead>
            <TableHead className="justify-items-center border-gray-200">
              <SortButton field="description">Description</SortButton>
            </TableHead>
            <TableHead className="justify-items-center border-gray-200">
              <SortButton field="date">Date</SortButton>
            </TableHead>
            <TableHead className="justify-items-center border-gray-200">
              <SortButton field="title">Review Code</SortButton>
            </TableHead>
            <TableHead className="text-center border-gray-200">Status</TableHead>
            <TableHead className="text-center border-gray-200">Actions</TableHead>
            <TableHead className="text-center border-gray-200">#</TableHead> {/* Serial number for pinned only */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pinnedContributions.map((item, idx) => (
            <TableRow key={item._id}>
              <TableCell className="text-center border-gray-200">
                <Badge variant={item.type === 'suggestion' ? 'default' : 'secondary'}>
                  {item.type}
                </Badge>
              </TableCell>
              <TableCell className="justify-items-center border-gray-200">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>{item.description}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">Description:</p>
                      <p className="text-sm">{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>

              <TableCell className="justify-items-center border-gray-200">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{item.createdAt}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Time elapsed: {item.createdAt}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="justify-items-center space-x-6 border-gray-200">
                <div className="flex items-center space-x-6">
                  <Button variant="ghost" size="icon" onClick={() => props.handleOpenDialog(removeBackticks(item.code.java), item.name, "java")}>
                    <Badge variant="outline" className="font-semibold">
                      Java
                    </Badge>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => props.handleOpenDialog(removeBackticks(item.code.python), item.name, "python")}>
                    <Badge variant="outline" className="font-semibold">
                      Python
                    </Badge>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => props.handleOpenDialog(removeBackticks(item.code.html), item.name, "html")}>
                    <Badge variant="outline" className="font-semibold">
                      HTMl
                    </Badge>
                  </Button>
                </div>
              </TableCell>
              <TableCell className="text-center border-gray-200">
                <Badge variant={item.status === 'pending' ? 'default' : 'secondary'}>
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-2">
                {item.status === 'pending' && (
                  <>
                    <Button variant="ghost" size="icon" className="text-green-600" onClick={() => handleAccept(item._id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleReject(item._id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" className="text-gray-600" onClick={() => handleDelete(item._id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-600" onClick={() => handlePinned(item._id)}>
                  {item.isPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
                </Button>
              </TableCell>
              <TableCell className="text-center border-gray-200">{idx + 1}</TableCell> {/* Serial number */}
            </TableRow>
          ))}

          {unpinnedContributions.map((item) => (
            <TableRow key={item._id}>
              <TableCell className="text-center border-gray-200">
                <Badge variant={item.type === 'suggestion' ? 'default' : 'secondary'}>
                  {item.type}
                </Badge>
              </TableCell>
              <TableCell className="justify-items-center border-gray-200">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>{item.description}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">Description:</p>
                      <p className="text-sm">{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>

              <TableCell className="justify-items-center border-gray-200">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{item.createdAt}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Time elapsed: {item.createdAt}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="justify-items-center space-x-6 border-gray-200">
                <div className="flex items-center space-x-6">
                  <Button variant="ghost" size="icon" onClick={() => props.handleOpenDialog(removeBackticks(item.code.java), item.name, "java")}>
                    <Badge variant="outline" className="font-semibold">
                      Java
                    </Badge>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => props.handleOpenDialog(removeBackticks(item.code.python), item.name, "python")}>
                    <Badge variant="outline" className="font-semibold">
                      Python
                    </Badge>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => props.handleOpenDialog(removeBackticks(item.code.html), item.name, "html")}>
                    <Badge variant="outline" className="font-semibold">
                      HTMl
                    </Badge>
                  </Button>
                </div>
              </TableCell>
              <TableCell className="text-center border-gray-200">
                <Badge variant={item.status === 'pending' ? 'default' : 'secondary'}>
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-2">
                {item.status === 'pending' && (
                  <>
                    <Button variant="ghost" size="icon" className="text-green-600" onClick={() => handleAccept(item._id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleReject(item._id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" className="text-gray-600" onClick={() => handleDelete(item._id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-600" onClick={() => handlePinned(item._id)}>
                  {item.isPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
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
