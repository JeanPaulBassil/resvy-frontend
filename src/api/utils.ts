export interface ResponseError {
  error: {
    name?: string;
    message?: string;
    status?: number;
    code?: number;
    response?: string | { errors?: Record<string, string> };
  };
  timestamp: string;
}

export class ServerError extends Error {
  name = 'Error'
  message = 'Generic error message. Please contact the administrator.'
  status: number = 400
  timestamp = new Date().toISOString()

  constructor(public error: ResponseError) {
    super();
    this.name = this.error.error.name ?? 'Unknown Error Name'
    this.message = this.getDisplayErrorMessage()
    this.status = this.getErrorStatus()
    // transform timestamp to Date object
    this.timestamp = new Date(this.error.timestamp).toISOString()
  }

  private getErrorStatus(): number {
    const status = this.error.error.status ?? this.error.error.code;
    return typeof status === 'number' ? status : 400;
  }

  private getDisplayErrorMessage() {
    // Display deep errors first then shallow errors
    // Deep errors exists in response.errors
    // Shallow errors exists in error.response (if it is a string) or error.message
    if (this.error.error.response === undefined || typeof this.error.error.response === 'string') {
      return this.error.error.message ?? 'An Unknown Error Occurred'
    } else {
      if (this.error.error.response.errors === undefined) {
        return this.error.error.message ?? 'Unhandled Error Occurred'
      }

      const errors = this.error.error.response.errors as Record<string, string>
      return Object.values(errors)[0]
    }
  }
} 