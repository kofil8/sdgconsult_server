import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { BuildingServices } from "./building.service";

const createBuilding = catchAsync(async (req: Request, res: Response) => {
  const id = req.user.id;
  const payload = req.body;
  const result = await BuildingServices.createBuildingIntoDB(id, payload);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Building added successfully",
    data: result,
  });
});

const getAllBuildings = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await BuildingServices.getAllBuildingsFromDB(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Buildings Retrieve successfully",
    data: result,
  });
});

const getSinglebuilding = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BuildingServices.getSingleBuildingFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Building Retrieve successfully",
    data: result,
  });
});

const updateBuilding = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const payload = req.body.bodyData;
  const files = req.files as any;
  const result = await BuildingServices.updateBuildingIntoDB(
    id,
    payload,
    files
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Building updated successfully",
    data: result,
  });
});

const deleteBuilding = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await BuildingServices.deleteBuildingIntoDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Building removed successfully",
    data: result,
  });
});
export const BuildingControllers = {
  createBuilding,
  getAllBuildings,
  getSinglebuilding,
  updateBuilding,
  deleteBuilding,
};
