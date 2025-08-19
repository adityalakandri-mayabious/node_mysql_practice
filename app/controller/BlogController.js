import Blog from "../config/db.js";

export const createBlog = async (req, res) => {
  try {
    const { title, description, categoryId = "9", tags } = req.body;
    if (!title || !description || !categoryId || !tags) {
      return res.status(400).json({
        status: false,
        message: "All fields are required.",
      });
    }
    const imagePath = req.file ? req.file.path.replace(/\\/g, "/") : null;
    const [insertedData] = await Blog.query(
      `INSERT INTO blog_table (title, description, categoryId, tags, image ) VALUES (?,?,?,?,?)`,
      [title, description, categoryId, tags, imagePath]
    );

    const insertId = insertedData.insertId;
    if (insertId === 0) {
      return res.status(400).json({
        status: false,
        message: "Error occured while inserting data",
      });
    }
    const [data] = await Blog.query(`SELECT * FROM blog_table WHERE id = ?`, [
      insertId,
    ]);

    return res.status(200).json({
      status: true,
      message: "Blog Created Successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
