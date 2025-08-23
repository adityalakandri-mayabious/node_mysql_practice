import Category from "../config/db.js";

//create category
export const createCategory = async (req, res) => {
  try {
    const { category_name } = req.body;
    if (!category_name) {
      return res.status(400).json({
        status: false,
        message: "All fields are required.",
      });
    }
    //check existing name
    const [isExisting] = await Category.query(
      `SELECT category_name FROM category_table WHERE LOWER(category_name) = LOWER(?)`,
      [category_name]
    );

    if (isExisting.length > 0) {
      return res.status(400).json({
        status: false,
        message: "Category Name already exists.",
      });
    }

    const [insertedData] = await Category.query(
      `INSERT INTO category_table (category_name) VALUES(?)`,
      [category_name]
    );
    const insertId = insertedData.insertId;
    if (insertId === 0) {
      return res.status(400).json({
        status: false,
        message: "Error while inserting data.",
      });
    }
    const [data] = await Category.query(
      `SELECT * FROM category_table WHERE id = ?`,
      [insertId]
    );
    return res.status(200).json({
      status: true,
      message: "Category created successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

//get all categories
export const getAllCategories = async (req, res) => {
  try {
    const [data] = await Category.query(`SELECT * FROM category_table`);
    if (data.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No data found",
      });
    }
    return res.status(200).json({
      status: true,
      message: "data fetched successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

//get category by id
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const [data] = await Category.query(
      `SELECT id FROM category_table WHERE id = ?`,
      [id]
    );
    if (data.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Category not found.",
      });
    }
    return res.status(200).json({
      status: true,
      message: "Category fetched by id successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: error.message,
    });
  }
};

//update category by id
export const updateCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name } = req.body;
    const [categoryExist] = await Category.query(
      `SELECT id FROM category_table WHERE id = ?`,
      [id]
    );
    if (categoryExist.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Category does not exist.",
      });
    }
    const [updateCategory] = await Category.query(
      `UPDATE category_table SET category_name = ? WHERE id = ?`,
      [category_name, id]
    );

    if (updateCategory.changedRows === 0) {
      return res.status(400).json({
        status: false,
        message: "Error while updating data.",
      });
    }
    return res.status(200).json({
      status: true,
      message: "Category updated successfully.",
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: error.message,
    });
  }
};

//delete category
export const DeleteCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const [categoryExist] = await Category.query(
      `SELECT id FROM category_table WHERE id = ?`,
      [id]
    );
    if (categoryExist.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Category does not exist.",
      });
    }

    const [deleteCategory] = await Category.query(
      `DELETE FROM category_table WHERE id = ?`,
      [id]
    );
    console.log(deleteCategory);
    if (deleteCategory.affectedRows === 0) {
      return res.status(400).json({
        status: false,
        message: "Error occured while deleting data.",
      });
    }
    return res.status(200).json({
      status: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: error.message,
    });
  }
};
