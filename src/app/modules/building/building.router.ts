import express from "express";
import auth from "../../middlewares/auth";
import { BuildingControllers } from "./building.controller";

const router = express.Router();

router.post("/", auth(), BuildingControllers.createBuilding);

router.get("/", auth(), BuildingControllers.getAllBuildings);

router.get("/:id", auth(), BuildingControllers.getSinglebuilding);

router.patch("/:id", auth(), BuildingControllers.updateBuilding);

router.delete("/:id", auth(), BuildingControllers.deleteBuilding);

export const BuildingRouters = router;
