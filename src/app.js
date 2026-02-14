import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//we will receive from DATA from a lot of resources : url, json, body, form
// like limit number of json, so no crash
//preparation of it
//middleware configure karna hai so we use "use"

app.use(express.json({limit:"16kb"})) 
app.use(express.urlencoded({extended: true, limit:"16kb"}))
app.use(express.static("public")) //static -> i wish to store images, pdf on my server only
//so we create this static public folder
app.use(cookieParser())

//routes
import userRouter from './routes/user.routes.js'

//routes declaration
//app.get( se kaam ho raha tha, as in basic app we were writing rouetes and controllers in here only)
//ab routes ko separate kar diya hai, middleware use karna hoga // app.use()

app.use("/api/v1/users", userRouter) //jaise hi user ayega, control chala jayega userRouter pe

//http://localhost:8000/api/v1/users/register
export { app }