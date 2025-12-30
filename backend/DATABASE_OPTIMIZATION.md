# Database Optimization - SkillForge

This document outlines the database optimizations implemented in the SkillForge application.

## 1. Database Indexes

### User Model
- **email**: Unique index for fast login queries
- **refreshTokens**: Index for token validation
- **createdAt**: Index for sorting by registration date
- **lockUntil**: Sparse index for account locking queries

### Project Model
- **members.user**: Index for member lookup
- **createdBy**: Index for creator lookup
- **isDeleted**: Index to exclude deleted projects
- **createdAt**: Index for sorting by creation date
- **name**: Text index for project name search
- **Compound**: `members.user + isDeleted` for member queries

### Task Model
- **project + status**: Compound index for filtering
- **project + assignedTo**: Compound index for assignment queries
- **assignedTo + status**: Index for "My Tasks" queries
- **project + isDeleted**: Exclude deleted tasks
- **dueDate**: Sparse index for due date queries
- **createdAt**: Index for sorting
- **priority**: Index for priority filtering
- **Compound**: `project + status + assignedTo` for complex queries

### Comment Model
- **task + createdAt**: Index for task comments
- **user + createdAt**: Index for user's comments
- **task + isDeleted**: Exclude deleted comments

### Activity Model
- **task + createdAt**: Index for task activity
- **user + createdAt**: Index for user activity
- **type + createdAt**: Index for activity type queries

### Notification Model
- **user + read + createdAt**: Compound index for unread notifications
- **user + createdAt**: Index for user's notifications

## 2. Soft Delete Implementation

### Why Soft Delete?
- **Data Recovery**: Accidentally deleted items can be restored
- **Audit Trail**: Maintain history of deletions
- **Referential Integrity**: Avoid breaking relationships
- **Analytics**: Include deleted items in historical reports

### Models with Soft Delete
- **Project**: `isDeleted`, `deletedAt`, `deletedBy`
- **Task**: `isDeleted`, `deletedAt`, `deletedBy`
- **Comment**: `isDeleted`, `deletedAt`

### Implementation
```typescript
// Soft delete middleware
schema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});
```

### Usage
```typescript
// Normal query (excludes deleted)
await Task.find({ project: projectId });

// Include deleted items
await Task.find({ project: projectId }).setOptions({ includeDeleted: true });

// Soft delete
await Task.findByIdAndUpdate(taskId, {
  isDeleted: true,
  deletedAt: new Date(),
  deletedBy: userId,
});

// Restore
await Task.findByIdAndUpdate(taskId, {
  isDeleted: false,
  $unset: { deletedAt: 1, deletedBy: 1 },
});
```

## 3. Pagination

### Implementation
Pagination utility in `backend/src/utils/pagination.ts`:
- Extract pagination params from request
- Calculate skip and limit
- Build sort object
- Execute count and find in parallel
- Return paginated result with metadata

### Parameters
- **page**: Page number (default: 1)
- **limit**: Items per page (default: 20, max: 100)
- **sortBy**: Field to sort by (default: "createdAt")
- **sortOrder**: Sort direction "asc" or "desc" (default: "desc")

### Response Format
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Endpoints with Pagination
- `GET /api/tasks/project/:projectId` - Project tasks
- `GET /api/tasks/my-tasks` - User's assigned tasks
- `GET /api/projects/dashboard/overview` - Dashboard projects

## 4. Query Optimization

### Populate References
All queries now populate related documents:
```typescript
.populate("assignedTo", "name email avatar")
.populate("createdBy", "name email avatar")
.populate("project", "name")
```

### Lean Queries
Use `.lean()` for read-only queries to improve performance:
```typescript
Task.find(filter).lean() // Returns plain JavaScript objects
```

### Parallel Queries
Execute independent queries in parallel:
```typescript
const [total, tasks] = await Promise.all([
  Task.countDocuments(filter),
  Task.find(filter).skip(skip).limit(limit),
]);
```

