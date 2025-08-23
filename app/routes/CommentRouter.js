import express from "express";
import { AuthCheck } from "../middleware/Auth.js";
import {
  createComment,
  getCommentsByBlogID,
  getCommentsPerBlog,
  deleteComment,
  replyToComment
} from "../controller/CommentController.js";
const router = express.Router();

router.post("/create-comment/:blogId", AuthCheck, createComment);
router.get("/getCommentsWithData/:blog_id", AuthCheck, getCommentsByBlogID);
router.get("/getCommentsPerBlog/:blogId", AuthCheck, getCommentsPerBlog);
router.delete("/delete-comment/:blogId/:commentId", AuthCheck, deleteComment);
router.post("/reply-comment/:blogId", AuthCheck, replyToComment);

export default router;
