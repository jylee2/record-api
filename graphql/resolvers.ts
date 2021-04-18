import { applyGraphQL, gql, GQLError } from 'https://deno.land/x/oak_graphql@0.6.2/mod.ts'
import { Bson, MongoClient } from 'https://deno.land/x/mongo@v0.22.0/mod.ts'
import { v4 } from 'https://deno.land/std@0.92.0/uuid/mod.ts'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.2.4/mod.ts'
import { create, verify } from 'https://deno.land/x/djwt@v2.2/mod.ts'

import config from '../config.ts'
import validate from '../utils/validate.ts'
import checkAuth from '../utils/checkAuth.ts'

const client = new MongoClient()
await client.connect('mongodb://localhost:27017')

const db = client.database('test-record')
const RecordsDB = db.collection('records')
const UsersDB = db.collection('users')

const enums:any = {
  Status: {
    ACTIVE: 'active',
    DELETED: 'deleted'
  }
}

const resolvers = {
  Query: {
    getRecords: async () => {
      try {
        const allRecords = await RecordsDB.find({ status: enums.Status.ACTIVE })

        return allRecords.map((r: any) => {
          const record: any = {
            id: r._id,
            createdAt: r.createdAt,
            description: r.description,
            status: r.status,
            updatedAt: r.updatedAt,
            url: r.url,
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
        const record: any = await RecordsDB.findOne({ _id: id, status: enums.Status.ACTIVE })

        const result: any = {
          id: record._id,
          createdAt: record.createdAt,
          description: record.description,
          status: record.status,
          updatedAt: record.updatedAt,
          url: record.url,
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
    registerUser: async (_: any, { input: { email, password, passwordConfirm, username } }: any, context: any, info: any) => {
      try {
        const { errors, valid } = validate.registerInput(email, password, passwordConfirm, username)

        if (!valid) {
          throw new GQLError(errors[Object.keys(errors)[0]])
        }

        const user:any = await UsersDB.findOne({ username: username })

        if (user) {
          throw new GQLError('This username already exists.')
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

        const jwt = await create({ alg: 'HS512', typ: 'JWT' }, { _id: insertId }, config.JWT_SECRET_KEY)
        
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

    loginUser: async (_: any, { input: { password, username } }: any, context: any, info: any) => {
      try {
        const { errors, valid } = validate.loginInput(password, username)

        if (!valid) {
          throw new GQLError(errors[Object.keys(errors)[0]])
        }

        const user:any = await UsersDB.findOne({ username: username })

        if (!user) {
          throw new GQLError('This username does not exist.')
        }

        if (!await bcrypt.compare(password, user.password)) {
          throw new GQLError('Incorrect password for this username.')
        }

        const jwt = await create({ alg: 'HS512', typ: 'JWT' }, { _id: user.id }, config.JWT_SECRET_KEY)

        const result: any = {
          id: user._id,
          ...user,
          authToken: jwt
        }
        
        console.log('--------loginUser result', result)

        return result
      } catch (error) {
        console.log('--------Mutation registerUser error', error)
        throw new Error(error)
      }
    },

    createRecord: async (_:any, { input: { description, url, username } }:any, context:any, info:any) => {
      try {
        const user = await checkAuth(context)

        console.log('--------createRecord user', user)

        const createRecordObj:any = {
          createdAt: new Date().toISOString(),
          description: description,
          status: enums.Status.ACTIVE,
          url: url,
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

        console.log('--------createRecord result', result)

        return result
      } catch (error) {
        console.log('--------Mutation createRecord error', error)
        throw new Error(error)
      }
    },

    updateRecord: async (_: any, { input: { id, description, url } }:any, context:any, info:any) => {
      if (!v4.validate(id)) {
        throw new Error('Invalid id.')
      }

      try {
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

        console.log('--------updateRecord result', result)

        return result
      } catch (error) {
        console.log('--------Mutation updateRecord error', error)
        throw new Error(error)
      }
    },

    setRecordStatus: async (_:any, { input: {id, status} }:any, context:any, info:any) => {
      if (!v4.validate(id)) {
        throw new Error('The provided id is invalid.')
      }

      try {
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

        console.log('--------setRecordStatus result', result)

        return result
      } catch (error) {
        console.log('--------Mutation setRecordStatus error', error)
        throw new Error(error)
      }
    }
  }
}

export default resolvers
