const sharp = require('sharp');
const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');
const pool = require('../config/database');

function uploadBufferToCloudinary(buffer, folder = 'profile_pics') {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'image' },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
}

const uploadProfilePic = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

        const userId = req.user.uid;
        const processedBuffer = await sharp(req.file.buffer)
            .resize(512, 512, { fit: 'cover' })
            .webp({ quality: 80 })
            .toBuffer();

        const uploadResult = await uploadBufferToCloudinary(processedBuffer, 'profile_pics');

        const { secure_url: secureUrl, public_id: publicId } = uploadResult;

        const findRes = await pool.query('SELECT profile_pic_public_id FROM users WHERE uid = $1', [userId]);
        const oldPublicId = findRes.rows[0]?.profile_pic_public_id;

        await pool.query(
            'UPDATE users SET profile_pic_url = $1, profile_pic_public_id = $2 WHERE uid = $3',
            [secureUrl, publicId, userId]
        );

        if (oldPublicId && oldPublicId !== publicId) {
            try {
                await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'image' });
            } catch (err) {
                console.warn('Failed to delete previous Cloudinary image:', err.message);
            }
        }

        return res.json({ msg: 'Profile picture uploaded', profilePic: secureUrl });
    } catch (err) {
        console.error('Upload error:', err);
        return res.status(500).json({ msg: 'Failed to upload image', error: err.message });
    }
};

module.exports = {
    uploadProfilePic
};