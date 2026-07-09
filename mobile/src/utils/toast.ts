import Toast from 'react-native-toast-message';

export function showError(message: string, title = 'Error') {
  Toast.show({ type: 'error', text1: title, text2: message });
}

export function showSuccess(message: string, title = 'Success') {
  Toast.show({ type: 'success', text1: title, text2: message });
}

export function showInfo(message: string, title?: string) {
  Toast.show({ type: 'info', text1: title ?? message, text2: title ? message : undefined });
}
