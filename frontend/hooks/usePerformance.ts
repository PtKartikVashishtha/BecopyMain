import { useEffect, useRef } from 'react';

export const usePerformance = (componentName: string) => {
  const startTime = useRef(performance.now());

  useEffect(() => {
    const endTime = performance.now();
    console.log(`${componentName} rendered in ${endTime - startTime.current}ms`);

    return () => {
      const unmountTime = performance.now();
      console.log(`${componentName} unmounted after ${unmountTime - startTime.current}ms`);
    };
  }, [componentName]);
}; 