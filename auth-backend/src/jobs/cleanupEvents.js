import Event from "../models/event.model.js";

/**
 * Non-destructive lifecycle sync for events.
 * Automatically marks events whose date has passed as "past".
 * NEVER deletes events or student registrations.
 */
const syncEventLifecycle = async () => {
  try {
    const now = new Date();

    // Transition upcoming events whose event date has passed to "past"
    const result = await Event.updateMany(
      {
        type: "upcoming",
        date: { $lt: now }
      },
      {
        $set: { type: "past" }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[Lifecycle Sync] Marked ${result.modifiedCount} event(s) as past.`);
    }
  } catch (error) {
    console.error("Error in syncEventLifecycle:", error);
  }
};

// Run lifecycle sync every 5 minutes (300,000 ms)
export const startCleanupJob = () => {
  setInterval(syncEventLifecycle, 300000);

  // Also run once on startup
  syncEventLifecycle();
};
