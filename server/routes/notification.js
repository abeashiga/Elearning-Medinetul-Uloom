import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearReadNotifications,
} from "../controllers/Notification.js";

const router = express.Router();

// Get all notifications
router.get("/notifications", isAuth, getUserNotifications);

// Mark single notification as read
router.put("/notifications/:id", isAuth, markNotificationAsRead);

// Mark all notifications as read
router.put("/notifications/mark-all-read", isAuth, markAllNotificationsAsRead);

// Clear read notifications
router.delete("/notifications/clear-read", isAuth, clearReadNotifications);

export default router;
