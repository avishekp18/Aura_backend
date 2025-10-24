// ...existing code...
import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "./cloudinary.js";

const upload = multer({ storage: multer.memoryStorage() });

export function uploadBufferToCloudinary(buffer, folder = "fb-mern") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

export default upload;
// ...existing code...
