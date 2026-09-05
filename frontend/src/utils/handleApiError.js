import { toast } from '@/components/ui/Toast';

export function handleApiError(error, setError = null) {
  if (!error) return 'An unknown error occurred.';

  // Network error or server not reachable
  if (!error.response) {
    const msg = error.message?.includes('Network Error')
      ? 'Cannot connect to the server. Please check your network connection.'
      : error.message || 'Network request failed.';
    toast.error(msg);
    return msg;
  }

  const { status, data } = error.response;
  const message = data?.message || 'An error occurred while processing your request.';

  // 422 Validation Error -> map field-level errors to React Hook Form
  if (status === 422 || (data?.errors && Array.isArray(data.errors))) {
    if (setError && Array.isArray(data.errors)) {
      data.errors.forEach((err) => {
        if (err.field) {
          setError(err.field, {
            type: 'server',
            message: err.message || 'Invalid value',
          });
        }
      });
    }
    toast.error(message || 'Validation error. Please check the highlighted fields.');
    return message;
  }

  // 409 Conflict
  if (status === 409) {
    toast.error(message || 'A conflict occurred. A record with this value already exists.');
    return message;
  }

  // 403 Forbidden
  if (status === 403) {
    toast.error(message || 'Access denied. You do not have permission to perform this action.');
    return message;
  }

  // 404 Not Found
  if (status === 404) {
    toast.error(message || 'The requested resource was not found.');
    return message;
  }

  // 401 Unauthorized (Auth expired or invalid credentials)
  if (status === 401) {
    // If it's a login attempt, show the invalid credentials message
    toast.error(message || 'Authentication failed. Please check your credentials.');
    return message;
  }

  // 500 Server Error
  if (status >= 500) {
    toast.error('An unexpected server error occurred. Please try again later.');
    return 'Server error';
  }

  // Generic fallback
  toast.error(message);
  return message;
}