### Projection
Select only needed fields:
```typescript
User.findById(userId).select("name email avatar")
```

## 5. Performance Best Practices

### Index Usage
- Always query on indexed fields
- Use compound indexes for multi-field queries
- Monitor slow queries with MongoDB profiler

### Query Patterns
```typescript
// Good: Uses index
Task.find({ project: projectId, status: "todo" })

// Bad: Full collection scan
Task.find({ title: /search/i })

// Better: Use text index
Task.find({ $text: { $search: "search term" } })
```

### Avoid N+1 Queries
```typescript
// Bad: N+1 queries
const tasks = await Task.find({ project: projectId });
for (const task of tasks) {
  task.assignedTo = await User.findById(task.assignedTo);
}

// Good: Single query with populate
const tasks = await Task.find({ project: projectId })
  .populate("assignedTo");
```

### Limit Result Sets
- Always use pagination for lists
- Set maximum limit (100 items)
- Use skip and limit efficiently

## 6. Monitoring and Maintenance

### Index Statistics
```javascript
// Check index usage
db.tasks.aggregate([{ $indexStats: {} }])

// Explain query plan
db.tasks.find({ project: "..." }).explain("executionStats")
```

### Slow Query Log
Enable MongoDB profiling:
```javascript
// Profile slow queries (>100ms)
db.setProfilingLevel(1, { slowms: 100 })

// View slow queries
db.system.profile.find().sort({ ts: -1 }).limit(10)
```

### Index Maintenance
```javascript
// Rebuild indexes
db.tasks.reIndex()

// Drop unused indexes
db.tasks.dropIndex("indexName")
```

## 7. Database Size Management

### Soft Delete Cleanup
Periodically hard delete old soft-deleted items:
```typescript
// Delete items soft-deleted more than 30 days ago
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
await Task.deleteMany({
  isDeleted: true,
  deletedAt: { $lt: thirtyDaysAgo }
});
```

### Archive Old Data
Move old completed tasks to archive collection:
```typescript
// Archive tasks completed more than 1 year ago
const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
const oldTasks = await Task.find({
  status: "done",
  updatedAt: { $lt: oneYearAgo }
});
// Move to archive collection
```

## 8. Caching Strategy

### Redis Caching (Future Enhancement)
- Cache frequently accessed data
- Cache user sessions
- Cache project member lists
- Cache dashboard statistics

### Application-Level Caching
```typescript
// Cache project members for 5 minutes
const cacheKey = `project:${projectId}:members`;
let members = cache.get(cacheKey);
if (!members) {
  members = await getProjectMembers(projectId);
  cache.set(cacheKey, members, 300); // 5 minutes
}
```

## 9. Database Connection Optimization

### Connection Pooling
```typescript
mongoose.connect(mongoUri, {
  maxPoolSize: 10,
  minPoolSize: 2,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
});
```

### Connection Events
```typescript
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});
```

## 10. Performance Metrics

### Expected Query Times
- User login: < 50ms
- Project list: < 100ms
- Task list (paginated): < 150ms
- Task creation: < 100ms
- Search queries: < 200ms

### Optimization Checklist
- [x] Indexes on all frequently queried fields
- [x] Compound indexes for multi-field queries
- [x] Soft delete implementation
- [x] Pagination for all list endpoints
- [x] Populate references efficiently
- [x] Use lean() for read-only queries
- [x] Parallel query execution
- [x] Field projection
- [x] Query result limits
- [x] Text indexes for search

## 11. Future Enhancements

1. **Aggregation Pipeline**: Complex analytics queries
2. **Read Replicas**: Distribute read load
3. **Sharding**: Horizontal scaling for large datasets
4. **Time-Series Collections**: For activity logs
5. **Full-Text Search**: Elasticsearch integration
6. **Materialized Views**: Pre-computed statistics
7. **Query Result Caching**: Redis integration
8. **Database Monitoring**: New Relic or Datadog
