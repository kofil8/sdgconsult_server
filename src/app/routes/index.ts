import express from "express";
import { ProfileRouters } from "../modules/profile/profile.router";
import { UserRouters } from "../modules/user/user.router";
import { AuthRouters } from "../modules/auth/auth.router";
import { NotificationsRouters } from "../modules/notifications/notification.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRouters,
  },
  {
    path: "/users",
    route: UserRouters,
  },
  {
    path: "/profile",
    route: ProfileRouters,
  },
  {
    path: "/buildings",
    route: UserRouters,
  },
  {
    path: "/notifications",
    route: NotificationsRouters,
  },
];

moduleRoutes
  .filter((route) => route.route)
  .forEach((route) => router.use(route.path, route.route));

export default router;
