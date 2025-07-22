const mongoose = require('mongoose')
const dotenv = require('dotenv')
const {errorLogger, infoLogger} = require('../utils/logger')

dotenv.config()

const ConnectDB = () => {
    const mongoURL = process.env.MONGO_CONNECTION_URLDEV
    if(!mongoURL){
        throw new Error('MONGO_CONNECTION_URL is not defined in .env')
    }
    mongoose.connect(mongoURL,{
    }).then(()=>{
        infoLogger.info('Database Connected 🥳🥳🥳🥳')
    }).catch((err)=>{
        errorLogger.error('Connection failed ☹️☹️☹️☹️', err)
    })
}
module.exports = ConnectDB