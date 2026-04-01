import * as alertRepo from "../repositories/alert.repository.js";

// Trigger an alert for animal movement into a high-risk zone
export const triggerMovementAlert = async (movement, zone) => {
    let paName = "Unknown Protected Area";
    let animalSpecies = "Unknown Species";

    try {
        const ProtectedArea = (await import("../models/ProtectedArea.model.js")).default;
        const Animal = (await import("../models/Animal.js")).default;

        const [pa, animal] = await Promise.all([
            ProtectedArea.findById(movement.protectedAreaId).lean(),
            Animal.findOne({ tagId: movement.tagId }).lean()
        ]);

        if (pa) paName = pa.name;
        if (animal) animalSpecies = animal.species;
    } catch (error) {
        console.error("Failed to fetch Protected Area or Animal details for alert:", error);
    }

    // Determine severity - CORE zones are CRITICAL, others are HIGH
    const severity = zone.zoneType === "CORE" ? "CRITICAL" : "HIGH";

    // User requested format: ID (Species) has entered a Severity risk zone in PA Zone
    const message = `${movement.tagId} (${animalSpecies}) has entered a ${severity.toLowerCase()} risk zone in ${paName} ${zone.name}`;

    const alertData = {
        type: "MOVEMENT",
        severity,
        description: message,
        relatedId: movement._id,
        protectedAreaId: movement.protectedAreaId,
        protectedAreaName: paName,
        zoneId: movement.zoneId,
        zoneName: zone.name,
        location: {
            lat: movement.lat,
            lng: movement.lng
        }
    };

    return alertRepo.create(alertData);
};

// Trigger an alert for a reported poaching incident
export const triggerIncidentAlert = async (incident, zoneName) => {
    let paName = "Unknown Protected Area";
    let location = null;

    try {
        const ProtectedArea = (await import("../models/ProtectedArea.model.js")).default;
        const Zone = (await import("../models/Zone.model.js")).default;

        const [pa, zone] = await Promise.all([
            ProtectedArea.findById(incident.protectedAreaId).lean(),
            Zone.findById(incident.zoneId).lean()
        ]);

        if (pa) paName = pa.name;

        // Use Zone geometry as fallback location for incident alerts
        if (zone && zone.geometry?.coordinates?.[0]?.[0]) {
            const [lng, lat] = zone.geometry.coordinates[0][0];
            location = { lat, lng };
        }
    } catch (error) {
        console.error("Failed to fetch Protected Area or Zone details for incident alert:", error);
    }

    // Format: [Park Name] CRITICAL: [Type] in [Zone] - [Description]
    const message = `[${paName}] CRITICAL: ${incident.type} in "${zoneName}" - ${incident.description}`;

    const alertData = {
        type: "INCIDENT",
        severity: incident.severity || "HIGH",
        description: message,
        relatedId: incident._id,
        protectedAreaId: incident.protectedAreaId,
        protectedAreaName: paName,
        zoneId: incident.zoneId,
        zoneName: zoneName,
        location: location
    };

    return alertRepo.create(alertData);
};

// Fetch alerts with pagination, sorting, and status filtering
export const getAlerts = async (query) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = { createdAt: -1 };

    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.type) filter.type = query.type;
    if (query.protectedAreaId) filter.protectedAreaId = query.protectedAreaId;

    const [total, alerts] = await Promise.all([
        alertRepo.count(filter),
        alertRepo.findWithPagination(filter, sort, skip, limit)
    ]);

    return {
        alerts,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1
    };
};

// Link a patrol to an alert and mark it as acknowledged
export const linkPatrolToAlert = async (alertId, patrolId) => {
    return alertRepo.updateById(alertId, {
        patrolId,
        status: "ACKNOWLEDGED"
    });
};

// Update alert processing state
export const updateAlertStatus = async (alertId, status) => {
    return alertRepo.updateById(alertId, { status });
};
