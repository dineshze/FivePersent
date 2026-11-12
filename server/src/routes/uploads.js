import { Router } from 'express'
import multer from 'multer'
import { uploadImages } from '../controllers/uploads.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 9 },
  fileFilter: (request, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      const error = new Error('Upload JPEG, PNG or WebP images only.')
      error.status = 400
      return callback(error)
    }
    return callback(null, true)
  },
})

router.post('/images', upload.array('images', 9), uploadImages)

export default router
