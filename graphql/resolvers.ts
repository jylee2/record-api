import { applyGraphQL, gql, GQLError } from '../dependencies.ts'
import { Bson, MongoClient } from '../dependencies.ts'
import { v4 } from '../dependencies.ts'
import { bcrypt } from '../dependencies.ts'
import { create, verify } from '../dependencies.ts'

import appConfig from '../appConfig.ts'
import validate from '../utils/validate.ts'
import { checkAuthToken, checkAuthHeader } from '../utils/checkAuth.ts'
import enums from '../types/enums.ts'

// ========== MongoDB ==========

console.log('--------appConfig.MONGO_HOST', appConfig.MONGO_HOST)
console.log('--------appConfig.MONGO_USERNAME exists', appConfig.MONGO_USERNAME !== '')
console.log('--------appConfig.MONGO_PASSWORD exists', appConfig.MONGO_PASSWORD !== '')

const client = new MongoClient()
await client.connect({
  db: 'recordOne',
  tls: true,
  servers: [
    {
      host: appConfig.MONGO_HOST,
      port: 27017
    }
  ],
  credential: {
    username: appConfig.MONGO_USERNAME,
    password: appConfig.MONGO_PASSWORD,
    db: 'recordOne',
    mechanism: 'SCRAM-SHA-1'
  }
})

const db = client.database('recordOne')
const RecordsDB = db.collection('records')
const UsersDB = db.collection('users')

// ========== MongoDB ==========

