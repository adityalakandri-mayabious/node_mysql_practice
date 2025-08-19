import Blog from "../config/db.js";

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
    const [data] = await Blog.query(`SELECT * FROM blog_table`);
    if (data.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No data found.",
      });
    }
    return res.status(200).json({
      status: true,
      message: "Blog Posts fetched successfully. ",
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
    const [data] = await Blog.query(`SELECT * FROM blog_table WHERE id=?`, [
      id,
    ]);
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
    const { title, description, categoryId, tags } = req.body;
    const authorId = req.user.id;

    if (!title || !description || !categoryId || !tags) {
      return res.status(400).json({
        status: false,
        message: "All fields are required.",
      });
    }

    const tagString = Array.isArray(tags) ? tags.join(",") : tags;

    const [data] = await Blog.query(`SELECT * FROM blog_table WHERE id=?`, [
      id,
    ]);
    if (data.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No data found.",
      });
    }
    const [update] = await Blog.query(
      `UPDATE blog_table SET title=?, description=?, categoryId =? ,tags=? WHERE id =?`,
      [title, description, categoryId, tagString, id]
    );
    if (data[0].authorId !== authorId) {
      return res.status(400).json({
        status: false,
        message: "You are not authorised to edit this post.",
      });
    }
    if (update.affectedRows === 0) {
      return res.status(400).json({
        status: true,
        message: "Error updating blog post",
      });
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
