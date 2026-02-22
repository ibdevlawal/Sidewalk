import { Schema, model, type HydratedDocument } from "mongoose";

const REPORT_STATUSES = [
  "PENDING",
  "ACKNOWLEDGED",
  "RESOLVED",
  "REJECTED",
  "ESCALATED",
] as const;

const REPORT_CATEGORIES = [
  "INFRASTRUCTURE",
  "SANITATION",
  "SAFETY",
  "UTILITIES",
  "TRAFFIC",
  "OTHER",
] as const;

const stripHtml = (value: string): string => value.replace(/<[^>]*>/g, "").trim();

export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export type GeoPoint = {
  type: "Point";
  coordinates: [number, number];
};

export interface Report {
  title: string;
  description: string;
  status: ReportStatus;
  category: ReportCategory;
  location: GeoPoint;
  stellar_tx_hash: string | null;
  media_urls: string[];
  snapshot_hash: string | null;
}

const reportSchema = new Schema<Report>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      set: stripHtml,
      minlength: 3,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      set: stripHtml,
      minlength: 5,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: "PENDING",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: REPORT_CATEGORIES,
      required: true,
      index: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (coordinates: number[]) => {
            if (!Array.isArray(coordinates) || coordinates.length !== 2) {
              return false;
            }
            const [lng, lat] = coordinates;
            return (
              Number.isFinite(lng) &&
              Number.isFinite(lat) &&
              lng >= -180 &&
              lng <= 180 &&
              lat >= -90 &&
              lat <= 90
            );
          },
          message: "location.coordinates must be [lng, lat] with valid ranges",
        },
      },
    },
    stellar_tx_hash: {
      type: String,
      default: null,
      index: true,
    },
    media_urls: {
      type: [String],
      default: [],
    },
    snapshot_hash: {
      type: String,
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

reportSchema.index({ location: "2dsphere" });
reportSchema.index({ status: 1, createdAt: -1 });

export type ReportDocument = HydratedDocument<Report>;

export const ReportModel = model<Report>("Report", reportSchema);
