const port = 3000;

import express from "express";
import logger from "morgan";
import {router as uiRouter} from "./routes/ui.js";
import {router as apiRouter} from "./routes/api.js";

const app = express();

app.use(logger(":date[iso] [:status] :method :url :response-time[0]ms"));
app.use(express.json());
app.use(express.static("./public"));
app.use("/", uiRouter)
app.use("/api", apiRouter);

app.listen(port, () => {
    console.log(`Server runnning at http://localhost:${port}/`);
})

