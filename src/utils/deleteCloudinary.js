import { v2 as cloudinary } from "cloudinary";

export const deleteFromCloudinary = async (publicId, resourceType = "video") => {
    try {
        return await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
    } catch (error) {
        console.error("Cloudinary delete error:", error);
    }
};