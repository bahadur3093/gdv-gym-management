import supabase from '../config/supabase.js';

// POST /api/attendance/checkin
// Called when member scans the QR code at gym entrance
export const checkIn = async (req, res, next) => {
  try {
    const memberId = req.user.id;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Prevent double check-in on the same day
    const { data: existing } = await supabase
      .from('attendance')
      .select('id, checked_in_at')
      .eq('member_id', memberId)
      .eq('date', today)
      .single();

    if (existing) {
      return res.status(409).json({
        error: 'Already checked in today',
        checkedInAt: existing.checked_in_at,
      });
    }

    const { data, error } = await supabase
      .from('attendance')
      .insert({ member_id: memberId, date: today, checked_in_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;

    // Update streak in members table
    await updateStreak(memberId, today);

    res.status(201).json({ message: 'Check-in successful', attendance: data });
  } catch (err) {
    next(err);
  }
};

// GET /api/attendance/me?month=2025-06
export const getMyAttendance = async (req, res, next) => {
  try {
    const memberId = req.user.id;
    const month = req.query.month || new Date().toISOString().slice(0, 7); // default current month

    const startDate = `${month}-01`;
    const endDate = new Date(month + '-01');
    endDate.setMonth(endDate.getMonth() + 1);
    const endDateStr = endDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('attendance')
      .select('date, checked_in_at')
      .eq('member_id', memberId)
      .gte('date', startDate)
      .lt('date', endDateStr)
      .order('date', { ascending: false });

    if (error) throw error;

    // Calculate stats
    const daysInMonth = new Date(endDate - 1).getDate();
    const presentDays = data.length;
    const percentage = Math.round((presentDays / daysInMonth) * 100);

    res.json({ attendance: data, stats: { presentDays, daysInMonth, percentage, month } });
  } catch (err) {
    next(err);
  }
};

// GET /api/attendance/today  (admin only)
export const getAllToday = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('attendance')
      .select('checked_in_at, members(id, name, flat_number, tower)')
      .eq('date', today)
      .order('checked_in_at', { ascending: false });

    if (error) throw error;

    res.json({ date: today, count: data.length, checkins: data });
  } catch (err) {
    next(err);
  }
};

// ── Internal helper ──────────────────────────────────────────────────────────
async function updateStreak(memberId, today) {
  // Check if they checked in yesterday to continue streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const { data: yesterdayRecord } = await supabase
    .from('attendance')
    .select('id')
    .eq('member_id', memberId)
    .eq('date', yesterdayStr)
    .single();

  if (yesterdayRecord) {
    // Increment streak
    await supabase.rpc('increment_streak', { member_id: memberId });
  } else {
    // Reset streak to 1
    await supabase
      .from('members')
      .update({ current_streak: 1 })
      .eq('id', memberId);
  }
}
