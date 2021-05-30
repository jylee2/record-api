// import 'https://deno.land/x/dotenv@v2.0.0/load.ts'
import { load } from 'https://deno.land/x/mandatory_env@1.2/mod.ts'

load([
  'JWT_SECRET_KEY',
  'PORT',
  'LOCAL_FRONT_END_PORTS',
  'LOCAL_MONGODB_PORT',
  'MONGO_HOST',
  'MONGO_USERNAME',
  'MONGO_PASSWORD'
])

const PORT = (Deno.env.get('PORT') && Number(Deno.env.get('PORT')) === 8080) ? Number(Deno.env.get('PORT')) : Deno.env.get('PORT')

const appConfig:any = {
  JWT_SECRET_KEY: Deno.env.get('JWT_SECRET_KEY') || 'secret key to encode the token',
  FRONT_END_PORTS: Deno.env.get('LOCAL_FRONT_END_PORTS') || /^.+localhost:(3000|4200|8000)$/,
  SERVER_PORT: PORT || 8080,
  MONGODB_PORT: Deno.env.get('LOCAL_MONGODB_PORT') || 'mongodb://localhost:27017',
  MONGO_HOST: Deno.env.get('MONGO_HOST') || 'cluster0-shard-00-02.cwxbw.mongodb.net',
  MONGO_USERNAME: Deno.env.get('MONGO_USERNAME'),
  MONGO_PASSWORD:Deno.env.get('MONGO_PASSWORD')
}

export default appConfig