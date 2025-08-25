'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCategories } from '@/store/reducers/categorySlice';

interface CategoryType {
  _id: string;
  name: string;
  parent: string | null;
  isActive: boolean | null;
}

interface CategorySelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void | null;
}

const CategorySelect: React.FC<CategorySelectProps> = ({ value, onChange }) => {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  // const [parentCategories,setParentCategories] = useState([])
  // const [childCategories,setChildCategories] = useState([])

  // useEffect(() => {

  //   if(categories.length > 0) {
  //     setParentCategories()
  //   }

  // }, [categories])
  const dispatch = useAppDispatch();

  const { items, loading, error } = useAppSelector((state) => state.categories);

  useEffect(() => {
    if (items && items.length === 0) {
      dispatch(fetchCategories());
    } else if (items) {
      setCategories(items);
    }
  }, [items, dispatch]);

  if (loading) return <p>Loading categories...</p>;
  if (error) return <p>Error loading categories.</p>;

  return (
    <select value={value} onChange={onChange} className="border p-2 rounded w-full">
      <option value="">Select a category</option>
      {categories.filter(cat => cat.parent === null).map((cat) => (
        <optgroup label={cat.name}>
          <option key={cat._id} value={cat._id}>
            {cat.name}
          </option>
          {
            categories.filter(subCat => subCat.parent === cat._id).map((subCatItem, key) => {
              return (
                <option key={key} value={subCatItem._id}>
                >> {subCatItem.name}
                </option>
              )
            })
          }


        </optgroup>

      ))}
    </select>
  );
};

export default CategorySelect;
