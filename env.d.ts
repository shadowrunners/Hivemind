declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      BOT_TOKEN: string;
      DECRYPTION_KEY: string;

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
export {};
