import mongoose from "mongoose";
import * as service from "../services/patrol.service.js";
import * as repo from "../repositories/patrol.repository.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notifyRangerAssignment } from "../services/notification.service.js";
import User from "../models/User.js";

// Construct search filters based on query parameters
const buildPatrolQuery = (queryParams) => {
    const { protectedAreaId, from, to, rangerId, status } = queryParams;
    const query = {};

    if (protectedAreaId) {
        query.protectedAreaId = new mongoose.Types.ObjectId(protectedAreaId);
    }

    if (rangerId) {
        query.assignedRangerIds = new mongoose.Types.ObjectId(rangerId);
    }

    if (status) query.status = status;

    if (queryParams.zoneIds) {
        const zoneIds = Array.isArray(queryParams.zoneIds) ? queryParams.zoneIds : queryParams.zoneIds.split(",");
        query.zoneIds = { $in: zoneIds.map(id => new mongoose.Types.ObjectId(id.trim())) };
    }

    if (from || to) {
        query.plannedStart = {};
        if (from) query.plannedStart.$gte = new Date(from);
        if (to) query.plannedStart.$lte = new Date(to);
    }

    return query;
};

// Create a new patrol mission, optionally inherited from an alert
export const createPatrol = asyncHandler(async (req, res) => {
    const { alertId, ...patrolData } = req.body;

    // If alertId is provided, inherit data
    if (alertId && mongoose.Types.ObjectId.isValid(alertId)) {
        try {
            const Alert = (await import("../models/Alert.js")).default;
            const alert = await Alert.findById(alertId).lean();

            if (alert) {
                // Inherit basic details from Alert
                patrolData.title = alert.description;
                patrolData.protectedAreaId = alert.protectedAreaId;
                if (alert.zoneId && !patrolData.zoneIds?.includes(alert.zoneId)) {
                    patrolData.zoneIds = [...(patrolData.zoneIds || []), alert.zoneId];
                }

                // Inherit location directly from Alert
                if (alert.location && alert.location.lat && alert.location.lng) {
                    patrolData.exactLocation = alert.location;
                } else {
                    // Fallback for legacy alerts: Use Zone coordinates
                    try {
                        const Zone = (await import("../models/Zone.model.js")).default;
                        const zone = await Zone.findById(alert.zoneId).lean();
                        if (zone && zone.geometry?.coordinates?.[0]?.[0]) {
                            const [lng, lat] = zone.geometry.coordinates[0][0];
                            patrolData.exactLocation = { lat, lng };
                        }
                    } catch (err) {
                        console.error("Failed legacy location fallback:", err);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to automate patrol data inheritance:", error);
        }
    }

    const patrol = await service.createPatrol(patrolData);

    // If created from an alert, link them (existing logic)
    if (alertId && mongoose.Types.ObjectId.isValid(alertId)) {
        try {
            const { linkPatrolToAlert } = await import("../services/alert.service.js");
            await linkPatrolToAlert(alertId, patrol._id);
        } catch (error) {
            console.error("Failed to link alert to patrol:", error);
        }
    }

    res.status(201).json({ message: "Patrol created successfully", patrol });

    // ── WhatsApp Notifications ──
    try {
        if (patrolData.assignedRangerIds?.length > 0) {
            const rangers = await User.find({ _id: { $in: patrolData.assignedRangerIds } }).lean();
            if (rangers?.length > 0) {
                // This calls the unified service (Twilio if SID exists, always MQTT)
                await notifyRangerAssignment(patrol, rangers);
            }
        }
    } catch (notifError) {
        console.error("Notification flow failed (non-blocking):", notifError);
    }
});

// Fetch all patrols matching filters with pagination
export const getPatrols = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sort = { plannedStart: -1 };

    const query = buildPatrolQuery(req.query);
    const skip = (page - 1) * limit;

    const [total, patrols] = await Promise.all([
        repo.count(query),
        repo.findWithPagination(query, sort, skip, limit)
    ]);

    res.json({
        data: patrols,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit) || 1
        }
    });
});

// Get full details of a specific patrol by ID
export const getPatrolById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error("Invalid patrol id");
        error.statusCode = 400;
        throw error;
    }

    const patrol = await repo.findById(id);
    if (!patrol) {
        const error = new Error("Patrol not found");
        error.statusCode = 404;
        throw error;
    }

    res.json({ patrol });
});

// Update patrol details or status
export const updatePatrol = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error("Invalid patrol id");
        error.statusCode = 400;
        throw error;
    }

    const patrol = await service.updatePatrol(id, req.body);
    res.json({ message: "Patrol updated successfully", patrol });
});

// Permanently remove a patrol record
export const deletePatrol = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error("Invalid patrol id");
        error.statusCode = 400;
        throw error;
    }

    const patrol = await service.deletePatrol(id);
    res.json({
        message: "Patrol deleted successfully",
        patrol
    });
});

// Register a new ranger check-in for a patrol
export const addCheckIn = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error("Invalid patrol id");
        error.statusCode = 400;
        throw error;
    }

    const patrol = await service.addCheckIn(id, req.body);
    res.status(201).json({ message: "Check-in added successfully", patrol });
});

// Retrieve all check-in logs for a specific patrol
export const getCheckIns = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error("Invalid patrol id");
        error.statusCode = 400;
        throw error;
    }

    const result = await repo.getCheckIns(id, skip, limit);
    if (!result) {
        const error = new Error("Patrol not found");
        error.statusCode = 404;
        throw error;
    }

    res.json({
        data: result.checkIns,
        pagination: {
            total: result.total,
            page,
            limit,
            pages: Math.ceil(result.total / limit) || 1
        }
    });
});

// Modify an existing check-in log
export const updateCheckIn = asyncHandler(async (req, res) => {
    const { id, checkInId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(checkInId)) {
        const error = new Error("Invalid patrol or check-in id");
        error.statusCode = 400;
        throw error;
    }

    const patrol = await service.updateCheckIn(id, checkInId, req.body);
    res.json({ message: "Check-in updated successfully", patrol });
});

// Remove a specific check-in record
export const deleteCheckIn = asyncHandler(async (req, res) => {
    const { id, checkInId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(checkInId)) {
        const error = new Error("Invalid patrol or check-in id");
        error.statusCode = 400;
        throw error;
    }

    const patrol = await service.deleteCheckIn(id, checkInId);
    res.json({ message: "Check-in deleted successfully", patrol });
});
