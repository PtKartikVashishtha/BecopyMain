import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { toast } from '@/hooks/use-toast';
import { newContributions } from '@/store/reducers/contributionSlice';

export const listenerMiddleware = createListenerMiddleware();

// Add listener for contribution actions
listenerMiddleware.startListening({
  matcher: isAnyOf(
    newContributions.fulfilled,
    newContributions.rejected,
  ),
  effect: (action, listenerApi) => {
    // Handle contribution submission
    if (newContributions.fulfilled.match(action)) {
      const { isNew } = action.payload;
      toast({
        title: isNew ? "Contribution Submitted" : "Contribution Updated",
        description: isNew
          ? "Your contribution has been successfully submitted for review."
          : "Your contribution has been successfully updated.",
        variant: "success",
        duration: 5000,
      });
    }

    // Handle contribution submission error
    if (newContributions.rejected.match(action)) {
      toast({
        title: "Submission Failed",
        description: action.error.message || "Failed to submit contribution",
        variant: "destructive",
        duration: 5000,
      });
    }
  },
});