interface UPILinkParams {
  upiId:  string
  name:   string
  amount: string
  remark: string
}

export const generateUPIDeepLink = ({ upiId, name, amount, remark }: UPILinkParams): string => {
  const params = new URLSearchParams({ pa: upiId, pn: name, am: amount, cu: 'INR', tn: remark })
  return `upi://pay?${params.toString()}`
}

export const generateUPIQRData = ({ upiId, name, amount, remark }: UPILinkParams): string =>
  `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(remark)}`
