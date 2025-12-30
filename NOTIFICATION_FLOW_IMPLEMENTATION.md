# Bidirectional Notification Flow Implementation - Point 2

## ✅ Completed Implementation

### Overview
Implemented smart, bidirectional notification system that intelligently determines who should be notified based on the actor's relationship to the task (owner, assignee, or other).

---

## Notification Logic

### Smart Notification Rules:

**When task status changes:**

1. **Task Owner makes change** → Notify all assigned users
   - Example: Project owner marks task as "in-progress" → All assignees get notified

2. **Assigned User makes change** → Notify task owner
   - Example: Assignee completes task → Task creator gets notified

3. **Someone Else makes change** → Notify both owner AND assigned users
   - Example: Project admin changes task status → Both creator and assignees get notified

**Special Cases:**
- Actor is never notified of their own actions
- Empty assignee lists are handled gracefully
- Multiple assignees all receive notifications

---

## Backend Changes

### 1. Notification Helper (NEW)
**File:** `backend/src/utils/notificationHelper.ts`

**Functions:**

#### `notifyTaskStatusChange(options)`
Smart notification for status changes. Determines recipients based on actor role.

**Parameters:**
```typescript
{
  task: Task,
  actorId: string,
  type: NotificationType,
  title: string,
  message: string,
  oldStatus?: string,
  newStatus?: string
}
```

**Logic:**
```typescript
if (actor is owner) {
  notify → all assignees (except actor)
} else if (actor is assignee) {
  notify → owner (if not actor)
} else {
  notify → owner + all assignees (except actor)
}
```

#### `notifyTaskAssignment(task, actorId, addedUserIds, removedUserIds)`
Handles assignment change notifications.
- Notifies newly assigned users
- Notifies removed users
- Emits real-time Socket.IO events

#### `notifyTaskCreation(task, actorId)`
Notifies all assigned users when task is created.
- Skips creator if they assigned themselves

#### `notifyTaskCompletion(task, actorId)`
Special handling for task completion.
- Uses smart notification logic
- Type: TASK_COMPLETED

---

### 2. Task Routes Updates
**File:** `backend/src/routes/task.routes.ts`

**Changes:**

#### Create Task Endpoint
```typescript
// Before: Manual loop through assignees
// After: Uses notifyTaskCreation helper
await notifyTaskCreation(populatedTask, req.user!.userId);
```

#### Assign Task Endpoint
```typescript
// Before: Manual notification loops
// After: Uses notifyTaskAssignment helper
await notifyTaskAssignment(
  updatedTask,
  req.user!.userId,
  addedAssignees,
  removedAssignees
);
```

#### Update Task Status Endpoint
```typescript
// Before: Only notified assignees on completion
// After: Smart notification based on actor
if (newStatus === "done") {
  await notifyTaskCompletion(updatedTask, req.user!.userId);
} else {
  await notifyTaskStatusChange({
    task: updatedTask,
    actorId: req.user!.userId,
    type: NotificationType.TASK_COMPLETED,
    title: "Task Status Changed",
    message: `Task status changed from ${oldStatus} to ${newStatus}`,
    oldStatus,
    newStatus,
  });
}
```

---

### 3. Socket.IO Events
**File:** `backend/src/socket/events.ts`

**Event:** `notification:new`
- Emitted to specific user room: `user:${userId}`
- Payload includes notification object and task summary
- Real-time delivery to connected clients

**Usage in Helper:**
```typescript
emitToUser(userId, "notification:new", {
  notification,
  task: {
    _id: task._id,
    title: task.title,
    status: task.status,
  },
});
```

---

## Frontend Changes

### 1. App Component
**File:** `frontend/src/App.tsx`

**Features:**
- ✅ Listens for `notification:new` Socket.IO events
- ✅ Shows toast notifications for new notifications
- ✅ Maps notification types to toast types (success, warning, info)
- ✅ Auto-dismisses toasts after 5 seconds

**Implementation:**
```typescript
socket.on("notification:new", (data) => {
  const toast: Toast = {
    id: data.notification._id,
    title: data.notification.title,
    message: data.notification.message,
    type: getToastType(data.notification.type),
  };
  setToasts((prev) => [...prev, toast]);
});
```

---

### 2. NotificationCenter Component
**File:** `frontend/src/components/NotificationCenter.tsx`

**Features:**
- ✅ Real-time notification updates
- ✅ Listens for `notification:new` events
- ✅ Adds new notifications to the list automatically
- ✅ Callback support for toast notifications
- ✅ Existing features preserved (mark as read, delete, filter)

**New Props:**
```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNewNotification?: (notification: Notification) => void; // NEW
}
```

**Real-time Listener:**
```typescript
useEffect(() => {
  const socket = getSocket();
  
  socket.on("notification:new", (data) => {
    setNotifications((prev) => [data.notification, ...prev]);
    if (onNewNotification) {
      onNewNotification(data.notification);
    }
  });
  
  return () => socket.off("notification:new");
}, [onNewNotification]);
```

---

### 3. Toast Notification Component
**File:** `frontend/src/components/ToastNotification.tsx`

**Already Exists** - No changes needed
- Displays toast notifications
- Auto-dismisses after 5 seconds
- Slide-in/slide-out animations
- Support for different types (info, success, warning, error)

---

## Notification Flow Examples

