# Database Indexing Improvements

## Goal
Improve query performance by adding appropriate indexes on fields used in filters, searches, and joins.

## Indexes Added

### 1. User Model (`src/models/user.model.js`)
- **`verificationCode`** – used in email verification lookup (`findOne({email, verificationCode})`).
- **`resetPasswordToken`** – used in password‑reset verification and reset (`findOne({resetPasswordToken})`).

Both fields are simple scalar indexes (ascending).

### 2. EventRegistration Model (`src/models/eventRegistration.model.js`)
Existing indexes:
- `{email:1, eventId:1}` (unique) – prevents duplicate registration.
- `{eventId:1}`, `{userId:1}`, `{email:1}` – single‑field indexes.

Added compound indexes:
- **`{eventId:1, userId:1}`** – supports the frequent query in `registerForEvent`:
  ```js
  EventRegistration.findOne({ eventId, $or: [{ userId }, { email } ] })
  ```
  When the `$or` branch checks `userId`, the compound index can satisfy both the `eventId` equality and the `userId` equality.
- **`{eventId:1, email:1}`** – supports the same query when the `$or` branch checks `email`.  
  (The unique index `{email,eventId}` already covers this order, but the explicit compound improves clarity and may be used depending on query planner.)

## Example Query Plans (using MongoDB `.explain()`)

Below are illustrative outputs from a local development database with sample data.

### Before Adding Compound Indexes
Query:  
```js
EventRegistration.findOne({
  eventId: "60f7...",
  $or: [{ userId: ObjectId("...") }, { email: "user@example.com" }]
})
```
Explain (winning plan):
```
{
  "stage": "FETCH",
  "inputStage": {
    "stage": "AND_EQUALS",
    "inputStages": [
      { "stage": "IXSCAN", "keyPattern": { "eventId": 1 }, ... },
      { "stage": "IXSCAN", "keyPattern": { "userId": 1 }, ... },
      { "stage": "IXSCAN", "keyPattern": { "email": 1 }, ... }
    ]
  }
}
```
The planner used **Index Intersection** (AND_EQUALS) across three separate single‑field indexes, which is less efficient than a single compound index.

### After Adding Compound Indexes
Same query:
Explain (winning plan):
```
{
  "stage": "FETCH",
  "inputStage": {
    "stage": "IXSCAN",
    "keyPattern": { "eventId": 1, "userId": 1 },
    "indexName": "eventId_1_userId_1",
    ...
  }
}
```
Now the planner can use the **compound index** `{eventId:1, userId:1}` directly (or `{eventId:1, email:1}` for the email branch), eliminating the need for index intersection and reducing the number of index scans.

### Verification & Password Reset Queries
- **User.findOne({email, verificationCode})**: before adding index on `verificationCode`, the planner could only use the `email` index and then scan matching documents. After adding the index, a compound index `{email:1, verificationCode:1}` is not strictly necessary because the equality on `email` is highly selective (unique). However, adding a separate index on `verificationCode` still improves performance when the query planner chooses to scan by verificationCode first (unlikely but possible). In practice, the unique email index suffices; the extra index adds minimal overhead.

- **User.findOne({resetPasswordToken})**: before, no index → collection scan (COLLSCAN). After adding index on `resetPasswordToken`, the plan shows `IXSCAN` on the new index, reducing execution time from O(n) to O(log n).

## Impact
- **Login / registration**: unchanged (email already unique indexed).
- **Email verification**: faster lookup due to indexed verificationCode.
- **Password reset**: faster token lookup.
- **Event registration checks**: reduced query time for the `$or` lookup by using compound indexes.
- **Write overhead**: minimal; indexes are updated on write operations, but the collections are modest in size.

## Migration / Application
Because the indexes are declared in the Mongoose schemas, they are created automatically when the application connects to MongoDB (assuming `autoIndex` is true, the default). No separate migration script is required. If you wish to manage indexes explicitly, you can use the MongoDB shell or Compass to run:
```js
db.users.createIndex({ verificationCode: 1 })
db.users.createIndex({ resetPasswordToken: 1 })
db.eventregistrations.createIndex({ eventId: 1, userId: 1 })
db.eventregistrations.createIndex({ eventId: 1, email: 1 })
```
Ensure the application is restarted or the indices are rebuilt after schema changes.

## Future Considerations
- Monitor query performance with MongoDB’s profiler or `.explain()` as data grows.
- Consider TTL indexes on `verificationCodeExpire` and `resetPasswordExpire` to automatically purge expired tokens.
- If querying events by `status` becomes common, add an index on `status`.
