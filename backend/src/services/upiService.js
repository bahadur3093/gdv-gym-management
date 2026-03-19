/**
 * Generates a UPI deep link that opens GPay / PhonePe / any UPI app
 * with the payment details pre-filled.
 *
 * When a member taps "Pay Now" in the app, this link is opened.
 * The remark field contains their unique member ID + month so we can
 * identify the payment in the bank statement.
 *
 * UPI deep link spec: upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
 */
export const generateUPIDeepLink = ({ upiId, name, amount, remark }) => {
  const params = new URLSearchParams({
    pa: upiId,           // payee UPI ID e.g. societygym@jupiter
    pn: name,            // payee name
    am: amount,          // amount in INR
    cu: 'INR',           // currency
    tn: remark,          // transaction note — this is what appears in bank statement
  });

  return `upi://pay?${params.toString()}`;
};

/**
 * Generates the UPI QR code data string (same format, used if you want
 * to show a scannable QR at the gym entrance as an alternative)
 */
export const generateUPIQRData = ({ upiId, name, amount, remark }) => {
  return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(remark)}`;
};
