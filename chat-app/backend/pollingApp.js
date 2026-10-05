import dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

import { app } from "./expressApp.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Polling app listening on port ${PORT}`);
});
