// Saves a text file on the device. On phones that support it, sharing sends it to WhatsApp/Drive/mail.

export function downloadText(fileName, text, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function canShareFiles() {
  try {
    return Boolean(navigator.canShare?.({ files: [new File(['x'], 'x.json', { type: 'application/json' })] }));
  } catch {
    return false;
  }
}

// Returns true if shared, false if the person closed the share sheet.
export async function shareText(fileName, text, mime) {
  try {
    await navigator.share({ files: [new File([text], fileName, { type: mime })], title: fileName });
    return true;
  } catch {
    return false;
  }
}

export function readFileText(file) {
  return file.text();
}
