import express from "express";
import { isAdmin, isAuth } from "../middlewares/isAuth.js";
import {
  addLectures,
  createCourse,
  deleteCourse,
  deleteLecture,
  getAllStats,
  getAllUser,
  updateRole,
} from "../controllers/admin.js";
import { upload } from "../middlewares/multer.js";

const router = express.Router();

router.post("/course/new", isAuth, isAdmin, upload.single('image'), createCourse);
router.post("/lecture/:id", isAuth, isAdmin, upload.single('file'), addLectures);
router.delete("/course/:id", isAuth, isAdmin, deleteCourse);
router.delete("/lecture/:id", isAuth, isAdmin, deleteLecture);
router.put("/user/:id", isAuth, isAdmin, updateRole);
router.get("/users", isAuth, isAdmin, getAllUser);
router.get("/stats", isAuth, isAdmin, getAllStats);

export default router;
