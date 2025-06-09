# Question Image Upload Feature

## Overview

The application now supports adding images to test questions through two methods:
1. **File Upload**: Upload image files directly from your computer
2. **URL Input**: Provide a URL to an existing image

## Features

### Supported Image Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### File Size Limit
- Maximum file size: 5MB per image

### Storage
- Images are stored in the `public/uploads/question-images/` directory
- Files are automatically renamed with timestamps to prevent conflicts
- Images are accessible via public URLs like `/uploads/question-images/filename.jpg`

## Usage

### Adding Images to New Questions

1. **Via Question Creation Form**:
   - Navigate to Admin → Manage Tests → Select a test
   - In the "Add New Question" form, find the "Question Image (Optional)" section
   - Choose either:
     - **Upload Image File**: Click "Choose File" and select an image from your computer
     - **Image URL**: Enter a direct URL to an image

2. **Via Test Edit Page**:
   - Navigate to Admin → Tests → Select a test → Edit
   - Click "Add Question"
   - In the form, find the "Question Image (Optional)" section
   - Use either upload or URL method

### Editing Images in Existing Questions

1. Navigate to the test edit page
2. Click "Edit" on any question
3. In the edit form:
   - View the current image (if any) in the "Current Image" preview
   - Upload a new image to replace it
   - Or modify the image URL
   - Or clear the URL field to remove the image

### Image Preview

- **Live Preview**: When you upload a file or enter a URL, a preview will appear
- **Error Handling**: If an image fails to load, it will be hidden automatically
- **Responsive Display**: Images are automatically resized to fit the interface

## Technical Implementation

### API Endpoints

- `POST /api/images/upload`: Handles file uploads
  - Validates file type and size
  - Stores files in the public directory
  - Returns the public URL

### Database Schema

The `Question` model includes:
```prisma
model Question {
  // ... other fields
  promptImageUrl String? // Optional image URL
  // ... other fields
}
```

### Security Features

- **Authentication Required**: Only authenticated admin users can upload images
- **File Type Validation**: Only image files are accepted
- **File Size Limits**: 5MB maximum to prevent abuse
- **Unique Filenames**: Timestamp-based naming prevents conflicts

## File Structure

```
public/
  uploads/
    question-images/
      .gitkeep
      question-image-1234567890.jpg
      question-image-1234567891.png
      ...
```

## Error Handling

The system handles various error scenarios:
- Invalid file types
- Files too large
- Network upload failures
- Invalid URLs
- Missing authentication

Error messages are displayed to users with specific guidance on how to resolve issues.

## Future Enhancements

Potential improvements for the future:
- Cloud storage integration (AWS S3, Cloudinary)
- Image compression and optimization
- Bulk image upload
- Image editing capabilities
- Alternative text for accessibility
- Image galleries for reuse across questions 