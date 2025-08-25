import { useSearchParams } from "next/navigation";

  
  const useQueryParams = () => {
    const searchParams = useSearchParams();
    const result: { [key: string]: string } = {};

    searchParams.forEach((value, key) => {
      result[key] = value;
    });

    return result;
  };


  export default useQueryParams