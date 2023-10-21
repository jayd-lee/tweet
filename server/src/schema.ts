import { permissions } from './permissions'
import { APP_SECRET, getUserId } from './utils'
import { compare, hash } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { applyMiddleware } from 'graphql-middleware'
import {
  intArg,
  makeSchema,
  nonNull,
  objectType,
  stringArg,
  inputObjectType,
  arg,
  asNexusMethod,
  enumType,
} from 'nexus'
import { DateTimeResolver } from 'graphql-scalars'
import { Context } from './context'

export const DateTime = asNexusMethod(DateTimeResolver, 'date')

const Query = objectType({
  name: 'Query',
  definition(t) {
    t.nonNull.list.nonNull.field('allUsers', {
      type: 'User',
      resolve: (_parent, _args, context: Context) => {
        return context.prisma.user.findMany()
      },
    })

    t.nullable.field('me', {
      type: 'User',
      resolve: (parent, args, context: Context) => {
        const userId = getUserId(context)
        return context.prisma.user.findUnique({
          where: {
            id: Number(userId),
          },
        })
      },
    })
  },
})

const Mutation = objectType({
  name: 'Mutation',
  definition(t) {
    t.field('signup', {
      type: 'AuthPayload',
      args: {
        name: stringArg(),
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
      },
      resolve: async (_parent, args, context: Context) => {
        const hashedPassword = await hash(args.password, 10)
        const user = await context.prisma.user.create({
          data: {
            name: args.name,
            email: args.email,
            password: hashedPassword,
          },
        })
        return {
          token: sign({ userId: user.id }, APP_SECRET),
          user,
        }
      },
    })

    t.field('login', {
      type: 'AuthPayload',
      args: {
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
      },
      resolve: async (_parent, { email, password }, context: Context) => {
        const user = await context.prisma.user.findUnique({
          where: {
            email,
          },
        })
        if (!user) {
          throw new Error(`No user found for email: ${email}`)
        }
        const passwordValid = await compare(password, user.password)
        if (!passwordValid) {
          throw new Error('Invalid password')
        }
        return {
          token: sign({ userId: user.id }, APP_SECRET),
          user,
        }
      },
    })

    t.field("createProfile", {
			type: "Profile",
			args: {
				bio: stringArg(),
				location: stringArg(),
				website: stringArg(),
				avatar: stringArg()
			},
			resolve: (parent, args, ctx) => {
				const userId = getUserId(ctx)
				if (!userId) throw new Error("Could not authenticate user.")
				return ctx.prisma.profile.create({
					data: {
						...args,
						User: { connect: { id: Number(userId) } }
					}
				})
			}
		})

    t.field("updateProfile", {
			type: "Profile",
			args: {
				id: intArg(),
				bio: stringArg(),
				location: stringArg(),
				website: stringArg(),
				avatar: stringArg()
			},
			resolve: (parent, { id, ...args }, ctx) => {
				const userId = getUserId(ctx)
				if (!userId) throw new Error("Could not authenticate user.")

				return ctx.prisma.profile.update({
					data: {
						...args
					},
					where: {
						id: Number(id)
					}
				})
			}
		})


  },
})

const User = objectType({
  name: 'User',
  definition(t) {
    t.nonNull.int('id')
    t.string('name')
    t.nonNull.string('email')
    t.nonNull.list.nonNull.field('tweets', {
      type: 'Tweet',
      resolve: (parent, _, context: Context) => {
        return context.prisma.tweet.findMany({
          where: { authorId: parent.id }
        })
      }
    })
    t.field('Profile' , {
      type: 'Profile',
      resolve: (parent, _, context: Context) => {
        return context.prisma.profile
          .findUnique({
            where: {userId: parent.id || undefined}
          })
      }

    })
  },
})
const Tweet = objectType({
  name: 'Tweet',
  definition(t) {
    t.nonNull.int('id');
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.nonNull.string('content');
    t.int('authorId');

    t.field('author', {
      type: 'User',
      resolve: (parent, _, context: Context) => {
        return context.prisma.tweet
          .findUnique({
            where: { id: parent.id || undefined },
          })
          .author();
      },
    });
  },
});



const Profile = objectType({
  name: 'Profile',
  definition(t) {
    t.nonNull.int('id');
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.string('bio');
    t.string('location');
    t.string('website');
    t.string('avatar');
    t.int('userId');

    t.field('User', {
      type: 'User',
      resolve: (parent, _, context: Context) => {
        return context.prisma.profile
          .findUnique({
            where: { id: parent.id || undefined },
          })
          .User();
      },
    });
  },
});

const SortOrder = enumType({
  name: 'SortOrder',
  members: ['asc', 'desc'],
})

const PostOrderByUpdatedAtInput = inputObjectType({
  name: 'PostOrderByUpdatedAtInput',
  definition(t) {
    t.nonNull.field('updatedAt', { type: 'SortOrder' })
  },
})

const UserUniqueInput = inputObjectType({
  name: 'UserUniqueInput',
  definition(t) {
    t.int('id')
    t.string('email')
  },
})

const PostCreateInput = inputObjectType({
  name: 'PostCreateInput',
  definition(t) {
    t.nonNull.string('title')
    t.string('content')
  },
})

const UserCreateInput = inputObjectType({
  name: 'UserCreateInput',
  definition(t) {
    t.nonNull.string('email')
    t.string('name')
    t.list.nonNull.field('posts', { type: 'PostCreateInput' })
  },
})

const AuthPayload = objectType({
  name: 'AuthPayload',
  definition(t) {
    t.string('token')
    t.field('user', { type: 'User' })
  },
})

const schemaWithoutPermissions = makeSchema({
  types: [
    Query,
    Mutation,
    Tweet,
    Profile,
    User,
    AuthPayload,
    UserUniqueInput,
    UserCreateInput,
    PostCreateInput,
    SortOrder,
    PostOrderByUpdatedAtInput,
    DateTime,
  ],
  outputs: {
    schema: __dirname + '/../schema.graphql',
    typegen: __dirname + '/generated/nexus.ts',
  },
  contextType: {
    module: require.resolve('./context'),
    export: 'Context',
  },
  sourceTypes: {
    modules: [
      {
        module: '@prisma/client',
        alias: 'prisma',
      },
    ],
  },
})

export const schema = applyMiddleware(schemaWithoutPermissions, permissions)
