import express from "express";
import { AuthCheck, RoleCheck } from "../middleware/Auth.js";
import { createCategory, DeleteCategoryById, getAllCategories, getCategoryById, updateCategoryById } from "../controller/CategoryController.js";


const router = express.Router();

router.post('/create-category',AuthCheck,RoleCheck(['admin']),createCategory)
router.get('/get-all-categories',AuthCheck,RoleCheck(['admin']),getAllCategories)
router.get('/get-category-by-id/:id',AuthCheck,RoleCheck(['admin']),getCategoryById)
router.put('/update-category/:id',AuthCheck,RoleCheck(['admin']),updateCategoryById)
router.delete('/delete-category/:id',AuthCheck,RoleCheck(['admin']),DeleteCategoryById)

export default router;
