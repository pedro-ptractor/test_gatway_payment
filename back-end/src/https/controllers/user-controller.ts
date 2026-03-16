import type { FastifyReply, FastifyRequest } from 'fastify';
import z from 'zod';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../erros/index.js';
import bcrypt from 'bcrypt';

export async function register(req: FastifyRequest, reply: FastifyReply) {
  try {
    const bodySchema = z.object({
      name: z.string(),
      email: z.email(),
      password: z.string().min(8),
    });

    const { name, email, password } = bodySchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (user) throw new HttpError('User already exists', 400);

    const passwordHash = await bcrypt.hash(password, 10);

    const createUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    return reply.status(201).send({
      id: createUser.id,
      name: createUser.name,
      email: createUser.email,
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function login(req: FastifyRequest, reply: FastifyReply) {
  const bodySchema = z.object({
    email: z.email(),
    password: z.string().min(8),
  });

  const { email, password } = bodySchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) throw new HttpError('User not found', 404);

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) throw new HttpError('Invalid credentials', 401);

  const token = await reply.jwtSign({
    id: user.id,
  });

  return reply.status(200).send({
    token,
  });
}
