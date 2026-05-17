export const config = {
  port: process.env.PORT || 4000,
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "fintech",
    username: process.env.DB_USER || "fintech",
    password: process.env.DB_PASSWORD || "fintechpass"
  },
  jwtSecret: process.env.JWT_SECRET || "supersecretjwt",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "supersecretrefresh",
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://localhost:8000",
  yahooBaseUrl: process.env.YAHOO_FINANCE_BASE_URL || "https://query1.finance.yahoo.com",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini"
};
