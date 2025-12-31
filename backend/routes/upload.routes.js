const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const uploadController = require('../controllers/upload.controller');

// Upload profile image
router.post('/profile', upload.single('file'), uploadController.uploadProfileImage);

module.exports = router;
