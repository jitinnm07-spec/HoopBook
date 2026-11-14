# Admin CRUD – what to wire up

The updated pages call these `db` methods (in `src/utils/storage.js`).
Your upload already had: addCourt, addSlot, updateSlot, updateRequest, updatePayment, hydrateAdmin.
**You need to add these 5:**

| db method              | Suggested API route (adjust to your backend) |
|------------------------|----------------------------------------------|
| db.updateCourt(id, patch) | PUT/PATCH  /api/courts/:id    |
| db.deleteCourt(id)        | DELETE     /api/courts/:id    |
| db.deleteSlot(id)         | DELETE     /api/slots/:id     |
| db.deleteRequest(id)      | DELETE     /api/requests/:id  |
| db.deletePayment(id)      | DELETE     /api/payments/:id  |

Each should `await` the fetch, throw `new Error(message)` on a non-OK response
(the pages show that message in a red banner), and send the same auth header as your other admin calls.

## Backend must enforce (don't rely on the UI)
- Every route above requires an **admin** token, checked server-side.
- Deleting a court: delete or block its slots (the UI warns, the server decides).
- Deleting a slot: remove/mark its linked requests.
- Deleting a request: also remove it from `slot.booked` and delete its payment.
- Validate/sanitize input again on the server.
