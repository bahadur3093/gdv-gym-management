import admin from 'firebase-admin';
import supabase from '../config/supabase.js';

// Initialise Firebase Admin SDK once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FCM_PROJECT_ID,
      clientEmail: process.env.FCM_CLIENT_EMAIL,
      // Replace \n with actual newlines in the private key env var
      privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

/**
 * Send a push notification to one or more members.
 *
 * target options:
 *   { userId: 'uuid' }     — single member
 *   { role: 'admin' }      — all admins
 *   { role: 'member' }     — all active members
 *
 * Usage examples:
 *   await sendNotification({ userId: id }, 'Payment approved!')
 *   await sendNotification({ role: 'admin' }, 'New issue reported')
 */
export const sendNotification = async (target, body, title = 'Society Gym') => {
  try {
    // Fetch FCM tokens for the target audience from DB
    let query = supabase.from('members').select('fcm_token, name').not('fcm_token', 'is', null);

    if (target.userId) {
      query = query.eq('id', target.userId);
    } else if (target.role) {
      query = query.eq('role', target.role).eq('status', 'active');
    }

    const { data: members, error } = await query;
    if (error || !members?.length) return;

    const tokens = members.map(m => m.fcm_token).filter(Boolean);
    if (!tokens.length) return;

    // Send to all tokens in one batch call
    const message = {
      notification: { title, body },
      tokens,
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // Clean up invalid tokens from DB
    response.responses.forEach(async (resp, idx) => {
      if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
        await supabase
          .from('members')
          .update({ fcm_token: null })
          .eq('fcm_token', tokens[idx]);
      }
    });

    console.log(`[FCM] Sent to ${response.successCount}/${tokens.length} devices`);
  } catch (err) {
    // Notification failures should never crash the main flow
    console.error('[FCM] Notification error:', err.message);
  }
};