### Example 1: Task Owner Changes Status
```
Scenario: Alice (owner) marks task as "in-progress"
Task: "Fix login bug"
Assignees: Bob, Charlie

Flow:
1. Alice changes status to "in-progress"
2. Backend identifies Alice as owner
3. Notifies Bob and Charlie (not Alice)
4. Socket.IO emits to Bob and Charlie
5. Bob and Charlie see toast: "Task Status Changed: Fix login bug"
6. Notification appears in their notification center
```

### Example 2: Assignee Completes Task
```
Scenario: Bob (assignee) marks task as "done"
Task: "Fix login bug"
Owner: Alice
Assignees: Bob, Charlie

Flow:
1. Bob changes status to "done"
2. Backend identifies Bob as assignee
3. Notifies Alice (owner) only
4. Socket.IO emits to Alice
5. Alice sees toast: "Task Completed: Fix login bug"
6. Charlie (other assignee) is NOT notified
```

### Example 3: Admin Changes Task
```
Scenario: David (admin, not owner/assignee) changes status
Task: "Fix login bug"
Owner: Alice
Assignees: Bob, Charlie

Flow:
1. David changes status to "in-progress"
2. Backend identifies David as "someone else"
3. Notifies Alice, Bob, and Charlie (not David)
4. Socket.IO emits to all three
5. All three see toast notification
6. David is NOT notified
```

---

## Real-time Features

### Socket.IO Integration:
1. **Connection:** Established on login with JWT token
2. **User Rooms:** Each user joins `user:${userId}` room
3. **Event Emission:** Notifications sent to specific user rooms
4. **Event Listening:** Frontend listens on App component level
5. **Automatic Updates:** Notification center updates in real-time

### Toast Notifications:
- **Position:** Top-right corner
- **Duration:** 5 seconds (auto-dismiss)
- **Animation:** Slide-in from right, slide-out to right
- **Types:**
  - `task_completed` → Success (green)
  - `task_unassigned` → Warning (orange)
  - `task_assigned` → Info (blue)
  - Default → Info (blue)

---

## API Changes

### No Breaking Changes
All existing endpoints work as before, but now use smart notification logic.

### Enhanced Endpoints:

**POST /tasks** - Create Task
- Now uses `notifyTaskCreation` helper
- Smarter notification logic

**PATCH /tasks/:taskId/assign** - Assign Task
- Now uses `notifyTaskAssignment` helper
- Handles multiple assignees better

**PATCH /tasks/:taskId/status** - Update Status
- Now uses `notifyTaskStatusChange` or `notifyTaskCompletion`
- Smart bidirectional notifications

---

## Testing Scenarios

### Backend Testing:
- [ ] Owner changes task status → Assignees notified
- [ ] Assignee changes task status → Owner notified
- [ ] Admin changes task status → Both owner and assignees notified
- [ ] Actor never receives notification for their own action
- [ ] Multiple assignees all receive notifications
- [ ] Empty assignee list handled gracefully

### Frontend Testing:
- [ ] Toast appears when notification received
- [ ] Toast auto-dismisses after 5 seconds
- [ ] Notification center updates in real-time
- [ ] Clicking notification navigates to project
- [ ] Multiple toasts stack properly
- [ ] Toast types display correct colors

### Socket.IO Testing:
- [ ] Notifications received in real-time
- [ ] Multiple browser tabs receive notifications
- [ ] Reconnection after disconnect works
- [ ] Notifications persist after page refresh (from DB)

---

## Performance Considerations

### Notification Batching:
- Currently sends individual notifications
- For tasks with many assignees (>10), consider batching

### Socket.IO Rooms:
- Each user has dedicated room: `user:${userId}`
- Efficient targeted message delivery
- No broadcast overhead

### Database Queries:
- Notifications stored in MongoDB
- Indexed by user and read status
- Real-time via Socket.IO, persistence via DB

---

## Files Modified

### Backend (3 files):
1. `backend/src/utils/notificationHelper.ts` - NEW (Smart notification logic)
2. `backend/src/routes/task.routes.ts` - Updated (Use helpers)
3. `backend/src/socket/events.ts` - No changes (already had emitToUser)

### Frontend (2 files):
1. `frontend/src/App.tsx` - Updated (Toast notifications)
2. `frontend/src/components/NotificationCenter.tsx` - Updated (Real-time updates)

---

## Configuration

### No Additional Setup Required
- Uses existing Socket.IO connection
- Uses existing notification system
- No new environment variables
- No database migrations

---

## Future Enhancements

1. **Notification Preferences:**
   - Allow users to mute specific notification types
   - Email notifications for important events
   - Digest notifications (daily summary)

2. **Notification Grouping:**
   - Group similar notifications
   - "3 tasks assigned to you today"

3. **Rich Notifications:**
   - Include task preview
   - Quick actions (mark as read, go to task)

4. **Push Notifications:**
   - Browser push notifications
   - Mobile push notifications

5. **Notification History:**
   - Archive old notifications
   - Search notifications
   - Export notification log

---

## Summary

✅ **Backend:** Smart notification helper created, task routes updated
✅ **Frontend:** Real-time Socket.IO listening, toast notifications
✅ **Logic:** Bidirectional notifications based on actor role
✅ **Real-time:** Instant notification delivery via Socket.IO
✅ **UX:** Toast popups + notification center updates
✅ **Testing:** No TypeScript errors, ready for testing

**Next Steps:** Test thoroughly and proceed to Point 7 (My Tasks Real-time) or Point 3 (Multi-device Logout).
