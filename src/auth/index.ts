import { Post, PrismaClient, User } from "@prisma/client";
import { decode, jwt } from "hono/jwt";
import { getCookie } from "hono/cookie";
import { Hono } from "hono";
import { JWT_TOKEN, prisma } from "../constants";

const authRoute = new Hono().basePath("/auth");

authRoute.use(
  "/*",
  jwt({
    secret: JWT_TOKEN,
    cookie: "jwt_token",
  })
);

authRoute.get("/me", async (c) => {
  const token = await getCookie(c, "jwt_token");
  if (!token) return c.json({ message: "Not logged in" });

  const { payload } = decode(token);
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });
  return c.json(user);
});

authRoute.get("/post", async (c) => {
  const token = await getCookie(c, "jwt_token");
  if (!token) return c.json({ message: "Not logged in" });

  const { payload } = await decode(token);
  const post = await prisma.post.findMany({
    where: {
      authorId: payload.id,
    },
  });
  return c.json(post);
});

authRoute.post("/post", async (c) => {
  const token = await getCookie(c, "jwt_token");
  if (!token) return c.json({ message: "Not logged in" });

  const body = await c.req.json<Pick<Post, "title" | "content">>();

  const { payload } = await decode(token);
  const post = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content,
      author: {
        connect: {
          email: payload.email,
        },
      },
      authorId: payload.id,
    },
  });
  return c.json(post);
});

export default authRoute;
