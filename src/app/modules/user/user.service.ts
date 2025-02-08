import * as bcrypt from "bcrypt";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import prisma from "../../../shared/prisma";
import { generateToken } from "../../../utils/generateToken";
import { generateTokenReset } from "../../../utils/generateTokenForReset";
import { generateOtp } from "../../../utils/otpGenerateResetP";
import { generateOtpReg } from "../../../utils/otpGenerateReg";

const registerUserIntoDB = async (payload: any) => {
  console.log(payload.email, "email");
  const existingUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (existingUser) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "User already exists with this email"
    );
  }

  const hashedPassword: string = await bcrypt.hash(payload.password, 12);

  const user = await prisma.user.create({
    data: {
      ...payload,
      password: hashedPassword,
      isVerified: false,
    },
  });

  const { otp, otpExpiry } = await generateOtpReg({ email: payload.email });

  // Save otp in database
  await prisma.otp.create({
    data: {
      email: payload.email,
      otp,
      expiry: otpExpiry,
    },
  });

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isVerified: user.isVerified,
  };
};

const resendOtpReg = async (payload: { email: string }) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!userData) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  }

  const { otp, otpExpiry } = await generateOtpReg({ email: payload.email });

  // Find otp in database
  const otpData = await prisma.otp.findFirst({
    where: {
      id: userData.id,
    },
  });

  if (!otpData) {
    await prisma.otp.create({
      data: {
        email: payload.email,
        otp,
        expiry: otpExpiry,
      },
    });
  } else {
    await prisma.otp.update({
      where: {
        id: userData.id,
      },
      data: {
        otp,
        expiry: otpExpiry,
      },
    });
  }

  return otpData;
};

const verifyOtp = async (payload: {
  fcpmToken?: string;
  email: string;
  otp: number;
}) => {
  // Check if the user exists
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!userData) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  }

  // Check if the OTP is valid
  const otpData = await prisma.otp.findFirst({
    where: {
      email: payload.email,
      otp: payload.otp,
    },
  });

  if (otpData?.otp !== payload.otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  if (otpData?.expiry < new Date()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "OTP has expired");
  }

  // Delete the OTP
  await prisma.otp.delete({
    where: {
      id: otpData.id,
    },
  });

  // Update the FCM token if provided
  if (payload?.fcpmToken) {
    await prisma.user.update({
      where: {
        email: payload.email,
      },
      data: {
        fcmToken: payload.fcpmToken,
      },
    });
  }

  // Mark the user as verified

  const updatedUser = await prisma.user.update({
    where: {
      email: payload.email,
    },
    data: {
      isVerified: true,
      isOnline: true,
    },
    select: {
      isVerified: true,
      isOnline: true,
    },
  });

  const accessToken = generateToken(
    {
      id: userData.id,
      email: userData.email as string,
      role: userData.role,
      isVerified: updatedUser.isVerified,
      isOnline: updatedUser.isOnline,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  return {
    accessToken,
    id: userData.id,
    email: userData.email,
    fullName: userData.fullName,
    role: userData.role,
    isOnline: updatedUser.isOnline,
    isVerified: updatedUser.isVerified,
  };
};

const getAllUsersFromDB = async () => {
  const result = await prisma.user.findMany({
    where: {
      isVerified: true,
    },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      email: true,
      isOnline: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return result;
};

const getUserDetailsFromDB = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
      isVerified: true,
    },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      email: true,
      isOnline: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return user;
};

const deleteUser = async (id: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  }
  const result = await prisma.user.delete({
    where: {
      id: id,
    },
  });
  return;
};

const forgotPassword = async (payload: { email: string }) => {
  const { otp, otpExpiry } = await generateOtp(payload);

  // Check if OTP already exists for the user
  const existingOtp = await prisma.otp.findFirst({
    where: { email: payload.email },
  });

  if (existingOtp) {
    await prisma.otp.update({
      where: {
        id: existingOtp.id,
      },
      data: {
        otp,
        expiry: otpExpiry,
      },
    });
  } else {
    await prisma.otp.create({
      data: {
        email: payload.email,
        otp,
        expiry: otpExpiry,
      },
    });
  }
};

const resendOtpRest = async (payload: { email: string }) => {
  const { otp, otpExpiry } = await generateOtp(payload);

  // Check if OTP already exists for the user
  const existingOtp = await prisma.otp.findFirst({
    where: { email: payload.email },
  });

  if (existingOtp) {
    await prisma.otp.update({
      where: {
        id: existingOtp.id,
      },
      data: {
        otp,
        expiry: otpExpiry,
      },
    });
  } else {
    await prisma.otp.create({
      data: {
        email: payload.email,
        otp,
        expiry: otpExpiry,
      },
    });
  }

  return { otp, otpExpiry };
};

const verifyResetOtp = async (payload: { email: string; otp: number }) => {
  // Check if the user exists
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!userData) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  }

  const otpData = await prisma.otp.findFirst({
    where: {
      email: payload.email,
    },
  });

  if (otpData?.otp !== payload.otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  if (otpData?.expiry < new Date()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "OTP has expired");
  }

  await prisma.otp.delete({
    where: {
      id: otpData.id,
    },
  });

  // Generate an access token
  const accessToken = generateTokenReset(
    {
      email: userData.email,
      isVerified: userData.isVerified,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  return {
    message: "OTP verified successfully",
    accessToken,
  };
};

const resetPassword = async (
  accessToken: string,
  payload: { password: string }
) => {
  if (!accessToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
  }

  const decodedToken = jwtHelpers.verifyToken(
    accessToken,
    config.jwt.jwt_secret as Secret
  );

  const email = decodedToken?.email;

  if (!email) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
  }

  const userData = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!userData) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  }

  const hashedPassword: string = await bcrypt.hash(payload.password, 12);

  await prisma.user.update({
    where: {
      email,
    },
    data: {
      password: hashedPassword,
    },
  });

  return;
};

const changePassword = async (userId: string, payload: any) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
      isVerified: true,
    },
  });

  const isPasswordCorrect = await bcrypt.compare(
    payload.oldPassword,
    userData.password as string
  );

  if (payload.oldPassword === payload.newPassword) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "New password should be different from old password"
    );
  }

  if (!isPasswordCorrect) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid old password");
  }

  const hashedPassword: string = await bcrypt.hash(payload.newPassword, 12);

  await prisma.user.update({
    where: {
      id: userData.id,
    },
    data: {
      password: hashedPassword,
    },
  });

  return;
};

export const UserServices = {
  registerUserIntoDB,
  resendOtpReg,
  getAllUsersFromDB,
  getUserDetailsFromDB,
  deleteUser,
  forgotPassword,
  resendOtpRest,
  resetPassword,
  verifyResetOtp,
  verifyOtp,
  changePassword,
};
