import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
const twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim();
const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER?.trim(); // e.g. 'whatsapp:+14155238886'

let twilioClient = null;

if (twilioSid && twilioToken) {
    console.log("Twilio WhatsApp Service Initialized");
    twilioClient = twilio(twilioSid, twilioToken);
}

/**
 * Unified notification dispatcher for multiple providers (Twilio, MQTT)
 * @param {object} patrol - The patrol mission details
 * @param {Array} rangers - List of assigned rangers with phone numbers
 */
export const notifyRangerAssignment = async (patrol, rangers) => {
    for (const ranger of rangers) {
        if (!ranger.phone) continue;

        const lat = patrol.exactLocation?.lat;
        const lng = patrol.exactLocation?.lng;
        const locationText = (lat && lng)
            ? `${lat.toFixed(4)}, ${lng.toFixed(4)}\n*Map:* https://www.google.com/maps?q=${lat},${lng}`
            : "Not provided";

        const messageBody = `🌿 *New Patrol Assigned*\n\n` +
            `*Patrol:* ${patrol.title || "Wildlife Mission"}\n` +
            `*Location:* ${locationText}\n` +
            `*Start Time:* ${new Date(patrol.plannedStart).toLocaleString()}\n\n` +
            `Please check your dashboard for details and report check-ins.`;

        // 1. Send via Twilio (Direct WhatsApp)
        if (twilioClient && twilioFrom) {
            try {
                const result = await twilioClient.messages.create({
                    from: twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`,
                    to: ranger.phone.startsWith('whatsapp:') ? ranger.phone : `whatsapp:${ranger.phone}`,
                    body: messageBody
                });
                console.log(`Twilio WhatsApp Sent to ${ranger.phone}: ${result.sid}`);
            } catch (err) {
                console.error(`Twilio WhatsApp Failed for ${ranger.phone}:`, err.message);
            }
        } else {
            console.log(`Twilio not configured. Skipping direct WhatsApp for ${ranger.phone}`);
        }
    }
};
