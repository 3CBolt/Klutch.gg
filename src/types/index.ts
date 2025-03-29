/**
 * # EventConnect - Type Definitions
 * 
 * This file contains TypeScript interfaces for the core data models used in the EventConnect application.
 */

/**
 * User roles within the application
 */
export enum UserRole {
  ATTENDEE = 'attendee',
  PLANNER = 'planner',
  VENDOR = 'vendor',
  ADMIN = 'admin'
}

/**
 * Base user interface with common properties
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  location?: string;
  roles: UserRole[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Event categories
 */
export enum EventCategory {
  BUSINESS = 'business',
  TECHNOLOGY = 'technology',
  ENTERTAINMENT = 'entertainment',
  FOOD = 'food',
  SPORTS = 'sports',
  EDUCATION = 'education',
  NETWORKING = 'networking',
  OTHER = 'other'
}

/**
 * Event status
 */
export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

/**
 * Event interface
 */
export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  startDate: Date;
  endDate: Date;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    }
  };
  capacity: number;
  price?: number;
  images: string[];
  organizerId: string;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Registration status
 */
export enum RegistrationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  ATTENDED = 'attended'
}

/**
 * Event registration interface
 */
export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  ticketType?: string;
  ticketPrice?: number;
  purchaseDate: Date;
  checkInDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Vendor service categories
 */
export enum ServiceCategory {
  CATERING = 'catering',
  PHOTOGRAPHY = 'photography',
  VIDEOGRAPHY = 'videography',
  MUSIC = 'music',
  DECOR = 'decor',
  VENUE = 'venue',
  TRANSPORTATION = 'transportation',
  EQUIPMENT = 'equipment',
  OTHER = 'other'
}

/**
 * Vendor service interface
 */
export interface VendorService {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  category: ServiceCategory;
  pricing: {
    basePrice: number;
    unit: string; // e.g., "per hour", "per event", "per person"
  };
  images: string[];
  availability: {
    // Days of week available (0 = Sunday, 6 = Saturday)
    daysOfWeek: number[];
    // Custom date ranges when not available
    unavailableDates: {
      startDate: Date;
      endDate: Date;
      reason?: string;
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service request status
 */
export enum ServiceRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

/**
 * Service request interface
 */
export interface ServiceRequest {
  id: string;
  eventId: string;
  serviceId: string;
  plannerId: string;
  vendorId: string;
  status: ServiceRequestStatus;
  details: string;
  proposedPrice?: number;
  finalPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Connection status between users
 */
export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  BLOCKED = 'blocked'
}

/**
 * User connection interface
 */
export interface UserConnection {
  id: string;
  requesterId: string;
  receiverId: string;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Message interface for user communications
 */
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: Date;
}

/**
 * Notification types
 */
export enum NotificationType {
  EVENT_REMINDER = 'event_reminder',
  NEW_CONNECTION = 'new_connection',
  CONNECTION_ACCEPTED = 'connection_accepted',
  NEW_MESSAGE = 'new_message',
  EVENT_UPDATE = 'event_update',
  SERVICE_REQUEST = 'service_request',
  SERVICE_REQUEST_UPDATE = 'service_request_update'
}

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, any>; // Additional data specific to notification type
  createdAt: Date;
}

/**
 * Review interface for events and services
 */
export interface Review {
  id: string;
  authorId: string;
  targetType: 'event' | 'service';
  targetId: string;
  rating: number; // 1-5 stars
  content: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Report reason types
 */
export enum ReportReason {
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  FAKE_ACCOUNT = 'fake_account',
  SCAM = 'scam',
  OTHER = 'other'
}

/**
 * Report status
 */
export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

/**
 * Report interface for content moderation
 */
export interface Report {
  id: string;
  reporterId: string;
  targetType: 'user' | 'event' | 'review' | 'message';
  targetId: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}