import express from 'express';
import { AuthCheck } from '../middleware/Auth.js';
import blogImage from '../helper/PostImage.js';
import { insertBlogImage } from '../controller/BlogImageController.js';


const router = express.Router();

router.post('/insert-blog-image',AuthCheck,blogImage,insertBlogImage);

export default router;