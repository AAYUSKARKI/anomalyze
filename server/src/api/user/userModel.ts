import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { commonValidations } from "../../common/utils/commonValidation";

extendZodWithOpenApi(z);

export const UserSchema = z.object({
	id: z.number(),
	name: z.string(),
	email: z.string().email(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const RegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export const RegisterRequestSchema = z.object({
  body: RegisterSchema,
  query: z.object({}).optional(), // Allow empty query
  params: z.object({}).optional(), // Allow empty params
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const LoginRequestSchema = z.object({
  body: LoginSchema,
  query: z.object({}).optional(), // Allow empty query
  params: z.object({}).optional(), // Allow empty params
});


export const LoginResponseSchema = z.object({ 
	id: z.number(),
	name: z.string(),
	email: z.string().email(),
	token: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// Input Validation for 'GET users/:id' endpoint
export const GetUserSchema = z.object({
	params: z.object({ id: commonValidations.id }),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type User = z.infer<typeof UserSchema>;
export type Register = z.infer<typeof RegisterSchema>;
export type Login = z.infer<typeof LoginSchema>;