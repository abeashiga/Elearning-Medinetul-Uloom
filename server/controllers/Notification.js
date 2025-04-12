import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import TryCatch from "../middlewares/TryCatch.js";
import mongoose from "mongoose";

export const createNotification = async (type, title, message, relatedId, excludeUserId = null) => {
  try {
    const users = await User.find({
      role: { $ne: "admin" },
      _id: { $ne: excludeUserId }
    });

    const notifications = users.map(user => ({
      recipient: user._id,
      type,
      title,
      message,
      relatedId,
      read: false
    }));

    await Notification.insertMany(notifications);
    return true;
  } catch (error) {
    console.error("Error creating notifications:", error);
    return false;
  }
};

export const getUserNotifications = TryCatch(async (req, res) => {
  if (!req.user) {
    return res.status(403).json({
      success: false,
      message: "Authentication required"
    });
  }

  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    success: true,
    notifications
  });
});

export const markNotificationAsRead = TryCatch(async (req, res) => {
  if (!req.user) {
    return res.status(403).json({
      success: false,
      message: "Authentication required"
    });
  }

  const { id } = req.params;

  // Validate if id is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid notification ID"
    });
  }

  const notification = await Notification.findOneAndUpdate(
    { 
      _id: id,
      recipient: req.user._id 
    },
    { read: true },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found"
    });
  }

  res.json({
    success: true,
    message: "Notification marked as read",
    notification
  });
});

export const markAllNotificationsAsRead = TryCatch(async (req, res) => {
  if (!req.user) {
    return res.status(403).json({
      success: false,
      message: "Authentication required"
    });
  }

  const result = await Notification.updateMany(
    { 
      recipient: req.user._id,
      read: false
    },
    { read: true }
  );

  res.json({
    success: true,
    message: "All notifications marked as read",
    modifiedCount: result.modifiedCount
  });
});

export const getNotifications = TryCatch(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({
    success: true,
    notifications
  });
});

export const clearReadNotifications = TryCatch(async (req, res) => {
  if (!req.user) {
    return res.status(403).json({
      success: false,
      message: "Authentication required"
    });
  }

  const result = await Notification.deleteMany({
    recipient: req.user._id,
    read: true
  });

  res.json({
    success: true,
    message: `Cleared ${result.deletedCount} read notifications`,
    deletedCount: result.deletedCount
  });
});

//export { clearReadNotifications };
