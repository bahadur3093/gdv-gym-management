import admin from 'firebase-admin'
import supabase from '../config/supabase.js'

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FCM_PROJECT_ID,
      clientEmail: process.env.FCM_CLIENT_EMAIL,
      privateKey:  process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    } as admin.ServiceAccount),
  })
}

interface NotificationTarget {
  userId?: string
  role?:   'admin' | 'member'
}

export const sendNotification = async (
  target: NotificationTarget,
  body:   string,
  title = 'Society Gym'
): Promise<void> => {
  try {
    let query = supabase
      .from('members')
      .select('fcm_token, name')
      .not('fcm_token', 'is', null)

    if (target.userId) {
      query = query.eq('id', target.userId) as typeof query
    } else if (target.role) {
      query = query.eq('role', target.role).eq('status', 'active') as typeof query
    }

    const { data: members, error } = await query
    if (error || !members?.length) return

    const tokens = members.map((m: { fcm_token: string }) => m.fcm_token).filter(Boolean)
    if (!tokens.length) return

    const response = await admin.messaging().sendEachForMulticast({
      notification: { title, body },
      tokens,
      android: { priority: 'high' },
      apns:    { payload: { aps: { sound: 'default' } } },
    })

    // Clean up stale tokens
    response.responses.forEach(async (resp, idx) => {
      if (!resp.success &&
          resp.error?.code === 'messaging/registration-token-not-registered') {
        await supabase
          .from('members')
          .update({ fcm_token: null })
          .eq('fcm_token', tokens[idx])
      }
    })

    console.log(`[FCM] Sent to ${response.successCount}/${tokens.length} devices`)
  } catch (err) {
    console.error('[FCM] Notification error:', (err as Error).message)
  }
}
