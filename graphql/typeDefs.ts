import { applyGraphQL, gql, GQLError } from '../dependencies.ts'

const typeDefs: any = gql`
  # type Comment {
  #   id: ID
  #   body: String
  #   createdAt: String
  #   recordId: String
  #   status: String
  #   updatedAt: String
  #   userId: String
  #   username: String
  # }

  # type Like {
  #   id: ID
  #   createdAt: String
  #   userId: String
  #   username: String
  # }

  type Record {
    id: ID
    # comments: [Comment]
    createdAt: String
    description: String
    # likes: [Like]
    status: String
    updatedAt: String
    url: String
    userId: String
    username: String
  }

  type User {
    id: ID
    authToken: String
    createdAt: String
    email: String
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
    authToken: String
    createdAt: String
    description: String
    status: String
    updatedAt: String
    url: String
    userId: String
    username: String
  }

  input UpdateRecordInput {
    id: ID
    authToken: String
    createdAt: String
    description: String
    url: String
    userId: String
  }

  input SetRecordStatus {
    id: ID
    authToken: String
    status: String
    updatedAt: String
    userId: String
  }

  # input CreateCommentInput {
  #   authToken: String
  #   body: String
  #   createdAt: String
  #   recordId: String
  #   userId: String
  #   username: String
  # }

  # input UpdateCommentInput {
  #   authToken: String
  #   commentId: String
  #   body: String
  #   recordId: String
  #   userId: String
  #   username: String
  # }

  # input SetCommentStatus {
  #   authToken: String
  #   commentId: String
  #   recordId: String
  #   status: String
  #   userId: String
  #   username: String
  # }

  # input LikeRecordInput {
  #   authToken: String
  #   recordId: String
  #   userId: String
  #   username: String
  # }

  type Query {
    getUsers: [User]
    getRecords: [Record]
    getRecord(id: ID): Record
  }

  type Mutation {
    registerUser(input: RegisterUserInput): User
    loginUser(input: LoginUserInput): User
    createRecord(input: CreateRecordInput): Record
    updateRecord(input: UpdateRecordInput): Record
    setRecordStatus(input: SetRecordStatus): Record
    # createComment(input: CreateCommentInput): Record
    # updateComment(input: UpdateCommentInput): Record
    # setCommentStatus(input: SetCommentStatus): Record
    # likeRecord(input: LikeRecordInput): Record
  }
`

export default typeDefs
