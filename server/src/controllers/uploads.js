import { v2 as cloudinary } from "cloudinary";
import { asyncHandler } from "../utils/http.js";

export const uploadImages = asyncHandler(async (request, response) => {
  if (!request.files?.length)
    return response
      .status(400)
      .json({ message: "Choose at least one image to upload." });
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return response
      .status(503)
      .json({
        message:
          "Image uploads are not configured. Add Cloudinary credentials to the server environment and try again.",
      });
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
  const images = await Promise.all(
    request.files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: `five-percentage/${request.userId}`,
              resource_type: "image",
              transformation: [{ width: 1800, height: 1800, crop: "limit" }],
            },
            (error, result) => {
              if (error)
                return reject(
                  new Error(
                    "An image could not be uploaded. Please try again.",
                  ),
                );
              return resolve(result.secure_url);
            },
          );
          stream.end(file.buffer);
        }),
    ),
  );
  return response.json({ images });
});
