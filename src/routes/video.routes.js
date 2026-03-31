import { Router } from "express";
import { deleteVideo, getAllVideos, getMyVideos, publishVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/").get(getAllVideos);

router.route("/upload").post(
  verifyJWT,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishVideo
);

router.route("/v/:videoId").patch(
    verifyJWT,
    upload.single("thumbnail"),
    updateVideo
);

router.route("/v/:videoId").delete(verifyJWT, deleteVideo);

router.route("/v/:videoId/toggle").patch(verifyJWT, togglePublishStatus);

router.route("my-videos").get(verifyJWT, getMyVideos);

export default router;