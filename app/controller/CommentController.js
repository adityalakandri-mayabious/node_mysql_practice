import Blog from "../config/db.js";

export const createComment = async (req, res) => {
  try {
    const { comment } = req.body;
    const user_id = req.user.id;
    const { blogId } = req.params;
    if (!comment) {
      return res.status(400).json({
        status: false,
        message: "All fields are required.",
      });
    }
    const [blogExist] = await Blog.query(
      `SELECT id FROM blog_table WHERE id=? `,
      [blogId]
    );
    if (blogExist.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Blog does not exist.",
      });
    }

    const [inserComment] = await Blog.query(
      `INSERT INTO comment_table(blog_id,user_id,comment) VALUES(?,?,?)`,
      [blogId, user_id, comment]
    );
    const insertID = inserComment.insertId;
    if (!insertID) {
      return res.status(400).json({
        status: false,
        message: "Error occured while inserting data.",
      });
    }
    const [data] = await Blog.query(`SELECT * FROM comment_table WHERE id=?`, [
      insertID,
    ]);
    return res.status(200).json({
      status: true,
      message: "Commented on blog successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: error.message,
    });
  }
};

export const getCommentsByBlogID = async (req, res) => {
  try {
    const { blog_id } = req.params;

    const [blogExist] = await Blog.query(
      `SELECT id FROM blog_table WHERE id=?`,
      [blog_id]
    );
    if (blogExist.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Blog does not exist.",
      });
    }
    const [blogsWithComment] = await Blog.query(
      `SELECT blog_table.id,blog_table.title,blog_table.description,category_table.category_name AS category, user_table.name AS author,blog_table.tags as tags,comment_table.comment AS comments FROM blog_table 
        LEFT JOIN category_table ON blog_table.categoryId= category_table.id
        LEFT JOIN user_table ON blog_table.authorId = user_table.id
        LEFT JOIN comment_table ON blog_table.id = comment_table.blog_id WHERE blog_table.id=?`,

      [blog_id]
    );
    return res.status(200).json({
      status: true,
      message: "Data fetched successfully.",
      data: blogsWithComment,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const getCommentsPerBlog = async (req, res) => {
  try {
    const { blogId } = req.params;

    const [blogExist] = await Blog.query(
      `SELECT * FROM blog_table WHERE id = ?`,
      [blogId]
    );
    if (blogExist.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Blog does not exist.",
      });
    }
    const [data] = await Blog.query(
      `SELECT comment_table.id,user_table.name AS author,comment_table.comment,comment_table.created_at FROM comment_table 
            LEFT JOIN user_table ON comment_table.user_id = user_table.id
            WHERE comment_table.blog_id = ?
            ORDER BY comment_table.created_at ASC`,
      [blogId]
    );
    if (data.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No data found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Data fetched successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { blogId, commentId } = req.params;
    const [blogExist] = await Blog.query(
      `SELECT * FROM blog_table WHERE id=?`,
      [blogId]
    );
    if (blogExist.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Blog doesnot exist.",
      });
    }
    const [commentExist] = await Blog.query(
      `SELECT * FROM comment_table WHERE blog_id=? AND id=?`,
      [blogId, commentId]
    );
    if (commentExist.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Comment doesnot exist.",
      });
    }

    if (commentExist[0].user_id !== userId && req.user.role !== "admin") {
      return res.status(400).json({
        status: false,
        message: "You are not authorised to do this task",
      });
    }
    const [deleteComment] = await Blog.query(
      `DELETE FROM comment_table WHERE blog_id = ? AND id=?`,
      [blogId, commentId]
    );
    if (deleteComment.affectedRows === 0) {
      return res.status(400).json({
        status: false,
        message: "Error deleting comment.",
      });
    }
    return res.status(200).json({
      status: true,
      message: "Comment deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const replyToComment = async (req, res) => {
  try {
    const { comment, parent_comment_id } = req.body;
    const { blogId } = req.params;
    const  userId  = req.user.id;

    //blogexist
    const [blogExist] = await Blog.query(
      `SELECT id FROM blog_table WHERE id =?`,
      [blogId]
    );
    if (blogExist.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Blog does not exist.",
      });
    }
    //commentexist

    const [commentExist] = await Blog.query(
      `SELECT * FROM comment_table WHERE id =?`,
      [ parent_comment_id ]
    );
    if (commentExist.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Comment does not exist to reply.",
      });
    }
    const [insertReply] = await Blog.query(
      `INSERT INTO comment_table (blog_id,comment,user_id,parent_comment_id) VALUES(?,?,?,?)`,
      [blogId, comment, userId, parent_comment_id]
    );
    const insertID = insertReply.insertId;
    if (!insertID) {
      return res.status(400).json({
        status: false,
        message: "Error Replying to a comment.",
      });
    }
    return res.status(200).json({
      status: true,
      message: "Replied to the comment successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

