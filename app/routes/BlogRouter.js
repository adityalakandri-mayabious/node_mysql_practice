import express from "express";
import { createBlog, deleteBlog, getAllBlogs, getBlogsById, updateBlog,totalPostPerCategory } from "../controller/BlogController.js";
import { AuthCheck } from "../middleware/Auth.js";
import blogImage from "../helper/PostImage.js";

const router = express.Router();

router.post('/create-blog',AuthCheck,createBlog)
router.get('/get-all-blogs',AuthCheck,getAllBlogs)
router.get('/get-blog-by-id/:id',AuthCheck,getBlogsById)
router.put('/update-blog/:id',AuthCheck,blogImage,updateBlog)
router.delete('/delete-blog/:id',AuthCheck,deleteBlog)
router.get('/get-blog-by-category',AuthCheck,totalPostPerCategory)

export default router;
