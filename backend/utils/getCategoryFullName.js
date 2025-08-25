const Category = require('../models/categoryModel'); // Adjust the path to your Category model

/**
 * Get the full name of a category, including all parent categories.
 * @param {string} categoryId - The MongoDB ID of the category.
 * @returns {Promise<string>} - The full name of the category.
 */
const getFullCategoryName = async (categoryId) => {
  const category = await Category.findById(categoryId);




  // If the category has no parent, return its name
  if (!category?.parent) {
    return category?.name;
  }

  // Recursively get the full name of the parent category
  const parentFullName = await getFullCategoryName(category?.parent);

  // Combine the parent name with the current category name
  return `${parentFullName} > ${category?.name}`;
};

module.exports = getFullCategoryName;