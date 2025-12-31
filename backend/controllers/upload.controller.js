const path = require('path');

// Handle profile image upload
exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Generate the file path that will be stored in DB and served to clients
        const filePath = `/uploads/profiles/${req.file.filename}`;

        console.log('📸 Profile image uploaded:', {
            originalName: req.file.originalname,
            filename: req.file.filename,
            size: req.file.size,
            path: filePath
        });

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            filePath: filePath,
            fileUrl: filePath // Keeping both for compatibility
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: error.message
        });
    }
};
