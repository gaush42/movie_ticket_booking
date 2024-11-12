const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config()

const ConnectDB = () =>{
    const mongoURL = process.env.MONGO_CONNECTION_URL
    if(!mongoURL){
        throw new Error('MONGO_CONNECTION_URL is not defined in .env')
    }
    mongoose.connect(mongoURL,{
    }).then(()=>{
        console.log('Database Connected 🥳🥳🥳🥳')
    }).catch((err)=>{
        console.log('Connection failed ☹️☹️☹️☹️', err)
    })
}
module.exports = ConnectDB