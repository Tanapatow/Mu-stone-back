import { User } from 'src/database/generated/prisma/client';

export type UserWithoutPassword = Omit<User, 'password'>;
