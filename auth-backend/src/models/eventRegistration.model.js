import mongoose from "mongoose";

const teamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    usn: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50 // Assuming USN is like a student ID, adjust as needed
    }
  },
  { _id: false }
);

const eventRegistrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50 // Adjust based on expected ID length
    },

    eventTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 255
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20
    },

    collegeName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    usn: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },

    teamSize: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },

    teamMembers: [teamMemberSchema],

    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate registration (same email for same event)
eventRegistrationSchema.index(
  { email: 1, eventId: 1 },
  { unique: true }
);

// Additional indexes for query performance
eventRegistrationSchema.index({ eventId: 1 });
eventRegistrationSchema.index({ userId: 1 });
eventRegistrationSchema.index({ email: 1 });
// Compound indexes for frequent queries
eventRegistrationSchema.index({ eventId: 1, userId: 1 });
eventRegistrationSchema.index({ eventId: 1, email: 1 });

export default mongoose.model(
  "EventRegistration",
  eventRegistrationSchema
);