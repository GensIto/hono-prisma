import { User } from "@prisma/client";
import { sign } from "hono/jwt";
import { setCookie, deleteCookie } from "hono/cookie";
import { Hono } from "hono";
import { logger } from "hono/logger";

import authRoute from "./auth";
import { JWT_TOKEN, prisma } from "./constants";

const app = new Hono();

app.use(logger());

app.post("/login", async (c) => {
  const body = await c.req.json<User>();

  const token = await sign(body, JWT_TOKEN);
  await setCookie(c, "jwt_token", token);

  const user = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
  });

  // const user = await prisma.user.create({
  //   data: {
  //     name: body.name,
  //     email: body.email,
  //   },
  // });

  return c.json(user);
});

app.get("/logout", async (c) => {
  await deleteCookie(c, "jwt_token");
  return c.json({ message: "Logged out" });
});

app.route("/", authRoute);

export default app;
