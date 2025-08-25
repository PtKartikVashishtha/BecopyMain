# BeCopy Backend

This Node.js backend service provides functionality to convert program code to Excel files and handle file uploads.

## Features

- Convert plaintext code to Excel (.xlsx) format
- File upload functionality
- List uploaded files
- CORS enabled for frontend integration

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Convert Code to Excel
- **POST** `/api/convert-to-excel`
- Request body:
```json
{
    "code": "your program code here"
}
```

### Upload File
- **POST** `/api/upload`
- Form data with field name: `file`

### List Files
- **GET** `/api/files`

## File Storage

All generated Excel files and uploaded files are stored in the `uploads` directory.

## Environment Variables

- `PORT`: Server port (default: 5000) 