const resolvers = {
  Query: {
    getUsers: async () => {
      try {
        const allUsers = await UsersDB.find({ username: { $ne: null } }, { noCursorTimeout: false } as any).sort({ username: 1 })

        return allUsers.map((u: any) => {
          const user: any = {
            id: u._id,
            createdAt: u.createdAt,
            email: u.email,
            username: u.username
          }

          return user
        })
      } catch (error) {
        console.log('--------Query getUsers error', error)
        throw new Error(error)
      }
    },

    getRecords: async (_: any, {}: any, context: any, info: any) => {
      try {
        const allRecords = await RecordsDB.find({ status: enums.Status.ACTIVE }, { noCursorTimeout: false } as any).sort({ createdAt: -1 })

        return allRecords.map((r: any) => {
          const record: any = {
            id: r._id,
            createdAt: r.createdAt,
            description: r.description,
            status: r.status,
            updatedAt: r.updatedAt,
            url: r.url,
            userId: r.userId,
            username: r.username
          }

          return record
        })
      } catch (error) {
        console.log('--------Query getRecords error', error)
        throw new Error(error)
      }
    },

    getRecord: async (_: any, { id }: any, context: any, info: any) => {
      try {
        const record: any = await RecordsDB.findOne({ _id: id, status: enums.Status.ACTIVE }, { noCursorTimeout: false } as any)

        const result: any = {
          id: record._id,
          createdAt: record.createdAt,
          description: record.description,
          status: record.status,
          updatedAt: record.updatedAt,
          url: record.url,
          userId: record.userId,
          username: record.username
        }

        return result
      } catch (error) {
        console.log('--------Query getRecord error', error)
        throw new Error(error)
      }
    }
  },

  Mutation: {
    registerUser: async (_: any, { input: {
      email,
      password,
      passwordConfirm,
      username
    } }: any, context: any, info: any) => {
      try {
        const { errors, valid } = validate.registerInput(email, password, passwordConfirm, username)

        if (!valid) {
          throw new Error(errors[Object.keys(errors)[0]])
        }

        const user:any = await UsersDB.findOne({ username: username }, { noCursorTimeout: false } as any)

        if (user) {
          throw new Error('This username already exists.')
        }

        const newUserObj:any = {
          createdAt: new Date().toISOString(),
          email: email,
          password: await bcrypt.hash(password),
          username: username
        }

        const insertId = await UsersDB.insertOne({
          _id: v4.generate(),
          ...newUserObj
        })

        const jwt = await create({ alg: 'HS512', typ: 'JWT' }, { _id: insertId }, appConfig.JWT_SECRET_KEY)
        
        const result:any = {
          id: insertId,
          ...newUserObj,
          authToken: jwt
        }

        return result
      } catch (error) {
        console.log('--------Mutation registerUser error', error)
        throw new Error(error)
      }
    },

    loginUser: async (_: any, { input: {
      password,
      username
    } }: any, context: any, info: any) => {
      try {
        const { errors, valid } = validate.loginInput(password, username)

        if (!valid) {
          throw new Error(errors[Object.keys(errors)[0]])
        }

        const user:any = await UsersDB.findOne({ username: username }, { noCursorTimeout: false } as any)

        if (!user) {
          throw new Error('This username does not exist.')
        }

        if (!await bcrypt.compare(password, user.password)) {
          throw new Error('Incorrect password for this username.')
        }

        const jwt = await create({ alg: 'HS512', typ: 'JWT' }, { _id: user.id }, appConfig.JWT_SECRET_KEY)

        const result: any = {
          id: user._id,
          ...user,
          authToken: jwt
        }
        
        return result
      } catch (error) {
        console.log('--------Mutation registerUser error', error)
        throw new Error(error)
      }
    },

    createRecord: async (_:any, { input: {
      authToken,
      description,
      url,
      userId,
      username
    } }:any, context:any, info:any) => {
      try {
        // const user = await checkAuthHeader(context)

        const user = await checkAuthToken(authToken)

        if (!url.includes('https://')) {
          throw new Error('Url is not https.')
        }

        const createRecordObj:any = {
          createdAt: new Date().toISOString(),
          description: description,
          status: enums.Status.ACTIVE,
          url: url,
          userId: userId,
          username: username
        }

        const insertId = await RecordsDB.insertOne({
          _id: v4.generate(),
          ...createRecordObj
        })

        const result:any = {
          id: insertId,
          ...createRecordObj
        }

        return result
      } catch (error) {
        console.log('--------Mutation createRecord error', error)
        throw new Error(error)
      }
    },

    updateRecord: async (_: any, { input: {
      id,
      authToken,
      description,
      url,
      userId
    } }:any, context:any, info:any) => {
      if (!v4.validate(id)) {
        throw new Error('Invalid id.')
      }

      try {
        // const user = await checkAuthHeader(context)

        const user = await checkAuthToken(authToken)

        const record:any = await RecordsDB.findOne({ _id: id }, { noCursorTimeout: false } as any)

        const recordByUserId = await RecordsDB.findOne({ userId: userId }, { noCursorTimeout: false } as any)

        if (!record || !recordByUserId) {
          throw new Error('Record not found.')
        } else if (record.userId !== userId) {
          throw new Error('This record is not associated with this user.')
        }
        
        const UpdateObj:any = {
          description: description,
          updatedAt: new Date().toISOString(),
          url: url
        }

        const { matchedCount, modifiedCount, upsertedId } = await RecordsDB.updateOne(
          { _id: id },
          { $set: UpdateObj },
        )

        const result:any = {
          id: id,
          ...UpdateObj
        }

        return result
      } catch (error) {
        console.log('--------Mutation updateRecord error', error)
        throw new Error(error)
      }
    },

    setRecordStatus: async (_:any, { input: {
      id,
      authToken,
      status,
      userId
    } }:any, context:any, info:any) => {
      if (!v4.validate(id)) {
        throw new Error('Invalid id.')
      }

      try {
        // const user = await checkAuthHeader(context)

        const user = await checkAuthToken(authToken)

        const record:any = await RecordsDB.findOne({ _id: id }, { noCursorTimeout: false } as any)

        const recordByUserId = await RecordsDB.findOne({ userId: userId }, { noCursorTimeout: false } as any)

        if (!record || !recordByUserId) {
          throw new Error('Record not found.')
        } else if (record.userId !== userId) {
          throw new Error('This record is not associated with this user.')
        }

        const UpdateObj:any = {
          status: status === enums.Status.ACTIVE ? enums.Status.DELETED : enums.Status.ACTIVE,
          updatedAt: new Date().toISOString()
        }

        const { matchedCount, modifiedCount, upsertedId } = await RecordsDB.updateOne(
          { _id: id },
          { $set: UpdateObj },
        )

        const result:any = {
          id: id,
          ...UpdateObj
        }

        return result
      } catch (error) {
        console.log('--------Mutation setRecordStatus error', error)
        throw new Error(error)
      }
    },

    // createComment: async (_:any, { input: {
    //   authToken,
    //   body,
    //   recordId,
    //   userId,
    //   username
    // } }:any, context:any, info:any) => {
    //   try {
    //     console.log('--------context', context)
    //     // const user = await checkAuthHeader(context)

    //     const user = await checkAuthToken(authToken)

    //     console.log('--------createComment user', user)

    //     if (body.trim() === '') {
    //       throw new Error('Please enter a comment.')
    //     }

    //     const record:any = await RecordsDB.findOne({ _id: recordId }, { noCursorTimeout: false } as any)

    //     if (!record) {
    //       throw new Error('Record not found.')
    //     }

    //     const { matchedCount, modifiedCount, upsertedId } = await RecordsDB.updateOne(
    //       { _id: recordId },
    //       { $set: {
    //         comments: record.comments?.length
    //         ? record.comments?.unshift({
    //           _id: v4.generate(),
    //           body: body,
    //           createdAt: new Date().toISOString(),
    //           recordId: recordId,
    //           status: enums.Status.ACTIVE,
    //           userId: userId,
    //           username: username
    //         })
    //         : [{
    //           _id: v4.generate(),
    //           body: body,
    //           createdAt: new Date().toISOString(),
    //           recordId: recordId,
    //           status: enums.Status.ACTIVE,
    //           userId: userId,
    //           username: username
    //         }]
    //       } },
    //     )

    //     console.log('--------createComment record', record)

    //     return record
    //   } catch (error) {
    //     console.log('--------Mutation createComment error', error)
    //     throw new Error(error)
    //   }
    // }

    // likeRecord: async (_:any, { input: {
    //   authToken,
    //   recordId,
    //   userId,
    //   username
    // } }:any, context:any, info:any) => {
    //   if (!v4.validate(recordId)) {
    //     throw new Error('Invalid id.')
    //   }

    //   try {
    //     // const user = await checkAuthHeader(context)

    //     const user = await checkAuthToken(authToken)

    //     console.log('--------updateRecord user', user)

    //     const record:any = await RecordsDB.findOne({ _id: recordId }, { noCursorTimeout: false } as any)

    //     if (!record) {
    //       throw new Error('Record not found.')
    //     }

    //     const UpdateObj:any = {
    //       status: status === enums.Status.ACTIVE ? enums.Status.DELETED : enums.Status.ACTIVE,
    //       updatedAt: new Date().toISOString()
    //     }

    //     const { matchedCount, modifiedCount, upsertedId } = await RecordsDB.updateOne(
    //       { _id: id },
    //       { $set: UpdateObj },
    //     )

    //     const result:any = {
    //       id: id,
    //       ...UpdateObj
    //     }

    //     console.log('--------setRecordStatus result', result)

    //     return result
    //   } catch (error) {
    //     console.log('--------Mutation setRecordStatus error', error)
    //     throw new Error(error)
    //   }
    // }
  }
}

export default resolvers
