import Blog from "../config/db.js";

export const insertBlogImage = async (req, res) => {
  try {
    const { blog_id } = req.body;
    const userId = req.user.id;
    const files = req.files; // multer stores uploaded files here

    if (!blog_id || !files || files.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Blog ID and at least one image are required.",
      });
    }

    // Check if the blog exists
    const [isExist] = await Blog.query(
      `SELECT id FROM blog_table WHERE id = ?`,
      [blog_id]
    );
    if (isExist.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Blog does not exist.",
      });
    }
    const [getUserId] = await Blog.query(
      `SELECT user_table.id AS user_id FROM blog_table INNER JOIN user_table ON  blog_table.authorId  = user_table.id WHERE blog_table.id=?`,
      [blog_id]
    );
    console.log(getUserId[0]);

    if (getUserId[0].user_id !== userId) {
      return res.status(400).json({
        status: false,
        message: "You are not authorised to do this operation.",
      });
    }
    const savedImages = [];
    // Loop through each file and insert into blog_image
    for (let file of files) {
      const imagePath = file.path.replace(/\\/g, "/"); // or use file.path if you want full path
      await Blog.query(
        `INSERT INTO blog_image (blog_id, image) VALUES (?, ?)`,
        [blog_id, imagePath]
      );
      savedImages.push(imagePath);
    }

    return res.status(200).json({
      status: true,
      message: "Blog images inserted successfully.",
      data: savedImages,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
