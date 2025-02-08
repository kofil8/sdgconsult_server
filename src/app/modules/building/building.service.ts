import httpStatus from "http-status";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { calculatePagination } from "../../../utils/calculatePagination";
import logger from "../../../utils/logger";

const createBuildingIntoDB = async (id: string, payload: any) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: id },
    select: { id: true },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  }

  let parsedPayload = payload;
  if (typeof payload === "string") {
    try {
      parsedPayload = JSON.parse(payload);
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid payload format");
    }
  }

  const userId = existingUser.id;

  const Building = await prisma.building.create({
    data: {
      userId,
      ...parsedPayload,
    },
  });

  return Building;
};

const getAllBuildingsFromDB = async () => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);
  const { searchTerm, ...restParams } = params || {};

  const andConditions: Prisma.BuildingWhereInput[] = [];

  // search by user
  if (searchTerm) {
    andConditions.push({
      OR: [
        {
          name: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  if (Object.keys(restParams).length) {
    andConditions.push({
      AND: Object.keys(restParams).map((key) => ({
        [key]: {
          //category:{equals:Food}
          equals: restParams[key as keyof typeof restParams],
        },
      })),
    });
  }

  const whereConditions: Prisma.BuildingWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.building.findMany({
    where: whereConditions,
    take: limit,
    skip,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.building.count({
    where: whereConditions,
  });

  const meta = {
    page,
    limit,
    total_docs: total,
    total_pages: Math.ceil(total / limit),
  };

  return { meta, data: result };
};

const getSingleBuildingFromDB = async (id: string) => {
  const result = await prisma.building.findUnique({
    where: {
      id,
    },
  });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Building not found");
  }
  return result;
};

const updateBuildingIntoDB = async (id: string, payload: any, files: any) => {
  console.log(id);
  const existingBuilding = await prisma.building.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
    },
  });

  if (!existingBuilding) {
    throw new ApiError(httpStatus.NOT_FOUND, "Building not found");
  }

  const imageURL = files?.BuildingImages
    ? files.BuildingImages.map((file: any) =>
        file.originalname
          ? `${config.backend_image_url}/uploads/${file.originalname}`
          : ""
      )
    : [];

  if (payload.category === Category.Food) {
    payload.subcategory = null;
  }
  logger.info(
    "Category: " + payload.category + " Subcategory: " + payload.subcategory
  );

  let parsedPayload = payload;
  if (typeof payload === "string") {
    try {
      parsedPayload = JSON.parse(payload);
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid payload format");
    }
  }
  const Building = await prisma.building.update({
    where: {
      id,
    },
    data: {
      ...parsedPayload,
      BuildingImages: imageURL,
    },
    select: {
      id: true,
      userId: true,
      name: true,
      description: true,
      BuildingImages: true,
      latitude: true,
      longitude: true,
      category: true,
      subcategory: true,
      condition: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return Building;
};

const deleteBuildingIntoDB = async (id: string) => {
  const existingBuilding = await prisma.building.findUnique({
    where: {
      id,
    },
  });

  if (!existingBuilding) {
    throw new ApiError(httpStatus.NOT_FOUND, "Building not found");
  }

  const Building = await prisma.building.delete({
    where: {
      id,
    },
  });
  return Building;
};

export const BuildingServices = {
  createBuildingIntoDB,
  getAllBuildingsFromDB,
  getSingleBuildingFromDB,
  updateBuildingIntoDB,
  deleteBuildingIntoDB,
};
