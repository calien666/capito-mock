class HttpError extends Error {
    constructor(message, status, detail) {
        super(message);
        this.status_internal = status;
        this.detail = detail;
    }

    status() {
        return this.status_internal || 400;
    }

    body() {
        const result = {};
        if (this.message) { result.message = this.message; }
        if (this.detail) { result.detail = this.detail; }
        return result;
    }
}

module.exports = { HttpError };
