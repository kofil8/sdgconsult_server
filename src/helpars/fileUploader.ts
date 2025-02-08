import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: async function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const storageBuilding = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "uploads/Buildings"));
  },
  filename: async function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const storageWaste = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "uploads/antiWaste"));
  },
  filename: async function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const profileBuilding = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "uploads/profile"));
  },
  filename: async function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });
const uploadBuilding = multer({ storage: storageBuilding });
const uploadWaste = multer({ storage: storageWaste });
const uploadprofile = multer({ storage: profileBuilding });

const uploadprofileImage = uploadprofile.single("profileImage");
const uploadBuildingImages = uploadBuilding.fields([
  { name: "BuildingImages", maxCount: 10 },
]);

const uploadWasteImages = uploadWaste.fields([
  { name: "antiWasteImages", maxCount: 10 },
]);
const uploadPostImage = upload.single("postImage");

export const fileUploader = {
  upload,
  uploadBuildingImages,
  uploadWasteImages,
  uploadprofileImage,
  uploadPostImage,
};
