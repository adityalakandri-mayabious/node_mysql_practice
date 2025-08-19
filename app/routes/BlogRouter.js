import express from "express";
import { createBlog, deleteBlog, getAllBlogs, getBlogsById, updateBlog } from "../controller/BlogController.js";
import { AuthCheck } from "../middleware/Auth.js";

const router = express.Router();

router.post('/create-blog',AuthCheck,createBlog)
router.get('/get-all-blogs',AuthCheck,getAllBlogs)
router.get('/get-blog-by-id/:id',AuthCheck,getBlogsById)
router.put('/update-blog/:id',AuthCheck,updateBlog)
router.delete('/delete-blog/:id',AuthCheck,deleteBlog)

export default router;
