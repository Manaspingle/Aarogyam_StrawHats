/**
 * Firebase Cloud Function: Twilio Emergency SOS Dispatcher
 * 
 * Handles inter-hospital voice SOS call dispatching securely from the backend.
 * Keeps Twilio Account SID and Auth Token secure in Firebase Environment.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const twilio = require('twilio');

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Endpoint to trigger an automated emergency phone call via Twilio
 * 
 * Environment Variables required in Firebase:
 * 1. Via Firebase 2nd Gen / .env:
 *    TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 *    TWILIO_AUTH_TOKEN=your_auth_token
 *    TWILIO_DEFAULT_FROM_NUMBER=+1234567890
 * 
 * 2. Or via Firebase CLI config (1st Gen):
 *    firebase functions:config:set twilio.account_sid="..." twilio.auth_token="..." twilio.from_number="..."
 */
exports.makeEmergencyCall = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    }

    try {
      const {
        to,
        from,
        twiml,
        hospital_name,
        target_hospital_name,
        blood_group,
        units,
        urgency,
        notes,
      } = req.body;

      if (!to) {
        return res.status(400).json({ error: 'Missing required parameter: "to"' });
      }

      // Read Twilio Credentials from environment
      const accountSid = process.env.TWILIO_ACCOUNT_SID || (functions.config().twilio && functions.config().twilio.account_sid);
      const authToken = process.env.TWILIO_AUTH_TOKEN || (functions.config().twilio && functions.config().twilio.auth_token);
      const defaultFrom = process.env.TWILIO_DEFAULT_FROM_NUMBER || (functions.config().twilio && functions.config().twilio.from_number);

      if (!accountSid || !authToken) {
        return res.status(500).json({
          error: 'Twilio credentials not configured in Firebase environment variables.',
          hint: 'Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in Firebase environment.',
        });
      }

      const client = twilio(accountSid, authToken);
      const callerFrom = from || defaultFrom;

      // Construct voice message if twiml is not explicitly provided
      const voiceTwiml = twiml || (
        `<Response>` +
          `<Say voice="Polly.Aditi" language="en-IN">` +
            `Emergency SOS Alert from Aarogyam Health Network. ` +
            `Hospital ${hospital_name || 'Medical Center'} has an immediate critical requirement for ` +
            `${units || 1} units of ${blood_group || 'emergency'} blood with ${urgency || 'critical'} priority. ` +
            `${notes ? `Clinical notes: ${notes}. ` : ''}` +
            `Please check your Aarogyam hospital emergency dashboard now to respond. Thank you.` +
          `</Say>` +
          `<Pause length="1"/>` +
          `<Say voice="Polly.Aditi" language="en-IN">Repeating alert: ${units || 1} units of ${blood_group || 'emergency'} blood required urgently.</Say>` +
        `</Response>`
      );

      // Dispatch Twilio Voice Call
      const call = await client.calls.create({
        to,
        from: callerFrom,
        twiml: voiceTwiml,
      });

      // Log dispatch in Firestore
      try {
        await admin.firestore().collection('emergency_calls').add({
          call_sid: call.sid,
          from: callerFrom,
          to,
          hospital_name: hospital_name || '',
          target_hospital_name: target_hospital_name || '',
          blood_group: blood_group || '',
          units: units || 1,
          urgency: urgency || '',
          status: call.status,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (dbErr) {
        console.warn('Could not log call to Firestore:', dbErr);
      }

      return res.status(200).json({
        success: true,
        callSid: call.sid,
        status: call.status,
        from: callerFrom,
        to,
      });
    } catch (err) {
      console.error('Error dispatching Twilio call:', err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  });
});
