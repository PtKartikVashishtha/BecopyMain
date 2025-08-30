// components/debug/ReduxDebug.tsx
'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

export default function ReduxDebug() {
  const entireState = useSelector((state: RootState) => state);
  
  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-black text-white p-4 rounded text-xs z-50 max-h-96 overflow-auto">
      <h3 className="font-bold mb-2">Redux State Debug:</h3>
      <pre>{JSON.stringify(entireState, null, 2)}</pre>
    </div>
  );
}

// Add this to your page temporarily:
// import ReduxDebug from '@/components/debug/ReduxDebug';
// Then add <ReduxDebug /> at the bottom of your JSX