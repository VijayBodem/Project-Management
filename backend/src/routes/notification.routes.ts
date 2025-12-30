import { Router } from "express";
import { Notification } from "../models/Notification.model";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Get user's notifications
router.get("/", authenticate, async (req, res) => {
  try {
    const { unreadOnly, limit = 50 } = req.query;

    const filter: any = { user: req.user!.userId };
    if (unreadOnly === "true") {
      filter.read = false;
    }

    const notifications = await Notification.find(filter)
      .populate("actor", "name email")
      .populate("task", "title")
      .populate("project", "name")
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// Get unread count
router.get("/unread-count", authenticate, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user!.userId,
      read: false,
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Failed to get unread count" });
  }
});

// Mark notification as read
router.patch("/:notificationId/read", authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: req.user!.userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: "Failed to mark as read" });
  }
});

// Mark all as read
router.patch("/mark-all-read", authenticate, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user!.userId, read: false },
      { read: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark all as read" });
  }
});

// Delete notification
router.delete("/:notificationId", authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: req.user!.userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete notification" });
  }
});

// Clear all read notifications
router.delete("/clear-read", authenticate, async (req, res) => {
  try {
    await Notification.deleteMany({
      user: req.user!.userId,
      read: true,
    });

    res.json({ message: "Read notifications cleared" });
  } catch (error) {
    res.status(500).json({ message: "Failed to clear notifications" });
  }
});

export default router;
