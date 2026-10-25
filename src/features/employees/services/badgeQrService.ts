import QRCode from 'qrcode';

/**
 * Generate a data URL QR Code for employee verification
 */
export async function generateEmployeeQRCode(employeeData: {
  id: string;
  employeeId: string;
  name: string;
  nationalId?: string;
  department?: string;
}): Promise<string> {
  const payload = JSON.stringify({
    org: 'New Hope Egypt',
    code: employeeData.employeeId,
    name: employeeData.name,
    dept: employeeData.department || '',
    verifyUrl: `${window.location.origin}/employees/${employeeData.id}`,
  });

  try {
    return await QRCode.toDataURL(payload, {
      width: 256,
      margin: 1,
      color: {
        dark: '#0f172a', // slate-900
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return '';
  }
}
