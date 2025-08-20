import Blog from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

//create blogs
export const createBlog = async (req, res) => {
  try {
    const authorId = req.user?.id;
    console.log(authorId);
    const { title, description, categoryId, tags } = req.body;
    console.log("Request body:", req.body);

    if (!title || !description || !categoryId || !tags) {
      return res.status(400).json({
        status: false,
        message: "All fields are required.",
      });
    }

    const tagString = Array.isArray(tags) ? tags.join(",") : tags;
    console.log(tagString);

    const [data] = await Blog.query(
      `INSERT INTO blog_table (title, description, categoryId, authorId, tags) VALUES ( ?, ?, ?, ?, ?)`,
      [title, description, categoryId, authorId, tagString]
    );

    const insertId = data.insertId;
    if (!insertId) {
      return res.status(400).json({
        status: false,
        message: "Error occurred while inserting data.",
      });
    }

    const [blog] = await Blog.query(`SELECT * FROM blog_table WHERE id = ?`, [
      insertId,
    ]);

    return res.status(200).json({
      status: true,
      message: "Blog created successfully.",
      data: blog[0],
    });
  } catch (error) {
    console.error("Create blog error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal server error",
    });
  }
};

//getall blogs
export const getAllBlogs = async (req, res) => {
  try {
    const [data] = await Blog.query(
      `SELECT blog_table.id , blog_table.title , blog_table.description , category_table.category_name AS category , user_table.name AS author , blog_table.tags ,GROUP_CONCAT(blog_image.image) AS images
      FROM blog_table
      INNER JOIN user_table ON blog_table.authorId = user_table.id
      INNER JOIN category_table ON blog_table.categoryId = category_table.id
      LEFT JOIN blog_image ON blog_table.id = blog_image.blog_id
      GROUP BY blog_table.id `
    );
    console.log(data);
    if (data.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No data found.",
      });
    }
    return res.status(200).json({
      status: true,
      message: "Blog Posts fetched successfully. ",
      total: data.length,
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

//get blogs by id
export const getBlogsById = async (req, res) => {
  try {
    const { id } = req.params;
    const authorId = req.user.id;

    const [authorCheck] = await Blog.query(
      `SELECT * FROM blog_table WHERE id=?`,
      [id]
    );
    if (authorId !== authorCheck[0].authorId) {
      return res.status(400).json({
        status: false,
        message: "You are not authorised to do this operation.",
      });
    }

    const [data] = await Blog.query(
      `SELECT blog_table.id , blog_table.title , blog_table.description , category_table.category_name AS category , user_table.name AS author , blog_table.tags ,GROUP_CONCAT(blog_image.image) AS images
      FROM blog_table
      INNER JOIN user_table ON blog_table.authorId = user_table.id
      INNER JOIN category_table ON blog_table.categoryId = category_table.id
      LEFT JOIN blog_image ON blog_table.id = blog_image.blog_id
      WHERE blog_table.id = ?
      GROUP BY blog_table.id `,
      [id]
    );

    if (data.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No data found.",
      });
    }
    return res.status(200).json({
      status: true,
      message: "Blog Post fetched by id successfully. ",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

//update blog
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, categoryId, tags, imagesToRemove } = req.body;
    const newImages = req.files;
    const authorId = req.user.id;

    //all fields are required
    if (!title || !description || !categoryId || !tags) {
      return res.status(400).json({
        status: false,
        message: "All fields are required.",
      });
    }

    const tagString = Array.isArray(tags) ? tags.join(",") : tags;

    //check data is available or not
    const [data] = await Blog.query(`SELECT * FROM blog_table WHERE id=?`, [
      id,
    ]);
    if (data.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No data found.",
      });
    }

    //check if the authorid is authenticated
    if (data[0].authorId !== authorId) {
      return res.status(400).json({
        status: false,
        message: "You are not authorised to edit this post.",
      });
    }

    //update data
    const [update] = await Blog.query(
      `UPDATE blog_table SET title=?, description=?, categoryId =? ,tags=? WHERE id =?`,
      [title, description, categoryId, tagString, id]
    );

    if (update.affectedRows === 0) {
      return res.status(400).json({
        status: false,
        message: "Error updating blog post",
      });
    }

    //remove selected images
    const imagesToDelete =
      typeof imagesToRemove === "string"
        ? JSON.parse(imagesToRemove)
        : imagesToRemove;

    if (imagesToDelete && imagesToDelete.length > 0) {
      for (let imagePath of imagesToDelete) {
        // delete from db
        await Blog.query(
          `DELETE FROM blog_image WHERE blog_id =? AND image=?`,
          [blog_id, imagePath]
        );

        // delete from filesystem
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        //path to  image
        const fullPath = path.join(
          __dirname,
          "..",
          "..",
          "uploads",
          "posts",
          imagePath
        );

        if (fs.existsSync(fullPath)) {
          fs.unlink(fullPath, (err) => {
            if (err) {
              console.log("Error deleting image.");
            } else {
              console.log("Image deleted successfully.");
            }
          });
        }
      }
    }

    //add new images
    if (newImages && newImages.length > 0) {
      for (let img of newImages) {
        const imagePath = img.path.replace(/\\/g, "/");
        await Blog.query(`INSERT INTO blog_image(image,id) VALUES(?,?)`, [
          imagePath,
          id,
        ]);
      }
    }

    return res.status(200).json({
      status: true,
      message: "Blog Post updated successfully. ",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

//delete blog
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const authorId = req.user.id;
    const [data] = await Blog.query(`SELECT * FROM blog_table WHERE id = ?`, [
      id,
    ]);

    if (data.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Data not found.",
      });
    }
    if (data[0].authorId !== authorId) {
      return res.status(400).json({
        status: false,
        message: "You are not authorised to delete this post.",
      });
    }
    const deleteBlog = await Blog.query(`DELETE FROM blog_table WHERE id = ?`, [
      id,
    ]);
    if (deleteBlog.affectedRows === 0) {
      return res.status(400).json({
        status: false,
        message: "Error occured while deleting data.",
      });
    }
    return res.status(200).json({
      status: true,
      message: "Blog Data deleted successfully. ",
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: error.message,
    });
  }
};
