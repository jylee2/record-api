import { applyGraphQL, gql, GQLError } from 'https://deno.land/x/oak_graphql@0.6.2/mod.ts'

const typeDefs: any = gql`
  type User {
    id: ID
    authToken: String
    createdAt: String
    email: String
    username: String
  }

  type Record {
    id: ID
    createdAt: String
    description: String
    status: String
    updatedAt: String
    url: String
    username: String
  }

  input RegisterUserInput {
    email: String
    password: String
    passwordConfirm: String
    username: String
  }

  input LoginUserInput {
    password: String
    username: String
  }

  input CreateRecordInput {
    id: ID
    createdAt: String
    description: String
    status: String
    updatedAt: String
    url: String
    username: String
  }

  input UpdateRecordInput {
    id: ID
    createdAt: String
    description: String
    status: String
    updatedAt: String
    url: String
    username: String
  }

  type Query {
    getRecords: [Record]
    getRecord(id: ID): Record
  }

  type Mutation {
    registerUser(input: RegisterUserInput): User
    loginUser(input: LoginUserInput): User
    createRecord(input: CreateRecordInput): Record
    updateRecord(input: UpdateRecordInput): Record
    setRecordStatus(input: UpdateRecordInput): Record
  }
`

export default typeDefs
