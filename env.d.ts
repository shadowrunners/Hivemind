import { UserSession } from "@/utils/discord";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      BOT_TOKEN: string;
      DECRYPTION_KEY: string;
      CLIENT_ID: string;

      /**
       * The url where the frontend is hosted
       *
       * ex: `https://my-bot.vercel.app`, default: `http://localhost:3000`
       */
      WEB_URL?: string;

      PORT?: string;
    }
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    session: UserSession;
  }
}

export {};
