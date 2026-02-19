// require('dotenv').config({path: './env'})
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB() //we have used async in db to connect
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port : ${process.env.PORT}`);
    });
  }) //now that it has connected, lets do .then() if successfull
  .catch((err) => {
    console.log("MONGODB CONNECTION FAILED !!!", err);
  });




  
/*
import express from "express"
const app = express()

( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("EXPRESS ERROR: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })
        
    } catch (error) {
        console.error("MONGODB CONNECTION ERROR: ", error)
    }
})()
*/
